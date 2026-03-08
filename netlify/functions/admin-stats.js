/**
 * ADMIN STATISTICS FUNCTION
 *
 * Purpose: Provides real-time usage statistics for pilot program monitoring
 * Requires authentication with ADMIN_API_KEY
 *
 * Returns:
 * - Total pilot budget usage and remaining
 * - Per-user breakdown
 * - Recent activity logs
 * - Budget alerts
 */

const config = require('./lib/config');
const { getPilotStats, getAllUsageLogs, getUserBreakdown } = require('./lib/storage');

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed. Use GET.' }),
    };
  }

  // ============================================================================
  // AUTHENTICATION
  // ============================================================================

  const apiKey = event.headers['x-api-key'] || event.queryStringParameters?.apiKey;

  if (!apiKey || apiKey !== config.ADMIN_API_KEY) {
    return {
      statusCode: 401,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Unauthorized',
        message: 'Valid API key required. Set X-API-Key header or apiKey query parameter.',
      }),
    };
  }

  // ============================================================================
  // FETCH STATISTICS
  // ============================================================================

  try {
    // Get pilot-wide stats
    const pilotStats = await getPilotStats();

    // Get user breakdown
    const userBreakdown = await getUserBreakdown();

    // Get recent logs
    const limit = parseInt(event.queryStringParameters?.limit || '50');
    const recentLogs = await getAllUsageLogs(limit);

    // Calculate budget metrics
    const budgetUsed = pilotStats.totalCost;
    const budgetTotal = config.PILOT_TOTAL_BUDGET_USD;
    const budgetRemaining = budgetTotal - budgetUsed;
    const budgetPercent = (budgetUsed / budgetTotal) * 100;

    // Budget status
    let budgetStatus = 'healthy';
    if (budgetPercent >= config.BUDGET_CRITICAL_THRESHOLD * 100) {
      budgetStatus = 'critical';
    } else if (budgetPercent >= config.BUDGET_WARNING_THRESHOLD * 100) {
      budgetStatus = 'warning';
    }

    // Active users (users with activity in recent logs)
    const activeUserIds = new Set(recentLogs.map(log => log.userId));

    // Top users by cost
    const topUsers = Object.entries(userBreakdown)
      .sort((a, b) => b[1].totalCost - a[1].totalCost)
      .slice(0, 10)
      .map(([userId, stats]) => ({
        userId,
        ...stats,
      }));

    // Service breakdown
    const serviceBreakdown = {
      translations: pilotStats.translationRequests || 0,
      tts: pilotStats.ttsRequests || 0,
      stt: pilotStats.sttRequests || 0,
    };

    // ============================================================================
    // RETURN RESPONSE
    // ============================================================================

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache', // Don't cache admin stats
      },
      body: JSON.stringify({
        // Budget overview
        budget: {
          used: budgetUsed.toFixed(4),
          total: budgetTotal.toFixed(2),
          remaining: budgetRemaining.toFixed(4),
          percentUsed: budgetPercent.toFixed(2),
          status: budgetStatus,
          alert: budgetPercent >= config.BUDGET_WARNING_THRESHOLD * 100,
        },

        // Pilot totals
        totals: {
          requests: pilotStats.totalRequests,
          characters: pilotStats.totalCharacters,
          cost: pilotStats.totalCost.toFixed(4),
          lastUpdated: pilotStats.lastUpdated,
        },

        // Service breakdown
        services: serviceBreakdown,

        // User statistics
        users: {
          total: Object.keys(userBreakdown).length,
          active: activeUserIds.size,
          topUsers,
        },

        // Recent activity
        recentActivity: recentLogs.slice(0, 20).map(log => ({
          timestamp: log.timestamp,
          userId: log.userId,
          service: log.service,
          characters: log.characters,
          cost: log.cost ? log.cost.toFixed(6) : '0',
          success: log.success,
          error: log.errorMessage,
        })),

        // Configuration info
        limits: {
          dailyTranslations: config.MAX_TRANSLATIONS_PER_DAY,
          dailyTTS: config.MAX_TTS_REQUESTS_PER_DAY,
          rateLimit: config.MAX_REQUESTS_PER_MINUTE,
        },

        // Timestamp
        generatedAt: new Date().toISOString(),
      }),
    };

  } catch (error) {
    console.error('Admin stats error:', error);

    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Failed to fetch statistics',
        message: error.message,
      }),
    };
  }
};
