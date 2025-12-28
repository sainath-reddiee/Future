import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useMarketData() {
  return useQuery({
    queryKey: [api.marketData.get.path],
    queryFn: async () => {
      const res = await fetch(api.marketData.get.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch market data");
      return api.marketData.get.responses[200].parse(await res.json());
    },
    refetchInterval: 2000, // Fast poll for "live" feel
  });
}
