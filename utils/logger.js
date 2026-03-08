/**
 * Production Logger Utility
 *
 * Replaces console.log with environment-aware logging
 * In production: Only errors are logged
 * In development: All logs are shown
 *
 * Usage:
 *   import { logger } from '../utils/logger.js';
 *   logger.log('Info message');
 *   logger.warn('Warning message');
 *   logger.error('Error message'); // Always logged
 */

// Detect environment from manifest version_name (e.g. "1.0.6-alpha" → dev mode)
const IS_DEVELOPMENT = (() => {
  try {
    const vn = chrome.runtime.getManifest().version_name || '';
    return vn.includes('alpha') || vn.includes('dev') || vn.includes('beta');
  } catch { return false; }
})();

/**
 * Logger class with environment-aware logging
 */
class Logger {
  constructor(isDevelopment = false) {
    this.isDevelopment = isDevelopment;
  }

  /**
   * Log informational messages (development only)
   */
  log(...args) {
    if (this.isDevelopment) {
      console.log(...args);
    }
  }

  /**
   * Log warning messages (development only)
   */
  warn(...args) {
    if (this.isDevelopment) {
      console.warn(...args);
    }
  }

  /**
   * Log error messages (always logged, even in production)
   */
  error(...args) {
    console.error(...args);
  }

  /**
   * Log debug messages with timestamp (development only)
   */
  debug(...args) {
    if (this.isDevelopment) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}]`, ...args);
    }
  }

  /**
   * Group logs together (development only)
   */
  group(label) {
    if (this.isDevelopment) {
      console.group(label);
    }
  }

  groupEnd() {
    if (this.isDevelopment) {
      console.groupEnd();
    }
  }

  /**
   * Log table data (development only)
   */
  table(data) {
    if (this.isDevelopment) {
      console.table(data);
    }
  }

  /**
   * Performance timing (development only)
   */
  time(label) {
    if (this.isDevelopment) {
      console.time(label);
    }
  }

  timeEnd(label) {
    if (this.isDevelopment) {
      console.timeEnd(label);
    }
  }
}

// Make logger available globally for content scripts
const logger = new Logger(IS_DEVELOPMENT);

// Export to window for non-module scripts
if (typeof window !== 'undefined') {
  window.logger = logger;
}
