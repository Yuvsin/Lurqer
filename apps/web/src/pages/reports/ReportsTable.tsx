import { useState } from "react";
import type { Job } from "@/types/Job";
import { Button } from "@/components/ui/button";
import { ReportsTableRow } from "./ReportsTableRow";

type ReportsTableProps = {
  jobs: Job[];
};

const PAGE_SIZE = 10;
const isScanned = (job: Job) => Boolean(job.categories || job.overallScore !== undefined);

export function ReportsTable({ jobs }: ReportsTableProps) {
  const [page, setPage] = useState(0);
  const scannedJobs = jobs.filter(isScanned);

  const totalPages = Math.ceil(scannedJobs.length / PAGE_SIZE);
  const lastPage = Math.max(totalPages - 1, 0);
  const currentPage = Math.min(page, lastPage);

  const paginatedJobs = scannedJobs.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE
  );

  const showingStart = scannedJobs.length === 0 ? 0 : currentPage * PAGE_SIZE + 1;
  const showingEnd = Math.min((currentPage + 1) * PAGE_SIZE, scannedJobs.length);

  return (
    <div>
      <div className="flex flex-col gap-3 rounded-xl border border-[#ECE7D8] bg-[#FAFAF8] p-3">
        {paginatedJobs.length > 0 ? (
          paginatedJobs.map((job) => (
            <ReportsTableRow key={job.id} job={job} />
          ))
        ) : (
          <div className="rounded-xl border border-[#ECE7D8] bg-[#F2F0EC] p-6 text-center">
            <p className="text-sm font-medium text-[#131200]">
              No reports yet
            </p>
            <p className="mt-1 text-xs text-[#9A98B5]">
              Scanned job postings will show up here.
            </p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-between px-1">
          <p className="text-xs text-[#9A98B5]">
            Showing {showingStart}-{showingEnd} of {scannedJobs.length}
          </p>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(p - 1, 0))}
              disabled={currentPage === 0}
              className="border-[#ECE7D8] text-xs text-[#392061] disabled:opacity-40"
            >
              Previous
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(p + 1, lastPage))}
              disabled={currentPage === lastPage}
              className="border-[#ECE7D8] text-xs text-[#392061] disabled:opacity-40"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
