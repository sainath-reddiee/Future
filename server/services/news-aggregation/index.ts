import { EconomicTimesProvider } from './economic-times';
import { MoneyControlProvider } from './moneycontrol';
import { BusinessStandardProvider } from './business-standard';
import { NewsDeduplicator } from './deduplicator';
import { GoogleGenAI } from "@google/genai";
import type { NewsProvider, RawNewsArticle, ProcessedNewsSignal } from './types';

export class NewsAggregationService {
  private providers: NewsProvider[];
  private deduplicator: NewsDeduplicator;
  private ai: GoogleGenAI;
  private lastFetchTime: Date | null = null;
  private cachedNews: ProcessedNewsSignal[] = [];
  private readonly CACHE_TTL_MS = 120000;

  constructor() {
    this.providers = [
      new EconomicTimesProvider(),
      new MoneyControlProvider(),
      new BusinessStandardProvider(),
    ];
    this.deduplicator = new NewsDeduplicator();
    this.ai = new GoogleGenAI({
      apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
      httpOptions: {
        apiVersion: "",
        baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
      },
    });
  }

  private isCacheValid(): boolean {
    if (!this.lastFetchTime) {
      return false;
    }

    const now = Date.now();
    const cacheAge = now - this.lastFetchTime.getTime();
    return cacheAge < this.CACHE_TTL_MS;
  }

  async aggregateNews(useCache: boolean = true): Promise<ProcessedNewsSignal[]> {
    if (useCache && this.isCacheValid() && this.cachedNews.length > 0) {
      console.log('Returning cached news');
      return this.cachedNews;
    }

    console.log('Fetching fresh news from all sources...');

    const fetchPromises = this.providers.map(async (provider) => {
      try {
        console.log(`Fetching from ${provider.name}...`);
        const articles = await provider.fetchNews();
        console.log(`Fetched ${articles.length} articles from ${provider.name}`);
        return articles;
      } catch (error) {
        console.error(`Failed to fetch from ${provider.name}:`, error);
        return [];
      }
    });

    const results = await Promise.all(fetchPromises);
    const allArticles = results.flat();

    console.log(`Total articles before deduplication: ${allArticles.length}`);

    const uniqueArticles = this.deduplicator.deduplicateNews(allArticles);
    console.log(`Unique articles after deduplication: ${uniqueArticles.length}`);

    const sortedArticles = uniqueArticles.sort(
      (a, b) => b.publishedAt.getTime() - a.publishedAt.getTime()
    );

    const topArticles = sortedArticles.slice(0, 20);

    const processedNews = await this.analyzeArticles(topArticles);

    this.cachedNews = processedNews;
    this.lastFetchTime = new Date();

    return processedNews;
  }

  private async analyzeArticles(articles: RawNewsArticle[]): Promise<ProcessedNewsSignal[]> {
    const processed: ProcessedNewsSignal[] = [];

    for (const article of articles) {
      try {
        const analysis = await this.analyzeWithAI(article.headline, article.summary || '');

        processed.push({
          ...article,
          sentiment: analysis.sentiment,
          category: analysis.category,
          rationale: analysis.rationale,
          relevanceScore: analysis.relevanceScore,
        });

        await this.delay(100);

      } catch (error) {
        console.error(`Failed to analyze article: ${article.headline}`, error);

        processed.push({
          ...article,
          sentiment: 0,
          category: 'Macro',
          rationale: 'Analysis pending',
          relevanceScore: 50,
        });
      }
    }

    return processed;
  }

  private async analyzeWithAI(headline: string, summary: string): Promise<{
    sentiment: number;
    category: string;
    rationale: string;
    relevanceScore: number;
  }> {
    const prompt = `Analyze this financial news for its 1-hour impact on Nifty 50.
Output ONLY valid JSON with this exact structure:
{
  "sentiment": <number between -1.0 and 1.0>,
  "category": "<one of: Macro, Earnings, Policy, Technical>",
  "rationale": "<10 words max explaining the impact>",
  "relevanceScore": <number between 0 and 100 indicating relevance to Nifty 50>
}

Headline: "${headline}"
Summary: "${summary.substring(0, 200)}"`;

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      const text = response.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error("No response from AI");
      }

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Invalid AI response format");
      }

      const analysis = JSON.parse(jsonMatch[0]);

      return {
        sentiment: Number(analysis.sentiment),
        category: analysis.category,
        rationale: analysis.rationale,
        relevanceScore: Number(analysis.relevanceScore),
      };
    } catch (error) {
      console.error('AI Analysis Error:', error);
      return {
        sentiment: 0,
        category: 'Macro',
        rationale: 'Unable to analyze',
        relevanceScore: 50,
      };
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  clearCache(): void {
    this.cachedNews = [];
    this.lastFetchTime = null;
  }
}

export const newsAggregationService = new NewsAggregationService();
