from __future__ import annotations

import ipaddress
import socket
from urllib.parse import (
    parse_qsl,
    quote,
    urlencode,
    urljoin,
    urlsplit,
    urlunsplit,
)

import httpx

MAX_REDIRECTS = 5
MAX_RESPONSE_BYTES = 2_000_000
CONNECT_TIMEOUT_SECONDS = 3.0
READ_TIMEOUT_SECONDS = 5.0

REDIRECT_STATUS_CODES = {301, 302, 303, 307, 308}
ALLOWED_CONTENT_TYPES = {
    "application/xhtml+xml",
    "text/html",
    "text/plain",
}
TRACKING_QUERY_KEYS = {"fbclid", "gclid", "mc_cid", "mc_eid"}


class URLSecurityError(ValueError):
    """Base error for safe URL validation and fetching."""


class InvalidURLError(URLSecurityError):
    """The supplied URL is malformed or uses an unsupported form."""


class UnsafeDestinationError(URLSecurityError):
    """The URL resolves to a destination that must not be contacted."""


class UnsupportedContentTypeError(URLSecurityError):
    """The fetched resource is not useful HTML or plain text."""


class ResponseTooLargeError(URLSecurityError):
    """The fetched resource exceeds the configured size limit."""


class FetchError(URLSecurityError):
    """The remote resource could not be fetched safely."""


def _parsed_url(url: str):
    if not isinstance(url, str) or not url.strip():
        raise InvalidURLError("URL must be a non-empty string")
    if any(ord(character) < 32 or ord(character) == 127 for character in url):
        raise InvalidURLError("URL contains invalid control characters")

    try:
        parsed = urlsplit(url.strip())
        port = parsed.port
    except ValueError as error:
        raise InvalidURLError("URL is malformed") from error

    if parsed.scheme.lower() not in {"http", "https"}:
        raise InvalidURLError("Only http and https URLs are allowed")
    if not parsed.netloc or not parsed.hostname:
        raise InvalidURLError("URL must include a hostname")
    if parsed.username is not None or parsed.password is not None:
        raise InvalidURLError("URLs containing credentials are not allowed")
    if any(character.isspace() for character in parsed.netloc):
        raise InvalidURLError("URL hostname is malformed")
    if port is not None and not 1 <= port <= 65535:
        raise InvalidURLError("URL port is invalid")

    return parsed


def _canonical_hostname(hostname: str) -> str:
    try:
        return hostname.rstrip(".").encode("idna").decode("ascii").lower()
    except UnicodeError as error:
        raise InvalidURLError("URL hostname is malformed") from error


def _is_local_hostname(hostname: str) -> bool:
    return (
        hostname in {"localhost", "localhost.localdomain"}
        or hostname.endswith(".localhost")
        or hostname.endswith(".local")
    )


def resolve_public_ips(hostname: str) -> list[str]:
    canonical_hostname = _canonical_hostname(hostname)
    if _is_local_hostname(canonical_hostname):
        raise UnsafeDestinationError("Localhost destinations are not allowed")

    try:
        literal_ip = ipaddress.ip_address(canonical_hostname.strip("[]"))
        addresses = {literal_ip}
    except ValueError:
        try:
            results = socket.getaddrinfo(
                canonical_hostname,
                None,
                family=socket.AF_UNSPEC,
                type=socket.SOCK_STREAM,
            )
        except socket.gaierror as error:
            raise FetchError("URL hostname could not be resolved") from error

        addresses = {ipaddress.ip_address(result[4][0]) for result in results}

    if not addresses:
        raise FetchError("URL hostname did not resolve to an IP address")

    # Every DNS answer must be globally routable; one unsafe answer rejects the host.
    for address in addresses:
        if (
            address.is_private
            or address.is_loopback
            or address.is_link_local
            or address.is_multicast
            or address.is_unspecified
            or address.is_reserved
            or not address.is_global
        ):
            raise UnsafeDestinationError(
                "URL resolves to a non-public network address"
            )

    return sorted(str(address) for address in addresses)


def validate_url(url: str) -> None:
    parsed = _parsed_url(url)
    resolve_public_ips(parsed.hostname or "")


def normalize_url(url: str) -> str:
    parsed = _parsed_url(url)
    hostname = _canonical_hostname(parsed.hostname or "")
    scheme = parsed.scheme.lower()
    port = parsed.port
    default_port = (scheme == "http" and port == 80) or (
        scheme == "https" and port == 443
    )

    host_for_netloc = f"[{hostname}]" if ":" in hostname else hostname
    netloc = host_for_netloc if port is None or default_port else f"{host_for_netloc}:{port}"
    path = quote(parsed.path or "/", safe="/%:@!$&'()*+,;=-._~")
    if path != "/":
        path = path.rstrip("/")

    query_items = [
        (key, value)
        for key, value in parse_qsl(parsed.query, keep_blank_values=True)
        if not key.lower().startswith("utm_")
        and key.lower() not in TRACKING_QUERY_KEYS
    ]
    query = urlencode(sorted(query_items), doseq=True)
    return urlunsplit((scheme, netloc, path, query, ""))


def _validate_content_type(content_type_header: str) -> None:
    content_type = content_type_header.split(";", 1)[0].strip().lower()
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise UnsupportedContentTypeError(
            "URL did not return supported HTML or text content"
        )


def fetch_safe_html(url: str) -> str:
    current_url = normalize_url(url)
    timeout = httpx.Timeout(
        connect=CONNECT_TIMEOUT_SECONDS,
        read=READ_TIMEOUT_SECONDS,
        write=READ_TIMEOUT_SECONDS,
        pool=CONNECT_TIMEOUT_SECONDS,
    )
    headers = {
        "Accept": "text/html, application/xhtml+xml, text/plain;q=0.8",
        "User-Agent": "LurqerScanner/1.0",
    }

    try:
        # Redirects are followed manually so every new destination gets SSRF checks.
        with httpx.Client(
            timeout=timeout,
            follow_redirects=False,
            headers=headers,
            trust_env=False,
        ) as client:
            for redirect_count in range(MAX_REDIRECTS + 1):
                validate_url(current_url)
                with client.stream("GET", current_url) as response:
                    if response.status_code in REDIRECT_STATUS_CODES:
                        location = response.headers.get("location")
                        if not location:
                            raise FetchError("Redirect response has no destination")
                        if redirect_count == MAX_REDIRECTS:
                            raise FetchError("URL exceeded the redirect limit")

                        destination = urljoin(current_url, location)
                        validate_url(destination)
                        current_url = normalize_url(destination)
                        continue

                    if response.status_code < 200 or response.status_code >= 300:
                        raise FetchError("Remote server returned an unsuccessful status")

                    _validate_content_type(response.headers.get("content-type", ""))
                    content_length = response.headers.get("content-length")
                    if content_length is not None:
                        try:
                            if int(content_length) > MAX_RESPONSE_BYTES:
                                raise ResponseTooLargeError(
                                    "URL response exceeds the maximum size"
                                )
                        except ValueError as error:
                            raise FetchError("Remote server sent an invalid content length") from error

                    body = bytearray()
                    for chunk in response.iter_bytes():
                        body.extend(chunk)
                        if len(body) > MAX_RESPONSE_BYTES:
                            raise ResponseTooLargeError(
                                "URL response exceeds the maximum size"
                            )

                    encoding = response.encoding or "utf-8"
                    try:
                        return bytes(body).decode(encoding, errors="replace")
                    except LookupError as error:
                        raise FetchError("Remote server declared an invalid encoding") from error
    except URLSecurityError:
        raise
    except httpx.HTTPError as error:
        raise FetchError("URL could not be fetched") from error

    raise FetchError("URL could not be fetched")