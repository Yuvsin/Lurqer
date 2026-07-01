import { TableCell, TableRow } from "@/components/ui/table";
import type { Job } from "@/types/Job";

type JobTableRowProps = {
  job: Job;
  loadJobs: () => Promise<void>;
};

export function JobTableRow({ job, loadJobs }: JobTableRowProps) {
  async function handleRefresh() {
    await loadJobs();
  }

  return (
    <TableRow className="cursor-pointer hover:bg-[#FAF9F6]">
      <TableCell className="font-medium text-[#131200]">
        {job.company}</TableCell>

      <TableCell className="text-[#5B5750]">
        {job.title}</TableCell>

      <TableCell className="text-[#5B5750]">
        {job.platform}</TableCell>

      <TableCell className="text-[#5B5750]">
        {job.date}</TableCell>
    </TableRow>
  );
}
