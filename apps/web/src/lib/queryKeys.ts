export const jobKeys = {
  all: ["jobs"] as const,
  detail: (jobId: string) => ["jobs", jobId] as const,
  reports: (jobId: string) => ["jobs", jobId, "reports"] as const,
};

export const reportKeys = {
  all: ["reports"] as const,
  detail: (reportId: string) => ["reports", reportId] as const,
};
