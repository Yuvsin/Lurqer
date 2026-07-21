import { Link } from "react-router";

import { NavBar } from "@/components/NavBar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useJobs } from "@/hooks/useJobs";
import { useReports } from "@/hooks/useReports";
import { ReportStats } from "./ReportStats";
import { ReportsTable } from "./ReportsTable";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function Reports() {
  const reportsQuery = useReports();
  const jobsQuery = useJobs();
  const reports = reportsQuery.data ?? [];
  const jobs = jobsQuery.data ?? [];

  if (reportsQuery.isLoading) {
    return (
      <>
        <title>Lurqer - Reports</title>
        <NavBar />
        <main className="mx-auto flex min-h-[60vh] max-w-5xl items-center justify-center px-6 py-12">
          <div
            role="status"
            aria-live="polite"
            className="rounded-xl border border-[#ECE7D8] bg-[#F2F0EC] px-8 py-6 text-center"
          >
            <p className="text-base font-semibold text-[#392061]">Loading reports...</p>
            <p className="mt-1 text-xs text-[#9A98B5]">Retrieving your scan history</p>
          </div>
        </main>
      </>
    );
  }

  if (reportsQuery.error) {
    return (
      <>
        <title>Lurqer - Reports</title>
        <NavBar />
        <main className="mx-auto max-w-5xl px-6 py-12">
          <Alert variant="destructive" className="border-[#E8B7BA] bg-[#FDE2E3] p-4">
            <AlertTitle className="text-sm font-semibold">Reports could not be loaded</AlertTitle>
            <AlertDescription className="mt-1 text-[#7A1620]">
              {getErrorMessage(reportsQuery.error, "Please try again in a moment.")}
            </AlertDescription>
          </Alert>
          <Button
            type="button"
            variant="outline"
            className="mt-4 border-[#392061] text-[#392061]"
            disabled={reportsQuery.isFetching}
            onClick={() => void reportsQuery.refetch()}
          >
            {reportsQuery.isFetching ? "Retrying..." : "Try again"}
          </Button>
        </main>
      </>
    );
  }

  return (
    <>
      <title>Lurqer - Reports</title>
      <NavBar />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="mb-1 text-2xl font-semibold text-[#131200]">Reports</h1>
        <p className="mb-6 text-sm text-[#5B5750]">Your complete job-posting scan history.</p>

        {reports.length === 0 ? (
          <section className="rounded-xl border border-[#ECE7D8] bg-[#F2F0EC] px-6 py-12 text-center">
            <h2 className="text-xl font-semibold text-[#131200]">No reports yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#5B5750]">
              Scan a job posting to create your first security report.
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
            <ReportStats reports={reports} />
            {jobsQuery.error && (
              <p role="status" className="mb-3 text-xs text-[#8A5A0A]">
                Some related job details are unavailable, but your reports are still shown.
              </p>
            )}
            <ReportsTable reports={reports} jobs={jobs} />
          </>
        )}
      </main>
    </>
  );
}
