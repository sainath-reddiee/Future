/*
  # Alpha Ledger Database Schema

  Run this SQL in your Supabase SQL Editor to create all required tables.

  Navigate to: Supabase Dashboard → SQL Editor → New Query → Paste this script → Run
*/

-- Create trades table
CREATE TABLE IF NOT EXISTS trades (
  id SERIAL PRIMARY KEY,
  headline TEXT NOT NULL,
  entry_price NUMERIC NOT NULL,
  current_price NUMERIC NOT NULL,
  pnl NUMERIC NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('OPEN', 'CLOSED')),
  exit_logic TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create signals table with enhanced fields for news sources
CREATE TABLE IF NOT EXISTS signals (
  id SERIAL PRIMARY KEY,
  headline TEXT NOT NULL,
  sentiment NUMERIC NOT NULL CHECK (sentiment >= -1.0 AND sentiment <= 1.0),
  category TEXT NOT NULL CHECK (category IN ('Macro', 'Earnings', 'Policy', 'Technical')),
  rationale TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  source VARCHAR(100),
  source_url TEXT,
  summary TEXT,
  published_at TIMESTAMPTZ,
  relevance_score NUMERIC(5,2) DEFAULT 75.0 CHECK (relevance_score >= 0 AND relevance_score <= 100)
);

-- Create portfolio table
CREATE TABLE IF NOT EXISTS portfolio (
  id SERIAL PRIMARY KEY,
  balance NUMERIC NOT NULL DEFAULT 100000,
  equity_curve JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_realized_pnl NUMERIC NOT NULL DEFAULT 0,
  total_unrealized_pnl NUMERIC NOT NULL DEFAULT 0,
  ai_accuracy NUMERIC NOT NULL DEFAULT 0
);

-- Create market_data table with enhanced fields
CREATE TABLE IF NOT EXISTS market_data (
  id SERIAL PRIMARY KEY,
  symbol TEXT NOT NULL,
  price NUMERIC NOT NULL,
  change NUMERIC NOT NULL,
  change_percent NUMERIC,
  open NUMERIC,
  high NUMERIC,
  low NUMERIC,
  previous_close NUMERIC,
  volume NUMERIC,
  vwap NUMERIC NOT NULL,
  sma50 NUMERIC NOT NULL,
  ema9 NUMERIC NOT NULL,
  ema21 NUMERIC NOT NULL,
  rsi NUMERIC NOT NULL CHECK (rsi >= 0 AND rsi <= 100),
  macd JSONB NOT NULL,
  vix NUMERIC NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  source VARCHAR(50),
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Create api_cache table
CREATE TABLE IF NOT EXISTS api_cache (
  id SERIAL PRIMARY KEY,
  cache_key VARCHAR(255) NOT NULL UNIQUE,
  cache_value JSONB NOT NULL,
  source VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_signals_timestamp ON signals(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_signals_published_at ON signals(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_signals_source ON signals(source);
CREATE INDEX IF NOT EXISTS idx_market_data_timestamp ON market_data(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_api_cache_key ON api_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_api_cache_expires ON api_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_trades_timestamp ON trades(timestamp DESC);

-- Enable Row Level Security
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_cache ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all access to trades" ON trades;
DROP POLICY IF EXISTS "Allow all access to signals" ON signals;
DROP POLICY IF EXISTS "Allow all access to portfolio" ON portfolio;
DROP POLICY IF EXISTS "Allow all access to market_data" ON market_data;
DROP POLICY IF EXISTS "Allow all access to api_cache" ON api_cache;

-- Create policies for public access (demo app)
CREATE POLICY "Allow all access to trades"
  ON trades FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all access to signals"
  ON signals FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all access to portfolio"
  ON portfolio FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all access to market_data"
  ON market_data FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all access to api_cache"
  ON api_cache FOR ALL
  USING (true)
  WITH CHECK (true);

-- Insert initial portfolio record
INSERT INTO portfolio (balance, equity_curve, total_realized_pnl, total_unrealized_pnl, ai_accuracy)
VALUES (100000, '[]'::jsonb, 0, 0, 0)
ON CONFLICT DO NOTHING;

-- Insert seed data for signals
INSERT INTO signals (headline, sentiment, category, rationale, source, source_url, summary, published_at, relevance_score)
VALUES
  (
    'RBI keeps repo rate unchanged at 6.5%',
    0.8,
    'Policy',
    'Stability signals bullish trend for banking sector.',
    'Economic Times',
    'https://economictimes.indiatimes.com',
    'The Reserve Bank of India maintains its repo rate at 6.5% signaling economic stability.',
    NOW(),
    90.0
  ),
  (
    'Infosys misses revenue guidance',
    -0.6,
    'Earnings',
    'IT sector likely to face short-term pressure.',
    'MoneyControl',
    'https://www.moneycontrol.com',
    'Infosys reports earnings below analyst expectations affecting IT sector sentiment.',
    NOW(),
    85.0
  )
ON CONFLICT DO NOTHING;
