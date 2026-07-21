import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { deleteJob, getJob, getJobs, updateJob } from "@/lib/api";
import { jobKeys, reportKeys } from "@/lib/queryKeys";
import type { JobUpdateRequest } from "@/types/Job";

export function useJobs() {
  return useQuery({
    queryKey: jobKeys.all,
    queryFn: getJobs,
  });
}

export function useJob(jobId?: string) {
  return useQuery({
    queryKey: jobKeys.detail(jobId ?? ""),
    queryFn: () => getJob(jobId!),
    enabled: Boolean(jobId),
  });
}

interface UpdateJobVariables {
  jobId: string;
  updates: JobUpdateRequest;
}

export function useUpdateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ jobId, updates }: UpdateJobVariables) =>
      updateJob(jobId, updates),
    onSuccess: async (_job, { jobId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: jobKeys.all, exact: true }),
        queryClient.invalidateQueries({ queryKey: jobKeys.detail(jobId) }),
      ]);
    },
  });
}

export function useDeleteJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteJob,
    onSuccess: async (_result, jobId) => {
      queryClient.removeQueries({ queryKey: jobKeys.detail(jobId) });
      queryClient.removeQueries({ queryKey: jobKeys.reports(jobId) });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: jobKeys.all }),
        queryClient.invalidateQueries({ queryKey: reportKeys.all }),
      ]);
    },
  });
}
