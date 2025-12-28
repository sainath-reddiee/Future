import { usePortfolio } from "@/hooks/use-portfolio";
import { Wallet, PieChart } from "lucide-react";

export function PortfolioSummary() {
  const { data: portfolio } = usePortfolio();

  if (!portfolio) return null;

  const totalPnL = parseFloat(portfolio.totalRealizedPnl) + parseFloat(portfolio.totalUnrealizedPnl);
  const isProfit = totalPnL >= 0;

  return (
    <div className="glass-panel p-6 rounded-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xs font-bold text-zinc-500 tracking-widest mb-1">TOTAL EQUITY</h2>
          <div className="text-3xl font-bold font-mono text-white tracking-tight">
            ₹{parseFloat(portfolio.balance).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
        </div>
        <div className="text-right">
           <h2 className="text-xs font-bold text-zinc-500 tracking-widest mb-1">NET P&L</h2>
           <div className={`text-xl font-bold font-mono ${isProfit ? 'text-bullish' : 'text-bearish'}`}>
             {isProfit ? '+' : ''}{totalPnL.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-black/40 p-3 rounded border border-white/5">
          <div className="flex items-center gap-2 mb-1 text-zinc-500 text-[10px] uppercase font-bold">
            <Wallet className="w-3 h-3" /> Realized
          </div>
          <div className="font-mono text-sm text-zinc-300">
            ₹{parseFloat(portfolio.totalRealizedPnl).toLocaleString()}
          </div>
        </div>
        <div className="bg-black/40 p-3 rounded border border-white/5">
          <div className="flex items-center gap-2 mb-1 text-zinc-500 text-[10px] uppercase font-bold">
            <PieChart className="w-3 h-3" /> Unrealized
          </div>
          <div className="font-mono text-sm text-zinc-300">
            ₹{parseFloat(portfolio.totalUnrealizedPnl).toLocaleString()}
          </div>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-xs">
         <span className="text-zinc-500">AI Win Rate</span>
         <span className="text-accent font-bold font-mono">{portfolio.aiAccuracy}%</span>
      </div>
    </div>
  );
}
