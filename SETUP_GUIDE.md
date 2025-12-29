# Setup Guide - Alpha Ledger

## Quick Setup (5 Minutes)

Follow these steps to get your application up and running.

---

## Step 1: Get Your Supabase Database URL

### Option A: From Supabase Dashboard (Recommended)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: **0ec90b57d6e95fcbda19832f**
3. Click on **Settings** (gear icon) in the left sidebar
4. Click on **Database**
5. Scroll down to **Connection String**
6. Copy the **URI** connection string (it looks like this):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
   ```
7. Replace `[YOUR-PASSWORD]` with your actual database password

### Option B: Use Direct Connection Pooler

For better performance, use the connection pooler:
1. In Supabase Dashboard → Settings → Database
2. Under **Connection Pooling**, copy the **Transaction** mode URI
3. It looks like:
   ```
   postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```

---

## Step 2: Get Your Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click **"Get API Key"**
3. Create a new API key or use an existing one
4. Copy the API key (starts with `AIza...`)

**Note:** If you're using Replit's AI integration, the keys might already be configured. Check if `AI_INTEGRATIONS_GEMINI_API_KEY` and `AI_INTEGRATIONS_GEMINI_BASE_URL` are already set in your environment.

---

## Step 3: Configure Environment Variables

Open your `.env` file and add/update these variables:

```bash
# Supabase Configuration
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres

# Supabase Connection (already configured)
VITE_SUPABASE_URL=https://0ec90b57d6e95fcbda19832f.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJib2x0IiwicmVmIjoiMGVjOTBiNTdkNmU5NWZjYmRhMTk4MzJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODE1NzQsImV4cCI6MTc1ODg4MTU3NH0.9I8-U0x86Ak8t2DGaIk0HfvTSLsAyzdnz-Nw00mMkKw

# Gemini AI Configuration
AI_INTEGRATIONS_GEMINI_API_KEY=AIza...your-api-key-here
AI_INTEGRATIONS_GEMINI_BASE_URL=https://generativelanguage.googleapis.com
```

### Your .env file should look like this:

```bash
# Supabase
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.xxx.supabase.co:5432/postgres
VITE_SUPABASE_URL=https://0ec90b57d6e95fcbda19832f.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJib2x0IiwicmVmIjoiMGVjOTBiNTdkNmU5NWZjYmRhMTk4MzJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODE1NzQsImV4cCI6MTc1ODg4MTU3NH0.9I8-U0x86Ak8t2DGaIk0HfvTSLsAyzdnz-Nw00mMkKw

# Gemini AI (for news sentiment analysis)
AI_INTEGRATIONS_GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
AI_INTEGRATIONS_GEMINI_BASE_URL=https://generativelanguage.googleapis.com
```

**Important:** Replace:
- `YOUR_PASSWORD` with your actual Supabase database password
- `YOUR_GEMINI_API_KEY_HERE` with your actual Gemini API key

---

## Step 4: Create Database Tables

### Option A: Using Supabase SQL Editor (Recommended)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**
5. Open the file: `migrations/001_create_tables.sql`
6. Copy the entire SQL script
7. Paste it into the SQL Editor
8. Click **Run** (or press Ctrl/Cmd + Enter)
9. You should see: "Success. No rows returned"

### Option B: Using Command Line

If you have the Supabase CLI installed:

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref 0ec90b57d6e95fcbda19832f

# Run the migration
psql $DATABASE_URL -f migrations/001_create_tables.sql
```

---

## Step 5: Verify Database Setup

### Check Tables Were Created

Run this query in Supabase SQL Editor:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

You should see these 5 tables:
- ✅ api_cache
- ✅ market_data
- ✅ portfolio
- ✅ signals
- ✅ trades

### Check Seed Data

Run this to verify seed data was inserted:

```sql
SELECT headline, source FROM signals;
```

You should see 2 news signals:
- RBI keeps repo rate unchanged at 6.5% (Economic Times)
- Infosys misses revenue guidance (MoneyControl)

---

## Step 6: Install Dependencies and Start the App

```bash
# Install dependencies (if not already installed)
npm install

# Start the development server
npm run dev
```

The application should now be running!

---

## Troubleshooting

### Database Connection Issues

**Error:** "DATABASE_URL must be set"

**Solution:**
1. Check that `DATABASE_URL` is in your `.env` file
2. Make sure there are no spaces around the `=` sign
3. Ensure the password doesn't contain special characters that need escaping
4. Try restarting the terminal/application

**Error:** "password authentication failed"

**Solution:**
1. Verify your database password in Supabase Dashboard
2. You can reset the password: Dashboard → Settings → Database → Reset Database Password
3. Update the `DATABASE_URL` with the new password

### Gemini API Issues

**Error:** "No response from AI" or "Failed to analyze news"

**Solution:**
1. Verify your Gemini API key is correct
2. Check you have API credits remaining at [Google AI Studio](https://makersuite.google.com/)
3. Ensure `AI_INTEGRATIONS_GEMINI_BASE_URL` is set correctly
4. Try generating a new API key if the current one doesn't work

### Migration Issues

**Error:** "relation already exists"

**Solution:**
This is normal if tables were already created. The migration uses `CREATE TABLE IF NOT EXISTS`, so it's safe to run multiple times.

**Error:** "syntax error at or near"

**Solution:**
1. Make sure you copied the entire SQL script
2. Try running it section by section
3. Check for any copy-paste issues

---

## Where Are the API Keys Used?

### Gemini API Key Location in Code

The Gemini API key is used in these files:

1. **server/routes.ts** (line 12-18)
   ```typescript
   const ai = new GoogleGenAI({
     apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
     httpOptions: {
       apiVersion: "",
       baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
     },
   });
   ```

2. **server/services/news-aggregation/index.ts** (line 18-24)
   ```typescript
   this.ai = new GoogleGenAI({
     apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
     httpOptions: {
       apiVersion: "",
       baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
     },
   });
   ```

The app will automatically pick up the API key from your `.env` file. No code changes needed!

---

## Testing Your Setup

### 1. Test Market Data

Open the application and check the **NIFTY 50 panel** at the top left:
- Should show a current price (not 24,501)
- Green pulsing dot should appear
- Should say "NSE India" or "Yahoo Finance" as the source
- "X seconds ago" should update

### 2. Test News Aggregation

In the **Signal Feed panel** on the right:
1. Click the green **"FETCH NEWS"** button
2. Wait 8-10 seconds (it fetches from multiple sources)
3. You should see news articles appear with:
   - Headlines from Economic Times, MoneyControl, Business Standard
   - Source names at the bottom
   - Clickable "Read Article" links

### 3. Test Manual Signal Entry

Click the **"SIMULATE"** button to test the AI analysis:
- A random headline will be analyzed
- Should appear in the feed with sentiment and rationale
- Confirms Gemini API is working

---

## Environment Variables Checklist

Make sure you have all these in your `.env` file:

- [ ] `DATABASE_URL` - Your Supabase connection string
- [ ] `VITE_SUPABASE_URL` - Already configured (0ec90b57d6e95fcbda19832f.supabase.co)
- [ ] `VITE_SUPABASE_ANON_KEY` - Already configured
- [ ] `AI_INTEGRATIONS_GEMINI_API_KEY` - Your Gemini API key
- [ ] `AI_INTEGRATIONS_GEMINI_BASE_URL` - Set to https://generativelanguage.googleapis.com

---

## Quick Reference: File Locations

**Where to add Gemini API key:**
- File: `.env`
- Variable: `AI_INTEGRATIONS_GEMINI_API_KEY=your-key-here`

**Where to add Database URL:**
- File: `.env`
- Variable: `DATABASE_URL=postgresql://...`

**Database migration script:**
- File: `migrations/001_create_tables.sql`
- Run in: Supabase SQL Editor

**Server configuration:**
- File: `server/routes.ts` (reads from .env)
- File: `server/db.ts` (uses DATABASE_URL)

---

## Next Steps

Once everything is set up:

1. **Read the Documentation:**
   - `README_ENHANCEMENTS.md` - User guide
   - `TECHNICAL_SPECIFICATION.md` - Technical details
   - `TESTING_GUIDE.md` - Testing procedures

2. **Explore the Features:**
   - Real-time Nifty 50 data
   - Multi-source news aggregation
   - AI sentiment analysis
   - Source attribution with links

3. **Customize:**
   - Add more news sources
   - Adjust cache TTL
   - Modify AI prompts
   - Add custom indicators

---

## Support

If you encounter any issues:

1. Check the browser console for errors (F12 → Console tab)
2. Check the server logs in your terminal
3. Verify all environment variables are set correctly
4. Ensure your Supabase database is accessible
5. Test your Gemini API key at [Google AI Studio](https://makersuite.google.com/)

---

## Quick Start Commands

```bash
# 1. Install dependencies
npm install

# 2. Start the application
npm run dev

# 3. Open browser
# Go to: http://localhost:5000
```

That's it! Your Alpha Ledger application should now be running with real-time market data and multi-source news integration.

**Enjoy your enhanced financial application!** 🚀📈
