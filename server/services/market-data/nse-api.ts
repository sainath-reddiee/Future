import type { MarketDataProvider, RawMarketData } from './types';

export class NSEProvider implements MarketDataProvider {
  name = 'NSE India';
  private baseUrl = 'https://www.nseindia.com/api';

  private headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.nseindia.com',
  };

  async isAvailable(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

      const response = await fetch('https://www.nseindia.com', {
        signal: controller.signal,
        headers: this.headers,
      });

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
        `${this.baseUrl}/equity-stockIndices?index=NIFTY%2050`,
        {
          signal: controller.signal,
          headers: this.headers,
        }
      );

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`NSE API returned ${response.status}`);
      }

      const data = await response.json();

      if (!data?.data?.[0]) {
        throw new Error('Invalid NSE response format');
      }

      const niftyData = data.data[0];

      return {
        symbol: 'NIFTY 50',
        price: parseFloat(niftyData.last || niftyData.lastPrice),
        change: parseFloat(niftyData.change),
        changePercent: parseFloat(niftyData.pChange || niftyData.perChange),
        open: parseFloat(niftyData.open),
        high: parseFloat(niftyData.dayHigh || niftyData.high),
        low: parseFloat(niftyData.dayLow || niftyData.low),
        previousClose: parseFloat(niftyData.previousClose),
        volume: parseInt(niftyData.totalTradedVolume || '0', 10),
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('NSE API Error:', error);
      throw new Error(`Failed to fetch from NSE: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
