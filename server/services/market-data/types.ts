export interface RawMarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  volume: number;
  timestamp: Date;
}

export interface TechnicalIndicators {
  vwap: number;
  sma50: number;
  ema9: number;
  ema21: number;
  rsi: number;
  macd: {
    macd: number;
    signal: number;
    histogram: number;
  };
  vix: number;
}

export interface CompleteMarketData extends RawMarketData, TechnicalIndicators {
  source: string;
  lastUpdated: Date;
}

export interface MarketDataProvider {
  name: string;
  fetchNifty50(): Promise<RawMarketData>;
  isAvailable(): Promise<boolean>;
}
