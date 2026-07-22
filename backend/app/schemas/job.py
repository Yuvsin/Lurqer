from datetime import date, datetime
from uuid import UUID

from pydantic import Field, model_validator

from app.schemas.common import ApiModel, JobStatus, RiskLevel, Severity


class Finding(ApiModel):
    id: str
    rule_id: str
    severity: Severity
    confidence: str
    category: str
    title: str
    evidence: str
    description: str
    explanation: str
    recommendation: str
    score_impact: int = Field(ge=0)
    points: int = Field(ge=0)

    @model_validator(mode="before")
    @classmethod
    def preserve_legacy_findings(cls, value):
        if not isinstance(value, dict):
            return value
        normalized = dict(value)
        normalized.setdefault("ruleId", normalized.get("rule_id", "LEGACY_FINDING"))
        normalized.setdefault("confidence", "Medium")
        explanation = normalized.get("explanation") or normalized.get("description", "")
        normalized.setdefault("explanation", explanation)
        normalized.setdefault("description", explanation)
        points = normalized.get("scoreImpact", normalized.get("score_impact", normalized.get("points", 0)))
        normalized.setdefault("scoreImpact", points)
        normalized.setdefault("points", points)
        return normalized


class PositiveSignal(ApiModel):
    rule_id: str
    title: str
    evidence: str
    description: str


class PostingContext(ApiModel):
    posting_date: date | None = None
    first_seen: datetime
    most_recently_seen: datetime
    observed_age_days: int = Field(ge=0)
    repeat_count: int = Field(ge=1)
    possible_reposting: bool = False


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
    posting_date: date | None = None


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
