import { useMutation, useQueryClient } from "@tanstack/react-query";

import { scanText, scanUrl } from "@/lib/api";
import { jobKeys, reportKeys } from "@/lib/queryKeys";

async function invalidateScanData(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: jobKeys.all }),
    queryClient.invalidateQueries({ queryKey: reportKeys.all }),
  ]);
}

export function useScanUrl() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: scanUrl,
    onSuccess: () => invalidateScanData(queryClient),
  });
}

export function useScanText() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: scanText,
    onSuccess: () => invalidateScanData(queryClient),
  });
}
