from __future__ import annotations

from hashlib import sha256
from urllib.parse import urlsplit
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from sqlmodel import Session, select

from app.auth import CurrentUserId
from app.database import get_session
from app.models.job import Job as JobModel
from app.models.job import utc_now as job_utc_now
from app.models.report import Report as ReportModel
from app.schemas.common import JobStatus, RiskLevel, ScanSource
from app.schemas.job import CategoryScores, Finding, JobRead
from app.schemas.scan import ScanResponse, ScanTextRequest, ScanUrlRequest
from app.services.extractor import ExtractionError, ExtractedJobPosting, extract_job_posting
from app.services.scanner import ScanResult, scan_job_posting
from app.services.url_security import (
    FetchError,
    InvalidURLError,
    ResponseTooLargeError,
    UnsupportedContentTypeError,
    UnsafeDestinationError,
    fetch_safe_html,
    normalize_url,
    validate_url,
)

router = APIRouter(
    prefix="/scan",
    tags=["Scans"],
)


def _http_error(status_code: int, code: str, message: str) -> HTTPException:
    return HTTPException(
        status_code=status_code,
        detail={"code": code, "message": message},
    )


def _category_scores(result: ScanResult) -> CategoryScores:
    return CategoryScores(
        phishing=result.category_scores.phishing,
        scam=result.category_scores.scam,
        fake_recruiter=result.category_scores.fake_recruiter,
        ghost=result.category_scores.ghost_posting,
    )


def _findings(result: ScanResult, report_id: UUID) -> list[Finding]:
    return [
        Finding(
            id=f"{report_id}:{index}",
            category=finding.category,
            severity=finding.severity,
            title=finding.title,
            evidence=finding.evidence,
            description=finding.description,
            recommendation=finding.recommendation,
            points=finding.points,
        )
        for index, finding in enumerate(result.findings, start=1)
    ]


def _manual_source_key(request: ScanTextRequest) -> tuple[str, str, str]:
    if request.source_url is not None:
        source_url = str(request.source_url)
        try:
            normalized_url = normalize_url(source_url)
        except InvalidURLError as error:
            raise _http_error(400, "invalid_url", "The source URL is invalid") from error
        source_site = request.source_site or (urlsplit(normalized_url).hostname or "Pasted text")
        return source_url, normalized_url, source_site

    fingerprint = "\n".join(
        value.strip().lower()
        for value in (request.title, request.company, request.description, request.source_site)
        if isinstance(value, str) and value.strip()
    )
    digest = sha256(fingerprint.encode("utf-8")).hexdigest()
    source_url = f"manual://{digest}"
    return source_url, source_url, request.source_site or "Pasted text"


def _scan(
    *,
    title: str | None,
    company: str | None,
    description: str,
    source_url: str,
    source_site: str,
) -> ScanResult:
    try:
        return scan_job_posting(
            title=title,
            company=company,
            description=description,
            source_url=source_url,
            source_site=source_site,
        )
    except Exception as error:
        raise _http_error(500, "scan_failed", "The posting could not be scanned") from error


def _upsert_job_and_create_report(
    *,
    session: Session,
    current_user_id: UUID,
    title: str | None,
    company: str | None,
    location: str | None,
    source_url: str,
    normalized_source_url: str,
    source_site: str,
    result: ScanResult,
) -> tuple[JobModel, ReportModel, CategoryScores, list[Finding]]:
    try:
        statement = select(JobModel).where(
            JobModel.user_id == current_user_id,
            JobModel.normalized_source_url == normalized_source_url,
        )
        job = session.exec(statement).first()

        if job is None:
            job = JobModel(
                user_id=current_user_id,
                company=company or "Unknown company",
                title=title or "Untitled posting",
                platform=source_site,
                source_url=source_url,
                normalized_source_url=normalized_source_url,
                location=location,
                status=JobStatus.saved.value,
            )
            session.add(job)
            session.flush()
        else:
            if title:
                job.title = title
            if company:
                job.company = company
            if location:
                job.location = location
            if source_site:
                job.platform = source_site
            job.source_url = source_url
            job.normalized_source_url = normalized_source_url
            job.updated_at = job_utc_now()
            session.add(job)

        report_id = uuid4()
        categories = _category_scores(result)
        findings = _findings(result, report_id)
        report = ReportModel(
            id=report_id,
            user_id=current_user_id,
            job_id=job.id,
            risk_level=result.risk_level,
            overall_score=result.overall_score,
            top_finding=result.top_finding.title if result.top_finding else None,
            categories=categories.model_dump(mode="json", by_alias=True),
            findings=[
                finding.model_dump(mode="json", by_alias=True)
                for finding in findings
            ],
        )
        session.add(report)
        session.commit()
        session.refresh(job)
        session.refresh(report)
        return job, report, categories, findings
    except SQLAlchemyError as error:
        session.rollback()
        raise _http_error(500, "database_error", "The scan could not be saved") from error


def _response(
    *,
    source: ScanSource,
    job: JobModel,
    report: ReportModel,
    categories: CategoryScores,
    findings: list[Finding],
) -> ScanResponse:
    return ScanResponse(
        source=source,
        job=JobRead(
            id=job.id,
            company=job.company,
            title=job.title,
            platform=job.platform,
            date=(job.date_applied or job.created_at.date()).isoformat(),
            risk_level=report.risk_level,
            status=job.status,
            source_url=job.source_url,
            location=job.location,
            overall_score=report.overall_score,
            scan_date=report.scan_date,
            date_applied=job.date_applied,
            top_finding=report.top_finding,
            categories=categories,
            findings=findings,
        ),
        report_id=report.id,
        overall_score=report.overall_score,
        risk_level=report.risk_level,
        category_scores=categories,
        top_finding=report.top_finding,
        findings=findings,
    )


@router.post("/url", response_model=ScanResponse, status_code=status.HTTP_201_CREATED)
def scan_url(
    request: ScanUrlRequest,
    current_user_id: CurrentUserId,
    session: Session = Depends(get_session),
) -> ScanResponse:
    source_url = str(request.url)
    try:
        validate_url(source_url)
        normalized_url = normalize_url(source_url)
        html = fetch_safe_html(normalized_url)
    except (InvalidURLError, UnsafeDestinationError) as error:
        raise _http_error(400, "unsafe_url", "The URL is invalid or unsafe") from error
    except UnsupportedContentTypeError as error:
        raise _http_error(415, "unsupported_content", "The URL did not return HTML or text") from error
    except ResponseTooLargeError as error:
        raise _http_error(413, "response_too_large", "The page is too large to scan") from error
    except FetchError as error:
        raise _http_error(502, "fetch_failed", "The page could not be retrieved") from error

    try:
        posting: ExtractedJobPosting = extract_job_posting(html, normalized_url)
    except ExtractionError as error:
        raise HTTPException(
            status_code=422,
            detail={
                "code": "extraction_failed",
                "message": "The posting could not be extracted automatically",
                "manualEntryRequired": True,
            },
        ) from error

    result = _scan(
        title=posting.title,
        company=posting.company,
        description=posting.description,
        source_url=posting.source_url,
        source_site=posting.source_site,
    )
    job, report, categories, findings = _upsert_job_and_create_report(
        session=session,
        current_user_id=current_user_id,
        title=posting.title,
        company=posting.company,
        location=posting.location,
        source_url=posting.source_url,
        normalized_source_url=normalized_url,
        source_site=posting.source_site,
        result=result,
    )
    return _response(
        source=ScanSource.url,
        job=job,
        report=report,
        categories=categories,
        findings=findings,
    )


@router.post("/text", response_model=ScanResponse, status_code=status.HTTP_201_CREATED)
def scan_text(
    request: ScanTextRequest,
    current_user_id: CurrentUserId,
    session: Session = Depends(get_session),
) -> ScanResponse:
    source_url, normalized_url, source_site = _manual_source_key(request)
    result = _scan(
        title=request.title,
        company=request.company,
        description=request.description,
        source_url=source_url,
        source_site=source_site,
    )
    job, report, categories, findings = _upsert_job_and_create_report(
        session=session,
        current_user_id=current_user_id,
        title=request.title,
        company=request.company,
        location=request.location,
        source_url=source_url,
        normalized_source_url=normalized_url,
        source_site=source_site,
        result=result,
    )
    return _response(
        source=ScanSource.text,
        job=job,
        report=report,
        categories=categories,
        findings=findings,
    )
