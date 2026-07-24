import json
import unittest
from unittest.mock import patch
from uuid import UUID, uuid4

from fastapi.security import HTTPAuthorizationCredentials
from fastapi.testclient import TestClient
from sqlalchemy import event
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.pool import StaticPool
from sqlmodel import SQLModel, Session, create_engine, select

from app.auth import get_current_user_id
from app.database import get_session
from app.main import app
from app.models.job import Job
from app.models.report import Report
from app.services.extractor import extract_job_posting
from app.services.scanner import scan_job_posting
from app.services.url_security import UnsafeDestinationError, validate_url


@compiles(JSONB, "sqlite")
def _compile_jsonb_for_sqlite(type_, compiler, **kwargs):
    return "JSON"


LEGITIMATE_DESCRIPTION = (
    "Build secure production systems, review controls, investigate alerts, "
    "and document findings with the engineering team. "
) * 3

SCAM_DESCRIPTION = (
    "Contact us on Telegram for your interview. We will send a company check "
    "for mobile deposit so you can purchase a laptop and other equipment."
)

SHORT_LINKEDIN_METADATA = " ".join(["brief"] * 21) + ("x" * 29)


def _short_linkedin_metadata_html() -> str:
    return (
        "<html><head>"
        '<meta property="og:title" content="Call Center Representative">'
        '<meta name="company" content="Radiant Systems Inc">'
        '<meta name="job-location" content="Remote">'
        f'<meta name="description" content="{SHORT_LINKEDIN_METADATA}">'
        "</head><body></body></html>"
    )


def _job_html(description: str) -> str:
    posting = {
        "@type": "JobPosting",
        "title": "Security Engineer",
        "hiringOrganization": {"name": "Example Corp"},
        "jobLocation": {"address": {"addressLocality": "New York"}},
        "description": f"<p>{description}</p>",
    }
    return (
        '<html><head><script type="application/ld+json">'
        f"{json.dumps(posting)}"
        "</script></head></html>"
    )


class BackendSteps16To21Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )

        @event.listens_for(cls.engine, "connect")
        def _enable_foreign_keys(dbapi_connection, connection_record):
            dbapi_connection.execute("PRAGMA foreign_keys=ON")

        cls.client = TestClient(app)

    def setUp(self) -> None:
        SQLModel.metadata.drop_all(self.engine)
        SQLModel.metadata.create_all(self.engine)
        self.current_user_id = uuid4()

        def override_user() -> UUID:
            return self.current_user_id

        def override_session():
            with Session(self.engine) as session:
                yield session

        app.dependency_overrides[get_current_user_id] = override_user
        app.dependency_overrides[get_session] = override_session

    def tearDown(self) -> None:
        app.dependency_overrides.clear()

    def test_application_services_and_unsafe_url(self) -> None:
        schema = app.openapi()
        self.assertIn("/scan/url", schema["paths"])
        self.assertIn("/jobs/{job_id}", schema["paths"])
        self.assertIn("/reports/{report_id}", schema["paths"])

        legitimate = scan_job_posting(
            title="Security Engineer",
            company="Example Corp",
            description=LEGITIMATE_DESCRIPTION,
        )
        scam = scan_job_posting(
            company="Example Corp",
            description=SCAM_DESCRIPTION,
        )
        self.assertEqual(legitimate.risk_level, "Low")
        self.assertEqual(legitimate.findings, [])
        self.assertTrue(scam.findings)
        self.assertTrue(0 <= scam.overall_score <= 100)
        self.assertTrue(
            all(
                0 <= score <= 100
                for score in (
                    scam.category_scores.phishing,
                    scam.category_scores.scam,
                    scam.category_scores.fake_recruiter,
                    scam.category_scores.ghost_posting,
                )
            )
        )

        posting = extract_job_posting(
            _job_html(LEGITIMATE_DESCRIPTION),
            "https://example.com/jobs/123",
        )
        self.assertEqual(posting.title, "Security Engineer")
        self.assertEqual(posting.company, "Example Corp")
        self.assertEqual(posting.extraction_method, "json_ld")

        with self.assertRaises(UnsafeDestinationError):
            validate_url("http://127.0.0.1/internal")

    @patch("app.routers.scans.validate_url", return_value=None)
    @patch("app.routers.scans.fetch_safe_html")
    def test_url_scan_rescan_latest_summary_and_history(
        self,
        fetch_safe_html,
        validate_url_mock,
    ) -> None:
        fetch_safe_html.side_effect = [
            _job_html(LEGITIMATE_DESCRIPTION),
            _job_html(SCAM_DESCRIPTION),
        ]
        first = self.client.post(
            "/scan/url",
            json={"url": "https://example.com/jobs/123?utm_source=test"},
        )
        second = self.client.post(
            "/scan/url",
            json={"url": "https://example.com/jobs/123"},
        )
        self.assertEqual(first.status_code, 201, first.text)
        self.assertEqual(second.status_code, 201, second.text)
        self.assertEqual(first.json()["job"]["id"], second.json()["job"]["id"])
        self.assertNotEqual(first.json()["reportId"], second.json()["reportId"])

        with Session(self.engine) as session:
            jobs = session.exec(select(Job)).all()
            reports = session.exec(select(Report)).all()
            self.assertEqual(len(jobs), 1)
            self.assertEqual(len(reports), 2)
            self.assertTrue(all(report.user_id == self.current_user_id for report in reports))

        jobs_response = self.client.get("/jobs")
        self.assertEqual(jobs_response.status_code, 200)
        self.assertEqual(len(jobs_response.json()), 1)
        self.assertEqual(
            jobs_response.json()[0]["overallScore"],
            second.json()["overallScore"],
        )

        history = self.client.get(f'/jobs/{first.json()["job"]["id"]}/reports')
        self.assertEqual(history.status_code, 200)
        self.assertEqual(len(history.json()), 2)
        self.assertEqual(history.json()[0]["id"], second.json()["reportId"])

    @patch("app.routers.scans._scan")
    @patch("app.routers.scans.fetch_safe_html")
    @patch("app.routers.scans.validate_url", return_value=None)
    def test_incomplete_linkedin_metadata_stops_before_scan_and_persistence(
        self,
        validate_url_mock,
        fetch_safe_html,
        scan_mock,
    ) -> None:
        fetch_safe_html.return_value = _short_linkedin_metadata_html()

        response = self.client.post(
            "/scan/url",
            json={"url": "https://www.linkedin.com/jobs/view/4261234567"},
        )

        self.assertEqual(response.status_code, 422, response.text)
        self.assertEqual(response.json()["detail"]["code"], "extraction_failed")
        self.assertTrue(response.json()["detail"]["manualEntryRequired"])
        self.assertEqual(
            response.json()["detail"]["message"],
            "LinkedIn did not provide enough posting content for an accurate scan. "
            "Paste the job description to continue.",
        )
        scan_mock.assert_not_called()
        with Session(self.engine) as session:
            self.assertEqual(len(session.exec(select(Job)).all()), 0)
            self.assertEqual(len(session.exec(select(Report)).all()), 0)

    @patch("app.routers.scans.fetch_safe_html")
    def test_text_scans_do_not_fetch_and_do_not_merge_unrelated_posts(
        self,
        fetch_safe_html,
    ) -> None:
        first = self.client.post(
            "/scan/text",
            json={
                "title": "Security Analyst",
                "company": "First Corp",
                "description": LEGITIMATE_DESCRIPTION,
            },
        )
        second = self.client.post(
            "/scan/text",
            json={
                "title": "Cloud Engineer",
                "company": "Second Corp",
                "description": LEGITIMATE_DESCRIPTION + " Maintain cloud infrastructure.",
            },
        )
        self.assertEqual(first.status_code, 201, first.text)
        self.assertEqual(second.status_code, 201, second.text)
        self.assertNotEqual(first.json()["job"]["id"], second.json()["job"]["id"])
        fetch_safe_html.assert_not_called()

        with Session(self.engine) as session:
            self.assertEqual(len(session.exec(select(Job)).all()), 2)
            self.assertEqual(len(session.exec(select(Report)).all()), 2)

    def test_cross_user_access_is_hidden_and_delete_cascades(self) -> None:
        created = self.client.post(
            "/scan/text",
            json={
                "title": "Security Analyst",
                "company": "Owner Corp",
                "description": LEGITIMATE_DESCRIPTION,
            },
        )
        self.assertEqual(created.status_code, 201, created.text)
        job_id = created.json()["job"]["id"]
        report_id = created.json()["reportId"]
        owner_id = self.current_user_id

        self.current_user_id = uuid4()
        self.assertEqual(self.client.get(f"/jobs/{job_id}").status_code, 404)
        self.assertEqual(
            self.client.patch(f"/jobs/{job_id}", json={"status": "Applied"}).status_code,
            404,
        )
        self.assertEqual(self.client.delete(f"/jobs/{job_id}").status_code, 404)
        self.assertEqual(self.client.get(f"/reports/{report_id}").status_code, 404)
        self.assertEqual(self.client.get(f"/jobs/{job_id}/reports").status_code, 404)

        self.current_user_id = owner_id
        self.assertEqual(self.client.delete(f"/jobs/{job_id}").status_code, 204)
        with Session(self.engine) as session:
            self.assertEqual(len(session.exec(select(Job)).all()), 0)
            self.assertEqual(len(session.exec(select(Report)).all()), 0)

    def test_posting_history_is_user_scoped_and_counts_distinct_jobs(self) -> None:
        payload = {
            "title": "Security Analyst",
            "company": "History Corp",
            "location": "Remote",
            "description": LEGITIMATE_DESCRIPTION,
            "sourceUrl": "https://history.example/jobs/security-1",
        }
        first = self.client.post("/scan/text", json=payload)
        repeat = self.client.post("/scan/text", json=payload)
        second = self.client.post(
            "/scan/text",
            json={**payload, "sourceUrl": "https://history.example/jobs/security-2"},
        )
        self.assertEqual(first.status_code, 201, first.text)
        self.assertEqual(repeat.json()["postingContext"]["repeatCount"], 1)
        self.assertEqual(second.json()["postingContext"]["repeatCount"], 2)
        self.assertTrue(second.json()["postingContext"]["possibleReposting"])

        self.current_user_id = uuid4()
        other_user = self.client.post("/scan/text", json=payload)
        self.assertEqual(other_user.status_code, 201, other_user.text)
        self.assertEqual(other_user.json()["postingContext"]["repeatCount"], 1)
        self.assertFalse(other_user.json()["postingContext"]["possibleReposting"])

    @patch("app.auth.supabase.auth.get_claims")
    def test_auth_claims_require_project_issuer_and_audience(self, get_claims) -> None:
        app.dependency_overrides.clear()
        user_id = uuid4()
        credentials = HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials="test-token",
        )
        from app import auth

        get_claims.return_value = {
            "claims": {
                "sub": str(user_id),
                "iss": f"{auth.SUPABASE_URL.rstrip('/')}/auth/v1",
                "aud": "authenticated",
            }
        }
        self.assertEqual(get_current_user_id(credentials), user_id)

        get_claims.return_value["claims"]["iss"] = "https://untrusted.example/auth/v1"
        with self.assertRaisesRegex(Exception, "401"):
            get_current_user_id(credentials)


if __name__ == "__main__":
    unittest.main()
