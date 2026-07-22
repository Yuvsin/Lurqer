import { RiskBadge } from "@/components/RiskBadge";
import { Card } from "@/components/ui/card";
import type { CategoryScores } from "@/types/Job";
import type { ScanResponse } from "@/types/Scan";
import { FindingsList } from "./FindingsList";

const categoryLabels: Array<[keyof CategoryScores, string]> = [
  ["phishing", "Phishing"],
  ["scam", "Scam"],
  ["fakeRecruiter", "Fake recruiter"],
];

function formatContext(result: ScanResponse) {
  const context = result.postingContext;
  const parts: string[] = [];
  if (context.postingDate) {
    parts.push(`Posting date: ${new Date(context.postingDate).toLocaleDateString(undefined, { dateStyle: "medium" })}`);
  }
  const firstSeen = new Date(context.firstSeen);
  const today = new Date();
  parts.push(
    firstSeen.toDateString() === today.toDateString()
      ? "First seen today"
      : `First seen ${firstSeen.toLocaleDateString(undefined, { dateStyle: "medium" })}`,
  );
  if (context.repeatCount > 1) parts.push(`Seen ${context.repeatCount} times`);
  return parts.join(" · ");
}

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
            {result.topFinding ?? "No concerning indicators were found in the available posting details."}
          </p>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {categoryLabels.map(([key, label]) => (
            <div key={key} className="rounded-md border border-[#DCD7CB] bg-white px-3 py-3">
              <p className="text-xs text-[#5B5750]">{label}</p>
              <p className="mt-1 text-lg font-semibold text-[#392061]">
                {result.categoryScores[key]}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-4 text-xs text-[#5B5750]">{formatContext(result)}</p>
        {result.postingContext.possibleReposting && (
          <p className="mt-1 text-xs text-[#8A5A0A]">Possible reposting pattern detected.</p>
        )}
      </Card>

      <FindingsList findings={result.findings} />
      {result.qualityConcerns.length > 0 && (
        <FindingsList
          findings={result.qualityConcerns}
          title="Job-quality concerns"
          scored={false}
        />
      )}
      {result.findings.length === 0 && result.positiveSignals.length > 0 && (
        <section className="mt-4 rounded-lg border border-[#D6E8DD] bg-[#F2F0EC] p-5">
          <h2 className="text-sm font-semibold text-[#145235]">Observable trust signals</h2>
          <div className="mt-2 space-y-2">
            {result.positiveSignals.map((signal) => (
              <div key={signal.ruleId}>
                <p className="text-sm font-medium text-[#131200]">{signal.title}</p>
                <p className="text-xs text-[#5B5750]">{signal.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}
