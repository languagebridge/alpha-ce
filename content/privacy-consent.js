/**
 * Privacy Consent Modal
 */

class PrivacyConsent {
  constructor() {
    this.modalContainer = null;
    this.hasConsented = false;
  }
  async checkConsent() {
    const result = await chrome.storage.sync.get(['privacyConsentGiven', 'privacyConsentDate']);
    return {
      given: result.privacyConsentGiven === true,
      date: result.privacyConsentDate || null
    };
  }
  async saveConsent(accepted) {
    await chrome.storage.sync.set({
      privacyConsentGiven: accepted,
      privacyConsentDate: new Date().toISOString(),
      analyticsEnabled: accepted // Automatically set analytics based on consent
    });


  }

    // show - Refactored to use DOM methods (XSS-safe)
  async show() {
    return new Promise((resolve) => {
      this.modalContainer = document.createElement('div');
      this.modalContainer.id = 'lb-privacy-consent-modal';
      this.createModalDOM();
      this.injectStyles();

      // Append to body
      document.body.appendChild(this.modalContainer);
      this.setupEventListeners(resolve);

      // Prevent page interaction
      document.body.style.overflow = 'hidden';
    });
  }

  createModalDOM() {
    const privacyPolicyUrl = chrome.runtime.getURL('privacy-policy.html');

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'lb-consent-overlay';

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'lb-consent-modal';

    // Header
    const header = document.createElement('div');
    header.className = 'lb-consent-header';

    const logo = document.createElement('img');
    logo.src = chrome.runtime.getURL('assets/LB%20Logo-2.svg');
    logo.alt = 'LanguageBridge';
    logo.className = 'lb-consent-logo';

    const h2 = document.createElement('h2');
    h2.textContent = 'Welcome to LanguageBridge™!';

    const subtitle = document.createElement('p');
    subtitle.className = 'lb-consent-subtitle';
    subtitle.textContent = 'Real-time translation for English learners';

    header.appendChild(logo);
    header.appendChild(h2);
    header.appendChild(subtitle);

    // Body
    const body = document.createElement('div');
    body.className = 'lb-consent-body';

    const h3 = document.createElement('h3');
    h3.textContent = '📊 Privacy & Data Collection';

    const intro = document.createElement('p');
    intro.className = 'lb-consent-intro';
    intro.textContent = 'LanguageBridge collects ';
    const strong1 = document.createElement('strong');
    strong1.textContent = 'anonymous usage data';
    intro.appendChild(strong1);
    intro.appendChild(document.createTextNode(' to improve the service. Your privacy is our priority.'));

    // What We Collect section
    const section1 = document.createElement('div');
    section1.className = 'lb-consent-section';
    const h4_1 = document.createElement('h4');
    h4_1.textContent = '✅ What We Collect:';
    const ul1 = document.createElement('ul');
    ['Feature usage counts (how often you use translation, TTS, etc.)',
     'Language preferences',
     'Error rates for debugging',
     'Anonymous user ID (randomly generated)'].forEach(text => {
      const li = document.createElement('li');
      li.textContent = text;
      ul1.appendChild(li);
    });
    section1.appendChild(h4_1);
    section1.appendChild(ul1);

    // What We DON'T Collect section
    const section2 = document.createElement('div');
    section2.className = 'lb-consent-section';
    const h4_2 = document.createElement('h4');
    h4_2.textContent = '❌ What We DON\'T Collect:';
    const ul2 = document.createElement('ul');
    [
      { prefix: 'NO', text: ' text content or translations' },
      { prefix: 'NO', text: ' personal information (name, email, etc.)' },
      { prefix: 'NO', text: ' browsing history' },
      { prefix: 'NO', text: ' IP addresses' }
    ].forEach(item => {
      const li = document.createElement('li');
      const strong = document.createElement('strong');
      strong.textContent = item.prefix;
      li.appendChild(strong);
      li.appendChild(document.createTextNode(item.text));
      ul2.appendChild(li);
    });
    section2.appendChild(h4_2);
    section2.appendChild(ul2);

    // Compliance section
    const compliance = document.createElement('div');
    compliance.className = 'lb-consent-compliance';
    const compP1 = document.createElement('p');
    const compStrong = document.createElement('strong');
    compStrong.textContent = '🏫 Student Privacy Compliant:';
    compP1.appendChild(compStrong);
    const compP2 = document.createElement('p');
    compP2.textContent = 'We follow FERPA, COPPA, and GDPR guidelines. All data is anonymized and used solely to improve the extension.';
    compliance.appendChild(compP1);
    compliance.appendChild(compP2);

    // Note section
    const note = document.createElement('div');
    note.className = 'lb-consent-note';
    const noteP = document.createElement('p');
    const em = document.createElement('em');
    em.textContent = 'You can change your privacy settings anytime in the extension options.';
    noteP.appendChild(em);
    note.appendChild(noteP);

    body.appendChild(h3);
    body.appendChild(intro);
    body.appendChild(section1);
    body.appendChild(section2);
    body.appendChild(compliance);
    body.appendChild(note);

    // Footer
    const footer = document.createElement('div');
    footer.className = 'lb-consent-footer';

    const actions = document.createElement('div');
    actions.className = 'lb-consent-actions';

    const acceptBtn = document.createElement('button');
    acceptBtn.id = 'lb-consent-accept';
    acceptBtn.className = 'lb-consent-btn lb-consent-btn-primary';
    acceptBtn.textContent = '✓ Accept & Continue';

    const declineBtn = document.createElement('button');
    declineBtn.id = 'lb-consent-decline';
    declineBtn.className = 'lb-consent-btn lb-consent-btn-secondary';
    declineBtn.textContent = 'Decline (Limited Features)';

    actions.appendChild(acceptBtn);
    actions.appendChild(declineBtn);

    const links = document.createElement('div');
    links.className = 'lb-consent-links';
    const policyLink = document.createElement('a');
    policyLink.href = privacyPolicyUrl;
    policyLink.target = '_blank';
    policyLink.className = 'lb-consent-link';
    policyLink.textContent = 'Read Full Privacy Policy';
    links.appendChild(policyLink);

    footer.appendChild(actions);
    footer.appendChild(links);

    // Assemble
    modal.appendChild(header);
    modal.appendChild(body);
    modal.appendChild(footer);
    overlay.appendChild(modal);
    this.modalContainer.appendChild(overlay);
  }
  injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      #lb-privacy-consent-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .lb-consent-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.75);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        animation: lb-fadeIn 0.3s ease;
      }

      @keyframes lb-fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      .lb-consent-modal {
        background: white;
        border-radius: 16px;
        max-width: 600px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        animation: lb-slideUp 0.4s ease;
      }

      @keyframes lb-slideUp {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .lb-consent-header {
        text-align: center;
        padding: 32px 32px 24px;
        background: linear-gradient(135deg, #742a69 0%, #f37030 80%, #ffc755 100%);
        color: white;
        border-radius: 16px 16px 0 0;
      }

      .lb-consent-logo {
        width: 56px;
        height: 56px;
        margin-bottom: 16px;
        filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
      }

      .lb-consent-header h2 {
        margin: 0 0 8px;
        font-size: 28px;
        font-weight: 700;
      }

      .lb-consent-subtitle {
        margin: 0;
        font-size: 16px;
        opacity: 0.95;
      }

      .lb-consent-body {
        padding: 32px;
        color: #333;
      }

      .lb-consent-body h3 {
        margin: 0 0 16px;
        font-size: 22px;
        color: #742a69;
      }

      .lb-consent-intro {
        font-size: 16px;
        line-height: 1.6;
        margin-bottom: 24px;
        color: #555;
      }

      .lb-consent-section {
        margin-bottom: 24px;
      }

      .lb-consent-section h4 {
        margin: 0 0 12px;
        font-size: 16px;
        font-weight: 600;
        color: #333;
      }

      .lb-consent-section ul {
        margin: 0;
        padding-left: 24px;
        list-style: disc;
      }

      .lb-consent-section li {
        margin-bottom: 8px;
        line-height: 1.5;
        color: #555;
      }

      .lb-consent-compliance {
        background: #f0f9ff;
        border-left: 4px solid #3b82f6;
        padding: 16px;
        border-radius: 8px;
        margin-bottom: 20px;
      }

      .lb-consent-compliance p {
        margin: 0 0 8px;
        color: #1e40af;
        font-weight: 500;
      }

      .lb-consent-compliance p:last-child {
        margin: 0;
        font-weight: 400;
        color: #1e3a8a;
        font-size: 14px;
      }

      .lb-consent-note {
        padding: 12px;
        background: #fef3c7;
        border-radius: 8px;
        margin-top: 16px;
      }

      .lb-consent-note p {
        margin: 0;
        font-size: 14px;
        color: #92400e;
        text-align: center;
      }

      .lb-consent-footer {
        padding: 24px 32px 32px;
        border-top: 1px solid #e5e7eb;
      }

      .lb-consent-actions {
        display: flex;
        gap: 12px;
        margin-bottom: 16px;
      }

      .lb-consent-btn {
        flex: 1;
        padding: 14px 24px;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        font-family: inherit;
      }

      .lb-consent-btn-primary {
        background: #742a69;
        color: white;
      }

      .lb-consent-btn-primary:hover {
        background: #4a1a45;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(116, 42, 105, 0.4);
      }

      .lb-consent-btn-secondary {
        background: #f3f4f6;
        color: #6b7280;
      }

      .lb-consent-btn-secondary:hover {
        background: #e5e7eb;
      }

      .lb-consent-links {
        text-align: center;
      }

      .lb-consent-link {
        color: #742a69;
        text-decoration: none;
        font-size: 14px;
        font-weight: 500;
        transition: color 0.2s;
      }

      .lb-consent-link:hover {
        color: #4a1a45;
        text-decoration: underline;
      }
    `;
    document.head.appendChild(style);
  }
  setupEventListeners(resolve) {
    const acceptBtn = this.modalContainer.querySelector('#lb-consent-accept');
    const declineBtn = this.modalContainer.querySelector('#lb-consent-decline');

    acceptBtn.addEventListener('click', async () => {
      await this.saveConsent(true);
      this.hasConsented = true;
      this.close();
      resolve(true);
    });

    declineBtn.addEventListener('click', async () => {
      await this.saveConsent(false);
      this.hasConsented = false;
      this.close();
      resolve(false);
    });
  }
  close() {
    if (this.modalContainer) {
      this.modalContainer.style.opacity = '0';
      setTimeout(() => {
        if (this.modalContainer && this.modalContainer.parentNode) {
          this.modalContainer.parentNode.removeChild(this.modalContainer);
        }
        document.body.style.overflow = '';
      }, 300);
    }
  }
}
(async function initPrivacyConsent() {
  // Only show on first run
  const consent = new PrivacyConsent();
  const { given } = await consent.checkConsent();

  if (!given) {
    // Wait for page to load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', async () => {
        await consent.show();
      });
    } else {
      await consent.show();
    }
  }
})();

// Make available globally
window.LanguageBridgePrivacyConsent = PrivacyConsent;
