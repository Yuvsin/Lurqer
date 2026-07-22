import type {
  CategoryScores,
  Finding,
  PositiveSignal,
  PostingContext,
  RiskLevel,
} from "./Job";

export interface Report {
  id: string;
  jobId: string;
  riskLevel: RiskLevel;
  overallScore: number;
  topFinding?: string | null;
  categories: CategoryScores;
  findings: Finding[];
  qualityConcerns: Finding[];
  positiveSignals: PositiveSignal[];
  postingContext?: PostingContext | null;
  submittedUrl?: string | null;
  finalUrl?: string | null;
  scanDate: string;
  createdAt: string;
}
