import { useMemo, useState } from "react";
import { Link } from "react-router";
import { NavBar } from "../../components/NavBar";
import { FilterTable, type ApplicationFilter, type ApplicationSort, type SortDirection } from "./FilterTable";
import { JobTable } from "./JobTable";
import { Analytics } from "./Analytics";
import { LoadingPage } from "./LoadingPage";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useDeleteJob, useJobs, useUpdateJob } from "@/hooks/useJobs";
import type { Job, JobStatus } from "@/types/Job";

const activeStatuses: Job["status"][] = ["Applied", "Screening", "Interview"];
const ghostedStatuses: Job["status"][] = ["Ghosted", "No response"];
const riskRank: Record<Job["riskLevel"], number> = { High: 3, Medium: 2, Low: 1 };
const statusRank: Record<Job["status"], number> = {
  Saved: 0,
  Applied: 1,
  Screening: 2,
  Interview: 3,
  Offer: 4,
  Rejected: 5,
  Ghosted: 6,
  "No response": 7,
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function HomePage() {
  const { data: jobs = [], isLoading, error, refetch, isFetching } = useJobs();
  const updateJob = useUpdateJob();
  const deleteJob = useDeleteJob();
  const [activeFilter, setActiveFilter] = useState<ApplicationFilter>("All");
  const [activeSort, setActiveSort] = useState<ApplicationSort>();
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [actionError, setActionError] = useState<string>();

  const filteredJobs = useMemo(() => {
    const visibleJobs = (() => {
      switch (activeFilter) {
        case "Active":
          return jobs.filter((job) => activeStatuses.includes(job.status));
        case "Flagged":
          return jobs.filter((job) => job.riskLevel === "Medium" || job.riskLevel === "High");
        case "Ghosted":
          return jobs.filter((job) => ghostedStatuses.includes(job.status));
        default:
          return jobs;
      }
    })();

    if (!activeSort) {
      return visibleJobs;
    }

    return [...visibleJobs].sort((a, b) => {
      const modifier = sortDirection === "asc" ? 1 : -1;
      const comparison = (() => {
        switch (activeSort) {
          case "Company":
            return a.company.localeCompare(b.company);
          case "Title":
            return a.title.localeCompare(b.title);
          case "Status":
            return statusRank[a.status] - statusRank[b.status];
          case "Platform":
            return a.platform.localeCompare(b.platform);
          case "Date":
            return Date.parse(b.date) - Date.parse(a.date);
          case "Risk":
            return riskRank[a.riskLevel] - riskRank[b.riskLevel];
        }
      })();

      return comparison * modifier;
    });
  }, [activeFilter, activeSort, jobs, sortDirection]);

  const handleStatusChange = (job: Job, status: JobStatus) => {
    if (updateJob.isPending || status === job.status) {
      return;
    }

    setActionError(undefined);
    updateJob.mutate(
      { jobId: job.id, updates: { status } },
      {
        onError: (mutationError) => {
          setActionError(
            getErrorMessage(mutationError, `Unable to update ${job.company}'s status.`),
          );
        },
      },
    );
  };

  const handleDelete = (job: Job) => {
    if (deleteJob.isPending || updateJob.isPending) {
      return;
    }

    const confirmed = window.confirm(
      `Delete ${job.title} at ${job.company}? Its scan reports will also be deleted.`,
    );

    if (!confirmed) {
      return;
    }

    setActionError(undefined);
    deleteJob.mutate(job.id, {
      onError: (mutationError) => {
        setActionError(
          getErrorMessage(mutationError, `Unable to delete ${job.title} at ${job.company}.`),
        );
      },
    });
  };

  if (isLoading) {
    return <LoadingPage />;
  }

  if (error) {
    return (
      <>
        <title>Lurqer - Home</title>
        <NavBar />
        <main className="mx-auto max-w-5xl px-8 py-12">
          <Alert variant="destructive" className="border-[#E8B7BA] bg-[#FDE2E3] p-4">
            <AlertTitle className="text-sm font-semibold">Jobs could not be loaded</AlertTitle>
            <AlertDescription className="mt-1 text-[#7A1620]">
              {getErrorMessage(error, "Please try again in a moment.")}
            </AlertDescription>
          </Alert>
          <Button
            type="button"
            variant="outline"
            className="mt-4 border-[#392061] text-[#392061]"
            disabled={isFetching}
            onClick={() => void refetch()}
          >
            {isFetching ? "Retrying..." : "Try again"}
          </Button>
        </main>
      </>
    );
  }

  return (
    <>
      <title>Lurqer - Home</title>
      <NavBar />
      <div className="max-w-5xl mx-auto px-8 pb-20">
        <Analytics jobs={jobs} />
        {jobs.length === 0 ? (
          <section className="mt-4 rounded-xl border border-[#ECE7D8] bg-[#F2F0EC] px-6 py-12 text-center">
            <h1 className="text-xl font-semibold text-[#131200]">No applications yet</h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#5B5750]">
              Scan a job posting to save it to your application tracker.
            </p>
            <Link
              to="/scan"
              className="mt-5 inline-flex h-8 items-center justify-center rounded-md bg-[#392061] px-4 text-xs font-medium text-[#FAF0CA] transition-colors hover:bg-[#4B2A7D]"
            >
              Scan a job
            </Link>
          </section>
        ) : (
          <>
            <FilterTable
              activeFilter={activeFilter}
              activeSort={activeSort}
              sortDirection={sortDirection}
              onFilterChange={setActiveFilter}
              onSortChange={setActiveSort}
              onSortDirectionChange={setSortDirection}
            />
            {actionError && (
              <Alert variant="destructive" className="mb-4 border-[#E8B7BA] bg-[#FDE2E3] p-3">
                <AlertTitle>Application update failed</AlertTitle>
                <AlertDescription className="text-[#7A1620]">{actionError}</AlertDescription>
              </Alert>
            )}
            <JobTable
              jobs={filteredJobs}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
              updatingJobId={updateJob.isPending ? updateJob.variables?.jobId : undefined}
              deletingJobId={deleteJob.isPending ? deleteJob.variables : undefined}
              actionsDisabled={updateJob.isPending || deleteJob.isPending}
            />
          </>
        )}
      </div >
    </>
  );
}
