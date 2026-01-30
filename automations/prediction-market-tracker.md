# Prediction Market Tracker

Monitor any topic on Polymarket. Get alerts with charts when probabilities shift significantly.

## What it does

1. Checks Polymarket every 30 minutes for markets matching your keywords
2. Tracks probability changes over time
3. When change exceeds threshold (e.g. 3%), generates a chart and alerts you
4. Includes context from X/Twitter OSINT accounts

## Example output

```
🚨 Market Alert
📈 Topic X probability: 25% → 32% (+7%)
[Chart showing 24h trend]
📰 Related X posts: [summaries]
```

## Setup

### 1. Create the monitor script

Save as `scripts/market-monitor.js`:

```javascript
#!/usr/bin/env node
const https = require('https');
const fs = require('fs');
const { execSync } = require('child_process');

// === CONFIGURE THESE ===
const KEYWORDS = ['your', 'keywords', 'here'];  // Markets containing these words
const ALERT_THRESHOLD = 3;  // Alert on 3%+ change
const STATE_FILE = '/data/clawd/memory/market-monitor-state.json';
const CHART_SCRIPT = '/data/clawd/skills/chart-image/scripts/chart.mjs';

// Fetch markets from Polymarket
async function getMarkets() {
  return new Promise((resolve, reject) => {
    https.get('https://gamma-api.polymarket.com/markets?active=true&limit=200', res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

// Filter to relevant markets
function isRelevant(question) {
  const q = question.toLowerCase();
  return KEYWORDS.some(kw => q.includes(kw.toLowerCase()));
}

// Load/save state
function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); }
  catch { return { prices: {} }; }
}
function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

async function main() {
  const markets = await getMarkets();
  const state = loadState();
  const alerts = [];

  for (const m of markets) {
    if (!isRelevant(m.question)) continue;
    
    const prices = JSON.parse(m.outcomePrices || '["0","0"]');
    const pct = parseFloat(prices[0]) * 100;
    const lastPct = state.prices[m.slug];
    
    if (lastPct !== undefined) {
      const delta = pct - lastPct;
      if (Math.abs(delta) >= ALERT_THRESHOLD) {
        alerts.push({ question: m.question, pct, lastPct, delta, slug: m.slug });
      }
    }
    state.prices[m.slug] = pct;
  }
  
  saveState(state);
  
  if (alerts.length === 0) {
    console.log('No significant changes.');
    process.exit(0);
  }
  
  // Generate alert
  for (const a of alerts) {
    const arrow = a.delta > 0 ? '📈' : '📉';
    console.log(`${arrow} **${a.question}**`);
    console.log(`   ${a.lastPct.toFixed(1)}% → ${a.pct.toFixed(1)}% (${a.delta > 0 ? '+' : ''}${a.delta.toFixed(1)}%)`);
  }
  
  process.exit(1);  // Exit 1 = alerts found
}

main().catch(console.error);
```

### 2. Add cron job

Ask your assistant:
```
Create a cron job that runs every 30 minutes:
- Execute: node /data/clawd/scripts/market-monitor.js
- If exit code 1, send the output to me on Telegram
- If exit code 0, don't message me
```

### 3. Customize

- Change `KEYWORDS` to match markets you care about
- Adjust `ALERT_THRESHOLD` (default: 3% change triggers alert)
- Add chart generation (see chart-image skill)

## Skills used

- **polymarket** - Market data API
- **chart-image** - Generate trend charts
- **search-x** - Get related X posts (optional)
