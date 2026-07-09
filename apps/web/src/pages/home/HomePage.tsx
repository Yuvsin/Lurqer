import { useMemo, useState } from "react";
import { NavBar } from "../../components/NavBar";
import { FilterTable, type ApplicationFilter, type ApplicationSort, type SortDirection } from "./FilterTable";
import { JobTable } from "./JobTable";
import { Analytics } from "./Analytics";
import type { Job } from "@/types/Job";

type HomePageProps = {
  jobs: Job[];
  loadJobs: () => Promise<void>;
};

const activeStatuses: Job["status"][] = ["Applied", "Screening", "Interview"];
const ghostedStatuses: Job["status"][] = ["Ghosted", "No response"];
const riskRank: Record<Job["riskLevel"], number> = { High: 3, Medium: 2, Low: 1 };
const statusRank: Record<Job["status"], number> = {
  Applied: 1,
  Screening: 2,
  Interview: 3,
  Offer: 4,
  Rejected: 5,
  Ghosted: 6,
  "No response": 7,
};

export function HomePage({ jobs, loadJobs }: HomePageProps) {
  const [activeFilter, setActiveFilter] = useState<ApplicationFilter>("All");
  const [activeSort, setActiveSort] = useState<ApplicationSort>();
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

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

  return (
    <>
      <title>Lurqer - Home</title>
      <NavBar />
      <div className="max-w-5xl mx-auto px-8 pb-20">
        <Analytics jobs={jobs} />
        <FilterTable
          activeFilter={activeFilter}
          activeSort={activeSort}
          sortDirection={sortDirection}
          onFilterChange={setActiveFilter}
          onSortChange={setActiveSort}
          onSortDirectionChange={setSortDirection}
        />
        <JobTable jobs={filteredJobs} loadJobs={loadJobs} />
      </div >
    </>
  );
}
