/**
 * LanguageBridge State Manager
 */

class LanguageBridgeStateManager {
  constructor() {
    this.state = {
      // UI state
      isActive: false,
      isExpanded: false,

      // Audio state
      isReading: false,
      isPaused: false,

      // Translation state
      isTranslating: false,
      selectedText: '',
      currentTranslation: null,

      // User preferences
      userLanguage: 'ur',
      readingSpeed: 1.0,
      verbosity: 'balanced',
      simplificationTier: 2
    };

    this.listeners = new Map();
  }
  getState() {
    return { ...this.state };
  }
  setState(updates) {
    const oldState = { ...this.state };
    this.state = { ...this.state, ...updates };

    // Notify listeners of specific changes
    Object.keys(updates).forEach(key => {
      if (oldState[key] !== this.state[key]) {
        this.emit(`state:${key}`, this.state[key], oldState[key]);
      }
    });

    // Notify general state change
    this.emit('state:change', this.state, oldState);
  }
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }
  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }
  emit(event, ...args) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          logger.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }
}

// Global singleton
window.LanguageBridgeState = new LanguageBridgeStateManager();
