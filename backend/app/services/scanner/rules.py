from __future__ import annotations

import re
from collections.abc import Callable
from dataclasses import dataclass
from urllib.parse import urlsplit

from app.services.scanner.models import (
    Category,
    Confidence,
    Finding,
    JobScanInput,
    PositiveSignal,
    Severity,
)

EVIDENCE_CONTEXT_CHARACTERS = 80
SHORTENER_DOMAINS = {
    "bit.ly", "cutt.ly", "goo.gl", "is.gd", "ow.ly", "rebrand.ly",
    "t.co", "tiny.cc", "tinyurl.com",
}
TRUSTED_APPLICATION_DOMAINS = {
    "ashbyhq.com", "bamboohr.com", "greenhouse.io", "lever.co",
    "myworkdayjobs.com", "smartrecruiters.com", "workday.com",
}
PERSONAL_EMAIL_PATTERN = re.compile(
    r"\b[A-Z0-9._%+-]+@(?:aol|gmail|hotmail|icloud|outlook|protonmail|yahoo)\.(?:com|me|net)\b",
    re.IGNORECASE,
)


@dataclass(frozen=True)
class RuleDefinition:
    rule_id: str
    category: Category
    severity: Severity
    confidence: Confidence
    title: str
    score_impact: int
    explanation: str
    recommendation: str


RULE_DEFINITIONS = {
    "SEC_UNREALISTIC_COMPENSATION": RuleDefinition(
        "SEC_UNREALISTIC_COMPENSATION", "scam", "Medium", "Medium",
        "Implausible compensation combination", 15,
        "The posting combines unusually strong guaranteed earnings with minimal experience or work.",
        "Verify compensation and duties through the employer's official careers site before proceeding.",
    ),
    "SEC_IMMEDIATE_OFFER": RuleDefinition(
        "SEC_IMMEDIATE_OFFER", "fake_recruiter", "Medium", "High",
        "Guaranteed hiring or no-interview offer", 10,
        "The posting promises acceptance or an offer without a conventional interview process.",
        "Confirm the hiring process with the employer through an independently verified channel.",
    ),
    "SEC_OFF_PLATFORM": RuleDefinition(
        "SEC_OFF_PLATFORM", "fake_recruiter", "Low", "Medium",
        "Off-platform hiring communication", 5,
        "The posting directs recruiting communication to an informal messaging platform.",
        "Verify the recruiter through the employer's official domain before moving the conversation.",
    ),
    "SEC_GIFT_CARD_PAYMENT": RuleDefinition(
        "SEC_GIFT_CARD_PAYMENT", "scam", "High", "High",
        "Gift-card payment or transfer request", 50,
        "Legitimate employers do not use gift cards for wages, hiring fees, equipment purchases, verification, or fund transfers.",
        "Do not buy, send, or disclose gift cards or their codes. Verify the role through the employer's official careers site.",
    ),
    "SEC_UPFRONT_PAYMENT": RuleDefinition(
        "SEC_UPFRONT_PAYMENT", "scam", "High", "High",
        "Applicant payment required", 50,
        "The posting requires the applicant to pay a fee, deposit, or recruiter-controlled training cost.",
        "Do not pay fees or deposits to obtain a job. Verify the opening independently.",
    ),
    "SEC_FAKE_CHECK_EQUIPMENT": RuleDefinition(
        "SEC_FAKE_CHECK_EQUIPMENT", "scam", "High", "High",
        "Fake-check equipment scheme", 50,
        "The applicant is instructed to use a check or reimbursed funds to buy equipment from a designated seller.",
        "Do not deposit the check or purchase equipment. Contact the employer through its official site.",
    ),
    "SEC_CRYPTO_TRANSFER": RuleDefinition(
        "SEC_CRYPTO_TRANSFER", "scam", "High", "High",
        "Cryptocurrency transfer required", 50,
        "The posting requires cryptocurrency movement as part of hiring or the advertised work.",
        "Do not purchase or transfer cryptocurrency for a prospective employer.",
    ),
    "SEC_RESHIPPING": RuleDefinition(
        "SEC_RESHIPPING", "scam", "High", "High",
        "Package forwarding arrangement", 50,
        "The role asks a home-based worker to receive, relabel, and forward packages.",
        "Do not receive or forward packages. Verify the company and role independently.",
    ),
    "SEC_FUNDS_TRANSFER": RuleDefinition(
        "SEC_FUNDS_TRANSFER", "scam", "High", "High",
        "Personal transfer of company funds", 50,
        "The applicant is asked to receive, route, or send employer funds through personal financial channels.",
        "Do not move money for a prospective employer or provide access to a personal account.",
    ),
    "SEC_SENSITIVE_INFORMATION": RuleDefinition(
        "SEC_SENSITIVE_INFORMATION", "phishing", "High", "High",
        "Sensitive information requested before hiring", 70,
        "The posting requests identity or banking credentials before a legitimate offer and onboarding stage.",
        "Share sensitive documents only through a verified onboarding system after accepting a legitimate offer.",
    ),
    "SEC_EXTERNAL_DESTINATION": RuleDefinition(
        "SEC_EXTERNAL_DESTINATION", "phishing", "Low", "Low",
        "Unexpected application destination", 5,
        "The submitted link redirects to an unrelated or obscured destination.",
        "Confirm the final destination through the employer's official careers page before entering information.",
    ),
    "SEC_SHORTENED_LINK": RuleDefinition(
        "SEC_SHORTENED_LINK", "phishing", "Low", "Medium",
        "Shortened application link", 5,
        "A shortened URL obscures the application destination.",
        "Expand and verify the destination before opening it or entering personal information.",
    ),
    "SEC_EXCESSIVE_URGENCY": RuleDefinition(
        "SEC_EXCESSIVE_URGENCY", "fake_recruiter", "Low", "Medium",
        "Excessive hiring pressure", 3,
        "The posting applies unusually strong time pressure that may discourage verification.",
        "Pause and verify the company, recruiter, and posting through independent channels.",
    ),
    "SEC_OPTIMIZATION_TASK": RuleDefinition(
        "SEC_OPTIMIZATION_TASK", "scam", "Medium", "Medium",
        "Vague commission task scheme", 15,
        "The work centers on repetitive rating, liking, clicking, or optimization tasks tied to earnings.",
        "Verify the business model and never deposit funds to unlock tasks or withdraw earnings.",
    ),
    "QUALITY_VAGUE_RESPONSIBILITIES": RuleDefinition(
        "QUALITY_VAGUE_RESPONSIBILITIES", "job_quality", "Low", "Medium",
        "Responsibilities are poorly defined", 0,
        "The posting describes the role mainly with vague promises rather than concrete responsibilities.",
        "Ask for specific day-to-day duties, deliverables, and reporting structure.",
    ),
    "QUALITY_COMMISSION_ONLY": RuleDefinition(
        "QUALITY_COMMISSION_ONLY", "job_quality", "Medium", "High",
        "Compensation appears commission-only", 0,
        "The role appears to rely entirely on commission without clearly presenting that structure up front.",
        "Confirm the guaranteed base pay, commission terms, and employment classification in writing.",
    ),
    "QUALITY_TITLE_DUTIES_MISMATCH": RuleDefinition(
        "QUALITY_TITLE_DUTIES_MISMATCH", "job_quality", "Medium", "Medium",
        "Job title and duties do not align", 0,
        "The stated title conflicts with the primary responsibilities described in the posting.",
        "Ask the employer to clarify the role title, core duties, and performance expectations.",
    ),
}

RuleDetector = Callable[[JobScanInput], Finding | None]
PositiveDetector = Callable[[JobScanInput], PositiveSignal | None]


def _description(data: JobScanInput) -> str:
    return data.description.strip() if isinstance(data.description, str) else ""


def _combined_text(data: JobScanInput) -> str:
    return "\n".join(
        value.strip()
        for value in (data.title, data.company, data.description, data.source_url)
        if isinstance(value, str) and value.strip()
    )


def _evidence_excerpt(text: str, start: int, end: int) -> str:
    sentence_start = max(text.rfind(".", 0, start), text.rfind("\n", 0, start)) + 1
    next_period = text.find(".", end)
    sentence_end = next_period + 1 if next_period >= 0 else len(text)
    if sentence_end - sentence_start > 220:
        sentence_start = max(0, start - EVIDENCE_CONTEXT_CHARACTERS)
        sentence_end = min(len(text), end + EVIDENCE_CONTEXT_CHARACTERS)
    excerpt = re.sub(r"\s+", " ", text[sentence_start:sentence_end]).strip()
    return excerpt[:240]


def _match(text: str, pattern: str) -> re.Match[str] | None:
    return re.search(pattern, text, flags=re.IGNORECASE | re.DOTALL)


def _finding(
    definition_id: str,
    text: str,
    match: re.Match[str] | None,
    *,
    score_impact: int | None = None,
    confidence: Confidence | None = None,
) -> Finding | None:
    if match is None:
        return None
    definition = RULE_DEFINITIONS[definition_id]
    return Finding(
        rule_id=definition.rule_id,
        category=definition.category,
        severity=definition.severity,
        confidence=confidence or definition.confidence,
        title=definition.title,
        evidence=_evidence_excerpt(text, match.start(), match.end()),
        explanation=definition.explanation,
        recommendation=definition.recommendation,
        score_impact=definition.score_impact if score_impact is None else score_impact,
    )


def _domain(url: str | None) -> str | None:
    if not url:
        return None
    try:
        return (urlsplit(url).hostname or "").lower().removeprefix("www.") or None
    except ValueError:
        return None


def _registrable_hint(domain: str) -> str:
    parts = domain.split(".")
    return ".".join(parts[-2:]) if len(parts) >= 2 else domain


def _is_trusted_application_domain(domain: str) -> bool:
    return any(domain == trusted or domain.endswith(f".{trusted}") for trusted in TRUSTED_APPLICATION_DOMAINS)


def detect_unrealistic_compensation(data: JobScanInput) -> Finding | None:
    text = _combined_text(data)
    combinations = (
        r"(?:no experience (?:required|needed).{0,100}(?:guaranteed|earn|make).{0,30}\$\s?\d{3,}.{0,20}(?:day|week)|(?:guaranteed|earn|make).{0,30}\$\s?\d{3,}.{0,80}no experience)",
        r"(?:\b(?:1|2|3|4|5)\s*(?:hours?|hrs?).{0,80}\$\s?\d{3,}.{0,15}(?:day|week)|\$\s?\d{3,}.{0,15}(?:day|week).{0,80}\b(?:1|2|3|4|5)\s*(?:hours?|hrs?))",
        r"(?:entry[ -]level|data entry).{0,100}\$\s?(?:[8-9]\d|\d{3,})(?:\.\d+)?\s*(?:/|per\s*)hour",
        r"guaranteed (?:income|earnings|pay).{0,100}(?:immediate acceptance|hired immediately|no interview)",
    )
    match = next((_match(text, pattern) for pattern in combinations if _match(text, pattern)), None)
    return _finding("SEC_UNREALISTIC_COMPENSATION", text, match)


def detect_immediate_offer(data: JobScanInput) -> Finding | None:
    text = _description(data)
    match = _match(
        text,
        r"\b(?:"
        r"guaranteed (?:hire|hiring|job|offer|position|employment)"
        r"|(?:job|position|employment) (?:is )?guaranteed(?: after (?:applying|application))?"
        r"|job guarantee after (?:applying|application)"
        r"|hired immediately"
        r"|immediate acceptance"
        r"|automatic(?:ally)? (?:accepted|acceptance|approved|approval) (?:for|of) (?:the |your )?(?:job|position|application)"
        r"|(?:job|application) (?:is |will be )?automatic(?:ally)? (?:accepted|approved)"
        r"|offer (?:without|no) (?:an? )?interview"
        r"|no interview (?:needed|required)"
        r"|everyone (?:is|will be) accepted"
        r")\b",
    )
    if match is None:
        return None

    context = text[max(0, match.start() - 35):min(len(text), match.end() + 35)]
    if _match(
        context,
        r"\b(?:not guaranteed|guaranteed (?:interview|consideration|minimum salary)|legal (?:policy|requirement))\b",
    ):
        return None

    return _finding(
        "SEC_IMMEDIATE_OFFER",
        text,
        match,
    )


def detect_off_platform_communication(data: JobScanInput) -> Finding | None:
    text = _description(data)
    match = _match(text, r"\b(?:contact|message|interview|chat|reach (?:me|us)|send (?:your )?resume)\b.{0,60}\b(?:telegram|whats?app|signal|discord)\b|\b(?:telegram|whats?app|signal|discord)\b.{0,60}\b(?:contact|message|interview|chat)\b")
    if match is None:
        return None
    strong_context = _match(text, r"\b(?:gift card|deposit|payment|bank account|ssn|social security|no interview|guaranteed (?:hire|job)|hired immediately)\b")
    urgency = _match(text, r"\b(?:act now|respond within (?:an|one|\d+) hour|immediate approval|required immediately)\b")
    points = 15 if strong_context else 8 if urgency else 5
    if PERSONAL_EMAIL_PATTERN.search(text):
        points = min(20, points + 2)
    return _finding("SEC_OFF_PLATFORM", text, match, score_impact=points)


def detect_gift_card_payment(data: JobScanInput) -> Finding | None:
    text = _description(data)

    direct_match = _match(
        text,
        r"(?:"
        r"\b(?:you|applicant|candidate|new hire)\b.{0,55}\b(?:buy|purchase|send|transfer|photograph|share|disclose|provide)\b.{0,55}\bgift[- ]cards?\b"
        r"|(?:^|[.!?\n]\s*|\b(?:must|need to|required to|instructed to|please|will)\s+)"
        r"(?:buy|purchase|send|transfer|photograph|share|disclose|provide)\b.{0,55}\bgift[- ]cards?\b"
        r"|\b(?:required|must|need to)\b.{0,40}\bgift[- ]card (?:purchase|payment)\b"
        r"|\bgift[- ]cards?\b.{0,45}\b(?:codes?|pins?)\b.{0,35}\b(?:send|share|photograph|disclose|provide|text|email)\b"
        r"|\b(?:send|share|photograph|disclose|provide|text|email)\b.{0,35}\bgift[- ]card\b.{0,25}\b(?:codes?|pins?)\b"
        r")",
    )
    if direct_match is not None:
        context = text[max(0, direct_match.start() - 45):min(len(text), direct_match.end() + 45)]
        negated = _match(
            context,
            r"\b(?:never|do not|don't|will not|won't)\b.{0,45}\b(?:buy|purchase|send|transfer|request|ask for|share|disclose|provide)\b.{0,55}\bgift[- ]cards?\b",
        )
        benign_role = _match(
            context,
            r"\b(?:retail|inventory|cashier|customer (?:service|support)|fraud prevention|scam (?:awareness|education|warning))\b",
        )
        if not negated and not benign_role:
            return _finding(
                "SEC_GIFT_CARD_PAYMENT",
                text,
                direct_match,
                score_impact=70,
            )

    payment_match = _match(
        text,
        r"(?:"
        r"\b(?:compensation|payment|paid|paycheck|salary|wages|reimbursement|job funds|company funds|hiring funds)\b.{0,65}\bgift[- ]cards?\b"
        r"|\bgift[- ]cards?\b.{0,65}\b(?:compensation|payment|paid|paycheck|salary|wages|reimbursement|job funds|company funds|hiring funds)\b"
        r")",
    )
    if payment_match is None:
        return None

    context = text[max(0, payment_match.start() - 65):min(len(text), payment_match.end() + 65)]
    benign_context = _match(
        context,
        r"\b(?:"
        r"retail|inventory|stock(?:ing)?|cashier|customer (?:service|support)|sell(?:ing|s)? gift[- ]cards?"
        r"|optional.{0,25}(?:reward|bonus)|(?:reward|bonus).{0,25}optional"
        r"|fraud prevention|scam (?:awareness|education|warning)"
        r"|never|do not|don't|will not|won't"
        r")\b",
    )
    return None if benign_context else _finding("SEC_GIFT_CARD_PAYMENT", text, payment_match)


def detect_upfront_payment(data: JobScanInput) -> Finding | None:
    text = _description(data)
    paid_training = r"(?:pay|fee|cost|purchase).{0,45}(?:required |mandatory )?(?:training|certification)|(?:training|certification).{0,45}(?:fee|paid to (?:us|the recruiter)|you must pay)"
    fees = r"\b(?:application|placement|onboarding|registration|processing) (?:fee|deposit)\b|\bequipment deposit\b"
    match = _match(text, f"(?:{fees}|{paid_training})")
    if match and _match(match.group(0), r"\b(?:employer|company|we) (?:provides?|offers?) paid training\b"):
        return None
    return _finding("SEC_UPFRONT_PAYMENT", text, match)


def detect_fake_check_equipment(data: JobScanInput) -> Finding | None:
    text = _description(data)
    return _finding(
        "SEC_FAKE_CHECK_EQUIPMENT", text,
        _match(text, r"\b(?:receive|send|mail|deposit|mobile deposit|cash).{0,45}(?:company |cashier'?s? )?check\b.{0,140}\b(?:buy|purchase|order|vendor|equipment|laptop|send (?:the )?(?:remaining|balance))\b|\b(?:buy|purchase) (?:your )?(?:equipment|laptop).{0,100}(?:designated|approved) (?:vendor|supplier).{0,80}(?:reimburse|reimbursement|funds)")
    )


def detect_cryptocurrency_transfer(data: JobScanInput) -> Finding | None:
    text = _description(data)
    return _finding(
        "SEC_CRYPTO_TRANSFER", text,
        _match(text, r"\b(?:send|receive|purchase|buy|transfer|deposit).{0,50}(?:bitcoin|cryptocurrency|crypto|usdt|ethereum)\b|\b(?:bitcoin|cryptocurrency|crypto|usdt|ethereum).{0,50}(?:wallet|transfer|deposit|payment)\b"),
    )


def detect_package_reshipping(data: JobScanInput) -> Finding | None:
    text = _description(data)
    return _finding(
        "SEC_RESHIPPING", text,
        _match(text, r"\b(?:receive|accept).{0,50}packages?.{0,100}(?:inspect|relabel|repack|forward|reship|ship).{0,50}(?:packages?|customer|address)|\b(?:package forwarding|reshipping (?:agent|position|job))\b"),
    )


def detect_funds_transfer(data: JobScanInput) -> Finding | None:
    text = _description(data)
    personal_account = _match(text, r"\b(?:personal|your) (?:bank|banking) account\b.{0,100}\b(?:receive|route|transfer|funds|payments?)\b|\b(?:receive|route|transfer).{0,100}\b(?:funds|payments?)\b.{0,60}\b(?:personal|your) (?:bank|banking) account\b")
    if personal_account:
        return _finding("SEC_FUNDS_TRANSFER", text, personal_account, score_impact=70)
    return _finding(
        "SEC_FUNDS_TRANSFER", text,
        _match(text, r"\b(?:receive|route|transfer|forward|send).{0,50}(?:company funds|client funds|payments?).{0,80}(?:third part|vendor|on behalf of (?:us|the company))\b"),
    )


def detect_sensitive_information(data: JobScanInput) -> Finding | None:
    text = _description(data)
    post_hire = _match(text, r"\b(?:after (?:you are )?hired|after accepting (?:an|the) offer|during onboarding|upon employment|post[- ]offer).{0,100}(?:ssn|social security|government (?:id|identification)|tax documents?|bank(?:ing)? information|direct deposit)\b")
    if post_hire:
        return None
    match = _match(text, r"\b(?:provide|submit|send|text|email|need|require).{0,55}(?:social security number|ssn|online banking (?:login|password|credentials)|bank (?:account|login|password|credentials)|routing number|account number|government (?:id|identification)|driver'?s license|passport).{0,80}(?:before (?:an? )?(?:interview|offer)|with (?:your|the) application|to (?:apply|be considered)|immediately|now)?")
    return _finding("SEC_SENSITIVE_INFORMATION", text, match)


def detect_external_destination(data: JobScanInput) -> Finding | None:
    submitted = _domain(data.submitted_url)
    final = _domain(data.final_url)
    if not submitted or not final or submitted == final:
        return None
    if _registrable_hint(submitted) == _registrable_hint(final) or _is_trusted_application_domain(final):
        return None
    evidence = f"{submitted} redirected to {final}"
    definition = RULE_DEFINITIONS["SEC_EXTERNAL_DESTINATION"]
    impact = 10 if submitted in SHORTENER_DOMAINS or final in SHORTENER_DOMAINS else 5
    return Finding(
        rule_id=definition.rule_id,
        category=definition.category,
        severity=definition.severity,
        confidence=definition.confidence,
        title=definition.title,
        evidence=evidence,
        explanation=definition.explanation,
        recommendation=definition.recommendation,
        score_impact=impact,
    )


def detect_shortened_link(data: JobScanInput) -> Finding | None:
    text = _combined_text(data)
    domains = "|".join(re.escape(domain) for domain in sorted(SHORTENER_DOMAINS))
    return _finding("SEC_SHORTENED_LINK", text, _match(text, rf"https?://(?:{domains})/[^\s<>)]+"))


def detect_excessive_urgency(data: JobScanInput) -> Finding | None:
    text = _description(data)
    match = _match(
        text,
        r"\b(?:"
        r"respond within (?:an|one|\d+) hour"
        r"|limited slots?,? act now"
        r"|immediate approval required"
        r"|failure to respond.{0,45}(?:lose|forfeit) (?:the|your) position"
        r"|respond immediately.{0,45}(?:secure|keep) (?:the|your|this) position"
        r"|respond immediately or.{0,40}(?:lose|forfeit)"
        r"|(?:must be |be |are )?ready to interview immediately"
        r"|(?:must |need to )?complete (?:the |your )?interview immediately"
        r"|(?:lose|forfeit) (?:the|your) position if (?:you )?(?:do not|don't) respond (?:right )?now"
        r")\b",
    )
    if match is None:
        return None

    context = text[max(0, match.start() - 35):min(len(text), match.end() + 35)]
    if _match(
        context,
        r"\b(?:immediate opening|immediate start date|applications? (?:are )?reviewed immediately|immediate availability preferred|available to start immediately)\b",
    ):
        return None

    return _finding(
        "SEC_EXCESSIVE_URGENCY",
        text,
        match,
    )


def detect_optimization_task(data: JobScanInput) -> Finding | None:
    text = _description(data)
    return _finding(
        "SEC_OPTIMIZATION_TASK", text,
        _match(text, r"\b(?:product optimization|rate (?:products|apps)|lik(?:e|ing) (?:posts|videos|content)|click(?:ing)? (?:ads|links|products)|complete simple tasks?).{0,100}(?:commission|earnings?|unlock|withdraw|daily income)\b"),
    )


def detect_vague_responsibilities(data: JobScanInput) -> Finding | None:
    text = _description(data)
    if len(text) > 700:
        return None
    match = _match(text, r"\b(?:various tasks as assigned|help with different things|simple online work|general duties|other tasks as needed)\b")
    concrete_verbs = re.findall(r"\b(?:build|design|develop|manage|analyze|review|maintain|coordinate|document|implement|support)\b", text, re.IGNORECASE)
    return None if len(concrete_verbs) >= 2 else _finding("QUALITY_VAGUE_RESPONSIBILITIES", text, match)


def detect_commission_only(data: JobScanInput) -> Finding | None:
    text = _description(data)
    return _finding(
        "QUALITY_COMMISSION_ONLY", text,
        _match(text, r"\b(?:commission only|100% commission|no (?:base )?salary|compensation is solely commission|unpaid unless (?:you|sales))\b"),
    )


def detect_title_duties_mismatch(data: JobScanInput) -> Finding | None:
    title = (data.title or "").lower()
    text = _description(data)
    patterns = (
        (r"(?:software|security|data) (?:engineer|analyst|developer)", r"\b(?:door[- ]to[- ]door sales|cold-call prospects|sell insurance policies)\b"),
        (r"data entry", r"\b(?:receive|relabel|forward|reship) packages?\b"),
        (r"administrative assistant", r"\b(?:sell products door[- ]to[- ]door|commission-only sales)\b"),
    )
    for title_pattern, duty_pattern in patterns:
        if re.search(title_pattern, title, re.IGNORECASE):
            match = _match(text, duty_pattern)
            if match:
                return _finding("QUALITY_TITLE_DUTIES_MISMATCH", text, match)
    return None


def detect_clear_structure(data: JobScanInput) -> PositiveSignal | None:
    text = _description(data)
    responsibilities = _match(text, r"\b(?:responsibilities|what you(?:'|’)ll do|duties)\b")
    qualifications = _match(text, r"\b(?:qualifications|requirements|what you(?:'|’)ll bring)\b")
    if not responsibilities or not qualifications:
        return None
    return PositiveSignal(
        rule_id="POS_CLEAR_STRUCTURE",
        title="Clear responsibilities and qualifications",
        evidence=_evidence_excerpt(text, responsibilities.start(), qualifications.end()),
        description="The posting presents identifiable duties and candidate qualifications.",
    )


def detect_identifiable_careers_page(data: JobScanInput) -> PositiveSignal | None:
    domain = _domain(data.final_url or data.source_url)
    if not domain:
        return None
    url = (data.final_url or data.source_url or "").lower()
    company_tokens = [
        token
        for token in re.findall(r"[a-z0-9]+", (data.company or "").casefold())
        if len(token) >= 4 and token not in {"company", "corporation", "limited"}
    ]
    employer_match = any(token in domain.replace("-", "") for token in company_tokens)
    if not (
        _is_trusted_application_domain(domain)
        or (employer_match and ("/careers" in url or "/jobs/" in url))
    ):
        return None
    return PositiveSignal(
        rule_id="POS_IDENTIFIABLE_CAREERS_PAGE",
        title="Identifiable careers destination",
        evidence=domain,
        description="The posting uses a recognizable careers or applicant-tracking destination.",
    )


RULES: tuple[RuleDetector, ...] = (
    detect_unrealistic_compensation,
    detect_immediate_offer,
    detect_off_platform_communication,
    detect_gift_card_payment,
    detect_upfront_payment,
    detect_fake_check_equipment,
    detect_cryptocurrency_transfer,
    detect_package_reshipping,
    detect_funds_transfer,
    detect_sensitive_information,
    detect_external_destination,
    detect_shortened_link,
    detect_excessive_urgency,
    detect_optimization_task,
)

QUALITY_RULES: tuple[RuleDetector, ...] = (
    detect_vague_responsibilities,
    detect_commission_only,
    detect_title_duties_mismatch,
)

POSITIVE_RULES: tuple[PositiveDetector, ...] = (
    detect_clear_structure,
    detect_identifiable_careers_page,
)
