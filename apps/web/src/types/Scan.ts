import type {
  CategoryScores,
  Finding,
  Job,
  PositiveSignal,
  PostingContext,
  RiskLevel,
} from "./Job";

export type ScanSource = "text" | "url" | "extension";

export interface ScanUrlRequest {
  url: string;
}

export interface ScanTextRequest {
  description: string;
  title?: string | null;
  company?: string | null;
  location?: string | null;
  sourceUrl?: string | null;
  sourceSite?: string | null;
}

export interface ScanResponse {
  source: ScanSource;
  job: Job;
  reportId: string;
  overallScore: number;
  riskLevel: RiskLevel;
  categoryScores: CategoryScores;
  topFinding?: string | null;
  findings: Finding[];
  qualityConcerns: Finding[];
  positiveSignals: PositiveSignal[];
  postingContext: PostingContext;
  submittedUrl?: string | null;
  finalUrl?: string | null;
}
