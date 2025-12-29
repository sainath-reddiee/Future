import { NSEProvider } from './nse-api';
import { YahooFinanceProvider } from './yahoo-finance';
import { IndicatorCalculator } from './indicators';
import type { CompleteMarketData, MarketDataProvider } from './types';

export class MarketDataService {
  private providers: MarketDataProvider[];
  private indicatorCalc: IndicatorCalculator;
  private cachedData: CompleteMarketData | null = null;
  private lastFetchTime: Date | null = null;
  private readonly CACHE_TTL_MS = 15000;

  constructor() {
    this.providers = [
      new NSEProvider(),
      new YahooFinanceProvider(),
    ];
    this.indicatorCalc = new IndicatorCalculator();
  }

  private isCacheValid(): boolean {
    if (!this.cachedData || !this.lastFetchTime) {
      return false;
    }

    const now = Date.now();
    const cacheAge = now - this.lastFetchTime.getTime();
    return cacheAge < this.CACHE_TTL_MS;
  }

  async fetchMarketData(useCache: boolean = true): Promise<CompleteMarketData> {
    if (useCache && this.isCacheValid() && this.cachedData) {
      console.log('Returning cached market data');
      return this.cachedData;
    }

    let lastError: Error | null = null;

    for (const provider of this.providers) {
      try {
        console.log(`Attempting to fetch from ${provider.name}...`);

        const isAvailable = await provider.isAvailable();
        if (!isAvailable) {
          console.log(`${provider.name} is not available, trying next provider`);
          continue;
        }

        const rawData = await provider.fetchNifty50();
        console.log(`Successfully fetched from ${provider.name}`);

        const indicators = await this.indicatorCalc.calculateAllIndicators(rawData.price);

        const completeData: CompleteMarketData = {
          ...rawData,
          ...indicators,
          source: provider.name,
          lastUpdated: new Date(),
        };

        this.cachedData = completeData;
        this.lastFetchTime = new Date();

        return completeData;

      } catch (error) {
        lastError = error as Error;
        console.error(`Failed to fetch from ${provider.name}:`, error);
        continue;
      }
    }

    if (this.cachedData) {
      console.warn('All providers failed, returning stale cached data');
      return {
        ...this.cachedData,
        source: `${this.cachedData.source} (cached)`,
      };
    }

    throw new Error(
      `All market data providers failed. Last error: ${lastError?.message || 'Unknown'}`
    );
  }

  getCachedData(): CompleteMarketData | null {
    return this.cachedData;
  }

  clearCache(): void {
    this.cachedData = null;
    this.lastFetchTime = null;
  }
}

export const marketDataService = new MarketDataService();
