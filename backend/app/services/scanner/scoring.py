from __future__ import annotations

from app.services.scanner.models import (
    CategoryScores,
    RiskLevel,
    ScanFinding,
    ScanResult,
)

MIN_SCORE = 0
MAX_SCORE = 100
MEDIUM_RISK_THRESHOLD = 25
HIGH_RISK_THRESHOLD = 60


def clamp_score(score: int) -> int:
    return max(MIN_SCORE, min(MAX_SCORE, score))


def calculate_category_scores(findings: list[ScanFinding]) -> CategoryScores:
    totals = {
        "phishing": 0,
        "scam": 0,
        "fake_recruiter": 0,
        "ghost_posting": 0,
    }
    for finding in findings:
        totals[finding.category] += finding.points
    return CategoryScores(
        phishing=clamp_score(totals["phishing"]),
        scam=clamp_score(totals["scam"]),
        fake_recruiter=clamp_score(totals["fake_recruiter"]),
        ghost_posting=clamp_score(totals["ghost_posting"]),
    )


def calculate_overall_score(findings: list[ScanFinding]) -> int:
    return clamp_score(sum(finding.points for finding in findings))


def risk_level_for_score(score: int) -> RiskLevel:
    if score >= HIGH_RISK_THRESHOLD:
        return "High"
    if score >= MEDIUM_RISK_THRESHOLD:
        return "Medium"
    return "Low"


def select_top_finding(findings: list[ScanFinding]) -> ScanFinding | None:
    return findings[0] if findings else None


def score_findings(findings: list[ScanFinding]) -> ScanResult:
    # Stable sorting preserves registry order when two rules have equal weights.
    ordered_findings = sorted(findings, key=lambda finding: finding.points, reverse=True)
    overall_score = calculate_overall_score(ordered_findings)
    return ScanResult(
        category_scores=calculate_category_scores(ordered_findings),
        overall_score=overall_score,
        risk_level=risk_level_for_score(overall_score),
        top_finding=select_top_finding(ordered_findings),
        findings=ordered_findings,
    )
