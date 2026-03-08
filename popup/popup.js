/**
 * LanguageBridge - Popup Script
 * Controls the extension popup UI
 */

document.addEventListener('DOMContentLoaded', async () => {
    // Load current settings
    const settings = await chrome.storage.sync.get([
      'toolbarEnabled',
      'floatingTranslatorEnabled'
    ]);
  
    const stats = await chrome.storage.local.get(['usageStats']);
    const usageStats = stats.usageStats || { translations: 0, speechRecognitions: 0 };
  
    // Initialize toggle switches
    const toolbarSwitch = document.getElementById('toolbar-switch');
    const translatorSwitch = document.getElementById('translator-switch');
  
    if (settings.toolbarEnabled) {
      toolbarSwitch.classList.add('active');
    }
  
    if (settings.floatingTranslatorEnabled) {
      translatorSwitch.classList.add('active');
    }
  
    // Display usage stats
    document.getElementById('translations-count').textContent = usageStats.translations;
    document.getElementById('speech-count').textContent = usageStats.speechRecognitions;
  
    // Toolbar toggle
    document.getElementById('toolbar-toggle').addEventListener('click', async () => {
      const isActive = toolbarSwitch.classList.contains('active');
      toolbarSwitch.classList.toggle('active');
  
      await chrome.storage.sync.set({ toolbarEnabled: !isActive });
  
      // Send message to active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        chrome.tabs.sendMessage(tab.id, { action: 'toggle-toolbar' }).catch(() => {
          // Revert UI — content script not loaded on this tab
          toolbarSwitch.classList.toggle('active');
        });
      }
    });

    // Floating translator toggle
    document.getElementById('translator-toggle').addEventListener('click', async () => {
      const isActive = translatorSwitch.classList.contains('active');
      translatorSwitch.classList.toggle('active');

      await chrome.storage.sync.set({ floatingTranslatorEnabled: !isActive });

      // Send message to active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        chrome.tabs.sendMessage(tab.id, { action: 'toggle-floating-translator' }).catch(() => {
          // Revert UI — content script not loaded on this tab
          translatorSwitch.classList.toggle('active');
        });
      }
    });

    // Help button - sends message to show tutorial
    document.getElementById('help-btn').addEventListener('click', async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        chrome.tabs.sendMessage(tab.id, { action: 'show-tutorial' }).catch(() => {});
        window.close();
      }
    });

    // Privacy link - opens privacy policy
    document.getElementById('privacy-link').addEventListener('click', (e) => {
      e.preventDefault();
      chrome.tabs.create({
        url: chrome.runtime.getURL('privacy-policy.html')
      });
      window.close();
    });

    // Support link - opens support email
    document.getElementById('support-link').addEventListener('click', (e) => {
      e.preventDefault();
      chrome.tabs.create({
        url: 'mailto:support@languagebridge.app'
      });
      window.close();
    });
  });