import { useNavigate } from "react-router";
import { Badge } from "@/components/ui/badge";
import type { Job, RiskLevel } from "@/types/Job";

type ReportsTableRowProps = {
  job: Job;
};

//risk styles has a border, badge... that can be set to the lookup table of high
//medium, or low

const riskStyles: Record<RiskLevel, {
  border: string;
  badge: string;
  scoreColor: string;
  findingColor: string;
  icon: string;
}> = {
  High: {
    border: "border-[#FDE2E3]",
    badge: "bg-[#FDE2E3] text-[#B0212B]",
    scoreColor: "text-[#7A1620]",
    findingColor: "text-[#B0212B]",
    icon: "ti-alert-triangle",
  },
  Medium: {
    border: "border-[#FCF0D8]",
    badge: "bg-[#FCF0D8] text-[#8A5A0A]",
    scoreColor: "text-[#6B4407]",
    findingColor: "text-[#8A5A0A]",
    icon: "ti-clock",
  },
  Low: {
    border: "border-[#ECE7D8]",
    badge: "bg-[#E4F3EB] text-[#1A6B45]",
    scoreColor: "text-[#145235]",
    findingColor: "text-[#5B5750]",
    icon: "ti-check",
  },
};

const categoryStyle = (score: number) => {
  if (score >= 66) return "bg-[#FDE2E3] text-[#B0212B]";
  if (score >= 33) return "bg-[#FCF0D8] text-[#8A5A0A]";
  return "bg-[#E4F3EB] text-[#1A6B45]";
};

export function ReportsTableRow({ job }: ReportsTableRowProps) {
  const navigate = useNavigate();
  const s = riskStyles[job.riskLevel];

  return (
    <div
      onClick={() => navigate(`/reports/${job.id}`)}
      className={`border rounded-xl p-4 cursor-pointer bg-[#F2F0EC] hover:bg-[#ECE7D8] transition-colors ${s.border}`}    >
      <div className="flex items-start justify-between">

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-[#131200]">{job.company}</span>
            <span className="text-xs text-[#5B5750]">{job.title}</span>
          </div>

          <div className="flex gap-3 text-xs text-[#9A98B5] mb-3">
            <span>{job.platform}</span>
            <span>{job.scanDate ? `Scanned ${job.scanDate}` : "Scan date unavailable"}</span>
          </div>

          {job.categories ? (
            <div className="flex gap-1.5 flex-wrap">
              <Badge className={`text-xs rounded-full px-2 py-0.5 ${categoryStyle(job.categories.phishing)}`}>
                Phishing · {job.categories.phishing}
              </Badge>
              <Badge className={`text-xs rounded-full px-2 py-0.5 ${categoryStyle(job.categories.fakeRecruiter)}`}>
                Fake recruiter · {job.categories.fakeRecruiter}
              </Badge>
              <Badge className={`text-xs rounded-full px-2 py-0.5 ${categoryStyle(job.categories.scam)}`}>
                Scam · {job.categories.scam}
              </Badge>
              <Badge className={`text-xs rounded-full px-2 py-0.5 ${categoryStyle(job.categories.ghost)}`}>
                Ghost · {job.categories.ghost}
              </Badge>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col items-end gap-1.5 ml-4 shrink-0">
          <Badge className={`text-xs font-semibold px-3 py-1 rounded-full ${s.badge}`}>
            {job.riskLevel}
          </Badge>
          {job.overallScore !== undefined ? (
            <>
              <span className={`text-lg font-bold ${s.scoreColor}`}>{job.overallScore}</span>
              <span className="text-xs text-[#9A98B5]">overall</span>
            </>
          ) : (<span className="text-xs text-[#9A98B5] mt-1">No score yet</span>)}
        </div>

      </div>

      {job.topFinding && (
        <div className={`mt-3 border-t border-[#DCD7CB] pt-2.5 text-xs flex items-center gap-1.5 ${s.findingColor}`}>
          <i className={`ti ${s.icon}`} style={{ fontSize: 13 }} aria-hidden="true" />
          {job.topFinding}
        </div>
      )}
    </div>
  );
}
