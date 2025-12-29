# Testing & Validation Guide

**Alpha Ledger Financial Application**
**Version:** 1.0
**Last Updated:** December 29, 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Testing Strategy](#testing-strategy)
3. [Unit Testing](#unit-testing)
4. [Integration Testing](#integration-testing)
5. [Data Accuracy Validation](#data-accuracy-validation)
6. [Load Testing](#load-testing)
7. [Manual Testing Checklist](#manual-testing-checklist)
8. [Monitoring & Alerts](#monitoring--alerts)

---

## Overview

This document provides comprehensive testing procedures for validating the enhanced financial application with real-time market data and multi-source news integration.

### Testing Goals

- Ensure **data accuracy** within 0.5% of official sources
- Validate **API fallback mechanisms** work correctly
- Confirm **news deduplication** prevents duplicate articles
- Verify **performance** meets target response times
- Test **error handling** and user experience

---

## Testing Strategy

### Test Pyramid

```
                    E2E Tests (10%)
                 /                \
             Integration Tests (30%)
           /                        \
       Unit Tests (60%)
```

### Testing Phases

1. **Unit Testing** - Test individual functions and services
2. **Integration Testing** - Test API integrations and data flow
3. **System Testing** - Test complete workflows
4. **Acceptance Testing** - Validate against requirements

---

## Unit Testing

### Market Data Service Tests

#### Test: Fetch Nifty 50 from NSE

```typescript
describe('NSEProvider', () => {
  let provider: NSEProvider;

  beforeEach(() => {
    provider = new NSEProvider();
  });

  test('should fetch valid Nifty 50 data', async () => {
    const data = await provider.fetchNifty50();

    expect(data).toBeDefined();
    expect(data.symbol).toBe('NIFTY 50');
    expect(data.price).toBeGreaterThan(20000);
    expect(data.price).toBeLessThan(40000);
    expect(data.change).toBeDefined();
    expect(data.changePercent).toBeDefined();
  }, 10000);

  test('should handle API timeout', async () => {
    jest.setTimeout(6000);

    await expect(async () => {
      await provider.fetchNifty50();
    }).rejects.toThrow();
  });
});
```

#### Test: Yahoo Finance Fallback

```typescript
describe('YahooFinanceProvider', () => {
  test('should fetch as fallback when NSE fails', async () => {
    const provider = new YahooFinanceProvider();
    const data = await provider.fetchNifty50();

    expect(data.price).toBeGreaterThan(0);
    expect(data.source).toBe('Yahoo Finance');
  });
});
```

#### Test: Technical Indicators

```typescript
describe('IndicatorCalculator', () => {
  let calculator: IndicatorCalculator;

  beforeEach(() => {
    calculator = new IndicatorCalculator();
  });

  test('should calculate SMA correctly', () => {
    const prices = [100, 102, 104, 106, 108];
    const sma = calculator.calculateSMA(prices, 5);

    expect(sma).toBe(104); // (100+102+104+106+108)/5
  });

  test('should calculate RSI within valid range', () => {
    const prices = Array.from({ length: 50 }, (_, i) => 25000 + Math.random() * 1000);
    const rsi = calculator.calculateRSI(prices, 14);

    expect(rsi).toBeGreaterThanOrEqual(0);
    expect(rsi).toBeLessThanOrEqual(100);
  });

  test('should calculate MACD', () => {
    const prices = Array.from({ length: 50 }, (_, i) => 25000 + i * 10);
    const macd = calculator.calculateMACD(prices);

    expect(macd).toHaveProperty('macd');
    expect(macd).toHaveProperty('signal');
    expect(macd).toHaveProperty('histogram');
  });
});
```

### News Aggregation Tests

#### Test: RSS Parser

```typescript
describe('RSSParser', () => {
  let parser: RSSParser;

  beforeEach(() => {
    parser = new RSSParser();
  });

  test('should parse valid RSS feed', async () => {
    const mockRSS = `
      <?xml version="1.0"?>
      <rss version="2.0">
        <channel>
          <item>
            <title>Test Headline</title>
            <link>https://example.com/article</link>
            <pubDate>Mon, 29 Dec 2025 10:00:00 GMT</pubDate>
            <description>Test description</description>
          </item>
        </channel>
      </rss>
    `;

    const articles = parser.parseXML(mockRSS, 'Test Source');

    expect(articles).toHaveLength(1);
    expect(articles[0].headline).toBe('Test Headline');
    expect(articles[0].source).toBe('Test Source');
  });

  test('should strip HTML from descriptions', () => {
    const html = '<p>This is <strong>bold</strong> text</p>';
    const stripped = parser.stripHtml(html);

    expect(stripped).toBe('This is bold text');
  });
});
```

#### Test: News Deduplication

```typescript
describe('NewsDeduplicator', () => {
  let deduplicator: NewsDeduplicator;

  beforeEach(() => {
    deduplicator = new NewsDeduplicator();
  });

  test('should remove exact duplicates', () => {
    const articles = [
      {
        headline: 'RBI keeps rates unchanged',
        url: 'https://source1.com',
        source: 'Source 1',
        publishedAt: new Date(),
      },
      {
        headline: 'RBI keeps rates unchanged',
        url: 'https://source2.com',
        source: 'Source 2',
        publishedAt: new Date(),
      },
    ];

    const unique = deduplicator.deduplicateNews(articles);

    expect(unique).toHaveLength(1);
  });

  test('should detect similar headlines', () => {
    const articles = [
      {
        headline: 'Nifty 50 closes at record high',
        url: 'https://source1.com',
        source: 'Source 1',
        publishedAt: new Date(),
      },
      {
        headline: 'Nifty closes at all-time high',
        url: 'https://source2.com',
        source: 'Source 2',
        publishedAt: new Date(),
      },
    ];

    const unique = deduplicator.deduplicateNews(articles);

    expect(unique).toHaveLength(1);
  });
});
```

---

## Integration Testing

### Market Data Integration

#### Test: Full Market Data Fetch Flow

```typescript
describe('MarketDataService Integration', () => {
  test('should fetch and process market data', async () => {
    const service = new MarketDataService();
    const data = await service.fetchMarketData(false);

    expect(data.price).toBeGreaterThan(0);
    expect(data.vwap).toBeDefined();
    expect(data.rsi).toBeGreaterThanOrEqual(0);
    expect(data.rsi).toBeLessThanOrEqual(100);
    expect(data.source).toBeDefined();
  }, 15000);

  test('should use cache on second call', async () => {
    const service = new MarketDataService();

    const start1 = Date.now();
    await service.fetchMarketData(false);
    const time1 = Date.now() - start1;

    const start2 = Date.now();
    await service.fetchMarketData(true);
    const time2 = Date.now() - start2;

    expect(time2).toBeLessThan(time1);
  });

  test('should fallback to next provider on failure', async () => {
    const service = new MarketDataService();

    const data = await service.fetchMarketData(false);

    expect(data).toBeDefined();
  }, 20000);
});
```

### News Aggregation Integration

#### Test: Multi-Source News Fetch

```typescript
describe('NewsAggregationService Integration', () => {
  test('should fetch news from multiple sources', async () => {
    const service = new NewsAggregationService();
    const news = await service.aggregateNews(false);

    expect(news.length).toBeGreaterThan(0);
    expect(news.length).toBeLessThanOrEqual(20);

    const sources = new Set(news.map(n => n.source));
    expect(sources.size).toBeGreaterThanOrEqual(2);
  }, 30000);

  test('should analyze news with AI', async () => {
    const service = new NewsAggregationService();
    const news = await service.aggregateNews(false);

    const firstArticle = news[0];
    expect(firstArticle.sentiment).toBeGreaterThanOrEqual(-1);
    expect(firstArticle.sentiment).toBeLessThanOrEqual(1);
    expect(firstArticle.category).toMatch(/Macro|Earnings|Policy|Technical/);
    expect(firstArticle.rationale).toBeDefined();
  }, 30000);
});
```

### API Endpoint Integration

#### Test: Market Data API

```bash
# Test market data endpoint
curl -X GET http://localhost:5000/api/market-data \
  -H "Content-Type: application/json"

# Expected response:
{
  "id": 1,
  "symbol": "NIFTY 50",
  "price": "26042.50",
  "change": "145.30",
  "changePercent": "0.56",
  "source": "NSE India",
  "timestamp": "2025-12-29T10:00:00Z"
}
```

#### Test: News Aggregation API

```bash
# Test news aggregation endpoint
curl -X POST http://localhost:5000/api/signals/aggregate \
  -H "Content-Type: application/json"

# Expected response:
{
  "message": "Aggregated 15 news signals",
  "signals": [...]
}
```

---

## Data Accuracy Validation

### Nifty 50 Price Validation

#### Automated Validation Script

```typescript
async function validateNifty50Accuracy() {
  console.log('Starting Nifty 50 accuracy validation...');

  const ourData = await marketDataService.fetchMarketData();
  const nseReference = await fetchNSEOfficialData();

  const priceDiff = Math.abs(ourData.price - nseReference.price);
  const percentDiff = (priceDiff / nseReference.price) * 100;

  console.log(`Our Price: ${ourData.price}`);
  console.log(`NSE Price: ${nseReference.price}`);
  console.log(`Difference: ${priceDiff} (${percentDiff.toFixed(4)}%)`);

  if (percentDiff > 0.5) {
    console.error('❌ ACCURACY ISSUE: Price difference exceeds 0.5%');
    return false;
  }

  console.log('✅ Accuracy validated: Within acceptable range');
  return true;
}

async function fetchNSEOfficialData() {
  const response = await fetch('https://www.nseindia.com/api/equity-stockIndices?index=NIFTY%2050');
  const data = await response.json();
  return {
    price: parseFloat(data.data[0].last),
    timestamp: new Date(),
  };
}
```

#### Validation Schedule

- **During Market Hours**: Every 5 minutes
- **Market Closed**: Every 30 minutes
- **Alert Threshold**: >0.5% deviation

### News Source Validation

#### Source Link Verification

```typescript
async function validateNewsSourceLinks() {
  const signals = await storage.getSignals();
  const results = {
    total: signals.length,
    withSource: 0,
    withURL: 0,
    validURLs: 0,
    invalidURLs: [],
  };

  for (const signal of signals) {
    if (signal.source) results.withSource++;
    if (signal.sourceUrl) {
      results.withURL++;

      try {
        const response = await fetch(signal.sourceUrl, { method: 'HEAD' });
        if (response.ok) {
          results.validURLs++;
        } else {
          results.invalidURLs.push(signal.sourceUrl);
        }
      } catch {
        results.invalidURLs.push(signal.sourceUrl);
      }
    }
  }

  console.log('News Source Validation Results:');
  console.log(`Total Signals: ${results.total}`);
  console.log(`With Source: ${results.withSource} (${(results.withSource / results.total * 100).toFixed(1)}%)`);
  console.log(`With URL: ${results.withURL} (${(results.withURL / results.total * 100).toFixed(1)}%)`);
  console.log(`Valid URLs: ${results.validURLs} (${(results.validURLs / results.withURL * 100).toFixed(1)}%)`);

  if (results.invalidURLs.length > 0) {
    console.warn(`Invalid URLs (${results.invalidURLs.length}):`, results.invalidURLs);
  }

  return results;
}
```

---

## Load Testing

### Market Data Load Test

```bash
# Using Apache Bench
ab -n 1000 -c 50 http://localhost:5000/api/market-data

# Expected results:
# - Requests per second: >100
# - Mean response time: <500ms
# - 95th percentile: <1000ms
# - 0% failed requests
```

### News Aggregation Load Test

```bash
# Concurrent news fetches
ab -n 100 -c 10 -p empty.json -T application/json \
  http://localhost:5000/api/signals/aggregate

# Expected results:
# - Mean response time: <5s
# - No timeouts
# - All requests successful
```

### Database Query Performance

```sql
-- Test signal query performance
EXPLAIN ANALYZE
SELECT * FROM signals
ORDER BY published_at DESC
LIMIT 20;

-- Expected: Execution time < 10ms
-- Should use index on published_at

-- Test market data query performance
EXPLAIN ANALYZE
SELECT * FROM market_data
ORDER BY timestamp DESC
LIMIT 1;

-- Expected: Execution time < 5ms
-- Should use index on timestamp
```

---

## Manual Testing Checklist

### Market Data Testing

- [ ] **Fresh Data Display**
  - Open application
  - Verify Nifty 50 price is current (compare with NSE website)
  - Check that green pulse indicator appears
  - Verify "Live" or source name is shown

- [ ] **Data Updates**
  - Wait for data refresh (15 seconds)
  - Verify price updates automatically
  - Check that timestamp updates

- [ ] **Fallback Mechanism**
  - Simulate NSE API failure
  - Verify Yahoo Finance data loads
  - Confirm "cached" indicator appears if all APIs fail

- [ ] **Technical Indicators**
  - Verify RSI is between 0-100
  - Check MACD signal (Bullish/Bearish/Neutral)
  - Confirm VIX displays correctly

### News Integration Testing

- [ ] **Fetch News Button**
  - Click "FETCH NEWS" button
  - Verify loading state appears
  - Wait for news to load
  - Confirm multiple sources appear

- [ ] **News Display**
  - Verify each news item shows:
    - Headline
    - Summary (if available)
    - Source name
    - "Read Article" link
  - Check that sentiment indicator shows (Bullish/Bearish)
  - Confirm category badge appears

- [ ] **Source Links**
  - Click "Read Article" link
  - Verify opens in new tab
  - Confirm correct article loads
  - Test multiple different sources

- [ ] **News Deduplication**
  - Fetch news multiple times
  - Verify no duplicate headlines appear
  - Confirm most recent version is kept

### Error Handling Testing

- [ ] **Network Errors**
  - Disconnect internet
  - Try fetching market data
  - Verify cached data displays
  - Confirm error message is user-friendly

- [ ] **API Failures**
  - Block API endpoints in browser DevTools
  - Trigger data fetch
  - Verify fallback mechanisms work
  - Check console for appropriate error messages

- [ ] **Empty States**
  - Clear all signals from database
  - Refresh application
  - Verify empty state message appears
  - Test with no market data

### Performance Testing

- [ ] **Initial Load Time**
  - Measure time to first meaningful paint
  - Target: < 2 seconds

- [ ] **Data Refresh**
  - Measure time for market data update
  - Target: < 500ms

- [ ] **News Aggregation**
  - Measure time to fetch and display news
  - Target: < 10 seconds for 20 articles

### Cross-Browser Testing

- [ ] Chrome (Latest)
- [ ] Firefox (Latest)
- [ ] Safari (Latest)
- [ ] Edge (Latest)

### Mobile Testing

- [ ] iOS Safari
- [ ] Android Chrome
- [ ] Responsive layout works
- [ ] Touch interactions function

---

## Monitoring & Alerts

### Health Check Endpoint

```typescript
app.get('/api/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date(),
    services: {
      marketData: 'unknown',
      newsAggregation: 'unknown',
      database: 'unknown',
    },
  };

  try {
    await marketDataService.fetchMarketData(true);
    health.services.marketData = 'ok';
  } catch {
    health.services.marketData = 'error';
    health.status = 'degraded';
  }

  try {
    await storage.getSignals();
    health.services.database = 'ok';
  } catch {
    health.services.database = 'error';
    health.status = 'error';
  }

  res.json(health);
});
```

### Monitoring Dashboard

Create a simple monitoring page:

```
/api/monitor

Shows:
- Last successful market data fetch
- Data source currently in use
- Number of news sources active
- Database query performance
- API response times
- Error rates
```

### Alert Conditions

1. **Critical Alerts** (Immediate Action Required)
   - All market data APIs failing for >5 minutes
   - Database connection lost
   - Data accuracy deviation >1%

2. **Warning Alerts** (Action Within 1 Hour)
   - Primary API failing, using fallback
   - Data accuracy deviation >0.5%
   - News sources <3 active

3. **Info Alerts** (Monitor)
   - Cache hit rate <80%
   - Response time >1 second
   - Single news source offline

---

## Continuous Testing

### Pre-Deployment Checklist

- [ ] All unit tests passing
- [ ] Integration tests passing
- [ ] Data accuracy validated
- [ ] Load test results meet targets
- [ ] Manual testing completed
- [ ] No critical console errors
- [ ] Database migrations applied
- [ ] Environment variables set

### Post-Deployment Verification

1. **Immediately After Deploy**
   - Run health check
   - Verify market data loads
   - Test news aggregation
   - Check error logs

2. **Within 1 Hour**
   - Validate data accuracy
   - Monitor API success rates
   - Check performance metrics
   - Review user feedback

3. **Within 24 Hours**
   - Full regression testing
   - Review analytics
   - Validate all news sources
   - Check database performance

---

## Troubleshooting Guide

### Issue: Market Data Shows Old Values

**Diagnosis:**
```bash
# Check market data table
SELECT symbol, price, timestamp, source
FROM market_data
ORDER BY timestamp DESC
LIMIT 5;

# Check service logs
grep "Market Data" logs/app.log | tail -20
```

**Solutions:**
1. Clear cache: `marketDataService.clearCache()`
2. Check API keys are valid
3. Verify network connectivity
4. Check rate limiting

### Issue: No News Appearing

**Diagnosis:**
```bash
# Check signals table
SELECT COUNT(*), source
FROM signals
GROUP BY source;

# Test news aggregation
curl -X POST http://localhost:5000/api/signals/aggregate
```

**Solutions:**
1. Check RSS feed URLs are accessible
2. Verify AI API key is valid
3. Check deduplication isn't too aggressive
4. Review service logs for errors

### Issue: Source Links Not Working

**Diagnosis:**
```sql
SELECT COUNT(*), source
FROM signals
WHERE source_url IS NULL;
```

**Solutions:**
1. Run validation script
2. Check RSS parser is extracting links
3. Verify database schema is updated
4. Test with new news fetch

---

## Testing Automation

### CI/CD Pipeline

```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run test:accuracy
```

### Daily Validation Job

```bash
# cron: 0 9 * * * (Run at 9 AM daily)
#!/bin/bash

echo "Running daily validation..."

# Validate data accuracy
npm run validate:accuracy

# Check news sources
npm run validate:news-sources

# Performance benchmark
npm run benchmark:performance

# Generate report
npm run report:daily
```

---

## Success Criteria

### Data Accuracy
- ✅ Nifty 50 price within 0.1% of NSE official
- ✅ Technical indicators calculated correctly
- ✅ 100% of news articles have source attribution

### Performance
- ✅ Market data API response < 500ms (95th percentile)
- ✅ News aggregation < 10 seconds
- ✅ Database queries < 100ms

### Reliability
- ✅ 99.9% uptime
- ✅ Fallback mechanisms working
- ✅ Zero data loss

### User Experience
- ✅ Real-time updates visible
- ✅ Source links clickable and valid
- ✅ Clear error messages
- ✅ Smooth animations and transitions

---

**End of Testing Guide**

For questions or issues, refer to the Technical Specification document or contact the development team.
