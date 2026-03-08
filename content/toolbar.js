/**
 * LanguageBridge - Simplified Toolbar
 */
function isExtensionContextValid() {
  try {
    // Lightweight check - if this throws, context is invalid
    chrome.runtime.getURL('');
    return true;
  } catch (e) {
    return false;
  }
}

// escapeHtml available via window.escapeHtml (defined in lb-azure-core.js)

class LanguageBridgeToolbar {
    constructor() {
      this.isActive = false;
      this.isReading = false;
      this.isPaused = false;
      this.currentElement = null;
      this.toolbar = null;
      this.userLanguage = 'fa'; // Default to Persian
      this.readingSpeed = 1.0;
      this.verbosity = 'balanced';
      this.isExpanded = false;
      this.selectedText = '';
      this.currentReadingPromise = null; // Track current reading operation
      this.abortController = null; // For cancelling operations
      this.lastReadTime = 0; // For cooldown tracking
      this.cooldownMs = 500; // Minimum time between selections
      this.lastPasteTime = 0; // Track last paste event to prevent selection conflicts
      this.simplificationTier = 2; // Default to TIER 2 (current simplification level)

      // Cached translation for pause/resume
      this.cachedTranslation = null;
      this.cachedOriginalText = null;

      // Pause/Resume with position tracking
      this.translationSentences = []; // Split translation into sentences
      this.currentSentenceIndex = 0; // Track playback position
      this.isTranslating = false; // Mutex to prevent concurrent translations

      this.init();
    }

    async init() {
      // Load user preferences
      const settings = await chrome.storage.sync.get([
        'toolbarEnabled',
        'defaultLanguage',  // Read from defaultLanguage (set by options page)
        'speechRate',        // Read from speechRate (set by options page)
        'verbosity',
        'simplificationTier' // Load saved tier preference
      ]);

      // Map defaultLanguage to userLanguage for internal use
      if (settings.defaultLanguage) this.userLanguage = settings.defaultLanguage;
      if (settings.speechRate) this.readingSpeed = settings.speechRate;
      if (settings.verbosity) this.verbosity = settings.verbosity;
      if (settings.simplificationTier) this.simplificationTier = settings.simplificationTier;

      if (settings.toolbarEnabled) {
        this.show();
      }

      // Listen for keyboard shortcut and settings updates
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'toggle-toolbar') {
          this.toggle();
          sendResponse({ success: true, isActive: this.isActive });
          return true;
        }

        if (request.action === 'settings-updated' && request.settings) {
          logger.log('⚙️ Settings updated:', request.settings);

          const oldLanguage = this.userLanguage;

          if (request.settings.userLanguage) {
            logger.log(`🌐 Language changing from ${this.userLanguage} to ${request.settings.userLanguage}`);
            this.userLanguage = request.settings.userLanguage;
          }
          if (request.settings.readingSpeed) this.readingSpeed = request.settings.readingSpeed;
          if (request.settings.verbosity) this.verbosity = request.settings.verbosity;

          this.updateLanguageDisplay();
          if (oldLanguage !== this.userLanguage) {
            this.cachedTranslation = null;
            this.cachedOriginalText = null;
            this.hideTranslationTooltip();
            this.showStatus(`Language changed to ${this.getLanguageName()}`, 'success');
            logger.log('✓ Language changed - cached translations cleared');
          } else {
            logger.log('✓ Settings updated');
          }

          sendResponse({ success: true });
          return true;
        }

        if (request.action === 'show-tutorial') {
          // Show the onboarding tutorial
          if (window.LanguageBridgeGuide) {
            window.LanguageBridgeGuide.show(true);
          }
          sendResponse({ success: true });
          return true;
        }

        return false;
      });

      // Listen for text selection
      document.addEventListener('mouseup', this.handleTextSelection.bind(this));
      this.setupGoogleDocsIntegration();
    }

    createToolbar() {
      this.toolbar = document.createElement('div');
      this.toolbar.id = 'lb-toolbar';
      this.toolbar.className = 'lb-toolbar collapsed';

      this.toolbar.innerHTML = `
        <!-- Minimal View (Default) -->
        <div class="lb-toolbar-minimal">
          <img src="${chrome.runtime.getURL('assets/LB%20Logo-2.svg')}" alt="LanguageBridge" class="lb-toolbar-logo">
          <span class="lb-toolbar-minimal-text">LanguageBridge™</span>
          <span class="lb-status-dot" aria-hidden="true"></span>
        </div>

        <!-- Full View (On Text Highlight) -->
        <div class="lb-toolbar-inner">
          <div class="lb-toolbar-brand">
            <img src="${chrome.runtime.getURL('assets/LB%20Logo-2.svg')}" alt="LanguageBridge" class="lb-toolbar-logo">
            <span class="lb-toolbar-title">LanguageBridge™</span>
          </div>

          <div class="lb-toolbar-controls">
            <!-- Text Input for Manual Translation -->
            <div class="lb-control-group" style="flex: 1; max-width: 350px; margin-right: 12px;">
              <input
                type="text"
                id="lb-text-input"
                class="lb-text-input"
                placeholder="Select text → Copy (Ctrl+C) → Paste here (Ctrl+V)"
                title="For PDFs & Google Docs: Highlight text, press Ctrl+C to copy, then Ctrl+V to paste here"
                style="width: 100%; padding: 8px 12px; border: 2px solid rgba(255,255,255,0.3); background: rgba(255,255,255,0.15); color: white; border-radius: 8px; font-size: 14px; outline: none;"
              />
            </div>

            <!-- Reading Controls - Play/Pause and Book -->
            <div class="lb-control-group">
              <button id="lb-play-pause" class="lb-toolbar-btn" title="Play audio translation">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </button>
              <button id="lb-show-translation" class="lb-toolbar-btn" title="Show written translation">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/>
                </svg>
              </button>
            </div>

            <!-- Voice Translator Button -->
            <div class="lb-control-group">
              <button id="lb-talk-teacher" class="lb-toolbar-btn" title="Talk to Teacher" style="width: auto; padding: 6px 16px; gap: 6px; display: flex; align-items: center;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                </svg>
                <span style="font-size: 13px; white-space: nowrap; font-weight: 600;">TALK</span>
              </button>
            </div>

            <!-- Current Language Selector (Clickable Dropdown) -->
            <div class="lb-control-group" style="position: relative;">
              <button id="lb-lang-selector" class="lb-toolbar-btn" title="Change language" style="width: auto; padding: 6px 12px; display: flex; align-items: center; gap: 6px;">
                <span id="lb-lang-display" style="font-size: 13px; font-weight: 500; white-space: nowrap;">فارسی Persian</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 10l5 5 5-5z"/>
                </svg>
              </button>
              <!-- Language Dropdown Menu (Hidden by default) -->
              <div id="lb-lang-dropdown" class="lb-lang-dropdown">
                <div class="lb-lang-option" data-lang="prs">دری Dari</div>
                <div class="lb-lang-option" data-lang="fa">فارسی Persian</div>
                <div class="lb-lang-option" data-lang="ps">پښتو Pashto</div>
                <div class="lb-lang-option" data-lang="ar">العربية Arabic</div>
                <div class="lb-lang-option" data-lang="ur">اردو Urdu</div>
                <div class="lb-lang-option" data-lang="uk">Українська Ukrainian</div>
                <div class="lb-lang-option" data-lang="so">Soomaali Somali</div>
                <div class="lb-lang-option" data-lang="en">English</div>
                <div class="lb-lang-option" data-lang="es">Español Spanish</div>
              </div>
            </div>

            <!-- Status Indicator -->
            <div class="lb-status" id="lb-status" style="margin-left: auto;">
              <span class="lb-status-dot"></span>
              <span class="lb-status-text">Active</span>
            </div>

            <!-- Report Problem Button -->
            <button id="lb-report-problem" class="lb-toolbar-btn" title="Report a problem" style="color: #ef4444;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/>
              </svg>
            </button>

            <!-- Help/Tutorial Button -->
            <button id="lb-help-guide" class="lb-toolbar-btn" title="Open tutorial guide" style="color: #ffc755;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
              </svg>
            </button>

            <!-- Collapse -->
            <button id="lb-collapse" class="lb-toolbar-btn" title="Collapse toolbar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 12H5"/>
              </svg>
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(this.toolbar);

      // Adjust page content
      this.adjustPageLayout();

      this.attachEventListeners();
      this.updateLanguageDisplay();
    }

    attachEventListeners() {
      // Minimal tab click to expand
      const minimalTab = this.toolbar.querySelector('.lb-toolbar-minimal');
      if (minimalTab) {
        minimalTab.addEventListener('click', () => {
          this.expand();
        });
      }

      // Play/Pause button - user clicks to start audio translation
      const playPause = this.toolbar.querySelector('#lb-play-pause');
      if (playPause) {
        playPause.addEventListener('click', () => {
          // Cooldown check - prevent spam clicking
          const now = Date.now();
          const timeSinceLastClick = now - this.lastReadTime;

          // If reading or translating, allow pause
          if (this.isReading || this.isPaused) {
            this.toggleReading();
            return;
          }
          if (timeSinceLastClick < 1000) {
            this.showStatus('Please wait before playing again', 'info');
            logger.log(`⏱️ Cooldown active - ${1000 - timeSinceLastClick}ms remaining`);
            return;
          }

          this.toggleReading();
        });
      }
      const showTranslation = this.toolbar.querySelector('#lb-show-translation');
      if (showTranslation) {
        showTranslation.addEventListener('click', () => {
          this.showWrittenTranslation();
        });
      }

      // Talk with Teacher button - opens floating translator
      const talkBtn = this.toolbar.querySelector('#lb-talk-teacher');
      if (talkBtn) {
        talkBtn.addEventListener('click', () => {
          // Open the floating translator instead of conversation panel
          if (window.FloatingTranslator) {
            window.FloatingTranslator.show();
          } else {
            logger.warn('Floating translator not available');
          }
        });
      }

      // Report Problem button
      const reportBtn = this.toolbar.querySelector('#lb-report-problem');
      if (reportBtn) {
        reportBtn.addEventListener('click', () => {
          this.reportProblem();
        });
      }

      // Help/Tutorial button
      const helpBtn = this.toolbar.querySelector('#lb-help-guide');
      if (helpBtn) {
        helpBtn.addEventListener('click', () => {
          this.openHelpGuide();
        });
      }

      // Collapse button
      const collapseBtn = this.toolbar.querySelector('#lb-collapse');
      if (collapseBtn) {
        collapseBtn.addEventListener('click', () => {
          this.collapse();
        });
      }

      // Language selector dropdown
      const langSelector = this.toolbar.querySelector('#lb-lang-selector');
      const langDropdown = this.toolbar.querySelector('#lb-lang-dropdown');
      if (langSelector && langDropdown) {
        logger.log('✅ Language selector found, attaching click handler');
        langSelector.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          // Toggle dropdown visibility using classList
          const isVisible = langDropdown.classList.contains('lb-lang-dropdown-visible');
          logger.log(`🔽 Language dropdown toggle: ${isVisible ? 'hiding' : 'showing'}`);

          if (isVisible) {
            langDropdown.classList.remove('lb-lang-dropdown-visible');
          } else {
            langDropdown.classList.add('lb-lang-dropdown-visible');
          }
        });

        this.dropdownClickHandler = (e) => {
          if (!e.target.closest('#lb-lang-selector') && !e.target.closest('#lb-lang-dropdown')) {
            langDropdown.classList.remove('lb-lang-dropdown-visible');
          }
        };
        document.addEventListener('click', this.dropdownClickHandler);

        // Language option selection
        const langOptions = this.toolbar.querySelectorAll('.lb-lang-option');
        langOptions.forEach(option => {
          // Hover effect
          option.addEventListener('mouseenter', () => {
            option.style.background = 'rgba(255, 255, 255, 0.2)';
          });
          option.addEventListener('mouseleave', () => {
            option.style.background = 'transparent';
          });

          // Click to change language
          option.addEventListener('click', async (e) => {
            e.stopPropagation();
            const newLang = option.getAttribute('data-lang');
            logger.log(`🌐 Language option clicked: ${newLang}`);

            if (newLang && newLang !== this.userLanguage) {
              this.userLanguage = newLang;
              this.updateLanguageDisplay();

              // Save to storage
              if (isExtensionContextValid()) {
                try {
                  await chrome.storage.sync.set({ defaultLanguage: newLang });
                  logger.log(`💾 Saved language preference: ${newLang}`);
                } catch (error) {
                  logger.warn('⚠️ Could not save language preference:', error);
                }
              }

              // Clear cached translations since language changed
              this.cachedTranslation = null;
              this.cachedOriginalText = null;
              this.hideTranslationTooltip();

              // Show confirmation
              this.showStatus(`Language changed to ${this.getLanguageName()}`, 'success');
              logger.log(`✓ Language changed to ${newLang}`);

              // Close dropdown
              langDropdown.classList.remove('lb-lang-dropdown-visible');
            } else {
              // Just close dropdown if same language
              langDropdown.classList.remove('lb-lang-dropdown-visible');
            }
          });
        });
      }

      // Text input for manual translation
      const textInput = this.toolbar.querySelector('#lb-text-input');
      if (textInput) {
        // Handle Enter key
        textInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            const text = textInput.value.trim();
            if (text) {
              logger.log(`📝 Manual text input: "${text.substring(0, 50)}..."`);
              this.selectedText = text;
              this.showStatus('Text ready - Click ▶ for audio or 📖 to read', 'info');
              // Optionally auto-play
              // this.toggleReading();
            }
          }
        });

        // Handle paste event
        textInput.addEventListener('paste', (e) => {
          // Mark paste time to prevent simultaneous selection handling
          this.lastPasteTime = Date.now();

          setTimeout(() => {
            const text = textInput.value.trim();
            if (text) {
              logger.log(`📋 Text pasted: "${text.substring(0, 50)}..."`);
              this.selectedText = text;
              this.showStatus('Text ready - Click ▶ for audio or 📖 to read', 'info');
            }
          }, 10);
        });

        // Focus styles
        textInput.addEventListener('focus', () => {
          textInput.style.borderColor = 'rgba(255,255,255,0.6)';
          textInput.style.background = 'rgba(255,255,255,0.25)';
        });

        textInput.addEventListener('blur', () => {
          textInput.style.borderColor = 'rgba(255,255,255,0.3)';
          textInput.style.background = 'rgba(255,255,255,0.15)';
        });
      }
    }

    getLanguageName() {
      const names = {
        'ur': 'اردو Urdu',
        'uk': 'Українська Ukrainian',
        'ps': 'پښتو Pashto',
        'fa': 'فارسی Persian',
        'prs': 'دری Dari',
        'ar': 'العربية Arabic',
        'so': 'Soomaali Somali',
        'en': 'English',
        'es': 'Español Spanish',
        'mww': 'Hmong',
        'pt': 'Português Portuguese',
        'fr': 'Français French',
        'zh': '中文 Chinese'
      };
      return names[this.userLanguage] || 'Unknown';
    }

    updateLanguageDisplay() {
      const langDisplay = this.toolbar?.querySelector('#lb-lang-display');
      if (langDisplay) {
        langDisplay.textContent = this.getLanguageName();
      }
    }
    setupGoogleDocsIntegration() {
      this.updatePlaceholderForContext();
      if (window.GoogleDocsAdapter && window.GoogleDocsAdapter.isActive()) {
        logger.log('📄 Integrating with Google Docs');

        // Register callback for Google Docs text selection
        window.GoogleDocsAdapter.onTextSelected((text) => {
          logger.log(`📄 Google Docs text selected: "${text.substring(0, 50)}..."`);
          this.selectedText = text;

          // Expand toolbar
          this.expand();

          // Show status
          this.showStatus('Text selected - Click ▶ for audio or 📖 to read', 'info');
        });

        logger.log('✓ Google Docs integration active');
      }
    }
    updatePlaceholderForContext() {
      if (!this.toolbar) return;

      const textInput = this.toolbar.querySelector('#lb-text-input');
      if (!textInput) return;

      const hostname = window.location.hostname;
      const pathname = window.location.pathname;

      // Google Docs
      if (hostname.includes('docs.google.com')) {
        textInput.placeholder = "📄 Google Docs: Highlight → Ctrl+C → Ctrl+V here";
        textInput.title = "Highlight text in Google Docs, press Ctrl+C (Cmd+C on Mac), then paste here with Ctrl+V";
      }
      // Google Classroom
      else if (hostname.includes('classroom.google.com')) {
        textInput.placeholder = "📚 Classroom: Copy text → Paste here (Ctrl+V)";
        textInput.title = "For PDFs & Docs in Classroom: Highlight text, Ctrl+C to copy, Ctrl+V to paste";
      }
      // PDF detection (common PDF viewer URLs)
      else if (pathname.endsWith('.pdf') || hostname.includes('drive.google.com')) {
        textInput.placeholder = "📑 PDF: Highlight → Copy (Ctrl+C) → Paste here";
        textInput.title = "Highlight text in PDF, press Ctrl+C (Cmd+C on Mac), then paste here with Ctrl+V";
      }
      // Default for other websites
      else {
        textInput.placeholder = "Select text → Copy (Ctrl+C) → Paste here (Ctrl+V)";
        textInput.title = "Highlight text anywhere, press Ctrl+C to copy, then Ctrl+V to paste here";
      }
    }

    handleTextSelection(event) {
      // Ignore clicks on our own UI elements
      if (event.target.closest('.lb-toolbar') ||
          event.target.closest('.lb-translation-tooltip') ||
          event.target.closest('.lb-conversation-panel')) {
        return;
      }
      const timeSincePaste = Date.now() - this.lastPasteTime;
      if (timeSincePaste < 500) {
        logger.log('⏭️ Ignoring text selection - paste event just occurred');
        return;
      }

      // Debounce text selection to prevent rapid-fire
      clearTimeout(this._selectionTimeout);

      this._selectionTimeout = setTimeout(() => {
        const selection = window.getSelection();
        const newSelectedText = selection.toString().trim();

        // Ignore empty selections - don't clear current reading
        if (!newSelectedText || newSelectedText.length === 0) {
          return;
        }
        const MAX_CHARS = window.CONFIG?.textLimits?.maxSelectionLength || 2000;
        const WARNING_THRESHOLD = window.CONFIG?.textLimits?.selectionWarningThreshold || 1500;

        if (newSelectedText.length > MAX_CHARS) {
          this.selectedText = newSelectedText.substring(0, MAX_CHARS);
          this.showStatus(`Selection too large - limited to ${MAX_CHARS} characters (~1 page)`, 'error');
          logger.warn(`⚠️ Selection truncated: ${newSelectedText.length} → ${MAX_CHARS} chars`);
        } else if (newSelectedText.length > WARNING_THRESHOLD) {
          // Warn about large selection (but still allow it)
          this.selectedText = newSelectedText;
          this.showStatus(`Large selection (${newSelectedText.length} chars) - may take longer`, 'info');
        } else {
          this.selectedText = newSelectedText;
        }
        const now = Date.now();
        const timeSinceLastRead = now - this.lastReadTime;

        // If currently reading or translating, prevent new selections
        if (this.isReading || this.isTranslating) {
          this.showStatus('Please wait - audio in progress', 'info');
          logger.log(`⏱️ Selection blocked - audio currently playing`);
          return;
        }
        if (timeSinceLastRead < 1000 && this.lastReadTime > 0) {
          this.showStatus('Please wait before selecting again', 'info');
          logger.log(`⏱️ Cooldown active - ${1000 - timeSinceLastRead}ms remaining`);
          return;
        }

        // Expand toolbar when text is selected
        this.expand();

        // Show status - user can now click play or book button
        this.showStatus('Text selected - Click ▶ for audio or 📖 to read', 'info');

        // DO NOT auto-read - let user choose play or book button
      }, 300); // Wait 300ms after selection stops
    }

    expand() {
      if (!this.toolbar) {
        logger.warn('⚠️ Cannot expand toolbar - toolbar not created. Enable toolbar in settings.');
        return;
      }
      this.toolbar.classList.remove('collapsed');
      this.toolbar.classList.add('expanded');
      this.isExpanded = true;
      this.adjustPageLayout();
    }

    collapse() {
      this.toolbar.classList.remove('expanded');
      this.toolbar.classList.add('collapsed');
      this.isExpanded = false;
      this.adjustPageLayout();
      // Pause instead of stop when collapsing
      if (this.isReading) {
        this.pauseReading();
      }
    }

    async showWrittenTranslation() {
      if (!this.selectedText) {
        this.showStatus('Please select some text first', 'error');
        return;
      }

      logger.log('📖 Showing written translation (no audio)');

      try {
        // Translate the text
        let translatedText = this.selectedText;
        if (this.userLanguage !== 'en') {
          this.showStatus('Translating...', 'info');
          translatedText = await window.AzureClient.translateText(
            this.selectedText,
            'en',
            this.userLanguage
          );
          this.cachedOriginalText = this.selectedText;
          this.cachedTranslation = translatedText;
          this.translationSentences = this.splitIntoSentences(translatedText);
          this.currentSentenceIndex = 0;
        }
        // Use Google Docs adapter selection if available
        let selection = window.GoogleDocsAdapter?.isActive()
          ? window.GoogleDocsAdapter.getSelection()
          : window.getSelection();

        if (selection && selection.rangeCount > 0) {
          this.showTranslationTooltip(translatedText, selection);
          this.showStatus('Translation shown', 'info');
        } else {
          // If no selection range, show tooltip in center of screen
          this.showTranslationTooltipCentered(translatedText);
          this.showStatus('Translation shown', 'info');
        }

      } catch (error) {
        logger.error('Error showing translation:', error);
        this.showStatus('Error translating text', 'error');
      }
    }

    async readText(text, selection = null) {
      if (!text || text.length === 0) return;

      // MUTEX: Prevent concurrent translations
      if (this.isTranslating) {
        logger.log('⚠️ Already translating - ignoring new request');
        this.showStatus('Please wait - translation in progress', 'info');
        return;
      }
      if (this.isReading || this.isPaused) {
        logger.log('📖 New text selected - stopping previous reading');
        await this.stopReading();
        // Wait a moment for cleanup
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      logger.log('📖 Starting new reading');
      this.isTranslating = true; // Lock mutex immediately
      this.isReading = true;
      this.isPaused = false;
      this.lastReadTime = Date.now(); // Track for cooldown
      this.updatePlayPauseButton(true);
      this.abortController = new AbortController();
      const signal = this.abortController.signal;

      try {
        if (signal.aborted) {
          throw new Error('Reading cancelled');
        }
        let translatedText = text;
        if (this.userLanguage !== 'en') {
          translatedText = await window.AzureClient.translateText(text, 'en', this.userLanguage);

          // Cache for pause/resume
          this.cachedOriginalText = text;
          this.cachedTranslation = translatedText;

          // Split into sentences for pause/resume support
          this.translationSentences = this.splitIntoSentences(translatedText);
          this.currentSentenceIndex = 0;
          if (selection) {
            if (window.GoogleDocsAdapter?.isActive()) {
              this.showTranslationTooltipCentered(translatedText);
            } else {
              this.showTranslationTooltip(translatedText, selection);
            }
          }
        } else {
          // English text - split into sentences for pause/resume
          this.translationSentences = this.splitIntoSentences(text);
          this.currentSentenceIndex = 0;
        }
        // DO NOT release here - we need to prevent new translations during audio
        if (signal.aborted) {
          throw new Error('Reading cancelled');
        }

        // Speak sentence by sentence for pause/resume capability
        await this.speakFromCurrentPosition(signal);

      } catch (error) {
        // Ignore errors from intentional stops/pauses
        if (error.message !== 'Reading cancelled' &&
            error.message !== 'Speech stopped' &&
            error.message !== 'Speech paused') {
          logger.error('Error reading text:', error);
          this.showStatus('Error reading text', 'error');
        }
      } finally {
        this.isReading = false;
        this.isTranslating = false; // Release mutex on any exit
        this.abortController = null;
        this.updatePlayPauseButton(false);
      }
    }
    splitIntoSentences(text) {
      const sentences = text.match(/[^.!?؟]+[.!?؟]+/g) || [text];
      return sentences.map(s => s.trim()).filter(s => s.length > 0);
    }

        // speakFromCurrentPosition
    async speakFromCurrentPosition(signal) {
      const remainingSentences = this.translationSentences.slice(this.currentSentenceIndex);

      if (remainingSentences.length === 0) {
        logger.log('✓ No sentences to speak');
        return;
      }

      logger.log(`🔊 Speaking ${remainingSentences.length} sentence(s) starting from index ${this.currentSentenceIndex}`);
      for (let i = 0; i < remainingSentences.length; i++) {
        const globalIndex = this.currentSentenceIndex + i;
        if (signal.aborted || this.isPaused) {
          logger.log(`⏸️ Paused at sentence ${globalIndex}/${this.translationSentences.length}`);
          this.currentSentenceIndex = globalIndex;
          throw new Error('Speech paused');
        }

        const sentence = remainingSentences[i];
        logger.log(`🔊 Speaking sentence ${globalIndex + 1}/${this.translationSentences.length}: "${sentence.substring(0, 50)}..."`);

        // CRITICAL FIX: Update position BEFORE speaking, not after
        this.currentSentenceIndex = globalIndex;

        try {
          // Speak this sentence and WAIT for playback to complete
          // We use the browser API which properly waits for playback
          await this.speakSentenceWithPlaybackWait(sentence, signal);

          logger.log(`✓ Sentence ${globalIndex + 1} playback completed`);

          // Move to next sentence position after completion
          this.currentSentenceIndex = globalIndex + 1;
          await new Promise(resolve => setTimeout(resolve, 400));
          if (signal.aborted || this.isPaused) {
            logger.log(`⏸️ Paused after sentence ${globalIndex + 1}/${this.translationSentences.length}`);
            throw new Error('Speech paused');
          }

        } catch (error) {
          // If speech was stopped/paused, exit gracefully
          if (error.message === 'Speech stopped' || error.message === 'Speech paused') {
            throw error;
          }
          // Otherwise, log and continue to next sentence
          logger.warn(`⚠️ Error speaking sentence ${globalIndex + 1}:`, error);
          this.currentSentenceIndex = globalIndex + 1;
        }
      }

      // Finished all sentences
      logger.log('✓ Finished speaking all sentences');
      this.currentSentenceIndex = 0; // Reset for next time
    }

        // speakSentenceWithPlaybackWait
    async speakSentenceWithPlaybackWait(sentence, signal) {
      return new Promise(async (resolve, reject) => {
        try {
          // Start Azure TTS synthesis and wait for playback to complete
          await window.AzureClient.speakText(sentence, this.userLanguage, {
            rate: this.readingSpeed
          });
          if (signal.aborted) {
            reject(new Error('Speech paused'));
            return;
          }

          resolve();
        } catch (error) {
          reject(error);
        }
      });
    }

    toggleReading() {
      logger.log(`🎵 toggleReading - isReading: ${this.isReading}, isPaused: ${this.isPaused}, hasCached: ${!!this.cachedTranslation}`);

      if (this.isReading) {
        // Currently playing - pause it
        logger.log('🎵 -> Calling pauseReading()');
        this.pauseReading();
      } else if (this.isPaused && this.cachedTranslation) {
        // Currently paused - resume from cache without re-translating
        logger.log('🎵 -> Calling resumeReading()');
        this.resumeReading();
      } else if (this.selectedText) {
        logger.log('🎵 -> Calling readText() with audio');
        const selection = window.getSelection();
        this.readText(this.selectedText, selection);

        // Clear text input after starting playback
        const textInput = this.toolbar?.querySelector('#lb-text-input');
        if (textInput && textInput.value.trim() === this.selectedText) {
          setTimeout(() => {
            textInput.value = '';
          }, 500);
        }
      } else {
        logger.log('🎵 -> No action (no selected text)');
        this.showStatus('Please select some text first', 'error');
      }
    }

    pauseReading() {
      logger.log(`⏸️ pauseReading called - pausing at sentence ${this.currentSentenceIndex}/${this.translationSentences.length}`);
      if (window.AzureClient) {
        window.AzureClient.pauseSpeaking();
      }

      this.isReading = false;
      this.isPaused = true;
      this.isTranslating = false; // Release mutex when paused - allow new translations
      this.updatePlayPauseButton(false);

      const remaining = this.translationSentences.length - this.currentSentenceIndex;
      this.showStatus(`Paused (${remaining} sentence${remaining !== 1 ? 's' : ''} remaining)`, 'info');

      logger.log(`⏸️ Will resume from sentence ${this.currentSentenceIndex}`);
    }

    async resumeReading() {
      if (!this.cachedTranslation || this.translationSentences.length === 0) {
        logger.log('⏯️ Cannot resume - no cached translation');
        return;
      }

      logger.log(`⏯️ Resuming from sentence ${this.currentSentenceIndex}/${this.translationSentences.length}`);
      this.isReading = true;
      this.isPaused = false;
      this.isTranslating = true; // Re-acquire mutex to block new translations
      this.lastReadTime = Date.now();
      this.updatePlayPauseButton(true);
      this.showStatus('Resuming...', 'info');
      this.abortController = new AbortController();
      const signal = this.abortController.signal;

      try {
        // Continue speaking from current position (saves API cost!)
        await this.speakFromCurrentPosition(signal);
        logger.log('✓ Resume completed');
        this.showStatus('Completed', 'info');
      } catch (error) {
        // Ignore pause/stop errors
        if (error.message !== 'Speech paused' && error.message !== 'Speech stopped') {
          logger.error('Error resuming:', error);
          this.showStatus('Error resuming', 'error');
        }
      } finally {
        this.isReading = false;
        this.isTranslating = false; // Release mutex when done
        this.abortController = null;
        this.updatePlayPauseButton(false);
      }
    }

    async stopReading() {
      logger.log('🛑 stopReading called');

      // Hard stop - kill everything immediately

      // Cancel any pending operations FIRST
      if (this.abortController) {
        this.abortController.abort();
        this.abortController = null;
      }

      // Stop Azure TTS immediately
      if (window.AzureClient) {
        window.AzureClient.stopSpeaking();
      }

      // Stop Azure STT if active
      try {
        await window.AzureClient.stopSpeechRecognition();
      } catch (e) {
        // Ignore if not active
      }

      // Clear all state
      this.isReading = false;
      this.isPaused = false;
      this.isTranslating = false; // Release mutex
      this.cachedTranslation = null;
      this.cachedOriginalText = null;
      this.translationSentences = []; // Clear sentence cache
      this.currentSentenceIndex = 0; // Reset position

      // Hide tooltip
      this.hideTranslationTooltip();

      // Reset button to play icon
      this.updatePlayPauseButton(false);
      this.showStatus('Active', 'info');

      logger.log('✓ stopReading complete');
    }

        // startAudioPlayback
    async startAudioPlayback() {
      if (!this.cachedTranslation || !this.translationSentences || this.translationSentences.length === 0) {
        logger.log('⚠️ No cached translation to play');
        return;
      }

      if (this.isReading) {
        logger.log('⚠️ Already playing');
        return;
      }

      logger.log('🎵 Starting audio playback from cache');
      this.isReading = true;
      this.isPaused = false;
      this.currentSentenceIndex = 0;
      this.updatePlayPauseButton(true);
      this.abortController = new AbortController();
      const signal = this.abortController.signal;

      try {
        await this.speakFromCurrentPosition(signal);
      } catch (error) {
        if (error.message !== 'Reading cancelled' &&
            error.message !== 'Speech stopped' &&
            error.message !== 'Speech paused') {
          logger.error('Error during playback:', error);
        }
      } finally {
        this.isReading = false;
        this.abortController = null;
        this.updatePlayPauseButton(false);
      }
    }

    updatePlayPauseButton(isPlaying) {
      const button = this.toolbar.querySelector('#lb-play-pause');
      if (!button) return;

      const svg = isPlaying ?
        '<path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>' : // Pause icon
        '<path d="M8 5v14l11-7z"/>'; // Play icon

      // Create SVG path element safely
      const svgElement = button.querySelector('svg');
      if (svgElement) {
        svgElement.innerHTML = ''; // Clear existing
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', isPlaying ?
          'M6 4h4v16H6V4zm8 0h4v16h-4V4z' :
          'M8 5v14l11-7z'
        );
        path.setAttribute('fill', 'currentColor');
        svgElement.appendChild(path);
      }
    }

    async showTranslationTooltip(translatedText, selection) {
      this.hideTranslationTooltip();
      const rtlLanguages = ['ur', 'prs', 'fa', 'ps', 'ar'];
      const isRTL = rtlLanguages.includes(this.userLanguage);
      const tooltip = document.createElement('div');
      tooltip.className = 'lb-translation-tooltip';
      tooltip.id = 'lb-translation-tooltip';
      tooltip.setAttribute('data-lang', this.userLanguage);
      tooltip.setAttribute('data-current-tab', '0'); // Track current tab

      const textDir = isRTL ? 'rtl' : 'ltr';
      const textAlign = isRTL ? 'right' : 'left';
      // Create tooltip header safely
      const header = document.createElement('div');
      header.className = 'lb-tooltip-header';
      header.style.cssText = 'cursor: move; user-select: none; display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: rgba(0, 0, 0, 0.1); border-radius: 12px 12px 0 0; border-bottom: 2px solid rgba(255, 255, 255, 0.3);';

      const dragHandle = document.createElement('span');
      dragHandle.className = 'lb-tooltip-drag-handle';
      dragHandle.style.cssText = 'font-size: 14px; opacity: 0.6; margin-right: 8px;';
      dragHandle.textContent = '⋮⋮';

      const langLabel = document.createElement('span');
      langLabel.className = 'lb-tooltip-language';
      langLabel.style.cssText = 'flex: 1; font-weight: 600;';
      langLabel.textContent = `${this.getLanguageName()} Translation`;

      const closeBtn = document.createElement('button');
      closeBtn.className = 'lb-tooltip-close';
      closeBtn.textContent = '×';

      header.appendChild(dragHandle);
      header.appendChild(langLabel);
      header.appendChild(closeBtn);

      // Create tooltip body with tabs
      const body = document.createElement('div');
      body.className = 'lb-tooltip-body';

      // Tab 1: Translation
      const tab1 = document.createElement('div');
      tab1.className = 'lb-tooltip-tab-content active';
      tab1.setAttribute('data-tab', '0');

      const translationText = document.createElement('div');
      translationText.className = 'lb-tooltip-text';
      translationText.setAttribute('dir', textDir);
      translationText.style.textAlign = textAlign;
      translationText.textContent = translatedText;
      tab1.appendChild(translationText);

      // Flag button for main translation
      const flagRow = document.createElement('div');
      flagRow.className = 'lb-flag-row';
      flagRow.style.cssText = 'margin-top: 10px; text-align: right;';

      const flagBtn = document.createElement('button');
      flagBtn.className = 'lb-flag-btn';
      flagBtn.title = 'Flag this translation as confusing or incorrect';
      flagBtn.style.cssText = 'background: none; border: none; cursor: pointer; font-size: 14px; opacity: 0.55; padding: 2px 4px; border-radius: 4px; transition: opacity 0.15s;';
      flagBtn.textContent = '🚩 Flag';
      flagBtn.addEventListener('mouseenter', () => { flagBtn.style.opacity = '1'; });
      flagBtn.addEventListener('mouseleave', () => { if (!flagBtn.dataset.flagged) flagBtn.style.opacity = '0.55'; });
      flagBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (flagBtn.dataset.flagged) return; // Already flagged this session
        flagBtn.dataset.flagged = '1';
        flagBtn.textContent = '⏳';
        flagBtn.disabled = true;
        const result = await this.sendFlag(
          this.cachedOriginalText || this.selectedText,
          this.userLanguage,
          this.simplificationTier,
          'translation'
        );
        flagBtn.textContent = result.flagCount >= 3 ? '🚩 Flagged ✓' : '🚩 Flagged';
        flagBtn.style.opacity = '0.8';
        logger.log(`🚩 Translation flagged (count=${result.flagCount}, status=${result.status})`);
      });

      flagRow.appendChild(flagBtn);
      tab1.appendChild(flagRow);

      // Tab 2: Glossary (loading state) with tier picker
      const tab2 = document.createElement('div');
      tab2.className = 'lb-tooltip-tab-content';
      tab2.setAttribute('data-tab', '1');

      const loading2 = document.createElement('div');
      loading2.className = 'lb-tooltip-loading';
      const spinner2 = document.createElement('div');
      spinner2.className = 'lb-tooltip-spinner';
      const loadText2 = document.createElement('span');
      loadText2.textContent = 'Loading glossary...';
      loading2.appendChild(spinner2);
      loading2.appendChild(loadText2);
      tab2.appendChild(loading2);

      body.appendChild(tab1);
      body.appendChild(tab2);

      // Create tab navigation
      const pagination = document.createElement('div');
      pagination.className = 'lb-tooltip-pagination';

      const tabs = [
        { icon: '🌍', label: 'Translation', index: 0, active: true },
        { icon: '📚', label: 'Glossary', index: 1, active: false }
      ];

      tabs.forEach(tab => {
        const dot = document.createElement('div');
        dot.className = tab.active ? 'lb-pagination-dot active' : 'lb-pagination-dot';
        dot.setAttribute('data-tab', tab.index.toString());

        const icon = document.createElement('span');
        icon.className = 'lb-tab-icon';
        icon.textContent = tab.icon;

        const label = document.createElement('span');
        label.className = 'lb-tab-label';
        label.textContent = tab.label;

        dot.appendChild(icon);
        dot.appendChild(label);
        pagination.appendChild(dot);
      });

      tooltip.appendChild(header);
      tooltip.appendChild(body);
      tooltip.appendChild(pagination);

      // Position tooltip near selection (above the selected text)
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // Calculate position (prevent going off-screen)
      let left = rect.left + window.scrollX;
      // Position ABOVE the selection instead of below
      // Estimate tooltip height (~400px) and position above with 10px gap
      let top = rect.top + window.scrollY - 410;

      // If tooltip would go off top of screen, show it below selection instead
      if (top < 10) {
        top = rect.bottom + window.scrollY + 10;
      }

      // Adjust if too close to right edge
      if (left + 500 > window.innerWidth) {
        left = window.innerWidth - 520;
      }

      tooltip.style.left = `${Math.max(10, left)}px`;
      tooltip.style.top = `${top}px`;

      document.body.appendChild(tooltip);

      // Make tooltip draggable
      this.makeTooltipDraggable(tooltip);

      // Close button handler (using closeBtn variable created earlier)
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        this.hideTranslationTooltip();
      });

      // Setup pagination dot handlers
      this.setupTabNavigation(tooltip);

      // Load remaining tiers asynchronously
      this.loadScaffoldingTiers(tooltip, this.selectedText).catch(error => {
        logger.error('Error loading scaffolding tiers:', error);
      });

      // Tooltip persists until X is clicked (no auto-hide)
    }

    hideTranslationTooltip() {
      const tooltip = document.getElementById('lb-translation-tooltip');
      if (tooltip) {
        // Stop any playing audio to prevent background playback
        this.stopCurrentAudio();

        // Clean up event listener to prevent memory leaks
        if (this._glossaryClickHandler) {
          const glossaryTab = tooltip.querySelector('[data-tab="2"]');
          if (glossaryTab) {
            glossaryTab.removeEventListener('click', this._glossaryClickHandler);
          }
          this._glossaryClickHandler = null;
        }

        tooltip.remove();
      }
    }
    setupTabNavigation(tooltip) {
      const dots = tooltip.querySelectorAll('.lb-pagination-dot');
      const tabs = tooltip.querySelectorAll('.lb-tooltip-tab-content');
      const headerLabel = tooltip.querySelector('.lb-tooltip-language');

      const tabLabels = [
        `${this.getLanguageName()} Translation`,
        'Academic Glossary'
      ];

      dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
          dots.forEach(d => d.classList.remove('active'));
          tabs.forEach(t => t.classList.remove('active'));

          dot.classList.add('active');
          tabs[index].classList.add('active');
          headerLabel.textContent = tabLabels[index];

          // Track current tab
          tooltip.setAttribute('data-current-tab', index.toString());

          // Track analytics
          this.trackTabSwitch(index);
        });
      });
    }
    async loadScaffoldingTiers(tooltip, originalText) {
      if (!originalText || !tooltip) return;

      try {
        logger.log('📚 Loading scaffolding tiers...');

        // Fetch all tiers in parallel
        const result = await window.AzureClient.fetchAllScaffoldingTiers(
          originalText,
          this.userLanguage,
          this.simplificationTier ?? 2
        );
        // Glossary tab (now tab2, previously tab3)
        const glossaryTab = tooltip.querySelector('[data-tab="1"]');
        if (glossaryTab) {
          // Store all three tier glossaries for tier switching
          glossaryTab.setAttribute('data-glossary-tier1', JSON.stringify(result.glossaryTier1));
          glossaryTab.setAttribute('data-glossary-tier2', JSON.stringify(result.glossaryTier2));
          glossaryTab.setAttribute('data-glossary-tier3', JSON.stringify(result.glossaryTier3));
          glossaryTab.setAttribute('data-original-text', originalText);

          const savedTier = this.simplificationTier || 2;

          // Clear loading state
          glossaryTab.textContent = '';

          // Create tier selector at the top of glossary
          const tierSelector = document.createElement('div');
          tierSelector.className = 'lb-tier-selector';
          tierSelector.style.cssText = 'display: flex; gap: 8px; margin-bottom: 12px; padding: 8px; background: rgba(0,0,0,0.2); border-radius: 8px;';

          const tiers = [
            { number: 1, stars: '⭐', label: 'Elementary', desc: 'Basic academic words' },
            { number: 2, stars: '⭐⭐', label: 'Intermediate', desc: 'Academic vocabulary' },
            { number: 3, stars: '⭐⭐⭐', label: 'Advanced', desc: 'All vocabulary' }
          ];

          tiers.forEach(tier => {
            const btn = document.createElement('button');
            btn.className = `lb-tier-btn${savedTier === tier.number ? ' active' : ''}`;
            btn.setAttribute('data-tier', tier.number.toString());
            btn.style.cssText = `flex: 1; padding: 8px 12px; border: 2px solid rgba(255,255,255,0.3); background: ${savedTier === tier.number ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'}; color: white; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600; transition: all 0.2s;`;

            const tierText = document.createTextNode(`${tier.stars}`);
            btn.appendChild(tierText);
            btn.appendChild(document.createElement('br'));

            const labelSpan = document.createElement('span');
            labelSpan.style.cssText = 'font-size: 10px; opacity: 0.8;';
            labelSpan.textContent = tier.label;
            btn.appendChild(labelSpan);

            tierSelector.appendChild(btn);
          });

          // Create glossary container
          const glossaryContainer = document.createElement('div');
          glossaryContainer.className = 'lb-glossary-container';
          glossaryContainer.id = 'lb-glossary-content';

          glossaryTab.appendChild(tierSelector);
          glossaryTab.appendChild(glossaryContainer);

          // Select the correct glossary based on tier
          let glossaryToRender = result.glossary;
          if (savedTier === 1) {
            glossaryToRender = result.glossaryTier1;
          } else if (savedTier === 2) {
            glossaryToRender = result.glossaryTier2;
          } else if (savedTier === 3) {
            glossaryToRender = result.glossaryTier3;
          }

          // Render glossary for initial tier
          this.renderGlossary(glossaryContainer, glossaryToRender, savedTier);

          // Add tier button click handlers
          const tierButtons = glossaryTab.querySelectorAll('.lb-tier-btn');
          tierButtons.forEach(btn => {
            btn.addEventListener('mouseenter', () => {
              if (!btn.classList.contains('active')) {
                btn.style.background = 'rgba(255,255,255,0.2)';
              }
            });
            btn.addEventListener('mouseleave', () => {
              if (!btn.classList.contains('active')) {
                btn.style.background = 'rgba(255,255,255,0.1)';
              }
            });

            btn.addEventListener('click', async () => {
              try {
                const tier = parseInt(btn.getAttribute('data-tier'));
                await this.switchGlossaryTier(glossaryTab, glossaryContainer, tier);
              } catch (error) {
                logger.error('Error switching glossary tier:', error);
                this.showStatus?.('Error changing tier', 'error');
              }
            });
          });
        }

        logger.log('✅ Scaffolding tiers loaded successfully');

      } catch (error) {
        logger.error('Error loading glossary:', error);

        // Show error state in glossary tab
        const glossaryTab = tooltip.querySelector('[data-tab="1"]');

        if (glossaryTab) {
          glossaryTab.textContent = '';
          const errorDiv = document.createElement('div');
          errorDiv.className = 'lb-glossary-empty';
          errorDiv.textContent = '⚠️ Could not load glossary.';
          glossaryTab.appendChild(errorDiv);
        }
      }
    }
    async trackTabSwitch(tabIndex) {
      if (!isExtensionContextValid()) {
        logger.warn('⚠️ Extension context invalid, skipping tab tracking');
        return;
      }

      try {
        // Track in Chrome local storage
        const stats = await chrome.storage.local.get(['scaffoldingStats']);
        const current = stats.scaffoldingStats || { tab0: 0, tab1: 0, tab2: 0 };

        current[`tab${tabIndex}`] = (current[`tab${tabIndex}`] || 0) + 1;

        await chrome.storage.local.set({ scaffoldingStats: current });
        logger.log(`📊 Tab ${tabIndex} views:`, current[`tab${tabIndex}`]);

      } catch (error) {
        logger.error('Error tracking tab switch:', error);
      }
    }

        // switchSimplificationTier
    async switchSimplificationTier(tab2Element, tier) {
      if (!tab2Element) {
        logger.warn('⚠️ Cannot switch tier - tab2Element is null');
        return;
      }
      const validTiers = [1, 2, 3];
      if (!validTiers.includes(tier)) {
        logger.error(`⚠️ Invalid tier parameter: ${tier}, defaulting to TIER 2`);
        tier = 2; // Safe fallback
      }

      logger.log(`🔄 Switching to TIER ${tier} (using cached data)...`);
      const tooltip = document.getElementById('lb-translation-tooltip');
      let glossaryTier1 = null;
      let glossaryTier2 = [];
      let glossaryTier3 = [];

      try {
        glossaryTier1 = JSON.parse(tab2Element.getAttribute('data-glossary-tier1') || 'null');
        glossaryTier2 = JSON.parse(tab2Element.getAttribute('data-glossary-tier2') || '[]');
        glossaryTier3 = JSON.parse(tab2Element.getAttribute('data-glossary-tier3') || '[]');
      } catch (parseError) {
        logger.error('⚠️ Corrupted glossary cache detected, using empty glossaries:', parseError);
        // Fallback to safe defaults
        glossaryTier1 = null;
        glossaryTier2 = [];
        glossaryTier3 = [];
      }
      let glossary = null;
      if (tier === 1) {
        if (glossaryTier1 === 'NOT_LOADED') {
          // Fetch on-demand!
          logger.log('📥 TIER 1 glossary not cached, fetching on-demand...');
          glossary = await this.fetchGlossaryOnDemand(tab2Element, tier);
        } else {
          glossary = glossaryTier1; // TIER 1: Simple vocabulary practice words
        }
      } else if (tier === 2) {
        if (glossaryTier2 === 'NOT_LOADED') {
          // Fetch on-demand!
          logger.log('📥 TIER 2 glossary not cached, fetching on-demand...');
          glossary = await this.fetchGlossaryOnDemand(tab2Element, tier);
        } else {
          glossary = glossaryTier2;
        }
      } else if (tier === 3) {
        if (glossaryTier3 === 'NOT_LOADED') {
          // Fetch on-demand!
          logger.log('📥 TIER 3 glossary not cached, fetching on-demand...');
          glossary = await this.fetchGlossaryOnDemand(tab2Element, tier);
        } else {
          glossary = glossaryTier3;
        }
      }

      // Determine which text to show
      let displayText = tier2Text; // Default
      let label = '📝 Simplified English (Easier to read)';

      if (tier === 3) {
        displayText = tier3Text;
        label = '📚 Original Text (Advanced)';
      } else if (tier === 1) {
        displayText = tier1Text;
        label = '📖 Basic English (Easiest to read)';
      }
      const tierTextElement = tab2Element.querySelector('#lb-tier-text');
      const tierLabelElement = tab2Element.querySelector('#lb-tier-label');
      if (tierTextElement) tierTextElement.textContent = displayText;
      if (tierLabelElement) tierLabelElement.textContent = label;
      const tierButtons = tab2Element.querySelectorAll('.lb-tier-btn');
      tierButtons.forEach(btn => {
        const btnTier = parseInt(btn.getAttribute('data-tier'));
        if (btnTier === tier) {
          btn.classList.add('active');
          btn.style.background = 'rgba(255,255,255,0.3)';
        } else {
          btn.classList.remove('active');
          btn.style.background = 'rgba(255,255,255,0.1)';
        }
      });
      if (tooltip) {
        const glossaryTab = tooltip.querySelector('[data-tab="2"]');
        if (glossaryTab) {
          this.renderGlossary(glossaryTab, glossary, tier);
        }
      }

      // Save preference
      this.simplificationTier = tier;

      if (isExtensionContextValid()) {
        try {
          await chrome.storage.sync.set({ simplificationTier: tier });
        } catch (error) {
          logger.warn('⚠️ Could not save tier preference:', error);
        }
      } else {
        logger.warn('⚠️ Extension context invalid, tier preference not saved');
      }

      logger.log(`✅ Switched to TIER ${tier} instantly (no API calls!)`);
    }

    // switchGlossaryTier
    async switchGlossaryTier(glossaryTab, glossaryContainer, tier) {
      if (!glossaryTab || !glossaryContainer) {
        logger.warn('⚠️ Cannot switch glossary tier - elements missing');
        return;
      }

      const validTiers = [1, 2, 3];
      if (!validTiers.includes(tier)) {
        logger.error(`⚠️ Invalid tier: ${tier}, defaulting to TIER 2`);
        tier = 2;
      }

      logger.log(`🔄 Switching to Glossary TIER ${tier}...`);

      // Get glossary data from cached attributes
      let glossaryTier1, glossaryTier2, glossaryTier3;
      try {
        glossaryTier1 = JSON.parse(glossaryTab.getAttribute('data-glossary-tier1') || 'null');
        glossaryTier2 = JSON.parse(glossaryTab.getAttribute('data-glossary-tier2') || '[]');
        glossaryTier3 = JSON.parse(glossaryTab.getAttribute('data-glossary-tier3') || '[]');
      } catch (parseError) {
        logger.error('⚠️ Corrupted glossary cache:', parseError);
        glossaryTier1 = null;
        glossaryTier2 = [];
        glossaryTier3 = [];
      }

      // Select glossary for tier (fetch on-demand if needed)
      let glossary = null;
      if (tier === 1) {
        glossary = glossaryTier1 === 'NOT_LOADED'
          ? await this.fetchGlossaryOnDemand(glossaryTab, tier)
          : glossaryTier1;
      } else if (tier === 2) {
        glossary = glossaryTier2 === 'NOT_LOADED'
          ? await this.fetchGlossaryOnDemand(glossaryTab, tier)
          : glossaryTier2;
      } else if (tier === 3) {
        glossary = glossaryTier3 === 'NOT_LOADED'
          ? await this.fetchGlossaryOnDemand(glossaryTab, tier)
          : glossaryTier3;
      }

      // Render glossary
      this.renderGlossary(glossaryContainer, glossary, tier);

      // Update tier button states
      const tierButtons = glossaryTab.querySelectorAll('.lb-tier-btn');
      tierButtons.forEach(btn => {
        const btnTier = parseInt(btn.getAttribute('data-tier'));
        if (btnTier === tier) {
          btn.classList.add('active');
          btn.style.background = 'rgba(255,255,255,0.3)';
        } else {
          btn.classList.remove('active');
          btn.style.background = 'rgba(255,255,255,0.1)';
        }
      });

      // Save preference
      this.simplificationTier = tier;
      if (isExtensionContextValid()) {
        try {
          await chrome.storage.sync.set({ simplificationTier: tier });
        } catch (error) {
          logger.warn('⚠️ Could not save tier preference:', error);
        }
      }

      logger.log(`✅ Switched to Glossary TIER ${tier}`);
    }

        // fetchGlossaryOnDemand
    async fetchGlossaryOnDemand(glossaryTabElement, tier) {
      try {
        // Show loading state in glossaryContainer (not glossaryTab)
        const glossaryTab = glossaryTabElement;
        const glossaryContainer = glossaryTab?.querySelector('#lb-glossary-content');

        if (glossaryContainer) {
          glossaryContainer.textContent = '';
          const emptyDiv = document.createElement('div');
          emptyDiv.className = 'lb-glossary-empty';
          emptyDiv.style.cssText = 'padding: 20px; text-align: center;';

          const loadingText = document.createTextNode(`⏳ Loading TIER ${tier} glossary`);
          emptyDiv.appendChild(loadingText);
          emptyDiv.appendChild(document.createElement('br'));

          const hintSpan = document.createElement('span');
          hintSpan.style.cssText = 'font-size: 12px; opacity: 0.7;';
          hintSpan.textContent = 'Building vocabulary list (1-3 seconds)...';
          emptyDiv.appendChild(hintSpan);

          glossaryContainer.appendChild(emptyDiv);
        }
        const originalText = glossaryTab.getAttribute('data-original-text');

        // Fetch glossary from Azure Client — all tiers use original text
        const glossary = await window.AzureClient.buildGlossaryForTier(
          originalText,
          originalText,
          this.userLanguage,
          tier
        );

        // Cache it for future instant switching!
        const cacheKey = `data-glossary-tier${tier}`;
        glossaryTab.setAttribute(cacheKey, JSON.stringify(glossary));

        logger.log(`✅ TIER ${tier} glossary fetched on-demand and cached (${glossary?.length || 0} terms)`);

        return glossary;
      } catch (error) {
        logger.error(`Error fetching TIER ${tier} glossary on-demand:`, error);
        return []; // Empty glossary on error
      }
    }

        // renderGlossary
    renderGlossary(glossaryTab, glossary, tier) {
      if (!glossaryTab) {
        logger.warn('⚠️ Cannot render glossary - glossaryTab is null');
        return;
      }

      // Handle NOT_LOADED string or invalid glossary
      if (!glossary || typeof glossary === 'string' || !Array.isArray(glossary)) {
        glossaryTab.textContent = '';
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'lb-glossary-empty';
        emptyDiv.style.cssText = 'padding: 20px; text-align: center; color: rgba(255,255,255,0.8);';

        emptyDiv.appendChild(document.createTextNode('📖 No glossary available for this tier.'));
        emptyDiv.appendChild(document.createElement('br'));

        const hint = document.createElement('span');
        hint.style.cssText = 'font-size: 12px; opacity: 0.7;';
        hint.textContent = 'Try switching to a different tier.';
        emptyDiv.appendChild(hint);

        glossaryTab.appendChild(emptyDiv);
        return;
      }

      // TIER 2/3: Show glossary if available
      if (glossary.length === 0) {
        glossaryTab.textContent = '';
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'lb-glossary-empty';
        emptyDiv.textContent = '📚 No key vocabulary found in this text.';
        glossaryTab.appendChild(emptyDiv);
        return;
      }
      const MAX_GLOSSARY_TERMS = window.CONFIG?.textLimits?.maxGlossaryTerms || 50;
      const limitedGlossary = glossary.slice(0, MAX_GLOSSARY_TERMS);
      const wasLimited = glossary.length > MAX_GLOSSARY_TERMS;

      if (wasLimited) {
        logger.warn(`⚠️ Glossary limited: ${glossary.length} → ${MAX_GLOSSARY_TERMS} terms`);
      }
      const isEnglishMode = this.userLanguage === 'en';

      // Create glossary container using safe DOM methods
      glossaryTab.textContent = '';
      const glossaryContainer = document.createElement('div');
      glossaryContainer.className = 'lb-tooltip-glossary';

      const vocabGroup = document.createElement('div');
      vocabGroup.className = 'lb-vocab-group';

      // Add warning if limited
      if (wasLimited) {
        const warning = document.createElement('div');
        warning.style.cssText = 'padding: 8px 12px; background: rgba(255, 165, 0, 0.2); border-radius: 6px; margin-bottom: 12px; font-size: 12px;';
        warning.textContent = `⚠️ Showing top ${MAX_GLOSSARY_TERMS} of ${glossary.length} terms`;
        vocabGroup.appendChild(warning);
      }

      // Create words container
      const vocabWords = document.createElement('div');
      vocabWords.className = 'lb-vocab-words';

      // Build each vocab item
      limitedGlossary.forEach((word, index) => {
        const tierNum = [1, 2, 3].includes(word.tier) ? word.tier : 2;
        const tierStars = '⭐'.repeat(tierNum);
        const tierLabel = tierNum === 3 ? 'Advanced Academic' :
                         tierNum === 2 ? 'Academic' :
                         'Basic Academic';
        const tierClass = `lb-tier-${tierNum}`;
        const tierDisplayText = `TIER ${tierNum}`;

        // SECURITY: Sanitize subject to prevent CSS class injection
        const rawSubject = word.subject || 'General';
        const subject = typeof rawSubject === 'string' ? rawSubject : 'General';
        const sanitizedSubject = subject.replace(/[^a-zA-Z0-9\s\-]/g, '');
        const subjectClass = `lb-subject-${sanitizedSubject.toLowerCase().replace(/\s+/g, '-')}`;

        const vocabItem = document.createElement('div');
        vocabItem.className = `lb-vocab-item ${tierClass} ${subjectClass}`;
        vocabItem.setAttribute('data-word-index', index.toString());
        vocabItem.setAttribute('data-tier', tierNum.toString());

        // Meta (tier badge)
        const meta = document.createElement('div');
        meta.className = 'lb-vocab-meta';

        const badge = document.createElement('span');
        badge.className = 'lb-tier-badge';
        badge.title = tierLabel;
        badge.textContent = tierStars;

        const label = document.createElement('span');
        label.className = 'lb-tier-label';
        label.style.cssText = 'font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.7); text-transform: uppercase; letter-spacing: 0.5px;';
        label.textContent = tierDisplayText;

        meta.appendChild(badge);
        meta.appendChild(label);
        vocabItem.appendChild(meta);

        // Definition header (if exists)
        if (word.definition) {
          const defHeader = document.createElement('div');
          defHeader.className = 'lb-vocab-definition-header';

          const defText = document.createElement('span');
          defText.className = 'lb-vocab-definition-text';
          defText.textContent = word.definition;

          const defAudio = document.createElement('button');
          defAudio.className = 'lb-vocab-audio lb-vocab-definition-audio';
          defAudio.setAttribute('data-lang', this.userLanguage);
          defAudio.setAttribute('data-text', word.definition);
          defAudio.title = `Listen to definition in ${this.getLanguageName()}`;
          defAudio.textContent = '🔊';

          defHeader.appendChild(defText);
          defHeader.appendChild(defAudio);
          vocabItem.appendChild(defHeader);
        }

        // Vocab pair (English term and translation)
        const pair = document.createElement('div');
        pair.className = 'lb-vocab-pair';

        // English side
        const englishDiv = document.createElement('div');
        englishDiv.className = 'lb-vocab-english';

        const termSpan = document.createElement('span');
        termSpan.className = 'lb-vocab-word';
        termSpan.textContent = word.term;

        const normalBtn = document.createElement('button');
        normalBtn.className = 'lb-vocab-audio';
        normalBtn.setAttribute('data-lang', 'en');
        normalBtn.setAttribute('data-text', word.term);
        normalBtn.setAttribute('data-rate', '1.0');
        normalBtn.title = 'Normal speed';
        normalBtn.textContent = '🔊';

        const slowBtn = document.createElement('button');
        slowBtn.className = 'lb-vocab-audio lb-vocab-slow';
        slowBtn.setAttribute('data-lang', 'en');
        slowBtn.setAttribute('data-text', word.term);
        slowBtn.setAttribute('data-rate', '0.6');
        slowBtn.title = 'Slow pronunciation';
        slowBtn.textContent = '🐢';

        englishDiv.appendChild(termSpan);
        englishDiv.appendChild(normalBtn);
        englishDiv.appendChild(slowBtn);

        // Arrow
        const arrow = document.createElement('div');
        arrow.className = 'lb-vocab-arrow';
        arrow.textContent = '→';

        // Translation side
        const transDiv = document.createElement('div');
        transDiv.className = isEnglishMode ? 'lb-vocab-simple' : 'lb-vocab-translated';

        const transSpan = document.createElement('span');
        transSpan.className = 'lb-vocab-word';
        transSpan.textContent = word.translation;

        const transBtn = document.createElement('button');
        transBtn.className = 'lb-vocab-audio';
        transBtn.setAttribute('data-lang', isEnglishMode ? 'en' : this.userLanguage);
        transBtn.setAttribute('data-text', word.translation);
        if (isEnglishMode) {
          transBtn.setAttribute('data-rate', '1.0');
          transBtn.title = 'Speak definition';
        } else {
          transBtn.title = 'Speak translation';
        }
        transBtn.textContent = '🔊';

        transDiv.appendChild(transSpan);
        transDiv.appendChild(transBtn);

        pair.appendChild(englishDiv);
        pair.appendChild(arrow);
        pair.appendChild(transDiv);

        // Flag button for this glossary word
        const wordFlagBtn = document.createElement('button');
        wordFlagBtn.className = 'lb-vocab-flag';
        wordFlagBtn.title = 'Flag this translation as confusing or incorrect';
        wordFlagBtn.setAttribute('data-text', word.term);
        wordFlagBtn.setAttribute('data-lang', isEnglishMode ? 'en' : this.userLanguage);
        wordFlagBtn.setAttribute('data-tier', tierNum.toString());
        wordFlagBtn.style.cssText = 'background: none; border: none; cursor: pointer; font-size: 13px; opacity: 0.45; padding: 2px 4px; margin-left: 4px; border-radius: 4px; transition: opacity 0.15s; flex-shrink: 0;';
        wordFlagBtn.textContent = '🚩';
        pair.appendChild(wordFlagBtn);

        vocabItem.appendChild(pair);

        // Context sentence (Tier 3 only)
        if (tier === 3 && word.contextSentence) {
          const context = document.createElement('div');
          context.className = 'lb-vocab-context';

          const contextLabel = document.createElement('span');
          contextLabel.className = 'lb-context-label';
          contextLabel.textContent = '📖 In your text:';

          const contextSentence = document.createElement('span');
          contextSentence.className = 'lb-context-sentence';
          contextSentence.textContent = `"${word.contextSentence}"`;

          context.appendChild(contextLabel);
          context.appendChild(contextSentence);
          vocabItem.appendChild(context);
        }

        vocabWords.appendChild(vocabItem);
      });

      vocabGroup.appendChild(vocabWords);
      glossaryContainer.appendChild(vocabGroup);
      glossaryTab.appendChild(glossaryContainer);

      this.setupGlossaryEventDelegation(glossaryTab);

      logger.log(`✅ Rendered TIER ${tier} glossary with ${glossary.length} terms (instant!)`);
    }

        // setupGlossaryEventDelegation
    setupGlossaryEventDelegation(glossaryTab) {
      if (this._glossaryClickHandler) {
        glossaryTab.removeEventListener('click', this._glossaryClickHandler);
      }
      this._glossaryClickHandler = async (e) => {
        // Flag button
        const flagButton = e.target.closest('.lb-vocab-flag');
        if (flagButton) {
          e.stopPropagation();
          if (flagButton.dataset.flagged) return;
          flagButton.dataset.flagged = '1';
          flagButton.textContent = '⏳';
          flagButton.disabled = true;
          const text = flagButton.getAttribute('data-text');
          const lang = flagButton.getAttribute('data-lang');
          const tier = parseInt(flagButton.getAttribute('data-tier'), 10) || null;
          const result = await this.sendFlag(text, lang, tier, 'glossary');
          flagButton.textContent = '🚩';
          flagButton.style.opacity = '0.9';
          flagButton.title = `Flagged (${result.flagCount} total)`;
          logger.log(`🚩 Glossary word flagged: "${text}" (count=${result.flagCount}, status=${result.status})`);
          return;
        }

        const button = e.target.closest('.lb-vocab-audio');
        if (!button) return; // Not an audio button click

        e.stopPropagation();

        const text = button.getAttribute('data-text');
        const lang = button.getAttribute('data-lang');
        const rate = parseFloat(button.getAttribute('data-rate')) || 1.0;

        const isSlowButton = button.classList.contains('lb-vocab-slow');
        const originalIcon = isSlowButton ? '🐢' : '🔊';

        try {
          // STOP ANY CURRENTLY PLAYING AUDIO (prevents crossover!)
          this.stopCurrentAudio();

          button.disabled = true;
          button.textContent = '⏳';

          if (window.sessionAudioCache && lang === 'en') {
            await window.sessionAudioCache.playAudio(text, lang, rate);
          } else if (window.sessionAudioCache) {
            await window.sessionAudioCache.playAudio(text, lang, rate, window.AzureClient);
          } else {
            await window.AzureClient.speakText(text, lang, { rate: rate });
          }

          button.textContent = originalIcon;
        } catch (error) {
          logger.error('Error speaking word:', error);
          button.textContent = '❌';
          setTimeout(() => button.textContent = originalIcon, 2000);
        } finally {
          button.disabled = false;
        }
      };
      glossaryTab.addEventListener('click', this._glossaryClickHandler);
    }

        // stopCurrentAudio
    stopCurrentAudio() {
      // Stop browser TTS (English)
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }

      // Stop Azure TTS (all other languages)
      if (window.AzureClient && window.AzureClient.synthesizer) {
        try {
          window.AzureClient.synthesizer.close();
        } catch (error) {
          logger.warn('⚠️ Error closing Azure synthesizer:', error);
        }
        window.AzureClient.synthesizer = null;
      }
    }

        // sendFlag — fire-and-forget flag event to Netlify log-flag function
    async sendFlag(text, language, tier, source) {
      const endpoint = window.CONFIG?.endpoints?.logFlag;
      if (!endpoint) {
        logger.warn('⚠️ logFlag endpoint not configured, skipping flag');
        return { flagCount: 1, status: 'logged' };
      }
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, language, tier, source }),
        });
        if (!response.ok) {
          logger.warn(`⚠️ Flag endpoint returned ${response.status}`);
          return { flagCount: 1, status: 'logged' };
        }
        return await response.json();
      } catch (error) {
        logger.warn('⚠️ Could not send flag:', error);
        return { flagCount: 1, status: 'logged' };
      }
    }

        // attachGlossaryAudioListeners
    attachGlossaryAudioListeners(glossaryTab) {
      // See setupGlossaryEventDelegation() for the new implementation
      logger.warn('⚠️ attachGlossaryAudioListeners is deprecated, use setupGlossaryEventDelegation instead');
    }

        // updateGlossaryForTier - Refactored to use renderGlossary (XSS-safe)
    async updateGlossaryForTier(glossaryTab, originalText, tier) {
      try {
        // Re-extract academic terms with the new tier
        const glossaryTerms = await window.AzureClient.extractAcademicTerms(originalText, this.userLanguage, tier);

        // Use the safe renderGlossary method instead of innerHTML
        this.renderGlossary(glossaryTab, glossaryTerms, tier);

      } catch (error) {
        logger.error('Error updating glossary for tier:', error);
        glossaryTab.textContent = '';
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'lb-glossary-empty';
        emptyDiv.textContent = '⚠️ Could not load glossary.';
        glossaryTab.appendChild(emptyDiv);
      }
    }
    makeTooltipDraggable(tooltip) {
      const header = tooltip.querySelector('.lb-tooltip-header');
      if (!header) return;

      let isDragging = false;
      let currentX;
      let currentY;
      let initialX;
      let initialY;
      let xOffset = 0;
      let yOffset = 0;

      header.addEventListener('mousedown', dragStart);
      document.addEventListener('mousemove', drag);
      document.addEventListener('mouseup', dragEnd);

      function dragStart(e) {
        // Don't drag if clicking the close button
        if (e.target.classList.contains('lb-tooltip-close')) {
          return;
        }

        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;

        // Allow dragging from header, language text, or drag handle
        if (e.target === header ||
            e.target.classList.contains('lb-tooltip-language') ||
            e.target.classList.contains('lb-tooltip-drag-handle')) {
          isDragging = true;

          // Change positioning to fixed for dragging if not already
          if (tooltip.style.position !== 'fixed') {
            const rect = tooltip.getBoundingClientRect();
            tooltip.style.position = 'fixed';
            tooltip.style.left = rect.left + 'px';
            tooltip.style.top = rect.top + 'px';
            tooltip.style.transform = 'none';
          } else {
            // If already fixed, get current position
            const currentLeft = parseInt(tooltip.style.left) || 0;
            const currentTop = parseInt(tooltip.style.top) || 0;
            xOffset = currentLeft;
            yOffset = currentTop;
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
          }
        }
      }

      function drag(e) {
        if (isDragging) {
          e.preventDefault();

          currentX = e.clientX - initialX;
          currentY = e.clientY - initialY;

          xOffset = currentX;
          yOffset = currentY;

          // Constrain to viewport
          const rect = tooltip.getBoundingClientRect();
          const maxX = window.innerWidth - rect.width;
          const maxY = window.innerHeight - rect.height;

          currentX = Math.max(0, Math.min(currentX, maxX));
          currentY = Math.max(0, Math.min(currentY, maxY));

          tooltip.style.left = currentX + 'px';
          tooltip.style.top = currentY + 'px';
          tooltip.style.transform = 'none';
        }
      }

      function dragEnd() {
        initialX = currentX;
        initialY = currentY;
        isDragging = false;
      }
    }

    showTranslationTooltipCentered(translatedText) {
      this.hideTranslationTooltip();
      const rtlLanguages = ['ur', 'prs', 'fa', 'ps', 'ar'];
      const isRTL = rtlLanguages.includes(this.userLanguage);
      const tooltip = document.createElement('div');
      tooltip.className = 'lb-translation-tooltip';
      tooltip.id = 'lb-translation-tooltip';
      tooltip.setAttribute('data-lang', this.userLanguage);

      const textDir = isRTL ? 'rtl' : 'ltr';
      const textAlign = isRTL ? 'right' : 'left';

      // Create header safely
      const header = document.createElement('div');
      header.className = 'lb-tooltip-header';
      header.style.cssText = 'cursor: move; user-select: none; display: flex; justify-content: space-between; align-items: center;';

      const dragHandle = document.createElement('span');
      dragHandle.className = 'lb-tooltip-drag-handle';
      dragHandle.style.cssText = 'font-size: 14px; opacity: 0.6; margin-right: 8px;';
      dragHandle.textContent = '⋮⋮';

      const langLabel = document.createElement('span');
      langLabel.className = 'lb-tooltip-language';
      langLabel.style.cssText = 'flex: 1;';
      langLabel.textContent = this.getLanguageName();

      const closeBtn2 = document.createElement('button');
      closeBtn2.className = 'lb-tooltip-close';
      closeBtn2.textContent = '×';

      header.appendChild(dragHandle);
      header.appendChild(langLabel);
      header.appendChild(closeBtn2);

      // Create translation text safely
      const textDiv = document.createElement('div');
      textDiv.className = 'lb-tooltip-text';
      textDiv.setAttribute('dir', textDir);
      textDiv.style.textAlign = textAlign;
      textDiv.textContent = translatedText;

      tooltip.appendChild(header);
      tooltip.appendChild(textDiv);

      // Position in center of viewport
      tooltip.style.position = 'fixed';
      tooltip.style.top = '50%';
      tooltip.style.left = '50%';
      tooltip.style.transform = 'translate(-50%, -50%)';
      tooltip.style.zIndex = '10000';

      document.body.appendChild(tooltip);

      // Make tooltip draggable
      this.makeTooltipDraggable(tooltip);

      // Close button handler
      closeBtn2.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        this.hideTranslationTooltip();
      });
    }

    showStatus(message, type = 'info') {
      if (!this.toolbar) return;

      const statusText = this.toolbar.querySelector('.lb-status-text');
      const statusDot = this.toolbar.querySelector('.lb-status-dot');

      if (!statusText || !statusDot) return;

      statusText.textContent = message;
      statusDot.className = `lb-status-dot ${type}`;

      if (type === 'error') {
        setTimeout(() => {
          statusText.textContent = 'Active';
          statusDot.className = 'lb-status-dot';
        }, 3000);
      }
    }

    adjustPageLayout() {
      const toolbarHeight = this.toolbar.offsetHeight;
      document.body.style.paddingBottom = `${toolbarHeight}px`;
      document.body.style.transition = 'padding-bottom 0.3s ease';
    }

    reportProblem() {
      // Show a simple dialog with instructions
      const message = `
🚩 Report a Problem

To report an issue with LanguageBridge:

1. Press F12 to open Developer Tools
2. Click the "Console" tab
3. Take a screenshot of any errors (red text)
4. Email to: support@languagebridge.app

Or use keyboard shortcut:
• Alt+Shift+L - Toggle toolbar
• Alt+Shift+T - Toggle translator

These shortcuts work even in locked test mode!
      `.trim();

      alert(message);

      // Also log helpful debug info to console
      logger.log('🚩 LanguageBridge Debug Info:');
      logger.log('Language:', this.userLanguage);
      logger.log('Reading Speed:', this.readingSpeed);
      logger.log('Is Reading:', this.isReading);
      logger.log('Is Paused:', this.isPaused);
      logger.log('Current URL:', window.location.href);
      logger.log('Extension Version: 1.0.0');
    }

    openHelpGuide() {
      // Open the welcome guide/tutorial
      if (window.LanguageBridgeGuide) {
        logger.log('📖 Opening help guide');
        window.LanguageBridgeGuide.show(true);
      } else {
        logger.warn('⚠️ Welcome guide not loaded');
        this.showStatus('Help guide loading...', 'info');
      }
    }

    async saveSettings() {
      await chrome.storage.sync.set({
        userLanguage: this.userLanguage,
        readingSpeed: this.readingSpeed,
        autoRead: this.autoRead,
        verbosity: this.verbosity
      });
    }

    show() {
      if (!this.toolbar) {
        this.createToolbar();
      }
      this.toolbar.style.display = 'block';
      this.isActive = true;

      // Update language display to reflect current language
      this.updateLanguageDisplay();

      if (isExtensionContextValid()) {
        chrome.storage.sync.set({ toolbarEnabled: true }).catch(err =>
          logger.warn('⚠️ Could not save toolbar state:', err)
        );
      }
    }

    hide() {
      if (this.toolbar) {
        this.toolbar.style.display = 'none';
        document.body.style.paddingBottom = '0';
      }

      // Clean up dropdown click handler to prevent memory leak
      if (this.dropdownClickHandler) {
        document.removeEventListener('click', this.dropdownClickHandler);
        this.dropdownClickHandler = null;
      }

      this.isActive = false;
      // Pause when hiding (keeps cache for later)
      if (this.isReading) {
        this.pauseReading();
      }

      if (isExtensionContextValid()) {
        chrome.storage.sync.set({ toolbarEnabled: false }).catch(err =>
          logger.warn('⚠️ Could not save toolbar state:', err)
        );
      }
    }

    toggle() {
      if (this.isActive) {
        this.hide();
      } else {
        this.show();
      }
    }
  }
  if (typeof window.LanguageBridgeToolbar === 'undefined') {
    window.LanguageBridgeToolbar = new LanguageBridgeToolbar();
  }
