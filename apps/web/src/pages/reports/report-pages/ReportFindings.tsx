import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Finding, Severity } from "@/types/Job";

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
};

export function ReportFindings({ findings }: ReportFindingsProps) {
  if (!findings || findings.length === 0) {
    return (
      <div className="rounded-xl border border-[#ECE7D8] p-6 text-center">
        <p className="text-sm font-medium text-[#145235]">No suspicious signals found.</p>
        <p className="mt-1 text-xs text-[#9A98B5]">This scan did not trigger any detection rules.</p>
      </div>
    );
  }

  return (
    <section>
      <p className="mb-3 text-sm font-semibold text-[#131200]">Findings</p>

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
                  <span className={`text-xs font-medium ${s.points}`}>
                    +{finding.points} pts
                  </span>
                </div>

                <p className="mb-1 text-sm font-medium text-[#131200]">
                  {finding.title}
                </p>

                <p className="mb-1.5 text-xs text-[#5B5750]">
                  Evidence: <span className="rounded bg-[#F2F0EC] px-1.5 py-0.5 text-[#131200]">
                    {finding.evidence}</span>
                </p>

                <p className="mb-2 text-xs text-[#5B5750]">
                  {finding.description}
                </p>

                <Separator className="mb-2" />

                <p className="text-xs text-[#392061]">
                  {finding.recommendation}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
