import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useSignals() {
  return useQuery({
    queryKey: [api.signals.list.path],
    queryFn: async () => {
      const res = await fetch(api.signals.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch signals");
      return api.signals.list.responses[200].parse(await res.json());
    },
    refetchInterval: 10000, // Poll less frequently
  });
}

export function useAnalyzeSignal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (headline: string) => {
      const res = await fetch(api.signals.analyze.path, {
        method: api.signals.analyze.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ headline }),
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error("AI Analysis Failed");
      }
      return api.signals.analyze.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.signals.list.path] }),
  });
}
