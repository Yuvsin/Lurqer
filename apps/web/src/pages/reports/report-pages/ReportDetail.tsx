import { useParams, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { NavBar } from "@/components/NavBar";
import { mockJobs } from "@/mockJobs";
import { ReportCategories, type ReportCategory } from "./ReportCategories";
import { ReportFindings } from "./ReportFindings";
import { ReportHeader } from "./ReportHeader";

export function ReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const job = mockJobs.find(j => j.id === Number(id));

  if (!job) {
    return (
      <>
        <NavBar />
        <div className="max-w-5xl mx-auto px-6 py-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/reports")}
            className="text-[#9A98B5] hover:text-[#5B5750] mb-5 px-0 cursor-pointer"
          >
            ← Reports
          </Button>
          <p className="text-[#5B5750]">Report not found.</p>
        </div>
      </>
    );
  }

  const categories: ReportCategory[] = job.categories ? [
    { key: "phishing", label: "Phishing", score: job.categories.phishing },
    { key: "fakeRecruiter", label: "Fake recruiter", score: job.categories.fakeRecruiter },
    { key: "scam", label: "Scam / harvest", score: job.categories.scam },
    { key: "ghost", label: "Ghost posting", score: job.categories.ghost },
  ] : [];

  return (
    <>
      <NavBar />
      <div className="max-w-5xl mx-auto px-6 py-8">

        <Button
          variant="ghost"
          onClick={() => navigate("/reports")}
          className="text-[#9A98B5] hover:text-[#5B5750] mb-5 px-0 cursor-pointer"
        >
          ← Reports
        </Button>

        <ReportHeader
          company={job.company}
          title={job.title}
          platform={job.platform}
          date={job.dateApplied ?? job.date}
          riskLevel={job.riskLevel}
          scanDate={job.scanDate}
          onRescan={() => console.log("rescan", job.id)} // swap for real handler later
        />

        <ReportCategories categories={categories} />

        <ReportFindings findings={job.findings} />

      </div>
    </>
  );
}
