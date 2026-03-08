/**
 * Admin: Get Flag Data
 *
 * Returns all flagged translations and glossary words, sorted by flag count.
 * Requires ADMIN_API_KEY authentication (same as admin-stats.js).
 *
 * GET /.netlify/functions/get-flags?limit=100&status=elevated
 *
 * Optional query params:
 *   limit  — max entries to return (default 100, max 500)
 *   status — filter by status: logged | elevated | bounty | high_priority
 */

const config = require('./lib/config');
const { getAllFlags } = require('./lib/storage');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

const VALID_STATUSES = new Set(['logged', 'elevated', 'bounty', 'high_priority']);

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed. Use GET.' }),
    };
  }

  // Authentication
  const apiKey = event.headers['x-api-key'] || event.queryStringParameters?.apiKey;
  if (!apiKey || apiKey !== config.ADMIN_API_KEY) {
    return {
      statusCode: 401,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Unauthorized. Set X-API-Key header or apiKey query param.' }),
    };
  }

  try {
    const rawLimit = parseInt(event.queryStringParameters?.limit || '100', 10);
    const limit = Math.min(Math.max(1, rawLimit), 500);
    const statusFilter = event.queryStringParameters?.status;

    let flags = await getAllFlags(limit);

    // Optional filter by status
    if (statusFilter && VALID_STATUSES.has(statusFilter)) {
      flags = flags.filter(f => f.status === statusFilter);
    }

    // Summary counts by status
    const summary = { logged: 0, elevated: 0, bounty: 0, high_priority: 0, total: flags.length };
    flags.forEach(f => {
      if (summary[f.status] !== undefined) summary[f.status]++;
    });

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
      body: JSON.stringify({ summary, flags }),
    };

  } catch (error) {
    console.error('get-flags error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error.' }),
    };
  }
};
