// ReportHeader.tsx
import type { RiskLevel } from "@/types/Job";
import { RiskBadge } from "@/components/RiskBadge";


type ReportHeaderProps = {
  company: string;
  title: string;
  platform: string;
  date: string;
  riskLevel: RiskLevel;
  scanDate?: string;
  onRescan: () => void;
};

export function ReportHeader({
  company,
  title,
  platform,
  date,
  riskLevel,
  scanDate,
  onRescan,
}: ReportHeaderProps) {
  return (
    <>
      <div className="flex items-start justify-between mb-1">
        <div>
          <h1 className="text-xl font-semibold text-[#131200]">{company}</h1>
          <p className="text-sm text-[#5B5750] mt-0.5">
            {title} · {platform} · Applied {date}
          </p>
        </div>
        <RiskBadge riskLevel={riskLevel} />
      </div>
      <p className="text-xs text-[#9A98B5] mb-6">
        {scanDate ? `Scanned ${scanDate}` : "Not yet scanned"} ·{" "}
        <button onClick={onRescan} className="text-[#392061] hover:underline">
          Rescan
        </button>
      </p>
    </>
  );
}