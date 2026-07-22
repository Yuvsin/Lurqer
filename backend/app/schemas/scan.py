from uuid import UUID

from pydantic import Field, HttpUrl

from app.schemas.common import ApiModel, RiskLevel, ScanSource
from app.schemas.job import CategoryScores, Finding, JobRead, PositiveSignal, PostingContext


class ScanUrlRequest(ApiModel):
    url: HttpUrl


class ScanTextRequest(ApiModel):
    description: str = Field(min_length=20, max_length=100_000)
    title: str | None = Field(default=None, max_length=250)
    company: str | None = Field(default=None, max_length=200)
    location: str | None = Field(default=None, max_length=200)
    source_url: HttpUrl | None = None
    source_site: str | None = Field(default=None, max_length=100)


ScanTextFallbackRequest = ScanTextRequest


class ScanResponse(ApiModel):
    source: ScanSource
    job: JobRead
    report_id: UUID
    overall_score: int = Field(ge=0, le=100)
    risk_level: RiskLevel
    category_scores: CategoryScores
    top_finding: str | None = None
    findings: list[Finding]
    quality_concerns: list[Finding] = Field(default_factory=list)
    positive_signals: list[PositiveSignal] = Field(default_factory=list)
    posting_context: PostingContext
    submitted_url: str | None = None
    final_url: str | None = None
