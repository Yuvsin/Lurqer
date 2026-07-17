from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlmodel import Session, select

from app.auth import CurrentUserId
from app.database import get_session
from app.models.job import Job as JobModel
from app.models.job import utc_now
from app.schemas.common import RiskLevel
from app.schemas.job import Job as JobRead
from app.schemas.job import JobUpdate

router = APIRouter(
    prefix="/jobs",
    tags=["Jobs"],
)


def _to_job_read(job: JobModel) -> JobRead:
    display_date = job.date_applied or job.created_at.date()
    return JobRead(
        id=job.id,
        company=job.company,
        title=job.title,
        platform=job.platform,
        date=display_date.isoformat(),
        risk_level=RiskLevel.low,
        status=job.status,
        source_url=job.source_url,
        location=job.location,
        date_applied=job.date_applied,
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


@router.get("", response_model=list[JobRead])
def get_jobs(
    current_user_id: CurrentUserId,
    session: Session = Depends(get_session),
) -> list[JobRead]:
    statement = select(JobModel).where(JobModel.user_id == current_user_id)
    jobs = session.exec(statement).all()
    return [_to_job_read(job) for job in jobs]


@router.get("/{job_id}", response_model=JobRead)
def get_job_by_id(
    job_id: str,
    current_user_id: CurrentUserId,
    session: Session = Depends(get_session),
) -> JobRead:
    return _to_job_read(_get_owned_job(job_id, current_user_id, session))


@router.patch("/{job_id}", response_model=JobRead)
def update_job(
    job_id: str,
    updated_job: JobUpdate,
    current_user_id: CurrentUserId,
    session: Session = Depends(get_session),
) -> JobRead:
    job = _get_owned_job(job_id, current_user_id, session)
    updates = updated_job.model_dump(exclude_unset=True)

    for field, value in updates.items():
        setattr(job, field, value)
    if "source_url" in updates:
        job.normalized_source_url = job.source_url.strip()
    job.updated_at = utc_now()

    session.add(job)
    session.commit()
    session.refresh(job)
    return _to_job_read(job)


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job(
    job_id: str,
    current_user_id: CurrentUserId,
    session: Session = Depends(get_session),
) -> Response:
    job = _get_owned_job(job_id, current_user_id, session)
    session.delete(job)
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
