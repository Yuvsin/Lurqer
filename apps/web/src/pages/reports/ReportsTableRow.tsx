import { Link } from "react-router";

import { Badge } from "@/components/ui/badge";
import type { Job, RiskLevel } from "@/types/Job";
import type { Report } from "@/types/Report";

type ReportsTableRowProps = {
  report: Report;
  job?: Job;
};

const riskStyles: Record<
  RiskLevel,
  {
    border: string;
    badge: string;
    scoreColor: string;
    findingColor: string;
  }
> = {
  High: {
    border: "border-[#FDE2E3]",
    badge: "bg-[#FDE2E3] text-[#B0212B]",
    scoreColor: "text-[#7A1620]",
    findingColor: "text-[#B0212B]",
  },
  Medium: {
    border: "border-[#FCF0D8]",
    badge: "bg-[#FCF0D8] text-[#8A5A0A]",
    scoreColor: "text-[#6B4407]",
    findingColor: "text-[#8A5A0A]",
  },
  Low: {
    border: "border-[#ECE7D8]",
    badge: "bg-[#E4F3EB] text-[#1A6B45]",
    scoreColor: "text-[#145235]",
    findingColor: "text-[#5B5750]",
  },
};

function categoryStyle(score: number) {
  if (score >= 66) return "bg-[#FDE2E3] text-[#B0212B]";
  if (score >= 33) return "bg-[#FCF0D8] text-[#8A5A0A]";
  return "bg-[#E4F3EB] text-[#1A6B45]";
}

function formatScanDate(value?: string | null) {
  if (!value) return "Scan date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Scan date unavailable"
    : `Scanned ${date.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })}`;
}

export function ReportsTableRow({ report, job }: ReportsTableRowProps) {
  const styles = riskStyles[report.riskLevel];

  return (
    <Link
      to={`/reports/${report.id}`}
      className={`block rounded-xl border bg-[#F2F0EC] p-4 transition-colors hover:bg-[#ECE7D8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#392061] ${styles.border}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-[#131200]">
              {job?.company ?? "Job details unavailable"}
            </span>
            {job?.title && <span className="text-xs text-[#5B5750]">{job.title}</span>}
          </div>

          <div className="mb-3 flex flex-wrap gap-3 text-xs text-[#9A98B5]">
            {job?.platform && <span>{job.platform}</span>}
            <span>{formatScanDate(report.scanDate)}</span>
          </div>

          {report.categories && (
            <div className="flex flex-wrap gap-1.5">
              <Badge className={`rounded-full px-2 py-0.5 text-xs ${categoryStyle(report.categories.phishing)}`}>
                Phishing - {report.categories.phishing}
              </Badge>
              <Badge className={`rounded-full px-2 py-0.5 text-xs ${categoryStyle(report.categories.fakeRecruiter)}`}>
                Fake recruiter - {report.categories.fakeRecruiter}
              </Badge>
              <Badge className={`rounded-full px-2 py-0.5 text-xs ${categoryStyle(report.categories.scam)}`}>
                Scam - {report.categories.scam}
              </Badge>
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <Badge className={`rounded-full px-3 py-1 text-xs font-semibold ${styles.badge}`}>
            {report.riskLevel}
          </Badge>
          <span className={`text-lg font-bold ${styles.scoreColor}`}>{report.overallScore}</span>
          <span className="text-xs text-[#9A98B5]">overall</span>
        </div>
      </div>

      <div className={`mt-3 border-t border-[#DCD7CB] pt-2.5 text-xs ${styles.findingColor}`}>
        {report.topFinding ?? "No concerning indicators were found in the available posting details."}
      </div>
    </Link>
  );
}
