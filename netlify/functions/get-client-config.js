/**
 * SECURE CLIENT CONFIGURATION DELIVERY
 *
 * Purpose: Deliver safe client-side configuration including Supabase credentials
 * This enables key rotation without Chrome extension updates
 *
 * Security Notes:
 * - Supabase anon key is safe to expose (protected by Row Level Security policies)
 * - But delivering server-side allows rotation and monitoring
 * - No sensitive Azure keys are exposed (those stay server-side only)
 */

// CORS headers - allows your Chrome extension to call this function
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

/**
 * Main handler function
 * Returns client-safe configuration
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

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed. Use GET.' }),
    };
  }

  try {
    // Optional: Validate request origin (recommended for production)
    const origin = event.headers.origin || event.headers.referer || '';
    const isValidOrigin =
      origin.includes('chrome-extension://') ||
      origin.includes('languagebridge.app') ||
      process.env.CONTEXT !== 'production'; // Allow all in dev/preview

    if (!isValidOrigin && process.env.CONTEXT === 'production') {
      console.warn('Rejected request from invalid origin:', origin);
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Unauthorized origin' })
      };
    }

    // Get Supabase credentials from environment variables
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    // Validate environment variables are set
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables');
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Configuration incomplete',
          message: 'Server configuration is missing required variables'
        }),
      };
    }

    // Build safe client configuration
    const config = {
      // Supabase credentials (anon key is safe - protected by RLS)
      supabase: {
        url: supabaseUrl,
        anonKey: supabaseAnonKey,
      },

      // Netlify endpoints (dynamically built based on deploy URL)
      endpoints: {
        azureProxy: `${process.env.URL || 'https://exquisite-croissant-4288dd.netlify.app'}/.netlify/functions/azure-proxy`,
        logFlag: `${process.env.URL || 'https://exquisite-croissant-4288dd.netlify.app'}/.netlify/functions/log-flag`,
      },

      // Website URLs
      website: {
        base: 'https://languagebridge.app',
        privacyPolicy: 'https://languagebridge.app/privacy',
        support: 'https://languagebridge.app/support',
        dashboard: 'https://languagebridge.app',
      },

      // Support contact information
      support: {
        email: 'info@languagebridge.app',
        phone: '216-800-6020',
        accountManager: 'Prentice Howard, CTO'
      },

      // Extension metadata
      version: '1.0.3',
      environment: process.env.CONTEXT || 'production',

      // Feature flags (can be updated server-side without extension update)
      features: {
        offlineVocabularyEnabled: true,
        translationCachingEnabled: true,
        maxCacheSize: 100,
      },

      // Rate limiting configuration (server-side enforced)
      rateLimits: {
        translationsPerMinute: 30,
        ttsRequestsPerMinute: 20,
        speechRecognitionPerMinute: 15,
        cooldownPeriod: 60000, // 1 minute
        maxRequestsPerMinute: 10, // Server-side rate limit
      },

      // Text length limits
      textLimits: {
        maxSelectionLength: 2000,
        maxGlossaryTerms: 50,
        selectionWarningThreshold: 1500,
      },

      // Daily quotas (server-side enforced)
      dailyQuotas: {
        translations: 100,
        tts: 50,
        translationCharacters: 50000,
        ttsCharacters: 25000,
      },

      // Pilot program info
      pilot: {
        enabled: true,
        budgetProtection: true,
        usageTrackingEnabled: true,
      },
    };

    // Return configuration
    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      },
      body: JSON.stringify(config),
    };

  } catch (error) {
    console.error('Config delivery error:', error);

    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Configuration unavailable',
        message: 'Please check your internet connection and try again.'
      }),
    };
  }
};
