import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useMarketData() {
  return useQuery({
    queryKey: [api.marketData.get.path],
    queryFn: async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      try {
        const res = await fetch(api.marketData.get.path, {
          credentials: "include",
          signal: controller.signal
        });
        clearTimeout(timeout);

        if (!res.ok) throw new Error("Failed to fetch market data");
        return api.marketData.get.responses[200].parse(await res.json());
      } catch (error) {
        clearTimeout(timeout);
        throw error;
      }
    },
    refetchInterval: 5000,
    retry: 1,
  });
}
