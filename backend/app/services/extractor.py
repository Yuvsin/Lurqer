from __future__ import annotations

import json
import re
from collections.abc import Iterator
from dataclasses import dataclass
from typing import Any
from urllib.parse import urlsplit

from bs4 import BeautifulSoup, Tag

MIN_DESCRIPTION_CHARACTERS = 120

DESCRIPTION_SELECTORS = (
    '[itemprop="description"]',
    "#job-description",
    ".job-description",
    ".jobDescription",
    ".job-details",
    ".jobDetails",
    ".posting-description",
    ".description__text",
    '[data-testid="job-description"]',
)

BLOCKED_PAGE_MARKERS = (
    "access denied",
    "enable javascript",
    "verify you are human",
    "captcha",
    "request blocked",
)

LINKEDIN_TITLE_PATTERN = re.compile(
    r"^(?P<company>.+?)\s+hiring\s+(?P<title>.+)\s+in\s+"
    r"(?P<location>.+?)\s*\|\s*LinkedIn\s*$",
    re.IGNORECASE,
)

LINKEDIN_TITLE_SELECTORS = (
    "h1.top-card-layout__title",
    ".top-card-layout__title",
    ".topcard__title",
    ".job-details-jobs-unified-top-card__job-title",
)

LINKEDIN_COMPANY_SELECTORS = (
    ".topcard__org-name-link",
    '[data-tracking-control-name="public_jobs_topcard-org-name"]',
    ".job-details-jobs-unified-top-card__company-name",
    ".topcard__flavor",
)

LINKEDIN_LOCATION_SELECTORS = (
    ".topcard__flavor--bullet",
    ".job-details-jobs-unified-top-card__primary-description-container",
)


class ExtractionError(ValueError):
    """Base exception for job-posting extraction failures."""


class InvalidHTMLContentError(ExtractionError):
    """The supplied content is empty or not useful HTML."""


class InvalidSourceURLError(ExtractionError):
    """The source URL cannot identify the posting's site."""


class DescriptionExtractionError(ExtractionError):
    """No usable job description could be extracted."""


@dataclass(frozen=True)
class ExtractedJobPosting:
    title: str | None
    company: str | None
    location: str | None
    description: str
    source_url: str
    source_site: str
    extraction_method: str


@dataclass
class _ExtractedFields:
    title: str | None = None
    company: str | None = None
    location: str | None = None
    description: str | None = None
    extraction_method: str | None = None


def _clean_text(value: str | None) -> str | None:
    if not value:
        return None

    lines: list[str] = []
    previous_blank = False
    for raw_line in value.replace("\r\n", "\n").replace("\r", "\n").split("\n"):
        line = re.sub(r"[\t\f\v ]+", " ", raw_line).strip()
        if line:
            lines.append(line)
            previous_blank = False
        elif lines and not previous_blank:
            lines.append("")
            previous_blank = True

    cleaned = "\n".join(lines).strip()
    return cleaned or None


def _element_text(element: Tag | None) -> str | None:
    if element is None:
        return None
    return _clean_text(element.get_text("\n", strip=True))


def _html_fragment_text(value: Any) -> str | None:
    if not isinstance(value, str):
        return None
    fragment = BeautifulSoup(value, "html.parser")
    return _element_text(fragment)


def _is_job_posting(value: dict[str, Any]) -> bool:
    item_type = value.get("@type")
    if isinstance(item_type, str):
        return item_type.lower() == "jobposting"
    if isinstance(item_type, list):
        return any(str(entry).lower() == "jobposting" for entry in item_type)
    return False


def _walk_json_ld(value: Any) -> Iterator[dict[str, Any]]:
    if isinstance(value, list):
        for item in value:
            yield from _walk_json_ld(item)
        return
    if not isinstance(value, dict):
        return

    if _is_job_posting(value):
        yield value

    graph = value.get("@graph")
    if isinstance(graph, (dict, list)):
        yield from _walk_json_ld(graph)


def _json_ld_postings(soup: BeautifulSoup) -> list[dict[str, Any]]:
    postings: list[dict[str, Any]] = []
    for script in soup.select('script[type="application/ld+json"]'):
        raw_json = script.string or script.get_text()
        if not raw_json:
            continue
        raw_json = raw_json.strip().removeprefix("<!--").removesuffix("-->").strip()
        try:
            value = json.loads(raw_json)
        except (TypeError, json.JSONDecodeError):
            continue
        postings.extend(_walk_json_ld(value))
    return postings


def _named_value(value: Any) -> str | None:
    if isinstance(value, str):
        return _clean_text(value)
    if isinstance(value, list):
        for item in value:
            name = _named_value(item)
            if name:
                return name
    if isinstance(value, dict):
        return _clean_text(str(value.get("name"))) if value.get("name") else None
    return None


def _json_ld_location(posting: dict[str, Any]) -> str | None:
    if str(posting.get("jobLocationType", "")).upper() == "TELECOMMUTE":
        return "Remote"

    locations = posting.get("jobLocation")
    if not isinstance(locations, list):
        locations = [locations]

    for location in locations:
        if not isinstance(location, dict):
            continue
        address = location.get("address")
        if isinstance(address, str):
            cleaned = _clean_text(address)
            if cleaned:
                return cleaned
        if isinstance(address, dict):
            parts = [
                _clean_text(str(address.get(key)))
                for key in ("streetAddress", "addressLocality", "addressRegion", "postalCode", "addressCountry")
                if address.get(key)
            ]
            if parts:
                return ", ".join(parts)
        name = _named_value(location)
        if name:
            return name
    return None


def _from_json_ld(soup: BeautifulSoup) -> _ExtractedFields:
    postings = _json_ld_postings(soup)
    if not postings:
        return _ExtractedFields()

    # Prefer the structured posting with the richest description.
    posting = max(
        postings,
        key=lambda item: len(_html_fragment_text(item.get("description")) or ""),
    )
    description = _html_fragment_text(posting.get("description"))
    return _ExtractedFields(
        title=_clean_text(str(posting.get("title"))) if posting.get("title") else None,
        company=_named_value(posting.get("hiringOrganization")),
        location=_json_ld_location(posting),
        description=description,
        extraction_method="json_ld" if _is_usable_description(description) else None,
    )


def _meta_content(soup: BeautifulSoup, selectors: tuple[str, ...]) -> str | None:
    for selector in selectors:
        element = soup.select_one(selector)
        if isinstance(element, Tag):
            content = element.get("content")
            if isinstance(content, str):
                cleaned = _clean_text(content)
                if cleaned:
                    return cleaned
    return None


def _first_element_text(soup: BeautifulSoup, selectors: tuple[str, ...]) -> str | None:
    for selector in selectors:
        value = _element_text(soup.select_one(selector))
        if value:
            return value
    return None


def _from_linkedin_page(soup: BeautifulSoup) -> _ExtractedFields:
    return _ExtractedFields(
        title=_first_element_text(soup, LINKEDIN_TITLE_SELECTORS),
        company=_first_element_text(soup, LINKEDIN_COMPANY_SELECTORS),
        location=_first_element_text(soup, LINKEDIN_LOCATION_SELECTORS),
    )


def _parse_linkedin_page_title(value: str | None) -> _ExtractedFields:
    cleaned = _clean_text(value)
    if not cleaned:
        return _ExtractedFields()

    match = LINKEDIN_TITLE_PATTERN.fullmatch(cleaned)
    if not match:
        return _ExtractedFields()

    return _ExtractedFields(
        company=_clean_text(match.group("company")),
        title=_clean_text(match.group("title")),
        location=_clean_text(match.group("location")),
    )


def _linkedin_metadata_title(value: str | None) -> _ExtractedFields:
    parsed = _parse_linkedin_page_title(value)
    if parsed.title:
        return parsed

    cleaned = _clean_text(value)
    if cleaned and not re.search(r"\|\s*LinkedIn\s*$", cleaned, re.IGNORECASE):
        return _ExtractedFields(title=cleaned)
    return _ExtractedFields()


def _from_metadata(soup: BeautifulSoup) -> _ExtractedFields:
    description = _meta_content(
        soup,
        (
            'meta[property="og:description"]',
            'meta[name="description"]',
            'meta[name="twitter:description"]',
        ),
    )
    return _ExtractedFields(
        title=_meta_content(
            soup,
            (
                'meta[property="og:title"]',
                'meta[name="twitter:title"]',
                'meta[name="title"]',
            ),
        ),
        company=_meta_content(
            soup,
            (
                'meta[name="company"]',
                'meta[property="job:hiringOrganization"]',
                'meta[name="author"]',
            ),
        ),
        location=_meta_content(
            soup,
            (
                'meta[name="job-location"]',
                'meta[name="location"]',
                'meta[property="job:location"]',
            ),
        ),
        description=description,
        extraction_method="metadata" if _is_usable_description(description) else None,
    )


def _is_usable_description(description: str | None) -> bool:
    if description is None or len(description) < MIN_DESCRIPTION_CHARACTERS:
        return False
    lowered = description.lower()
    return not (
        len(description) < 1_000
        and any(marker in lowered for marker in BLOCKED_PAGE_MARKERS)
    )


def _first_container_description(soup: BeautifulSoup) -> str | None:
    for selector in DESCRIPTION_SELECTORS:
        description = _element_text(soup.select_one(selector))
        if _is_usable_description(description):
            return description
    return None


def _generic_description(soup: BeautifulSoup) -> str | None:
    # Remove chrome and executable content before considering generic page text.
    for element in soup.select("script, style, noscript, nav, header, footer, form, aside"):
        element.decompose()

    for selector in ("main", "article", '[role="main"]', "body"):
        description = _element_text(soup.select_one(selector))
        if _is_usable_description(description):
            return description
    return None


def _source_site(source_url: str) -> str:
    parsed = urlsplit(source_url)
    if parsed.scheme.lower() not in {"http", "https"} or not parsed.hostname:
        raise InvalidSourceURLError("Source URL must be an absolute http or https URL")
    hostname = parsed.hostname.lower().rstrip(".")
    return hostname.removeprefix("www.")


def _is_linkedin_site(source_site: str) -> bool:
    return source_site == "linkedin.com" or source_site.endswith(".linkedin.com")


def extract_job_posting(html: str, source_url: str) -> ExtractedJobPosting:
    if not isinstance(html, str) or not html.strip():
        raise InvalidHTMLContentError("Fetched HTML is empty")

    source_site = _source_site(source_url)
    soup = BeautifulSoup(html, "html.parser")
    if soup.find() is None:
        raise InvalidHTMLContentError("Fetched content does not contain HTML")

    structured = _from_json_ld(soup)
    metadata = _from_metadata(soup)

    if _is_linkedin_site(source_site):
        linkedin_page = _from_linkedin_page(soup)
        metadata_title = _linkedin_metadata_title(metadata.title)
        page_title = _parse_linkedin_page_title(_element_text(soup.title))

        # Structured data remains authoritative; LinkedIn-only fallbacks fill gaps.
        title = (
            structured.title
            or linkedin_page.title
            or metadata_title.title
            or _element_text(soup.find("h1"))
            or page_title.title
        )
        company = (
            structured.company
            or linkedin_page.company
            or metadata.company
            or metadata_title.company
            or page_title.company
        )
        location = (
            structured.location
            or linkedin_page.location
            or metadata.location
            or metadata_title.location
            or page_title.location
        )
    else:
        title = structured.title or metadata.title
        if not title:
            title = _element_text(soup.find("h1")) or _element_text(soup.title)
        company = structured.company or metadata.company
        location = structured.location or metadata.location

    description = structured.description
    method = structured.extraction_method
    if not _is_usable_description(description):
        description = metadata.description
        method = metadata.extraction_method
    if not _is_usable_description(description):
        description = _first_container_description(soup)
        method = "job_description_container" if description else None
    if not _is_usable_description(description):
        description = _generic_description(soup)
        method = "main_content" if description else None

    if not description or not method:
        raise DescriptionExtractionError(
            "Could not identify a usable job description; pasted text is required"
        )

    return ExtractedJobPosting(
        title=title,
        company=company,
        location=location,
        description=description,
        source_url=source_url,
        source_site=source_site,
        extraction_method=method,
    )
