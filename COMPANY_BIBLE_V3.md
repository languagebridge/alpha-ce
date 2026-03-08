# LanguageBridge Company Bible — Version 3.0

**Prepared by:** Justin Bernard, CEO | Prentice Howard, CTO
**Last Updated:** March 2026
**Status:** Active — Greenbriar Pilot Phase

---

## Mission

LanguageBridge closes the language gap for immigrant and refugee students in American classrooms. We build tools that let students access grade-level content in their native language — instantly, privately, and without disrupting the classroom.

---

## The Problem We Solve

Over 5 million K–12 students in the United States are English Language Learners. When a student whose first language is Dari, Somali, or Pashto opens a textbook, they face two simultaneous challenges: learning the content AND decoding the English. Most schools have one ELL specialist serving dozens of students across many grades. There is no scalable human solution.

Existing translation tools (Google Translate, DeepL) are designed for adults and general use. They do not:
- Scaffold vocabulary by reading level
- Support the specific languages of the fastest-growing immigrant communities
- Integrate into the classroom reading workflow
- Give teachers visibility into where students struggle most

LanguageBridge is built specifically for this gap.

---

## The Product

### Chrome Extension (Primary Product)

A Chrome extension installed on school-issued Chromebooks. When a student encounters an English word or passage they do not understand, they:

1. **Select the text** on any webpage or Google Doc
2. **Press Play** — the toolbar reads it aloud in their native language via Azure Neural TTS
3. **View the written translation** in a tooltip popup
4. **Browse the Glossary** — a 3-tier vocabulary breakdown of key words from the passage

If the translation is wrong or confusing, the student clicks **🚩 Flag** — this feeds the Phase 2 bounty board where translators can improve it.

### Supported Languages (v1.0.6)
Urdu, Pashto, Persian, Dari, Arabic, Somali, Ukrainian, Uzbek, English (simplification mode), Spanish, Portuguese, French, Chinese, Hmong (translation only)

### Key Features
- **Real-time translation** — any selected text on any webpage
- **Neural text-to-speech** — Azure Neural voices, not robotic speech
- **Speech-to-text** — student can speak and have their words translated (floating translator)
- **3-tier glossary** — vocabulary scaffolded by reading level
- **Floating conversation translator** — students can have spoken conversations with teachers
- **Flag system** — students mark bad translations, feeding quality improvement
- **Privacy-first** — no student PII collected; users identified only by extension ID

---

## Technical Architecture (Summary)

For full technical details, see `TECHNICAL_OVERVIEW.md`.

### Three-Layer Stack

**Layer 1 — Chrome Extension (Client)**
Vanilla JS + CSS, Manifest V3. Injected into every webpage the student visits. Contains all UI, audio playback, and client-side caching. Talks only to the Netlify backend — never directly to Azure.

**Layer 2 — Netlify Backend (API Layer)**
Serverless Node.js functions hosted on Netlify. Acts as a secure proxy between the extension and Azure. Holds all API keys server-side. Enforces rate limiting, daily quotas, and pilot budget protection. Stores usage data and flag data in Netlify Blobs (key-value store).

**Layer 3 — Azure Cognitive Services (AI)**
Microsoft Azure provides:
- **Translator API** — text translation (50+ languages)
- **Neural TTS** — high-quality spoken audio in native languages
- **Speech-to-Text** — live speech recognition for the conversation translator

### How the Extension and Website Connect

`languagebridge.app` (the marketing + admin website, built on Lovable) and the Chrome extension share the same Netlify backend. The extension uses it for API proxying; the website's `/admin` route uses it for pilot monitoring. Azure keys never leave Netlify.

---

## Pilot Program — Greenbriar (2026)

### Scope
- **School:** Greenbriar Elementary
- **Duration:** 8 weeks
- **Students:** ~50 students (ELL population)
- **Budget cap:** $150 Azure API cost for the full pilot
- **Languages in use:** Persian, Dari, Pashto, Arabic, Somali, Ukrainian

### Goals
1. Validate that students can independently use the extension without teacher instruction
2. Measure engagement (translations per day, TTS plays, glossary views)
3. Collect flag data to identify the most problematic translation pairs
4. Build a case study for Cleveland Metropolitan School District expansion

### Success Metrics
- ≥ 30 of 50 students use the extension at least 3x per week
- ≤ $150 total Azure cost (budget protection enforced server-side)
- ≥ 20 flags collected (sufficient data for Phase 2 bounty board)
- 0 critical bugs that require manual intervention

### Monitoring
Admin dashboard at `languagebridge.app/admin` (or `admin-dashboard.html` during transition):
- Real-time budget usage
- Per-user request counts
- Flagged translations by severity
- Recent activity feed

---

## What Is Built (as of March 2026)

### Extension (v1.0.6-alpha)
- ✅ Text selection + translation via Netlify proxy
- ✅ Neural TTS audio playback
- ✅ 2-layer audio cache (session memory + Netlify Blobs, 30-day TTL)
- ✅ Speech-to-text (conversation translator)
- ✅ 3-tier glossary system (vocabulary scaffolding)
- ✅ Flag system — 🚩 buttons on translation and glossary words
- ✅ Onboarding flow + activation modal
- ✅ Google Docs text selection adapter
- ✅ Shared language/voice table (`window.LB_LANGUAGES`)
- ✅ Brand token system (`brand-tokens.css`)
- ✅ Privacy consent flow

### Backend (Netlify)
- ✅ `azure-proxy.js` — secure proxy with rate limiting, quotas, budget protection
- ✅ `get-client-config.js` — config delivery (endpoint URLs, feature flags)
- ✅ `log-flag.js` — flag event logging
- ✅ `get-flags.js` — admin flag retrieval with status filtering
- ✅ `admin-stats.js` — pilot budget + usage stats
- ✅ `get-usage.js` — per-user quota status
- ✅ Netlify Blobs: 5 stores (usage-logs, user-quotas, pilot-stats, tts-audio-cache, flag-data)
- ✅ Input validation + SSML injection prevention throughout

### Admin Tools
- ✅ `admin-dashboard.html` — working standalone admin dashboard (interim)
- ✅ `ADMIN_DASHBOARD_PRD.md` — full spec for Lovable rebuild at `languagebridge.app/admin`
- ✅ `ADMIN_API_KEY` environment variable set in Netlify

---

## What Is NOT Built Yet (Phase 2+)

### Phase 2 — Post-Greenbriar (Summer 2026)

**Supabase Integration**
- User accounts with real authentication (Supabase Auth)
- Classroom linking (student → teacher → class)
- Teacher dashboard showing per-student usage
- Row-level security so teachers only see their students

**Bounty Board**
- Public-facing board at `languagebridge.app/bounty` showing the most-flagged translations
- Community translators can submit corrections
- Corrections reviewed and pushed as updates to the app

**Academic Vocabulary Database**
- Off-app database of subject-specific vocabulary (science, social studies, math)
- Currently removed from the extension — local word map only for English simplification
- Needs proper backend (Supabase table) before re-enabling

**Improved Simplification**
- AI-powered text simplification by Lexile level
- Currently deferred — the simplification service was removed during Greenbriar prep

### Phase 3 — District Scale

**Chrome Web Store Publication**
- Currently distributed as unpacked extension
- Needs Chrome Web Store review and approval
- Requires privacy policy, screenshots, and store listing copy

**District SSO**
- Integrate with Clever or ClassLink for automatic student roster sync
- Students log in with their district Google account

**LMS Integration**
- Canvas, Schoology, PowerSchool plugins
- Reading history synced to teacher gradebook

**Mobile**
- iOS and Android companion apps (camera-based OCR translation)

---

## Data & Privacy

### What We Collect
- **Extension identifier** (Chrome extension ID or IP fallback) — anonymous, not linked to a student name
- **API usage events** — service type, character count, cost estimate, timestamp
- **Flag events** — the flagged text, language, tier, timestamp

### What We Do NOT Collect
- Student names, emails, or any personally identifiable information
- Browsing history or page content outside of user-selected text
- Audio recordings (STT audio is sent directly to Azure and not stored)

### Data Retention
- Usage logs: 90 days
- User quotas: 48 hours (rolling)
- Flag data: 90 days
- TTS audio cache: 30 days

### Compliance
- FERPA-compliant: no PII storage
- COPPA-applicable: no accounts, no PII
- Data processed in Azure East US region

---

## Business Model

### Alpha/Pilot Phase (Current)
Free for Greenbriar. LanguageBridge absorbs Azure API costs (capped at $150).

### Phase 2 — SaaS Per Seat
- **$3–5/student/month** for full feature access
- School or district pays annually
- Free tier for individual teachers (limited usage)

### Phase 3 — District License
- Flat district-wide annual license
- Includes district SSO, LMS integration, and dedicated support
- Account manager: Prentice Howard, CTO

---

## Team

| Name | Role | Contact |
|---|---|---|
| Justin Bernard | CEO | info@languagebridge.app |
| Prentice Howard | CTO | info@languagebridge.app |

**Support:** 216-800-6020 | info@languagebridge.app

---

## Repository Structure

```
languagebridge-extensionAlpha/
├── manifest.json                    # Chrome extension manifest (MV3)
├── background.js                    # Service worker (keyboard shortcuts)
├── config.js                        # Config loader + window.CONFIG
├── utils/
│   └── logger.js                    # Global logger
├── content/
│   ├── brand-tokens.css             # CSS custom properties (brand colors)
│   ├── toolbar.css / .js            # Main toolbar UI
│   ├── floating-translator.css / .js # Conversation translator
│   ├── azure-client.js              # Service facade (window.AzureClient)
│   ├── session-audio-cache.js       # In-session TTS cache
│   ├── highlighter.js               # Text highlighting
│   ├── onboarding.js                # First-run flow
│   ├── activation-modal.js          # Activation modal
│   ├── google-docs-adapter.js       # Google Docs compatibility
│   ├── azure-speech-sdk-bundle.js   # Azure SDK (bundled)
│   ├── core/
│   │   └── lb-state-manager.js      # Shared state
│   ├── services/
│   │   ├── lb-azure-core.js         # LB_LANGUAGES, escapeHtml, caches, rate limits
│   │   ├── lb-translation-service.js # Translation
│   │   ├── lb-tts-service.js        # Text-to-speech
│   │   ├── lb-stt-service.js        # Speech-to-text
│   │   └── lb-glossary-service.js   # 3-tier glossary
│   └── utils/
│       ├── inflection-engine.js     # Word inflection
│       └── error-handler.js         # Error handling
├── popup/
│   ├── popup.html                   # Extension popup
│   └── popup.js                     # Popup logic (toolbar/translator toggles)
├── options/
│   ├── options.html                 # Settings page
│   └── options.js                   # Settings logic
├── netlify/
│   └── functions/
│       ├── azure-proxy.js           # Main API proxy
│       ├── get-client-config.js     # Config delivery
│       ├── log-flag.js              # Flag logging
│       ├── get-flags.js             # Flag retrieval (admin)
│       ├── admin-stats.js           # Pilot stats (admin)
│       ├── get-usage.js             # Per-user quota
│       └── lib/
│           ├── config.js            # Backend configuration + limits
│           ├── storage.js           # Netlify Blobs wrapper
│           ├── rate-limiter.js      # Rate limiting logic
│           └── quota-checker.js     # Quota enforcement
├── assets/                          # Icons (16, 32, 48, 128, 512px)
├── admin-dashboard.html             # Interim admin dashboard (standalone HTML)
├── TECHNICAL_OVERVIEW.md            # Full technical reference
├── COMPANY_BIBLE_V3.md              # This document
├── ADMIN_DASHBOARD_PRD.md           # Admin dashboard spec for Lovable
└── .gitignore                       # Excludes secrets, PDFs, node_modules
```

---

## Key Decisions Log

| Decision | Rationale |
|---|---|
| Netlify Functions as proxy (not direct Azure from extension) | Azure keys never exposed to client; enables rate limiting, quota enforcement, and budget protection server-side |
| Netlify Blobs for storage (not Supabase yet) | Zero additional setup for alpha; Supabase migration planned for Phase 2 when user accounts are needed |
| Removed simplification service for Greenbriar | `plain_english_a_to_z-1.json` vocabulary file not suitable for production; needs proper off-app database before re-enabling |
| Removed academic vocabulary database | Same reason — local JSON file doesn't scale; deferred to Phase 2 with Supabase backend |
| Fire-and-forget for flag events | Flag failures should never block student translation experience |
| Per-session flag deduplication (not per-user) | No user accounts yet; prevents accidental double-flagging within a session; cross-session dedup deferred to Phase 2 |
| `window.LB_LANGUAGES` as single source of truth | Previously had separate VOICE_MAP and LOCALE_MAP in TTS/STT services — consolidated to prevent drift |
| Parallel TTS translations for Tier 1 and Tier 3 glossary | Sequential API calls were too slow; `Promise.all` with per-item error handling gives 5x speedup safely |

---

## Git History (Major Commits)

| Commit | Description |
|---|---|
| `95774c7` | Remove simplification service — glossary uses original text directly |
| `2166008` | Fix drag listener leak and corrupt-blob crash |
| `5537924` | Security pass: validate language codes, encode URL params, fix SSML injection |
| `e23257a` | Consolidate language maps and escapeHtml into shared globals |
| `8e4abb2` | Remove academic vocabulary system (deferred to future release) |
| `256a822` | Add Flag System (v4.0) and admin dashboard PRD |
