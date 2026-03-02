# Tabaholics — Project Spec

## What This Is

A Chrome extension that passively tracks your tab behavior and uses Claude AI to generate weekly insights about your cognitive and attention patterns. Think Spotify Wrapped, but for your brain's relationship with the internet.

---

## Core Concept

Most people open tabs with intent and never return. The gap between *how long a tab exists* and *how long you actually engaged with it* reveals patterns about decision fatigue, information anxiety, and attention honesty.

**Key metric:** `active_ratio = active_time_ms / total_time_ms`
A tab with 2 hours total but 3 minutes active = guilt tab. This is the core signal.

---

## Data Model

Every tab visit produces a record like this:

```json
{
  "id": "unique-visit-id",
  "url": "https://example.com/article",
  "domain": "example.com",
  "title": "Page title",
  "opened_at": 1700000000000,
  "closed_at": 1700003600000,
  "total_time_ms": 3600000,
  "active_time_ms": 180000,
  "focus_sessions": [
    { "start": 1700000000000, "end": 1700000120000, "duration_ms": 120000 },
    { "start": 1700001000000, "end": 1700001060000, "duration_ms": 60000 }
  ],
  "scroll_depth_pct": 34,
  "returned_to": true,
  "return_count": 2,
  "is_open": false
}
```

`is_open: true` is added for currently open tabs returned via `GET_OPEN_TABS`.

---

## Technical Architecture

### 1. Background Script (`background.js`)

Tracks tab lifecycle using Chrome APIs:

- `chrome.tabs.onCreated` — log tab open with timestamp
- `chrome.tabs.onRemoved` — end active session, save completed visit record
- `chrome.tabs.onUpdated` — handle in-page navigation (saves current visit if open ≥ 3s, otherwise discards as redirect) and title updates
- `chrome.tabs.onActivated` — end session on previous tab, start session on newly focused tab
- `chrome.windows.onFocusChanged` — end/start active sessions when Chrome loses/gains OS focus

**Active session filtering:** Sub-second blips (< 1000ms) are discarded to avoid noise from rapid tab switches.

**State persistence:** `tabState` is debounced-snapshotted to `chrome.storage.local` as `tabStateSnapshot` (500ms delay) so data survives service worker restarts. On startup, the snapshot is restored, any in-progress sessions are finalized, and focus tracking resumes on the currently active tab.

**Messages handled:**
- `SCROLL_DEPTH` — from content script, updates max scroll depth for the tab
- `GET_OPEN_TABS` — returns live visit records for all currently open tabs, including any in-progress active session time

### 2. Content Script (`content.js`)

Injected into every page. Tracks max scroll depth (% of page scrolled) and reports it to the background script via `chrome.runtime.sendMessage({ type: "SCROLL_DEPTH", depth })`.

### 3. Dashboard (`dashboard.html`)

Full-page dashboard opened by clicking the extension icon (`chrome.action.onClicked`).

**Stats row** (clickable cards that open a detail breakdown modal):
- **Tabs Opened** — total visits in the last 7 days
- **Avg Active Ratio** — average `active_time / total_time` across all visits
- **Guilt Tabs** — count of tabs meeting the guilt threshold
- **Top Domain** — most visited domain

**Sections:**
- **Guilt Tab list** — top 8 guilt tabs sorted by lowest active ratio, with badges (active %, time open, "still open" if currently open)
- **Top Domains** — top 8 domains by visit count, with inline bar chart
- **Browsing Categories** — all categories present in data, with visit counts, avg active ratio, and inline bar chart
- **Hourly Activity** — bar chart of tab opens by hour of day (Chart.js)
- **Claude Insights** — AI-generated weekly cognitive patterns report + actionable insight tip block
- **Settings** — API key input (stored in `chrome.storage.local`)

**Detail breakdown modal** (`modal.js`):
Triggered by clicking any stat card. Shows three tabs: *By Day*, *By Category*, *By Domain*. Each tab renders a bar chart list (`render`) followed by a doughnut pie chart (`afterRender`). The pie chart is destroyed and recreated on tab switch.

**Theme:** Dark (default) and light modes toggled by a button; applied as a `.light` class on `<body>`.

### 4. Module Details

#### `constants.js`
```js
const SEVEN_DAYS_MS      = 7 * 24 * 60 * 60 * 1000;
const GUILT_MIN_TOTAL_MS = 5 * 60 * 1000;   // tab open at least 5 min
const GUILT_MAX_RATIO    = 0.10;             // active ratio under 10%
const CLAUDE_MODEL       = "claude-sonnet-4-20250514";
const CLAUDE_API_URL     = "https://api.anthropic.com/v1/messages";
```

#### `utils.js`
- `ratio(v)` — `active_time_ms / total_time_ms`
- `isGuiltTab(v)` — `total_time_ms >= GUILT_MIN_TOTAL_MS && ratio(v) < GUILT_MAX_RATIO`
- `avg(arr)`, `pct(r)`, `formatDuration(ms)`
- `topDomains(visits, n)` — top N domains by visit count
- `last7Days()` — array of `{ key: "YYYY-MM-DD", label: "Mon Feb 24" }` for the last 7 calendar days
- `dayKey(date)` — ISO date string `"YYYY-MM-DD"`

#### `categories.js`
14 categories with emoji: Search, Social, Shopping, News, Video, Tech & Dev, Food, Finance, Health, Learning, Email & Comms, Productivity, Government, Other.

Resolution order:
1. Exact domain match against `DOMAIN_CATEGORY_MAP` (built from explicit lists)
2. Keyword pattern match against domain string (regex)
3. TLD rules: `.edu` → Learning, `.gov` → Government
4. Fallback: Other

#### `analytics.js`
- `buildCategoryStats(visits)` — per-category `{ name, emoji, visits, avgActiveRatio }`, sorted by visit count
- `buildWeeklySummary(visits)` — aggregated object sent to Claude:
  ```json
  {
    "total_tabs_opened": 312,
    "avg_active_ratio": 0.08,
    "guilt_tab_count": 147,
    "top_domains": [
      { "domain": "twitter.com", "opens": 89, "avg_active_ratio": 0.04 }
    ],
    "peak_open_hour": 15
  }
  ```

#### `charts.js`
`drawBreakdownPie(el, labels, data, formatValue?)` — renders a Chart.js doughnut chart prepended to `el`. Filters out zero-value entries. Optional `formatValue` formats the raw value in the tooltip (e.g. `v => \`${v}%\`` for ratio data). Returns the Chart instance.

#### `modal.js`
`detailModal.open({ title, tabs })` — each tab: `{ label, render(), afterRender?(el) }`. `render()` returns an HTML string; `afterRender` is called with the content element after two animation frames (to allow layout) and returns a Chart instance that gets destroyed on close/tab switch.

---

## Guilt Tab Thresholds

| Condition | Value |
|-----------|-------|
| Minimum time open | 5 minutes |
| Maximum active ratio | 10% |

---

## Guilt Tab Cleaner

Interactive modal for closing guilt tabs in one click.

1. User clicks the trash icon in the Guilt Tabs block
2. Modal shows a slider (default: 10%) to set the engagement threshold
3. All currently open Chrome tabs are queried and cross-referenced with live `active_ratio` data from `GET_OPEN_TABS`
4. Live preview updates as slider moves: qualifying tab count + top domains
5. "Close All Guilt Tabs" calls `chrome.tabs.remove([...tabIds])`

---

## Claude Insights

Accessed via "Generate Weekly Report" button. Requires an Anthropic API key entered in Settings.

**Prompt:**
```
You are a behavioral analyst. Here is one week of a user's browser tab data:

{TAB_SUMMARY_JSON}

Write a 3-4 paragraph personal cognitive patterns report. Include:
1. Their attention honesty score (do they open tabs they never read?)
2. Their peak focus vs. distraction hours
3. Their top guilt domains (sites they open but rarely engage with)
4. One specific, actionable behavioral insight

Be warm, specific, and use exact numbers from the data. Avoid generic advice.
Write as if you're a thoughtful analyst who genuinely finds their patterns interesting.

After the report, add one final line in exactly this format (no extra punctuation before INSIGHT:):
INSIGHT: [one specific, actionable sentence the user can act on this week]
```

The `INSIGHT:` line is parsed out and displayed separately as a highlighted behavioral tip block. The rest renders as the main report with basic markdown (bold, italic, paragraphs).

**API call:** Direct browser fetch to `https://api.anthropic.com/v1/messages` with header `anthropic-dangerous-direct-browser-access: true`. Model: `claude-sonnet-4-20250514`, `max_tokens: 1024`.

---

## manifest.json

```json
{
  "manifest_version": 3,
  "permissions": ["tabs", "storage", "windows"],
  "host_permissions": ["<all_urls>"],
  "content_scripts": [{ "matches": ["<all_urls>"], "js": ["content.js"] }],
  "background": { "service_worker": "background.js" },
  "action": {}
}
```

---

## What "Done" Looks Like

1. Install extension in Chrome (unpacked)
2. Browse normally for a few days
3. Open dashboard — see real tab behavior data with stats, charts, guilt list
4. Click a stat card → detail modal with By Day / By Category / By Domain breakdown, each with a bar list and doughnut pie chart
5. Scroll the Guilt Tab Cleaner slider → live preview of tabs to close → click "Close All Guilt Tabs"
6. Click "Generate Weekly Report" → Claude returns a personalized cognitive patterns summary + actionable insight tip
