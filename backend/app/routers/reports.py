from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.auth import CurrentUserId
from app.database import get_session
from app.models.job import Job as JobModel
from app.models.report import Report as ReportModel
from app.schemas.report import Report as ReportRead

router = APIRouter()
reports_router = APIRouter(
    prefix="/reports",
    tags=["Reports"],
)
job_reports_router = APIRouter(
    prefix="/jobs",
    tags=["Reports"],
)


def _parse_id(value: str, detail: str) -> UUID:
    try:
        return UUID(value)
    except ValueError as error:
        raise HTTPException(status_code=404, detail=detail) from error


def _to_report_read(report: ReportModel) -> ReportRead:
    return ReportRead.model_validate(report)


@reports_router.get("", response_model=list[ReportRead])
def get_reports(
    current_user_id: CurrentUserId,
    session: Session = Depends(get_session),
) -> list[ReportRead]:
    statement = (
        select(ReportModel)
        .where(ReportModel.user_id == current_user_id)
        .order_by(ReportModel.scan_date.desc())
    )
    reports = session.exec(statement).all()
    return [_to_report_read(report) for report in reports]


@reports_router.get("/{report_id}", response_model=ReportRead)
def get_report_by_id(
    report_id: str,
    current_user_id: CurrentUserId,
    session: Session = Depends(get_session),
) -> ReportRead:
    statement = select(ReportModel).where(
        ReportModel.id == _parse_id(report_id, "Report not found"),
        ReportModel.user_id == current_user_id,
    )
    report = session.exec(statement).first()
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    return _to_report_read(report)


@job_reports_router.get("/{job_id}/reports", response_model=list[ReportRead])
def get_reports_for_job(
    job_id: str,
    current_user_id: CurrentUserId,
    session: Session = Depends(get_session),
) -> list[ReportRead]:
    parsed_job_id = _parse_id(job_id, "Job not found")
    job_statement = select(JobModel).where(
        JobModel.id == parsed_job_id,
        JobModel.user_id == current_user_id,
    )
    if session.exec(job_statement).first() is None:
        raise HTTPException(status_code=404, detail="Job not found")

    reports_statement = (
        select(ReportModel)
        .where(
            ReportModel.job_id == parsed_job_id,
            ReportModel.user_id == current_user_id,
        )
        .order_by(ReportModel.scan_date.desc())
    )
    reports = session.exec(reports_statement).all()
    return [_to_report_read(report) for report in reports]


router.include_router(reports_router)
router.include_router(job_reports_router)
