export interface RawNewsArticle {
  headline: string;
  summary?: string;
  url: string;
  publishedAt: Date;
  source: string;
}

export interface ProcessedNewsSignal extends RawNewsArticle {
  sentiment: number;
  category: string;
  rationale: string;
  relevanceScore: number;
}

export interface NewsProvider {
  name: string;
  fetchNews(): Promise<RawNewsArticle[]>;
  isAvailable(): Promise<boolean>;
}
