import { NavBar } from "@/components/NavBar";
import { ReportsTable } from "./ReportsTable";
import type { Job } from "@/types/Job";
import { ReportStats } from "./ReportStats";

type ReportsProps = {
  jobs: Job[];
};

export function Reports({ jobs }: ReportsProps) {

  return (
    <>
      <NavBar />
      <div className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold text-[#131200] mb-1">Reports</h1>
        <ReportStats jobs={jobs}/>
        <ReportsTable jobs={jobs}/>
      </div>
    </>
  );
}