from datetime import date, datetime
from uuid import UUID

from pydantic import Field

from app.schemas.common import ApiModel, JobStatus, RiskLevel, Severity


class Finding(ApiModel):
    id: str
    severity: Severity
    category: str
    title: str
    evidence: str
    description: str
    recommendation: str
    points: int = Field(ge=0)


class CategoryScores(ApiModel):
    phishing: int = Field(default=0, ge=0, le=100)
    fake_recruiter: int = Field(default=0, ge=0, le=100)
    scam: int = Field(default=0, ge=0, le=100)
    ghost: int = Field(default=0, ge=0, le=100)


class JobCreate(ApiModel):
    company: str = Field(min_length=1, max_length=200)
    title: str = Field(min_length=1, max_length=250)
    platform: str = Field(min_length=1, max_length=100)
    source_url: str = Field(min_length=1, max_length=2048)
    location: str | None = Field(default=None, max_length=200)
    status: JobStatus = JobStatus.applied
    date_applied: date | None = None


class JobUpdate(ApiModel):
    company: str | None = Field(default=None, min_length=1, max_length=200)
    title: str | None = Field(default=None, min_length=1, max_length=250)
    platform: str | None = Field(default=None, min_length=1, max_length=100)
    source_url: str | None = Field(default=None, min_length=1, max_length=2048)
    location: str | None = Field(default=None, max_length=200)
    status: JobStatus | None = None
    date_applied: date | None = None


class JobRead(ApiModel):
    id: UUID
    company: str
    title: str
    platform: str
    date: str
    risk_level: RiskLevel
    status: JobStatus
    source_url: str | None = None
    location: str | None = None
    overall_score: int | None = Field(default=None, ge=0, le=100)
    scan_date: datetime | None = None
    date_applied: date | None = None
    top_finding: str | None = None
    categories: CategoryScores | None = None
    findings: list[Finding] | None = None


class JobWithLatestReport(JobRead):
    pass


Job = JobRead
