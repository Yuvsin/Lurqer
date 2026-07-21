import type { Report } from "@/types/Report";

type ReportStatsProps = {
  reports: Report[];
};

function getMostCommonFinding(reports: Report[]) {
  const counts = new Map<string, number>();

  for (const report of reports) {
    for (const finding of report.findings ?? []) {
      const title = finding.title.trim();
      if (title) {
        counts.set(title, (counts.get(title) ?? 0) + 1);
      }
    }
  }

  return [...counts.entries()].sort(
    ([titleA, countA], [titleB, countB]) =>
      countB - countA || titleA.localeCompare(titleB),
  )[0]?.[0] ?? "None detected";
}

export function ReportStats({ reports }: ReportStatsProps) {
  const uniqueJobs = new Set(reports.map((report) => report.jobId)).size;
  const highRiskReports = reports.filter(
    (report) => report.riskLevel === "High",
  ).length;
  const mostCommonFinding = getMostCommonFinding(reports);

  return (
    <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <div className="rounded-xl bg-[#F2F0EC] p-3">
        <p className="mb-1 text-xs text-[#5B5750]">Total reports</p>
        <p className="text-xl font-semibold text-[#131200]">{reports.length}</p>
      </div>
      <div className="rounded-xl bg-[#ECE7D8] p-3">
        <p className="mb-1 text-xs text-[#5B5750]">Unique jobs</p>
        <p className="text-xl font-semibold text-[#392061]">{uniqueJobs}</p>
      </div>
      <div className="rounded-xl bg-[#FDE2E3] p-3">
        <p className="mb-1 text-xs text-[#B0212B]">High-risk reports</p>
        <p className="text-xl font-semibold text-[#7A1620]">{highRiskReports}</p>
      </div>
      <div className="min-w-0 rounded-xl bg-[#FCF0D8] p-3">
        <p className="mb-1 text-xs text-[#8A5A0A]">Most common finding</p>
        <p
          className="truncate text-sm font-semibold text-[#6B4407]"
          title={mostCommonFinding}
        >
          {mostCommonFinding}
        </p>
      </div>
    </div>
  );
}
