import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { Job } from "@/types/Job";
import type { Report } from "@/types/Report";
import { ReportsTableRow } from "./ReportsTableRow";

type ReportsTableProps = {
  reports: Report[];
  jobs: Job[];
};

const PAGE_SIZE = 10;

export function ReportsTable({ reports, jobs }: ReportsTableProps) {
  const [page, setPage] = useState(0);
  const jobsById = new Map(jobs.map((job) => [job.id, job]));

  const totalPages = Math.ceil(reports.length / PAGE_SIZE);
  const lastPage = Math.max(totalPages - 1, 0);
  const currentPage = Math.min(page, lastPage);
  const paginatedReports = reports.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE,
  );

  const showingStart = reports.length === 0 ? 0 : currentPage * PAGE_SIZE + 1;
  const showingEnd = Math.min((currentPage + 1) * PAGE_SIZE, reports.length);

  return (
    <div>
      <div className="flex flex-col gap-3 rounded-xl border border-[#ECE7D8] bg-[#FAFAF8] p-3">
        {paginatedReports.map((report) => (
          <ReportsTableRow
            key={report.id}
            report={report}
            job={jobsById.get(report.jobId)}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-between px-1">
          <p className="text-xs text-[#9A98B5]">
            Showing {showingStart}-{showingEnd} of {reports.length} reports
          </p>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((current) => Math.max(current - 1, 0))}
              disabled={currentPage === 0}
              className="border-[#ECE7D8] text-xs text-[#392061] disabled:opacity-40"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((current) => Math.min(current + 1, lastPage))}
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
