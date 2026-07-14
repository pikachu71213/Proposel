class AudioController {
  constructor() {
    this.toggleBtn = document.getElementById('audio-toggle');
    this.isPlaying = false;
    this.heartbeatInterval = null;
    this.audioCtx = null;
    this.heartbeatActive = false;
    this.bpm = 65;
    
    this.playerReady = false;
    this.player = null;
    
    this.initYouTubePlayer();
    this.initEvents();
  }

  initYouTubePlayer() {
    // Dynamically load YouTube API
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    
    window.onYouTubeIframeAPIReady = () => {
      this.player = new YT.Player('bg-music-player', {
        height: '1',
        width: '1',
        videoId: 'DT9fEmSL_Lw',
        playerVars: {
          'autoplay': 0,
          'loop': 1,
          'playlist': 'DT9fEmSL_Lw',
          'start': 30,
          'controls': 0,
          'disablekb': 1,
          'fs': 0,
          'modestbranding': 1,
          'rel': 0,
          'showinfo': 0
        },
        events: {
          'onReady': () => {
            this.playerReady = true;
            this.player.setVolume(50);
            this.player.seekTo(30, true);
          },
          'onStateChange': (event) => {
            if (event.data === YT.PlayerState.ENDED) {
              this.player.seekTo(30, true);
              this.player.playVideo();
            }
          }
        }
      });
    };
  }

  initEvents() {
    this.toggleBtn.addEventListener('click', () => this.toggleMusic());
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
    if (this.playerReady && this.player) {
      if (this.player.getCurrentTime() < 30) {
        this.player.seekTo(30, true);
      }
      this.player.playVideo();
      this.isPlaying = true;
      this.toggleBtn.classList.add('playing');
      
      // Fade music in slowly
      let vol = { value: 0 };
      this.player.setVolume(0);
      gsap.to(vol, {
        value: 50,
        duration: 2.0,
        onUpdate: () => {
          if (this.isPlaying) this.player.setVolume(vol.value);
        }
      });
    } else {
      setTimeout(() => this.play(), 200);
    }
  }

  pause() {
    this.isPlaying = false;
    this.toggleBtn.classList.remove('playing');
    
    if (this.playerReady && this.player) {
      let vol = { value: this.player.getVolume() };
      gsap.to(vol, { 
        value: 0, 
        duration: 0.8,
        onUpdate: () => {
          this.player.setVolume(vol.value);
        },
        onComplete: () => {
          if (!this.isPlaying) this.player.pauseVideo();
        }
      });
    }
  }

  swellMusic() {
    if (this.isPlaying && this.playerReady && this.player) {
      let vol = { value: this.player.getVolume() };
      gsap.to(vol, {
        value: 90,
        duration: 1.5,
        onUpdate: () => {
          this.player.setVolume(vol.value);
        }
      });
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
