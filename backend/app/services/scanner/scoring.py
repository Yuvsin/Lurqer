from __future__ import annotations

from app.services.scanner.models import (
    CategoryScores,
    PositiveSignal,
    RiskLevel,
    ScanFinding,
    ScanResult,
)

MIN_SCORE = 0
MAX_SCORE = 100
MEDIUM_RISK_THRESHOLD = 34
HIGH_RISK_THRESHOLD = 67
SECURITY_CATEGORIES = {"phishing", "scam", "fake_recruiter"}


def clamp_score(score: int) -> int:
    return max(MIN_SCORE, min(MAX_SCORE, score))


def calculate_category_scores(findings: list[ScanFinding]) -> CategoryScores:
    totals = {"phishing": 0, "scam": 0, "fake_recruiter": 0}
    for finding in findings:
        if finding.category in SECURITY_CATEGORIES:
            totals[finding.category] += finding.score_impact
    return CategoryScores(
        phishing=clamp_score(totals["phishing"]),
        scam=clamp_score(totals["scam"]),
        fake_recruiter=clamp_score(totals["fake_recruiter"]),
        ghost_posting=0,
    )


def calculate_overall_score(findings: list[ScanFinding]) -> int:
    return clamp_score(
        sum(
            finding.score_impact
            for finding in findings
            if finding.category in SECURITY_CATEGORIES
        )
    )


def risk_level_for_score(score: int) -> RiskLevel:
    if score >= HIGH_RISK_THRESHOLD:
        return "High"
    if score >= MEDIUM_RISK_THRESHOLD:
        return "Medium"
    return "Low"


def score_findings(
    findings: list[ScanFinding],
    quality_concerns: list[ScanFinding] | None = None,
    positive_signals: list[PositiveSignal] | None = None,
) -> ScanResult:
    # Only security findings participate in category and overall scoring.
    ordered = sorted(findings, key=lambda finding: finding.score_impact, reverse=True)
    overall_score = calculate_overall_score(ordered)
    return ScanResult(
        category_scores=calculate_category_scores(ordered),
        overall_score=overall_score,
        risk_level=risk_level_for_score(overall_score),
        top_finding=ordered[0] if ordered else None,
        findings=ordered,
        quality_concerns=quality_concerns or [],
        positive_signals=(positive_signals or []) if not ordered else [],
    )
