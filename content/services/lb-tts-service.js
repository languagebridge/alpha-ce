/**
 * LanguageBridge TTS Service
 */

// Voice mapping for Text-to-Speech
const VOICE_MAP = {
  'ur': 'ur-PK-UzmaNeural', 'uk': 'uk-UA-PolinaNeural',
  'ps': 'ps-AF-LatifaNeural', 'fa': 'fa-IR-DilaraNeural',
  'prs': 'fa-IR-DilaraNeural', 'ar': 'ar-SA-ZariyahNeural',
  'so': 'so-SO-UbaxNeural', 'en': 'en-US-JennyNeural',
  'es': 'es-US-PalomaNeural', 'pt': 'pt-BR-FranciscaNeural',
  'fr': 'fr-FR-DeniseNeural', 'zh': 'zh-CN-XiaoxiaoNeural'
};

class LanguageBridgeTTSService {
  constructor() {
    this.core = window.LanguageBridgeAzureCore;
    this.currentAudio = null;
    this.currentResolve = null;
    this.currentAudioUrl = null;
    this.currentFetchController = null;
  }
  async speakText(text, language, options = {}) {
    if (!this.core.checkRateLimit('tts')) {
      throw new Error('Text-to-speech rate limit exceeded. Please wait a moment and try again.');
    }

    // Use Azure proxy for TTS
    return this.speakWithAzureProxy(text, language, options);
  }
  async speakWithAzureProxy(text, language, options = {}) {
    const startTime = Date.now();
    let fetchTimeout = null;
    let timedOut = false;

    try {
      // Prepare request for Azure proxy
      const voice = VOICE_MAP[language] || 'en-US-JennyNeural';

      logger.log(`🎤 Speaking with Azure proxy: ${voice}`);

      const fetchController = new AbortController();
      fetchTimeout = setTimeout(() => {
        timedOut = true;
        fetchController.abort();
      }, 35000);
      this.currentFetchController = fetchController;

      const response = await fetch(this.core.config.netlifyEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: fetchController.signal,
        body: JSON.stringify({
          service: 'speech-synthesis',
          data: {
            text: text,
            language: language,
            voice: voice,
            rate: options.rate || '1.0'
          }
        })
      });

      clearTimeout(fetchTimeout);
      fetchTimeout = null;
      this.currentFetchController = null;

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `TTS request failed: ${response.status}`);
      }

      const result = await response.json();

      // Convert base64 audio to playable audio
      const audioData = result.audio;
      const audioBlob = this.base64ToBlob(audioData, 'audio/mp3');
      const audioUrl = URL.createObjectURL(audioBlob);
      this.currentAudioUrl = audioUrl;

      // Play audio
      await this.playAudio(audioUrl);

      logger.log(`✓ Azure TTS completed via proxy`);

      // Track successful TTS
      window.LanguageBridgeErrorHandler.trackSuccess('tts', {
        charCount: text.length,
        language: language,
        responseTime: Date.now() - startTime
      });

      // Track analytics (async, non-blocking)
      if (window.LanguageBridgeAnalytics) {
        window.LanguageBridgeAnalytics.trackTTS(language, text.length).catch(err => {
          console.warn('Analytics tracking failed:', err.message);
        });
      }

    } catch (error) {
      clearTimeout(fetchTimeout);
      this.currentFetchController = null;

      // Abort errors are either user-initiated (stopSpeaking) or timeout — not real errors
      if (error.name === 'AbortError') {
        if (timedOut && window.LanguageBridgeToolbar) {
          window.LanguageBridgeToolbar.showStatus('Audio service took too long — try again', 'error');
        }
        return;
      }

      logger.error('Azure proxy TTS error:', error);

      window.LanguageBridgeErrorHandler.trackError('tts', {
        charCount: text.length,
        language: language,
        errorMessage: error.message,
        responseTime: Date.now() - startTime
      });

      throw error;
    }
  }

  base64ToBlob(base64, mimeType) {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  playAudio(audioUrl) {
    return new Promise((resolve, reject) => {
      const audio = new Audio(audioUrl);
      this.currentAudio = audio;
      this.currentResolve = resolve;

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        this.currentAudioUrl = null;
        this.currentAudio = null;
        this.currentResolve = null;
        resolve();
      };

      audio.onerror = (error) => {
        URL.revokeObjectURL(audioUrl);
        this.currentAudioUrl = null;
        this.currentAudio = null;
        this.currentResolve = null;
        reject(new Error('Audio playback failed'));
      };

      audio.play().catch(error => {
        URL.revokeObjectURL(audioUrl);
        this.currentAudioUrl = null;
        this.currentAudio = null;
        this.currentResolve = null;
        reject(error);
      });
    });
  }
  stopSpeaking() {
    logger.log('🛑 stopSpeaking called');

    // Cancel any in-flight fetch (user stopped before audio arrived)
    if (this.currentFetchController) {
      this.currentFetchController.abort();
      this.currentFetchController = null;
    }

    // Stop current audio playback
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
        logger.log('✓ Audio playback stopped');
      } catch (error) {
        logger.log('ℹ️ Error stopping audio:', error);
      }
      this.currentAudio = null;
    }

    // Revoke blob URL — onended never fires after pause(), so we must clean up here
    if (this.currentAudioUrl) {
      URL.revokeObjectURL(this.currentAudioUrl);
      this.currentAudioUrl = null;
    }

    // Resolve pending promise
    if (this.currentResolve) {
      this.currentResolve();
      this.currentResolve = null;
    }

    // Stop browser speech (fallback)
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      logger.log('✓ Browser speech cancelled');
    }

    logger.log('✓ stopSpeaking complete');
  }
  pauseSpeaking() {
    logger.log('⏸️ pauseSpeaking called');

    // Pause current audio
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        logger.log('✓ Audio playback paused');
      } catch (error) {
        logger.log('ℹ️ Error pausing audio:', error);
      }
    }

    // Resolve promise immediately (instant pause recognition)
    if (this.currentResolve) {
      logger.log('✓ Resolving pending speakText promise (instant pause recognition)');
      this.currentResolve();
      this.currentResolve = null;
    }

    // Stop browser speech (fallback)
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      logger.log('✓ Browser speech cancelled (paused)');
    }

    logger.log('✓ pauseSpeaking complete');
  }
}

// Export to global namespace
window.LanguageBridgeTTSService = new LanguageBridgeTTSService();
