import type { MarketDataProvider, RawMarketData } from './types';

export class YahooFinanceProvider implements MarketDataProvider {
  name = 'Yahoo Finance';
  private baseUrl = 'https://query1.finance.yahoo.com/v8/finance';

  async isAvailable(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(
        `${this.baseUrl}/chart/%5ENSEI?interval=1d&range=1d`,
        { signal: controller.signal }
      );

      clearTimeout(timeout);
      return response.ok;
    } catch {
      return false;
    }
  }

  async fetchNifty50(): Promise<RawMarketData> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(
        `${this.baseUrl}/chart/%5ENSEI?interval=1m&range=1d`,
        { signal: controller.signal }
      );

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Yahoo Finance API returned ${response.status}`);
      }

      const data = await response.json();

      if (!data?.chart?.result?.[0]) {
        throw new Error('Invalid Yahoo Finance response format');
      }

      const result = data.chart.result[0];
      const meta = result.meta;
      const quote = result.indicators?.quote?.[0];

      const currentPrice = meta.regularMarketPrice || meta.previousClose;
      const previousClose = meta.chartPreviousClose || meta.previousClose;
      const change = currentPrice - previousClose;
      const changePercent = (change / previousClose) * 100;

      const latestIndex = quote?.close?.length - 1 || 0;
      const open = quote?.open?.[0] || meta.regularMarketPrice;
      const high = Math.max(...(quote?.high?.filter((h: number) => h) || [meta.regularMarketPrice]));
      const low = Math.min(...(quote?.low?.filter((l: number) => l) || [meta.regularMarketPrice]));
      const volume = quote?.volume?.reduce((sum: number, v: number) => sum + (v || 0), 0) || 0;

      return {
        symbol: 'NIFTY 50',
        price: currentPrice,
        change,
        changePercent,
        open,
        high,
        low,
        previousClose,
        volume,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Yahoo Finance API Error:', error);
      throw new Error(`Failed to fetch from Yahoo Finance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
