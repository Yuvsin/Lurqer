import type { RiskLevel, Job } from "@/types/Job";

type ReportStatsProps = {
  jobs: Job[];
};

const isScanned = (job: Job) => Boolean(job.categories || job.overallScore !== undefined);

export function ReportStats({ jobs }: ReportStatsProps) {
  const scannedJobs = jobs.filter(isScanned);
  const count = (level: RiskLevel) => scannedJobs.filter(j => j.riskLevel === level).length;
  const unscanned = jobs.length - scannedJobs.length;

  return (
    <div className="grid grid-cols-4 gap-3 mb-8">
      <div className="bg-[#FDE2E3] rounded-xl p-3">
        <p className="text-xs text-[#B0212B] mb-1">High risk</p>
        <p className="text-xl font-semibold text-[#7A1620]">{count("High")}</p>
      </div>
      <div className="bg-[#FCF0D8] rounded-xl p-3">
        <p className="text-xs text-[#8A5A0A] mb-1">Medium risk</p>
        <p className="text-xl font-semibold text-[#6B4407]">{count("Medium")}</p>
      </div>
      <div className="bg-[#E4F3EB] rounded-xl p-3">
        <p className="text-xs text-[#1A6B45] mb-1">Low risk</p>
        <p className="text-xl font-semibold text-[#145235]">{count("Low")}</p>
      </div>
      <div className="bg-[#F2F0EC] rounded-xl p-3">
        <p className="text-xs text-[#5B5750] mb-1">Unscanned</p>
        <p className="text-xl font-semibold text-[#131200]">{unscanned}</p>
      </div>
    </div>
  );
}
