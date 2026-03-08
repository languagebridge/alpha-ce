# LanguageBridge Admin Dashboard — PRD for Lovable

## What to Build

An internal admin dashboard for the LanguageBridge Greenbriar Pilot Program. It lives at **`languagebridge.app/admin`** as a protected route within the existing LanguageBridge Lovable website. It is **not** public — it is used exclusively by LanguageBridge leadership (Justin Bernard, CEO; Prentice Howard, CTO) to monitor real-time pilot usage, budget health, and student-flagged translation problems.

---

## Brand Identity

Use the LanguageBridge brand throughout.

**Colors:**
- Primary (Plum Purple): `#742a69`
- Primary Dark (Deep Plum): `#4a1a45`
- Primary Light (Lavender Mist): `#f5eaf4`
- Accent Orange: `#f37030`
- Accent Gold: `#ffc755`
- Accent Light (Peach Tint): `#fff3e6`
- Surface: `#ffffff`
- Background: `#f7f7f7`

**Header gradient:** `linear-gradient(135deg, #742a69 0%, #f37030 80%, #ffc755 100%)`
**Accent gradient:** `linear-gradient(90deg, #f37030 0%, #ffc755 100%)`

**Typography:** Clean, modern sans-serif. White text on the primary/dark colors. `#4a1a45` text on light/white backgrounds.

**Logo text:** "LanguageBridge" with a 🌉 emoji, or use the text logo treatment: bold "Language**Bridge**" where "Bridge" is in the accent gradient color.

---

## Authentication

There is no user account system. The dashboard is protected by a single admin API key.

**Login screen:**
- Centered card on a `#f5eaf4` background
- LanguageBridge logo/wordmark at top
- Input field: "Admin API Key" (password input, masked)
- "Access Dashboard" button (primary plum color)
- On submit: store the key in `localStorage` as `languagebridge_admin_key`
- On any API call returning 401: clear the stored key and redirect back to login
- Keep a "Sign out" button visible in the top-right corner of the dashboard at all times

---

## Layout

The `/admin` route replaces the site's normal page content with a full admin shell. Hide the site's main navigation on this route — replace it entirely with the admin nav below.

**Top nav (admin-specific, replaces site nav on this route):**
- Left: LanguageBridge logo + "Admin Dashboard" label
- Center: Tab navigation — Overview | Flags | Activity
- Right: "Pilot: Greenbriar" badge + "Sign out" button
- Nav bar uses the header gradient as background, white text

**Content area:** Full width, `#f7f7f7` background, content centered in a max-width container (1200px).

---

## API Endpoints

**Base URL:** `https://exquisite-croissant-4288dd.netlify.app`

All admin endpoints accept the API key via the `X-API-Key` request header:
```
X-API-Key: <key>
```

### 1. Admin Stats
```
GET /.netlify/functions/admin-stats?limit=50
Header: X-API-Key: <key>
```

Response shape:
```json
{
  "budget": {
    "used": "12.3456",
    "total": "150.00",
    "remaining": "137.6544",
    "percentUsed": "8.23",
    "status": "healthy",
    "alert": false
  },
  "totals": {
    "requests": 1420,
    "characters": 284000,
    "cost": "12.3456",
    "lastUpdated": "2026-03-08T14:22:00.000Z"
  },
  "services": {
    "translations": 980,
    "tts": 380,
    "stt": 60
  },
  "users": {
    "total": 12,
    "active": 8,
    "topUsers": [
      {
        "userId": "ext_abcdef",
        "translations": 120,
        "tts": 45,
        "stt": 8,
        "totalCost": 1.2345,
        "totalCharacters": 24000
      }
    ]
  },
  "recentActivity": [
    {
      "timestamp": "2026-03-08T14:20:00.000Z",
      "userId": "ext_abcdef",
      "service": "translate",
      "characters": 450,
      "cost": "0.004500",
      "success": true,
      "error": null
    }
  ],
  "limits": {
    "dailyTranslations": 100,
    "dailyTTS": 50,
    "rateLimit": 10
  }
}
```

### 2. Get Flags
```
GET /.netlify/functions/get-flags?limit=100
GET /.netlify/functions/get-flags?status=elevated
GET /.netlify/functions/get-flags?status=bounty
GET /.netlify/functions/get-flags?status=high_priority
Header: X-API-Key: <key>
```

Response shape:
```json
{
  "summary": {
    "logged": 14,
    "elevated": 5,
    "bounty": 2,
    "high_priority": 1,
    "total": 22
  },
  "flags": [
    {
      "text": "photosynthesis",
      "language": "fa",
      "tier": 2,
      "source": "glossary",
      "flagCount": 11,
      "status": "high_priority",
      "firstFlagged": "2026-03-01T09:00:00.000Z",
      "lastFlagged": "2026-03-08T14:15:00.000Z"
    }
  ]
}
```

**Flag status values and their meaning:**
| Status | Count | Meaning |
|---|---|---|
| `logged` | 1–2 | Baseline data, monitor only |
| `elevated` | 3–5 | Worth reviewing |
| `bounty` | 6–9 | Add to Phase 2 bounty board |
| `high_priority` | 10+ | Fix immediately |

**Language code → display name mapping:**
```
ur → Urdu
ps → Pashto
fa → Persian
prs → Dari
ar → Arabic
so → Somali
uk → Ukrainian
uz → Uzbek
en → English
es → Spanish
pt → Portuguese
fr → French
zh → Chinese
mww → Hmong
```

**Source values:** `translation` (student flagged the full translation), `glossary` (student flagged a specific vocabulary word)

---

## Screens

### Screen 1: Overview Tab

**Budget Card** (full width, prominent at top)
- Large progress bar showing `budget.percentUsed`%
- Color: green if `status === 'healthy'`, orange if `status === 'warning'`, red if `status === 'critical'`
- Labels: "$X.XX spent of $150.00 pilot budget"
- If `budget.alert === true`, show a yellow warning banner: "⚠️ Budget alert — approaching limit"

**Stats Row** (4 cards in a row)
- Total Requests: `totals.requests`
- Total Users: `users.total` (subtitle: `users.active` active today)
- Total Characters: `totals.characters` formatted with commas
- Last Updated: `totals.lastUpdated` as a relative time ("2 hours ago")

**Service Breakdown** (3 cards or a small donut chart)
- Translations: `services.translations`
- Text-to-Speech: `services.tts`
- Speech-to-Text: `services.stt`

**Flags Summary** (small card with link to Flags tab)
- Show the flag summary counts from the get-flags API
- High priority count in red, bounty in orange, elevated in yellow
- "View all flags →" link

**Top Users Table** (bottom of Overview)
- Columns: User ID | Translations | TTS | STT | Characters | Cost
- Truncate User ID for display (show last 8 chars)
- Sort by cost descending

---

### Screen 2: Flags Tab

**Filter bar** at top:
- Dropdown to filter by status: All | Logged | Elevated | Bounty | High Priority
- Count badge next to each option
- Text search box (client-side filter on `text` field)

**Summary row** — 4 stat pills showing counts for each status level, colored accordingly:
- `high_priority` → red pill
- `bounty` → orange pill
- `elevated` → yellow pill
- `logged` → gray pill

**Flags Table:**

| Column | Value |
|---|---|
| Status Badge | Color-coded pill: `high_priority` = red, `bounty` = orange, `elevated` = yellow, `logged` = gray |
| Text / Phrase | The flagged word or phrase |
| Language | Full name (mapped from code) |
| Source | "Full Translation" or "Glossary Word" |
| Tier | 1 / 2 / 3 / — (dash if null) |
| Flag Count | Number, bold if ≥ 6 |
| First Flagged | Relative date |
| Last Flagged | Relative date |

- Sort by `flagCount` descending by default (highest priority at top)
- Rows with `high_priority` status have a subtle red left border
- Rows with `bounty` status have an orange left border
- Clicking a row expands it to show full text if truncated

**Empty state:** "No flags yet. Students will flag confusing translations as they use the extension."

---

### Screen 3: Activity Tab

**Recent Activity Feed** — card list, newest first
- Each item shows: timestamp (relative), user ID (last 8 chars), service icon (🌍 translate / 🔊 TTS / 🎤 STT), character count, cost
- Success items: normal styling
- Failed items (`success: false`): red left border, show `error` message if present

**Auto-refresh:** A "Refresh" button in the top right of this tab. Optionally, auto-refresh every 30 seconds with a visible countdown.

---

## Data Fetching

- Fetch Overview and Flags data on initial load
- Show a loading skeleton (pulsing placeholder cards) while fetching
- Show an error state with a "Retry" button if any fetch fails
- On any 401 response: clear API key from localStorage and redirect to login screen

**Polling:** On the Activity tab, add an optional auto-refresh toggle (default off) that polls every 30 seconds.

---

## Empty / Zero States

- No flags yet: show illustration + helpful message
- No activity: "No activity recorded yet for this pilot"
- Budget at $0: show the full $150 bar as unused

---

## Responsive Behavior

- Desktop-first (admins will primarily use this on a laptop)
- Minimum supported width: 900px
- Below 900px: stack the stat cards vertically; tables become horizontally scrollable

---

## What NOT to Build

- No user management / CRUD operations (read-only dashboard)
- No email notifications (out of scope)
- No individual student drill-down (Phase 2)
- No chart library required — simple progress bars, stat cards, and tables are sufficient. If you want to add one chart, a small service-breakdown donut is fine.
- No dark mode

---

## Deployment Notes

This is a protected route (`/admin`) within the existing **languagebridge.app** Lovable project — not a separate app. Route directly to the login card if `lb_admin_key` is absent from `localStorage`; otherwise render the dashboard. The base API URL is hardcoded to `https://exquisite-croissant-4288dd.netlify.app`. The API key is entered by the admin at login and stored only in `localStorage` — it is never sent to any third party or logged.

The `/admin` route should **not** appear in the site's public navigation menu.

A working reference implementation exists at `admin-dashboard.html` in the extension repo. It already handles the API call pattern, auto-refresh, budget progress bar, and activity feed correctly — use it as behavioral reference, not as the final UI.
