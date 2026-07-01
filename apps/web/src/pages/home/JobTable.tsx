import type { Job } from "@/types/Job";
import { Table, TableHeader, TableBody, TableHead, TableRow } from "@/components/ui/table";
import { JobTableRow } from "./JobTableRow";

type JobTableProps = {
  jobs: Job[];
  loadJobs: () => Promise<void>;
};

export function JobTable({ jobs, loadJobs }: JobTableProps) {
  return (
    <div>
      <div className="border border-[#ECE7D8] rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#F2F0EC] hover:bg-[#F2F0EC]">
              <TableHead className="text-[#5B5750] font-semibold">Company</TableHead>
              <TableHead className="text-[#5B5750] font-semibold">Title</TableHead>
              <TableHead className="text-[#5B5750] font-semibold">Platform</TableHead>
              <TableHead className="text-[#5B5750] font-semibold">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => (
              <JobTableRow key={job.id} job={job} loadJobs={loadJobs}/>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}