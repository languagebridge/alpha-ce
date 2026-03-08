/**
 * LanguageBridge Welcome Guide & Tutorial System
 */

class WelcomeGuide {
  constructor() {
    this.currentStep = 0;
    this.isActive = false;
    this.overlay = null;
    this.modal = null;

    // Tutorial steps with interactive content
    this.steps = [
      {
        title: "Welcome to LanguageBridge™! 📚",
        content: `
          <p><strong>Your learning companion that helps you understand in your own language!</strong></p>
          <p style="margin: 16px 0; font-size: 15px;">LanguageBridge helps students read, learn, and talk with teachers:</p>
          <ul style="text-align: left; margin: 12px 0; padding-left: 20px; line-height: 1.8;">
            <li>📖 <strong>Read anything</strong> - Hear text translated to Dari, Pashto, Arabic, Spanish & more</li>
            <li>🎓 <strong>Learn academic words</strong> - FREE built-in dictionary with cognates (similar words)</li>
            <li>💬 <strong>Talk to your teacher</strong> - Voice conversation in your language</li>
            <li>🌐 <strong>Works everywhere</strong> - Google Docs, PDFs, any website</li>
          </ul>
        `,
        icon: "📚",
        buttonText: "Let's Get Started →"
      },
      {
        title: "How to Hear Text Read Aloud 🎧",
        content: `
          <p style="font-size: 15px; margin-bottom: 16px;"><strong>It's super easy! Just 3 steps:</strong></p>
          <ol style="text-align: left; margin: 12px 0; padding-left: 20px; font-size: 15px; line-height: 2;">
            <li>✨ <strong>Select</strong> any text with your mouse (like highlighting with a marker)</li>
            <li>👀 <strong>Look</strong> at the toolbar at the bottom of your screen</li>
            <li>🎵 <strong>Click Play ▶</strong> to hear it in your language!</li>
          </ol>
          <div style="margin-top: 16px; padding: 12px; background: rgba(59, 130, 246, 0.2); border-radius: 8px; font-size: 14px;">
            💡 <strong>For Teachers:</strong> Students can drag the translation box anywhere on screen and control the reading speed!
          </div>
        `,
        icon: "🎧",
        buttonText: "Next: Google Docs →"
      },
      {
        title: "Using Google Docs & PDFs 📄",
        content: `
          <p style="font-size: 15px; margin-bottom: 16px;"><strong>In Google Classroom or reading PDFs:</strong></p>
          <ol style="text-align: left; margin: 12px 0; padding-left: 20px; font-size: 15px; line-height: 2;">
            <li>📝 <strong>Copy</strong> the text you want to read (Ctrl+C or Cmd+C)</li>
            <li>📋 <strong>Click</strong> in the text box in the toolbar (bottom of screen)</li>
            <li>📌 <strong>Paste</strong> the text (Ctrl+V or Cmd+V)</li>
            <li>🎵 <strong>Press Enter</strong> or click Play ▶</li>
          </ol>
          <div style="margin-top: 16px; padding: 12px; background: rgba(251, 146, 60, 0.2); border-radius: 8px; font-size: 14px;">
            👨‍🏫 <strong>For Teachers:</strong> This works great for assignments, worksheets, and reading passages!
          </div>
        `,
        icon: "📄",
        buttonText: "Next: Academic Words →"
      },
      {
        title: "FREE Academic Vocabulary! 🎓",
        content: `
          <p style="font-size: 15px; margin-bottom: 16px;"><strong>Built-in dictionary with cognates (similar words):</strong></p>
          <ul style="text-align: left; margin: 12px 0; padding-left: 20px; font-size: 14px; line-height: 2;">
            <li>📚 <strong>6,000+ academic terms</strong> - Science, Math, Social Studies, Language Arts</li>
            <li>🔤 <strong>Cognate matching</strong> - Shows words that look/sound similar in both languages</li>
            <li>🌍 <strong>Works in all languages</strong> - Dari, Pashto, Arabic, Spanish & more</li>
            <li>💯 <strong>100% FREE</strong> - No internet needed for vocabulary lookups!</li>
          </ul>
          <div style="margin-top: 16px; padding: 12px; background: rgba(16, 185, 129, 0.2); border-radius: 8px; font-size: 14px;">
            ✨ <strong>Example:</strong> "Photosynthesis" in Spanish is "Fotosíntesis" - almost the same! LanguageBridge shows you these connections.
          </div>
        `,
        icon: "🎓",
        buttonText: "Next: Voice Translator →"
      },
      {
        title: "Talk to Teacher 💬",
        content: `
          <p style="font-size: 15px; margin-bottom: 16px;"><strong>Have a live conversation in real-time!</strong></p>
          <ul style="text-align: left; margin: 12px 0; padding-left: 20px; font-size: 14px; line-height: 2;">
            <li>🎤 <strong>Student speaks</strong> in your language (Dari, Pashto, Spanish, etc.)</li>
            <li>🔄 <strong>LanguageBridge translates</strong> to English for your teacher</li>
            <li>👂 <strong>Teacher responds</strong> in English</li>
            <li>🗣️ <strong>You hear it</strong> translated back to your language!</li>
            <li>⏹️ <strong>Stop anytime</strong> by clicking the STOP button</li>
          </ul>
          <div style="margin-top: 16px; padding: 12px; background: rgba(139, 92, 246, 0.2); border-radius: 8px; font-size: 14px;">
            🎯 <strong>Quick Access:</strong> Press Alt+Shift+T or click the "TALK" button in the toolbar to start a conversation!
          </div>
        `,
        icon: "💬",
        buttonText: "Almost Done →"
      },
      {
        title: "You're Ready to Learn! 🎉",
        content: `
          <p style="font-size: 15px; margin-bottom: 16px;"><strong>Here's what to remember:</strong></p>
          <ol style="text-align: left; margin: 12px 0; padding-left: 20px; font-size: 15px; line-height: 2;">
            <li>🖱️ <strong>Select text</strong> with your mouse</li>
            <li>🎵 <strong>Click Play ▶</strong> in the toolbar at the bottom</li>
            <li>👂 <strong>Listen & learn</strong> in your language!</li>
            <li>🌍 <strong>Change language</strong> anytime by clicking your language in the toolbar!</li>
          </ol>
          <div style="margin-top: 16px; padding: 12px; background: rgba(251, 191, 36, 0.2); border-radius: 8px; font-size: 14px;">
            💡 <strong>Pro Tip:</strong> Click your current language (like "اردو Urdu") in the toolbar to switch to a different language instantly!
          </div>
          <div style="margin-top: 12px; padding: 12px; background: rgba(99, 102, 241, 0.2); border-radius: 8px; font-size: 14px;">
            ❓ <strong>Need help?</strong> Click the <strong>?</strong> button in the toolbar to see this guide again.
          </div>
          <p style="margin-top: 16px; font-size: 16px; font-weight: 600; color: rgba(255,255,255,0.95);">
            Happy learning! 📚✨
          </p>
          <p style="margin-top: 8px; font-size: 13px; opacity: 0.8;">
            LanguageBridge supports: Dari, Persian, Pashto, Arabic, Urdu, Somali, Ukrainian, Spanish & English
          </p>
        `,
        icon: "🎉",
        buttonText: "Start Learning ✓"
      }
    ];
  }

    // hasSeenGuide
  async hasSeenGuide() {
    try {
      const result = await chrome.storage.sync.get(['welcomeGuideCompleted']);
      return result.welcomeGuideCompleted === true;
    } catch (error) {
      logger.error('Error checking welcome guide status:', error);
      return false; // Default to showing guide if we can't check
    }
  }

    // markCompleted
  async markCompleted() {
    try {
      await chrome.storage.sync.set({ welcomeGuideCompleted: true });
      logger.log('✓ Welcome guide marked as completed');
    } catch (error) {
      logger.error('Error marking welcome guide as completed:', error);
    }
  }
  show(startFromBeginning = false) {
    if (this.isActive) return;

    this.isActive = true;
    this.currentStep = startFromBeginning ? 0 : 0;

    this.createOverlay();
    this.createModal();
    this.renderStep();
  }
  createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'lb-welcome-overlay';
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.85);
      z-index: 999999;
      animation: fadeIn 0.3s ease;
    `;

    document.body.appendChild(this.overlay);
  }
  createModal() {
    this.modal = document.createElement('div');
    this.modal.id = 'lb-welcome-modal';
    this.modal.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(135deg, #742a69 0%, #f37030 80%, #ffc755 100%);
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      z-index: 1000000;
      width: 90%;
      max-width: 600px;
      max-height: 85vh;
      overflow-y: auto;
      animation: scaleIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: white;
    `;

    document.body.appendChild(this.modal);
  }
  renderStep() {
    const step = this.steps[this.currentStep];
    const progress = ((this.currentStep + 1) / this.steps.length) * 100;

    // SECURITY NOTE: This innerHTML usage is safe because:
    // 1. All step content is hardcoded in this.steps array (lines 13-115)
    // 2. No user input is included in the template
    // 3. All dynamic values (step.icon, step.title, etc.) come from predefined static data
    this.modal.innerHTML = `
      <div style="padding: 32px;">
        <!-- Progress bar -->
        <div style="margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 12px; font-weight: 600; opacity: 0.8;">
              Step ${this.currentStep + 1} of ${this.steps.length}
            </span>
            ${this.currentStep > 0 ? `
              <button id="lb-guide-skip" style="
                background: rgba(255,255,255,0.15);
                border: none;
                color: white;
                padding: 4px 12px;
                border-radius: 6px;
                font-size: 12px;
                cursor: pointer;
                font-weight: 600;
              ">Skip Tutorial</button>
            ` : ''}
          </div>
          <div style="
            width: 100%;
            height: 6px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 3px;
            overflow: hidden;
          ">
            <div style="
              width: ${progress}%;
              height: 100%;
              background: white;
              border-radius: 3px;
              transition: width 0.4s ease;
            "></div>
          </div>
        </div>

        <!-- Icon -->
        <div style="text-align: center; font-size: 64px; margin-bottom: 20px;">
          ${step.icon}
        </div>

        <!-- Title -->
        <h2 style="
          text-align: center;
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 20px;
          line-height: 1.2;
        ">${step.title}</h2>

        <!-- Content -->
        <div style="
          font-size: 16px;
          line-height: 1.6;
          text-align: center;
        ">
          ${step.content}
        </div>

        <!-- Navigation buttons -->
        <div style="
          display: flex;
          gap: 12px;
          margin-top: 32px;
        ">
          ${this.currentStep > 0 ? `
            <button id="lb-guide-back" style="
              flex: 1;
              background: rgba(255, 255, 255, 0.2);
              border: 2px solid rgba(255, 255, 255, 0.4);
              color: white;
              padding: 14px 24px;
              border-radius: 12px;
              font-size: 16px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s;
            ">← Back</button>
          ` : ''}
          <button id="lb-guide-next" style="
            flex: ${this.currentStep > 0 ? '2' : '1'};
            background: white;
            border: none;
            color: #742a69;
            padding: 14px 24px;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s;
          ">${step.buttonText}</button>
        </div>
      </div>
    `;
    if (!document.getElementById('lb-guide-animations')) {
      const style = document.createElement('style');
      style.id = 'lb-guide-animations';
      style.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.8);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
        #lb-guide-next:hover, #lb-guide-back:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
        #lb-guide-skip:hover {
          background: rgba(255,255,255,0.25);
        }
      `;
      document.head.appendChild(style);
    }
    const nextBtn = document.getElementById('lb-guide-next');
    const backBtn = document.getElementById('lb-guide-back');
    const skipBtn = document.getElementById('lb-guide-skip');

    nextBtn.addEventListener('click', () => this.nextStep());
    if (backBtn) backBtn.addEventListener('click', () => this.previousStep());
    if (skipBtn) skipBtn.addEventListener('click', () => this.close());
  }
  nextStep() {
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
      this.renderStep();
    } else {
      // Finished tutorial - close() will mark as completed
      this.close();
    }
  }
  previousStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.renderStep();
    }
  }
  async close() {
    this.isActive = false;

    // Mark as completed so it won't show again
    // This ensures tutorial only appears once, even if skipped
    await this.markCompleted();

    if (this.modal) {
      this.modal.style.animation = 'scaleIn 0.3s ease reverse';
    }
    if (this.overlay) {
      this.overlay.style.animation = 'fadeIn 0.3s ease reverse';
    }

    setTimeout(() => {
      if (this.modal) this.modal.remove();
      if (this.overlay) this.overlay.remove();
      this.modal = null;
      this.overlay = null;
    }, 300);
  }
  static async init() {
    const guide = new WelcomeGuide();
    const hasSeenGuide = await guide.hasSeenGuide();
    if (!hasSeenGuide) {
      setTimeout(() => {
        guide.show();
      }, 1000);
    }

    // Make guide accessible globally for toolbar button
    window.LanguageBridgeGuide = guide;

    return guide;
  }
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => WelcomeGuide.init());
} else {
  WelcomeGuide.init();
}
