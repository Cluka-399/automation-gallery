# Competitor Intelligence

Track what your competitors are saying on X/Twitter. Get deduplicated daily summaries.

## What it does

1. Searches X for posts from competitor accounts (or keywords)
2. Stores seen items in database to avoid duplicates
3. Filters for genuinely new announcements
4. Sends formatted summary at scheduled times

## Example output

```
📊 Competitor Update (Morning)

**CompanyA** (@companya)
• Launched new feature X - "We're excited to announce..."
  https://x.com/...

**CompanyB** (@companyb)  
• Hiring for 3 engineering roles
  https://x.com/...

No updates from: CompanyC, CompanyD
```

## Setup

### 1. Create tracking database

Ask your assistant:
```
Create a competitor tracking system:
- Track these X accounts: @competitor1, @competitor2, @competitor3
- Store seen tweets in SQLite to avoid duplicates
- Run 3x daily: 8am, 2pm, 8pm
- Only report NEW items not previously seen
- Send summary to Telegram
```

### 2. Database schema

```sql
CREATE TABLE competitors (
  id INTEGER PRIMARY KEY,
  handle TEXT,
  company TEXT,
  category TEXT
);

CREATE TABLE events (
  id INTEGER PRIMARY KEY,
  company TEXT,
  event_type TEXT,
  headline TEXT,
  url TEXT,
  detected_at TEXT,
  reported INTEGER DEFAULT 0
);
```

### 3. Example cron config

```yaml
name: "Competitor Intel - Morning"
schedule: "0 8 * * *"
task: |
  1. Get handles from database
  2. Search X for last 12 hours
  3. Check each tweet against database
  4. Add new items, mark as unreported
  5. Format summary of unreported items
  6. Send to Telegram
  7. Mark items as reported
```

## Tips

- Use `--days 1` in X search to limit scope
- Track specific keywords, not just accounts
- Add event types: "launch", "funding", "hiring", "partnership"
- Include sentiment analysis for concerning mentions

## Skills used

- **search-x** - X/Twitter search
- SQLite for deduplication
- Cron for scheduling
