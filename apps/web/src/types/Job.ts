export type RiskLevel = "High" | "Medium" | "Low";
export type Severity = "High" | "Medium" | "Low";
export type JobStatus =
  | "Saved"
  | "Applied"
  | "Screening"
  | "Interview"
  | "Offer"
  | "Rejected"
  | "Ghosted"
  | "No response";

export interface Finding {
  id: string;
  ruleId: string;
  severity: Severity;
  confidence: "High" | "Medium" | "Low";
  category: string;
  title: string;
  evidence: string;
  description: string;
  explanation: string;
  recommendation: string;
  scoreImpact: number;
  points: number;
}

export interface PositiveSignal {
  ruleId: string;
  title: string;
  evidence: string;
  description: string;
}

export interface PostingContext {
  postingDate?: string | null;
  firstSeen: string;
  mostRecentlySeen: string;
  observedAgeDays: number;
  repeatCount: number;
  possibleReposting: boolean;
}

export interface CategoryScores {
  phishing: number;
  fakeRecruiter: number;
  scam: number;
  ghost: number;
}

export interface Job {
  id: string;
  company: string;
  title: string;
  platform: string;
  date: string;
  riskLevel: RiskLevel;
  status: JobStatus;
  sourceUrl?: string | null;
  location?: string | null;
  overallScore?: number | null;
  scanDate?: string | null;
  dateApplied?: string | null;
  postingDate?: string | null;
  topFinding?: string | null;
  categories?: CategoryScores | null;
  findings?: Finding[] | null;
}

export type JobWithLatestReport = Job;

export interface JobUpdateRequest {
  company?: string;
  title?: string;
  platform?: string;
  sourceUrl?: string;
  location?: string | null;
  status?: JobStatus;
  dateApplied?: string | null;
}
