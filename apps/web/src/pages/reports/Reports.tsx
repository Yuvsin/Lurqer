import { NavBar } from "@/components/NavBar";
import { ReportsTable } from "./ReportsTable";

//Reports — this is where individual risk reports live (the findings panel 
//you saw in the mockup, evidence + severity for a specific application), plus 
//maybe aggregate insights over time ("you've flagged 5 high-risk postings 
//this month," "most common scam pattern you've encountered"). This is 
//also a natural home for your evaluation/methodology data if you want
//a public-facing "how detection works" page later.

export function Reports() {
  return (
    <>
      <NavBar />
      <ReportsTable />
    </>

  );
}