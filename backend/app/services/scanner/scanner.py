from __future__ import annotations

from app.services.scanner.models import JobScanInput, ScanFinding, ScanResult
from app.services.scanner.rules import RULES
from app.services.scanner.scoring import score_findings


def _deduplicate_findings(findings: list[ScanFinding]) -> list[ScanFinding]:
    unique_findings: list[ScanFinding] = []
    seen_rules: set[tuple[str, str]] = set()
    for finding in findings:
        key = (finding.category, finding.title)
        if key not in seen_rules:
            seen_rules.add(key)
            unique_findings.append(finding)
    return unique_findings


def scan_job_posting(
    title: str | None = None,
    company: str | None = None,
    description: str | None = None,
    source_url: str | None = None,
    source_site: str | None = None,
) -> ScanResult:
    data = JobScanInput(
        title=title,
        company=company,
        description=description,
        source_url=source_url,
        source_site=source_site,
    )
    findings = [
        finding
        for rule in RULES
        if (finding := rule(data)) is not None
    ]
    return score_findings(_deduplicate_findings(findings))


def scan_posting(
    title: str | None = None,
    company: str | None = None,
    description: str | None = None,
    source_url: str | None = None,
    source_site: str | None = None,
) -> ScanResult:
    return scan_job_posting(
        title=title,
        company=company,
        description=description,
        source_url=source_url,
        source_site=source_site,
    )
