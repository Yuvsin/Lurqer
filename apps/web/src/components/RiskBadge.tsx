import type { RiskLevel } from "@/types/Job";

const riskStyles: Record<RiskLevel, string> = {
  High:   "bg-[#FDE2E3] text-[#B0212B] hover:bg-[#FDE2E3]",
  Medium: "bg-[#FCF0D8] text-[#8A5A0A] hover:bg-[#FCF0D8]",
  Low:    "bg-[#E4F3EB] text-[#1A6B45] hover:bg-[#E4F3EB]",
};

type RiskBadgeProps = {
  riskLevel: RiskLevel;
};

export function RiskBadge({ riskLevel }: RiskBadgeProps) {
  return (
    <span className={`rounded-md px-2 py-1 text-xs font-medium ${riskStyles[riskLevel]}`}>
      {riskLevel}
    </span>
  );
}