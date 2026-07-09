import { TableCell, TableRow } from "@/components/ui/table";
import { RiskBadge } from "@/components/RiskBadge";
import type { Job, JobStatus } from "@/types/Job";

type JobTableRowProps = {
  job: Job;
  loadJobs: () => Promise<void>;
};

const statusStyles: Record<JobStatus, string> = {
  Applied: "bg-[#F2F0EC] text-[#5B5750]",
  Screening: "bg-[#E4F3EB] text-[#145235]",
  Interview: "bg-[#ECE7D8] text-[#392061]",
  Offer: "bg-[#E4F3EB] text-[#1A6B45]",
  Rejected: "bg-[#FDE2E3] text-[#7A1620]",
  Ghosted: "bg-[#FCF0D8] text-[#6B4407]",
  "No response": "bg-[#FCF0D8] text-[#8A5A0A]",
};

export function JobTableRow({ job, loadJobs }: JobTableRowProps) {
  async function handleRefresh() {
    await loadJobs();
  }

  handleRefresh();

  return (
    <TableRow className="hover:bg-[#FAF9F6]">
      <TableCell className="font-medium text-[#131200]">{job.company}</TableCell>
      <TableCell className="text-[#5B5750]">{job.title}</TableCell>
      <TableCell>
        <span className={`rounded-md px-2 py-1 text-xs font-medium ${statusStyles[job.status]}`}>
          {job.status}
        </span>
      </TableCell>
      <TableCell className="text-[#5B5750]">{job.platform}</TableCell>
      <TableCell className="text-[#5B5750]">{job.date}</TableCell>
      <TableCell><RiskBadge riskLevel={job.riskLevel} /></TableCell>
    </TableRow>
  );
}
