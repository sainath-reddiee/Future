import { useEffect, useRef } from "react";
import { createChart, ColorType, IChartApi, ISeriesApi } from "lightweight-charts";
import { useMarketData } from "@/hooks/use-market-data";

export function TradingChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<IChartApi | null>(null);
  const seriesInstance = useRef<ISeriesApi<"Area"> | null>(null);
  const { data } = useMarketData();
  
  // Initialize Chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#050505" }, // Match app background
        textColor: "#71717a",
      },
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.05)" },
        horzLines: { color: "rgba(255, 255, 255, 0.05)" },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      timeScale: {
        timeVisible: true,
        secondsVisible: true,
        borderColor: "#27272a",
      },
      rightPriceScale: {
        borderColor: "#27272a",
      },
    });

    const areaSeries = chart.addAreaSeries({
      lineColor: "#10b981",
      topColor: "rgba(16, 185, 129, 0.4)",
      bottomColor: "rgba(16, 185, 129, 0.01)",
    });

    // Seed initial data (Simulated past hour)
    const now = Math.floor(Date.now() / 1000);
    const initialData = [];
    let price = 22000;
    for (let i = 0; i < 100; i++) {
      price = price + (Math.random() - 0.5) * 50;
      initialData.push({ time: now - (100 - i) * 60, value: price });
    }
    areaSeries.setData(initialData);

    chartInstance.current = chart;
    seriesInstance.current = areaSeries;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, []);

  // Update chart with live data
  useEffect(() => {
    if (seriesInstance.current && data) {
      const currentPrice = parseFloat(data.price);
      // Ensure time is always moving forward and distinct
      const time = Math.floor(Date.now() / 1000);
      seriesInstance.current.update({
        time: time as any,
        value: currentPrice,
      });

      // Update color based on movement
      const isBullish = parseFloat(data.change) >= 0;
      seriesInstance.current.applyOptions({
        lineColor: isBullish ? "#10b981" : "#ef4444",
        topColor: isBullish ? "rgba(16, 185, 129, 0.4)" : "rgba(239, 68, 68, 0.4)",
        bottomColor: isBullish ? "rgba(16, 185, 129, 0.01)" : "rgba(239, 68, 68, 0.01)",
      });
    }
  }, [data]);

  return (
    <div className="glass-panel p-1 rounded-xl relative">
       <div className="absolute top-4 left-4 z-10 bg-black/50 backdrop-blur px-3 py-1 rounded text-xs font-mono text-zinc-400 border border-white/5">
         NIFTY 50 • 1M INTERVAL
       </div>
      <div ref={chartContainerRef} className="w-full h-[400px] rounded-lg overflow-hidden" />
    </div>
  );
}
