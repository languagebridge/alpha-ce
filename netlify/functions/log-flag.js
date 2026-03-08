/**
 * Flag Logging Function
 *
 * Receives a flag event when a student marks a translation or glossary
 * word as confusing/incorrect. Stores counts in Netlify Blobs.
 *
 * Threshold logic:
 *   1–2 flags  → status: 'logged'      (baseline data)
 *   3–5 flags  → status: 'elevated'    (worth reviewing)
 *   6–9 flags  → status: 'bounty'      (add to Phase 2 bounty board)
 *   10+ flags  → status: 'high_priority' (fix immediately)
 */

const { logFlag } = require('./lib/storage');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Validated language codes (mirrors azure-proxy.js)
const LANGUAGE_CODE_RE = /^[a-zA-Z]{2,4}(-[a-zA-Z0-9]{2,9})*$/;

const VALID_SOURCES = new Set(['translation', 'glossary']);
const VALID_TIERS = new Set([1, 2, 3, null]);

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed. Use POST.' }),
    };
  }

  try {
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (_e) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid JSON body.' }),
      };
    }

    const { text, language, tier, source } = body;

    // Validate text
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing or empty text.' }),
      };
    }
    if (text.length > 5000) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Text exceeds 5000 character limit.' }),
      };
    }

    // Validate language code
    if (!language || !LANGUAGE_CODE_RE.test(language)) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid or missing language code.' }),
      };
    }

    // Validate tier (optional, 1/2/3 or absent)
    const tierNum = tier != null ? Number(tier) : null;
    if (tierNum !== null && !VALID_TIERS.has(tierNum)) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid tier. Must be 1, 2, or 3.' }),
      };
    }

    // Validate source (optional)
    const safeSource = VALID_SOURCES.has(source) ? source : 'unknown';

    const result = await logFlag(text.trim(), language, tierNum, safeSource);

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        flagCount: result.flagCount,
        status: result.status,
      }),
    };

  } catch (error) {
    console.error('log-flag error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error.' }),
    };
  }
};
