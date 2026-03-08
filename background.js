// LanguageBridge Background Service Worker
// Handles keyboard shortcuts and extension commands
import { logger } from './utils/logger.js';

logger.log('LanguageBridge background service worker loaded');

// Listen for keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  logger.log('Command received:', command);

  // Get the active tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]?.id) {
      logger.error('No active tab found');
      return;
    }

    const tabId = tabs[0].id;

    // Send message to content script based on command
    if (command === 'toggle-toolbar') {
      chrome.tabs.sendMessage(tabId, {
        action: 'toggle-toolbar'
      }, (response) => {
        if (chrome.runtime.lastError) {
          logger.error('Error toggling toolbar:', chrome.runtime.lastError);
        } else {
          logger.log('Toolbar toggled:', response);
        }
      });
    }
    else if (command === 'toggle-floating-translator') {
      chrome.tabs.sendMessage(tabId, {
        action: 'toggle-floating-translator'
      }, (response) => {
        if (chrome.runtime.lastError) {
          logger.error('Error toggling floating translator:', chrome.runtime.lastError);
        } else {
          logger.log('Floating translator toggled:', response);
        }
      });
    }
  });
});

// Handle extension installation
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    logger.log('LanguageBridge installed successfully!');

    // Set default settings (only if not already set)
    const existing = await chrome.storage.sync.get([
      'azureSpeechKey',
      'azureTranslatorKey',
      'azureRegion',
      'defaultLanguage',
      'verbosity',
      'speechRate',
      'toolbarEnabled',
      'floatingTranslatorEnabled'
    ]);

    // Set default language to Persian
    let defaultLang = existing.defaultLanguage || 'fa';

    const defaults = {
      azureSpeechKey: existing.azureSpeechKey || '',
      azureTranslatorKey: existing.azureTranslatorKey || '',
      azureRegion: existing.azureRegion || 'westus',
      defaultLanguage: defaultLang, // Persian as default
      autoRead: true,
      verbosity: existing.verbosity || 'balanced',
      speechRate: existing.speechRate || 1.0,
      toolbarEnabled: existing.toolbarEnabled !== undefined ? existing.toolbarEnabled : true,
      floatingTranslatorEnabled: existing.floatingTranslatorEnabled !== undefined ? existing.floatingTranslatorEnabled : true
    };

    await chrome.storage.sync.set(defaults);

    logger.log('Default settings initialized');
  }
  else if (details.reason === 'update') {
    logger.log('LanguageBridge updated to version', chrome.runtime.getManifest().version);

    // Ensure default language is set for existing users
    const { defaultLanguage } = await chrome.storage.sync.get(['defaultLanguage']);
    if (!defaultLanguage) {
      await chrome.storage.sync.set({ defaultLanguage: 'fa' });
    }
  }
});

// Handle messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  logger.log('Background received message:', request);

  // Handle different message types
  if (request.action === 'getSettings') {
    // Retrieve settings from storage
    chrome.storage.sync.get(null, (settings) => {
      sendResponse({ success: true, settings });
    });
    return true; // Required for async response
  }
  else if (request.action === 'saveSettings') {
    // Save settings to storage
    chrome.storage.sync.set(request.settings, () => {
      sendResponse({ success: true });
    });
    return true; // Required for async response
  }
  else if (request.action === 'logError') {
    // Log errors from content scripts
    logger.error('Content script error:', request.error);
    sendResponse({ success: true });
  }

  return false;
});

// Keep service worker alive with periodic ping
const keepAlive = () => {
  chrome.runtime.getPlatformInfo(() => {
    // This just ensures the service worker doesn't sleep
  });
};

// Ping every 20 seconds to prevent service worker from sleeping
setInterval(keepAlive, 20000);
