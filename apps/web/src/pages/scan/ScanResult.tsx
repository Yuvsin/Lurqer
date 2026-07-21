import { RiskBadge } from "@/components/RiskBadge";
import { Card } from "@/components/ui/card";
import type { CategoryScores } from "@/types/Job";
import type { ScanResponse } from "@/types/Scan";
import { FindingsList } from "./FindingsList";

const categoryLabels: Array<[keyof CategoryScores, string]> = [
  ["phishing", "Phishing"],
  ["scam", "Scam"],
  ["fakeRecruiter", "Fake recruiter"],
  ["ghost", "Ghost posting"],
];

export function ScanResult({ result }: { result: ScanResponse }) {
  return (
    <section aria-live="polite" className="mt-6">
      <Card className="border-[#DCD7CB] bg-[#F2F0EC] p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase text-[#9A98B5]">Scan complete</p>
            <h2 className="mt-1 text-xl font-semibold text-[#131200]">
              {result.job.company} - {result.job.title}
            </h2>
            <p className="mt-1 text-sm text-[#5B5750]">
              {result.source === "url" ? "URL scan" : "Pasted-text scan"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <RiskBadge riskLevel={result.riskLevel} />
            <div className="text-right">
              <p className="text-2xl font-bold text-[#392061]">{result.overallScore}</p>
              <p className="text-xs text-[#9A98B5]">overall score</p>
            </div>
          </div>
        </div>

        <div className="mt-5 border-y border-[#DCD7CB] py-4">
          <p className="text-xs font-semibold uppercase text-[#9A98B5]">Top finding</p>
          <p className="mt-1 text-sm font-medium text-[#131200]">
            {result.topFinding ?? "No suspicious signals were found."}
          </p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {categoryLabels.map(([key, label]) => (
            <div key={key} className="rounded-md border border-[#DCD7CB] bg-white px-3 py-3">
              <p className="text-xs text-[#5B5750]">{label}</p>
              <p className="mt-1 text-lg font-semibold text-[#392061]">
                {result.categoryScores[key]}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <FindingsList findings={result.findings} />
    </section>
  );
}
