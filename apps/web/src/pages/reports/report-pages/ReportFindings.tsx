import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Finding, PositiveSignal, Severity } from "@/types/Job";

type FindingStyle = {
  border: string;
  label: string;
  points: string;
};

const findingStyles: Record<Severity, FindingStyle> = {
  High: { border: "border-[#FDE2E3]", label: "text-[#B0212B]", points: "text-[#B0212B]" },
  Medium: { border: "border-[#FCF0D8]", label: "text-[#8A5A0A]", points: "text-[#8A5A0A]" },
  Low: { border: "border-[#ECE7D8]", label: "text-[#5B5750]", points: "text-[#5B5750]" },
};

type ReportFindingsProps = {
  findings?: Finding[] | null;
  qualityConcerns?: Finding[] | null;
  positiveSignals?: PositiveSignal[] | null;
};

function FindingSection({ title, findings, scored }: { title: string; findings: Finding[]; scored: boolean }) {
  return (
    <section className="mt-6 first:mt-0">
      <p className="mb-3 text-sm font-semibold text-[#131200]">{title}</p>

      <div className="flex flex-col gap-2">
        {findings.map((finding) => {
          const s = findingStyles[finding.severity];

          return (
            <Card key={finding.id} className={`rounded-xl border shadow-none ${s.border}`}>
              <CardContent className="p-4">

                <div className="mb-1.5 flex items-center justify-between">
                  <span className={`text-xs font-semibold ${s.label}`}>
                    {finding.severity} · {finding.category}
                  </span>
                  {scored && (
                    <span className={`text-xs font-medium ${s.points}`}>
                      +{finding.scoreImpact} pts
                    </span>
                  )}
                </div>

                <p className="mb-1 text-sm font-medium text-[#131200]">
                  {finding.title}
                </p>

                <p className="mb-1.5 text-xs text-[#5B5750]">
                  Evidence: <span className="rounded bg-[#F2F0EC] px-1.5 py-0.5 text-[#131200]">
                    {finding.evidence}</span>
                </p>

                <p className="mb-2 text-xs text-[#5B5750]">
                  {finding.explanation}
                </p>

                <Separator className="mb-2" />

                <p className="text-xs text-[#392061]">
                  {finding.recommendation}
                </p>
                <p className="mt-2 text-xs text-[#9A98B5]">
                  Confidence: {finding.confidence} · Rule: {finding.ruleId}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

export function ReportFindings({ findings, qualityConcerns, positiveSignals }: ReportFindingsProps) {
  const securityFindings = findings ?? [];
  const concerns = qualityConcerns ?? [];
  const signals = securityFindings.length === 0 ? positiveSignals ?? [] : [];

  return (
    <div>
      {securityFindings.length > 0 ? (
        <FindingSection title="Security findings" findings={securityFindings} scored />
      ) : (
        <div className="rounded-xl border border-[#ECE7D8] p-6 text-center">
          <p className="text-sm font-medium text-[#145235]">
            No concerning indicators were found in the available posting details.
          </p>
        </div>
      )}
      {concerns.length > 0 && (
        <FindingSection title="Job-quality concerns" findings={concerns} scored={false} />
      )}
      {signals.length > 0 && (
        <section className="mt-6 rounded-xl border border-[#D6E8DD] bg-[#F2F0EC] p-4">
          <h2 className="text-sm font-semibold text-[#145235]">Observable trust signals</h2>
          {signals.map((signal) => (
            <div key={signal.ruleId} className="mt-3 first:mt-2">
              <p className="text-sm font-medium text-[#131200]">{signal.title}</p>
              <p className="text-xs text-[#5B5750]">{signal.description}</p>
              <p className="mt-1 text-xs text-[#9A98B5]">{signal.evidence}</p>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
