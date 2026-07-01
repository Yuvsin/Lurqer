import { NavBar } from "@/components/NavBar";
import { ReportsTable } from "./ReportsTable";
import type { Job } from "@/types/Job";

//Reports — this is where individual risk reports live (the findings panel 
//you saw in the mockup, evidence + severity for a specific application), plus 
//maybe aggregate insights over time ("you've flagged 5 high-risk postings 
//this month," "most common scam pattern you've encountered"). This is 
//also a natural home for your evaluation/methodology data if you want
//a public-facing "how detection works" page later.

type ReportsProps = {
  jobs: Job[];
  loadJobs: () => Promise<void>;
};

export function Reports({jobs, loadJobs} : ReportsProps) {
  return (
    <>
      <NavBar/>
      <div className="mx-auto max-w-5xl px-6 py-8">

        <h1 className="text-2xl font-semibold text-[#131200]">
          Reports
        </h1>

        <ReportsTable jobs={jobs} loadJobs={loadJobs}/>
      </div>
    </>


  );
}