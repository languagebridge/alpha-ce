/**
 * ENHANCED AZURE PROXY FUNCTION - WITH FULL PROTECTION
 *
 * Purpose: Securely proxy requests to Azure Cognitive Services APIs
 * This version includes:
 * - User identification and tracking
 * - Rate limiting (requests per minute)
 * - Daily quotas (per user)
 * - Budget protection (pilot-wide)
 * - Usage logging and cost tracking
 *
 * Supported services:
 * - Text Translation
 * - Text-to-Speech (Speech Synthesis)
 * - Speech-to-Text (Speech Recognition)
 */

const axios = require('axios');
const config = require('./lib/config');
const { getUserId, getUserDailyUsage, logUsage, getCachedAudio, setCachedAudio } = require('./lib/storage');
const { checkRateLimit } = require('./lib/rate-limiter');
const { checkDailyQuota, checkPilotBudget, estimateCost } = require('./lib/quota-checker');

// CORS headers - allows your Chrome extension to call this function
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-ID, X-School-ID, X-Classroom-ID, X-Teacher-ID, X-Deployment-Type, X-Simplification-Tier',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

/**
 * Main handler function
 */
exports.handler = async (event, context) => {
  // Handle preflight CORS requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed. Use POST.' }),
    };
  }

  let userId;
  let requestData;
  let service;

  try {
    // ========================================================================
    // STEP 1: PARSE REQUEST & IDENTIFY USER
    // ========================================================================

    requestData = JSON.parse(event.body);
    service = requestData.service;
    const data = requestData.data;

    // Get user identifier
    userId = getUserId(event);

    if (config.ENABLE_DEBUG_LOGGING) {
      console.log('📥 Request:', {
        userId,
        service,
        characters: data.text?.length || 0,
      });
    }

    // Validate service
    if (!service || !['translate', 'translation', 'speech-synthesis', 'tts', 'speech-recognition', 'stt'].includes(service)) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: `Unknown service: ${service}. Supported: translate, speech-synthesis, speech-recognition`
        }),
      };
    }

    // ========================================================================
    // STEP 2: VALIDATE AZURE CREDENTIALS
    // ========================================================================

    const AZURE_TRANSLATOR_KEY = config.AZURE_TRANSLATOR_KEY;
    const AZURE_SPEECH_KEY = config.AZURE_SPEECH_KEY;
    const AZURE_REGION = config.AZURE_TRANSLATOR_REGION;

    if (!AZURE_TRANSLATOR_KEY || !AZURE_SPEECH_KEY) {
      console.error('Missing Azure API keys in environment variables');
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Server configuration error. Please contact administrator.'
        }),
      };
    }

    // ========================================================================
    // STEP 3: CHECK RATE LIMITS
    // ========================================================================

    const rateLimitCheck = await checkRateLimit(userId);
    if (!rateLimitCheck.allowed) {
      return {
        statusCode: 429,
        headers: {
          ...corsHeaders,
          'Retry-After': rateLimitCheck.retryAfter || 60,
          'X-RateLimit-Limit': config.MAX_REQUESTS_PER_MINUTE,
          'X-RateLimit-Remaining': 0,
        },
        body: JSON.stringify({
          error: rateLimitCheck.message,
          retryAfter: rateLimitCheck.retryAfter,
        }),
      };
    }

    // ========================================================================
    // STEP 4: CHECK DAILY QUOTAS
    // ========================================================================

    const quotaCheck = await checkDailyQuota(userId, service, data);
    if (!quotaCheck.allowed) {
      return {
        statusCode: 429,
        headers: corsHeaders,
        body: JSON.stringify({
          error: quotaCheck.message,
          usage: quotaCheck.usage,
          limit: quotaCheck.limit,
          current: quotaCheck.current,
        }),
      };
    }

    // ========================================================================
    // STEP 5: CHECK PILOT BUDGET
    // ========================================================================

    const budgetCheck = await checkPilotBudget();
    if (!budgetCheck.allowed) {
      return {
        statusCode: 503,
        headers: corsHeaders,
        body: JSON.stringify({
          error: budgetCheck.message,
          budgetUsed: budgetCheck.budgetUsed,
          budgetTotal: budgetCheck.budgetTotal,
        }),
      };
    }

    // ========================================================================
    // STEP 6: CALL AZURE API
    // ========================================================================

    const startTime = Date.now();
    let result;
    let cost;

    switch (service) {
      case 'translate':
      case 'translation':
        result = await handleTranslation(data, AZURE_TRANSLATOR_KEY, AZURE_REGION);
        cost = estimateCost('translate', data);
        break;

      case 'speech-synthesis':
      case 'tts':
        result = await handleSpeechSynthesis(data, AZURE_SPEECH_KEY, AZURE_REGION);
        cost = estimateCost('tts', data);
        break;

      case 'speech-recognition':
      case 'stt':
        result = await handleSpeechRecognition(data, AZURE_SPEECH_KEY, AZURE_REGION);
        cost = estimateCost('stt', data);
        break;
    }

    const responseTime = Date.now() - startTime;

    // ========================================================================
    // STEP 7: LOG USAGE
    // ========================================================================

    await logUsage(userId, {
      service,
      characters: data.text?.length || 0,
      minutes: data.minutes || 0,
      cost,
      sourceLanguage: data.sourceLanguage,
      targetLanguage: data.targetLanguage || data.language,
      success: true,
      responseTime,
    });

    // ========================================================================
    // STEP 8: RETURN RESPONSE WITH USAGE INFO
    // ========================================================================

    // Get updated usage
    const usage = await getUserDailyUsage(userId);

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'X-RateLimit-Limit': config.MAX_REQUESTS_PER_MINUTE,
        'X-RateLimit-Remaining': rateLimitCheck.remaining || 0,
      },
      body: JSON.stringify({
        ...result,
        usage: {
          translations: {
            used: usage.translations.count,
            limit: config.MAX_TRANSLATIONS_PER_DAY,
            remaining: config.MAX_TRANSLATIONS_PER_DAY - usage.translations.count,
          },
          tts: {
            used: usage.tts.count,
            limit: config.MAX_TTS_REQUESTS_PER_DAY,
            remaining: config.MAX_TTS_REQUESTS_PER_DAY - usage.tts.count,
          },
          characters: {
            translation: usage.translations.characters,
            tts: usage.tts.characters,
          },
          budget: {
            used: usage.totalCost.toFixed(4),
            pilotRemaining: (config.PILOT_TOTAL_BUDGET_USD - (budgetCheck.budgetUsed || 0)).toFixed(2),
          },
        },
      }),
    };

  } catch (error) {
    console.error('Azure proxy error:', error);

    // Log error if we have user ID
    if (userId && service) {
      await logUsage(userId, {
        service,
        characters: requestData?.data?.text?.length || 0,
        cost: 0,
        success: false,
        errorMessage: error.message,
      }).catch(err => console.error('Error logging failure:', err));
    }

    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
    };
  }
};

// ============================================================================
// AZURE API HANDLERS
// ============================================================================

/**
 * Handle text translation requests
 */
async function handleTranslation(data, apiKey, region) {
  const { text, targetLanguage, sourceLanguage } = data;

  if (!text || !targetLanguage) {
    throw new Error('Missing required fields: text and targetLanguage');
  }

  const endpoint = `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=${targetLanguage}`;
  const url = sourceLanguage ? `${endpoint}&from=${sourceLanguage}` : endpoint;

  const response = await axios.post(
    url,
    [{ text }],
    {
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Ocp-Apim-Subscription-Region': region,
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 second timeout
    }
  );

  const translation = response.data[0].translations[0].text;
  const detectedLanguage = response.data[0].detectedLanguage?.language;

  return {
    translation,
    detectedLanguage,
    targetLanguage,
  };
}

/**
 * Handle text-to-speech requests
 */
async function handleSpeechSynthesis(data, apiKey, region) {
  const { text, language, voice, rate } = data;

  if (!text || !language) {
    throw new Error('Missing required fields: text and language');
  }

  const resolvedVoice = voice || getDefaultVoice(language);
  const resolvedRate = rate || '1.0';

  // Check audio cache before calling Azure
  const cachedAudio = await getCachedAudio(text, language, resolvedVoice, resolvedRate);
  if (cachedAudio) {
    return { audio: cachedAudio, format: 'mp3', cached: true };
  }

  const ssml = `
    <speak version='1.0' xml:lang='${language}'>
      <voice xml:lang='${language}' name='${resolvedVoice}'>
        <prosody rate='${resolvedRate}'>
          ${escapeXml(text)}
        </prosody>
      </voice>
    </speak>
  `;

  const endpoint = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;

  const response = await axios.post(
    endpoint,
    ssml,
    {
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
      },
      responseType: 'arraybuffer',
      timeout: 30000, // 30 second timeout for audio
    }
  );

  const audioBase64 = Buffer.from(response.data).toString('base64');

  // Store in cache for future requests (fire and forget)
  setCachedAudio(text, language, resolvedVoice, resolvedRate, audioBase64);

  return {
    audio: audioBase64,
    format: 'mp3',
    cached: false,
  };
}

/**
 * Handle speech-to-text requests
 * Supports multiple audio formats: wav, webm, ogg
 */
async function handleSpeechRecognition(data, apiKey, region) {
  const { audioData, language, mimeType } = data;

  if (!audioData || !language) {
    throw new Error('Missing required fields: audioData and language');
  }

  // Map browser mimeTypes to Azure-compatible Content-Types
  const contentTypeMap = {
    'audio/webm': 'audio/webm; codecs=opus',
    'audio/webm; codecs=opus': 'audio/webm; codecs=opus',
    'audio/ogg': 'audio/ogg; codecs=opus',
    'audio/ogg; codecs=opus': 'audio/ogg; codecs=opus',
    'audio/wav': 'audio/wav',
    'audio/wave': 'audio/wav',
  };

  // Default to webm if not specified (Chrome default)
  const contentType = contentTypeMap[mimeType] || 'audio/webm; codecs=opus';

  const endpoint = `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${language}`;
  const audioBuffer = Buffer.from(audioData, 'base64');

  if (config.ENABLE_DEBUG_LOGGING) {
    console.log(`🎤 STT Request: ${(audioBuffer.length / 1024).toFixed(1)} KB, format: ${contentType}, language: ${language}`);
  }

  try {
    const response = await axios.post(
      endpoint,
      audioBuffer,
      {
        headers: {
          'Ocp-Apim-Subscription-Key': apiKey,
          'Content-Type': contentType,
          'Accept': 'application/json',
        },
        timeout: 30000, // 30 second timeout
      }
    );

    if (config.ENABLE_DEBUG_LOGGING) {
      console.log('🎤 STT Response:', response.data);
    }

    // Handle different response formats
    const text = response.data.DisplayText || response.data.Text || '';
    const confidence = response.data.Confidence || response.data.NBest?.[0]?.Confidence || 0;

    return {
      text,
      confidence,
      language,
      status: response.data.RecognitionStatus || 'Success',
    };
  } catch (error) {
    console.error('🎤 STT Error:', error.response?.data || error.message);

    // Provide more helpful error messages
    if (error.response?.status === 400) {
      throw new Error('Invalid audio format or empty audio. Please try speaking again.');
    } else if (error.response?.status === 401) {
      throw new Error('Speech service authentication failed. Please contact support.');
    } else if (error.response?.status === 429) {
      throw new Error('Speech service rate limit exceeded. Please wait a moment.');
    }

    throw error;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getDefaultVoice(language) {
  const voices = {
    'ur-PK': 'ur-PK-UzmaNeural',
    'fa-IR': 'fa-IR-DilaraNeural',
    'ps-AF': 'ps-AF-LatifaNeural',
    'ar-SA': 'ar-SA-ZariyahNeural',
    'uz-UZ': 'uz-UZ-MadinaNeural',
    'uk-UA': 'uk-UA-PolinaNeural',
    'en-US': 'en-US-JennyNeural',
    'es-US': 'es-US-PalomaNeural',
  };
  return voices[language] || `${language}-Standard-A`;
}

function escapeXml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
