// hooks/useRefetchOnFocus.ts
import { useEffect } from "react";
import { useIsFocused } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";

type RefetchQuery = {
  queryKey: readonly unknown[];
  staleTime?: number; // optional now
  enabled?: boolean;
};

const DEFAULT_STALE_TIME = 1000 * 60 * 5; // 1 min

export const useRefetchOnFocus = (queries: RefetchQuery[]) => {
  const isFocused = useIsFocused();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isFocused) return;

    queries.forEach(({ queryKey, staleTime = DEFAULT_STALE_TIME, enabled = true }) => {
      if (!enabled) return;

      const state = queryClient.getQueryState(queryKey);
      const isStale = Date.now() - (state?.dataUpdatedAt ?? 0) > staleTime;

      if (isStale) {
        queryClient.invalidateQueries({ queryKey });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocused]);
};