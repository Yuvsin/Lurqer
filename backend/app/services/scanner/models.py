from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

Category = Literal["phishing", "scam", "fake_recruiter", "ghost_posting", "job_quality"]
SecurityCategory = Literal["phishing", "scam", "fake_recruiter"]
Severity = Literal["Low", "Medium", "High"]
Confidence = Literal["Low", "Medium", "High"]
RiskLevel = Literal["Low", "Medium", "High"]


@dataclass(frozen=True)
class JobScanInput:
    title: str | None = None
    company: str | None = None
    description: str | None = None
    source_url: str | None = None
    source_site: str | None = None
    submitted_url: str | None = None
    final_url: str | None = None


@dataclass(frozen=True)
class ScanFinding:
    rule_id: str
    category: Category
    severity: Severity
    confidence: Confidence
    title: str
    evidence: str
    explanation: str
    recommendation: str
    score_impact: int

    @property
    def description(self) -> str:
        return self.explanation

    @property
    def points(self) -> int:
        return self.score_impact


Finding = ScanFinding


@dataclass(frozen=True)
class PositiveSignal:
    rule_id: str
    title: str
    evidence: str
    description: str


@dataclass(frozen=True)
class CategoryScores:
    phishing: int
    scam: int
    fake_recruiter: int
    ghost_posting: int


@dataclass(frozen=True)
class ScanResult:
    category_scores: CategoryScores
    overall_score: int
    risk_level: RiskLevel
    top_finding: ScanFinding | None
    findings: list[ScanFinding]
    quality_concerns: list[ScanFinding]
    positive_signals: list[PositiveSignal]
