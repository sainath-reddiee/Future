import type { RawNewsArticle } from './types';

interface RSSItem {
  title?: string;
  link?: string;
  pubDate?: string;
  description?: string;
  'content:encoded'?: string;
}

export class RSSParser {
  async parseRSS(url: string, sourceName: string): Promise<RawNewsArticle[]> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; NewsAggregator/1.0)',
        },
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`RSS fetch failed: ${response.status}`);
      }

      const text = await response.text();
      return this.parseXML(text, sourceName);
    } catch (error) {
      console.error(`RSS Parser Error for ${sourceName}:`, error);
      return [];
    }
  }

  private parseXML(xml: string, sourceName: string): RawNewsArticle[] {
    const articles: RawNewsArticle[] = [];

    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    const items = xml.match(itemRegex);

    if (!items) return articles;

    for (const itemXml of items) {
      try {
        const article = this.parseItem(itemXml, sourceName);
        if (article) {
          articles.push(article);
        }
      } catch (error) {
        console.error('Error parsing RSS item:', error);
      }
    }

    return articles;
  }

  private parseItem(itemXml: string, sourceName: string): RawNewsArticle | null {
    const title = this.extractTag(itemXml, 'title');
    const link = this.extractTag(itemXml, 'link');
    const pubDate = this.extractTag(itemXml, 'pubDate');
    const description = this.extractTag(itemXml, 'description');

    if (!title || !link) {
      return null;
    }

    const cleanTitle = this.stripHtml(title);
    const cleanDescription = this.stripHtml(description || '');

    return {
      headline: cleanTitle,
      summary: cleanDescription.substring(0, 300),
      url: link,
      publishedAt: pubDate ? new Date(pubDate) : new Date(),
      source: sourceName,
    };
  }

  private extractTag(xml: string, tagName: string): string {
    const cdataRegex = new RegExp(`<${tagName}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tagName}>`, 'i');
    const cdataMatch = xml.match(cdataRegex);
    if (cdataMatch) {
      return cdataMatch[1].trim();
    }

    const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)</${tagName}>`, 'i');
    const match = xml.match(regex);
    return match ? match[1].trim() : '';
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .trim();
  }
}
