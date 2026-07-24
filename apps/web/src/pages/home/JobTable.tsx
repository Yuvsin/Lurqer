import { useState } from "react";
import type { Job, JobStatus } from "@/types/Job";
import { Table, TableHeader, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { JobTableRow } from "./JobTableRow";

type JobTableProps = {
  jobs: Job[];
  onStatusChange: (job: Job, status: JobStatus) => void;
  onDelete: (job: Job) => void;
  updatingJobId?: string;
  deletingJobId?: string;
  actionsDisabled: boolean;
};

const PAGE_SIZE = 10;

export function JobTable({
  jobs,
  onStatusChange,
  onDelete,
  updatingJobId,
  deletingJobId,
  actionsDisabled,
}: JobTableProps) {
  const [page, setPage] = useState(0);

  const totalPages = Math.ceil(jobs.length / PAGE_SIZE);
  const lastPage = Math.max(totalPages - 1, 0);
  const currentPage = Math.min(page, lastPage);
  const paginated = jobs.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-[#ECE7D8]">
        <Table className="min-w-[760px]">
          <TableHeader>
            <TableRow className="bg-[#F2F0EC] hover:bg-[#F2F0EC]">
              <TableHead className="text-center text-[#5B5750] font-semibold">Company</TableHead>
              <TableHead className="text-center text-[#5B5750] font-semibold">Title</TableHead>
              <TableHead className="text-center text-[#5B5750] font-semibold">Status</TableHead>
              <TableHead className="text-center text-[#5B5750] font-semibold">Platform</TableHead>
              <TableHead className="text-center text-[#5B5750] font-semibold">Date</TableHead>
              <TableHead className="text-center text-[#5B5750] font-semibold">Risk</TableHead>
              <TableHead className="text-center text-[#5B5750] font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length > 0 ? (
              paginated.map((job) => (
                <JobTableRow
                  key={job.id}
                  job={job}
                  onStatusChange={onStatusChange}
                  onDelete={onDelete}
                  isUpdating={updatingJobId === job.id}
                  isDeleting={deletingJobId === job.id}
                  actionsDisabled={actionsDisabled}
                />
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-[#5B5750]">
                  No applications match this filter.
                </TableCell>
              </TableRow>
            )}
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
