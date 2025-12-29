import { useEffect, useRef, useState } from "react";
import { createChart, ColorType, IChartApi, ISeriesApi, AreaSeries, LineSeries } from "lightweight-charts";
import { useMarketData } from "@/hooks/use-market-data";
import { Button } from "@/components/ui/button";

const INTERVALS = ["1m", "5m", "15m", "1h", "4h"];

export function TradingChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<IChartApi | null>(null);
  const seriesInstance = useRef<ISeriesApi<"Area"> | null>(null);
  const smaSeriesInstance = useRef<ISeriesApi<"Line"> | null>(null);
  const emaSeriesInstance = useRef<ISeriesApi<"Line"> | null>(null);
  
  const [interval, setInterval] = useState("1m");
  const [showSMA, setShowSMA] = useState(true);
  const [showEMA, setShowEMA] = useState(true);

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

    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor: "#10b981",
      topColor: "rgba(16, 185, 129, 0.4)",
      bottomColor: "rgba(16, 185, 129, 0.01)",
    });

    const smaSeries = chart.addSeries(LineSeries, {
      color: '#fbbf24', // Amber for SMA
      lineWidth: 2,
      crosshairMarkerVisible: false,
    });

    const emaSeries = chart.addSeries(LineSeries, {
      color: '#3b82f6', // Blue for EMA
      lineWidth: 2,
      crosshairMarkerVisible: false,
    });

    // Seed initial data (Simulated past hour)
    const now = Math.floor(Date.now() / 1000);
    const initialData = [];
    const smaData = [];
    const emaData = [];
    
    let price = 24500; // NIFTY 50 base
    
    // Adjust volatility based on interval
    let volatility = 50;
    if (interval === "5m") volatility = 100;
    if (interval === "1h") volatility = 300;

    for (let i = 0; i < 200; i++) {
      price = price + (Math.random() - 0.5) * volatility;
      const time = now - (200 - i) * (interval === "1m" ? 60 : interval === "5m" ? 300 : 3600);
      
      initialData.push({ time, value: price });
      
      // Simple moving averages simulation
      if (i >= 50) {
        const sum = initialData.slice(i - 50, i).reduce((acc, val) => acc + val.value, 0);
        smaData.push({ time, value: sum / 50 });
      }
      
      // Simple EMA simulation
      if (i > 0) {
         const prevEma = emaData.length > 0 ? emaData[emaData.length - 1].value : price;
         const k = 2 / (21 + 1);
         const ema = price * k + prevEma * (1 - k);
         emaData.push({ time, value: ema });
      } else {
         emaData.push({ time, value: price });
      }
    }
    
    areaSeries.setData(initialData);
    smaSeries.setData(smaData);
    emaSeries.setData(emaData);

    chartInstance.current = chart;
    seriesInstance.current = areaSeries;
    smaSeriesInstance.current = smaSeries;
    emaSeriesInstance.current = emaSeries;

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
  }, [interval]);

  // Toggle Indicators
  useEffect(() => {
    if (smaSeriesInstance.current) {
        smaSeriesInstance.current.applyOptions({ visible: showSMA });
    }
    if (emaSeriesInstance.current) {
        emaSeriesInstance.current.applyOptions({ visible: showEMA });
    }
  }, [showSMA, showEMA]);

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
      
      // Update indicators with simple approximation for live data
      if (smaSeriesInstance.current && showSMA) {
          smaSeriesInstance.current.update({ time: time as any, value: parseFloat(data.sma50) });
      }
      if (emaSeriesInstance.current && showEMA) {
          emaSeriesInstance.current.update({ time: time as any, value: parseFloat(data.ema21) });
      }
    }
  }, [data, showSMA, showEMA]);

  return (
    <div className="glass-panel p-1 rounded-xl relative group">
       <div className="absolute top-4 left-4 z-10 flex gap-2">
         <div className="bg-black/50 backdrop-blur px-3 py-1 rounded text-xs font-mono text-zinc-400 border border-white/5">
           NIFTY 50 • {interval}
         </div>
         {/* Intervals */}
         <div className="flex bg-black/50 backdrop-blur rounded border border-white/5 overflow-hidden">
            {INTERVALS.map(int => (
                <button 
                    key={int}
                    onClick={() => setInterval(int)}
                    className={`px-2 py-1 text-[10px] font-mono hover:bg-white/10 ${interval === int ? 'text-emerald-400 bg-white/5' : 'text-zinc-500'}`}
                >
                    {int}
                </button>
            ))}
         </div>
       </div>

       {/* Indicators Control */}
       <div className="absolute top-4 right-4 z-10 flex gap-2">
            <Button 
                variant="outline" 
                size="sm" 
                className={`h-6 text-[10px] ${showSMA ? 'border-amber-500/50 text-amber-500' : 'text-zinc-600 border-zinc-800'}`}
                onClick={() => setShowSMA(!showSMA)}
            >
                SMA 50
            </Button>
            <Button 
                variant="outline" 
                size="sm" 
                className={`h-6 text-[10px] ${showEMA ? 'border-blue-500/50 text-blue-500' : 'text-zinc-600 border-zinc-800'}`}
                onClick={() => setShowEMA(!showEMA)}
            >
                EMA 21
            </Button>
       </div>

      <div ref={chartContainerRef} className="w-full h-[400px] rounded-lg overflow-hidden" />
    </div>
  );
}
