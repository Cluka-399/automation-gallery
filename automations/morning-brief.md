# Morning Brief

Wake up to a personalized briefing with your calendar, weather, and relevant news.

## What it does

Every morning at your chosen time:
1. Checks your calendar for today's events
2. Gets local weather forecast
3. Searches for news on topics you care about
4. Compiles into a clean summary
5. Sends to your preferred channel (Telegram, WhatsApp, etc.)

## Example output

```
☀️ Good morning!

📅 Today (Thursday, Jan 30)
• 09:00 - Team standup
• 14:00 - Client call
• 18:00 - Gym

🌤️ Tel Aviv: 18°C, partly cloudy, light wind

📰 Your topics:
• [AI] New model announced by...
• [Startup] Funding round for...

Have a great day!
```

## Setup

### 1. Add cron job

Ask your assistant:
```
Create a morning brief cron job:
- Run at 7:30 AM my timezone
- Check my calendar (Google Calendar / Apple Calendar)
- Get weather for [your city]
- Search news for: [your topics]
- Send summary to me on Telegram
- Keep it under 15 lines
```

### 2. Example cron config

```yaml
name: "Morning Brief"
schedule: "30 7 * * *"  # 7:30 AM daily
timezone: "Your/Timezone"
task: |
  1. Check calendar: gcalcli agenda today
  2. Get weather for [City]
  3. Search X for [topics] --days 1
  4. Compile brief, send to Telegram
```

## Customization ideas

- Add stock prices or crypto rates
- Include your task manager (Todoist, Things, etc.)
- Check unread emails count
- Add motivational quote
- Include sunrise/sunset times
- Add commute traffic info

## Skills used

- **caldav-calendar** or **gcalcli** - Calendar access
- **weather** - Weather forecasts
- **search-x** or **web-search** - News search
