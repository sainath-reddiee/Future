
import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerImageRoutes } from "./replit_integrations/image";
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Register AI integration routes
  registerChatRoutes(app);
  registerImageRoutes(app);

  // --- API Routes ---

  // Trades
  app.get(api.trades.list.path, async (req, res) => {
    const trades = await storage.getTrades();
    res.json(trades);
  });

  app.post(api.trades.create.path, async (req, res) => {
    try {
      const input = api.trades.create.input.parse(req.body);
      const trade = await storage.createTrade(input);
      res.status(201).json(trade);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.post(api.trades.close.path, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { exitLogic, exitPrice } = req.body;
      const trade = await storage.closeTrade(id, exitLogic, String(exitPrice));
      if (!trade) return res.status(404).json({ message: "Trade not found" });
      res.json(trade);
    } catch (err) {
      res.status(500).json({ message: "Internal Error" });
    }
  });

  // Signals & AI Analysis
  app.get(api.signals.list.path, async (req, res) => {
    const signals = await storage.getSignals();
    res.json(signals);
  });

  app.post(api.signals.analyze.path, async (req, res) => {
    try {
      const { headline } = req.body;
      
      // Use Gemini to analyze the headline
      const prompt = `Analyze this news for its 1-hour impact on Nifty 50. Output JSON: { "sentiment": -1.0 to 1.0, "category": "Macro/Earnings/Policy", "rationale": "10 words max" }. News: "${headline}"`;
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) {
        throw new Error("No response from AI");
      }

      // Basic cleanup to find JSON in response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
         throw new Error("Invalid AI response format");
      }
      
      const analysis = JSON.parse(jsonMatch[0]);

      // Save the signal
      const signal = await storage.createSignal({
        headline,
        sentiment: String(analysis.sentiment),
        category: analysis.category,
        rationale: analysis.rationale
      });

      res.status(201).json(signal);

    } catch (err) {
      console.error("AI Analysis Error:", err);
      res.status(500).json({ message: "Failed to analyze news" });
    }
  });

  // Portfolio
  app.get(api.portfolio.get.path, async (req, res) => {
    let p = await storage.getPortfolio();
    if (!p) p = await storage.initPortfolio();
    res.json(p);
  });

  // Market Data
  app.get(api.marketData.get.path, async (req, res) => {
    const data = await storage.getMarketData();
    // Return dummy data if empty (for first load)
    if (!data) {
        // This would normally be fetched from a real API
        const dummy = {
            id: 1,
            symbol: "NIFTY 50",
            price: "24500.50",
            change: "+120.50",
            vwap: "24450.00",
            sma50: "24000.00",
            ema9: "24480.00",
            ema21: "24400.00",
            rsi: "65.5",
            macd: { macd: 12.5, signal: 10.0, histogram: 2.5 },
            vix: "13.5",
            timestamp: new Date()
        };
        // We don't save dummy data to DB here to avoid clutter, just return it or seed it properly.
        // Let's seed it via storage if missing to be consistent
        const seeded = await storage.updateMarketData({
            symbol: "NIFTY 50",
            price: "24500.50",
            change: "+120.50",
            vwap: "24450.00",
            sma50: "24000.00",
            ema9: "24480.00",
            ema21: "24400.00",
            rsi: "65.5",
            macd: { macd: 12.5, signal: 10.0, histogram: 2.5 },
            vix: "13.5",
        });
        return res.json(seeded);
    }
    res.json(data);
  });

  // Seed Data
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const p = await storage.getPortfolio();
  if (!p) await storage.initPortfolio();
  
  const signals = await storage.getSignals();
  if (signals.length === 0) {
    await storage.createSignal({
        headline: "RBI keeps repo rate unchanged at 6.5%",
        sentiment: "0.8",
        category: "Policy",
        rationale: "Stability signals bullish trend for banking sector."
    });
    await storage.createSignal({
        headline: "Infosys misses revenue guidance",
        sentiment: "-0.6",
        category: "Earnings",
        rationale: "IT sector likely to face short-term pressure."
    });
  }
}
