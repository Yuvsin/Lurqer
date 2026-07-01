import { NavBar } from "../../components/NavBar";
import { FilterTable } from "./SortTable";
import { JobTable } from "./JobTable";
import { Analytics } from "./Analytics";
import type { Job } from "@/types/Job";

type HomePageProps = {
  jobs: Job[];
  loadJobs: () => Promise<void>;
};

export function HomePage({ jobs, loadJobs }: HomePageProps) {
  return (
    <>
      <title>Lurqer - Home</title>
      <NavBar />
      <Analytics/>
      <div className="max-w-5xl mx-auto px-8 pb-20">
        <FilterTable />
        <JobTable jobs={jobs} loadJobs={loadJobs}/>
      </div >
    </>
  );
}