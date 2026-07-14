class ParticleEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.fireworks = [];
    this.active = true;
    
    this.init();
    window.addEventListener('resize', () => this.resize());
  }

  init() {
    this.resize();
    // Pre-populate background with fireflies & ambient petals
    for (let i = 0; i < 20; i++) {
      this.spawnFirefly(true);
    }
    for (let i = 0; i < 10; i++) {
      this.spawnRosePetal(true);
    }
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * window.devicePixelRatio;
    this.canvas.height = this.height * window.devicePixelRatio;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  start() {
    this.active = true;
    this.animate();
  }

  stop() {
    this.active = false;
  }

  // Particle Spawners
  spawnFirefly(randomY = false) {
    this.particles.push({
      type: 'firefly',
      x: Math.random() * this.width,
      y: randomY ? Math.random() * this.height : this.height + 20,
      size: Math.random() * 4 + 2,
      vx: (Math.random() - 0.5) * 0.5,
      vy: -(Math.random() * 0.4 + 0.2),
      alpha: Math.random() * 0.6 + 0.2,
      pulseSpeed: Math.random() * 0.02 + 0.01,
      pulseDir: 1,
      swayRange: Math.random() * 20 + 10,
      swaySpeed: Math.random() * 0.01 + 0.005,
      angle: Math.random() * Math.PI * 2
    });
  }

  spawnRosePetal(randomY = false) {
    this.particles.push({
      type: 'rose',
      x: Math.random() * this.width,
      y: randomY ? Math.random() * this.height : -20,
      size: Math.random() * 12 + 8,
      vx: (Math.random() - 0.3) * 0.8,
      vy: Math.random() * 1.0 + 0.8,
      alpha: Math.random() * 0.5 + 0.5,
      spinSpeed: (Math.random() - 0.5) * 0.03,
      angle: Math.random() * Math.PI * 2,
      swingSpeed: Math.random() * 0.02 + 0.01,
      swingAngle: Math.random() * Math.PI,
      swingRange: Math.random() * 15 + 5
    });
  }

  spawnHeart(x, y, isBurst = false) {
    this.particles.push({
      type: 'heart',
      x: x || Math.random() * this.width,
      y: y || (isBurst ? y : this.height + 20),
      size: isBurst ? Math.random() * 8 + 6 : Math.random() * 14 + 10,
      vx: isBurst ? (Math.random() - 0.5) * 4 : (Math.random() - 0.5) * 0.8,
      vy: isBurst ? -(Math.random() * 3 + 1) : -(Math.random() * 1.2 + 0.6),
      alpha: 1.0,
      life: isBurst ? Math.random() * 40 + 30 : 200,
      maxLife: isBurst ? 70 : 200,
      decay: isBurst ? 0.02 : 0.005,
      rotation: Math.random() * 0.4 - 0.2,
      color: `hsl(${Math.random() * 20 + 345}, 80%, 70%)` // Soft rose to warm pink
    });
  }

  spawnSparkle(x, y) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 6 + 2;
    this.particles.push({
      type: 'sparkle',
      x: x,
      y: y,
      size: Math.random() * 3 + 1.5,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1, // slight gravity bias
      alpha: 1.0,
      decay: Math.random() * 0.03 + 0.015,
      color: Math.random() > 0.3 ? '#D4AF37' : '#FFF8F0' // Gold or Ivory
    });
  }

  spawnLantern() {
    this.particles.push({
      type: 'lantern',
      x: Math.random() * this.width,
      y: this.height + 50,
      w: Math.random() * 12 + 10,
      h: Math.random() * 18 + 14,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -(Math.random() * 0.5 + 0.4),
      alpha: 0.85,
      sway: Math.random() * 0.01 + 0.005,
      angle: Math.random() * Math.PI,
      life: 0
    });
  }

  // Concentrated Triggers
  triggerSealExplosion(x, y) {
    // Large explosion of golden dust & magic sparkles
    for (let i = 0; i < 60; i++) {
      this.spawnSparkle(x, y);
    }
    for (let i = 0; i < 20; i++) {
      this.spawnHeart(x, y, true);
    }
  }

  triggerYesCelebration() {
    // Massive continuous release of petals, hearts, sparkles
    const interval = setInterval(() => {
      if (!this.active) {
        clearInterval(interval);
        return;
      }
      for (let i = 0; i < 3; i++) {
        this.spawnRosePetal();
        this.spawnHeart(Math.random() * this.width, this.height + 20);
      }
    }, 200);

    // Timeout to clear heavy generation after 10 seconds (returns to standard rate)
    setTimeout(() => {
      clearInterval(interval);
    }, 10000);

    // Launch initial fireworks
    this.launchFireworkRing();
  }

  launchFireworkRing() {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        this.fireworks.push({
          x: Math.random() * (this.width - 200) + 100,
          y: Math.random() * (this.height - 300) + 100,
          particles: [],
          exploded: false,
          color: `hsl(${Math.random() * 360}, 100%, 75%)`,
          trailY: this.height,
          targetY: Math.random() * (this.height * 0.5) + 100,
          speed: Math.random() * 8 + 12
        });
      }, i * 400);
    }
  }

  // Draw Functions
  drawHeart(ctx, x, y, size) {
    ctx.beginPath();
    ctx.moveTo(x, y + size / 4);
    ctx.quadraticCurveTo(x, y, x - size / 2, y);
    ctx.quadraticCurveTo(x - size, y, x - size, y + size / 2);
    ctx.quadraticCurveTo(x - size, y + size, x, y + size * 1.5);
    ctx.quadraticCurveTo(x + size, y + size, x + size, y + size / 2);
    ctx.quadraticCurveTo(x + size, y, x + size / 2, y);
    ctx.quadraticCurveTo(x, y, x, y + size / 4);
    ctx.closePath();
  }

  drawRosePetal(ctx, x, y, size, angle, swing) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(1, Math.sin(swing)); // 3D folding simulation
    
    // Draw romantic organic teardrop petal
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-size * 0.8, -size * 0.4, -size * 0.8, size * 0.8, 0, size);
    ctx.bezierCurveTo(size * 0.8, size * 0.8, size * 0.8, -size * 0.4, 0, 0);
    ctx.closePath();
    
    // Gradient fill
    const grad = ctx.createRadialGradient(0, size * 0.5, 2, 0, size * 0.5, size);
    grad.addColorStop(0, '#C2185B'); // vibrant burgundy pink
    grad.addColorStop(1, '#5A1E2D'); // deep burgundy
    ctx.fillStyle = grad;
    ctx.fill();
    
    // Gold highlight on border
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    ctx.restore();
  }

  drawFirefly(ctx, f) {
    ctx.save();
    ctx.globalAlpha = f.alpha;
    
    const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.size * 5);
    grad.addColorStop(0, 'rgba(253, 224, 71, 0.9)');  // Gold candle core
    grad.addColorStop(0.2, 'rgba(253, 200, 50, 0.4)');
    grad.addColorStop(1, 'rgba(253, 200, 50, 0)');
    
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.size * 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawLantern(ctx, l) {
    ctx.save();
    ctx.globalAlpha = l.alpha;
    
    // Soft blur behind lantern (glow)
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'rgba(253, 150, 68, 0.8)';
    
    ctx.translate(l.x, l.y);
    ctx.rotate(Math.sin(l.angle) * 0.05); // slight sway
    
    // Draw Lantern Body
    ctx.beginPath();
    ctx.moveTo(-l.w/2, -l.h/2);
    ctx.lineTo(l.w/2, -l.h/2);
    ctx.lineTo(l.w/2 - 2, l.h/2);
    ctx.lineTo(-l.w/2 + 2, l.h/2);
    ctx.closePath();
    
    const grad = ctx.createLinearGradient(0, -l.h/2, 0, l.h/2);
    grad.addColorStop(0, '#FFEAA7'); // warm white/yellow
    grad.addColorStop(0.6, '#F19066'); // orange candle
    grad.addColorStop(1, '#CF6A87'); // burgundy/purple bottom
    
    ctx.fillStyle = grad;
    ctx.fill();
    
    // Gold frame lines
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    ctx.restore();
  }

  // Animation Loop
  animate() {
    if (!this.active) return;
    
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    // Spawn random elements occasionally
    if (Math.random() < 0.015 && this.particles.filter(p => p.type === 'firefly').length < 35) {
      this.spawnFirefly();
    }
    if (Math.random() < 0.01 && this.particles.filter(p => p.type === 'rose').length < 25) {
      this.spawnRosePetal();
    }
    if (Math.random() < 0.005 && this.particles.filter(p => p.type === 'lantern').length < 15) {
      this.spawnLantern();
    }

    // Process general particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      
      if (p.type === 'firefly') {
        p.angle += p.swaySpeed;
        p.x += Math.sin(p.angle) * 0.15 + p.vx;
        p.y += p.vy;
        
        // Pulse alpha
        p.alpha += p.pulseSpeed * p.pulseDir;
        if (p.alpha > 0.8) p.pulseDir = -1;
        if (p.alpha < 0.2) p.pulseDir = 1;
        
        this.drawFirefly(this.ctx, p);
        
        // Remove offscreen
        if (p.y < -10 || p.x < -10 || p.x > this.width + 10) {
          this.particles.splice(i, 1);
        }
      } 
      else if (p.type === 'rose') {
        p.angle += p.spinSpeed;
        p.swingAngle += p.swingSpeed;
        p.x += Math.sin(p.swingAngle) * 0.3 + p.vx;
        p.y += p.vy;
        
        this.drawRosePetal(this.ctx, p.x, p.y, p.size, p.angle, p.swingAngle);
        
        if (p.y > this.height + 20 || p.x < -20 || p.x > this.width + 20) {
          this.particles.splice(i, 1);
        }
      } 
      else if (p.type === 'heart') {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
        
        this.ctx.save();
        this.ctx.globalAlpha = p.alpha;
        this.ctx.strokeStyle = p.color;
        this.ctx.fillStyle = p.color;
        this.ctx.lineWidth = 1.5;
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = p.color;
        
        this.drawHeart(this.ctx, p.x, p.y, p.size);
        this.ctx.fill();
        this.ctx.restore();
        
        if (p.alpha <= 0 || p.y < -30) {
          this.particles.splice(i, 1);
        }
      } 
      else if (p.type === 'sparkle') {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05; // gravity
        p.alpha -= p.decay;
        
        this.ctx.save();
        this.ctx.globalAlpha = p.alpha;
        this.ctx.fillStyle = p.color;
        this.ctx.shadowBlur = 8;
        this.ctx.shadowColor = p.color;
        
        // Draw standard star shape
        this.ctx.beginPath();
        const rOuter = p.size;
        const rInner = p.size / 2;
        let rot = Math.PI / 2 * 3;
        let x = p.x;
        let y = p.y;
        const step = Math.PI / 4;
        
        this.ctx.moveTo(p.x, p.y - rOuter);
        for (let j = 0; j < 8; j++) {
          x = p.x + Math.cos(rot) * (j % 2 === 0 ? rOuter : rInner);
          y = p.y + Math.sin(rot) * (j % 2 === 0 ? rOuter : rInner);
          this.ctx.lineTo(x, y);
          rot += step;
        }
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.restore();
        
        if (p.alpha <= 0) {
          this.particles.splice(i, 1);
        }
      }
      else if (p.type === 'lantern') {
        l = p;
        l.angle += l.sway;
        l.x += Math.sin(l.angle) * 0.12 + l.vx;
        l.y += l.vy;
        
        // Fade in from bottom, fade out near top
        if (l.y > this.height - 100) {
          l.alpha = Math.min(0.85, l.alpha + 0.02);
        } else if (l.y < 150) {
          l.alpha = Math.max(0, l.alpha - 0.01);
        }
        
        this.drawLantern(this.ctx, l);
        
        if (l.y < -50 || l.alpha <= 0) {
          this.particles.splice(i, 1);
        }
      }
    }

    // Process fireworks
    for (let i = this.fireworks.length - 1; i >= 0; i--) {
      const f = this.fireworks[i];
      if (!f.exploded) {
        // Rocket phase
        f.trailY -= f.speed;
        
        // Draw rocket path
        this.ctx.fillStyle = '#FFF8F0';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#D4AF37';
        this.ctx.beginPath();
        this.ctx.arc(f.x, f.trailY, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        if (f.trailY <= f.targetY) {
          f.exploded = true;
          // Spawn explosion particles
          const burstSize = 40;
          for (let j = 0; j < burstSize; j++) {
            const angle = (Math.PI * 2 / burstSize) * j + (Math.random() - 0.5) * 0.2;
            const speed = Math.random() * 5 + 3;
            f.particles.push({
              x: f.x,
              y: f.trailY,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              alpha: 1.0,
              decay: Math.random() * 0.02 + 0.015,
              color: f.color
            });
          }
        }
      } else {
        // Explosion phase
        let alive = false;
        for (let j = f.particles.length - 1; j >= 0; j--) {
          const fp = f.particles[j];
          fp.x += fp.vx;
          fp.y += fp.vy;
          fp.vy += 0.04; // gravity
          fp.alpha -= fp.decay;
          
          if (fp.alpha > 0) {
            alive = true;
            this.ctx.save();
            this.ctx.globalAlpha = fp.alpha;
            this.ctx.fillStyle = fp.color;
            this.ctx.shadowBlur = 12;
            this.ctx.shadowColor = fp.color;
            this.ctx.beginPath();
            this.ctx.arc(fp.x, fp.y, 2, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
          }
        }
        if (!alive) {
          this.fireworks.splice(i, 1);
        }
      }
    }
    
    requestAnimationFrame(() => this.animate());
  }
}

// Global declaration so other scripts can bind events
let particles;
window.addEventListener('DOMContentLoaded', () => {
  particles = new ParticleEngine('particle-canvas');
  particles.start();
});
