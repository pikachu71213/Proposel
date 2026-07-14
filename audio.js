class AudioController {
  constructor() {
    this.music = document.getElementById('bg-music');
    this.toggleBtn = document.getElementById('audio-toggle');
    this.isPlaying = false;
    this.heartbeatInterval = null;
    this.audioCtx = null;
    this.heartbeatActive = false;
    this.bpm = 65;
    
    this.initEvents();
  }

  initEvents() {
    this.toggleBtn.addEventListener('click', () => this.toggleMusic());
    
    // Low music volume by default to prevent sudden noise
    this.music.volume = 0.5;
  }

  initAudioContext() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  toggleMusic() {
    this.initAudioContext();
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  play() {
    this.initAudioContext();
    this.music.play().then(() => {
      this.isPlaying = true;
      this.toggleBtn.classList.add('playing');
      
      // Fade music in slowly
      gsap.to(this.music, { volume: 0.5, duration: 2 });
    }).catch(err => {
      console.log("Audio autoplay prevented, waiting for user gesture.", err);
    });
  }

  pause() {
    this.isPlaying = false;
    this.toggleBtn.classList.remove('playing');
    
    // Fade out then pause
    gsap.to(this.music, { 
      volume: 0, 
      duration: 0.8,
      onComplete: () => {
        if (!this.isPlaying) this.music.pause();
      }
    });
  }

  swellMusic() {
    // Swell music volume for the YES celebration
    if (this.isPlaying) {
      gsap.to(this.music, { volume: 0.9, duration: 1.5 });
    }
  }

  // Heartbeat Synthesizer using Web Audio API (Organic, zero-lag, no external files)
  playHeartbeatNode(freq, duration, gainValue) {
    if (!this.audioCtx) return;
    
    const osc = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();
    const filter = this.audioCtx.createBiquadFilter();
    
    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);
    
    // Low heartbeat frequency
    osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
    osc.type = 'sine';
    
    // Lowpass filter to make it sound muffled and organic like a real heart
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(80, this.audioCtx.currentTime);
    
    // Gain envelope (fade out)
    gainNode.gain.setValueAtTime(gainValue, this.audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);
    
    osc.start();
    osc.stop(this.audioCtx.currentTime + duration);
  }

  triggerHeartbeatDoublet() {
    this.initAudioContext();
    if (!this.audioCtx) return;

    // Double beat: "lub-dub"
    // "Lub" - lower frequency, slightly longer
    this.playHeartbeatNode(55, 0.18, 0.6);
    
    // "Dub" - slightly higher frequency, after short delay
    setTimeout(() => {
      if (this.heartbeatActive) {
        this.playHeartbeatNode(62, 0.14, 0.55);
      }
    }, 150);
  }

  startHeartbeat(targetBpm = 65) {
    if (this.heartbeatActive) return;
    this.heartbeatActive = true;
    this.bpm = targetBpm;
    this.initAudioContext();
    
    const runHeartbeat = () => {
      if (!this.heartbeatActive) return;
      this.triggerHeartbeatDoublet();
      
      const intervalMs = (60 / this.bpm) * 1000;
      this.heartbeatInterval = setTimeout(runHeartbeat, intervalMs);
    };

    runHeartbeat();
  }

  stopHeartbeat() {
    this.heartbeatActive = false;
    if (this.heartbeatInterval) {
      clearTimeout(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  setHeartbeatBpm(newBpm) {
    this.bpm = newBpm;
  }
}

// Global declaration
let audioController;
window.addEventListener('DOMContentLoaded', () => {
  audioController = new AudioController();
});
