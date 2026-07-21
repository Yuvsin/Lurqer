import type { Finding, Severity } from "@/types/Job";

const severityStyles: Record<Severity, string> = {
  High: "bg-[#FDE2E3] text-[#B0212B]",
  Medium: "bg-[#FCF0D8] text-[#8A5A0A]",
  Low: "bg-[#E4F3EB] text-[#1A6B45]",
};

function FindingRow({ finding }: { finding: Finding }) {
  return (
    <article className="border-t border-[#DCD7CB] py-4 first:border-t-0 first:pt-0 last:pb-0">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-md px-2 py-1 text-xs font-semibold ${severityStyles[finding.severity]}`}>
            {finding.severity}
          </span>
          <span className="text-xs font-medium text-[#5B5750]">{finding.category}</span>
        </div>
        <span className="text-xs font-semibold text-[#392061]">+{finding.points} points</span>
      </div>
      <h3 className="text-sm font-semibold text-[#131200]">{finding.title}</h3>
      <p className="mt-2 rounded-md bg-white px-3 py-2 text-xs text-[#5B5750]">
        <span className="font-semibold text-[#131200]">Evidence:</span> {finding.evidence}
      </p>
      <p className="mt-2 text-sm text-[#5B5750]">{finding.description}</p>
      <p className="mt-2 text-sm text-[#392061]">
        <span className="font-semibold">Recommendation:</span> {finding.recommendation}
      </p>
    </article>
  );
}

export function FindingsList({ findings }: { findings: Finding[] }) {
  return (
    <div className="mt-4 rounded-lg border border-[#ECE7D8] bg-[#F2F0EC] p-6">
      <h2 className="text-base font-semibold text-[#131200]">Findings</h2>
      {findings.length > 0 ? (
        <div className="mt-4">
          {findings.map((finding) => (
            <FindingRow key={finding.id} finding={finding} />
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm text-[#5B5750]">
          No suspicious signals were detected in this posting.
        </p>
      )}
    </div>
  );
}
