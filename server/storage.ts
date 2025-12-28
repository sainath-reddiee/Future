
import { db } from "./db";
import {
  trades, signals, portfolio, marketData,
  type InsertTrade, type InsertSignal, type InsertPortfolio, type InsertMarketData
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Trades
  getTrades(): Promise<typeof trades.$inferSelect[]>;
  createTrade(trade: InsertTrade): Promise<typeof trades.$inferSelect>;
  closeTrade(id: number, exitLogic: string, exitPrice: string): Promise<typeof trades.$inferSelect | undefined>;

  // Signals
  getSignals(): Promise<typeof signals.$inferSelect[]>;
  createSignal(signal: InsertSignal): Promise<typeof signals.$inferSelect>;

  // Portfolio
  getPortfolio(): Promise<typeof portfolio.$inferSelect | undefined>;
  updatePortfolio(updates: Partial<InsertPortfolio>): Promise<typeof portfolio.$inferSelect>;
  initPortfolio(): Promise<typeof portfolio.$inferSelect>;

  // Market Data
  getMarketData(): Promise<typeof marketData.$inferSelect | undefined>;
  updateMarketData(data: InsertMarketData): Promise<typeof marketData.$inferSelect>;
}

export class DatabaseStorage implements IStorage {
  async getTrades() {
    return await db.select().from(trades).orderBy(desc(trades.timestamp));
  }

  async createTrade(trade: InsertTrade) {
    const [newTrade] = await db.insert(trades).values(trade).returning();
    return newTrade;
  }

  async closeTrade(id: number, exitLogic: string, exitPrice: string) {
    const [updated] = await db.update(trades)
      .set({ status: 'CLOSED', exitLogic, currentPrice: exitPrice }) // Assume exit price is current price for simplicity in record
      .where(eq(trades.id, id))
      .returning();
    return updated;
  }

  async getSignals() {
    return await db.select().from(signals).orderBy(desc(signals.timestamp));
  }

  async createSignal(signal: InsertSignal) {
    const [newSignal] = await db.insert(signals).values(signal).returning();
    return newSignal;
  }

  async getPortfolio() {
    const [p] = await db.select().from(portfolio).limit(1);
    return p;
  }

  async initPortfolio() {
    const [p] = await db.insert(portfolio).values({
      balance: '100000',
      equityCurve: [],
      totalRealizedPnl: '0',
      totalUnrealizedPnl: '0',
      aiAccuracy: '0'
    }).returning();
    return p;
  }

  async updatePortfolio(updates: Partial<InsertPortfolio>) {
    // Should ideally handle ID, but assuming singleton for MVP
    const existing = await this.getPortfolio();
    if (!existing) return this.initPortfolio();
    
    const [updated] = await db.update(portfolio)
      .set(updates)
      .where(eq(portfolio.id, existing.id))
      .returning();
    return updated;
  }

  async getMarketData() {
    const [data] = await db.select().from(marketData).orderBy(desc(marketData.timestamp)).limit(1);
    return data;
  }

  async updateMarketData(data: InsertMarketData) {
    // For simplicity, just insert new record to keep history, or update. 
    // Let's insert to keep it simple and just fetch latest.
    const [newData] = await db.insert(marketData).values(data).returning();
    return newData;
  }
}

export const storage = new DatabaseStorage();
