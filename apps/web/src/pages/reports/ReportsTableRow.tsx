import { TableRow, TableCell } from "@/components/ui/table";
import type { Job } from "@/types/Job";

type ReportsTableRowProps = {
  job: Job;
  loadJobs: () => Promise<void>;
};

export function ReportsTableRow({job, loadJobs} : ReportsTableRowProps){
  return (
    <>
      <TableRow className="hover:bg-[#FAF9F6] cursor-pointer">
        <TableCell className="font-medium text-[#131200]">{job.company}</TableCell>
        <TableCell className="text-[#5B5750]"><RiskBadge riskLevel={job.riskLevel} /></TableCell>
        <TableCell>Phishing</TableCell>
      </TableRow>
    </>
  );
}

function RiskBadge({ riskLevel }) {
  const riskStyles = {
    Low: "bg-[#E4F3EB] text-[#1A6B45]",
    Medium: "bg-[#FCF0D8] text-[#8A5A0A]",
    High: "bg-[#FDE2E3] text-[#B0212B]",
  };

  return (
    <span
      className={`rounded-md px-2 py-1 text-xs ${riskStyles[riskLevel] ?? "bg-gray-100 text-gray-700"
        }`}
    >
      {riskLevel}
    </span>
  );
}