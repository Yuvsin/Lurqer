from datetime import datetime
from uuid import UUID

from pydantic import Field

from app.schemas.common import ApiModel, RiskLevel, ScanSource, Severity
from app.schemas.job import CategoryScores, Finding, PositiveSignal, PostingContext


class ReportFlag(ApiModel):
    title: str
    description: str
    severity: Severity
    evidence: str | None = None


class ReportCreate(ApiModel):
    job_id: UUID
    source: ScanSource
    scanned_url: str | None = None
    risk_level: RiskLevel
    overall_score: int = Field(ge=0, le=100)
    top_finding: str | None = Field(default=None, max_length=500)
    categories: CategoryScores
    findings: list[Finding] = Field(default_factory=list)


class ReportRead(ApiModel):
    id: UUID
    job_id: UUID
    risk_level: RiskLevel
    overall_score: int = Field(ge=0, le=100)
    top_finding: str | None = None
    categories: CategoryScores
    findings: list[Finding]
    quality_concerns: list[Finding] = Field(default_factory=list)
    positive_signals: list[PositiveSignal] = Field(default_factory=list)
    submitted_url: str | None = None
    final_url: str | None = None
    posting_context: PostingContext | None = None
    scan_date: datetime
    created_at: datetime


Report = ReportRead
