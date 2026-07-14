// Main Controller - Coordination, Scroll Triggers, and Interactive Actions

let invitationScene;
let ringScene;
let lenis;

window.addEventListener('load', () => {
  // 1. Hide Loader
  const loader = document.getElementById('loader');
  gsap.to(loader, {
    opacity: 0,
    duration: 1.0,
    onComplete: () => {
      loader.style.display = 'none';
      // Allow user to see prompt text
      gsap.to('#landing-prompt', { opacity: 1, duration: 1.0, delay: 0.5 });
    }
  });

  // 2. Initialize Three.js Scenes
  invitationScene = new InvitationScene('intro-canvas', 'intro-container');
  ringScene = new RingScene('ring-canvas', 'diamond-ring-wrapper');

  // 3. Set up Raycasting on Wax Seal Touch
  setupSealInteraction();

  // 4. Initialize Scroll Setup
  initScrollAndGSAP();

  // 5. Connect YES Button Actions
  setupYesButton();
});

// Setup click/touch listener for the 3D Wax Seal
function setupSealInteraction() {
  const raycaster = new THREE.Raycaster();
  const ndcMouse = new THREE.Vector2();
  const introContainer = document.getElementById('intro-container');

  const onSealTouch = (e) => {
    // Only detect clicks if the card is not already unfolded
    if (invitationScene.unfolded) return;

    const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;

    // Calculate normalized device coordinates
    ndcMouse.x = (clientX / window.innerWidth) * 2 - 1;
    ndcMouse.y = -(clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(ndcMouse, invitationScene.camera);
    const intersects = raycaster.intersectObject(invitationScene.waxSeal);

    if (intersects.length > 0) {
      // User touched the seal! Play opening sequence
      invitationScene.unfoldInvitation(() => {
        revealMainContent();
      });
    }
  };

  introContainer.addEventListener('mousedown', onSealTouch);
  introContainer.addEventListener('touchstart', onSealTouch, { passive: true });
}

// Transitions from the 3D opening scene to the scrollable romantic landing sections
function revealMainContent() {
  const mainContent = document.getElementById('main-content');
  const introContainer = document.getElementById('intro-container');

  // 1. Enable scrollable state in body
  document.body.style.overflow = 'auto';

  // 2. Initialize Lenis Smooth Scroll
  lenis = new Lenis({
    duration: 1.5,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // smooth exponential curve
    direction: 'vertical',
    gestureDirection: 'vertical',
    smooth: true,
    mouseMultiplier: 1,
    touchMultiplier: 1.5,
    infinite: false,
  });

  // RAF loop for Lenis
  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  // Link Lenis to GSAP ScrollTrigger
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  // 3. Fade in HTML Content and Fade out Intro 3D Canvas
  gsap.to(mainContent, {
    opacity: 1,
    pointerEvents: 'all',
    duration: 1.5,
    ease: "power2.out",
    onStart: () => {
      // Start ambient heartbeat synthesizer (slow resting heartbeat)
      audioController.startHeartbeat(62);
    }
  });

  gsap.to(introContainer, {
    opacity: 0,
    duration: 1.5,
    ease: "power2.inOut",
    delay: 0.5,
    onComplete: () => {
      introContainer.style.display = 'none';
      // Stop the first WebGL animation rendering to conserve CPU/GPU resources
      invitationScene.stop = true;
    }
  });
}

// GSAP ScrollTriggers & Scroll Animations Configuration
function initScrollAndGSAP() {
  gsap.registerPlugin(ScrollTrigger);

  // SECTION 1: Proposal Letter Line-by-Line Reveal
  const letterLines = gsap.utils.toArray('.reveal-line');
  
  gsap.fromTo(letterLines, 
    { opacity: 0, y: 30 },
    {
      opacity: 1,
      y: 0,
      stagger: 0.4,
      duration: 1.0,
      ease: "power2.out",
      scrollTrigger: {
        trigger: '#proposal-letter-section',
        start: 'top 60%',
        end: 'bottom 80%',
        toggleActions: 'play none none none'
      }
    }
  );

  // SECTION 2: Grand Proposal & Ring
  // Speed up heartbeat BPM as user approaches the proposal question (creates sensory anticipation)
  ScrollTrigger.create({
    trigger: '#grand-proposal-section',
    start: 'top 75%',
    onEnter: () => {
      if (audioController) audioController.setHeartbeatBpm(88); // heartbeat quickens
    },
    onLeaveBack: () => {
      if (audioController) audioController.setHeartbeatBpm(62); // slows back down
    }
  });

  // Stagger words for "I LOVE YOU RUPALI ❤️"
  const proposalWords = gsap.utils.toArray('.animated-proposal-title span');
  gsap.fromTo(proposalWords,
    { opacity: 0, scale: 0.4, y: 40 },
    {
      opacity: 1,
      scale: 1,
      y: 0,
      stagger: 0.25,
      duration: 0.8,
      ease: "back.out(1.5)",
      scrollTrigger: {
        trigger: '#grand-proposal-section',
        start: 'top 55%',
        toggleActions: 'play none none none'
      }
    }
  );

  // Fade in question and yes button
  gsap.fromTo(['.proposal-question', '.button-wrapper'],
    { opacity: 0, y: 25 },
    {
      opacity: 1,
      y: 0,
      duration: 1.0,
      stagger: 0.3,
      ease: "power2.out",
      scrollTrigger: {
        trigger: '#grand-proposal-section',
        start: 'top 45%',
        toggleActions: 'play none none none'
      }
    }
  );

  // SECTION 3: Timeline Cards entering
  const timelineCards = gsap.utils.toArray('.timeline-item');
  timelineCards.forEach(item => {
    const card = item.querySelector('.timeline-card');
    const isLeft = item.classList.contains('left-item');
    
    gsap.fromTo(card,
      { 
        opacity: 0, 
        x: isLeft ? -80 : 80,
        scale: 0.95
      },
      {
        opacity: 1,
        x: 0,
        scale: 1,
        duration: 1.0,
        ease: "power2.out",
        scrollTrigger: {
          trigger: item,
          start: 'top 80%',
          toggleActions: 'play none none none'
        }
      }
    );
  });

  // Animate timeline vertical line drawing down
  gsap.fromTo('.timeline-line',
    { scaleY: 0 },
    {
      scaleY: 1,
      ease: "none",
      scrollTrigger: {
        trigger: '.timeline-container',
        start: 'top 70%',
        end: 'bottom 70%',
        scrub: true
      }
    }
  );

  // SECTION 4: Rising Sky Lanterns in Epilogue
  setupFloatingLanterns();
}

function setupFloatingLanterns() {
  const scene = document.querySelector('.lantern-scene');
  
  // Periodically generate rising HTML lanterns
  setInterval(() => {
    // Only generate if user scrolled to epilogue section
    const epilogue = document.getElementById('epilogue-section');
    const rect = epilogue.getBoundingClientRect();
    if (rect.top > window.innerHeight) return;

    const lantern = document.createElement('div');
    lantern.className = 'rising-lantern';
    
    // Random position and scaling
    const sizeScale = Math.random() * 0.6 + 0.7;
    const startX = Math.random() * window.innerWidth;
    
    lantern.style.left = `${startX}px`;
    lantern.style.transform = `scale(${sizeScale})`;
    lantern.style.bottom = `-50px`;
    
    scene.appendChild(lantern);
    
    // Animate lantern floating upward and swaying side-to-side
    const duration = Math.random() * 12 + 10;
    const swayDistance = Math.random() * 60 + 40;
    
    gsap.to(lantern, {
      y: -window.innerHeight - 100,
      x: `+=${Math.random() > 0.5 ? swayDistance : -swayDistance}`,
      rotation: Math.random() * 10 - 5,
      opacity: 0.1,
      duration: duration,
      ease: "power1.inOut",
      onComplete: () => {
        lantern.remove();
      }
    });
  }, 1800);
}

// YES Button Event Listeners & Celebrations
function setupYesButton() {
  const yesButton = document.getElementById('yes-button');
  const happyOverlay = document.getElementById('happy-overlay');

  yesButton.addEventListener('click', (e) => {
    // 1. Play Confetti & Celebration Sparkles
    triggerCelebrationEffects(e);

    // 2. Swell Background Music Volume & Speed Heartbeat before stopping it
    audioController.swellMusic();
    audioController.setHeartbeatBpm(120); // racing heartbeat of excitement!
    
    setTimeout(() => {
      audioController.stopHeartbeat(); // transitions into absolute joy
    }, 1500);

    // 3. Show Success Message Overlay with scaling animation
    happyOverlay.classList.remove('happy-overlay-hidden');
    
    // Zoom out the main body slightly for a cinematic reveal
    gsap.fromTo('.happy-content',
      { scale: 0.7, opacity: 0 },
      { scale: 1, opacity: 1, duration: 1.0, ease: "back.out(1.2)" }
    );
  });
}

function triggerCelebrationEffects(event) {
  // Spawn sparkles and hearts on Canvas particles
  if (window.particles) {
    window.particles.triggerYesCelebration();
    // Spawns multiple bursts in our custom engine
    for(let i=0; i<5; i++) {
      setTimeout(() => {
        window.particles.triggerSealExplosion(
          Math.random() * window.innerWidth,
          Math.random() * window.innerHeight
        );
      }, i * 300);
    }
  }

  // Spawn library confetti
  const duration = 15 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

  function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  const interval = setInterval(function() {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);
    // confetti explosions from edges
    confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
    confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
  }, 250);
}
