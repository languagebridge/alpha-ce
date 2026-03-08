/**
 * LanguageBridge - Floating Conversation Translator
 */
// logger is available globally via window object (loaded from utils/logger.js)

class FloatingTranslator {
    constructor() {
      this.isActive = false;
      this.isListening = false;
      this.isTranslating = false;
      this.isDragging = false;
      this.container = null;
      this.position = { x: window.innerWidth - 120, y: window.innerHeight - 120 };
      this.dragOffset = { x: 0, y: 0 };

      // User settings
      this.studentLanguage = 'prs'; // Dari default (for Afghan students)
      this.teacherLanguage = 'en'; // English default

      // Conversation history
      this.conversationHistory = [];
      this.lastProcessedText = null;

      // Translation cache to avoid duplicate API calls
      this.translationCache = new Map();
      this.maxCacheSize = 100;

      this.init();
    }
  
    async init() {
      // Load saved settings
      const settings = await chrome.storage.sync.get([
        'floatingTranslatorEnabled',
        'studentLanguage',
        'teacherLanguage',
        'floatingPosition'
      ]);
  
      if (settings.studentLanguage) this.studentLanguage = settings.studentLanguage;
      if (settings.teacherLanguage) this.teacherLanguage = settings.teacherLanguage;
      if (settings.floatingPosition) this.position = settings.floatingPosition;
      if (settings.floatingTranslatorEnabled) {
        this.show();
      }
  
      // Listen for keyboard shortcut and settings updates
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'toggle-floating-translator') {
          this.toggle();
          sendResponse({ success: true, isActive: this.isActive });
          return true; // Required for async response
        }

        if (request.action === 'settings-updated' && request.settings) {
          if (request.settings.studentLanguage) this.studentLanguage = request.settings.studentLanguage;
          if (request.settings.teacherLanguage) this.teacherLanguage = request.settings.teacherLanguage;
          sendResponse({ success: true });
          return true;
        }

        return false; // No async response needed
      });
    }
  
    createUI() {
      // Main floating container
      this.container = document.createElement('div');
      this.container.id = 'lb-floating-translator';
      this.container.className = 'lb-floating-translator';
      
      this.container.innerHTML = `
        <div class="lb-float-header">
          <div class="lb-float-drag-handle">
            <svg width="16" height="16" viewBox="0 0 20 20">
              <circle cx="6" cy="5" r="1.5" fill="currentColor"/>
              <circle cx="14" cy="5" r="1.5" fill="currentColor"/>
              <circle cx="6" cy="10" r="1.5" fill="currentColor"/>
              <circle cx="14" cy="10" r="1.5" fill="currentColor"/>
              <circle cx="6" cy="15" r="1.5" fill="currentColor"/>
              <circle cx="14" cy="15" r="1.5" fill="currentColor"/>
            </svg>
          </div>
          <div class="lb-header-title">Talk to Teacher</div>
          <button class="lb-float-close" title="Close">×</button>
        </div>

        <div class="lb-float-body">
          <!-- Student Speaker Zone (Top Half) -->
          <button class="lb-speaker-zone lb-student-zone" id="lb-student-zone">
            <div class="lb-speaker-header">
              <span class="lb-speaker-icon">👨‍🎓</span>
              <span class="lb-speaker-label">Student</span>
            </div>
            <div class="lb-speaker-content">
              <div class="lb-speaker-text" id="lb-student-text">Tap to speak</div>
              <div class="lb-speaker-lang">${this.getLanguageName(this.studentLanguage)}</div>
            </div>
            <div class="lb-speaker-mic">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <path d="M12 1C10.34 1 9 2.34 9 4V12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12V4C15 2.34 13.66 1 12 1Z" fill="currentColor"/>
                <path d="M19 12C19 15.53 16.39 18.44 13 18.93V23H11V18.93C7.61 18.44 5 15.53 5 12H7C7 14.76 9.24 17 12 17C14.76 17 17 14.76 17 12H19Z" fill="currentColor"/>
              </svg>
            </div>
          </button>

          <!-- Teacher Speaker Zone (Bottom Half) -->
          <button class="lb-speaker-zone lb-teacher-zone" id="lb-teacher-zone">
            <div class="lb-speaker-header">
              <span class="lb-speaker-icon">👨‍🏫</span>
              <span class="lb-speaker-label">Teacher</span>
            </div>
            <div class="lb-speaker-content">
              <div class="lb-speaker-text" id="lb-teacher-text">Tap to speak</div>
              <div class="lb-speaker-lang">${this.getLanguageName(this.teacherLanguage)}</div>
            </div>
            <div class="lb-speaker-mic">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <path d="M12 1C10.34 1 9 2.34 9 4V12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12V4C15 2.34 13.66 1 12 1Z" fill="currentColor"/>
                <path d="M19 12C19 15.53 16.39 18.44 13 18.93V23H11V18.93C7.61 18.44 5 15.53 5 12H7C7 14.76 9.24 17 12 17C14.76 17 17 14.76 17 12H19Z" fill="currentColor"/>
              </svg>
            </div>
          </button>

          <!-- Bottom Controls -->
          <div class="lb-conversation-controls">
            <button class="lb-control-btn" id="lb-stop-listening" title="Stop listening" style="display: none; background: rgba(239, 68, 68, 0.8); color: white; font-weight: 600;">
              ⏹️ STOP
            </button>
            <button class="lb-control-btn" id="lb-view-history" title="View history">
              📜
            </button>
            <button class="lb-control-btn" id="lb-settings-btn" title="Settings">
              ⚙️
            </button>
            <button class="lb-control-btn" id="lb-clear-history" title="Clear all conversation">
              🗑️
            </button>
          </div>
        </div>

        <!-- History Modal (Hidden by default) -->
        <div class="lb-history-modal" id="lb-history-modal" style="display: none;">
          <div class="lb-history-header">
            <h3>Conversation History</h3>
            <button class="lb-history-close" id="lb-history-close">×</button>
          </div>
          <div class="lb-history-body" id="lb-history-body">
            <div class="lb-history-empty">No conversation yet</div>
          </div>
        </div>
  
        <!-- Settings Panel -->
        <div class="lb-settings-panel" id="lb-settings-panel" style="display: none;">
          <div class="lb-settings-header">
            <h3>Translation Settings</h3>
            <button class="lb-settings-close">×</button>
          </div>
          <div class="lb-settings-body">
            <div class="lb-setting-group">
              <label>Your Language:</label>
              <select id="lb-student-lang">
                <option value="prs">Dari (دری) - Afghanistan</option>
                <option value="fa">Persian / Farsi (فارسی) - Iran</option>
                <option value="ps">Pashto (پښتو)</option>
                <option value="ar">Arabic (العربية)</option>
                <option value="ur">Urdu (اردو)</option>
                <option value="so">Somali (Soomaali)</option>
                <option value="uk">Ukrainian (Українська)</option>
                <option value="es">Spanish (Español)</option>
                <option value="fr">French (Français)</option>
                <option value="pt">Portuguese (Português)</option>
                <option value="zh">Chinese (中文)</option>
                <option value="mww">Hmong</option>
              </select>
              <div style="font-size: 11px; color: rgba(255,255,255,0.7); margin-top: 6px;">
                Note: Dari uses Persian voice (no separate Dari voice available)
              </div>
            </div>
            <div class="lb-setting-group">
              <label>Other Person's Language:</label>
              <select id="lb-teacher-lang">
                <option value="en" selected>English</option>
                <option value="prs">Dari (دری) - Afghanistan</option>
                <option value="fa">Persian / Farsi (فارسی) - Iran</option>
                <option value="ps">Pashto (پښتو)</option>
                <option value="ar">Arabic (العربية)</option>
                <option value="ur">Urdu (اردو)</option>
                <option value="so">Somali (Soomaali)</option>
                <option value="uk">Ukrainian (Українська)</option>
                <option value="es">Spanish (Español)</option>
                <option value="fr">French (Français)</option>
                <option value="pt">Portuguese (Português)</option>
                <option value="zh">Chinese (中文)</option>
                <option value="mww">Hmong</option>
              </select>
            </div>
            <div class="lb-setting-group">
              <label>
                <input type="checkbox" id="lb-auto-play"> 
                Auto-play translations
              </label>
            </div>
            <div class="lb-setting-group">
              <label>
                <input type="checkbox" id="lb-show-transcript" checked> 
                Show text transcript
              </label>
            </div>
          </div>
        </div>
      `;
  
      document.body.appendChild(this.container);
      this.attachEventListeners();
      this.positionFloater();
    }
  
    attachEventListeners() {
      // Student speaker zone - tap to speak
      const studentZone = this.container.querySelector('#lb-student-zone');
      studentZone.addEventListener('click', () => {
        if (!this.isListening && !this.isTranslating) {
          this.handleSpeakerTap('student');
        }
      });

      // Teacher speaker zone - tap to speak
      const teacherZone = this.container.querySelector('#lb-teacher-zone');
      teacherZone.addEventListener('click', () => {
        if (!this.isListening && !this.isTranslating) {
          this.handleSpeakerTap('teacher');
        }
      });

      // Stop listening button
      this.container.querySelector('#lb-stop-listening').addEventListener('click', async () => {
        await this.stopListening();
      });

      // History button - show/hide transcript
      this.container.querySelector('#lb-view-history').addEventListener('click', () => {
        this.toggleHistory();
      });

      // Settings button
      this.container.querySelector('#lb-settings-btn').addEventListener('click', () => {
        this.toggleSettings();
      });

      // Clear history button
      this.container.querySelector('#lb-clear-history').addEventListener('click', () => {
        this.clearHistory();
      });

      // History modal close button
      this.container.querySelector('#lb-history-close').addEventListener('click', () => {
        this.toggleHistory();
      });

      // Settings panel close button
      this.container.querySelector('.lb-settings-close').addEventListener('click', () => {
        this.toggleSettings();
      });

      // Dragging functionality — listeners added on mousedown, removed on mouseup
      // to avoid firing on every mouse event across the entire page
      const dragHandle = this.container.querySelector('.lb-float-drag-handle');
      this._boundDrag = this.drag.bind(this);
      this._boundStopDragging = this.stopDragging.bind(this);
      dragHandle.addEventListener('mousedown', this.startDragging.bind(this));

      // Close button
      this.container.querySelector('.lb-float-close').addEventListener('click', () => {
        this.hide();
      });

      // Settings changes
      this.container.querySelector('#lb-student-lang').addEventListener('change', (e) => {
        this.studentLanguage = e.target.value;
        this.saveSettings();
        this.updateLanguageLabels();
      });
  
      this.container.querySelector('#lb-teacher-lang').addEventListener('change', (e) => {
        this.teacherLanguage = e.target.value;
        this.saveSettings();
        this.updateLanguageLabels();
      });
    }

    // Handle speaker zone tap - start listening for that speaker
    async handleSpeakerTap(speaker) {
      const zone = speaker === 'student'
        ? this.container.querySelector('#lb-student-zone')
        : this.container.querySelector('#lb-teacher-zone');

      const textElement = speaker === 'student'
        ? this.container.querySelector('#lb-student-text')
        : this.container.querySelector('#lb-teacher-text');

      const sourceLanguage = speaker === 'student' ? this.studentLanguage : this.teacherLanguage;
      const targetLanguage = speaker === 'student' ? this.teacherLanguage : this.studentLanguage;

      // Disable both zones during listening
      this.container.querySelector('#lb-student-zone').classList.add('disabled');
      this.container.querySelector('#lb-teacher-zone').classList.add('disabled');

      // Show stop button
      const stopBtn = this.container.querySelector('#lb-stop-listening');
      if (stopBtn) {
        stopBtn.style.display = 'block';
      }
      zone.classList.add('listening');
      textElement.textContent = 'Listening... (click STOP to translate)';

      this.isListening = true;
      this.lastProcessedText = null; // Reset for new listening session
      this.currentListeningZone = zone; // Track which zone is listening
      this.currentTextElement = textElement; // Track text element for cleanup

      // Timeout to automatically stop listening after 30 seconds
      this.listeningTimeout = setTimeout(async () => {
        if (this.isListening) {
          logger.log('⏰ Listening timeout - stopping recognition');
          try {
            await window.AzureClient.stopSpeechRecognition();
          } catch (e) {
            logger.log('Recognition already stopped');
          }
          this.isListening = false;
          zone.classList.remove('listening');
          textElement.textContent = 'Timeout - tap to try again';
          this.container.querySelector('#lb-student-zone').classList.remove('disabled');
          this.container.querySelector('#lb-teacher-zone').classList.remove('disabled');
          // Hide stop button
          const stopBtn = this.container.querySelector('#lb-stop-listening');
          if (stopBtn) stopBtn.style.display = 'none';
        }
      }, 30000); // 30 second timeout

      try {
        const recognition = await window.AzureClient.startSpeechRecognition(sourceLanguage);

        recognition.onResult = async (text, isFinal) => {
          if (text && isFinal) {
            // Clear the timeout since we got a result
            clearTimeout(this.listeningTimeout);
            try {
              await window.AzureClient.stopSpeechRecognition();
              logger.log('✓ Speech recognition stopped after final result');
            } catch (e) {
              logger.log('Recognition already stopped');
            }

            // Prevent duplicate processing
            if (this.lastProcessedText === text) {
              logger.log('⏭️ Skipping duplicate speech result');
              this.isListening = false;
              zone.classList.remove('listening');
              this.container.querySelector('#lb-student-zone').classList.remove('disabled');
              this.container.querySelector('#lb-teacher-zone').classList.remove('disabled');
              // Hide stop button
              const stopBtn = this.container.querySelector('#lb-stop-listening');
              if (stopBtn) stopBtn.style.display = 'none';
              return;
            }
            this.lastProcessedText = text;

            // Show what was heard
            textElement.textContent = text;
            zone.classList.remove('listening', 'transcribing');
            zone.classList.add('translating');
            this.isListening = false; // Mark as not listening anymore

            // Translate and speak
            await this.handleSpeechResult(text, sourceLanguage, targetLanguage, speaker);

            // Re-enable zones
            this.container.querySelector('#lb-student-zone').classList.remove('disabled');
            this.container.querySelector('#lb-teacher-zone').classList.remove('disabled');
            zone.classList.remove('translating');
            // Hide stop button
            const stopBtn = this.container.querySelector('#lb-stop-listening');
            if (stopBtn) stopBtn.style.display = 'none';

          } else if (text && !isFinal) {
            // Show interim results
            textElement.textContent = `"${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`;
          }
        };

        recognition.onEnd = () => {
          clearTimeout(this.listeningTimeout);
          this.isListening = false;
          zone.classList.remove('listening', 'transcribing');
          this.container.querySelector('#lb-student-zone').classList.remove('disabled');
          this.container.querySelector('#lb-teacher-zone').classList.remove('disabled');
          // Hide stop button
          const stopBtn = this.container.querySelector('#lb-stop-listening');
          if (stopBtn) stopBtn.style.display = 'none';
          logger.log('✓ Speech recognition ended');
        };

        recognition.onError = (error) => {
          clearTimeout(this.listeningTimeout);
          logger.error('Speech recognition error:', error);
          textElement.textContent = 'Error - tap to try again';
          zone.classList.remove('listening', 'transcribing');
          this.isListening = false;
          this.container.querySelector('#lb-student-zone').classList.remove('disabled');
          this.container.querySelector('#lb-teacher-zone').classList.remove('disabled');
          // Hide stop button
          const stopBtn = this.container.querySelector('#lb-stop-listening');
          if (stopBtn) stopBtn.style.display = 'none';
        };

      } catch (error) {
        clearTimeout(this.listeningTimeout);
        logger.error('Failed to start speech recognition:', error);
        textElement.textContent = 'Microphone error';
        zone.classList.remove('listening');
        this.isListening = false;
        this.container.querySelector('#lb-student-zone').classList.remove('disabled');
        this.container.querySelector('#lb-teacher-zone').classList.remove('disabled');
        // Hide stop button
        const stopBtn = this.container.querySelector('#lb-stop-listening');
        if (stopBtn) stopBtn.style.display = 'none';
      }
    }

    // Stop listening manually (called by stop button)
    async stopListening() {
      if (!this.isListening) {
        return; // Not currently listening
      }

      logger.log('🛑 Manually stopping speech recognition');

      // Clear timeout
      if (this.listeningTimeout) {
        clearTimeout(this.listeningTimeout);
        this.listeningTimeout = null;
      }

      // Show "Transcribing..." indicator while audio is processed
      if (this.currentTextElement) {
        this.currentTextElement.textContent = 'Transcribing...';
      }
      if (this.currentListeningZone) {
        this.currentListeningZone.classList.remove('listening');
        this.currentListeningZone.classList.add('transcribing');
      }

      // Hide stop button immediately
      const stopBtn = this.container.querySelector('#lb-stop-listening');
      if (stopBtn) {
        stopBtn.style.display = 'none';
      }

      // Stop Azure speech recognition - this triggers async audio processing
      // The onResult/onError callbacks will handle the final UI update
      try {
        await window.AzureClient.stopSpeechRecognition();
        logger.log('✓ Speech recognition stopped, processing audio...');
      } catch (error) {
        logger.warn('Error stopping speech recognition:', error);
        // Reset UI on error
        this.isListening = false;
        if (this.currentListeningZone) {
          this.currentListeningZone.classList.remove('transcribing');
        }
        if (this.currentTextElement) {
          this.currentTextElement.textContent = 'Error - tap to try again';
        }
        this.container.querySelector('#lb-student-zone').classList.remove('disabled');
        this.container.querySelector('#lb-teacher-zone').classList.remove('disabled');
      }

      // Note: Don't reset isListening or UI here - let onResult/onError handle it
      // This allows the "Transcribing..." state to show while audio is processed
      logger.log('✓ Listening stopped manually, waiting for transcription result');
    }

    // Toggle history modal
    toggleHistory() {
      const historyModal = this.container.querySelector('#lb-history-modal');
      if (historyModal.style.display === 'none' || !historyModal.style.display) {
        historyModal.style.display = 'flex';
      } else {
        historyModal.style.display = 'none';
      }
    }
    updateLanguageLabels() {
      const studentLang = this.container.querySelector('#lb-student-zone .lb-speaker-lang');
      const teacherLang = this.container.querySelector('#lb-teacher-zone .lb-speaker-lang');

      if (studentLang) {
        studentLang.textContent = this.getLanguageName(this.studentLanguage);
      }
      if (teacherLang) {
        teacherLang.textContent = this.getLanguageName(this.teacherLanguage);
      }
    }
  
    startDragging(e) {
      this.isDragging = true;
      this.dragOffset.x = e.clientX - this.position.x;
      this.dragOffset.y = e.clientY - this.position.y;
      this.container.style.cursor = 'grabbing';
      document.addEventListener('mousemove', this._boundDrag);
      document.addEventListener('mouseup', this._boundStopDragging);
    }
  
    drag(e) {
      if (!this.isDragging) return;
      
      this.position.x = e.clientX - this.dragOffset.x;
      this.position.y = e.clientY - this.dragOffset.y;
      
      // Constrain to viewport
      this.position.x = Math.max(0, Math.min(window.innerWidth - 300, this.position.x));
      this.position.y = Math.max(0, Math.min(window.innerHeight - 400, this.position.y));
      
      this.positionFloater();
    }
  
    stopDragging() {
      if (this.isDragging) {
        this.isDragging = false;
        this.container.style.cursor = 'default';
        document.removeEventListener('mousemove', this._boundDrag);
        document.removeEventListener('mouseup', this._boundStopDragging);
        this.savePosition();
      }
    }
  
    positionFloater() {
      if (this.container) {
        this.container.style.left = `${this.position.x}px`;
        this.container.style.top = `${this.position.y}px`;
      }
    }
  
  
    async handleSpeechResult(originalText, sourceLang, targetLang, speaker) {
      // Determine zones
      const sourceZone = speaker === 'student'
        ? this.container.querySelector('#lb-student-zone')
        : this.container.querySelector('#lb-teacher-zone');

      const targetZone = speaker === 'student'
        ? this.container.querySelector('#lb-teacher-zone')
        : this.container.querySelector('#lb-student-zone');

      const targetTextElement = speaker === 'student'
        ? this.container.querySelector('#lb-teacher-text')
        : this.container.querySelector('#lb-student-text');

      this.isTranslating = true;

      try {
        this.addToHistory(originalText, sourceLang, 'original');
        const cacheKey = `${sourceLang}-${targetLang}-${originalText.toLowerCase().trim()}`;
        let translatedText;

        if (this.translationCache.has(cacheKey)) {
          logger.log('✓ Translation retrieved from cache (saved API call!)');
          translatedText = this.translationCache.get(cacheKey);
        } else {
          // Translate
          translatedText = await window.AzureClient.translateText(
            originalText,
            sourceLang,
            targetLang
          );

          // Cache the translation
          this.translationCache.set(cacheKey, translatedText);
          if (this.translationCache.size > this.maxCacheSize) {
            const firstKey = this.translationCache.keys().next().value;
            this.translationCache.delete(firstKey);
          }
        }
        this.addToHistory(translatedText, targetLang, 'translated');

        // Show translation in opposite zone
        targetTextElement.textContent = translatedText;
        targetZone.classList.add('speaking');

        // Speak translation
        await window.AzureClient.speakText(translatedText, targetLang);

        // Reset zones
        targetZone.classList.remove('speaking');
        this.isTranslating = false;

      } catch (error) {
        logger.error('Translation error:', error);
        targetTextElement.textContent = 'Translation error';
        sourceZone.classList.remove('translating');
        targetZone.classList.remove('speaking');
        this.isTranslating = false;
      }
    }

  
    addToHistory(text, language, type) {
      const historyBody = this.container.querySelector('#lb-history-body');
      const emptyMsg = historyBody.querySelector('.lb-history-empty');
      if (emptyMsg) emptyMsg.remove();

      const entry = document.createElement('div');
      entry.className = `lb-history-entry ${type}`;

      // Determine icon based on language (student vs teacher)
      const icon = language === this.studentLanguage ? '👨‍🎓' : '👩‍🏫';

      const langName = this.getLanguageName(language);
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Create elements safely to prevent XSS
      const header = document.createElement('div');
      header.className = 'lb-history-entry-header';

      const iconSpan = document.createElement('span');
      iconSpan.className = 'lb-history-entry-icon';
      iconSpan.textContent = icon;

      const langSpan = document.createElement('span');
      langSpan.className = 'lb-history-entry-lang';
      langSpan.textContent = langName;

      const timeSpan = document.createElement('span');
      timeSpan.className = 'lb-history-entry-time';
      timeSpan.textContent = time;

      header.appendChild(iconSpan);
      header.appendChild(langSpan);
      header.appendChild(timeSpan);

      const textDiv = document.createElement('div');
      textDiv.className = 'lb-history-entry-text';
      textDiv.textContent = text;

      entry.appendChild(header);
      entry.appendChild(textDiv);

      historyBody.appendChild(entry);

      // Store in conversation history array
      this.conversationHistory.push({
        text,
        language,
        type,
        timestamp: Date.now()
      });

      // Smooth scroll to bottom
      requestAnimationFrame(() => {
        historyBody.scrollTo({
          top: historyBody.scrollHeight,
          behavior: 'smooth'
        });
      });
    }

    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    clearHistory() {
      // Ask for confirmation before clearing
      if (!confirm('Clear all conversation history? This cannot be undone.')) {
        return;
      }

      const historyBody = this.container.querySelector('#lb-history-body');
      historyBody.innerHTML = `
        <div class="lb-history-empty">
          No conversation history yet.<br>
          Tap a speaker zone to start talking!
        </div>
      `;
      this.conversationHistory = [];
      logger.log('✓ Conversation history cleared');
    }
  
    getLanguageName(code) {
      const names = {
        'en': 'English',
        'prs': 'Dari',
        'fa': 'Persian',
        'ps': 'Pashto',
        'ar': 'Arabic',
        'so': 'Somali',
        'uk': 'Ukrainian',
        'es': 'Spanish',
        'ur': 'Urdu',
        'fr': 'French',
        'pt': 'Portuguese',
        'zh': 'Chinese',
        'mww': 'Hmong'
      };
      return names[code] || code;
    }
  
    toggleSettings() {
      const panel = this.container.querySelector('#lb-settings-panel');
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }

    async saveSettings() {
      await chrome.storage.sync.set({
        studentLanguage: this.studentLanguage,
        teacherLanguage: this.teacherLanguage
      });
    }
  
    async savePosition() {
      await chrome.storage.sync.set({
        floatingPosition: this.position
      });
    }
  
    show() {
      if (!this.container) {
        this.createUI();
      }
      this.container.style.display = 'block';
      this.isActive = true;
      chrome.storage.sync.set({ floatingTranslatorEnabled: true });
    }
  
    async hide() {
      // Stop any ongoing speech recognition
      if (this.isListening) {
        try {
          await window.AzureClient.stopSpeechRecognition();
          logger.log('✓ Speech recognition stopped on hide');
        } catch (error) {
          logger.log('ℹ️ No active speech recognition to stop');
        }
        this.isListening = false;
      }

      // Stop any ongoing speech synthesis
      if (window.AzureClient) {
        window.AzureClient.stopSpeaking();
      }

      // Reset UI states
      if (this.container) {
        const studentZone = this.container.querySelector('#lb-student-zone');
        const teacherZone = this.container.querySelector('#lb-teacher-zone');
        const studentText = this.container.querySelector('#lb-student-text');
        const teacherText = this.container.querySelector('#lb-teacher-text');
        if (studentZone) {
          studentZone.classList.remove('listening', 'translating', 'disabled');
          if (studentText) studentText.textContent = 'Tap to speak';
        }
        if (teacherZone) {
          teacherZone.classList.remove('listening', 'translating', 'disabled');
          if (teacherText) teacherText.textContent = 'Tap to speak';
        }

        this.container.style.display = 'none';
      }

      this.isActive = false;
      this.isTranslating = false;
      chrome.storage.sync.set({ floatingTranslatorEnabled: false });
    }
  
    toggle() {
      if (this.isActive) {
        this.hide();
      } else {
        this.show();
      }
    }
  }
  if (typeof window.FloatingTranslator === 'undefined') {
    window.FloatingTranslator = new FloatingTranslator();
  }