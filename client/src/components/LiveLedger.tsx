import { useTrades, useCloseTrade } from "@/hooks/use-trades";
import { Loader2, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";

export function LiveLedger() {
  const { data: trades, isLoading } = useTrades();
  const { mutate: closeTrade, isPending: isClosing } = useCloseTrade();

  const handleClose = (id: number, currentPrice: number) => {
    if (confirm("Confirm manual square off?")) {
      closeTrade({ id, exitLogic: "Manual Square Off", exitPrice: currentPrice });
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-zinc-500" /></div>;
  }

  const activeTrades = trades?.filter(t => t.status === 'OPEN') || [];

  return (
    <div className="glass-panel rounded-xl overflow-hidden flex flex-col h-full min-h-[300px]">
      <div className="p-4 border-b border-white/5 bg-black/20 flex justify-between items-center">
        <h3 className="text-sm font-bold tracking-widest text-zinc-400">LIVE LEDGER // ACTIVE POSITIONS</h3>
        <span className="text-xs bg-zinc-800 px-2 py-0.5 rounded text-zinc-300 font-mono">
          {activeTrades.length} OPEN
        </span>
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-zinc-500 font-mono bg-black/20">
            <tr>
              <th className="px-4 py-3 font-medium">Symbol/Headline</th>
              <th className="px-4 py-3 font-medium text-right">Entry</th>
              <th className="px-4 py-3 font-medium text-right">Current</th>
              <th className="px-4 py-3 font-medium text-right">P&L</th>
              <th className="px-4 py-3 font-medium text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            <AnimatePresence>
              {activeTrades.map((trade) => {
                const pnl = parseFloat(trade.pnl);
                const isProfit = pnl >= 0;
                
                return (
                  <motion.tr 
                    key={trade.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="group hover:bg-white/5 transition-colors font-mono"
                  >
                    <td className="px-4 py-3">
                      <div className="font-bold text-white truncate max-w-[200px]">{trade.headline}</div>
                      <div className="text-[10px] text-zinc-500">#{trade.id} • AUTO-EXECUTED</div>
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-300">
                      {parseFloat(trade.entryPrice).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-white font-medium">
                      {parseFloat(trade.currentPrice).toLocaleString()}
                    </td>
                    <td className={`px-4 py-3 text-right font-bold ${isProfit ? 'text-bullish' : 'text-bearish'}`}>
                      {isProfit ? '+' : ''}{pnl.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-destructive/20 hover:text-destructive text-zinc-600 transition-colors"
                        onClick={() => handleClose(trade.id, parseFloat(trade.currentPrice))}
                        disabled={isClosing}
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
            
            {activeTrades.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-zinc-600 font-mono text-xs">
                  NO ACTIVE POSITIONS. SCANNING...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
