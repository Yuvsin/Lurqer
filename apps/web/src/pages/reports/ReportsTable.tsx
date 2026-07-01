import {
  Table, TableBody, TableHead,
  TableHeader, TableRow
} from "@/components/ui/table"
import { ReportsTableRow } from "./ReportsTableRow";
import type { Job } from "@/types/Job";

type ReportsTableProps = {
  jobs: Job[];
  loadJobs: () => Promise<void>;
};

export function ReportsTable({ jobs, loadJobs }: ReportsTableProps) {
  return (
    <div className="max-w-5xl mx-auto px-6 pb-8 pt-6">
      <div className="border border-[#ECE7D8] rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#F2F0EC] hover:bg-[#F2F0EC]">
              <TableHead className="text-[#5B5750] font-semibold">Company</TableHead>
              <TableHead className="text-[#5B5750] font-semibold">Risk Level</TableHead>
              <TableHead className="text-[#5B5750] font-semibold">Risk Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => (
              <ReportsTableRow key={job.id} job={job} loadJobs={loadJobs} />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}