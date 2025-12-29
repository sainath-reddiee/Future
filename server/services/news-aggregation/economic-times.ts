import { RSSParser } from './rss-parser';
import type { NewsProvider, RawNewsArticle } from './types';

export class EconomicTimesProvider implements NewsProvider {
  name = 'Economic Times';
  private rssParser = new RSSParser();
  private feedUrls = [
    'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms',
    'https://economictimes.indiatimes.com/news/economy/rssfeeds/1373380680.cms',
  ];

  async isAvailable(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(this.feedUrls[0], {
        signal: controller.signal,
        method: 'HEAD',
      });

      clearTimeout(timeout);
      return response.ok;
    } catch {
      return false;
    }
  }

  async fetchNews(): Promise<RawNewsArticle[]> {
    const allArticles: RawNewsArticle[] = [];

    for (const feedUrl of this.feedUrls) {
      try {
        const articles = await this.rssParser.parseRSS(feedUrl, this.name);
        allArticles.push(...articles);
      } catch (error) {
        console.error(`Failed to fetch from ${feedUrl}:`, error);
      }
    }

    return this.filterRelevant(allArticles);
  }

  private filterRelevant(articles: RawNewsArticle[]): RawNewsArticle[] {
    const keywords = [
      'nifty', 'sensex', 'market', 'stock', 'share', 'equity',
      'rbi', 'policy', 'rate', 'inflation', 'gdp', 'economy',
      'banking', 'finance', 'investment', 'trading'
    ];

    return articles.filter(article => {
      const text = `${article.headline} ${article.summary}`.toLowerCase();
      return keywords.some(keyword => text.includes(keyword));
    });
  }
}
