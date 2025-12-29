
import { pgTable, text, serial, integer, boolean, timestamp, jsonb, numeric, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/chat";

// === TRADES ===
export const trades = pgTable("trades", {
  id: serial("id").primaryKey(),
  headline: text("headline").notNull(),
  entryPrice: numeric("entry_price").notNull(),
  currentPrice: numeric("current_price").notNull(), // Updated simulated price
  pnl: numeric("pnl").notNull(),
  status: text("status").notNull(), // 'OPEN' | 'CLOSED'
  exitLogic: text("exit_logic"), // 'Signal Flip', 'SL Hit', 'Target Hit', 'Auto-Square Off'
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertTradeSchema = createInsertSchema(trades).omit({ id: true, timestamp: true });
export type Trade = typeof trades.$inferSelect;
export type InsertTrade = z.infer<typeof insertTradeSchema>;

// === SIGNALS ===
export const signals = pgTable("signals", {
  id: serial("id").primaryKey(),
  headline: text("headline").notNull(),
  sentiment: numeric("sentiment").notNull(), // -1.0 to 1.0
  category: text("category").notNull(), // 'Macro', 'Earnings', 'Policy'
  rationale: text("rationale").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  source: varchar("source", { length: 100 }), // News source name (e.g., "Economic Times")
  sourceUrl: text("source_url"), // Original article URL
  summary: text("summary"), // 2-3 sentence summary
  publishedAt: timestamp("published_at"), // Original publication time
  relevanceScore: numeric("relevance_score").default('75.0'), // 0-100 relevance to Nifty 50
});

export const insertSignalSchema = createInsertSchema(signals).omit({ id: true, timestamp: true });
export type Signal = typeof signals.$inferSelect;
export type InsertSignal = z.infer<typeof insertSignalSchema>;

// === PORTFOLIO ===
// Singleton-like table for the user's performance
export const portfolio = pgTable("portfolio", {
  id: serial("id").primaryKey(),
  balance: numeric("balance").notNull().default('100000'),
  equityCurve: jsonb("equity_curve").notNull().default([]), // Array of {time, value}
  totalRealizedPnl: numeric("total_realized_pnl").notNull().default('0'),
  totalUnrealizedPnl: numeric("total_unrealized_pnl").notNull().default('0'),
  aiAccuracy: numeric("ai_accuracy").notNull().default('0'), // Percentage
});

export const insertPortfolioSchema = createInsertSchema(portfolio).omit({ id: true });
export type Portfolio = typeof portfolio.$inferSelect;
export type InsertPortfolio = z.infer<typeof insertPortfolioSchema>;

// === MARKET DATA (HUD) ===
export const marketData = pgTable("market_data", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull(), // e.g., 'NIFTY 50'
  price: numeric("price").notNull(),
  change: numeric("change").notNull(),
  changePercent: numeric("change_percent"), // Percentage change
  open: numeric("open"), // Day open price
  high: numeric("high"), // Day high
  low: numeric("low"), // Day low
  previousClose: numeric("previous_close"), // Previous close
  volume: numeric("volume"), // Trading volume (using numeric for large numbers)
  vwap: numeric("vwap").notNull(),
  sma50: numeric("sma50").notNull(),
  ema9: numeric("ema9").notNull(),
  ema21: numeric("ema21").notNull(),
  rsi: numeric("rsi").notNull(),
  macd: jsonb("macd").notNull(), // { macd, signal, histogram }
  vix: numeric("vix").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  source: varchar("source", { length: 50 }), // API source (e.g., "NSE", "Yahoo Finance")
  lastUpdated: timestamp("last_updated").defaultNow(), // When data was last refreshed
});

export const insertMarketDataSchema = createInsertSchema(marketData).omit({ id: true, timestamp: true });
export type MarketData = typeof marketData.$inferSelect;
export type InsertMarketData = z.infer<typeof insertMarketDataSchema>;

// === API CACHE ===
export const apiCache = pgTable("api_cache", {
  id: serial("id").primaryKey(),
  cacheKey: varchar("cache_key", { length: 255 }).notNull().unique(),
  cacheValue: jsonb("cache_value").notNull(),
  source: varchar("source", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const insertApiCacheSchema = createInsertSchema(apiCache).omit({ id: true, createdAt: true });
export type ApiCache = typeof apiCache.$inferSelect;
export type InsertApiCache = z.infer<typeof insertApiCacheSchema>;

