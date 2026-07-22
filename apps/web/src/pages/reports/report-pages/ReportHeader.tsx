import { RiskBadge } from "@/components/RiskBadge";
import type { RiskLevel } from "@/types/Job";

type ReportHeaderProps = {
  company: string;
  title: string;
  platform?: string;
  dateApplied?: string | null;
  riskLevel: RiskLevel;
  overallScore: number;
  scanDate?: string | null;
  topFinding?: string | null;
};

function formatDate(value?: string | null, includeTime = false) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toLocaleString(
    undefined,
    includeTime
      ? { dateStyle: "medium", timeStyle: "short" }
      : { dateStyle: "medium" },
  );
}

export function ReportHeader({
  company,
  title,
  platform,
  dateApplied,
  riskLevel,
  overallScore,
  scanDate,
  topFinding,
}: ReportHeaderProps) {
  const appliedDate = formatDate(dateApplied);
  const formattedScanDate = formatDate(scanDate, true);

  return (
    <header className="mb-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#131200]">{company}</h1>
          <p className="mt-0.5 text-sm text-[#5B5750]">
            {[title, platform].filter(Boolean).join(" - ")}
          </p>
          {appliedDate && (
            <p className="mt-1 text-xs text-[#9A98B5]">Applied {appliedDate}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <RiskBadge riskLevel={riskLevel} />
          <div className="text-right">
            <p className="text-2xl font-bold text-[#392061]">{overallScore}</p>
            <p className="text-xs text-[#9A98B5]">overall score</p>
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs text-[#9A98B5]">
        {formattedScanDate ? `Scanned ${formattedScanDate}` : "Scan date unavailable"}
      </p>

      <div className="mt-4 rounded-xl border border-[#ECE7D8] bg-[#F2F0EC] p-4">
        <p className="text-xs font-semibold uppercase text-[#9A98B5]">Top finding</p>
        <p className="mt-1 text-sm font-medium text-[#131200]">
          {topFinding ?? "No concerning indicators were found in the available posting details."}
        </p>
      </div>
    </header>
  );
}
