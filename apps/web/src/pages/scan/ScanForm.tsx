import type { SubmitEventHandler } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export interface ManualScanFields {
  title: string;
  company: string;
  description: string;
  sourceUrl: string;
  sourceSite: string;
}

interface ScanFormProps {
  url: string;
  placeholder: string;
  urlValidationError: string | null;
  scanError: string | null;
  manualValidationError: string | null;
  manualFields: ManualScanFields;
  showFallback: boolean;
  fallbackWasRequired: boolean;
  isScanning: boolean;
  urlIsPending: boolean;
  textIsPending: boolean;
  onUrlChange: (value: string) => void;
  onManualFieldChange: (field: keyof ManualScanFields, value: string) => void;
  onUrlSubmit: SubmitEventHandler<HTMLFormElement>;
  onTextSubmit: SubmitEventHandler<HTMLFormElement>;
  onOpenFallback: () => void;
  onCloseFallback: () => void;
}

export function ScanForm({
  url,
  placeholder,
  urlValidationError,
  scanError,
  manualValidationError,
  manualFields,
  showFallback,
  fallbackWasRequired,
  isScanning,
  urlIsPending,
  textIsPending,
  onUrlChange,
  onManualFieldChange,
  onUrlSubmit,
  onTextSubmit,
  onOpenFallback,
  onCloseFallback,
}: ScanFormProps) {
  return (
    <>
      <Card className="mb-4 rounded-xl border-[#ECE7D8] bg-[#F2F0EC] p-6">
        <form onSubmit={onUrlSubmit} noValidate>
          <label htmlFor="scan-url" className="mb-2 block text-sm font-semibold text-[#5B5750]">
            Job posting URL
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              id="scan-url"
              type="url"
              value={url}
              onChange={(event) => onUrlChange(event.target.value)}
              placeholder={placeholder}
              aria-invalid={Boolean(urlValidationError)}
              className="h-10 flex-1 border-[#9A98B5] bg-white px-3 text-sm text-[#131200] placeholder:text-[#9A98B5] focus-visible:border-[#392061] focus-visible:ring-[#392061]/25"
            />
            <Button
              type="submit"
              disabled={isScanning}
              className="h-10 rounded-lg bg-[#392061] px-5 text-sm text-[#FAF0CA] hover:bg-[#2a1648]"
            >
              {urlIsPending ? "Scanning..." : "Scan URL"}
            </Button>
          </div>
          {urlValidationError ? (
            <p className="mt-2 text-xs text-[#B0212B]" role="alert">{urlValidationError}</p>
          ) : null}
        </form>

        <div className="mt-4 border-t border-[#DCD7CB] pt-4 text-center">
          <button
            type="button"
            disabled={isScanning}
            onClick={onOpenFallback}
            className="text-xs font-medium text-[#392061] hover:underline disabled:cursor-not-allowed disabled:opacity-50"
          >
            Paste the job description instead
          </button>
        </div>
      </Card>

      {isScanning ? (
        <p className="mb-4 text-center text-sm font-medium text-[#392061]" role="status" aria-live="polite">
          {urlIsPending ? "Retrieving and scanning the posting..." : "Scanning the pasted posting..."}
        </p>
      ) : null}

      {scanError ? (
        <Alert variant="destructive" className="mb-4 border-[#F2B8BC] bg-[#FFF7F7] px-4 py-3">
          <AlertTitle>Scan could not be completed</AlertTitle>
          <AlertDescription>{scanError}</AlertDescription>
        </Alert>
      ) : null}

      {showFallback ? (
        <Card className="rounded-xl border-[#DCD7CB] bg-[#F2F0EC] p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-[#131200]">Paste job information</h2>
            <p className="mt-1 text-sm text-[#5B5750]">
              {fallbackWasRequired
                ? "The page was reachable, but its job description could not be extracted automatically."
                : "Use pasted text when a posting is unavailable by URL or you already have its description."}
            </p>
          </div>

          <form onSubmit={onTextSubmit} className="space-y-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="manual-title" className="mb-1.5 block text-xs font-semibold text-[#5B5750]">
                  Job title
                </label>
                <Input
                  id="manual-title"
                  value={manualFields.title}
                  maxLength={250}
                  onChange={(event) => onManualFieldChange("title", event.target.value)}
                  className="h-9 border-[#9A98B5] bg-white"
                />
              </div>
              <div>
                <label htmlFor="manual-company" className="mb-1.5 block text-xs font-semibold text-[#5B5750]">
                  Company
                </label>
                <Input
                  id="manual-company"
                  value={manualFields.company}
                  maxLength={200}
                  onChange={(event) => onManualFieldChange("company", event.target.value)}
                  className="h-9 border-[#9A98B5] bg-white"
                />
              </div>
            </div>

            <div>
              <label htmlFor="manual-description" className="mb-1.5 block text-xs font-semibold text-[#5B5750]">
                Job description <span className="text-[#B0212B]">Required</span>
              </label>
              <Textarea
                id="manual-description"
                required
                value={manualFields.description}
                maxLength={100000}
                onChange={(event) => onManualFieldChange("description", event.target.value)}
                aria-invalid={Boolean(manualValidationError)}
                className="min-h-40 resize-y border-[#9A98B5] bg-white text-sm"
                placeholder="Paste the complete job description here..."
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="manual-source-url" className="mb-1.5 block text-xs font-semibold text-[#5B5750]">
                  Source URL
                </label>
                <Input
                  id="manual-source-url"
                  type="url"
                  value={manualFields.sourceUrl}
                  onChange={(event) => onManualFieldChange("sourceUrl", event.target.value)}
                  className="h-9 border-[#9A98B5] bg-white"
                />
              </div>
              <div>
                <label htmlFor="manual-source-site" className="mb-1.5 block text-xs font-semibold text-[#5B5750]">
                  Source site
                </label>
                <Input
                  id="manual-source-site"
                  value={manualFields.sourceSite}
                  maxLength={100}
                  onChange={(event) => onManualFieldChange("sourceSite", event.target.value)}
                  placeholder="LinkedIn, Indeed..."
                  className="h-9 border-[#9A98B5] bg-white"
                />
              </div>
            </div>

            {manualValidationError ? (
              <p className="text-xs text-[#B0212B]" role="alert">{manualValidationError}</p>
            ) : null}

            <div className="flex flex-wrap justify-end gap-2 pt-1">
              {!fallbackWasRequired ? (
                <Button type="button" variant="ghost" disabled={isScanning} onClick={onCloseFallback}>
                  Cancel
                </Button>
              ) : null}
              <Button type="submit" disabled={isScanning} className="bg-[#392061] text-[#FAF0CA] hover:bg-[#2a1648]">
                {textIsPending ? "Scanning..." : "Scan pasted text"}
              </Button>
            </div>
          </form>
        </Card>
      ) : null}
    </>
  );
}
