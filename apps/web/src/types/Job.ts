export type RiskLevel = "High" | "Medium" | "Low";
export type Severity  = "High" | "Medium" | "Low";
export type JobStatus = "Applied" | "Screening" | "Interview" | "Offer" | "Rejected" | "Ghosted" | "No response";

export interface Finding {
  id:             string;
  severity:       Severity;
  category:       string;
  title:          string;
  evidence:       string;
  description:    string;
  recommendation: string;
  points:         number;
}

//could probably update these later on
export interface CategoryScores {
  phishing:      number;
  fakeRecruiter: number;
  scam:          number;
  ghost:         number;
}

export interface Job {
  id:           number;
  company:      string;
  title:        string;
  platform:     string;
  date:         string;
  riskLevel:    RiskLevel;
  status:       JobStatus;

  // populated after a scan — optional until backend exists
  overallScore?: number;
  scanDate?:     string;
  dateApplied?:  string;
  topFinding?:   string;
  categories?:   CategoryScores;
  findings?:     Finding[];
}
