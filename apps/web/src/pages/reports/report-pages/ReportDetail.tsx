import { Link, useNavigate, useParams } from "react-router";

import { NavBar } from "@/components/NavBar";
import { RiskBadge } from "@/components/RiskBadge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useJob } from "@/hooks/useJobs";
import { useJobReports, useReport } from "@/hooks/useReports";
import type { Report } from "@/types/Report";
import { ReportCategories, type ReportCategory } from "./ReportCategories";
import { ReportFindings } from "./ReportFindings";
import { ReportHeader } from "./ReportHeader";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function formatScanDate(value?: string | null) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function ReportHistory({
  reports,
  currentReportId,
}: {
  reports: Report[];
  currentReportId: string;
}) {
  return (
    <section className="mt-8">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold text-[#131200]">Scan history</h2>
        <p className="text-xs text-[#9A98B5]">
          {reports.length} {reports.length === 1 ? "report" : "reports"}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {reports.map((report) => {
          const isCurrent = report.id === currentReportId;
          return (
            <Link
              key={report.id}
              to={`/reports/${report.id}`}
              aria-current={isCurrent ? "page" : undefined}
              className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#392061] ${
                isCurrent
                  ? "border-[#392061] bg-[#ECE7D8]"
                  : "border-[#ECE7D8] bg-[#F2F0EC] hover:bg-[#ECE7D8]"
              }`}
            >
              <div>
                <p className="text-xs font-medium text-[#131200]">
                  {formatScanDate(report.scanDate)}
                </p>
                {isCurrent && <p className="mt-0.5 text-xs text-[#392061]">Current report</p>}
              </div>
              <div className="flex items-center gap-3">
                <RiskBadge riskLevel={report.riskLevel} />
                <span className="min-w-8 text-right text-sm font-semibold text-[#392061]">
                  {report.overallScore}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function ReportDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const reportQuery = useReport(id);
  const report = reportQuery.data;
  const jobQuery = useJob(report?.jobId);
  const historyQuery = useJobReports(report?.jobId);

  if (reportQuery.isLoading) {
    return (
      <>
        <title>Lurqer - Report</title>
        <NavBar />
        <main className="mx-auto flex min-h-[60vh] max-w-5xl items-center justify-center px-6 py-12">
          <p role="status" className="text-sm font-medium text-[#392061]">Loading report...</p>
        </main>
      </>
    );
  }

  if (reportQuery.error || !report) {
    return (
      <>
        <title>Lurqer - Report unavailable</title>
        <NavBar />
        <main className="mx-auto max-w-5xl px-6 py-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/reports")}
            className="mb-5 px-0 text-[#392061]"
          >
            Back to reports
          </Button>
          <Alert variant="destructive" className="border-[#E8B7BA] bg-[#FDE2E3] p-4">
            <AlertTitle>Report unavailable</AlertTitle>
            <AlertDescription className="text-[#7A1620]">
              This report does not exist or is not accessible.
            </AlertDescription>
          </Alert>
        </main>
      </>
    );
  }

  const job = jobQuery.data;
  const categories: ReportCategory[] = report.categories
    ? [
        { key: "phishing", label: "Phishing", score: report.categories.phishing },
        {
          key: "fakeRecruiter",
          label: "Fake recruiter",
          score: report.categories.fakeRecruiter,
        },
        { key: "scam", label: "Scam / harvest", score: report.categories.scam },
        { key: "ghost", label: "Ghost posting", score: report.categories.ghost },
      ]
    : [];

  return (
    <>
      <title>Lurqer - Report</title>
      <NavBar />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/reports")}
          className="mb-5 px-0 text-[#392061]"
        >
          Back to reports
        </Button>

        {jobQuery.error && (
          <Alert className="mb-5 border-[#FAD89A] bg-[#FCF0D8] p-3">
            <AlertTitle>Related job details unavailable</AlertTitle>
            <AlertDescription className="text-[#6B4407]">
              The report is available, but its application metadata could not be loaded.
            </AlertDescription>
          </Alert>
        )}

        <ReportHeader
          company={job?.company ?? "Job report"}
          title={job?.title ?? "Job details unavailable"}
          platform={job?.platform}
          dateApplied={job?.dateApplied}
          riskLevel={report.riskLevel}
          overallScore={report.overallScore}
          scanDate={report.scanDate}
          topFinding={report.topFinding}
        />

        <ReportCategories categories={categories} />
        <ReportFindings findings={report.findings} />

        {historyQuery.isLoading && (
          <p role="status" className="mt-8 text-xs text-[#9A98B5]">Loading scan history...</p>
        )}
        {historyQuery.error && (
          <Alert variant="destructive" className="mt-8 border-[#E8B7BA] bg-[#FDE2E3] p-3">
            <AlertTitle>Scan history unavailable</AlertTitle>
            <AlertDescription className="text-[#7A1620]">
              {getErrorMessage(historyQuery.error, "This job's report history could not be loaded.")}
            </AlertDescription>
          </Alert>
        )}
        {historyQuery.data && (
          <ReportHistory reports={historyQuery.data} currentReportId={report.id} />
        )}
      </main>
    </>
  );
}
