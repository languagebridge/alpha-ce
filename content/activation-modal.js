/**
 * LanguageBridge Subscription Activation Modal
 */
// logger is available globally via window object (loaded from utils/logger.js)

class ActivationModal {
  constructor() {
    this.modal = null;
    this.isShowing = false;
  }
  show() {
    if (this.isShowing) return;

    this.isShowing = true;
    this.createModal();
    document.body.appendChild(this.modal);

    // Animate in
    requestAnimationFrame(() => {
      this.modal.style.opacity = '1';
      const content = this.modal.querySelector('.lb-activation-content');
      if (content) {
        content.style.transform = 'translateY(0) scale(1)';
      }
    });
  }
  hide() {
    if (!this.isShowing || !this.modal) return;

    this.modal.style.opacity = '0';
    const content = this.modal.querySelector('.lb-activation-content');
    if (content) {
      content.style.transform = 'translateY(-20px) scale(0.95)';
    }

    setTimeout(() => {
      if (this.modal && this.modal.parentNode) {
        this.modal.parentNode.removeChild(this.modal);
      }
      this.modal = null;
      this.isShowing = false;
    }, 300);
  }
  createModal() {
    this.modal = document.createElement('div');
    this.modal.className = 'lb-activation-modal';
    // SECURITY NOTE: This innerHTML usage is safe because it contains only
    // hardcoded static HTML with no user input or dynamic data
    this.modal.innerHTML = `
      <div class="lb-activation-overlay"></div>
      <div class="lb-activation-content">
        <div class="lb-activation-header">
          <img src="${chrome.runtime.getURL('assets/LB%20Logo-2.svg')}" alt="LanguageBridge" class="lb-activation-logo">
          <h2>Welcome to LanguageBridge™!</h2>
          <p>Get started with instant translation and text-to-speech</p>
        </div>

        <div class="lb-activation-options">
          <!-- Option 1: Free Demo -->
          <div class="lb-activation-option lb-option-featured">
            <div class="lb-option-badge">🎁 Recommended</div>
            <div class="lb-option-icon">✨</div>
            <h3>Start Free Trial</h3>
            <p>Get 100 free translations for 7 days</p>
            <ul class="lb-option-features">
              <li>✓ 100 translations</li>
              <li>✓ 7 day access</li>
              <li>✓ All 8 languages</li>
              <li>✓ No credit card needed</li>
            </ul>
            <button class="lb-btn lb-btn-primary" id="lb-get-demo-btn">
              Get Free Trial
            </button>
          </div>

          <!-- Option 2: School Email -->
          <div class="lb-activation-option">
            <div class="lb-option-icon">🏫</div>
            <h3>School Account</h3>
            <p>Have a school email? Check for free access</p>
            <input type="email"
                   class="lb-email-input"
                   id="lb-school-email"
                   placeholder="student@school.edu">
            <button class="lb-btn lb-btn-secondary" id="lb-check-school-btn">
              Check Eligibility
            </button>
            <div class="lb-email-hint">
              Ask your teacher if your school has LanguageBridge
            </div>
          </div>

          <!-- Option 3: Premium -->
          <div class="lb-activation-option">
            <div class="lb-option-icon">⭐</div>
            <h3>Go Premium</h3>
            <p>Unlimited translations, priority support</p>
            <div class="lb-pricing">
              <span class="lb-price">$9.99</span>
              <span class="lb-period">/month</span>
            </div>
            <ul class="lb-option-features">
              <li>✓ Unlimited translations</li>
              <li>✓ Priority support</li>
              <li>✓ All features</li>
            </ul>
            <button class="lb-btn lb-btn-premium" id="lb-buy-premium-btn">
              View Plans
            </button>
          </div>
        </div>

        <div class="lb-activation-footer">
          <button class="lb-btn-close" id="lb-activation-close">
            Maybe Later
          </button>
        </div>

        <div class="lb-activation-loading" id="lb-activation-loading" style="display: none;">
          <div class="lb-spinner"></div>
          <p>Activating your subscription...</p>
        </div>
      </div>
    `;

    this.attachStyles();
    this.attachEventListeners();
  }
  attachEventListeners() {
    const demoBtn = this.modal.querySelector('#lb-get-demo-btn');
    if (demoBtn) {
      demoBtn.addEventListener('click', () => this.getDemoKey());
    }
    const schoolBtn = this.modal.querySelector('#lb-check-school-btn');
    if (schoolBtn) {
      schoolBtn.addEventListener('click', () => this.checkSchoolEmail());
    }

    // Buy premium button
    const premiumBtn = this.modal.querySelector('#lb-buy-premium-btn');
    if (premiumBtn) {
      premiumBtn.addEventListener('click', () => {
        window.open('https://languagebridge.app/pricing', '_blank');
      });
    }

    // Close button
    const closeBtn = this.modal.querySelector('#lb-activation-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    }

    // Click outside to close
    const overlay = this.modal.querySelector('.lb-activation-overlay');
    if (overlay) {
      overlay.addEventListener('click', () => this.hide());
    }
  }
  async checkSchoolEmail() {
    const emailInput = this.modal.querySelector('#lb-school-email');
    const schoolBtn = this.modal.querySelector('#lb-check-school-btn');
    const email = emailInput.value.trim();

    if (!email) {
      this.showError('Please enter your school email address');
      return;
    }

    // Basic email validation
    if (!email.includes('@') || !email.includes('.')) {
      this.showError('Please enter a valid email address');
      return;
    }

    try {
      schoolBtn.disabled = true;
      schoolBtn.textContent = 'Checking...';
      // For now, show message to contact admin
      // SECURITY: Escape user input (email domain) to prevent XSS
      const escapeHtml = (str) => {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
      };
      const emailDomain = escapeHtml(email.split('@')[1]);
      this.showInfo(`
        <h3>School Email Verification</h3>
        <p>To check if your school (${emailDomain}) has LanguageBridge:</p>
        <ol style="text-align: left; margin: 1rem 0;">
          <li>Ask your teacher or school admin</li>
          <li>If your school has LanguageBridge, they'll provide an invitation link</li>
          <li>Or start with a free trial while you check!</li>
        </ol>
      `);

      schoolBtn.disabled = false;
      schoolBtn.textContent = 'Check Eligibility';

    } catch (error) {
      logger.error('Error checking school email:', error);
      this.showError('Error checking eligibility. Please try again.');
      schoolBtn.disabled = false;
      schoolBtn.textContent = 'Check Eligibility';
    }
  }
  showSuccess(html) {
    const content = this.modal.querySelector('.lb-activation-content');
    // SECURITY NOTE: This method receives hardcoded HTML from showSuccess() calls (lines 215-219)
    // No user input is passed to this method - all content is static
    content.innerHTML = `
      <div class="lb-activation-message lb-message-success">
        ${html}
      </div>
    `;
  }
  showError(message) {
    const existing = this.modal.querySelector('.lb-activation-error');
    if (existing) existing.remove();

    const error = document.createElement('div');
    error.className = 'lb-activation-error';
    error.textContent = message;

    const content = this.modal.querySelector('.lb-activation-content');
    content.insertBefore(error, content.firstChild);

    setTimeout(() => error.remove(), 5000);
  }
  showInfo(html) {
    const content = this.modal.querySelector('.lb-activation-content');
    const existing = content.querySelector('.lb-activation-options');
    if (existing) {
      // emailDomain is HTML-escaped via escapeHtml() before being passed here — safe
      existing.innerHTML = `
        <div class="lb-activation-message lb-message-info">
          ${html}
          <button class="lb-btn lb-btn-secondary" onclick="location.reload()">
            Back
          </button>
        </div>
      `;
    }
  }
  attachStyles() {
    if (document.querySelector('#lb-activation-modal-styles')) return;

    const style = document.createElement('style');
    style.id = 'lb-activation-modal-styles';
    style.textContent = `
      .lb-activation-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 2147483647;
        opacity: 0;
        transition: opacity 0.3s ease;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .lb-activation-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(8px);
      }

      .lb-activation-content {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) translateY(-20px) scale(0.95);
        background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
        border-radius: 24px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        max-width: 900px;
        max-height: 90vh;
        overflow-y: auto;
        padding: 40px;
        transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      .lb-activation-header {
        text-align: center;
        margin-bottom: 32px;
      }

      .lb-activation-logo {
        width: 64px;
        height: 64px;
        margin-bottom: 16px;
        object-fit: contain;
      }

      .lb-activation-header h2 {
        margin: 0 0 8px 0;
        font-size: 32px;
        color: #1a1a1a;
        background: linear-gradient(135deg, #742a69 0%, #f37030 80%, #ffc755 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .lb-activation-header p {
        margin: 0;
        font-size: 16px;
        color: #666;
      }

      .lb-activation-options {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
        margin-bottom: 24px;
      }

      .lb-activation-option {
        background: white;
        border: 2px solid #e0e0e0;
        border-radius: 16px;
        padding: 24px;
        text-align: center;
        transition: all 0.2s ease;
        position: relative;
      }

      .lb-activation-option:hover {
        border-color: #742a69;
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(116, 42, 105, 0.2);
      }

      .lb-option-featured {
        border-color: #742a69;
        border-width: 3px;
        background: linear-gradient(135deg, #f5eaf4 0%, #ffffff 100%);
      }

      .lb-option-badge {
        position: absolute;
        top: -12px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #742a69 0%, #4a1a45 100%);
        color: white;
        padding: 4px 16px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
        white-space: nowrap;
      }

      .lb-option-icon {
        font-size: 48px;
        margin-bottom: 12px;
      }

      .lb-activation-option h3 {
        margin: 0 0 8px 0;
        font-size: 20px;
        color: #1a1a1a;
      }

      .lb-activation-option p {
        margin: 0 0 16px 0;
        font-size: 14px;
        color: #666;
      }

      .lb-option-features {
        list-style: none;
        padding: 0;
        margin: 16px 0;
        text-align: left;
      }

      .lb-option-features li {
        padding: 6px 0;
        font-size: 14px;
        color: #444;
      }

      .lb-pricing {
        margin: 16px 0;
      }

      .lb-price {
        font-size: 32px;
        font-weight: 700;
        color: #742a69;
      }

      .lb-period {
        font-size: 16px;
        color: #666;
      }

      .lb-email-input {
        width: 100%;
        padding: 12px;
        border: 2px solid #e0e0e0;
        border-radius: 8px;
        font-size: 14px;
        margin-bottom: 12px;
        font-family: inherit;
      }

      .lb-email-input:focus {
        outline: none;
        border-color: #742a69;
      }

      .lb-email-hint {
        font-size: 12px;
        color: #999;
        margin-top: 8px;
      }

      .lb-btn {
        width: 100%;
        padding: 12px 24px;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        font-family: inherit;
      }

      .lb-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .lb-btn-primary {
        background: linear-gradient(135deg, #742a69 0%, #4a1a45 100%);
        color: white;
      }

      .lb-btn-primary:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(116, 42, 105, 0.4);
      }

      .lb-btn-secondary {
        background: #f0f0f0;
        color: #333;
      }

      .lb-btn-secondary:hover:not(:disabled) {
        background: #e0e0e0;
      }

      .lb-btn-premium {
        background: linear-gradient(90deg, #f37030 0%, #ffc755 100%);
        color: white;
      }

      .lb-btn-premium:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(243, 112, 48, 0.4);
      }

      .lb-activation-footer {
        text-align: center;
        margin-top: 24px;
      }

      .lb-btn-close {
        background: none;
        border: none;
        color: #999;
        font-size: 14px;
        cursor: pointer;
        padding: 8px 16px;
      }

      .lb-btn-close:hover {
        color: #666;
        text-decoration: underline;
      }

      .lb-activation-loading {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.95);
        border-radius: 24px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 16px;
      }

      .lb-spinner {
        width: 48px;
        height: 48px;
        border: 4px solid #e0e0e0;
        border-top-color: #742a69;
        border-radius: 50%;
        animation: lb-spin 1s linear infinite;
      }

      @keyframes lb-spin {
        to { transform: rotate(360deg); }
      }

      .lb-activation-error {
        background: #fee2e2;
        color: #991b1b;
        padding: 12px;
        border-radius: 8px;
        margin-bottom: 16px;
        font-size: 14px;
      }

      .lb-activation-message {
        padding: 40px;
        text-align: center;
      }

      .lb-message-success {
        color: #065f46;
      }

      .lb-message-success h3 {
        margin: 0 0 16px 0;
        font-size: 24px;
      }

      .lb-message-info {
        text-align: left;
      }

      .lb-message-info h3 {
        margin: 0 0 16px 0;
        font-size: 20px;
        color: #1a1a1a;
      }

      .lb-message-info ol {
        line-height: 1.8;
      }

      @media (max-width: 768px) {
        .lb-activation-content {
          max-width: 95%;
          padding: 24px;
        }

        .lb-activation-options {
          grid-template-columns: 1fr;
        }
      }
    `;

    document.head.appendChild(style);
  }
}
window.LanguageBridgeActivation = new ActivationModal();

// === MVP MODE: Activation modal disabled ===
// Auto-provisioning demo keys instead (see background.js)
// Re-enable this after securing funding and implementing payment system
// setTimeout(() => {
//   window.LanguageBridgeActivation.checkAndShow();
// }, 2000);
