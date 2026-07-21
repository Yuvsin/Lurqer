import axios from "axios";

interface BackendErrorDetail {
  code?: string;
  message?: string;
  manualEntryRequired?: boolean;
}

interface BackendErrorBody {
  detail?: string | BackendErrorDetail | Array<{ msg?: string }>;
}

export interface ScanErrorInfo {
  message: string;
  requiresManualEntry: boolean;
}

export function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function getScanError(error: unknown): ScanErrorInfo {
  if (!axios.isAxiosError<BackendErrorBody>(error)) {
    return {
      message: "The scan could not be completed. Please try again.",
      requiresManualEntry: false,
    };
  }

  if (!error.response) {
    return {
      message: "Lurqer could not reach the scanning service. Check your connection and try again.",
      requiresManualEntry: false,
    };
  }

  const { status, data } = error.response;
  const detail = data?.detail;
  const structuredDetail =
    detail && !Array.isArray(detail) && typeof detail === "object"
      ? detail
      : undefined;
  const code = structuredDetail?.code;
  const requiresManualEntry =
    code === "extraction_failed" && structuredDetail?.manualEntryRequired === true;

  if (requiresManualEntry) {
    return {
      message: "Lurqer reached the page but could not extract a usable job description. Paste the posting below to scan it manually.",
      requiresManualEntry: true,
    };
  }

  const messagesByCode: Record<string, string> = {
    unsafe_url: "Enter a safe, public HTTP or HTTPS job-posting URL.",
    invalid_url: "The source URL is invalid. Check it and try again.",
    fetch_failed: "Lurqer could not retrieve that page. The site may block automated access.",
    unsupported_content: "That URL did not return a supported HTML or text page.",
    response_too_large: "That page is too large to scan safely.",
    scan_conflict: "This posting was scanned at the same time elsewhere. Wait a moment and try again.",
    scan_failed: "The posting was retrieved, but the security scan could not be completed.",
    database_error: "The scan completed but could not be saved. Please try again.",
    url_too_long: "The source URL is too long to save.",
  };

  if (code && messagesByCode[code]) {
    return { message: messagesByCode[code], requiresManualEntry: false };
  }

  if (status === 401) {
    return {
      message: "Your Lurqer session is no longer valid. Refresh the page and try again.",
      requiresManualEntry: false,
    };
  }

  if (status === 409) {
    return {
      message: "This posting could not be saved because another scan changed it. Please try again.",
      requiresManualEntry: false,
    };
  }

  if (status === 422) {
    const validationMessage = Array.isArray(detail) ? detail[0]?.msg : undefined;
    return {
      message: validationMessage ?? "Some scan information is missing or invalid.",
      requiresManualEntry: false,
    };
  }

  return {
    message:
      typeof detail === "string"
        ? detail
        : "The scan could not be completed. Please try again.",
    requiresManualEntry: false,
  };
}
