import { useSignals, useAnalyzeSignal } from "@/hooks/use-signals";
import { Button } from "./ui/button";
import { Loader2, Radio, BrainCircuit, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export function SignalFeed() {
  const { data: signals, isLoading } = useSignals();
  const { mutate: analyze, isPending: isAnalyzing } = useAnalyzeSignal();
  const [customHeadline, setCustomHeadline] = useState("");
  const [isAggregating, setIsAggregating] = useState(false);

  const handleSimulate = () => {
    const headlines = [
      "RBI hints at rate cuts in upcoming MPC meeting due to cooling inflation.",
      "Tech sector rally expected as major IT giants secure US contracts.",
      "Geopolitical tensions rise in Middle East, oil prices surge 5%.",
      "Auto sales slump in Q3, major manufacturers cut production targets.",
      "Government announces massive infrastructure spending bill for railways."
    ];
    const random = headlines[Math.floor(Math.random() * headlines.length)];
    analyze(random);
  };

  const handleAggregateNews = async () => {
    setIsAggregating(true);
    try {
      const response = await fetch('/api/signals/aggregate', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to aggregate news');
      }

      window.location.reload();
    } catch (error) {
      console.error('News aggregation error:', error);
    } finally {
      setIsAggregating(false);
    }
  };

  return (
    <div className="glass-panel rounded-xl h-full flex flex-col min-h-[400px]">
      <div className="p-4 border-b border-white/5 bg-black/20 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-bold tracking-widest text-zinc-400">SIGNAL FEED // INTELLIGENCE</h3>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 font-mono"
            onClick={handleAggregateNews}
            disabled={isAggregating}
          >
            {isAggregating ? <Loader2 className="w-3 h-3 animate-spin mr-1"/> : <Radio className="w-3 h-3 mr-1"/>}
            FETCH NEWS
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs border-accent/20 text-accent hover:bg-accent/10 hover:text-accent font-mono"
            onClick={handleSimulate}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin mr-1"/> : <Radio className="w-3 h-3 mr-1"/>}
            SIMULATE
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {isLoading && <div className="text-center py-8 text-zinc-600 text-xs">Loading signals...</div>}
        
        <AnimatePresence mode="popLayout">
          {signals?.slice().reverse().map((signal) => {
            const sentiment = parseFloat(signal.sentiment);
            const isPositive = sentiment > 0;
            const intensity = Math.abs(sentiment);
            
            return (
              <motion.div
                key={signal.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                layout
                className={`p-3 rounded border border-l-4 bg-black/40 backdrop-blur-sm ${
                  isPositive 
                    ? 'border-l-emerald-500 border-t-white/5 border-r-white/5 border-b-white/5' 
                    : 'border-l-rose-500 border-t-white/5 border-r-white/5 border-b-white/5'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 uppercase tracking-wider">
                    {signal.category}
                  </span>
                  <span className={`text-xs font-mono font-bold ${isPositive ? 'text-bullish' : 'text-bearish'}`}>
                    {isPositive ? 'BULLISH' : 'BEARISH'} {(intensity * 100).toFixed(0)}%
                  </span>
                </div>
                
                <p className="text-sm font-medium text-zinc-200 mb-2 leading-relaxed">
                  {signal.headline}
                </p>

                {signal.summary && (
                  <p className="text-xs text-zinc-400 mb-2 leading-relaxed">
                    {signal.summary}
                  </p>
                )}

                <div className="text-xs text-zinc-500 border-t border-white/5 pt-2 font-mono">
                  {signal.rationale}
                </div>

                <div className="flex items-center justify-between mt-2 text-xs">
                  {signal.source && (
                    <span className="text-zinc-600 font-mono">
                      Source: {signal.source}
                    </span>
                  )}
                  {signal.sourceUrl && (
                    <a
                      href={signal.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:text-accent/80 flex items-center gap-1 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Read Article
                    </a>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {signals?.length === 0 && (
          <div className="text-center py-12 text-zinc-600 font-mono text-xs">
            AWAITING INPUT...
          </div>
        )}
      </div>
    </div>
  );
}
