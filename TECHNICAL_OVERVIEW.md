# LanguageBridge — Technical Overview

**Version:** 1.0.6-alpha | **Last Updated:** March 2026
**Stack:** Chrome Extension (MV3) + Netlify Functions + Azure Cognitive Services

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        STUDENT'S BROWSER                        │
│                                                                 │
│  ┌─────────────┐    ┌──────────────────────────────────────┐   │
│  │   POPUP     │    │         CONTENT SCRIPTS              │   │
│  │  popup.js   │    │  (injected into every webpage)       │   │
│  │  popup.html │    │                                      │   │
│  └──────┬──────┘    │  config.js → lb-azure-core.js        │   │
│         │           │  → lb-translation-service.js         │   │
│  ┌──────▼──────┐    │  → lb-tts-service.js                 │   │
│  │  OPTIONS    │    │  → lb-stt-service.js                 │   │
│  │ options.js  │    │  → lb-glossary-service.js            │   │
│  └─────────────┘    │  → azure-client.js (facade)          │   │
│                     │  → toolbar.js                        │   │
│  ┌─────────────┐    │  → floating-translator.js            │   │
│  │ BACKGROUND  │    │  → highlighter.js                    │   │
│  │background.js│    │  → onboarding.js                     │   │
│  │(svc worker) │    └──────────────────┬───────────────────┘   │
│  └─────────────┘                       │                       │
└───────────────────────────────────────-│-───────────────────────┘
                                         │ HTTPS fetch()
                          ┌──────────────▼──────────────┐
                          │     NETLIFY BACKEND          │
                          │  (exquisite-croissant-       │
                          │   4288dd.netlify.app)        │
                          │                             │
                          │  /.netlify/functions/        │
                          │  ├── azure-proxy.js          │
                          │  ├── get-client-config.js    │
                          │  ├── log-flag.js             │
                          │  ├── get-flags.js            │
                          │  ├── admin-stats.js          │
                          │  └── get-usage.js            │
                          │                             │
                          │  Netlify Blobs (storage):   │
                          │  ├── usage-logs             │
                          │  ├── user-quotas            │
                          │  ├── pilot-stats            │
                          │  ├── tts-audio-cache        │
                          │  └── flag-data              │
                          └──────────────┬──────────────┘
                                         │
                          ┌──────────────▼──────────────┐
                          │     AZURE COGNITIVE          │
                          │       SERVICES               │
                          │                             │
                          │  • Translator API            │
                          │  • Neural TTS (Speech        │
                          │    Synthesis)                │
                          │  • STT (Speech Recognition)  │
                          └─────────────────────────────┘
```

---

## Chrome Extension Structure

### Manifest V3 Key Settings
- **Permissions:** `storage`, `activeTab`
- **Host permissions:** Azure Cognitive Services endpoints only
- **Background:** Service worker (`background.js`) — handles keyboard shortcuts and install events
- **Content scripts:** Injected at `document_idle` on `<all_urls>`
- **Keyboard shortcuts:** `Alt+Shift+L` (toolbar), `Alt+Shift+T` (floating translator)

### Content Script Load Order
Scripts load in this exact sequence (order matters — each depends on the previous):

| Order | File | Role |
|---|---|---|
| 1 | `utils/logger.js` | Global `logger` object |
| 2 | `config.js` | `window.CONFIG` + fetches secure config from Netlify |
| 3 | `content/utils/inflection-engine.js` | Word inflection utilities |
| 4 | `content/utils/error-handler.js` | Global error handler |
| 5 | `content/core/lb-state-manager.js` | Shared state across components |
| 6 | `content/azure-speech-sdk-bundle.js` | Azure Speech SDK (bundled) |
| 7 | `content/services/lb-azure-core.js` | `window.LB_LANGUAGES`, `window.escapeHtml`, rate limiting, caches |
| 8 | `content/services/lb-translation-service.js` | `window.LanguageBridgeTranslationService` |
| 9 | `content/services/lb-tts-service.js` | `window.LanguageBridgeTTSService` |
| 10 | `content/services/lb-stt-service.js` | `window.LanguageBridgeSTTService` |
| 11 | `content/services/lb-glossary-service.js` | `window.LanguageBridgeGlossaryService` |
| 12 | `content/azure-client.js` | `window.AzureClient` (facade over all services) |
| 13 | `content/session-audio-cache.js` | `window.sessionAudioCache` |
| 14 | `content/activation-modal.js` | First-run activation modal |
| 15 | `content/google-docs-adapter.js` | Google Docs text selection adapter |
| 16 | `content/onboarding.js` | Onboarding flow |
| 17 | `content/highlighter.js` | Text highlighting |
| 18 | `content/toolbar.js` | Main toolbar UI + translation tooltip |
| 19 | `content/floating-translator.js` | Floating conversation translator |

### CSS Load Order
| Order | File |
|---|---|
| 1 | `content/brand-tokens.css` — CSS custom properties (all brand colors/gradients) |
| 2 | `content/toolbar.css` |
| 3 | `content/floating-translator.css` |

---

## Key Global Objects

These are set on `window` and available to all content scripts after their respective files load:

| Global | Set In | What It Is |
|---|---|---|
| `window.logger` | `utils/logger.js` | Logging utility |
| `window.CONFIG` | `config.js` | Configuration object (endpoints, limits, feature flags) |
| `window.LB_LANGUAGES` | `lb-azure-core.js` | Master language table (codes → locale, voice, name) |
| `window.escapeHtml` | `lb-azure-core.js` | XSS-safe HTML escaping utility |
| `window.LanguageBridgeAzureCore` | `lb-azure-core.js` | Rate limiting, caches, init |
| `window.LanguageBridgeTranslationService` | `lb-translation-service.js` | Translation via Netlify proxy |
| `window.LanguageBridgeTTSService` | `lb-tts-service.js` | Text-to-speech via Netlify proxy |
| `window.LanguageBridgeSTTService` | `lb-stt-service.js` | Speech recognition via Azure SDK |
| `window.LanguageBridgeGlossaryService` | `lb-glossary-service.js` | 3-tier glossary builder |
| `window.AzureClient` | `azure-client.js` | Facade — single entry point for all services |
| `window.sessionAudioCache` | `session-audio-cache.js` | In-session TTS audio cache |
| `window.FloatingTranslator` | `floating-translator.js` | Floating translator instance |

---

## Language Support

Defined in `window.LB_LANGUAGES` (`lb-azure-core.js`). Single source of truth — adding a language here propagates to TTS, STT, and all UI.

| Code | Language | TTS Voice | STT Locale |
|---|---|---|---|
| `ur` | Urdu | ur-PK-UzmaNeural | ur-PK |
| `ps` | Pashto | ps-AF-LatifaNeural | ps-AF |
| `fa` | Persian | fa-IR-DilaraNeural | fa-IR |
| `prs` | Dari | fa-IR-DilaraNeural | fa-IR |
| `ar` | Arabic | ar-SA-ZariyahNeural | ar-SA |
| `so` | Somali | so-SO-UbaxNeural | so-SO |
| `uk` | Ukrainian | uk-UA-PolinaNeural | uk-UA |
| `uz` | Uzbek | uz-UZ-MadinaNeural | uz-UZ |
| `en` | English | en-US-JennyNeural | en-US |
| `es` | Spanish | es-US-PalomaNeural | es-US |
| `pt` | Portuguese | pt-BR-FranciscaNeural | pt-BR |
| `fr` | French | fr-FR-DeniseNeural | fr-FR |
| `zh` | Chinese | zh-CN-XiaoxiaoNeural | zh-CN |
| `mww` | Hmong | *(translation only)* | *(none)* |

---

## Configuration System

### How Config Loads
1. `config.js` runs at page load and immediately sets `window.CONFIG` with safe defaults
2. It also fires `window.loadSecureConfig()` automatically — an async fetch to `get-client-config` on Netlify
3. The Netlify response overrides `endpoints`, `features`, `rateLimits`, and `textLimits`
4. `window.ensureConfigLoaded()` is available for any script that needs to wait for config before proceeding

### Key Config Values
```js
window.CONFIG.endpoints.azureProxy    // Netlify proxy URL for Azure API calls
window.CONFIG.endpoints.logFlag       // Netlify log-flag function URL
window.CONFIG.rateLimits              // Per-minute limits (translations: 30, tts: 20, stt: 15)
window.CONFIG.textLimits.maxSelectionLength  // 2000 characters
window.CONFIG.features.maxCacheSize   // 100 cached translations
```

---

## Translation Flow

When a student selects text and presses the play button:

```
1. toolbar.js — User selects text, clicks play
2. → AzureClient.translateText(text, 'en', userLanguage)
3.   → LanguageBridgeTranslationService.translateText()
4.     → Check translationCache (Map, up to 100 entries)
5.     → Cache miss: POST to /.netlify/functions/azure-proxy
6.       { service: 'translate', text, targetLanguage, sourceLanguage }
7.     → azure-proxy.js validates inputs, calls Azure Translator API
8.     → Response cached in translationCache
9. → translatedText returned to toolbar.js
10. → toolbar.js shows translation tooltip (showTranslationTooltip)
11. → AzureClient.speakText(translatedText, userLanguage)
12.   → LanguageBridgeTTSService.speakText()
13.     → POST to /.netlify/functions/azure-proxy
14.       { service: 'speech-synthesis', text, language, voice, rate }
15.     → azure-proxy.js checks TTS audio cache (Netlify Blobs)
16.     → Cache miss: calls Azure Neural TTS, returns base64 audio
17.     → Audio played via Web Audio API
18. → Glossary loads asynchronously (buildGlossaryForTier)
```

---

## Glossary System (3 Tiers)

Built by `LanguageBridgeGlossaryService` (`lb-glossary-service.js`).

| Tier | Target Student | Word Selection Strategy | Translation |
|---|---|---|---|
| **1** (⭐) | Beginners | Most frequent words (3+ chars) from simplified text | Parallel API calls |
| **2** (⭐⭐) | Intermediate | Top 8 content words by frequency, skip stop words | Layered: cache → API |
| **3** (⭐⭐⭐) | Advanced | Multi-syllable words (3+ syllables) from original text | Parallel API calls |

**English/English Mode (Tier 1 only):** Uses a local `wordMap` in `getSimplification()` — returns plain-English synonyms without any API call (free).

**Caching layers for Tier 2:**
1. Check `translationCache` (in-memory Map)
2. If miss → call Azure Translator API, store result in cache

---

## Flag System

Students flag translations or glossary words they find confusing by clicking 🚩 buttons.

### Frontend (toolbar.js)
- **Translation flag:** 🚩 Flag button below translated text in tooltip tab 1
- **Glossary flag:** 🚩 button on each vocab pair in the glossary tab
- `sendFlag(text, language, tier, source)` — fire-and-forget POST to `log-flag`
- One-time-per-session guard: `button.dataset.flagged = '1'` prevents double-flagging

### Backend (log-flag.js + storage.js)
- POST body: `{ text, language, tier, source }`
- `source` values: `'translation'` | `'glossary'`
- Storage key: `{language}:{sha256(language:text).slice(0,16)}`
- Increments `flagCount` on existing entries, creates new entry on first flag

### Threshold Logic
| flagCount | status | Action |
|---|---|---|
| 1–2 | `logged` | Data collection only |
| 3–5 | `elevated` | Review in admin dashboard |
| 6–9 | `bounty` | Phase 2 bounty board candidate |
| 10+ | `high_priority` | Fix immediately |

---

## Audio Caching

Two layers:

**1. Session Cache (`session-audio-cache.js`)**
- In-memory Map, lives for the browser session
- Stores Web Audio API `AudioBuffer` objects
- English words looked up and cached first
- Prevents re-fetching TTS for words already played this session

**2. Server Cache (Netlify Blobs — `tts-audio-cache`)**
- SHA-256 hash of `{text}:{language}:{voice}:{rate}` as key
- Stores base64-encoded audio
- 30-day TTL
- Checked by `azure-proxy.js` before every TTS API call
- Saves Azure TTS cost on repeated phrases

---

## Netlify Backend

### Functions

| Function | Method | Auth | Purpose |
|---|---|---|---|
| `azure-proxy.js` | POST | None (CORS only) | Proxy to Azure APIs (translate, TTS, STT) |
| `get-client-config.js` | GET | Origin check | Deliver config + endpoint URLs to extension |
| `log-flag.js` | POST | None | Log a student flag event |
| `get-flags.js` | GET | `X-API-Key` | Retrieve flag data for admin |
| `admin-stats.js` | GET | `X-API-Key` | Pilot usage stats + budget |
| `get-usage.js` | GET | None (user-scoped) | Per-user daily quota status |

### Storage (Netlify Blobs)

| Store | Key Pattern | TTL | Contents |
|---|---|---|---|
| `usage-logs` | `{userId}:{timestamp}:{random}` | 90 days | Every API call event |
| `user-quotas` | `{userId}:{YYYY-MM-DD}` | 48 hours | Daily per-user counts |
| `pilot-stats` | `total` | Never | Aggregate pilot totals |
| `tts-audio-cache` | `{lang}:{sha256}` | 30 days | Base64 TTS audio |
| `flag-data` | `{lang}:{sha256}` | 90 days | Flag counts + metadata |

### Security (azure-proxy.js)
- Language codes validated: `/^[a-zA-Z]{2,4}(-[a-zA-Z0-9]{2,9})*$/`
- Voice names validated: `/^[a-zA-Z]{2,4}-[a-zA-Z]{2,4}-[a-zA-Z0-9]+$/`
- Speech rate validated: numeric or named constant only
- All URL params run through `encodeURIComponent`
- SSML built from validated values only — no user-supplied SSML injection possible
- Rate limiting: per-user per-minute limits enforced server-side
- Daily quotas: per-user per-day limits enforced server-side
- Budget protection: pilot halts at 95% of `$150` cap

---

## Admin Dashboard

**Current:** `admin-dashboard.html` (standalone HTML at repo root) — covers usage stats, budget, activity feed.

**Planned:** `/admin` route on `languagebridge.app` (Lovable build). See `ADMIN_DASHBOARD_PRD.md` for full spec.

**Auth:** Single `ADMIN_API_KEY` environment variable in Netlify. Passed as `X-API-Key` header. Stored in `localStorage` as `languagebridge_admin_key`.

---

## Brand Tokens

Defined in `content/brand-tokens.css` — loaded first in manifest CSS array.

| Token | Value | Usage |
|---|---|---|
| `--lb-color-primary` | `#742a69` | Buttons, headers, badges |
| `--lb-color-primary-dark` | `#4a1a45` | Hover states, deep backgrounds |
| `--lb-color-primary-light` | `#f5eaf4` | Card backgrounds, subtle tints |
| `--lb-color-accent-start` | `#f37030` | Gradient start |
| `--lb-color-accent-end` | `#ffc755` | Gradient end |
| `--lb-color-accent-light` | `#fff3e6` | Warm tint backgrounds |
| `--lb-gradient-header` | `135deg, #742a69 → #f37030 → #ffc755` | Nav bars, tooltip headers |
| `--lb-gradient-accent` | `90deg, #f37030 → #ffc755` | Accent elements |

**Accessibility:** White on `#742a69` = 7.2:1 (AA+AAA). White on `#4a1a45` = 11.5:1 (AA+AAA). Do NOT use `#ffc755` as text on white.

---

## Interaction with languagebridge.app

`languagebridge.app` is the public marketing + admin website, built on Lovable (React + Tailwind).

| Integration Point | How |
|---|---|
| Admin dashboard | `/admin` route on languagebridge.app calls Netlify functions directly with `X-API-Key` header |
| Config delivery | Extension fetches `get-client-config` on every page load to get fresh endpoint URLs |
| Privacy policy | Extension links to `languagebridge.app/privacy` |
| Support | Extension links to `languagebridge.app/support` |
| No shared auth | The website and extension are independent — no SSO or shared session |

The extension and the website both talk to the **same** Netlify backend. The extension uses it for API proxying; the website uses it for admin data. Azure keys never leave Netlify.

---

## Adding a New Language

1. Add entry to `window.LB_LANGUAGES` in `content/services/lb-azure-core.js`
2. Add the language option to the language picker in `content/toolbar.js` (search for `lb-lang-option`)
3. Add the language option to `content/floating-translator.js` if it has its own picker
4. Verify the Azure Speech voice name at [Azure Neural TTS voices list](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support)
5. If TTS is not supported for this language, set `voice: null` — it will fall back to English TTS

---

## Known Limitations (Alpha)

- **No user accounts** — users identified by extension ID or IP, not by login
- **Flag deduplication** — flagCount reflects events per page load, not unique users
- **Netlify Blobs not queryable** — all filtering is done in memory after bulk fetch
- **Hmong (`mww`)** — translation only, no TTS or STT support from Azure
- **`user-quotas` TTL 48h** — individual day-level usage not available after 2 days
- **Simplification service removed** — English/English mode uses local word map only; full simplification deferred to Phase 2 with off-app database
