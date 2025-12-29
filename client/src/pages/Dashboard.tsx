import { HUD } from "@/components/HUD";
import { TradingChart } from "@/components/TradingChart";
import { LiveLedger } from "@/components/LiveLedger";
import { SignalFeed } from "@/components/SignalFeed";
import { PortfolioSummary } from "@/components/PortfolioSummary";
import { useCreateTrade } from "@/hooks/use-trades";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Dashboard() {
  const { mutate: createTrade } = useCreateTrade();

  // For debug/demo purposes to quickly add a trade
  const handleQuickAdd = () => {
    // Randomize trade data for demo
    const randomPrice = 24500 + Math.random() * 200;
    const isLong = Math.random() > 0.5;
    
    createTrade({
      headline: `NIFTY 50 ${isLong ? 'Long' : 'Short'} Entry`,
      entryPrice: randomPrice.toFixed(2),
      currentPrice: randomPrice.toFixed(2),
      pnl: "0",
      status: "OPEN",
      exitLogic: null
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-6 lg:p-8 scanlines">
      <div className="max-w-[1600px] mx-auto space-y-6">
        
        {/* HEADER */}
        <header className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
          <div>
            <h1 className="text-2xl font-black tracking-widest text-white uppercase flex items-center gap-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-sm" />
              Alpha Ledger <span className="text-zinc-600">//</span> PRO
            </h1>
            <p className="text-xs text-zinc-500 font-mono mt-1">
              AI-POWERED ALGORITHMIC TRADING TERMINAL
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              SYSTEM OPERATIONAL
            </div>
            <Button 
              size="sm" 
              className="bg-zinc-800 hover:bg-zinc-700 text-white border border-white/10"
              onClick={handleQuickAdd}
            >
              <Plus className="w-4 h-4 mr-2" /> Manual Entry
            </Button>
          </div>
        </header>

        {/* HEADS UP DISPLAY */}
        <HUD />

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN: Chart & Ledger (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <TradingChart />
            <LiveLedger />
          </div>

          {/* RIGHT COLUMN: Portfolio & Signals (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <PortfolioSummary />
            <SignalFeed />
          </div>
          
        </div>
      </div>
    </div>
  );
}
