/**
 * LanguageBridge - Text Highlighter
 */

class Highlighter {
    constructor() {
      this.currentHighlight = null;
      this.highlightColor = '#ffc755'; // Gold
      this.init();
    }
  
    init() {
      if (!document.getElementById('lb-highlight-styles')) {
        const style = document.createElement('style');
        style.id = 'lb-highlight-styles';
        style.textContent = `
          .lb-text-highlight {
            background-color: rgba(255, 199, 85, 0.3) !important;
            border-radius: 2px !important;
            padding: 2px 0 !important;
            transition: background-color 0.3s ease !important;
          }
  
          .lb-element-highlight {
            outline: 3px solid #ffc755 !important;
            outline-offset: 2px !important;
            border-radius: 4px !important;
            position: relative !important;
          }
  
          .lb-element-highlight::before {
            content: '';
            position: absolute;
            inset: -6px;
            border: 2px solid rgba(255, 199, 85, 0.3);
            border-radius: 6px;
            pointer-events: none;
            animation: highlight-shimmer 2s infinite;
          }
  
          @keyframes highlight-shimmer {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 1; }
          }
  
          .lb-focus-indicator {
            position: fixed;
            pointer-events: none;
            border: 3px solid #ffc755;
            border-radius: 8px;
            box-shadow: 0 0 0 4px rgba(255, 199, 85, 0.2);
            z-index: 9997;
            transition: all 0.2s ease;
          }
  
          @keyframes pulse-border {
            0%, 100% { 
              border-color: #ffc755;
              box-shadow: 0 0 0 4px rgba(255, 199, 85, 0.2);
            }
            50% {
              border-color: #f37030;
              box-shadow: 0 0 0 8px rgba(255, 199, 85, 0.1);
            }
          }
  
          .lb-focus-indicator.pulse {
            animation: pulse-border 1.5s infinite;
          }
        `;
        document.head.appendChild(style);
      }
    }
  
        // highlightElement
    highlightElement(element, options = {}) {
      if (!element) return;
      this.removeHighlight();
  
      const {
        pulse = false,
        scroll = true,
        duration = 0 // 0 = permanent until removed
      } = options;
      element.classList.add('lb-element-highlight');
      this.currentHighlight = element;
      const indicator = this.createFocusIndicator(element);
      if (pulse) {
        indicator.classList.add('pulse');
      }
  
      // Scroll into view if needed
      if (scroll) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
      }
  
      // Auto-remove after duration
      if (duration > 0) {
        setTimeout(() => {
          this.removeHighlight();
        }, duration);
      }
    }
  
        // createFocusIndicator
    createFocusIndicator(element) {
      const existing = document.getElementById('lb-focus-indicator');
      if (existing) existing.remove();
  
      const indicator = document.createElement('div');
      indicator.id = 'lb-focus-indicator';
      indicator.className = 'lb-focus-indicator';
      
      this.updateIndicatorPosition(indicator, element);
      document.body.appendChild(indicator);
      const updatePosition = () => this.updateIndicatorPosition(indicator, element);
      window.addEventListener('scroll', updatePosition);
      window.addEventListener('resize', updatePosition);
  
      // Store cleanup function
      indicator._cleanup = () => {
        window.removeEventListener('scroll', updatePosition);
        window.removeEventListener('resize', updatePosition);
      };
  
      return indicator;
    }
    updateIndicatorPosition(indicator, element) {
      if (!element || !indicator) return;
  
      const rect = element.getBoundingClientRect();
      indicator.style.left = `${rect.left}px`;
      indicator.style.top = `${rect.top}px`;
      indicator.style.width = `${rect.width}px`;
      indicator.style.height = `${rect.height}px`;
    }
  
        // highlightSelection
    highlightSelection(selection) {
      if (!selection || selection.rangeCount === 0) return;
  
      const range = selection.getRangeAt(0);
      const span = document.createElement('span');
      span.className = 'lb-text-highlight';
      
      try {
        range.surroundContents(span);
        this.currentHighlight = span;
        setTimeout(() => {
          if (span.parentNode) {
            const parent = span.parentNode;
            while (span.firstChild) {
              parent.insertBefore(span.firstChild, span);
            }
            parent.removeChild(span);
          }
        }, 3000);
      } catch (e) {
        logger.warn('Could not highlight selection:', e);
      }
    }
    removeHighlight() {
      if (this.currentHighlight) {
        this.currentHighlight.classList.remove('lb-element-highlight');
        this.currentHighlight = null;
      }
      document.querySelectorAll('.lb-element-highlight').forEach(el => {
        el.classList.remove('lb-element-highlight');
      });
      const indicator = document.getElementById('lb-focus-indicator');
      if (indicator) {
        if (indicator._cleanup) indicator._cleanup();
        indicator.remove();
      }
      document.querySelectorAll('.lb-text-highlight').forEach(span => {
        const parent = span.parentNode;
        if (parent) {
          while (span.firstChild) {
            parent.insertBefore(span.firstChild, span);
          }
          parent.removeChild(span);
        }
      });
    }
  
        // highlightSequence
    async highlightSequence(elements, interval = 1000) {
      for (const element of elements) {
        this.highlightElement(element, { pulse: true, duration: interval });
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }
  
        // flashHighlight
    async flashHighlight(element, times = 3) {
      for (let i = 0; i < times; i++) {
        this.highlightElement(element, { pulse: false, scroll: false });
        await new Promise(resolve => setTimeout(resolve, 200));
        this.removeHighlight();
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
  
        // getInteractiveElements
    getInteractiveElements() {
      const selectors = [
        'a[href]',
        'button',
        'input',
        'select',
        'textarea',
        '[tabindex]:not([tabindex="-1"])',
        '[contenteditable="true"]'
      ];
  
      return Array.from(document.querySelectorAll(selectors.join(',')))
        .filter(el => {
          // Filter out invisible elements
          const style = window.getComputedStyle(el);
          return style.display !== 'none' && 
                 style.visibility !== 'hidden' &&
                 el.offsetParent !== null;
        });
    }
  
        // navigateInteractive
    navigateInteractive(direction = 'next') {
      const elements = this.getInteractiveElements();
      const currentIndex = elements.indexOf(this.currentHighlight);
      
      let nextIndex;
      if (direction === 'next') {
        nextIndex = currentIndex + 1 >= elements.length ? 0 : currentIndex + 1;
      } else {
        nextIndex = currentIndex - 1 < 0 ? elements.length - 1 : currentIndex - 1;
      }
  
      const nextElement = elements[nextIndex];
      if (nextElement) {
        this.highlightElement(nextElement, { pulse: true });
        return nextElement;
      }
    }
  }
  if (typeof window.Highlighter === 'undefined') {
    window.Highlighter = new Highlighter();
  }