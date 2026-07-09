import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Job } from "@/types/Job";

type AnalyticsProps = {
  jobs: Job[];
};

export function Analytics({ jobs }: AnalyticsProps) {
  const active = jobs.filter(j => ["Applied", "Screening", "Interview"].includes(j.status)).length;
  const needsAttention = jobs.filter(
    j =>
      j.riskLevel === "Medium" ||
      j.riskLevel === "High" ||
      j.status === "No response" ||
      j.status === "Ghosted"
  ).length;
  const interviewing = jobs.filter(j => j.status === "Interview").length;
  const ghosted = jobs.filter(j => j.status === "Ghosted" || j.status === "No response").length;

  return (
    <section className="py-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">

        <Card className="border-[#ECE7D8] bg-[#F2F0EC] shadow-none">
          <CardHeader className="px-4 pt-4 pb-1">
            <CardTitle className="text-sm font-medium text-[#5B5750]">
              Active applications
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-3xl font-bold tracking-tight text-[#131200]">{active}</p>
            <p className="text-xs text-[#5B5750] mt-0.5">Applied, screening, or interviewing</p>
          </CardContent>
        </Card>

        <Card className="border-[#ECE7D8] bg-[#F2F0EC] shadow-none">
          <CardHeader className="px-4 pt-4 pb-1">
            <CardTitle className="text-sm font-medium text-[#5B5750]">
              Needs attention
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-3xl font-bold tracking-tight text-[#B0212B]">{needsAttention}</p>
            <p className="text-xs text-[#5B5750] mt-0.5">Flagged risk or no reply yet</p>
          </CardContent>
        </Card>

        <Card className="border-[#ECE7D8] bg-[#F2F0EC] shadow-none">
          <CardHeader className="px-4 pt-4 pb-1">
            <CardTitle className="text-sm font-medium text-[#5B5750]">
              Interviewing
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-3xl font-bold tracking-tight text-[#392061]">{interviewing}</p>
            <p className="text-xs text-[#5B5750] mt-0.5">Applications in interview stage</p>
          </CardContent>
        </Card>

        <Card className="border-[#ECE7D8] bg-[#F2F0EC] shadow-none">
          <CardHeader className="px-4 pt-4 pb-1">
            <CardTitle className="text-sm font-medium text-[#5B5750]">
              Ghosted
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-3xl font-bold tracking-tight text-[#8A5A0A]">{ghosted}</p>
            <p className="text-xs text-[#5B5750] mt-0.5">Ghosted or no response</p>
          </CardContent>
        </Card>

      </div>
    </section>
  );
}
