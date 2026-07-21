import type { CategoryScores, Finding, RiskLevel } from "./Job";

export interface Report {
  id: string;
  jobId: string;
  riskLevel: RiskLevel;
  overallScore: number;
  topFinding?: string | null;
  categories: CategoryScores;
  findings: Finding[];
  scanDate: string;
  createdAt: string;
}
