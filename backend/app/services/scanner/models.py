from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

Category = Literal["phishing", "scam", "fake_recruiter", "ghost_posting"]
Severity = Literal["Low", "Medium", "High"]
RiskLevel = Literal["Low", "Medium", "High"]


@dataclass(frozen=True)
class JobScanInput:
    title: str | None = None
    company: str | None = None
    description: str | None = None
    source_url: str | None = None
    source_site: str | None = None


@dataclass(frozen=True)
class ScanFinding:
    category: Category
    severity: Severity
    title: str
    evidence: str
    description: str
    recommendation: str
    points: int


Finding = ScanFinding


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
