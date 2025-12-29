
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
        rationale: analysis.rationale,
        source: 'Manual Entry',
        sourceUrl: undefined,
        summary: undefined,
        publishedAt: new Date(),
        relevanceScore: '75.0',
      });

      res.status(201).json(signal);

    } catch (err) {
      console.error("AI Analysis Error:", err);
      res.status(500).json({ message: "Failed to analyze news" });
    }
  });

  // Aggregate News from Multiple Sources
  app.post('/api/signals/aggregate', async (req, res) => {
    try {
      const { newsAggregationService } = await import('./services/news-aggregation');

      const newsSignals = await newsAggregationService.aggregateNews(false);

      const savedSignals = [];
      for (const newsItem of newsSignals) {
        const signal = await storage.createSignal({
          headline: newsItem.headline,
          sentiment: String(newsItem.sentiment),
          category: newsItem.category,
          rationale: newsItem.rationale,
          source: newsItem.source,
          sourceUrl: newsItem.url,
          summary: newsItem.summary,
          publishedAt: newsItem.publishedAt,
          relevanceScore: String(newsItem.relevanceScore),
        });
        savedSignals.push(signal);
      }

      res.status(201).json({
        message: `Aggregated ${savedSignals.length} news signals`,
        signals: savedSignals
      });

    } catch (err) {
      console.error("News Aggregation Error:", err);
      res.status(500).json({ message: "Failed to aggregate news" });
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
    try {
      const { marketDataService } = await import('./services/market-data');

      const marketData = await marketDataService.fetchMarketData();

      const saved = await storage.updateMarketData({
        symbol: marketData.symbol,
        price: String(marketData.price),
        change: String(marketData.change),
        changePercent: String(marketData.changePercent),
        open: String(marketData.open),
        high: String(marketData.high),
        low: String(marketData.low),
        previousClose: String(marketData.previousClose),
        volume: String(marketData.volume),
        vwap: String(marketData.vwap),
        sma50: String(marketData.sma50),
        ema9: String(marketData.ema9),
        ema21: String(marketData.ema21),
        rsi: String(marketData.rsi),
        macd: marketData.macd,
        vix: String(marketData.vix),
        source: marketData.source,
        lastUpdated: marketData.lastUpdated,
      });

      res.json(saved);
    } catch (error) {
      console.error('Market Data Error:', error);

      const cachedData = await storage.getMarketData();
      if (cachedData) {
        return res.json(cachedData);
      }

      res.status(500).json({ message: 'Failed to fetch market data' });
    }
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
        rationale: "Stability signals bullish trend for banking sector.",
        source: "Economic Times",
        sourceUrl: "https://economictimes.indiatimes.com",
        summary: "The Reserve Bank of India maintains its repo rate at 6.5% signaling economic stability.",
        publishedAt: new Date(),
        relevanceScore: "90.0",
    });
    await storage.createSignal({
        headline: "Infosys misses revenue guidance",
        sentiment: "-0.6",
        category: "Earnings",
        rationale: "IT sector likely to face short-term pressure.",
        source: "MoneyControl",
        sourceUrl: "https://www.moneycontrol.com",
        summary: "Infosys reports earnings below analyst expectations affecting IT sector sentiment.",
        publishedAt: new Date(),
        relevanceScore: "85.0",
    });
  }
}
