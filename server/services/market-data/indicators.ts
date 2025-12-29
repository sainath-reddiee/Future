import type { TechnicalIndicators } from './types';

export class IndicatorCalculator {
  calculateVWAP(prices: number[], volumes: number[]): number {
    if (!prices.length || !volumes.length || prices.length !== volumes.length) {
      return prices[prices.length - 1] || 0;
    }

    const totalVolume = volumes.reduce((sum, v) => sum + v, 0);
    if (totalVolume === 0) return prices[prices.length - 1];

    const vwap = prices.reduce((sum, price, i) => {
      return sum + (price * volumes[i]);
    }, 0) / totalVolume;

    return vwap;
  }

  calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) {
      return prices.reduce((sum, p) => sum + p, 0) / prices.length;
    }

    const relevantPrices = prices.slice(-period);
    return relevantPrices.reduce((sum, p) => sum + p, 0) / period;
  }

  calculateEMA(prices: number[], period: number): number {
    if (prices.length === 0) return 0;
    if (prices.length < period) {
      return this.calculateSMA(prices, prices.length);
    }

    const k = 2 / (period + 1);
    let ema = this.calculateSMA(prices.slice(0, period), period);

    for (let i = period; i < prices.length; i++) {
      ema = (prices[i] * k) + (ema * (1 - k));
    }

    return ema;
  }

  calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) {
      return 50;
    }

    const changes = [];
    for (let i = 1; i < prices.length; i++) {
      changes.push(prices[i] - prices[i - 1]);
    }

    const gains = changes.slice(-period).filter(c => c > 0);
    const losses = changes.slice(-period).filter(c => c < 0).map(Math.abs);

    const avgGain = gains.length ? gains.reduce((sum, g) => sum + g, 0) / period : 0;
    const avgLoss = losses.length ? losses.reduce((sum, l) => sum + l, 0) / period : 0;

    if (avgLoss === 0) return 100;

    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));

    return rsi;
  }

  calculateMACD(prices: number[]): { macd: number; signal: number; histogram: number } {
    if (prices.length < 26) {
      return { macd: 0, signal: 0, histogram: 0 };
    }

    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const macdLine = ema12 - ema26;

    const macdHistory: number[] = [];
    for (let i = 26; i < prices.length; i++) {
      const ema12_i = this.calculateEMA(prices.slice(0, i + 1), 12);
      const ema26_i = this.calculateEMA(prices.slice(0, i + 1), 26);
      macdHistory.push(ema12_i - ema26_i);
    }

    const signalLine = this.calculateEMA(macdHistory, 9);
    const histogram = macdLine - signalLine;

    return {
      macd: macdLine,
      signal: signalLine,
      histogram,
    };
  }

  async fetchHistoricalPrices(symbol: string, days: number): Promise<number[]> {
    const mockPrices: number[] = [];
    const basePrice = 25000;

    for (let i = 0; i < days; i++) {
      const randomChange = (Math.random() - 0.5) * 200;
      mockPrices.push(basePrice + randomChange);
    }

    return mockPrices;
  }

  async calculateAllIndicators(currentPrice: number): Promise<TechnicalIndicators> {
    const historicalPrices = await this.fetchHistoricalPrices('NIFTY50', 100);
    historicalPrices.push(currentPrice);

    const volumes = historicalPrices.map(() => Math.random() * 1000000);

    return {
      vwap: this.calculateVWAP(historicalPrices.slice(-20), volumes.slice(-20)),
      sma50: this.calculateSMA(historicalPrices, 50),
      ema9: this.calculateEMA(historicalPrices, 9),
      ema21: this.calculateEMA(historicalPrices, 21),
      rsi: this.calculateRSI(historicalPrices, 14),
      macd: this.calculateMACD(historicalPrices),
      vix: 12 + Math.random() * 6,
    };
  }
}
