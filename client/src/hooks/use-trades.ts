import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertTrade } from "@shared/schema";

export function useTrades() {
  return useQuery({
    queryKey: [api.trades.list.path],
    queryFn: async () => {
      const res = await fetch(api.trades.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch trades");
      return api.trades.list.responses[200].parse(await res.json());
    },
    refetchInterval: 5000, // Poll for simulated updates
  });
}

export function useCreateTrade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (trade: InsertTrade) => {
      const res = await fetch(api.trades.create.path, {
        method: api.trades.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(trade),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.trades.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create trade");
      }
      return api.trades.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.trades.list.path] }),
  });
}

export function useCloseTrade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, exitLogic, exitPrice }: { id: number; exitLogic: string; exitPrice: number }) => {
      const url = buildUrl(api.trades.close.path, { id });
      const res = await fetch(url, {
        method: api.trades.close.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exitLogic, exitPrice }),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Trade not found");
        }
        throw new Error("Failed to close trade");
      }
      return api.trades.close.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.trades.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.portfolio.get.path] }); // Closing affects portfolio
    },
  });
}
