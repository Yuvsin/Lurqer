import json
import unittest

from app.services.extractor import extract_job_posting
from app.services.url_security import normalize_url


DESCRIPTION = (
    "Work with the engineering team to build reliable software, review code, "
    "document technical decisions, and improve production systems. "
) * 2


def _linkedin_html(
    page_title: str,
    json_ld: dict | None = None,
    metadata_title: str | None = None,
) -> str:
    structured_data = ""
    if json_ld is not None:
        structured_data = (
            '<script type="application/ld+json">'
            f"{json.dumps(json_ld)}"
            "</script>"
        )
    metadata = (
        f'<meta property="og:title" content="{metadata_title}">'
        if metadata_title is not None
        else ""
    )
    return (
        "<html><head>"
        f"<title>{page_title}</title>{metadata}{structured_data}"
        "</head><body>"
        f'<div class="description__text">{DESCRIPTION}</div>'
        "</body></html>"
    )


class LinkedInExtractionTests(unittest.TestCase):
    def test_collection_url_normalizes_to_job_view_url(self) -> None:
        normalized = normalize_url(
            "https://www.linkedin.com/jobs/collections/recommended/"
            "?currentJobId=4261234567&origin=JOBS_HOME_PAGE"
        )

        self.assertEqual(
            normalized,
            "https://www.linkedin.com/jobs/view/4261234567",
        )

    def test_page_title_extracts_company(self) -> None:
        posting = extract_job_posting(
            _linkedin_html(
                "Xsolla hiring AI-First Engineering Intern in Los Angeles, CA | LinkedIn"
            ),
            "https://www.linkedin.com/jobs/view/4261234567",
        )

        self.assertEqual(posting.company, "Xsolla")

    def test_page_title_cleans_job_title(self) -> None:
        posting = extract_job_posting(
            _linkedin_html(
                "Xsolla hiring AI-First Engineering Intern in Los Angeles, CA | LinkedIn"
            ),
            "https://www.linkedin.com/jobs/view/4261234567",
        )

        self.assertEqual(posting.title, "AI-First Engineering Intern")
        self.assertEqual(posting.location, "Los Angeles, CA")

    def test_json_ld_takes_priority_over_linkedin_title_fallback(self) -> None:
        posting = extract_job_posting(
            _linkedin_html(
                "Fallback Corp hiring Fallback Role in Remote | LinkedIn",
                {
                    "@type": "JobPosting",
                    "title": "Structured Security Engineer",
                    "hiringOrganization": {"name": "Structured Corp"},
                    "description": f"<p>{DESCRIPTION}</p>",
                },
            ),
            "https://www.linkedin.com/jobs/view/4261234567",
        )

        self.assertEqual(posting.company, "Structured Corp")
        self.assertEqual(posting.title, "Structured Security Engineer")
        self.assertEqual(posting.extraction_method, "json_ld")

    def test_malformed_linkedin_title_remains_unresolved(self) -> None:
        posting = extract_job_posting(
            _linkedin_html(
                "Xsolla hiring AI-First Engineering Intern | LinkedIn",
                metadata_title="Xsolla hiring AI-First Engineering Intern | LinkedIn",
            ),
            "https://www.linkedin.com/jobs/view/4261234567",
        )

        self.assertIsNone(posting.company)
        self.assertIsNone(posting.title)


if __name__ == "__main__":
    unittest.main()
