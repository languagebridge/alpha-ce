# LanguageBridge Chrome Extension

Real-time translation and text-to-speech for English learners in 9 languages.

**Version:** 1.0.3
**Status:** 🟢 Production Ready
**Security:** ✅ Secure (API keys server-side via Netlify)

---

## 🚀 Quick Start

### Installation for Local Development

1. Go to `chrome://extensions/`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select this directory
5. The extension icon should appear in your Chrome toolbar

### Testing the Extension

Once installed, test these features:
- **Select any text** on a webpage to see translation options
- **Click the extension icon** in the toolbar to open settings
- **Try on Google Docs** - works seamlessly with Google Docs editor

---

## ✨ Features

- 🌍 **Real-time Translation** - Spanish, Persian, Arabic, Dari, Pashto, Ukrainian, Urdu, Somali, and English
- 🔊 **Text-to-Speech** - Natural voice synthesis in all supported languages
- 📚 **Academic Vocabulary** - Hundreds of academic terms with Plain English definitions
- 👨‍🎓 **Talk to Teacher** - Two-way voice conversation translator
- 📝 **Google Docs Support** - Full integration with Google Docs
- 🔒 **Privacy-First** - COPPA & FERPA compliant

---

## 📁 Project Structure

### Key Files

- [manifest.json](manifest.json) - Chrome extension configuration
- [config.js](config.js) - API endpoints and feature flags
- [background.js](background.js) - Service worker for extension lifecycle
- [LICENSE](LICENSE) - MIT License

### Directories

- [content/](content/) - Content scripts injected into web pages
  - [services/](content/services/) - Translation, TTS, STT, and simplification services
  - [utils/](content/utils/) - Utility functions and error handling
  - Core UI components (toolbar, floating translator, highlighter)
- [popup/](popup/) - Extension popup UI
- [options/](options/) - Settings page
- [assets/](assets/) - Icons and images
- [netlify/](netlify/) - Serverless functions for API proxying
- [scripts/](scripts/) - Build and utility scripts
- [utils/](utils/) - Shared utility modules

---

## 🔧 Technical Architecture

### Serverless Backend (Netlify)

API keys are stored securely in Netlify environment variables and accessed via serverless functions:

```
Extension → Netlify Functions → Azure Cognitive Services
                               → Supabase (Analytics)
```

### Required Environment Variables

See [netlify.toml](netlify.toml) for configuration. Required variables:
- `AZURE_TRANSLATOR_KEY`
- `AZURE_TRANSLATOR_REGION`
- `AZURE_SPEECH_KEY`
- `AZURE_SPEECH_REGION`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`

---

## 🧪 Testing

### Manual Testing Checklist

1. **Text Selection Translation**
   - Select text on any webpage
   - Verify translation popup appears
   - Test multiple languages

2. **Text-to-Speech**
   - Click speaker icon on translated text
   - Verify audio plays correctly
   - Test different languages

3. **Academic Vocabulary**
   - Select academic terms
   - Verify Plain English definitions appear
   - Test tiered simplification

4. **Google Docs Integration**
   - Open a Google Doc
   - Select text and translate
   - Verify toolbar works in Google Docs

---

## 🔒 Privacy & Compliance

### Data Handling

- ✅ **COPPA Compliant** - No personal data collected from children under 13
- ✅ **FERPA Compliant** - No education records stored
- ✅ **No Browsing History** - Extension does not track browsing
- ✅ **No Data Selling** - User data is never sold or shared
- ✅ **Minimal Permissions** - Only requests `storage` and `activeTab`

### Analytics

Privacy-first analytics track only:
- Feature usage counts (anonymous)
- Language pair selections (anonymous)
- No personal information or translated content

See [content/analytics.js](content/analytics.js) for implementation.

---

## 📞 Contact & Support

**General Inquiries:**
- Email: info@languagebridge.app
- Phone: 216-800-6020

**Chief Technology Officer:**
- P. Howard
- Email: prentice@languagebridge.app

**Teacher Dashboard:**
- https://languagebridge.app/dashboard

**Privacy Policy:**
- https://languagebridge.app/privacy

---

## 📄 License

MIT License - See [LICENSE](LICENSE) file
© 2025 LanguageBridge, LLC

