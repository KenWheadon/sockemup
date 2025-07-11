class LevelSelect extends Screen {
  constructor(game) {
    super(game);

    // Configuration constants
    this.DRAG_BOUNDARIES = {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    };

    this.DROP_ZONE_CONFIG = {
      snapDistance: 40,
      size: 60,
      offsetX: 1200,
      offsetY1: 300,
      offsetY2: 400,
      outerBorderWidth: 10,
      glowDuration: 20,
    };

    this.MARTHA_CONFIG = {
      offsetX: 150,
      offsetY: 250,
      maxSize: 120,
      maintainAspectRatio: true,
    };

    // Level selection state
    this.hoveredLevel = -1;
    this.selectedLevel = -1;

    // Easter egg state
    this.easterEggActive = false;
    this.menuSocks = [];
    this.isDragging = false;
    this.dragSock = null;
    this.dragOffset = { x: 0, y: 0 };
    this.logoClickCount = 0;
    this.currentSockType = 1;
    this.dropZoneHover = null;

    // Martha display and animation
    this.marthaWiggleTimer = 0;
    this.marthaWiggling = false;
    this.marthaImageSize = { width: 0, height: 0 };

    // Easter egg drop zones
    this.easterDropZones = [];

    // Sock ball animations
    this.sockBallAnimations = [];

    // Point gain animations
    this.pointGainAnimations = [];

    // Mismatch particle effects
    this.mismatchParticles = [];

    // Credits integration
    this.creditsOpen = false;
    this.creditsModal = null;

    // Physics for menu socks
    this.menuPhysics = {
      friction: 0.992,
      minVelocity: 0.05,
      bounceRestitution: 0.4,
      rotationFriction: 0.98,
      bounds: {
        left: -500, // Very generous buffer to prevent premature cleanup
        right: 2000, // Will be updated on resize
        top: -500,
        bottom: 2000,
      },
    };

    // Level button configuration
    this.levelConfig = {
      baseSpacing: 150,
      baseButtonSize: 80,
      wiggleSpeed: 0.01,
      wiggleAmount: 3,
      hoverScale: 1.1,
      clickScale: 0.95,
    };
  }

  calculateMarthaImageSize() {
    const marthaImage = this.game.images["martha-demand.png"];
    if (!marthaImage) {
      this.marthaImageSize = { width: 0, height: 0 };
      return;
    }

    const maxSize = this.game.getScaledValue(this.MARTHA_CONFIG.maxSize);

    if (this.MARTHA_CONFIG.maintainAspectRatio) {
      const aspectRatio = marthaImage.width / marthaImage.height;

      if (aspectRatio > 1) {
        // Image is wider than it is tall
        this.marthaImageSize.width = maxSize;
        this.marthaImageSize.height = maxSize / aspectRatio;
      } else {
        // Image is taller than it is wide
        this.marthaImageSize.width = maxSize * aspectRatio;
        this.marthaImageSize.height = maxSize;
      }
    } else {
      this.marthaImageSize.width = maxSize;
      this.marthaImageSize.height = maxSize;
    }
  }

  createLayoutCache() {
    const baseLayout = super.createLayoutCache();
    const canvasWidth = this.game.getCanvasWidth();
    const canvasHeight = this.game.getCanvasHeight();

    // Calculate Martha image size
    this.calculateMarthaImageSize();

    return {
      ...baseLayout,
      logoX: canvasWidth / 2,
      logoY: this.game.getScaledValue(150),
      logoWidth: this.game.getScaledValue(200),
      logoHeight: this.game.getScaledValue(100),
      instructionsY: this.game.getScaledValue(220),
      levelSpacing: this.game.getScaledValue(this.levelConfig.baseSpacing),
      levelButtonSize: this.game.getScaledValue(
        this.levelConfig.baseButtonSize
      ),
      levelAreaY: canvasHeight / 2 + this.game.getScaledValue(50),
      levelStartX:
        canvasWidth / 2 -
        ((GameConfig.LEVELS.length - 1) *
          this.game.getScaledValue(this.levelConfig.baseSpacing)) /
          2,
      marthaX: this.game.getScaledValue(this.MARTHA_CONFIG.offsetX),
      marthaY: this.game.getScaledValue(this.MARTHA_CONFIG.offsetY),
      marthaWidth: this.marthaImageSize.width,
      marthaHeight: this.marthaImageSize.height,
      dropZoneSize: this.game.getScaledValue(this.DROP_ZONE_CONFIG.size),
      dropZone1X: this.game.getScaledValue(this.DROP_ZONE_CONFIG.offsetX),
      dropZone1Y: this.game.getScaledValue(this.DROP_ZONE_CONFIG.offsetY1),
      dropZone2X: this.game.getScaledValue(this.DROP_ZONE_CONFIG.offsetX),
      dropZone2Y: this.game.getScaledValue(this.DROP_ZONE_CONFIG.offsetY2),
      statsY: canvasHeight - this.game.getScaledValue(80),
      statsPanelWidth: this.game.getScaledValue(200),
      statsPanelHeight: this.game.getScaledValue(40),
      creditsButtonX: canvasWidth - this.game.getScaledValue(80),
      creditsButtonY: this.game.getScaledValue(50),
      creditsButtonWidth: this.game.getScaledValue(100),
      creditsButtonHeight: this.game.getScaledValue(40),
    };
  }

  onResize() {
    // Update physics bounds for garbage collection with generous buffer
    const canvasWidth = this.game.getCanvasWidth();
    const canvasHeight = this.game.getCanvasHeight();

    this.menuPhysics.bounds = {
      left: -500, // Much more generous buffer
      right: canvasWidth + 500,
      top: -500,
      bottom: canvasHeight + 500,
    };

    // Debug logging to see actual bounds
    console.log("Canvas dimensions:", canvasWidth, "x", canvasHeight);
    console.log("Garbage collection bounds:", this.menuPhysics.bounds);

    this.setupEasterDropZones();
  }

  setupEasterDropZones() {
    this.clearLayoutCache();
    this.calculateLayout();

    const layout = this.layoutCache;

    this.easterDropZones = [
      {
        x: layout.dropZone1X,
        y: layout.dropZone1Y,
        width: layout.dropZoneSize,
        height: layout.dropZoneSize,
        sock: null,
        glowEffect: 0,
        hoverEffect: 0,
        snapEffect: 0,
        id: 0,
      },
      {
        x: layout.dropZone2X,
        y: layout.dropZone2Y,
        width: layout.dropZoneSize,
        height: layout.dropZoneSize,
        sock: null,
        glowEffect: 0,
        hoverEffect: 0,
        snapEffect: 0,
        id: 1,
      },
    ];
  }

  setup() {
    super.setup();

    // Start menu music when entering level select
    console.log("🎵 Level select setup - starting menu music");
    this.game.audioManager.playMusic("menu-music", true);

    // Update bounds when setting up to ensure they're correct
    const canvasWidth = this.game.getCanvasWidth();
    const canvasHeight = this.game.getCanvasHeight();

    this.menuPhysics.bounds = {
      left: -500,
      right: canvasWidth + 500,
      top: -500,
      bottom: canvasHeight + 500,
    };

    console.log(
      "Level select setup - Canvas dimensions:",
      canvasWidth,
      "x",
      canvasHeight
    );
    console.log("Initial garbage collection bounds:", this.menuPhysics.bounds);

    this.setupEasterDropZones();
    this.setupCreditsModal();
  }

  cleanup() {
    super.cleanup();

    // Stop menu music when leaving level select
    console.log("🎵 Level select cleanup - stopping menu music");
    this.game.audioManager.stopMusic();

    // Clean up credits modal if it exists
    if (this.creditsOpen) {
      this.hideCredits();
    }

    // Remove credits modal from DOM
    const creditsModal = document.getElementById("creditsModal");
    if (creditsModal) {
      creditsModal.remove();
    }
  }

  setupCreditsModal() {
    // Create credits modal if it doesn't exist
    if (!document.getElementById("creditsModal")) {
      const modalHTML = `
        <div class="credits-modal" id="creditsModal">
          <div class="credits-content">
            <div class="credits-header">
              <img src="images/company-logo.png" alt="Weird Demon Games" class="company-logo" />
              <h2>Weird Demon Games</h2>
              <button class="close-credits" id="closeCredits">×</button>
            </div>
            <div class="credits-body">
              <div class="company-info">
                <h3>About the Studio</h3>
                <p>Weird Demon Games was founded in the depths of creative madness, where nightmares meet nostalgia. We specialize in the weird and wacky that make you wonder - what did I play, and why did I have fun doing it!</p>
                
                <h3>Our Mission</h3>
                <p>To create unforgettable experiences that bring a smile to your face and inspire you to make something wacky of your own!</p>
                
                <h3>Team</h3>
                <div class="team-credits">
                  <div class="credit-role">
                    <span class="role">Founder / Game Lead</span>
                    <span class="name">Ken Whaeadon</span>
                  </div>
                  <div class="credit-role">
                    <span class="role">Logo</span>
                    <span class="name">Wrymskin</span>
                  </div>
                  <div class="credit-role">
                    <span class="role">Audio Effects - freesound.org</span>
                    <span class="name">colorsCrimsonTears, David819, SilverIllusionist, mrickey13, plasterbrain, Sess8it, Bertrof, GameAudio, Yoshicakes77</span>
                  </div>
                  <div class="credit-role">
                    <span class="role">Audio Effects - pixabay.com</span>
                    <span class="name">Karim-Nessim, Universfield, freesound_community</span>
                  </div>
                  <div class="credit-role">
                    <span class="role">Lead Artist</span>
                    <span class="name">ChatGPT</span>
                  </div>
                  <div class="credit-role">
                    <span class="role">Music Composer</span>
                    <span class="name">Suno</span>
                  </div>
                  <div class="credit-role">
                    <span class="role">Lead Programmer</span>
                    <span class="name">Claude Sonnet 4</span>
                  </div>
                </div>
                
                <div class="company-tagline">
                  <em>"Where every game is a portal to the impossible."</em>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML("beforeend", modalHTML);
    }

    this.creditsModal = document.getElementById("creditsModal");
    this.setupCreditsEventListeners();
  }

  setupCreditsEventListeners() {
    const closeCredits = document.getElementById("closeCredits");

    // Close credits button
    if (closeCredits) {
      closeCredits.addEventListener("click", () => {
        this.game.audioManager.playSound("button-click", false, 0.5);
        this.hideCredits();
      });

      // Add hover sound effect
      closeCredits.addEventListener("mouseenter", () => {
        this.game.audioManager.playSound("button-hover", false, 0.3);
      });
    }

    // Close credits when clicking outside modal
    if (this.creditsModal) {
      this.creditsModal.addEventListener("click", (e) => {
        if (e.target === this.creditsModal) {
          this.hideCredits();
        }
      });
    }

    // Keyboard event listener for accessibility
    document.addEventListener("keydown", (e) => {
      if (this.creditsOpen && e.code === "Escape") {
        this.hideCredits();
      }
    });
  }

  showCredits() {
    if (this.creditsOpen) return;

    console.log("👥 Opening credits");
    this.game.audioManager.playSound("button-click", false, 0.5);

    if (this.creditsModal) {
      this.creditsOpen = true;
      this.creditsModal.classList.add("visible");

      // Focus trap for accessibility
      const closeButton = document.getElementById("closeCredits");
      if (closeButton) {
        closeButton.focus();
      }
    }
  }

  hideCredits() {
    if (!this.creditsOpen) return;

    console.log("❌ Closing credits");
    this.game.audioManager.playSound("button-click", false, 0.5);

    if (this.creditsModal) {
      this.creditsModal.classList.remove("visible");
      this.creditsOpen = false;
    }
  }

  onUpdate(deltaTime) {
    if (this.easterEggActive) {
      this.updateMenuSocks(deltaTime);
    }

    if (this.marthaWiggling) {
      this.marthaWiggleTimer += deltaTime;
      if (this.marthaWiggleTimer >= 1000) {
        this.marthaWiggling = false;
        this.marthaWiggleTimer = 0;
      }
    }

    // Update drop zone effects
    this.easterDropZones.forEach((zone) => {
      if (zone.glowEffect > 0) zone.glowEffect--;
      if (zone.hoverEffect > 0) zone.hoverEffect--;
      if (zone.snapEffect > 0) zone.snapEffect--;
    });

    // Update sockball animations
    this.sockBallAnimations = this.sockBallAnimations.filter((animation) => {
      animation.progress += deltaTime / 1000;
      return animation.progress < 1;
    });

    // Update point gain animations
    this.pointGainAnimations = this.pointGainAnimations.filter((animation) => {
      animation.progress += deltaTime / 2000; // 2 second duration
      return animation.progress < 1;
    });

    // Update mismatch particle effects
    this.updateMismatchParticles(deltaTime);
  }

  updateMismatchParticles(deltaTime) {
    if (!this.mismatchParticles) return;

    const timeMultiplier = deltaTime / 16.67;

    this.mismatchParticles.forEach((particle, index) => {
      particle.x += particle.vx * timeMultiplier;
      particle.y += particle.vy * timeMultiplier;
      particle.vx *= Math.pow(0.98, timeMultiplier);
      particle.vy *= Math.pow(0.98, timeMultiplier);
      particle.life -= timeMultiplier;

      if (particle.life <= 0) {
        this.mismatchParticles.splice(index, 1);
      }
    });
  }

  updateMenuSocks(deltaTime) {
    const timeMultiplier = deltaTime / 16.67;

    this.menuSocks.forEach((sock, index) => {
      // Skip physics for dragged sock and socks in drop zones
      if (sock === this.dragSock || this.isSockInDropZone(sock)) return;

      sock.vx *= Math.pow(this.menuPhysics.friction, timeMultiplier);
      sock.vy *= Math.pow(this.menuPhysics.friction, timeMultiplier);

      if (sock.rotationSpeed) {
        sock.rotationSpeed *= Math.pow(
          this.menuPhysics.rotationFriction,
          timeMultiplier
        );
      }

      sock.x += sock.vx * timeMultiplier;
      sock.y += sock.vy * timeMultiplier;
      sock.rotation += sock.rotationSpeed * timeMultiplier;

      // Only check bounds for garbage collection - no time-based removal
      if (this.isSockOutsideBounds(sock)) {
        // Clear any drop zone references to this sock before removing it
        this.clearSockFromDropZones(sock);

        this.menuSocks.splice(index, 1);
        if (sock === this.dragSock) {
          this.isDragging = false;
          this.dragSock = null;
        }
        return;
      }

      if (
        Math.abs(sock.vx) < this.menuPhysics.minVelocity &&
        Math.abs(sock.vy) < this.menuPhysics.minVelocity
      ) {
        sock.vx = 0;
        sock.vy = 0;
        if (sock.rotationSpeed && Math.abs(sock.rotationSpeed) < 0.01) {
          sock.rotationSpeed = 0;
        }
      }
    });

    this.menuSocks = this.menuSocks.filter((sock) => sock !== undefined);
  }

  clearSockFromDropZones(sock) {
    this.easterDropZones.forEach((zone) => {
      if (zone.sock === sock) {
        zone.sock = null;
      }
    });
  }

  isSockInDropZone(sock) {
    return this.easterDropZones.some((zone) => zone.sock === sock);
  }

  isSockOutsideBounds(sock) {
    const isOutside =
      sock.x < this.menuPhysics.bounds.left ||
      sock.x > this.menuPhysics.bounds.right ||
      sock.y < this.menuPhysics.bounds.top ||
      sock.y > this.menuPhysics.bounds.bottom;

    // Debug logging when a sock is about to be garbage collected
    if (isOutside) {
      console.log("Sock being garbage collected:", {
        sockPosition: { x: sock.x, y: sock.y },
        bounds: this.menuPhysics.bounds,
        canvasSize: {
          width: this.game.getCanvasWidth(),
          height: this.game.getCanvasHeight(),
        },
      });
    }

    return isOutside;
  }

  onMouseMove(x, y) {
    const previousHoveredLevel = this.hoveredLevel;
    this.hoveredLevel = this.getLevelAtPosition(x, y);

    // Play hover sound when hovering over a new level button
    if (
      this.hoveredLevel !== previousHoveredLevel &&
      this.hoveredLevel !== -1
    ) {
      this.game.audioManager.playSound("button-hover", false, 0.3);
    }

    if (this.isDragging && this.dragSock) {
      // Direct position assignment - no bounds checking at all
      this.dragSock.x = x - this.dragOffset.x;
      this.dragSock.y = y - this.dragOffset.y;
    }

    // Update hover effects for drop zones
    this.updateDropZoneHover(x, y);
  }

  updateDropZoneHover(x, y) {
    this.dropZoneHover = null;

    if (this.isDragging && this.dragSock) {
      const snapDistance = this.game.getScaledValue(
        this.DROP_ZONE_CONFIG.snapDistance
      );

      this.easterDropZones.forEach((zone) => {
        const distance = this.getDropZoneDistance(this.dragSock, zone);
        if (distance < snapDistance && zone.sock === null) {
          this.dropZoneHover = zone.id;
          zone.hoverEffect = Math.max(zone.hoverEffect, 10);
        }
      });
    }
  }

  onMouseDown(x, y) {
    if (this.easterEggActive) {
      const sock = this.getSockAtPosition(x, y);
      if (sock) {
        this.isDragging = true;
        this.dragSock = sock;
        this.dragOffset.x = x - sock.x;
        this.dragOffset.y = y - sock.y;
        sock.vx = 0;
        sock.vy = 0;
        return true;
      }
    }
    return false;
  }

  onMouseUp(x, y) {
    if (this.isDragging && this.dragSock) {
      const sock = this.dragSock;
      let snapped = false;

      this.easterDropZones.forEach((zone) => {
        const distance = this.getDropZoneDistance(sock, zone);
        const snapDistance = this.game.getScaledValue(
          this.DROP_ZONE_CONFIG.snapDistance
        );

        if (distance < snapDistance && zone.sock === null) {
          zone.sock = sock;
          this.snapSockToDropZone(sock, zone);
          snapped = true;
          this.createSnapEffect(zone);
        }
      });

      if (!snapped) {
        sock.vx = (Math.random() - 0.5) * 8;
        sock.vy = (Math.random() - 0.5) * 8;
        sock.rotationSpeed = (Math.random() - 0.5) * 0.1;
      }

      this.isDragging = false;
      this.dragSock = null;
      this.dropZoneHover = null;
      this.checkForEasterEggMatches();
    }
  }

  onClick(x, y) {
    // Check if credits button was clicked
    if (this.isCreditsButtonClicked(x, y)) {
      this.showCredits();
      return true;
    }

    if (this.isLogoClicked(x, y)) {
      this.activateEasterEgg();
      return true;
    }

    const levelIndex = this.getLevelAtPosition(x, y);
    if (levelIndex !== -1) {
      if (this.game.unlockedLevels[levelIndex]) {
        // Play button click sound for starting a level
        this.game.audioManager.playSound("button-click", false, 0.5);
        this.game.startLevel(levelIndex);
        return true;
      } else if (this.game.playerPoints >= GameConfig.LEVEL_COSTS[levelIndex]) {
        // Play level unlock sound
        this.game.audioManager.playSound("level-unlock", false, 0.6);
        this.game.playerPoints -= GameConfig.LEVEL_COSTS[levelIndex];
        this.game.unlockedLevels[levelIndex] = true;
        this.game.saveGameData();
        this.game.startLevel(levelIndex);
        return true;
      } else {
        // Play a subtle error sound for insufficient points (using button-click at lower volume)
        this.game.audioManager.playSound("button-click", false, 0.2);
      }
    }

    return false;
  }

  isCreditsButtonClicked(x, y) {
    const layout = this.layoutCache;
    return (
      x >= layout.creditsButtonX - layout.creditsButtonWidth / 2 &&
      x <= layout.creditsButtonX + layout.creditsButtonWidth / 2 &&
      y >= layout.creditsButtonY - layout.creditsButtonHeight / 2 &&
      y <= layout.creditsButtonY + layout.creditsButtonHeight / 2
    );
  }

  getDropZoneDistance(sock, dropZone) {
    return Math.sqrt(
      Math.pow(sock.x - dropZone.x, 2) + Math.pow(sock.y - dropZone.y, 2)
    );
  }

  snapSockToDropZone(sock, dropZone) {
    sock.x = dropZone.x;
    sock.y = dropZone.y;
    sock.vx = 0;
    sock.vy = 0;
    sock.rotationSpeed = 0;
  }

  createSnapEffect(zone) {
    zone.glowEffect = this.DROP_ZONE_CONFIG.glowDuration;
    zone.snapEffect = 15; // Duration for snap animation
  }

  removeMatchedSocks(sock1, sock2) {
    // Remove socks from menuSocks array
    this.menuSocks = this.menuSocks.filter((s) => s !== sock1 && s !== sock2);

    // Clear any drag references
    if (this.dragSock === sock1 || this.dragSock === sock2) {
      this.isDragging = false;
      this.dragSock = null;
    }

    // Clear any additional references that might exist
    this.clearSockFromDropZones(sock1);
    this.clearSockFromDropZones(sock2);

    // Debug logging to confirm removal
    console.log("Removed matched socks:", sock1.type, sock2.type);
    console.log("Remaining socks count:", this.menuSocks.length);
  }

  checkForEasterEggMatches() {
    if (!this.easterDropZones || this.easterDropZones.length < 2) return;

    if (this.easterDropZones[0].sock && this.easterDropZones[1].sock) {
      const sock1 = this.easterDropZones[0].sock;
      const sock2 = this.easterDropZones[1].sock;

      // Add null checks to prevent errors with garbage collected socks
      if (
        !sock1 ||
        !sock2 ||
        sock1.type === undefined ||
        sock2.type === undefined
      ) {
        console.log("One or both socks are invalid, clearing drop zones");
        this.easterDropZones[0].sock = null;
        this.easterDropZones[1].sock = null;
        return;
      }

      if (sock1.type === sock2.type) {
        // MATCH - play match sound, clear drop zones and remove socks
        this.game.audioManager.playSound("easter-egg-match", false, 0.8);
        this.easterDropZones[0].sock = null;
        this.easterDropZones[1].sock = null;

        // Create animations before removing socks
        this.createSockBallAnimation(sock1, sock2);
        this.awardPointsForMatch(sock1, sock2);

        // Completely remove matched socks from all systems
        this.removeMatchedSocks(sock1, sock2);
      } else {
        // MISMATCH - play mismatch sound, clear drop zones and reject socks
        this.game.audioManager.playSound("easter-egg-mismatch", false, 0.6);
        this.easterDropZones[0].sock = null;
        this.easterDropZones[1].sock = null;
        this.handleEasterEggMismatch(sock1, sock2);
      }
    }
  }

  handleEasterEggMismatch(sock1, sock2) {
    // Additional safety checks
    if (
      !sock1 ||
      !sock2 ||
      sock1.type === undefined ||
      sock2.type === undefined
    ) {
      console.log("Invalid socks in mismatch handler, aborting");
      return;
    }

    // Play particle burst sound for the dramatic mismatch effect
    this.game.audioManager.playSound("particle-burst", false, 0.4);

    // Create mismatch particle effects
    this.createEasterEggMismatchEffect(sock1, sock2);

    // Calculate repulsion direction between the two socks
    const dx = sock2.x - sock1.x;
    const dy = sock2.y - sock1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Normalize direction vectors
    const normalizedDx = distance > 0 ? dx / distance : 1;
    const normalizedDy = distance > 0 ? dy / distance : 0;

    // Apply strong repulsion force - stronger than before to ensure rejection
    const repulsionForce = 20; // Increased from 15

    // Push socks away from each other with more force
    sock1.vx = -normalizedDx * repulsionForce + (Math.random() - 0.5) * 8;
    sock1.vy = -normalizedDy * repulsionForce + (Math.random() - 0.5) * 8;

    sock2.vx = normalizedDx * repulsionForce + (Math.random() - 0.5) * 8;
    sock2.vy = normalizedDy * repulsionForce + (Math.random() - 0.5) * 8;

    // Add spinning effect
    sock1.rotationSpeed = (Math.random() - 0.5) * 0.3;
    sock2.rotationSpeed = (Math.random() - 0.5) * 0.3;

    // Add visual feedback
    sock1.glowEffect = 30;
    sock2.glowEffect = 30;

    // Make drop zones flash red briefly
    this.easterDropZones[0].glowEffect = 30;
    this.easterDropZones[1].glowEffect = 30;
  }

  createEasterEggMismatchEffect(sock1, sock2) {
    // Additional safety checks
    if (!sock1 || !sock2 || sock1.x === undefined || sock2.x === undefined) {
      console.log("Invalid socks in mismatch effect, aborting");
      return;
    }

    // Create red/orange particle effects for mismatch
    const centerX = (sock1.x + sock2.x) / 2;
    const centerY = (sock1.y + sock2.y) / 2;
    const mismatchColors = [
      "#FF4444",
      "#FF6B6B",
      "#FF8E53",
      "#FFB347",
      "#FF69B4",
    ];

    // Create intense particle effect for mismatch
    for (let i = 0; i < 20; i++) {
      this.createMismatchParticle(
        centerX + (Math.random() - 0.5) * this.game.getScaledValue(100),
        centerY + (Math.random() - 0.5) * this.game.getScaledValue(100),
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 12,
        mismatchColors[Math.floor(Math.random() * mismatchColors.length)],
        this.game.getScaledValue(3 + Math.random() * 3),
        60
      );
    }

    // Create additional "X" or "error" style particles
    for (let i = 0; i < 8; i++) {
      this.createMismatchParticle(
        centerX + (Math.random() - 0.5) * this.game.getScaledValue(60),
        centerY + (Math.random() - 0.5) * this.game.getScaledValue(60),
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
        "#FF0000",
        this.game.getScaledValue(4 + Math.random() * 2),
        45,
        "cross"
      );
    }
  }

  createMismatchParticle(x, y, vx, vy, color, size, life, shape = "circle") {
    if (!this.mismatchParticles) {
      this.mismatchParticles = [];
    }

    this.mismatchParticles.push({
      x: x,
      y: y,
      vx: vx,
      vy: vy,
      life: life,
      maxLife: life,
      color: color,
      size: size,
      shape: shape,
    });
  }

  awardPointsForMatch(sock1, sock2) {
    // Award 1 point for the match
    this.game.playerPoints += 1;
    this.game.saveGameData();

    // Play points gained sound
    this.game.audioManager.playSound("points-gained", false, 0.7);

    // Create point gain animation
    const centerX = (sock1.x + sock2.x) / 2;
    const centerY = (sock1.y + sock2.y) / 2;

    this.pointGainAnimations.push({
      x: centerX,
      y: centerY,
      progress: 0,
      text: "+1",
    });
  }

  createSockBallAnimation(sock1, sock2) {
    const layout = this.layoutCache;
    const startX = (sock1.x + sock2.x) / 2;
    const startY = (sock1.y + sock2.y) / 2;

    const animation = {
      startX: startX,
      startY: startY,
      endX: layout.marthaX,
      endY: layout.marthaY,
      progress: 0,
      type: sock1.type,
    };

    this.sockBallAnimations.push(animation);

    // Play rent collected sound after a delay to match the animation
    setTimeout(() => {
      this.game.audioManager.playSound("rent-collected", false, 0.5);
      this.marthaWiggling = true;
      this.marthaWiggleTimer = 0;
    }, 1000);
  }

  isLogoClicked(x, y) {
    const layout = this.layoutCache;
    return (
      x >= layout.logoX - layout.logoWidth / 2 &&
      x <= layout.logoX + layout.logoWidth / 2 &&
      y >= layout.logoY - layout.logoHeight / 2 &&
      y <= layout.logoY + layout.logoHeight / 2
    );
  }

  activateEasterEgg() {
    this.logoClickCount++;
    if (!this.easterEggActive) {
      this.easterEggActive = true;
    }
    this.spawnSingleSock();
  }

  spawnSingleSock() {
    const canvasWidth = this.game.getCanvasWidth();
    const canvasHeight = this.game.getCanvasHeight();

    const sock = {
      type: this.currentSockType,
      x:
        canvasWidth / 2 + (Math.random() - 0.5) * this.game.getScaledValue(100),
      y:
        canvasHeight / 2 +
        (Math.random() - 0.5) * this.game.getScaledValue(100),
      size: this.game.getScaledValue((Math.random() + 0.5) * 60),
      vx: (Math.random() - 0.5) * 15,
      vy: (Math.random() - 0.5) * 15,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      glowEffect: 30,
      spawnTime: Date.now(),
    };

    this.menuSocks.push(sock);

    this.currentSockType++;
    if (this.currentSockType > GameConfig.IMAGES.SOCKS.length) {
      this.currentSockType = 1;
    }
  }

  getLevelAtPosition(x, y) {
    const layout = this.layoutCache;

    for (let i = 0; i < GameConfig.LEVELS.length; i++) {
      const levelX = layout.levelStartX + i * layout.levelSpacing;
      const levelY = layout.levelAreaY;
      const halfSize = layout.levelButtonSize / 2;

      if (
        x >= levelX - halfSize &&
        x <= levelX + halfSize &&
        y >= levelY - halfSize &&
        y <= levelY + halfSize
      ) {
        return i;
      }
    }

    return -1;
  }

  getSockAtPosition(x, y) {
    for (let i = this.menuSocks.length - 1; i >= 0; i--) {
      const sock = this.menuSocks[i];
      const distance = Math.sqrt(
        Math.pow(x - sock.x, 2) + Math.pow(y - sock.y, 2)
      );

      if (distance < sock.size / 2) {
        return sock;
      }
    }

    return null;
  }

  onRender(ctx) {
    this.renderBackground(ctx);
    this.renderLogo(ctx);
    this.renderInstructions(ctx);
    this.renderMarthaImage(ctx);
    this.renderLevelButtons(ctx);
    this.renderPlayerStats(ctx);
    this.renderCreditsButton(ctx);

    if (this.easterEggActive) {
      this.renderEasterDropZones(ctx);
    }

    this.renderSockBallAnimations(ctx);
    this.renderPointGainAnimations(ctx);
    this.renderMismatchParticles(ctx);

    if (this.easterEggActive) {
      this.renderMenuSocks(ctx);
    }
  }

  renderBackground(ctx) {
    const canvasWidth = this.game.getCanvasWidth();
    const canvasHeight = this.game.getCanvasHeight();

    if (this.game.images["level-select-bg.png"]) {
      ctx.drawImage(
        this.game.images["level-select-bg.png"],
        0,
        0,
        canvasWidth,
        canvasHeight
      );
    }
  }

  renderLogo(ctx) {
    const layout = this.layoutCache;

    if (this.easterEggActive) {
      ctx.save();
      const glowIntensity = this.getGlowIntensity(10, 20);
      ctx.shadowColor = "#FFD700";
      ctx.shadowBlur = glowIntensity;

      if (this.game.images["logo.png"]) {
        ctx.drawImage(
          this.game.images["logo.png"],
          layout.logoX - layout.logoWidth / 2,
          layout.logoY - layout.logoHeight / 2,
          layout.logoWidth,
          layout.logoHeight
        );
      }

      ctx.restore();
    } else {
      if (this.game.images["logo.png"]) {
        ctx.drawImage(
          this.game.images["logo.png"],
          layout.logoX - layout.logoWidth / 2,
          layout.logoY - layout.logoHeight / 2,
          layout.logoWidth,
          layout.logoHeight
        );
      }
    }
  }

  renderInstructions(ctx) {
    const layout = this.layoutCache;

    this.renderText(
      ctx,
      "Click sock pile to shoot socks, drag socks to drop zones",
      layout.centerX,
      layout.instructionsY,
      { fontSize: layout.bodyFontSize, color: "rgba(255, 255, 255, 0.9)" }
    );

    this.renderText(
      ctx,
      "Match pairs to create sock balls, then give Martha your rent!",
      layout.centerX,
      layout.instructionsY + layout.mediumSpacing,
      { fontSize: layout.bodyFontSize, color: "rgba(255, 255, 255, 0.9)" }
    );

    if (this.easterEggActive && this.menuSocks.length > 0) {
      this.renderText(
        ctx,
        "Drag socks to the drop zones next to Martha!",
        layout.centerX,
        layout.instructionsY + layout.mediumSpacing * 2,
        { fontSize: layout.smallFontSize, color: "rgba(255, 215, 0, 0.8)" }
      );
    }
  }

  renderMarthaImage(ctx) {
    const layout = this.layoutCache;

    if (this.game.images["martha-demand.png"]) {
      ctx.save();

      if (this.marthaWiggling) {
        const wiggleAmount = Math.sin(this.marthaWiggleTimer * 0.02) * 5;
        ctx.translate(layout.marthaX + wiggleAmount, layout.marthaY);
      } else {
        ctx.translate(layout.marthaX, layout.marthaY);
      }

      ctx.drawImage(
        this.game.images["martha-demand.png"],
        -layout.marthaWidth / 2,
        -layout.marthaHeight / 2,
        layout.marthaWidth,
        layout.marthaHeight
      );

      ctx.restore();
    }
  }

  renderCreditsButton(ctx) {
    const layout = this.layoutCache;

    // Draw button background
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.strokeStyle = "rgba(255, 215, 0, 0.3)";
    ctx.lineWidth = 2;
    ctx.filter = "blur(5px)";

    ctx.fillRect(
      layout.creditsButtonX - layout.creditsButtonWidth / 2,
      layout.creditsButtonY - layout.creditsButtonHeight / 2,
      layout.creditsButtonWidth,
      layout.creditsButtonHeight
    );

    ctx.strokeRect(
      layout.creditsButtonX - layout.creditsButtonWidth / 2,
      layout.creditsButtonY - layout.creditsButtonHeight / 2,
      layout.creditsButtonWidth,
      layout.creditsButtonHeight
    );

    ctx.restore();

    // Draw button text
    this.renderText(
      ctx,
      "Credits",
      layout.creditsButtonX,
      layout.creditsButtonY,
      {
        fontSize: layout.smallFontSize,
        color: "white",
        weight: "bold",
      }
    );
  }

  renderEasterDropZones(ctx) {
    const layout = this.layoutCache;

    this.easterDropZones.forEach((zone, index) => {
      ctx.save();

      // Calculate various effects
      let glowIntensity = 0;
      let isHovered = this.dropZoneHover === zone.id;
      let isOccupied = zone.sock !== null;

      // Glow effect from snapping
      if (zone.glowEffect > 0) {
        glowIntensity = zone.glowEffect / this.DROP_ZONE_CONFIG.glowDuration;
      }

      // Hover effect
      if (isHovered) {
        glowIntensity = Math.max(glowIntensity, 0.8);
      }

      // Base zone styling - grey dashed border like match screen
      let borderColor = "rgba(200, 200, 200, 0.5)";
      let backgroundColor = "rgba(255, 255, 255, 0.1)";
      let shadowColor = "rgba(255, 255, 255, 0.2)";
      let shadowBlur = this.game.getScaledValue(5);

      if (isOccupied) {
        borderColor = "rgba(46, 204, 113, 0.8)";
        backgroundColor = "rgba(46, 204, 113, 0.3)";
        shadowColor = "rgba(46, 204, 113, 0.5)";
        shadowBlur = this.game.getScaledValue(10);
      } else if (isHovered) {
        borderColor = "#2ecc71";
        backgroundColor = "rgba(46, 204, 113, 0.25)";
        shadowColor = "rgba(46, 204, 113, 0.6)";
        shadowBlur = this.game.getScaledValue(15);
      }

      // Apply glow effect
      if (glowIntensity > 0) {
        ctx.shadowColor = shadowColor;
        ctx.shadowBlur = shadowBlur * (1 + glowIntensity);
      }

      // Draw zone background
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(
        zone.x - zone.width / 2,
        zone.y - zone.height / 2,
        zone.width,
        zone.height
      );

      // Draw dashed border
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = this.game.getScaledValue(isHovered ? 3 : 2);
      ctx.strokeRect(
        zone.x - zone.width / 2,
        zone.y - zone.height / 2,
        zone.width,
        zone.height
      );

      // Reset line dash
      ctx.setLineDash([]);

      // Pulsing effect for empty zones
      if (!isOccupied && !isHovered) {
        const pulseIntensity = Math.sin(Date.now() * 0.003) * 0.3 + 0.7;
        ctx.strokeStyle = `rgba(200, 200, 200, ${pulseIntensity * 0.6})`;
        ctx.lineWidth = this.game.getScaledValue(1);
        ctx.strokeRect(
          zone.x - zone.width / 2,
          zone.y - zone.height / 2,
          zone.width,
          zone.height
        );
      }

      ctx.restore();
    });
  }

  renderSockBallAnimations(ctx) {
    this.sockBallAnimations.forEach((animation) => {
      const currentX =
        animation.startX +
        (animation.endX - animation.startX) * animation.progress;
      const currentY =
        animation.startY +
        (animation.endY - animation.startY) * animation.progress;

      const sockBallImageName = `sockball${animation.type}.png`;
      if (this.game.images[sockBallImageName]) {
        const size = this.game.getScaledValue(30);
        ctx.save();
        ctx.translate(currentX, currentY);
        ctx.rotate(animation.progress * Math.PI * 4);
        ctx.drawImage(
          this.game.images[sockBallImageName],
          -size / 2,
          -size / 2,
          size,
          size
        );
        ctx.restore();
      }
    });
  }

  renderPointGainAnimations(ctx) {
    this.pointGainAnimations.forEach((animation) => {
      const progress = animation.progress;
      const easeProgress = this.easeOutCubic(progress);

      ctx.save();
      ctx.globalAlpha = 1 - progress;

      const currentY = animation.y - easeProgress * 60;
      const scale = 1 + easeProgress * 0.2;

      ctx.translate(animation.x, currentY);
      ctx.scale(scale, scale);

      this.renderText(ctx, animation.text, 0, 0, {
        fontSize: this.game.getScaledValue(24),
        color: "#FFD700",
        weight: "bold",
        align: "center",
      });

      ctx.restore();
    });
  }

  easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  renderLevelButtons(ctx) {
    const layout = this.layoutCache;

    this.renderText(
      ctx,
      "Select Level",
      layout.centerX,
      layout.levelAreaY - this.game.getScaledValue(50) - 60,
      { fontSize: layout.titleFontSize, weight: "bold" }
    );

    for (let i = 0; i < GameConfig.LEVELS.length; i++) {
      this.renderLevelButton(
        ctx,
        i,
        layout.levelStartX + i * layout.levelSpacing
      );
    }
  }

  renderLevelButton(ctx, levelIndex, x) {
    const layout = this.layoutCache;
    const y = layout.levelAreaY;
    const buttonSize = layout.levelButtonSize;
    const sockImageName = `sock${levelIndex + 1}.png`;
    const sockImage = this.game.images[sockImageName];

    const isUnlocked = this.game.unlockedLevels[levelIndex];
    const isCompleted = this.game.completedLevels[levelIndex];
    const isHovered = this.hoveredLevel === levelIndex;
    const isAffordable =
      this.game.playerPoints >= GameConfig.LEVEL_COSTS[levelIndex];

    ctx.save();

    if (isHovered && isUnlocked) {
      const scale = this.levelConfig.hoverScale;
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.translate(-x, -y);
    }

    const halfSize = buttonSize / 2;

    if (isUnlocked) {
      if (isCompleted) {
        if (sockImage) {
          ctx.drawImage(
            sockImage,
            x - halfSize,
            y - halfSize,
            buttonSize,
            buttonSize
          );
        }

        if (this.game.images["star.png"]) {
          ctx.save();
          ctx.shadowColor = "#FFD700";
          ctx.shadowBlur = this.game.getScaledValue(10);
          const starSize = this.game.getScaledValue(40);
          ctx.drawImage(
            this.game.images["star.png"],
            x - starSize / 2 + 15,
            y - this.game.getScaledValue(80) - 10,
            starSize,
            starSize
          );
          ctx.restore();
        }
      } else {
        const wiggle =
          Math.sin(
            this.animationFrame * this.levelConfig.wiggleSpeed + levelIndex
          ) * this.game.getScaledValue(this.levelConfig.wiggleAmount);
        if (sockImage) {
          ctx.drawImage(
            sockImage,
            x - halfSize + wiggle,
            y - halfSize,
            buttonSize,
            buttonSize
          );
        }
      }

      this.renderText(
        ctx,
        `Level ${levelIndex + 1}`,
        x,
        y + this.game.getScaledValue(60),
        { fontSize: layout.bodyFontSize }
      );
    } else {
      if (sockImage) {
        ctx.save();
        ctx.globalAlpha = isAffordable ? 0.7 : 0.3;
        ctx.filter = isAffordable ? "brightness(0.6)" : "brightness(0.3)";
        ctx.drawImage(
          sockImage,
          x - halfSize,
          y - halfSize,
          buttonSize,
          buttonSize
        );
        ctx.restore();
      }

      this.renderText(
        ctx,
        `Cost: ${GameConfig.LEVEL_COSTS[levelIndex]}`,
        x,
        y - this.game.getScaledValue(50),
        {
          fontSize: layout.smallFontSize,
          color: isAffordable ? "#90EE90" : "#FFB6C1",
        }
      );

      this.renderText(
        ctx,
        `Level ${levelIndex + 1}`,
        x,
        y + this.game.getScaledValue(60),
        { fontSize: layout.bodyFontSize }
      );

      if (isAffordable) {
        this.renderText(
          ctx,
          "Click to unlock!",
          x,
          y + this.game.getScaledValue(80),
          { fontSize: layout.smallFontSize, color: "#90EE90" }
        );
      }
    }

    ctx.restore();
  }

  renderPlayerStats(ctx) {
    const layout = this.layoutCache;
    const panelX = layout.centerX - layout.statsPanelWidth / 2;
    const panelY = layout.statsY;

    this.renderPanel(
      ctx,
      panelX,
      panelY,
      layout.statsPanelWidth,
      layout.statsPanelHeight
    );

    this.renderText(
      ctx,
      `Points: ${this.game.playerPoints}`,
      layout.centerX,
      panelY + layout.statsPanelHeight / 2,
      { fontSize: layout.headerFontSize, color: "#FFD700", weight: "bold" }
    );
  }

  renderMismatchParticles(ctx) {
    if (!this.mismatchParticles) return;

    this.mismatchParticles.forEach((particle) => {
      ctx.save();

      const alpha = particle.life / particle.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;

      if (particle.shape === "cross") {
        // Render cross-shaped particles for mismatch
        const halfSize = particle.size / 2;
        ctx.fillRect(
          particle.x - halfSize,
          particle.y - halfSize / 3,
          particle.size,
          particle.size / 3
        );
        ctx.fillRect(
          particle.x - halfSize / 3,
          particle.y - halfSize,
          particle.size / 3,
          particle.size
        );
      } else {
        // Render normal circular particles
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  }

  renderMenuSocks(ctx) {
    this.menuSocks.forEach((sock) => {
      ctx.save();

      // Always render with full alpha - no fading
      if (sock.glowEffect > 0) {
        ctx.shadowColor = "#FFD700";
        ctx.shadowBlur = sock.glowEffect;
        sock.glowEffect--;
      } else {
        ctx.shadowColor = "rgba(255, 255, 255, 0.3)";
        ctx.shadowBlur = this.game.getScaledValue(5);
      }

      ctx.translate(sock.x, sock.y);
      ctx.rotate(sock.rotation);

      const sockImageName = `sock${sock.type}.png`;
      if (this.game.images[sockImageName]) {
        ctx.drawImage(
          this.game.images[sockImageName],
          -sock.size / 2,
          -sock.size / 2,
          sock.size,
          sock.size
        );
      }

      ctx.restore();
    });
  }

  destroy() {
    this.cleanup();
  }
}
