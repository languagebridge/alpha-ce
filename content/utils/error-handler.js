/**
 * LanguageBridge Error Handler
 */

class LanguageBridgeErrorHandler {
  static async trackError(service, details) {
    // Server-side analytics happen automatically in Netlify functions
    // No client-side tracking needed (COPPA/FERPA compliant)
    logger.error(`[${service}] Error:`, details);
  }
  static async trackSuccess(service, details) {
    // Server-side analytics happen automatically in Netlify functions
    // No client-side tracking needed (COPPA/FERPA compliant)
    logger.log(`[${service}] Success:`, details);
  }
  static handleRateLimitError(service) {
    logger.warn(`Rate limit exceeded for ${service}`);

    if (window.LanguageBridgeToolbar) {
      window.LanguageBridgeToolbar.showStatus(
        'Too many requests - please wait a moment',
        'error'
      );
    }

    this.trackError(service, {
      error: 'Rate limit exceeded',
      type: 'rate_limit'
    });
  }
  static handleNetworkError(service, error) {
    logger.error(`Network error in ${service}:`, error);

    if (window.LanguageBridgeToolbar) {
      window.LanguageBridgeToolbar.showStatus(
        'Network error - check your connection',
        'error'
      );
    }

    this.trackError(service, {
      error: error.message || 'Network error',
      type: 'network'
    });
  }
  static handleAPIError(service, error) {
    logger.error(`API error in ${service}:`, error);

    if (window.LanguageBridgeToolbar) {
      window.LanguageBridgeToolbar.showStatus(
        'Service error - please try again',
        'error'
      );
    }

    this.trackError(service, {
      error: error.message || 'API error',
      type: 'api'
    });
  }
  static validateTextSelection(text) {
    const MAX_CHARS = window.CONFIG?.textLimits?.maxSelectionLength || 2000;
    const WARNING_THRESHOLD = window.CONFIG?.textLimits?.selectionWarningThreshold || 1500;

    if (!text || text.length === 0) {
      return { valid: false, error: 'NO_TEXT' };
    }

    if (text.length > MAX_CHARS) {
      return {
        valid: true,
        truncated: true,
        text: text.substring(0, MAX_CHARS),
        warning: `Selection truncated to ${MAX_CHARS} characters`
      };
    }

    if (text.length > WARNING_THRESHOLD) {
      return {
        valid: true,
        warning: `Large selection (${text.length} chars) - may take longer`
      };
    }

    return { valid: true };
  }
}

// Export to global namespace
window.LanguageBridgeErrorHandler = LanguageBridgeErrorHandler;
