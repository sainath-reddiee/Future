# Financial Application Enhancement - Technical Specification

**Version:** 1.0
**Date:** December 29, 2025
**Status:** Implementation Ready

---

## Executive Summary

This document outlines the comprehensive solution to address critical data accuracy issues and enhance news integration capabilities in the Alpha Ledger financial application.

### Current Issues Identified
- **Nifty 50 Data Inaccuracy**: Hardcoded dummy value of 24,501 vs actual market value of 26,042+
- **Limited News Sources**: Single signal generation without real news sources
- **Missing Source Attribution**: No URLs or source links for news articles
- **No Real-time Data**: Static data without live market feeds

---

## 1. Market Data Integration Strategy

### 1.1 API Selection & Justification

#### Primary API: Yahoo Finance (via yfinance-style REST endpoints)
- **Cost**: FREE
- **Rate Limit**: Generous (up to 2,000 requests/hour)
- **Data Refresh**: Real-time quotes with 15-second delay
- **Coverage**: NSE, BSE, global indices
- **Reliability**: 99.9% uptime
- **Implementation**: Direct HTTP REST calls

**Alternative APIs for Redundancy:**

1. **Alpha Vantage** (Free Tier)
   - 5 API calls/minute, 500 calls/day
   - 15-minute delayed data
   - Use as fallback #1

2. **Polygon.io** (Free Tier)
   - Limited to 5 calls/minute
   - Previous day's data only
   - Use for historical technical indicators

3. **NSE India Public API** (Free)
   - Direct NSE data (most accurate)
   - Rate limited but reliable
   - Primary source for Nifty 50

### 1.2 Data Points to Fetch
```typescript
interface LiveMarketData {
  symbol: string;           // "NIFTY 50"
  price: number;            // Current market price
  change: number;           // Absolute change
  changePercent: number;    // Percentage change
  open: number;             // Day open price
  high: number;             // Day high
  low: number;              // Day low
  previousClose: number;    // Previous close
  volume: number;           // Trading volume

  // Technical indicators (calculated)
  vwap: number;             // Volume-weighted average price
  sma50: number;            // 50-day simple moving average
  ema9: number;             // 9-day exponential moving average
  ema21: number;            // 21-day exponential moving average
  rsi: number;              // Relative strength index
  macd: {
    macd: number;
    signal: number;
    histogram: number;
  };
  vix: number;              // Volatility index (India VIX)

  lastUpdated: Date;        // Timestamp of data
  source: string;           // API source name
}
```

### 1.3 Update Frequency
- **Primary Markets Open**: Every 15 seconds
- **Markets Closed**: Every 5 minutes (for after-hours data)
- **Weekends/Holidays**: Every 30 minutes (last known values)

### 1.4 Fallback Strategy
```
1. Try NSE India API → Success? Update DB
2. If fails, try Yahoo Finance → Success? Update DB
3. If fails, try Alpha Vantage → Success? Update DB
4. If all fail, use cached data (max 15 min old) + error flag
```

---

## 2. Multi-Source News Integration

### 2.1 News Sources Configuration

#### Primary Sources

1. **Economic Times API**
   - **Endpoint**: ET RSS Feed / Unofficial API
   - **Cost**: FREE (RSS)
   - **Coverage**: Indian markets, policy, macro
   - **Update Frequency**: Real-time
   - **Implementation**: RSS parser or web scraper

2. **Perplexity Finance AI**
   - **Endpoint**: Perplexity API
   - **Cost**: Pay-as-you-go ($0.15/1k tokens)
   - **Coverage**: AI-summarized financial insights
   - **Use Case**: Signal analysis and sentiment scoring
   - **Implementation**: API integration with caching

3. **MoneyControl**
   - **Endpoint**: RSS Feed
   - **Cost**: FREE
   - **Coverage**: Indian stocks, markets
   - **Update Frequency**: Real-time

4. **Business Standard**
   - **Endpoint**: RSS Feed
   - **Cost**: FREE
   - **Coverage**: Business news, policy

5. **Reuters India Business**
   - **Endpoint**: RSS Feed / API
   - **Cost**: FREE (RSS)
   - **Coverage**: Global markets affecting India

### 2.2 News Data Schema
```typescript
interface NewsSignal {
  id: number;
  headline: string;
  summary: string;          // NEW: 2-3 sentence summary
  source: string;           // NEW: "Economic Times", "MoneyControl", etc.
  sourceUrl: string;        // NEW: Original article URL
  category: string;         // "Macro", "Earnings", "Policy", "Technical"
  sentiment: number;        // -1.0 to 1.0
  rationale: string;        // AI-generated reasoning
  publishedAt: Date;        // NEW: Original publication time
  fetchedAt: Date;          // When we fetched it
  relevanceScore: number;   // NEW: 0-100 relevance to Nifty 50
}
```

### 2.3 News Aggregation Strategy

**Workflow:**
1. **Fetch** from all sources every 2 minutes
2. **Deduplicate** similar headlines using text similarity
3. **Filter** for market relevance (Nifty 50, Indian markets)
4. **Analyze** with AI (Gemini) for sentiment
5. **Store** with full metadata
6. **Display** top 20 most recent/relevant

**Deduplication Logic:**
- Use Levenshtein distance or cosine similarity
- Merge articles with >80% similarity
- Prefer source with earlier timestamp

---

## 3. Database Schema Updates

### 3.1 Enhanced Signals Table
```sql
-- Migration: Add news metadata to signals table
ALTER TABLE signals
  ADD COLUMN source VARCHAR(100),
  ADD COLUMN source_url TEXT,
  ADD COLUMN summary TEXT,
  ADD COLUMN published_at TIMESTAMP,
  ADD COLUMN fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN relevance_score NUMERIC(5,2) DEFAULT 75.0;

-- Create index for faster queries
CREATE INDEX idx_signals_published_at ON signals(published_at DESC);
CREATE INDEX idx_signals_source ON signals(source);
```

### 3.2 Enhanced Market Data Table
```sql
-- Migration: Add more market data fields
ALTER TABLE market_data
  ADD COLUMN change_percent NUMERIC,
  ADD COLUMN open NUMERIC,
  ADD COLUMN high NUMERIC,
  ADD COLUMN low NUMERIC,
  ADD COLUMN previous_close NUMERIC,
  ADD COLUMN volume BIGINT,
  ADD COLUMN source VARCHAR(50),
  ADD COLUMN last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create index for time-series queries
CREATE INDEX idx_market_data_timestamp ON market_data(timestamp DESC);
```

### 3.3 New API Cache Table
```sql
-- New table for caching external API responses
CREATE TABLE api_cache (
  id SERIAL PRIMARY KEY,
  cache_key VARCHAR(255) UNIQUE NOT NULL,
  cache_value JSONB NOT NULL,
  source VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_api_cache_key ON api_cache(cache_key);
CREATE INDEX idx_api_cache_expires ON api_cache(expires_at);
```

---

## 4. Backend Architecture

### 4.1 Service Layer Structure
```
server/
├── services/
│   ├── market-data/
│   │   ├── index.ts              # Main market data service
│   │   ├── nse-api.ts            # NSE India API client
│   │   ├── yahoo-finance.ts      # Yahoo Finance client
│   │   ├── alpha-vantage.ts      # Alpha Vantage client
│   │   ├── indicators.ts         # Technical indicator calculations
│   │   └── fallback-handler.ts  # Fallback logic
│   ├── news-aggregation/
│   │   ├── index.ts              # Main news aggregator
│   │   ├── economic-times.ts     # ET news fetcher
│   │   ├── moneycontrol.ts       # MoneyControl fetcher
│   │   ├── business-standard.ts  # Business Standard fetcher
│   │   ├── reuters.ts            # Reuters fetcher
│   │   ├── perplexity-ai.ts      # Perplexity integration
│   │   ├── deduplicator.ts       # Deduplication logic
│   │   └── relevance-filter.ts   # Relevance scoring
│   └── cache/
│       ├── index.ts              # Cache management
│       └── strategies.ts         # Cache strategies
```

### 4.2 API Rate Limiting Strategy
```typescript
// Rate limiter configuration
const rateLimits = {
  nseIndia: { requests: 60, perMinutes: 1 },
  yahooFinance: { requests: 2000, perMinutes: 60 },
  alphaVantage: { requests: 5, perMinutes: 1 },
  perplexity: { requests: 100, perMinutes: 60 },
};

// Implement token bucket algorithm
class RateLimiter {
  private tokens: Map<string, number>;
  private lastRefill: Map<string, Date>;

  async checkLimit(service: string): Promise<boolean>;
  async waitForToken(service: string): Promise<void>;
}
```

### 4.3 Caching Strategy

**Cache Layers:**
1. **In-Memory Cache** (Redis-style, using memory)
   - Market data: 15 seconds TTL
   - News headlines: 2 minutes TTL
   - Technical indicators: 5 minutes TTL

2. **Database Cache** (api_cache table)
   - Historical data: 24 hours TTL
   - Fallback data: 1 hour TTL

3. **Cache Invalidation Rules:**
   - Market data: Invalidate on new API success
   - News: Invalidate on new fetch
   - Manual invalidation endpoint for emergencies

---

## 5. Frontend Updates

### 5.1 SignalFeed Component Enhancement
```typescript
// Add source link display
<div className="flex items-center gap-2 text-xs">
  <span className="text-zinc-500">{signal.source}</span>
  {signal.sourceUrl && (
    <a
      href={signal.sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="text-accent hover:underline flex items-center gap-1"
    >
      <ExternalLink className="w-3 h-3" />
      Read More
    </a>
  )}
</div>
```

### 5.2 HUD Component - Real Data Display
```typescript
// Show data source and freshness indicator
<div className="flex items-center gap-1">
  <span className={cn(
    "w-2 h-2 rounded-full",
    dataAge < 30 ? "bg-green-500 animate-pulse" : "bg-yellow-500"
  )} />
  <span className="text-[10px] text-zinc-600">
    {dataSource} • {formatDistanceToNow(lastUpdated)}
  </span>
</div>
```

---

## 6. Error Handling & Resilience

### 6.1 Error Scenarios

| Scenario | Detection | Response | User Feedback |
|----------|-----------|----------|---------------|
| API Down | HTTP timeout (5s) | Try fallback API | Show warning banner |
| Rate Limit | 429 status | Use cache, wait | Show "Using cached data" |
| Invalid Data | Schema validation | Log + use last valid | No interruption |
| Network Error | Connection timeout | Retry 3x with backoff | Show offline mode |
| All APIs Fail | All fallbacks exhausted | Use last cached data | Show error message |

### 6.2 Monitoring & Logging
```typescript
interface ApiHealthMetrics {
  service: string;
  successRate: number;      // Last 100 calls
  avgResponseTime: number;  // ms
  lastSuccess: Date;
  lastFailure: Date;
  totalCalls: number;
  failedCalls: number;
}

// Log to console + store in DB for analysis
logger.error('API_FAILURE', {
  service: 'nse-india',
  error: error.message,
  retryAttempt: 2,
  timestamp: new Date(),
});
```

---

## 7. Cost Analysis

### 7.1 API Costs (Monthly)

| Service | Tier | Cost | Usage Estimate |
|---------|------|------|----------------|
| NSE India | Free | $0 | Primary source |
| Yahoo Finance | Free | $0 | Backup source |
| Alpha Vantage | Free | $0 | Fallback |
| Perplexity AI | Pay-as-go | ~$15-30 | ~100k tokens/month |
| **Total** | | **$15-30/month** | Cost-effective |

### 7.2 Infrastructure Costs
- Database storage: Negligible (<100MB growth/month)
- Compute: No additional cost (same server)
- Bandwidth: Minimal (~5GB/month)

**Total Monthly Cost: $15-30** (highly cost-effective)

---

## 8. Performance Optimization

### 8.1 Response Time Targets
- Market data API: <500ms (95th percentile)
- News fetch: <2s (95th percentile)
- Database queries: <100ms (99th percentile)
- Frontend render: <16ms (60 FPS)

### 8.2 Optimization Techniques
1. **API Request Batching**: Combine multiple data points in single request
2. **Parallel Fetching**: Fetch from all news sources simultaneously
3. **Lazy Loading**: Load news on-demand with infinite scroll
4. **WebSocket Updates**: Push market data updates instead of polling
5. **Database Indexing**: Optimize queries with proper indexes

---

## 9. Compliance & Regulations

### 9.1 Financial Data Regulations
- **SEBI Guidelines**: Ensure 15-minute delay for free data (compliant)
- **Terms of Service**: Respect API provider ToS
- **Attribution**: Display data source as required
- **No Redistribution**: Data for internal use only

### 9.2 Data Privacy
- No personal financial data stored
- Session data only (no PII)
- GDPR not applicable (business tool)

---

## 10. Testing Strategy

### 10.1 Unit Tests
```typescript
// Market data service tests
describe('MarketDataService', () => {
  test('fetches Nifty 50 data from NSE', async () => {
    const data = await marketDataService.fetchNifty50();
    expect(data.price).toBeGreaterThan(20000);
    expect(data.symbol).toBe('NIFTY 50');
  });

  test('falls back to Yahoo Finance on NSE failure', async () => {
    mockNSEAPI.mockRejectedValue(new Error('API Down'));
    const data = await marketDataService.fetchNifty50();
    expect(data.source).toBe('yahoo-finance');
  });
});
```

### 10.2 Integration Tests
- Test full news aggregation pipeline
- Test API fallback chain
- Test cache invalidation
- Test rate limiting

### 10.3 Data Accuracy Validation
```typescript
// Validation suite
const validateMarketData = async () => {
  const ourData = await fetchNifty50();
  const referenceData = await fetchFromNSEOfficial();

  const priceDiff = Math.abs(ourData.price - referenceData.price);
  const percentDiff = (priceDiff / referenceData.price) * 100;

  // Alert if difference > 0.5%
  if (percentDiff > 0.5) {
    logger.error('DATA_ACCURACY_ISSUE', { ourData, referenceData });
  }
};
```

### 10.4 Load Testing
- Simulate 100 concurrent users
- Test during market open (high volatility)
- Measure API response times under load

---

## 11. Implementation Roadmap

### Phase 1: Foundation (Week 1)
**Days 1-2:**
- Database schema migration
- Set up service layer structure
- Implement caching infrastructure

**Days 3-4:**
- Integrate NSE India API
- Integrate Yahoo Finance API
- Implement fallback logic

**Days 5-7:**
- Add technical indicator calculations
- Implement rate limiting
- Unit tests for market data service

### Phase 2: News Integration (Week 2)
**Days 1-3:**
- Economic Times integration
- MoneyControl integration
- Business Standard integration
- Reuters integration

**Days 4-5:**
- Perplexity AI integration
- Deduplication logic
- Relevance filtering

**Days 6-7:**
- News aggregation scheduler
- Integration tests
- Performance optimization

### Phase 3: Frontend & Polish (Week 3)
**Days 1-2:**
- Update SignalFeed component
- Add source links
- Enhance HUD with real-time indicators

**Days 3-4:**
- Error handling UI
- Loading states
- Empty states

**Days 5-7:**
- End-to-end testing
- Data accuracy validation
- Performance tuning
- Documentation

### Phase 4: Monitoring & Launch (Week 4)
**Days 1-2:**
- Set up monitoring dashboard
- Implement health checks
- Alert system

**Days 3-4:**
- Load testing
- Security audit
- Compliance review

**Days 5-7:**
- Soft launch (internal)
- Bug fixes
- Production deployment

---

## 12. Potential Challenges & Mitigation

| Challenge | Impact | Probability | Mitigation |
|-----------|--------|-------------|------------|
| API Rate Limits | High | Medium | Implement caching, multiple sources |
| Data Accuracy | Critical | Low | Multiple source validation, alerts |
| API Downtime | High | Medium | Fallback chain, cached data |
| Performance Issues | Medium | Low | Optimize queries, add indexes |
| Cost Overruns | Low | Low | Monitor usage, set limits |
| News Deduplication | Medium | Medium | Tune similarity threshold |
| Market Hours Only | Low | High | Design for 24/7 with stale data handling |

---

## 13. Success Metrics

### 13.1 Data Accuracy
- **Target**: Nifty 50 price within 0.1% of NSE official
- **Measurement**: Hourly validation against NSE
- **Alert**: If deviation > 0.5% for >5 minutes

### 13.2 System Reliability
- **Uptime Target**: 99.9% (43 minutes downtime/month)
- **Data Freshness**: 95% of data <30 seconds old
- **API Success Rate**: >98%

### 13.3 User Experience
- **Page Load**: <2 seconds (initial)
- **Data Update**: <500ms (incremental)
- **News Sources**: Minimum 5 active sources
- **Source Attribution**: 100% of news with clickable links

---

## 14. Future Enhancements (Post-Launch)

### Version 2.0 Features
1. **More Markets**: Add Sensex, Bank Nifty, Sectoral indices
2. **Stock-Level Data**: Individual stock tracking
3. **Custom Alerts**: User-defined price/news alerts
4. **Historical Analysis**: Backtesting AI signals
5. **Mobile App**: React Native mobile version
6. **Real-time WebSockets**: Push updates instead of polling
7. **Premium Sources**: Bloomberg, Financial Times integration
8. **Advanced AI**: GPT-4 for deeper analysis

---

## Appendix A: API Endpoints Documentation

### NSE India API
```
Base URL: https://www.nseindia.com/api

GET /equity-stockIndices?index=NIFTY 50
Response: {
  "data": [{
    "symbol": "NIFTY 50",
    "last": 26042.50,
    "change": 145.30,
    "pChange": 0.56,
    "open": 25950.00,
    "high": 26080.00,
    "low": 25940.00,
    "previousClose": 25897.20
  }]
}
```

### Yahoo Finance
```
Base URL: https://query1.finance.yahoo.com/v8/finance

GET /chart/%5ENSEI?interval=1m&range=1d
Response: {
  "chart": {
    "result": [{
      "meta": {
        "regularMarketPrice": 26042.50,
        "previousClose": 25897.20,
        "chartPreviousClose": 25897.20
      },
      "indicators": { ... }
    }]
  }
}
```

---

## Appendix B: Environment Variables

```bash
# API Keys
NSE_API_KEY=not_required
YAHOO_FINANCE_KEY=not_required
ALPHA_VANTAGE_KEY=your_free_key_here
PERPLEXITY_API_KEY=your_perplexity_key

# Cache Configuration
REDIS_URL=redis://localhost:6379  # Optional
CACHE_TTL_MARKET=15
CACHE_TTL_NEWS=120
CACHE_TTL_INDICATORS=300

# Rate Limiting
MAX_API_CALLS_PER_MINUTE=100
ENABLE_RATE_LIMITING=true

# Feature Flags
ENABLE_PERPLEXITY_AI=true
ENABLE_NEWS_AGGREGATION=true
ENABLE_REAL_TIME_DATA=true

# Monitoring
LOG_LEVEL=info
ENABLE_API_METRICS=true
```

---

**Document Approval:**
- Technical Lead: Pending Review
- Product Manager: Pending Review
- Compliance Officer: Pending Review

**Last Updated:** December 29, 2025
