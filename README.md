# Tabaholics

A Chrome extension that tracks your tab behavior and uses Claude AI to surface insights about your attention patterns. Think Spotify Wrapped, but for your brain's relationship with the internet.

The core idea: the gap between *how long a tab exists* and *how long you actually engaged with it* reveals a lot about decision fatigue, information anxiety, and attention honesty.

---

## Features

### Attention Analytics
- **Tabs Opened** — total tabs opened over the last 7 days
- **Avg Active Ratio** — average time actively focused vs. time a tab was open (`active_time / total_time`)
- **Guilt Tab Count** — tabs open for 5+ minutes with under 10% active ratio
- **Top Domain** — your most visited domain at a glance

### Breakdown Explorer
Click any stat card to open a detailed breakdown by:
- **By Day** — how the metric trended across the last 7 days
- **By Category** — across 14 browsing categories (Social, Tech, Shopping, News, etc.)
- **By Domain** — your top domains for that metric

Each breakdown shows both a bar chart and a doughnut chart for easy comparison.

### Browsing Categories
Domains are automatically classified into 14 categories — Search, Social, Shopping, News, Video, Tech & Dev, Food, Finance, Health, Learning, Email & Comms, Productivity, Government, and Other — so you can see patterns at a higher level than individual sites.

### Hourly Activity Chart
See when during the day you open the most tabs. Peak tab-opening hours often reveal context-switching moments, procrastination windows, or information-seeking bursts.

### Guilt Tabs
Tabs that have been open a long time but barely touched. The dashboard surfaces the worst offenders with their active ratio, time open, and whether they're still open right now.

### Guilt Tab Cleaner
One-click bulk close for abandoned tabs:
- Set an engagement threshold with a slider (default: 10%)
- Live preview shows exactly how many tabs qualify and which domains they're from
- Hit "Close All Guilt Tabs" to clear them all at once

### Weekly Brain Report (Claude AI)
Generates a personalized behavioral analysis using Claude:
- Your attention honesty score
- Peak focus vs. distraction hours
- Top guilt domains
- One specific, actionable insight for the week

Requires an Anthropic API key (stored locally, never sent anywhere except the Anthropic API).

### Dark & Light Mode
Full dark mode by default with a light mode toggle.

---

## Installation

1. Clone or download this repo
2. Go to `chrome://extensions` and enable **Developer mode**
3. Click **Load unpacked** and select the repo folder
4. Click the extension icon to open the dashboard

---

## Core Metric

```
active_ratio = active_time_ms / total_time_ms
```

A tab open for 2 hours with 3 minutes of active use = **2.5% active ratio** — a clear signal of unfinished intent.
