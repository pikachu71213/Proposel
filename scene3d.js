// Three.js Scenes & WebGL Animations

class InvitationScene {
  constructor(canvasId, containerId) {
    this.canvas = document.getElementById(canvasId);
    this.container = document.getElementById(containerId);
    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight;
    
    this.init();
  }

  init() {
    // 1. Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x3a0f1a, 0.015);
    
    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 100);
    this.camera.position.set(0, 0, 16);
    
    // 2. Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    
    // 3. Lighting
    this.setupLighting();
    
    // 4. Geometry and Card Construction
    this.createInvitationCard();
    
    // 5. Interaction Setup
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.setupInteraction();
    
    // 6. Window Resize
    window.addEventListener('resize', () => this.resize());
    
    // 7. Initial Resize to set scales
    this.resize();
    
    // 8. Start Loop
    this.animate();
  }

  setupLighting() {
    // Ambient fill
    const ambient = new THREE.AmbientLight(0x5a1e2d, 0.6);
    this.scene.add(ambient);
    
    // Warm Candle Light (Center Spotlight)
    this.candleLight = new THREE.PointLight(0xffd56b, 3.5, 30);
    this.candleLight.position.set(0, 0, 5);
    this.candleLight.castShadow = true;
    this.candleLight.shadow.mapSize.width = 1024;
    this.candleLight.shadow.mapSize.height = 1024;
    this.candleLight.shadow.bias = -0.001;
    this.scene.add(this.candleLight);
    
    // Golden accent rim lights
    this.goldRimLight = new THREE.DirectionalLight(0xd4af37, 1.2);
    this.goldRimLight.position.set(5, 5, 2);
    this.scene.add(this.goldRimLight);
    
    this.goldRimLightLeft = new THREE.DirectionalLight(0x7e2d3f, 1.0);
    this.goldRimLightLeft.position.set(-5, -5, 2);
    this.scene.add(this.goldRimLightLeft);
  }

  // Draw seal artwork programmatically onto canvas to create ultra-detailed texture map
  generateSealCanvas() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // Background red wax
    ctx.fillStyle = '#5A1E2D';
    ctx.fillRect(0, 0, size, size);
    
    // Double circular border (will be stretched to oval by mesh scale)
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(size/2, size/2, size/2 - 30, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(size/2, size/2, size/2 - 50, 0, Math.PI * 2);
    ctx.stroke();
    
    // Initial "R" and Heart drawing (Gold engraved, counter-scaled for oval mesh stretch)
    ctx.save();
    ctx.translate(size/2, size/2);
    ctx.scale(1.35, 0.95);
    
    ctx.fillStyle = '#D4AF37';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(212,175,55,0.5)';
    ctx.font = 'bold 160px "Cinzel"';
    ctx.fillText('R', 0, -25);
    
    // Draw Heart below R
    ctx.font = '60px "Cinzel"';
    ctx.fillText('❤️', 0, 95);
    
    ctx.restore();
    return canvas;
  }

  // Draw paper texture to give invitation tactile weight
  generatePaperCanvas() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // Ivory Base
    ctx.fillStyle = '#FFF8F0';
    ctx.fillRect(0, 0, size, size);
    
    // Texture noise spots
    ctx.fillStyle = 'rgba(212, 175, 55, 0.03)';
    for(let i=0; i<3000; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = Math.random() * 2 + 1;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI*2);
      ctx.fill();
    }
    
    return canvas;
  }

  createInvitationCard() {
    this.cardGroup = new THREE.Group();
    this.scene.add(this.cardGroup);
    
    // Card dimensions
    const cardW = 5.4;
    const cardH = 9.0;
    const thickness = 0.08;
    
    // Materials configuration
    const paperCanvas = this.generatePaperCanvas();
    const paperTex = new THREE.CanvasTexture(paperCanvas);
    
    // Cover Front Burgundy Material
    const frontCoverMat = new THREE.MeshStandardMaterial({
      color: 0x5a1e2d, // Burgundy
      roughness: 0.6,
      metalness: 0.1,
      bumpMap: paperTex,
      bumpScale: 0.01
    });
    
    // Back of flaps (Ivory paper inside)
    const backCoverMat = new THREE.MeshStandardMaterial({
      color: 0xfff8f0, // Ivory
      roughness: 0.7,
      metalness: 0.02,
      map: paperTex
    });
    
    // Inner Page Material
    const innerPageMat = new THREE.MeshStandardMaterial({
      color: 0xfff8f0,
      roughness: 0.7,
      metalness: 0.02,
      map: paperTex
    });
    
    // Flap materials array: [Right, Left, Top, Bottom, Front, Back]
    const materialsLeftFlap = [
      backCoverMat, // Right (sealing edge, turns into inner edge on open)
      frontCoverMat, // Left (hinge edge)
      frontCoverMat, // Top
      frontCoverMat, // Bottom
      frontCoverMat, // Front (outer cover)
      backCoverMat   // Back (inner cover)
    ];
    
    const materialsRightFlap = [
      frontCoverMat, // Right (hinge edge)
      backCoverMat,  // Left (sealing edge)
      frontCoverMat, // Top
      frontCoverMat, // Bottom
      frontCoverMat, // Front (outer cover)
      backCoverMat   // Back (inner cover)
    ];
    
    // 1. LEFT FLAP (Hinged at x = -cardW/2)
    this.leftFlapHinge = new THREE.Group();
    this.leftFlapHinge.position.set(-cardW/2, 0, 0);
    this.cardGroup.add(this.leftFlapHinge);
    
    const leftFlapGeom = new THREE.BoxGeometry(cardW/2, cardH, thickness);
    // Offset mesh so edge sits exactly at the hinge origin
    const leftFlapMesh = new THREE.Mesh(leftFlapGeom, materialsLeftFlap);
    leftFlapMesh.position.set(cardW/4, 0, 0);
    leftFlapMesh.castShadow = true;
    leftFlapMesh.receiveShadow = true;
    this.leftFlapHinge.add(leftFlapMesh);
    
    // 2. RIGHT FLAP (Hinged at x = cardW/2)
    this.rightFlapHinge = new THREE.Group();
    this.rightFlapHinge.position.set(cardW/2, 0, 0);
    this.cardGroup.add(this.rightFlapHinge);
    
    const rightFlapGeom = new THREE.BoxGeometry(cardW/2, cardH, thickness);
    const rightFlapMesh = new THREE.Mesh(rightFlapGeom, materialsRightFlap);
    rightFlapMesh.position.set(-cardW/4, 0, 0);
    rightFlapMesh.castShadow = true;
    rightFlapMesh.receiveShadow = true;
    this.rightFlapHinge.add(rightFlapMesh);
    
    // 3. INNER CENTER PAGE
    const innerGeom = new THREE.BoxGeometry(cardW - 0.05, cardH - 0.05, thickness - 0.02);
    const innerMesh = new THREE.Mesh(innerGeom, innerPageMat);
    innerMesh.position.set(0, 0, -thickness);
    innerMesh.receiveShadow = true;
    this.cardGroup.add(innerMesh);
    
    // 4. WAX SEAL (Centered, slightly offset in front)
    const sealCanvas = this.generateSealCanvas();
    const sealTex = new THREE.CanvasTexture(sealCanvas);
    
    // Cylinder is smaller to scale it to oval shape
    const sealGeom = new THREE.CylinderGeometry(0.55, 0.55, 0.1, 32);
    const sealMat = new THREE.MeshStandardMaterial({
      color: 0x5a1e2d,
      roughness: 0.3,
      metalness: 0.1,
      map: sealTex,
      bumpMap: sealTex,
      bumpScale: 0.03,
      clearcoat: 0.8,
      clearcoatRoughness: 0.2
    });
    
    this.waxSeal = new THREE.Mesh(sealGeom, sealMat);
    this.waxSeal.rotation.x = Math.PI / 2;
    this.waxSeal.position.set(0, 0, thickness / 2 + 0.04);
    this.waxSeal.scale.set(0.82, 1.0, 1.12); // Portrait Oval Scale
    this.waxSeal.castShadow = true;
    this.cardGroup.add(this.waxSeal);
    
    // Gold outer rim for the wax seal to make it look extra premium
    const goldRimGeom = new THREE.CylinderGeometry(0.57, 0.57, 0.08, 32);
    const goldRimMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.15,
      metalness: 0.95,
      clearcoat: 1.0
    });
    this.waxSealGoldRim = new THREE.Mesh(goldRimGeom, goldRimMat);
    this.waxSealGoldRim.rotation.x = Math.PI / 2;
    this.waxSealGoldRim.position.set(0, 0, thickness / 2 + 0.02);
    this.waxSealGoldRim.scale.set(0.85, 1.0, 1.15); // Portrait Oval Scale
    this.waxSealGoldRim.castShadow = true;
    this.cardGroup.add(this.waxSealGoldRim);
    
    // Create gold embossed ornaments on cover fronts (mocked via child planes)
    this.createEmbossedBorders(leftFlapMesh, rightFlapMesh, cardW, cardH);
  }

  createEmbossedBorders(leftFlap, rightFlap, cardW, cardH) {
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.15,
      metalness: 0.95,
      side: THREE.DoubleSide
    });

    const burgundyMat = new THREE.MeshStandardMaterial({
      color: 0x5a1e2d,
      roughness: 0.6,
      metalness: 0.1
    });
    
    // Outer raised gold frame
    const goldGeom = new THREE.BoxGeometry(cardW/2 - 0.4, cardH - 0.8, 0.01);
    
    const leftGold = new THREE.Mesh(goldGeom, goldMat);
    leftGold.position.set(0, 0, 0.045);
    leftFlap.add(leftGold);
    
    const rightGold = new THREE.Mesh(goldGeom, goldMat);
    rightGold.position.set(0, 0, 0.045);
    rightFlap.add(rightGold);
    
    // Inner burgundy panel to expose the gold frame border
    const innerBurgundyGeom = new THREE.BoxGeometry(cardW/2 - 0.52, cardH - 1.04, 0.012);
    
    const leftInner = new THREE.Mesh(innerBurgundyGeom, burgundyMat);
    leftInner.position.set(0, 0, 0.001);
    leftGold.add(leftInner);
    
    const rightInner = new THREE.Mesh(innerBurgundyGeom, burgundyMat);
    rightInner.position.set(0, 0, 0.001);
    rightGold.add(rightInner);
  }

  setupInteraction() {
    const onMove = (e) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      
      this.mouse.targetX = (clientX / this.width - 0.5) * 0.4;
      this.mouse.targetY = (clientY / this.height - 0.5) * 0.4;
    };
    
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, { passive: true });
    
    // Gyroscope parallax support for mobile
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', (e) => {
        if (!e.gamma || !e.beta) return;
        // gamma is left-to-right tilt (-90 to 90), beta is front-to-back tilt (-180 to 180)
        this.mouse.targetX = (e.gamma / 45) * 0.4;
        this.mouse.targetY = ((e.beta - 45) / 45) * 0.4;
      }, true);
    }
  }

  // Animation that triggers when Wax Seal is clicked
  unfoldInvitation(onCompleteCallback) {
    if (this.unfolded) return;
    this.unfolded = true;
    
    // 1. Hide the interaction prompt overlay
    gsap.to('#landing-prompt', { opacity: 0, duration: 0.5 });
    
    // 2. Play Audio Heartbeat & music
    audioController.play();
    
    // 3. Spawns 3D physical breaking wax seal fragments
    this.crackSealFragments();
    
    // 4. GSAP Unfolding Timeline
    const tl = gsap.timeline({
      onComplete: () => {
        if (onCompleteCallback) onCompleteCallback();
      }
    });
    
    // Card hinges open
    tl.to(this.leftFlapHinge.rotation, {
      y: -Math.PI * 0.82,
      duration: 2.2,
      ease: "power2.inOut"
    }, 0.2);
    
    tl.to(this.rightFlapHinge.rotation, {
      y: Math.PI * 0.82,
      duration: 2.2,
      ease: "power2.inOut"
    }, 0.2);
    
    // Camera zooms inside the invitation
    tl.to(this.camera.position, {
      z: 5.5,
      y: 0.1,
      duration: 2.5,
      ease: "power2.inOut"
    }, 0.1);
    
    // Slow float in of entire card group
    tl.to(this.cardGroup.position, {
      z: 1.0,
      duration: 2.5,
      ease: "power2.out"
    }, 0.1);
    
    // Fade out light spotlight on card to transition smoothly
    tl.to(this.candleLight, {
      intensity: 0.5,
      duration: 2.2
    }, 0.2);
  }

  crackSealFragments() {
    // Hide original solid wax seal mesh
    this.waxSeal.visible = false;
    if (this.waxSealGoldRim) this.waxSealGoldRim.visible = false;
    
    // Spawn 10 fragmented geometry shards at center
    const shardGroup = new THREE.Group();
    this.scene.add(shardGroup);
    shardGroup.position.copy(this.waxSeal.position);
    shardGroup.position.z += 0.05;
    
    const shardMat = new THREE.MeshStandardMaterial({
      color: 0x5a1e2d,
      roughness: 0.4,
      metalness: 0.1
    });
    
    const shards = [];
    const shardCount = 12;
    
    for(let i=0; i<shardCount; i++) {
      // Random irregular tiny shapes
      const sizeX = Math.random() * 0.2 + 0.1;
      const sizeY = Math.random() * 0.2 + 0.1;
      const sizeZ = Math.random() * 0.08 + 0.04;
      
      const shardGeom = new THREE.BoxGeometry(sizeX, sizeY, sizeZ);
      const shardMesh = new THREE.Mesh(shardGeom, shardMat);
      
      // Positioned in circle ring around wax center
      const angle = (Math.PI * 2 / shardCount) * i;
      shardMesh.position.set(Math.cos(angle) * 0.3, Math.sin(angle) * 0.3, 0);
      shardMesh.rotation.set(Math.random() * 5, Math.random() * 5, Math.random() * 5);
      
      shardGroup.add(shardMesh);
      shards.push(shardMesh);
    }
    
    // Trigger particle system explosion sparks
    const canvasExplosionCoord = this.toScreenCoordinates(this.waxSeal);
    if(window.particles) {
      window.particles.triggerSealExplosion(canvasExplosionCoord.x, canvasExplosionCoord.y);
    }
    
    // Animate fragments flying outwards and falling under gravity
    shards.forEach((shard, index) => {
      const angle = (Math.PI * 2 / shardCount) * index;
      const force = Math.random() * 2 + 1.5;
      
      gsap.to(shard.position, {
        x: shard.position.x + Math.cos(angle) * force,
        y: shard.position.y + Math.sin(angle) * force - 3.0, // gravity drop
        z: shard.position.z + Math.random() * 3 + 1, // flying towards camera
        duration: 1.5,
        ease: "power1.out"
      });
      
      gsap.to(shard.rotation, {
        x: Math.random() * 15,
        y: Math.random() * 15,
        z: Math.random() * 15,
        duration: 1.5
      });
      
      gsap.to(shard.scale, {
        x: 0.001,
        y: 0.001,
        z: 0.001,
        delay: 0.8,
        duration: 0.7,
        onComplete: () => {
          if (index === shards.length - 1) {
            this.scene.remove(shardGroup);
          }
        }
      });
    });
  }

  // Convert 3D Vector coordinate to screen pixel coordinate for Canvas emitter
  toScreenCoordinates(obj) {
    const vector = new THREE.Vector3();
    obj.updateMatrixWorld();
    vector.setFromMatrixPosition(obj.matrixWorld);
    
    vector.project(this.camera);
    
    const x = (vector.x *  .5 + .5) * this.width;
    const y = (vector.y * -.5 + .5) * this.height;
    
    return { x, y };
  }

  resize() {
    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight;
    
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    
    this.renderer.setSize(this.width, this.height);
    
    // Scale card dynamically to fit mobile portrait widths safely without cropping edges
    if (this.cardGroup) {
      const aspect = this.width / this.height;
      if (aspect < 0.75) {
        // Portrait mobile scale adjustment
        const scaleVal = aspect * 1.35;
        this.cardGroup.scale.setScalar(Math.max(0.48, Math.min(1.0, scaleVal)));
      } else {
        this.cardGroup.scale.setScalar(1.0);
      }
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    
    // Smooth mouse parallax movement damping
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;
    
    if (this.cardGroup && !this.unfolded) {
      // Gentle card float breathing
      const time = Date.now() * 0.0015;
      this.cardGroup.position.y = Math.sin(time) * 0.15;
      
      // Card orientation based on tilt parallax
      this.cardGroup.rotation.y = this.mouse.x;
      this.cardGroup.rotation.x = -this.mouse.y;
      
      // Breathe wax seal scale
      const sealScale = 1.0 + Math.sin(time * 2.0) * 0.03;
      this.waxSeal.scale.set(sealScale * 0.82, 1.0, sealScale * 1.12);
      if (this.waxSealGoldRim) {
        this.waxSealGoldRim.scale.set(sealScale * 0.85, 1.0, sealScale * 1.15);
      }
    }
    
    this.renderer.render(this.scene, this.camera);
  }
}

class RingScene {
  constructor(canvasId, containerId) {
    this.canvas = document.getElementById(canvasId);
    this.container = document.getElementById(containerId);
    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight;
    
    this.init();
  }

  init() {
    this.scene = new THREE.Scene();
    
    this.camera = new THREE.PerspectiveCamera(40, this.width / this.height, 0.1, 100);
    this.camera.position.set(0, 0, 8);
    
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    
    // Ambient & Directional Lights
    const ambient = new THREE.AmbientLight(0x7e2d3f, 1.0); // soft red fill
    this.scene.add(ambient);
    
    // Key light (Golden reflection)
    this.keyLight = new THREE.DirectionalLight(0xfff8f0, 2.0);
    this.keyLight.position.set(5, 5, 5);
    this.scene.add(this.keyLight);
    
    // Colored Point Lights for sparkling diamond facets
    this.sparkleLight1 = new THREE.PointLight(0x00d2ff, 4, 10);
    this.sparkleLight1.position.set(-2, 2, 2);
    this.scene.add(this.sparkleLight1);
    
    this.sparkleLight2 = new THREE.PointLight(0xff007f, 5, 10);
    this.sparkleLight2.position.set(2, -2, 2);
    this.scene.add(this.sparkleLight2);
    
    // Sparkle Light 3 - Warm Gold for royal spectrum glow
    this.sparkleLight3 = new THREE.PointLight(0xd4af37, 6, 8);
    this.sparkleLight3.position.set(0, 3, -1);
    this.scene.add(this.sparkleLight3);
    
    this.createDiamondRing();
    
    window.addEventListener('resize', () => this.resize());
    
    // Initial resize to scale ring for viewport
    this.resize();
    
    this.animate();
  }

  createDiamondRing() {
    this.ringGroup = new THREE.Group();
    this.scene.add(this.ringGroup);
    
    // Ring Gold Band (Torus Geometry)
    const bandGeom = new THREE.TorusGeometry(1.6, 0.15, 16, 100);
    const bandMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37, // Champagne Gold
      metalness: 0.95,
      roughness: 0.12,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05
    });
    
    const bandMesh = new THREE.Mesh(bandGeom, bandMat);
    bandMesh.rotation.x = Math.PI / 2; // Flat circle facing camera
    this.ringGroup.add(bandMesh);
    
    // Diamond Setting Base (Prongs)
    const prongGeom = new THREE.CylinderGeometry(0.1, 0.18, 0.4, 8);
    const prongMat = new THREE.MeshStandardMaterial({
      color: 0xe5e5e5, // Platinum/Silver for prongs to reflect gem
      metalness: 0.9,
      roughness: 0.1
    });
    
    // Create 4 tiny prongs holding the diamond on top of the torus ring
    const prongGroup = new THREE.Group();
    prongGroup.position.set(0, 1.7, 0);
    this.ringGroup.add(prongGroup);
    
    for (let i = 0; i < 4; i++) {
      const prong = new THREE.Mesh(prongGeom, prongMat);
      const angle = (Math.PI / 2) * i + Math.PI/4;
      prong.position.set(Math.cos(angle) * 0.35, 0.15, Math.sin(angle) * 0.35);
      prong.rotation.z = -Math.cos(angle) * 0.2;
      prong.rotation.x = Math.sin(angle) * 0.2;
      prongGroup.add(prong);
    }
    
    // Crown Base
    const baseGeom = new THREE.CylinderGeometry(0.4, 0.2, 0.2, 8);
    const baseMesh = new THREE.Mesh(baseGeom, prongMat);
    baseMesh.position.set(0, 1.62, 0);
    this.ringGroup.add(baseMesh);
    
    // Brilliant Cut Diamond (Using Octahedron with High Transmission PBR Refractive Material)
    const gemGeom = new THREE.OctahedronGeometry(0.65, 1);
    gemGeom.scale(1.0, 1.3, 1.0); // stretch diamond vertically
    
    const gemMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.5,
      metalness: 0.0,
      roughness: 0.0,
      transmission: 0.95, // High internal glass transmission
      ior: 2.417,        // Index of refraction of real diamond!
      thickness: 1.2,    // Physical light bending thickness
      specularIntensity: 2.0,
      specularColor: 0xffffff,
      side: THREE.DoubleSide
    });
    
    this.diamond = new THREE.Mesh(gemGeom, gemMat);
    this.diamond.position.set(0, 1.95, 0);
    this.ringGroup.add(this.diamond);
    
    // Center ring group facing up/forward
    this.ringGroup.rotation.x = 0.4;
    this.ringGroup.rotation.y = 0.5;
  }

  resize() {
    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight;
    
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    
    this.renderer.setSize(this.width, this.height);
    
    // Scale the ring group down on portrait mobile screens so it fits the layout
    if (this.ringGroup) {
      const aspect = this.width / this.height;
      if (aspect < 1.0) {
        this.ringGroup.scale.setScalar(aspect * 1.15);
      } else {
        this.ringGroup.scale.setScalar(1.0);
      }
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    
    // Slow 3D floating & spinning rotation
    const time = Date.now() * 0.001;
    this.ringGroup.rotation.y = time * 0.35;
    this.ringGroup.position.y = Math.sin(time * 1.5) * 0.15;
    
    // Spin diamond independently slightly faster to refract sparkling light highlights
    if(this.diamond) {
      this.diamond.rotation.y = time * 0.6;
    }
    
    // Slowly sweep lights across to create shining glisten
    this.keyLight.position.x = 5 + Math.sin(time) * 3;
    this.sparkleLight1.position.x = -2 + Math.cos(time * 1.8) * 2;
    this.sparkleLight2.position.y = -2 + Math.sin(time * 1.8) * 2;
    this.sparkleLight3.position.z = -1 + Math.sin(time * 2.2) * 2;
    
    this.renderer.render(this.scene, this.camera);
  }
}
