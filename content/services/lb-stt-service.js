/**
 * LanguageBridge STT Service
 */

// Locale mapping for speech recognition
const LOCALE_MAP = {
  'ur': 'ur-PK', 'uz': 'uz-UZ', 'uk': 'uk-UA', 'ps': 'ps-AF',
  'fa': 'fa-IR', 'prs': 'fa-IR', 'ar': 'ar-SA', 'en': 'en-US',
  'es': 'es-US', 'pt': 'pt-BR', 'fr': 'fr-FR', 'zh': 'zh-CN'
};

class LanguageBridgeSTTService {
  constructor() {
    this.core = window.LanguageBridgeAzureCore;
    this.recognizer = null;
    this.webRecognition = null;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
  }

  async startSpeechRecognition(language) {
    if (!this.core.checkRateLimit('speechRecognition')) {
      throw new Error('Speech recognition rate limit exceeded. Please wait a moment and try again.');
    }

    const locale = LOCALE_MAP[language] || 'en-US';

    // Use Azure STT via Netlify proxy (higher quality, supports all languages)
    logger.log('🎤 Starting Azure STT via Netlify proxy');
    return this.startNetlifySTTRecognition(locale);
  }

  /**
   * Azure STT via Netlify proxy
   * Records audio chunks and sends to server for transcription
   */
  async startNetlifySTTRecognition(locale) {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.currentStream = stream;
      this.currentLocale = locale;

      const controller = {
        onResult: null,
        onError: null,
        stop: () => this.stopNetlifyRecording()
      };

      // Store controller reference for use in onstop handler
      this.currentController = controller;

      // Set up MediaRecorder to capture audio (use webm for better browser support)
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/wav';
      this.currentMimeType = mimeType;
      this.mediaRecorder = new MediaRecorder(stream, { mimeType });
      this.audioChunks = [];
      this.isRecording = true;

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        logger.log('🎤 Recording stopped, processing audio...');
        this.isRecording = false;

        // Stop all audio tracks
        if (this.currentStream) {
          this.currentStream.getTracks().forEach(track => track.stop());
        }

        // Check if we have audio data
        if (this.audioChunks.length === 0) {
          logger.warn('⚠️ No audio data recorded');
          if (this.currentController?.onError) {
            this.currentController.onError('No audio recorded');
          }
          return;
        }

        // Combine audio chunks into a single blob
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });
        logger.log(`✓ Audio blob created: ${(audioBlob.size / 1024).toFixed(1)} KB`);

        // Convert blob to base64 for transmission
        try {
          // Try to convert to WAV for better Azure compatibility
          let finalBlob = audioBlob;
          let finalMimeType = this.currentMimeType;

          const wavBlob = await this.convertToWav(audioBlob);
          if (wavBlob) {
            finalBlob = wavBlob;
            finalMimeType = 'audio/wav';
            logger.log(`✓ Converted to WAV: ${(wavBlob.size / 1024).toFixed(1)} KB`);
          }

          const base64Audio = await this.blobToBase64(finalBlob);
          logger.log('✓ Audio converted to base64, sending to Azure STT...');

          // Send to Netlify proxy for Azure STT processing
          const fetchController = new AbortController();
          let timedOut = false;
          const fetchTimeout = setTimeout(() => {
            timedOut = true;
            fetchController.abort();
          }, 35000);

          const response = await fetch(this.core.config.netlifyEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            signal: fetchController.signal,
            body: JSON.stringify({
              service: 'speech-recognition',
              data: {
                audioData: base64Audio,
                language: this.currentLocale,
                mimeType: finalMimeType
              }
            })
          });

          clearTimeout(fetchTimeout);

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`STT error: ${response.status} - ${errorText}`);
          }

          const result = await response.json();
          logger.log('✓ Azure STT response:', result);

          // Call onResult with final transcription
          if (this.currentController?.onResult && result.text) {
            this.currentController.onResult(result.text, true);
          } else if (!result.text) {
            logger.warn('⚠️ No text in STT response');
            if (this.currentController?.onError) {
              this.currentController.onError('No speech detected');
            }
          }
        } catch (error) {
          if (error.name === 'AbortError') {
            const msg = timedOut
              ? 'Speech service took too long — please try again'
              : 'Speech recognition cancelled';
            logger.warn('⚠️ STT fetch aborted:', msg);
            if (this.currentController?.onError) {
              this.currentController.onError(msg);
            }
            return;
          }
          logger.error('❌ Azure STT error:', error);
          if (this.currentController?.onError) {
            this.currentController.onError(error.message);
          }
        }
      };

      // Start recording - collect data every 250ms for smoother processing
      this.mediaRecorder.start(250);
      logger.log('✓ Recording started (Azure STT via Netlify)');

      return controller;
    } catch (error) {
      if (this.currentStream) {
        this.currentStream.getTracks().forEach(track => track.stop());
        this.currentStream = null;
      }
      logger.error('❌ Microphone access error:', error);
      let msg = 'Microphone error — tap to retry';
      if (error.name === 'NotAllowedError') {
        msg = 'Microphone blocked — click the 🔒 in your address bar to allow';
      } else if (error.name === 'NotFoundError') {
        msg = 'No microphone found — please connect one and try again';
      }
      if (window.LanguageBridgeToolbar) {
        window.LanguageBridgeToolbar.showStatus(msg, 'error');
      }
      throw new Error(msg);
    }
  }

  /**
   * Convert Blob to base64 string
   */
  blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Remove the data URL prefix (e.g., "data:audio/webm;base64,")
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Convert audio blob to WAV format for better Azure compatibility
   * Azure STT REST API works best with 16kHz mono PCM WAV
   */
  async convertToWav(audioBlob) {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Convert to mono 16kHz
      const numChannels = 1;
      const sampleRate = 16000;
      const length = audioBuffer.duration * sampleRate;
      const offlineContext = new OfflineAudioContext(numChannels, length, sampleRate);

      const source = offlineContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(offlineContext.destination);
      source.start();

      const renderedBuffer = await offlineContext.startRendering();
      const wavBlob = this.audioBufferToWav(renderedBuffer);

      await audioContext.close();
      return wavBlob;
    } catch (error) {
      logger.warn('⚠️ WAV conversion failed, using original format:', error.message);
      return null;
    }
  }

  /**
   * Convert AudioBuffer to WAV Blob
   */
  audioBufferToWav(buffer) {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;

    const samples = buffer.getChannelData(0);
    const dataLength = samples.length * bytesPerSample;
    const bufferLength = 44 + dataLength;

    const arrayBuffer = new ArrayBuffer(bufferLength);
    const view = new DataView(arrayBuffer);

    // WAV header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, dataLength, true);

    // Write audio data
    let offset = 44;
    for (let i = 0; i < samples.length; i++) {
      const sample = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  async stopNetlifyRecording() {
    if (this.mediaRecorder && this.isRecording) {
      logger.log('🛑 Stopping recording...');
      this.mediaRecorder.stop();
      // Note: The onstop handler will process the audio and call onResult
    }
  }
  startWebSpeechRecognition(locale) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = locale;
    recognition.maxAlternatives = 1;
    this.webRecognition = recognition;

    const controller = {
      onResult: null,
      onError: null
    };

    recognition.onresult = (event) => {
      const last = event.results.length - 1;
      const text = event.results[last][0].transcript;
      const isFinal = event.results[last].isFinal;

      if (controller.onResult) {
        controller.onResult(text, isFinal);
      }
    };

    recognition.onerror = (event) => {
      if (controller.onError) {
        controller.onError(event.error);
      }
    };

    recognition.start();

    return Promise.resolve(controller);
  }
  async stopSpeechRecognition() {
    // Stop Web Speech API recognition
    if (this.webRecognition) {
      this.webRecognition.stop();
      this.webRecognition = null;
    }

    // Stop Netlify STT recording
    if (this.mediaRecorder && this.isRecording) {
      await this.stopNetlifyRecording();
    }

    // Legacy: Stop Azure SDK recognizer (if present)
    if (this.recognizer) {
      try {
        await this.recognizer.stopContinuousRecognitionAsync();
      } catch (error) {
        logger.warn('Error stopping recognizer:', error);
      }
      this.recognizer = null;
    }
  }
}

// Export to global namespace
window.LanguageBridgeSTTService = new LanguageBridgeSTTService();
