import type { RawNewsArticle } from './types';

export class NewsDeduplicator {
  deduplicateNews(articles: RawNewsArticle[]): RawNewsArticle[] {
    const uniqueArticles: RawNewsArticle[] = [];
    const seenHeadlines = new Set<string>();

    for (const article of articles) {
      const normalizedHeadline = this.normalizeText(article.headline);

      if (seenHeadlines.has(normalizedHeadline)) {
        continue;
      }

      let isDuplicate = false;
      for (const existingArticle of uniqueArticles) {
        const similarity = this.calculateSimilarity(
          normalizedHeadline,
          this.normalizeText(existingArticle.headline)
        );

        if (similarity > 0.8) {
          isDuplicate = true;
          if (article.publishedAt < existingArticle.publishedAt) {
            const index = uniqueArticles.indexOf(existingArticle);
            uniqueArticles[index] = article;
          }
          break;
        }
      }

      if (!isDuplicate) {
        uniqueArticles.push(article);
        seenHeadlines.add(normalizedHeadline);
      }
    }

    return uniqueArticles;
  }

  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.split(' '));
    const words2 = new Set(text2.split(' '));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }
}
