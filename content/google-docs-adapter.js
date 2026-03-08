/**
 * Google Docs Adapter
 */
// logger is available globally via window object (loaded from utils/logger.js)

class GoogleDocsAdapter {
  constructor() {
    this.isGoogleDocs = this.detectGoogleDocs();
    this.editorIframe = null;
    this.lastSelection = '';
    this.selectionCallback = null;

    if (this.isGoogleDocs) {
      logger.log('📄 Google Docs detected - initializing adapter');
      this.init();
    }
  }

  detectGoogleDocs() {
    // Check if we're on a Google Docs URL
    const url = window.location.href;
    const isGoogleDocsUrl = url.includes('docs.google.com/document');

    if (isGoogleDocsUrl) {
      logger.log('✓ Google Docs URL detected');
    }

    return isGoogleDocsUrl;
  }

  async init() {
    // Set up selection monitoring (permission-free best-effort)
    // Students paste text into the toolbar input for reliable translation
    await this.waitForEditorIframe();
    this.setupSelectionMonitoring();
  }
  async waitForEditorIframe() {
    const maxAttempts = 20;
    let attempts = 0;

    while (attempts < maxAttempts) {
      const iframe = document.querySelector('.docs-texteventtarget-iframe');

      if (iframe && iframe.contentDocument) {
        this.editorIframe = iframe;
        return;
      }

      // Wait 500ms before next attempt
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    }
  }
  setupSelectionMonitoring() {
    this._selectionHandler = () => setTimeout(() => this.handleSelectionChange(), 50);
    this._mouseupHandler = () => {
      logger.log('📝 Mouse up detected in Google Docs');
      setTimeout(() => this.handleSelectionChange(), 150);
    };

    document.addEventListener('selectionchange', this._selectionHandler);
    document.addEventListener('mouseup', this._mouseupHandler);

    // Monitor the Kix editor (Google Docs' internal editor)
    this._kixContainer = document.querySelector('.kix-appview-editor');
    if (this._kixContainer) {
      logger.log('✓ Found Kix editor container, adding mouseup listener');
      this._kixContainer.addEventListener('mouseup', this._mouseupHandler);
    }

    // Also try the page container
    this._pageContainer = document.querySelector('.kix-paginateddocumentplugin');
    if (this._pageContainer) {
      logger.log('✓ Found page container, adding mouseup listener');
      this._pageContainer.addEventListener('mouseup', this._mouseupHandler);
    }

    logger.log('✓ Google Docs selection monitoring active');
  }

  cleanup() {
    if (this._selectionHandler) {
      document.removeEventListener('selectionchange', this._selectionHandler);
    }
    if (this._mouseupHandler) {
      document.removeEventListener('mouseup', this._mouseupHandler);
      if (this._kixContainer) {
        this._kixContainer.removeEventListener('mouseup', this._mouseupHandler);
      }
      if (this._pageContainer) {
        this._pageContainer.removeEventListener('mouseup', this._mouseupHandler);
      }
    }
  }

  handleSelectionChange() {
    logger.log('🔍 handleSelectionChange called');

    const selection = this.getSelectedText();
    logger.log(`🔍 Selected text: "${selection ? selection.substring(0, 50) : 'none'}..."`);
    logger.log(`🔍 Last selection: "${this.lastSelection ? this.lastSelection.substring(0, 50) : 'none'}..."`);

    if (selection && selection !== this.lastSelection && selection.length > 0) {
      this.lastSelection = selection;
      logger.log(`📝 Google Docs selection: "${selection.substring(0, 50)}..."`);

      if (this.selectionCallback) {
        logger.log('✓ Calling selection callback');
        this.selectionCallback(selection);
      } else {
        logger.warn('⚠️ No selection callback registered');
      }
    } else {
      if (!selection) {
        logger.log('⚠️ No selection text extracted');
      } else if (selection === this.lastSelection) {
        logger.log('⚠️ Same selection as before, ignoring');
      }
    }
  }

    // getSelectedText
  getSelectedText() {
    const selection = window.getSelection();

    logger.log(`🔍 getSelectedText - rangeCount: ${selection?.rangeCount || 0}`);

    if (!selection || selection.rangeCount === 0) {
      logger.log('⚠️ No selection or no ranges');
      return '';
    }

    try {
      const range = selection.getRangeAt(0);

      // Method 1: Try standard toString
      let text = selection.toString().trim();
      logger.log(`🔍 Method 1 (toString): "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);

      // Method 2: Try extracting text content from range
      if (!text) {
        logger.log('🔍 Method 2: Extracting from range contents');
        const contents = range.cloneContents();
        text = contents.textContent?.trim() || '';
        logger.log(`🔍 Method 2 result: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
      }

      // Method 3: Walk through the range and extract text nodes
      if (!text) {
        logger.log('🔍 Method 3: Walking through text nodes');
        text = this.extractTextFromRange(range);
        logger.log(`🔍 Method 3 result: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
      }

      // Method 4: Look for Kix text blocks
      if (!text) {
        logger.log('🔍 Method 4: Searching for Kix elements');
        text = this.extractTextFromKix(range);
        logger.log(`🔍 Method 4 result: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
      }

      return text;
    } catch (error) {
      logger.error('Error getting selected text:', error);
      return '';
    }
  }
  extractTextFromRange(range) {
    try {
      const textNodes = [];
      const walker = document.createTreeWalker(
        range.commonAncestorContainer,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            if (range.intersectsNode(node)) {
              return NodeFilter.FILTER_ACCEPT;
            }
            return NodeFilter.FILTER_REJECT;
          }
        }
      );

      let node;
      while (node = walker.nextNode()) {
        const text = node.textContent;
        if (text && text.trim()) {
          textNodes.push(text);
        }
      }

      const result = textNodes.join(' ').trim();
      logger.log(`🔍 Found ${textNodes.length} text nodes`);
      return result;
    } catch (error) {
      logger.warn('Error walking text nodes:', error);
      return '';
    }
  }
  extractTextFromKix(range) {
    try {
      const container = range.commonAncestorContainer;

      // If it's a text node, get parent element
      let searchElement = container.nodeType === Node.TEXT_NODE
        ? container.parentElement
        : container;

      logger.log(`🔍 Searching in element:`, searchElement);

      // Look for Kix text blocks in the container
      let kixElements = [];

      // Try different selectors
      const selectors = [
        '.kix-lineview-text-block',
        '.kix-wordhtmlgenerator-word-node',
        '[role="textbox"] span'
      ];

      for (const selector of selectors) {
        if (searchElement.querySelectorAll) {
          kixElements = Array.from(searchElement.querySelectorAll(selector));
          if (kixElements.length > 0) {
            logger.log(`✓ Found ${kixElements.length} elements with selector: ${selector}`);
            break;
          }
        }
      }
      if (kixElements.length > 0) {
        const textBlocks = kixElements
          .filter(el => range.intersectsNode(el))
          .map(el => el.textContent)
          .filter(text => text && text.trim());

        logger.log(`✓ Extracted ${textBlocks.length} text blocks from Kix elements`);
        return textBlocks.join(' ').trim();
      }

      // Fallback: get all text from the range container
      const allText = searchElement.textContent?.trim() || '';
      logger.log(`⚠️ Fallback: using container textContent (${allText.length} chars)`);
      return allText;
    } catch (error) {
      logger.warn('Error extracting Kix text:', error);
      return '';
    }
  }
  onTextSelected(callback) {
    this.selectionCallback = callback;
  }
  isActive() {
    return this.isGoogleDocs;
  }
}
if (typeof window.GoogleDocsAdapter === 'undefined') {
  window.GoogleDocsAdapter = new GoogleDocsAdapter();
  logger.log('✓ Google Docs Adapter initialized');
}
