# LanguageBridge Netlify Functions

This folder contains serverless functions that act as secure proxies for the LanguageBridge Chrome Extension.

## 🎯 Purpose

These functions hide API keys from the Chrome extension code, preventing unauthorized access to Azure and Firebase services.

## 📁 Functions

### 1. `azure-proxy.js`
**Purpose:** Proxy requests to Azure Cognitive Services (Translation, Speech)

**Endpoint:** `https://your-site.netlify.app/.netlify/functions/azure-proxy`

**Request Format:**
```json
{
  "service": "translate",
  "data": {
    "text": "Hello world",
    "targetLanguage": "ur",
    "sourceLanguage": "en"
  }
}
```

**Supported Services:**
- `translate` - Text translation
- `speech-synthesis` - Text-to-speech
- `speech-recognition` - Speech-to-text

---

### 2. `firebase-analytics.js`
**Purpose:** Store analytics data in Firebase Firestore

**Endpoint:** `https://your-site.netlify.app/.netlify/functions/firebase-analytics`

**Request Format:**
```json
{
  "action": "daily-usage",
  "userId": "user_abc123",
  "timestamp": "2024-12-17T10:30:00Z",
  "dailyStats": {
    "translations": 15,
    "ttsPlays": 8,
    "languageUsage": {
      "ur": 10,
      "prs": 5
    }
  }
}
```

**Supported Actions:**
- `daily-usage` - Daily statistics
- `feature-event` - Feature usage tracking
- `satisfaction-rating` - User feedback
- `error-log` - Error tracking

---

## 🚀 Deployment Guide

### Step 1: Create Netlify Account
1. Go to https://netlify.com
2. Sign up with GitHub (free)

### Step 2: Connect Your Repository
1. Click "Add new site" > "Import an existing project"
2. Connect to GitHub
3. Select your `languagebridge-extension` repository
4. **Build settings:**
   - Build command: `echo 'No build needed'`
   - Publish directory: `.`
   - Functions directory: `netlify/functions`

### Step 3: Set Environment Variables
1. In Netlify dashboard, go to: **Site Settings > Environment Variables**
2. Add these variables (get values from Azure and Firebase):

```
AZURE_TRANSLATOR_KEY=your_azure_translator_key
AZURE_SPEECH_KEY=your_azure_speech_key
AZURE_REGION=eastus

FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=123456789
FIREBASE_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/...
```

### Step 4: Deploy
1. Click "Deploy site"
2. Wait for build to complete (~1 minute)
3. Your functions will be live at: `https://your-site-name.netlify.app/.netlify/functions/`

---

## 🧪 Testing Locally

### Install Dependencies
```bash
npm install
```

### Set Up Local Environment
```bash
# Copy the example file
cp ../.env.example .env

# Edit .env and add your real API keys
# (This file is gitignored - safe to put real keys here)
```

### Run Local Dev Server
```bash
npm run dev
```

Your functions will be available at:
- http://localhost:8888/.netlify/functions/azure-proxy
- http://localhost:8888/.netlify/functions/firebase-analytics

### Test with cURL

**Test Azure Translation:**
```bash
curl -X POST http://localhost:8888/.netlify/functions/azure-proxy \
  -H "Content-Type: application/json" \
  -d '{
    "service": "translate",
    "data": {
      "text": "Hello",
      "targetLanguage": "ur"
    }
  }'
```

**Test Firebase Analytics:**
```bash
curl -X POST http://localhost:8888/.netlify/functions/firebase-analytics \
  -H "Content-Type: application/json" \
  -d '{
    "action": "daily-usage",
    "userId": "test_user_123",
    "timestamp": "2024-12-17T10:30:00Z",
    "dailyStats": {
      "translations": 5
    }
  }'
```

---

## 📊 Monitoring

### View Function Logs
1. Go to Netlify dashboard
2. Click on your site
3. Go to **Functions** tab
4. Click on a function name to see logs

### Check Analytics
1. Go to **Analytics** tab in Netlify dashboard
2. See function invocations, errors, and performance

---

## 🔒 Security Best Practices

✅ **DO:**
- Keep `.env` in `.gitignore`
- Use environment variables for all secrets
- Rotate API keys regularly
- Monitor function usage for unusual activity

❌ **DON'T:**
- Commit API keys to GitHub
- Share your `.env` file
- Use the same keys for development and production
- Ignore error logs

---

## 💰 Costs

### Netlify Free Tier:
- 125,000 function requests/month
- 100 hours of function runtime/month

### If You Exceed Free Tier:
- $25/month for Pro plan
- 2 million requests
- 1,000 hours runtime

**Typical Usage:**
- 100 students × 50 translations/day = 5,000 requests/day
- ~150,000 requests/month (still free!)

---

## 🆘 Troubleshooting

### "Function not found" error
- Make sure functions are in `netlify/functions/` folder
- Check `netlify.toml` has correct path
- Redeploy the site

### "Missing environment variables" error
- Go to Site Settings > Environment Variables
- Verify all required variables are set
- Redeploy after adding variables

### CORS errors in browser
- Check that functions return proper CORS headers
- Test in Postman/cURL first to isolate CORS issues

### Firebase authentication errors
- Double-check your service account key
- Make sure private key includes `\n` characters
- Verify project ID matches Firebase console

---

## 📚 Learn More

- [Netlify Functions Docs](https://docs.netlify.com/functions/overview/)
- [Azure Cognitive Services](https://azure.microsoft.com/services/cognitive-services/)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
