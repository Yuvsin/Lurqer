import { useEffect, useState, type SubmitEvent } from "react";

import { NavBar } from "@/components/NavBar";
import { useScanText, useScanUrl } from "@/hooks/useScans";
import type { ScanResponse } from "@/types/Scan";
import { ScanForm, type ManualScanFields } from "./ScanForm";
import { ScanResult } from "./ScanResult";
import { getScanError, isValidHttpUrl } from "./scanUtils";

const placeholders = [
  "https://www.indeed.com/viewjob...",
  "https://www.linkedin.com/jobs/...",
  "https://www.joinhandshake.com/jobs/...",
  "https://www.ziprecruiter.com/jobs/...",
];

export function Scan() {
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [url, setUrl] = useState("");
  const [urlValidationError, setUrlValidationError] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [showFallback, setShowFallback] = useState(false);
  const [fallbackWasRequired, setFallbackWasRequired] = useState(false);
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState("");
  const [manualSourceUrl, setManualSourceUrl] = useState("");
  const [sourceSite, setSourceSite] = useState("");
  const [manualValidationError, setManualValidationError] = useState<string | null>(null);
  const urlScan = useScanUrl();
  const textScan = useScanText();
  const isScanning = urlScan.isPending || textScan.isPending;

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setPlaceholderIndex((previous) => (previous + 1) % placeholders.length);
    }, 2500);

    return () => window.clearInterval(intervalId);
  }, []);

  const prepareForScan = () => {
    setResult(null);
    setScanError(null);
    setUrlValidationError(null);
    setManualValidationError(null);
    urlScan.reset();
    textScan.reset();
  };

  const openFallback = (required: boolean, sourceUrl = url.trim()) => {
    setShowFallback(true);
    setFallbackWasRequired(required);
    if (!manualSourceUrl && isValidHttpUrl(sourceUrl)) {
      setManualSourceUrl(sourceUrl);
    }
  };

  const handleUrlSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isScanning) return;

    const trimmedUrl = url.trim();
    prepareForScan();

    if (!trimmedUrl) {
      setUrlValidationError("Enter a job-posting URL.");
      return;
    }

    if (!isValidHttpUrl(trimmedUrl)) {
      setUrlValidationError("Enter a complete HTTP or HTTPS URL.");
      return;
    }

    setUrl(trimmedUrl);
    urlScan.mutate(
      { url: trimmedUrl },
      {
        onSuccess: (scanResult) => {
          setResult(scanResult);
          setShowFallback(false);
          setFallbackWasRequired(false);
        },
        onError: (error) => {
          const errorInfo = getScanError(error);
          setScanError(errorInfo.message);
          if (errorInfo.requiresManualEntry) {
            openFallback(true, trimmedUrl);
          }
        },
      },
    );
  };

  const handleTextSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isScanning) return;

    const trimmedDescription = description.trim();
    const trimmedSourceUrl = manualSourceUrl.trim();
    prepareForScan();

    if (!trimmedDescription) {
      setManualValidationError("Paste the job description before scanning.");
      return;
    }

    if (trimmedDescription.length < 20) {
      setManualValidationError("The job description must contain at least 20 characters.");
      return;
    }

    if (trimmedSourceUrl && !isValidHttpUrl(trimmedSourceUrl)) {
      setManualValidationError("The optional source URL must use HTTP or HTTPS.");
      return;
    }

    textScan.mutate(
      {
        description: trimmedDescription,
        title: title.trim() || undefined,
        company: company.trim() || undefined,
        sourceUrl: trimmedSourceUrl || undefined,
        sourceSite: sourceSite.trim() || undefined,
      },
      {
        onSuccess: (scanResult) => {
          setResult(scanResult);
          setScanError(null);
        },
        onError: (error) => {
          setScanError(getScanError(error).message);
        },
      },
    );
  };

  const handleUrlChange = (value: string) => {
    setUrl(value);
    setUrlValidationError(null);
  };

  const handleManualFieldChange = (field: keyof ManualScanFields, value: string) => {
    switch (field) {
      case "title":
        setTitle(value);
        break;
      case "company":
        setCompany(value);
        break;
      case "description":
        setDescription(value);
        setManualValidationError(null);
        break;
      case "sourceUrl":
        setManualSourceUrl(value);
        break;
      case "sourceSite":
        setSourceSite(value);
        break;
    }
  };

  const manualFields: ManualScanFields = {
    title,
    company,
    description,
    sourceUrl: manualSourceUrl,
    sourceSite,
  };

  return (
    <>
      <title>Lurqer - Scan</title>
      <NavBar />

      <main className="mx-auto max-w-2xl px-6 py-6 pb-20">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[#131200]">Scan a posting</h1>
          <p className="mt-1 text-sm text-[#5B5750]">
            Paste a job URL or description to check for phishing, fake recruiter, and scam indicators.
          </p>
        </div>

        <ScanForm
          url={url}
          placeholder={placeholders[placeholderIndex]}
          urlValidationError={urlValidationError}
          scanError={scanError}
          manualValidationError={manualValidationError}
          manualFields={manualFields}
          showFallback={showFallback}
          fallbackWasRequired={fallbackWasRequired}
          isScanning={isScanning}
          urlIsPending={urlScan.isPending}
          textIsPending={textScan.isPending}
          onUrlChange={handleUrlChange}
          onManualFieldChange={handleManualFieldChange}
          onUrlSubmit={handleUrlSubmit}
          onTextSubmit={handleTextSubmit}
          onOpenFallback={() => openFallback(false)}
          onCloseFallback={() => setShowFallback(false)}
        />

        {result ? <ScanResult result={result} /> : null}
      </main>
    </>
  );
}
