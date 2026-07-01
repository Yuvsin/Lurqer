export type Job = {
  id: number;
  company: string;
  title: string;
  platform: string;
  date: string;
  riskLevel: "Low" | "Medium" | "High";
};