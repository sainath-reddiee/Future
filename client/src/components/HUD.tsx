import { useMarketData } from "@/hooks/use-market-data";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Activity, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

export function HUD() {
  const { data, isLoading } = useMarketData();

  if (isLoading || !data) {
    return (
      <div className="h-20 w-full animate-pulse bg-card/50 rounded border border-white/5" />
    );
  }

  const isBullish = parseFloat(data.change) >= 0;
  const isVixHigh = parseFloat(data.vix) > 20;

  const lastUpdated = data.lastUpdated ? new Date(data.lastUpdated) : new Date(data.timestamp);
  const dataAge = Date.now() - lastUpdated.getTime();
  const isDataFresh = dataAge < 30000;

  // Safe parsing for macd jsonb
  let macdSignal = "NEUTRAL";
  try {
    const macd = typeof data.macd === 'string' ? JSON.parse(data.macd) : data.macd;
    if (macd?.histogram > 0) macdSignal = "BULLISH";
    if (macd?.histogram < 0) macdSignal = "BEARISH";
  } catch (e) {
    console.error("Failed to parse MACD", e);
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
    >
      {/* NIFTY 50 PRICE */}
      <div className="glass-panel p-4 rounded-xl flex flex-col relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
          <Activity className="w-12 h-12 text-white" />
        </div>
        <span className="text-xs text-muted-foreground font-bold tracking-widest mb-1">MARKET // NIFTY 50</span>
        <div className="flex items-baseline gap-2 z-10">
          <span className="text-2xl font-bold tracking-tighter text-white">
            {parseFloat(data.price).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </span>
          <span className={`text-sm font-medium flex items-center gap-1 ${isBullish ? 'text-bullish' : 'text-bearish'}`}>
            {isBullish ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {data.change}%
          </span>
        </div>
        <div className="h-1 w-full mt-3 bg-zinc-900 rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${isBullish ? 'bg-emerald-500' : 'bg-rose-500'}`}
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
          />
        </div>
        <div className="flex items-center gap-1 mt-2">
          <span className={cn(
            "w-2 h-2 rounded-full",
            isDataFresh ? "bg-green-500 animate-pulse" : "bg-yellow-500"
          )} />
          <span className="text-[10px] text-zinc-600 font-mono">
            {data.source || 'Live'} • {formatDistanceToNow(lastUpdated, { addSuffix: true })}
          </span>
        </div>
      </div>

      {/* VIX */}
      <div className="glass-panel p-4 rounded-xl flex flex-col relative overflow-hidden">
        <span className="text-xs text-muted-foreground font-bold tracking-widest mb-1">VOLATILITY // INDIA VIX</span>
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-bold tracking-tighter ${isVixHigh ? 'text-amber-500' : 'text-zinc-400'}`}>
            {parseFloat(data.vix).toFixed(2)}
          </span>
          <span className="text-xs text-muted-foreground">
            {isVixHigh ? 'HIGH RISK' : 'STABLE'}
          </span>
        </div>
        <div className="mt-2 text-xs font-mono text-zinc-600">
          RSI: <span className="text-white">{parseFloat(data.rsi).toFixed(1)}</span>
        </div>
      </div>

      {/* MOMENTUM / MACD */}
      <div className="glass-panel p-4 rounded-xl flex flex-col">
        <span className="text-xs text-muted-foreground font-bold tracking-widest mb-1">MOMENTUM // MACD</span>
        <div className="flex items-center gap-2 mt-1">
          <div className={`px-2 py-1 rounded text-xs font-bold border ${
            macdSignal === "BULLISH" 
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
              : macdSignal === "BEARISH"
              ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
              : "bg-zinc-800 border-zinc-700 text-zinc-400"
          }`}>
            {macdSignal}
          </div>
        </div>
        <div className="mt-auto flex justify-between text-[10px] text-zinc-500 font-mono">
          <span>EMA9: {parseFloat(data.ema9).toFixed(0)}</span>
          <span>EMA21: {parseFloat(data.ema21).toFixed(0)}</span>
        </div>
      </div>

      {/* AI STATUS */}
      <div className="glass-panel p-4 rounded-xl flex flex-col relative">
        <div className="absolute top-2 right-2">
          <Zap className="w-4 h-4 text-accent animate-pulse" />
        </div>
        <span className="text-xs text-muted-foreground font-bold tracking-widest mb-1">SYSTEM // ALPHA AI</span>
        <div className="mt-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-accent rounded-full animate-ping" />
            <span className="text-sm font-medium text-accent-foreground">ONLINE</span>
          </div>
          <div className="mt-2 text-xs text-zinc-500">
            Scanning market breadth...
          </div>
        </div>
      </div>
    </motion.div>
  );
}
