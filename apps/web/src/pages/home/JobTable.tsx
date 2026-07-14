import { useState } from "react";
import type { Job } from "@/types/Job";
import { Table, TableHeader, TableBody, TableHead, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { JobTableRow } from "./JobTableRow";

type JobTableProps = {
  jobs: Job[];
};

const PAGE_SIZE = 10;

export function JobTable({ jobs }: JobTableProps) {
  const [page, setPage] = useState(0);

  const totalPages = Math.ceil(jobs.length / PAGE_SIZE);
  const lastPage = Math.max(totalPages - 1, 0);
  const currentPage = Math.min(page, lastPage);
  const paginated = jobs.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  return (
    <div>
      <div className="border border-[#ECE7D8] rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#F2F0EC] hover:bg-[#F2F0EC]">
              <TableHead className="text-[#5B5750] font-semibold">Company</TableHead>
              <TableHead className="text-[#5B5750] font-semibold">Title</TableHead>
              <TableHead className="text-[#5B5750] font-semibold">Status</TableHead>
              <TableHead className="text-[#5B5750] font-semibold">Platform</TableHead>
              <TableHead className="text-[#5B5750] font-semibold">Date</TableHead>
              <TableHead className="text-[#5B5750] font-semibold">Risk</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map((job) => (
              <JobTableRow key={job.id} job={job} />
            ))}
          </TableBody>
        </Table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 px-1">
          <p className="text-xs text-[#9A98B5]">
            Showing {currentPage * PAGE_SIZE + 1}-{Math.min((currentPage + 1) * PAGE_SIZE, jobs.length)} of {jobs.length}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(p - 1, 0))}
              disabled={currentPage === 0}
              className="text-xs border-[#ECE7D8] text-[#392061] disabled:opacity-40"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(p + 1, lastPage))}
              disabled={currentPage === lastPage}
              className="text-xs border-[#ECE7D8] text-[#392061] disabled:opacity-40"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
