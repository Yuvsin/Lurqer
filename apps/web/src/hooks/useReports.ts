import { useQuery } from "@tanstack/react-query";

import { getJobReports, getReport, getReports } from "@/lib/api";
import { jobKeys, reportKeys } from "@/lib/queryKeys";

export function useReports() {
  return useQuery({
    queryKey: reportKeys.all,
    queryFn: getReports,
  });
}

export function useReport(reportId?: string) {
  return useQuery({
    queryKey: reportKeys.detail(reportId ?? ""),
    queryFn: () => getReport(reportId!),
    enabled: Boolean(reportId),
  });
}

export function useJobReports(jobId?: string) {
  return useQuery({
    queryKey: jobKeys.reports(jobId ?? ""),
    queryFn: () => getJobReports(jobId!),
    enabled: Boolean(jobId),
  });
}
