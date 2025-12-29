import { RSSParser } from './rss-parser';
import type { NewsProvider, RawNewsArticle } from './types';

export class BusinessStandardProvider implements NewsProvider {
  name = 'Business Standard';
  private rssParser = new RSSParser();
  private feedUrls = [
    'https://www.business-standard.com/rss/markets-106.rss',
    'https://www.business-standard.com/rss/finance-103.rss',
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

    return allArticles;
  }
}
