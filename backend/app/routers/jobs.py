from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlmodel import Session, select

from app.auth import CurrentUserId
from app.database import get_session
from app.models.job import Job as JobModel
from app.models.job import utc_now
from app.models.report import Report as ReportModel
from app.schemas.common import RiskLevel
from app.schemas.job import CategoryScores, Finding, Job as JobRead, JobUpdate
from app.services.url_security import InvalidURLError, normalize_url

router = APIRouter(
    prefix="/jobs",
    tags=["Jobs"],
)


def _to_job_read(job: JobModel, report: ReportModel | None = None) -> JobRead:
    display_date = job.date_applied or job.created_at.date()
    categories = (
        CategoryScores.model_validate(report.categories)
        if report is not None
        else None
    )
    findings = (
        [Finding.model_validate(finding) for finding in report.findings]
        if report is not None
        else None
    )
    return JobRead(
        id=job.id,
        company=job.company,
        title=job.title,
        platform=job.platform,
        date=display_date.isoformat(),
        risk_level=report.risk_level if report else RiskLevel.low,
        status=job.status,
        source_url=job.source_url,
        location=job.location,
        overall_score=report.overall_score if report else None,
        scan_date=report.scan_date if report else None,
        date_applied=job.date_applied,
        top_finding=report.top_finding if report else None,
        categories=categories,
        findings=findings,
    )


def _parse_job_id(job_id: str) -> UUID:
    try:
        return UUID(job_id)
    except ValueError as error:
        raise HTTPException(status_code=404, detail="Job not found") from error


def _get_owned_job(
    job_id: str,
    current_user_id: UUID,
    session: Session,
) -> JobModel:
    statement = select(JobModel).where(
        JobModel.id == _parse_job_id(job_id),
        JobModel.user_id == current_user_id,
    )
    job = session.exec(statement).first()
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


def _latest_reports(
    jobs: list[JobModel],
    current_user_id: UUID,
    session: Session,
) -> dict[UUID, ReportModel]:
    if not jobs:
        return {}
    statement = (
        select(ReportModel)
        .where(
            ReportModel.user_id == current_user_id,
            ReportModel.job_id.in_([job.id for job in jobs]),
        )
        .order_by(ReportModel.scan_date.desc(), ReportModel.id.desc())
    )
    latest: dict[UUID, ReportModel] = {}
    for report in session.exec(statement).all():
        latest.setdefault(report.job_id, report)
    return latest


def _sort_time(job: JobModel, report: ReportModel | None) -> float:
    timestamp = report.scan_date if report is not None else job.updated_at
    return timestamp.timestamp()


@router.get("", response_model=list[JobRead])
def get_jobs(
    current_user_id: CurrentUserId,
    session: Session = Depends(get_session),
) -> list[JobRead]:
    jobs = list(
        session.exec(
            select(JobModel).where(JobModel.user_id == current_user_id)
        ).all()
    )
    latest = _latest_reports(jobs, current_user_id, session)
    jobs.sort(
        key=lambda job: (_sort_time(job, latest.get(job.id)), str(job.id)),
        reverse=True,
    )
    return [_to_job_read(job, latest.get(job.id)) for job in jobs]


@router.get("/{job_id}", response_model=JobRead)
def get_job_by_id(
    job_id: str,
    current_user_id: CurrentUserId,
    session: Session = Depends(get_session),
) -> JobRead:
    job = _get_owned_job(job_id, current_user_id, session)
    report = _latest_reports([job], current_user_id, session).get(job.id)
    return _to_job_read(job, report)


@router.patch("/{job_id}", response_model=JobRead)
def update_job(
    job_id: str,
    updated_job: JobUpdate,
    current_user_id: CurrentUserId,
    session: Session = Depends(get_session),
) -> JobRead:
    job = _get_owned_job(job_id, current_user_id, session)
    updates = updated_job.model_dump(exclude_unset=True)
    non_nullable = {"company", "title", "platform", "source_url", "status"}
    if any(updates.get(field) is None for field in non_nullable & updates.keys()):
        raise HTTPException(status_code=422, detail="Required job fields cannot be null")

    if "source_url" in updates:
        try:
            updates["normalized_source_url"] = normalize_url(updates["source_url"])
        except InvalidURLError as error:
            raise HTTPException(status_code=422, detail="Source URL is invalid") from error

    for field, value in updates.items():
        setattr(job, field, value)
    job.updated_at = utc_now()

    try:
        session.add(job)
        session.commit()
        session.refresh(job)
    except IntegrityError as error:
        session.rollback()
        raise HTTPException(
            status_code=409,
            detail="A job with this source URL already exists",
        ) from error
    except SQLAlchemyError as error:
        session.rollback()
        raise HTTPException(status_code=500, detail="Job could not be updated") from error

    report = _latest_reports([job], current_user_id, session).get(job.id)
    return _to_job_read(job, report)


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job(
    job_id: str,
    current_user_id: CurrentUserId,
    session: Session = Depends(get_session),
) -> Response:
    job = _get_owned_job(job_id, current_user_id, session)
    try:
        session.delete(job)
        session.commit()
    except SQLAlchemyError as error:
        session.rollback()
        raise HTTPException(status_code=500, detail="Job could not be deleted") from error
    return Response(status_code=status.HTTP_204_NO_CONTENT)
