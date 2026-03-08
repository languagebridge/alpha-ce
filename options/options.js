/**
 * LanguageBridge - Options Page Script
 * Handles settings UI and storage
 */

// Default settings
// Note: Cannot import config.js here since options.js is not loaded as a module in options.html
// COPPA Compliance: Analytics must be OPT-IN (false by default)

const DEFAULT_SETTINGS = {
  defaultLanguage: 'fa', // Persian as default
  speechRate: 1.0,
  verbosity: 'balanced',
  toolbarEnabled: true,
  floatingTranslatorEnabled: true
};

// Load settings when page loads
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  attachEventListeners();
});

/**
 * Load settings from storage and populate form
 */
async function loadSettings() {
  try {
    const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);

    // Language settings
    let language = settings.defaultLanguage || 'fa';
    document.getElementById('defaultLanguage').value = language;

    // Reading preferences
    document.getElementById('speechRate').value = settings.speechRate || 1.0;
    document.getElementById('speedValue').textContent = `${settings.speechRate || 1.0}x`;

    // Verbosity radio buttons
    const verbosityRadio = document.querySelector(`input[name="verbosity"][value="${settings.verbosity || 'balanced'}"]`);
    if (verbosityRadio) {
      verbosityRadio.checked = true;
    }

    // Checkboxes
    document.getElementById('toolbarEnabled').checked = settings.toolbarEnabled !== false;
    document.getElementById('floatingTranslatorEnabled').checked = settings.floatingTranslatorEnabled !== false;

  } catch (error) {
    logger.error('Error loading settings:', error);
    showStatus('Error loading settings', 'error');
  }
}

/**
 * Attach event listeners to form elements
 */
function attachEventListeners() {
  // Speed slider - update display value
  const speedSlider = document.getElementById('speechRate');
  const speedValue = document.getElementById('speedValue');
  speedSlider.addEventListener('input', (e) => {
    speedValue.textContent = `${parseFloat(e.target.value).toFixed(1)}x`;
  });

  // Save button
  document.getElementById('saveBtn').addEventListener('click', saveSettings);

  // Close button
  document.getElementById('closeBtn').addEventListener('click', () => {
    // Give a brief moment for settings to propagate to tabs
    logger.log('✓ Settings window closing - changes broadcast to all tabs');
    setTimeout(() => {
      window.close();
    }, 200);
  });

  // Reset button
  document.getElementById('resetBtn').addEventListener('click', resetSettings);

  // Clear button
  document.getElementById('clearBtn').addEventListener('click', clearAllData);

  // Auto-save on change (optional)
  let animationTimeout = null;

  const autoSaveElements = [
    'defaultLanguage',
    'speechRate',
    'toolbarEnabled',
    'floatingTranslatorEnabled'
  ];

  autoSaveElements.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('change', () => {
        // Show save reminder
        const saveBtn = document.getElementById('saveBtn');
        saveBtn.style.animation = 'pulse 0.5s';
        clearTimeout(animationTimeout);
        animationTimeout = setTimeout(() => {
          saveBtn.style.animation = '';
        }, 500);
      });
    }
  });

  // Verbosity radio buttons
  document.querySelectorAll('input[name="verbosity"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const saveBtn = document.getElementById('saveBtn');
      saveBtn.style.animation = 'pulse 0.5s';
      clearTimeout(animationTimeout);
      animationTimeout = setTimeout(() => {
        saveBtn.style.animation = '';
      }, 500);
    });
  });
}

/**
 * Save settings to storage
 */
async function saveSettings() {
  try {
    const settings = {
      defaultLanguage: document.getElementById('defaultLanguage').value,
      speechRate: parseFloat(document.getElementById('speechRate').value),
      verbosity: document.querySelector('input[name="verbosity"]:checked').value,
      toolbarEnabled: document.getElementById('toolbarEnabled').checked,
      floatingTranslatorEnabled: document.getElementById('floatingTranslatorEnabled').checked
    };

    await chrome.storage.sync.set(settings);

    showStatus('Settings saved successfully!', 'success');

    // Notify content scripts of settings change
    const tabs = await chrome.tabs.query({ url: ['http://*/*', 'https://*/*'] });
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        action: 'settings-updated',
        settings: {
          userLanguage: settings.defaultLanguage,
          readingSpeed: settings.speechRate,
          verbosity: settings.verbosity
        }
      }).catch(() => {
        // Ignore errors for tabs that don't have the content script
      });
    });

  } catch (error) {
    logger.error('Error saving settings:', error);
    showStatus('Error saving settings. Please try again.', 'error');
  }
}

/**
 * Reset settings to defaults
 */
async function resetSettings() {
  if (!confirm('Are you sure you want to reset all settings to defaults?')) {
    return;
  }

  try {
    await chrome.storage.sync.set(DEFAULT_SETTINGS);
    await loadSettings();
    showStatus('Settings reset to defaults', 'success');
  } catch (error) {
    logger.error('Error resetting settings:', error);
    showStatus('Error resetting settings', 'error');
  }
}

/**
 * Clear all data including settings and usage stats
 */
async function clearAllData() {
  if (!confirm('Are you sure you want to clear ALL data? This cannot be undone.')) {
    return;
  }

  try {
    await chrome.storage.sync.clear();
    await chrome.storage.local.clear();
    await loadSettings();
    showStatus('All data cleared', 'success');
  } catch (error) {
    logger.error('Error clearing data:', error);
    showStatus('Error clearing data', 'error');
  }
}

/**
 * Show status message
 * @param {string} message - Message to display
 * @param {string} type - 'success' or 'error'
 */
function showStatus(message, type) {
  const statusElement = document.getElementById('statusMessage');
  statusElement.textContent = message;
  statusElement.className = `status-message ${type}`;
  statusElement.style.display = 'block';

  // Hide after 3 seconds
  setTimeout(() => {
    statusElement.style.display = 'none';
  }, 3000);
}


// Add pulse animation
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
  }
`;
document.head.appendChild(style);
