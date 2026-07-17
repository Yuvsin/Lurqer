from __future__ import annotations

import re
from collections.abc import Callable
from dataclasses import dataclass

from app.services.scanner.models import (
    Category,
    Finding,
    JobScanInput,
    Severity,
)

EVIDENCE_CONTEXT_CHARACTERS = 70

VAGUE_COMPANY_NAMES = {
    "",
    "a leading company",
    "confidential",
    "confidential client",
    "n/a",
    "not disclosed",
    "stealth company",
    "unknown",
    "unknown company",
}


@dataclass(frozen=True)
class _RuleDefinition:
    category: Category
    severity: Severity
    title: str
    patterns: tuple[str, ...]
    description: str
    recommendation: str
    points: int


RuleDetector = Callable[[JobScanInput], Finding | None]


def _combined_text(data: JobScanInput) -> str:
    return "\n".join(
        value.strip()
        for value in (
            data.title,
            data.company,
            data.description,
            data.source_url,
            data.source_site,
        )
        if isinstance(value, str) and value.strip()
    )


def _evidence_excerpt(text: str, start: int, end: int) -> str:
    excerpt_start = max(0, start - EVIDENCE_CONTEXT_CHARACTERS)
    excerpt_end = min(len(text), end + EVIDENCE_CONTEXT_CHARACTERS)
    excerpt = re.sub(r"\s+", " ", text[excerpt_start:excerpt_end]).strip()
    if excerpt_start > 0:
        excerpt = f"...{excerpt}"
    if excerpt_end < len(text):
        excerpt = f"{excerpt}..."
    return excerpt


def _detect_patterns(data: JobScanInput, rule: _RuleDefinition) -> Finding | None:
    text = _combined_text(data)
    matches = (
        match
        for pattern in rule.patterns
        if (match := re.search(pattern, text, flags=re.IGNORECASE | re.DOTALL))
    )
    match = next(matches, None)
    if match is None:
        return None
    return Finding(
        category=rule.category,
        severity=rule.severity,
        title=rule.title,
        evidence=_evidence_excerpt(text, match.start(), match.end()),
        description=rule.description,
        recommendation=rule.recommendation,
        points=rule.points,
    )


def detect_telegram_or_whatsapp_request(data: JobScanInput) -> Finding | None:
    return _detect_patterns(
        data,
        _RuleDefinition(
            category="fake_recruiter",
            severity="Medium",
            title="Off-platform messaging request",
            patterns=(
                r"\b(?:contact|message|interview|reach (?:me|us))\b.{0,50}\btelegram\b",
                r"\b(?:contact|message|interview|reach (?:me|us))\b.{0,50}\bwhats?app\b",
                r"\b(?:telegram|whats?app)\b.{0,50}\b(?:contact|message|interview|chat)\b",
            ),
            description="The posting moves recruiting communication to an informal messaging service.",
            recommendation="Verify the recruiter through the employer's official domain and hiring portal.",
            points=20,
        ),
    )


def detect_gift_card_or_payment_request(data: JobScanInput) -> Finding | None:
    return _detect_patterns(
        data,
        _RuleDefinition(
            category="scam",
            severity="High",
            title="Gift card or direct payment request",
            patterns=(
                r"\b(?:buy|purchase|send)\b.{0,45}\bgift cards?\b",
                r"\b(?:wire transfer|western union|moneygram|cryptocurrency|bitcoin)\b",
                r"\b(?:cashier'?s|certified|company) check\b.{0,70}\b(?:deposit|cash|mobile deposit)\b",
                r"\b(?:send|transfer|pay)\b.{0,40}\b(?:money|funds|payment)\b",
            ),
            description="The posting asks the applicant to move money through a difficult-to-reverse method.",
            recommendation="Do not send money, buy gift cards, deposit checks, or transfer funds for a job.",
            points=35,
        ),
    )


def detect_equipment_purchase_scam(data: JobScanInput) -> Finding | None:
    return _detect_patterns(
        data,
        _RuleDefinition(
            category="scam",
            severity="High",
            title="Equipment purchase or reimbursement scheme",
            patterns=(
                r"\b(?:buy|purchase|order)\b.{0,60}\b(?:equipment|laptop|computer|software)\b",
                r"\b(?:equipment|laptop|computer)\b.{0,70}\b(?:reimburse|reimbursement|vendor|check)\b",
                r"\b(?:send|mail)\b.{0,30}\bcheck\b.{0,70}\b(?:equipment|supplies|laptop)\b",
            ),
            description="The applicant is expected to purchase equipment or use employer-supplied funds.",
            recommendation="Use only equipment supplied directly through a verified employer process.",
            points=35,
        ),
    )


def detect_ssn_request(data: JobScanInput) -> Finding | None:
    return _detect_patterns(
        data,
        _RuleDefinition(
            category="phishing",
            severity="High",
            title="Premature Social Security number request",
            patterns=(
                r"\b(?:social security number|ssn)\b.{0,60}\b(?:before|prior to|application|interview|considered)\b",
                r"\b(?:provide|submit|send|need|require)\b.{0,45}\b(?:social security number|ssn)\b",
            ),
            description="The posting requests a Social Security number before a verified formal offer.",
            recommendation="Provide an SSN only through a verified onboarding system after accepting an offer.",
            points=30,
        ),
    )


def detect_bank_information_request(data: JobScanInput) -> Finding | None:
    return _detect_patterns(
        data,
        _RuleDefinition(
            category="phishing",
            severity="High",
            title="Banking information request",
            patterns=(
                r"\b(?:bank account|banking information|routing number|account number)\b",
                r"\b(?:direct deposit form|online banking login|bank credentials)\b",
            ),
            description="The posting requests banking details during recruiting rather than verified onboarding.",
            recommendation="Do not share banking information until employment is verified and onboarding begins.",
            points=30,
        ),
    )


def detect_personal_recruiter_email(data: JobScanInput) -> Finding | None:
    return _detect_patterns(
        data,
        _RuleDefinition(
            category="fake_recruiter",
            severity="Medium",
            title="Recruiter uses a personal email domain",
            patterns=(
                r"\b[A-Z0-9._%+-]+@(?:gmail|yahoo|hotmail|outlook|aol|icloud|protonmail)\.(?:com|net|me)\b",
            ),
            description="The recruiter contact uses a consumer email provider instead of a company domain.",
            recommendation="Confirm the recruiter's identity through the company's official website.",
            points=20,
        ),
    )


def detect_shortened_link(data: JobScanInput) -> Finding | None:
    return _detect_patterns(
        data,
        _RuleDefinition(
            category="phishing",
            severity="Medium",
            title="Suspicious shortened link",
            patterns=(
                r"https?://(?:bit\.ly|tinyurl\.com|t\.co|goo\.gl|ow\.ly|is\.gd|cutt\.ly|rebrand\.ly|tiny\.cc)/[^\s]+",
            ),
            description="A shortened URL hides the final destination of an application or contact link.",
            recommendation="Expand and verify the link before opening it or entering personal information.",
            points=20,
        ),
    )


def detect_extreme_urgency(data: JobScanInput) -> Finding | None:
    return _detect_patterns(
        data,
        _RuleDefinition(
            category="fake_recruiter",
            severity="Medium",
            title="Extreme urgency or pressure",
            patterns=(
                r"\b(?:act now|apply immediately|respond immediately|urgent hiring|limited time|within \d+ hours?)\b",
                r"\b(?:must respond|must apply|decision today|start today)\b",
            ),
            description="The posting uses pressure intended to reduce time for independent verification.",
            recommendation="Pause and verify the company, recruiter, and posting before continuing.",
            points=15,
        ),
    )


def detect_unrealistic_compensation(data: JobScanInput) -> Finding | None:
    return _detect_patterns(
        data,
        _RuleDefinition(
            category="scam",
            severity="Medium",
            title="Unrealistic compensation claim",
            patterns=(
                r"\b(?:earn|make|guaranteed)\b.{0,35}\$\s?\d{3,}(?:,\d{3})*.{0,20}\b(?:day|daily|week|weekly)\b",
                r"\$\s?\d{3,}(?:,\d{3})*.{0,20}\bper (?:day|week)\b.{0,40}\b(?:no experience|easy|guaranteed)\b",
                r"\b(?:unlimited earning potential|guaranteed income|get rich quick)\b",
            ),
            description="The advertised compensation is framed as unusually high or guaranteed for minimal work.",
            recommendation="Compare compensation with reputable market data and verify the employer independently.",
            points=20,
        ),
    )


def detect_missing_company_information(data: JobScanInput) -> Finding | None:
    company_name = data.company.strip() if isinstance(data.company, str) else ""
    description_text = (
        data.description.strip() if isinstance(data.description, str) else ""
    )
    if not company_name and not description_text:
        return None
    vague_description = re.search(
        r"\b(?:our client|a leading company|confidential employer|undisclosed company)\b",
        description_text,
        flags=re.IGNORECASE,
    )
    if company_name.lower() not in VAGUE_COMPANY_NAMES and vague_description is None:
        return None

    evidence = company_name or (
        _evidence_excerpt(
            description_text,
            vague_description.start(),
            vague_description.end(),
        )
        if vague_description
        else "No company name was provided."
    )
    return Finding(
        category="ghost_posting",
        severity="Medium",
        title="Missing or vague company identity",
        evidence=evidence,
        description="The posting does not clearly identify the organization offering the role.",
        recommendation="Confirm the legal company name and locate the role on its official careers site.",
        points=15,
    )


RULES: tuple[RuleDetector, ...] = (
    detect_telegram_or_whatsapp_request,
    detect_gift_card_or_payment_request,
    detect_equipment_purchase_scam,
    detect_ssn_request,
    detect_bank_information_request,
    detect_personal_recruiter_email,
    detect_shortened_link,
    detect_extreme_urgency,
    detect_unrealistic_compensation,
    detect_missing_company_information,
)
