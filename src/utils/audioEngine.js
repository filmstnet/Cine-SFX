class SFXAudioEngine {
  constructor() {
    this.ctx = null;
    this.currentSource = null;
    this.gainNode = null;
    this.bufferCache = new Map();
    this.isPlaying = false;
    this.startTime = 0;
    this.pauseOffset = 0;
    this.activeDuration = 0;
    this.pitchSemitones = 0;
    this.isReversed = false;
    this.masterVolume = 0.8;
    this.onTimeUpdate = null;
    this.onEnded = null;
    this.onBufferLoaded = null; // Notify UI of actual duration & real peaks!
    this.animFrame = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
      this.gainNode.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(val) {
    this.masterVolume = Math.max(0, Math.min(1, val));
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
    }
  }

  setPitch(semitones) {
    this.pitchSemitones = semitones;
    if (this.currentSource && this.ctx) {
      const rate = Math.pow(2, this.pitchSemitones / 12);
      this.currentSource.playbackRate.setValueAtTime(rate, this.ctx.currentTime);
    }
  }

  setReverse(isRev) {
    this.isReversed = isRev;
  }

  extractPeaks(audioBuffer, numPeaks = 48) {
    const channelData = audioBuffer.getChannelData(0);
    const peaks = [];
    const step = Math.floor(channelData.length / numPeaks);
    for (let i = 0; i < numPeaks; i++) {
      let max = 0;
      const start = i * step;
      const end = Math.min(start + step, channelData.length);
      for (let j = start; j < end; j += 4) {
        const val = Math.abs(channelData[j]);
        if (val > max) max = val;
      }
      peaks.push(Math.max(0.06, Math.min(1.0, max)));
    }
    return peaks;
  }

  async loadBuffer(filePath, fileObject = null) {
    this.init();
    if (this.bufferCache.has(filePath)) {
      return this.bufferCache.get(filePath);
    }

    try {
      let arrayBuffer = null;

      // 1. Direct IPC buffer transfer (Electron - fastest, 100% reliable)
      if (window.electronAPI && window.electronAPI.readFileBuffer) {
        const uint8Array = await window.electronAPI.readFileBuffer(filePath);
        if (uint8Array && uint8Array.byteLength > 0) {
          arrayBuffer = uint8Array.buffer.slice(
            uint8Array.byteOffset,
            uint8Array.byteOffset + uint8Array.byteLength
          );
        }
      }

      // 2. Direct browser File object (if selected via input in web mode)
      if (!arrayBuffer && fileObject) {
        arrayBuffer = await fileObject.arrayBuffer();
      }

      // 3. Fallback to protocol fetch
      if (!arrayBuffer) {
        const url = window.electronAPI ? window.electronAPI.getAudioUrl(filePath) : filePath;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        arrayBuffer = await response.arrayBuffer();
      }

      // Decode into native audio buffer
      const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
      this.bufferCache.set(filePath, audioBuffer);

      // Extract real waveform peaks
      const realPeaks = this.extractPeaks(audioBuffer, 52);
      if (this.onBufferLoaded) {
        this.onBufferLoaded(filePath, audioBuffer.duration, realPeaks);
      }

      return audioBuffer;
    } catch (err) {
      console.error('Audio decode error for:', filePath, err);
      return null;
    }
  }

  reverseBuffer(buffer) {
    const reversed = this.ctx.createBuffer(
      buffer.numberOfChannels,
      buffer.length,
      buffer.sampleRate
    );
    for (let c = 0; c < buffer.numberOfChannels; c++) {
      const src = buffer.getChannelData(c);
      const dst = reversed.getChannelData(c);
      for (let i = 0; i < src.length; i++) {
        dst[i] = src[src.length - 1 - i];
      }
    }
    return reversed;
  }

  async play(sound, startOffsetSec = 0) {
    this.stop();
    this.init();

    if (!sound) return;

    let buffer = await this.loadBuffer(sound.filePath, sound._fileObject);

    if (buffer) {
      try {
        if (this.isReversed) {
          buffer = this.reverseBuffer(buffer);
        }

        const source = this.ctx.createBufferSource();
        source.buffer = buffer;

        const rate = Math.pow(2, this.pitchSemitones / 12);
        source.playbackRate.setValueAtTime(rate, this.ctx.currentTime);

        source.connect(this.gainNode);

        const effectiveDuration = buffer.duration / rate;
        this.activeDuration = effectiveDuration;
        this.startTime = this.ctx.currentTime - (startOffsetSec / rate);
        this.currentSource = source;
        this.isPlaying = true;

        source.onended = () => {
          if (this.currentSource === source) {
            this.isPlaying = false;
            if (this.animFrame) cancelAnimationFrame(this.animFrame);
            if (this.onEnded) this.onEnded();
          }
        };

        source.start(0, Math.min(startOffsetSec, buffer.duration));
        this.startProgressTracker();
        return;
      } catch (webaudioErr) {
        console.warn('Web Audio playback error, falling back to HTML5 Audio:', webaudioErr);
      }
    }

    // Fallback: Native HTML5 Audio element (plays any format supported by OS)
    try {
      const audioUrl = window.electronAPI 
        ? window.electronAPI.getAudioUrl(sound.filePath) 
        : sound.filePath;

      const audio = new Audio(audioUrl);
      audio.volume = this.masterVolume;
      audio.currentTime = startOffsetSec;
      this.htmlAudio = audio;
      this.isPlaying = true;

      audio.ontimeupdate = () => {
        if (this.onTimeUpdate && audio.duration > 0) {
          this.onTimeUpdate(audio.currentTime, Math.min(1, audio.currentTime / audio.duration));
        }
      };

      audio.onended = () => {
        this.isPlaying = false;
        if (this.onEnded) this.onEnded();
      };

      await audio.play();
    } catch (fallbackErr) {
      console.error('All audio playback methods failed for:', sound.name, fallbackErr);
      this.isPlaying = false;
      if (this.onEnded) this.onEnded();
    }
  }

  stop() {
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch (e) {}
      this.currentSource = null;
    }
    if (this.htmlAudio) {
      try {
        this.htmlAudio.pause();
        this.htmlAudio.src = '';
      } catch (e) {}
      this.htmlAudio = null;
    }
    this.isPlaying = false;
  }

  startProgressTracker() {
    const track = () => {
      if (!this.isPlaying || !this.ctx) return;
      const rate = Math.pow(2, this.pitchSemitones / 12);
      const elapsed = (this.ctx.currentTime - this.startTime) * rate;
      if (this.onTimeUpdate && this.activeDuration > 0) {
        const progress = Math.min(1, Math.max(0, elapsed / (this.activeDuration * rate)));
        this.onTimeUpdate(elapsed, progress);
      }
      if (this.isPlaying) {
        this.animFrame = requestAnimationFrame(track);
      }
    };
    this.animFrame = requestAnimationFrame(track);
  }
}

export const audioEngine = new SFXAudioEngine();
