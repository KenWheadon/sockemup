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

    // You Win graphic configuration
    this.YOU_WIN_CONFIG = {
      maxWidth: 300 * 1.25,
      maxHeight: 120 * 1.25,
      offsetY: 225,
      glowIntensity: 15,
      pulseSpeed: 0.005,
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
        left: -500,
        right: 2000,
        top: -500,
        bottom: 2000,
      },
    };

    // Level button configuration
    this.levelConfig = {
      baseSpacing: 150,
      baseButtonSize: 90,
      wiggleSpeed: 0.01,
      wiggleAmount: 3,
      hoverScale: 1.15,
      clickScale: 0.95,
      columns: 3,
      rows: 3,
      horizontalSpacing: 180,
      verticalSpacing: 150,
    };

    // Level button hover animations
    this.levelHoverAnimations = Array(9).fill(0);
    this.levelPulseTimers = Array(9).fill(0);

    // Story replay button
    this.storyReplayButton = {
      x: 0,
      y: 0,
      width: 120,
      height: 40,
      hovered: false,
    };

    // Credits button
    this.creditsButton = {
      x: 0,
      y: 0,
      width: 120,
      height: 40,
      hovered: false,
    };

    // Achievements drawer
    this.achievementsDrawer = {
      isOpen: false,
      animationProgress: 0,
      width: 0,
      hoveredAchievement: null,
      scrollOffset: 0,
      maxScroll: 0,
      isDraggingScrollbar: false,
      scrollbarHover: false,
      button: {
        x: 0,
        y: 0,
        width: 50,
        height: 50,
        hovered: false,
      },
      closeButton: {
        x: 0,
        y: 0,
        size: 30,
        hovered: false,
      },
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
        this.marthaImageSize.width = maxSize;
        this.marthaImageSize.height = maxSize / aspectRatio;
      } else {
        this.marthaImageSize.width = maxSize * aspectRatio;
        this.marthaImageSize.height = maxSize;
      }
    } else {
      this.marthaImageSize.width = maxSize;
      this.marthaImageSize.height = maxSize;
    }
  }

  areAllLevelsCompleted() {
    return this.game.completedLevels.every((completed) => completed);
  }

  createLayoutCache() {
    const baseLayout = super.createLayoutCache();
    const canvasWidth = this.game.getCanvasWidth();
    const canvasHeight = this.game.getCanvasHeight();

    this.calculateMarthaImageSize();
    const youWinImageSize = this.calculateYouWinImageSize();

    return {
      ...baseLayout,
      logoX: canvasWidth / 2,
      logoY: this.game.getScaledValue(80),
      logoWidth: this.game.getScaledValue(200),
      logoHeight: this.game.getScaledValue(100),
      instructionsY: this.game.getScaledValue(150),
      levelButtonSize: this.game.getScaledValue(
        this.levelConfig.baseButtonSize
      ),
      levelHorizontalSpacing: this.game.getScaledValue(
        this.levelConfig.horizontalSpacing
      ),
      levelVerticalSpacing: this.game.getScaledValue(
        this.levelConfig.verticalSpacing
      ),
      levelGridStartX:
        canvasWidth / 2 -
        ((this.levelConfig.columns - 1) *
          this.game.getScaledValue(this.levelConfig.horizontalSpacing)) /
          2,
      levelGridStartY: canvasHeight / 2 - this.game.getScaledValue(30),
      marthaX: this.game.getScaledValue(this.MARTHA_CONFIG.offsetX),
      marthaY: this.game.getScaledValue(this.MARTHA_CONFIG.offsetY),
      marthaWidth: this.marthaImageSize.width,
      marthaHeight: this.marthaImageSize.height,
      dropZoneSize: this.game.getScaledValue(this.DROP_ZONE_CONFIG.size),
      dropZone1X: this.game.getScaledValue(this.DROP_ZONE_CONFIG.offsetX),
      dropZone1Y: this.game.getScaledValue(this.DROP_ZONE_CONFIG.offsetY1),
      dropZone2X: this.game.getScaledValue(this.DROP_ZONE_CONFIG.offsetX),
      dropZone2Y: this.game.getScaledValue(this.DROP_ZONE_CONFIG.offsetY2),
      statsX: this.game.getScaledValue(110),
      statsY: canvasHeight - this.game.getScaledValue(80),
      statsPanelWidth: this.game.getScaledValue(200),
      statsPanelHeight: this.game.getScaledValue(40),
      creditsButtonX: canvasWidth - this.game.getScaledValue(80),
      creditsButtonY: this.game.getScaledValue(50),
      creditsButtonWidth: this.game.getScaledValue(120),
      creditsButtonHeight: this.game.getScaledValue(40),
      storyReplayButtonX: canvasWidth - this.game.getScaledValue(80),
      storyReplayButtonY: this.game.getScaledValue(110),
      storyReplayButtonWidth: this.game.getScaledValue(120),
      storyReplayButtonHeight: this.game.getScaledValue(40),
      achievementsDrawerWidth: this.game.getScaledValue(500),
      achievementsDrawerButtonX: this.game.getScaledValue(35),
      achievementsDrawerButtonY: this.game.getScaledValue(50),
      achievementsDrawerButtonSize: this.game.getScaledValue(50),
      youWinX: canvasWidth / 2,
      youWinY:
        canvasHeight / 2 +
        this.game.getScaledValue(this.YOU_WIN_CONFIG.offsetY),
      youWinWidth: youWinImageSize.width,
      youWinHeight: youWinImageSize.height,
    };
  }

  onResize() {
    const canvasWidth = this.game.getCanvasWidth();
    const canvasHeight = this.game.getCanvasHeight();

    this.menuPhysics.bounds = {
      left: -500,
      right: canvasWidth + 500,
      top: -500,
      bottom: canvasHeight + 500,
    };

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

    console.log("🎵 Level select setup - starting menu music");
    this.game.audioManager.playMusic("menu-music", true);

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

    if (this.game.storyManager.shouldShowStory()) {
      this.game.storyManager.show();
    }
  }

  cleanup() {
    super.cleanup();

    console.log("🎵 Level select cleanup - stopping menu music");
    this.game.audioManager.stopMusic();

    if (this.creditsOpen) {
      this.hideCredits();
    }

    const creditsModal = document.getElementById("creditsModal");
    if (creditsModal) {
      creditsModal.remove();
    }
  }

  setupCreditsModal() {
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

    if (closeCredits) {
      closeCredits.addEventListener("click", () => {
        this.game.audioManager.playSound("button-click", false, 0.5);
        this.hideCredits();
      });

      closeCredits.addEventListener("mouseenter", () => {
        this.game.audioManager.playSound("button-hover", false, 0.3);
      });
    }

    if (this.creditsModal) {
      this.creditsModal.addEventListener("click", (e) => {
        if (e.target === this.creditsModal) {
          this.hideCredits();
        }
      });
    }

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
    if (this.game.storyManager.showingStory) {
      this.game.storyManager.update(deltaTime);
      return;
    }

    for (let i = 0; i < this.levelHoverAnimations.length; i++) {
      const isHovered = this.hoveredLevel === i;
      const targetValue = isHovered ? 1 : 0;
      const animSpeed = 0.008;

      if (this.levelHoverAnimations[i] < targetValue) {
        this.levelHoverAnimations[i] = Math.min(
          this.levelHoverAnimations[i] + animSpeed * deltaTime,
          targetValue
        );
      } else if (this.levelHoverAnimations[i] > targetValue) {
        this.levelHoverAnimations[i] = Math.max(
          this.levelHoverAnimations[i] - animSpeed * deltaTime,
          targetValue
        );
      }

      if (this.game.unlockedLevels[i] && !this.game.completedLevels[i]) {
        this.levelPulseTimers[i] += deltaTime * 0.002;
      }
    }

    this.storyReplayButton.hoverProgress =
      this.storyReplayButton.hoverProgress || 0;
    this.creditsButton.hoverProgress = this.creditsButton.hoverProgress || 0;

    const buttonAnimSpeed = 0.008;

    const storyTarget = this.storyReplayButton.hovered ? 1 : 0;
    if (this.storyReplayButton.hoverProgress < storyTarget) {
      this.storyReplayButton.hoverProgress = Math.min(
        this.storyReplayButton.hoverProgress + buttonAnimSpeed * deltaTime,
        storyTarget
      );
    } else if (this.storyReplayButton.hoverProgress > storyTarget) {
      this.storyReplayButton.hoverProgress = Math.max(
        this.storyReplayButton.hoverProgress - buttonAnimSpeed * deltaTime,
        storyTarget
      );
    }

    const creditsTarget = this.creditsButton.hovered ? 1 : 0;
    if (this.creditsButton.hoverProgress < creditsTarget) {
      this.creditsButton.hoverProgress = Math.min(
        this.creditsButton.hoverProgress + buttonAnimSpeed * deltaTime,
        creditsTarget
      );
    } else if (this.creditsButton.hoverProgress > creditsTarget) {
      this.creditsButton.hoverProgress = Math.max(
        this.creditsButton.hoverProgress - buttonAnimSpeed * deltaTime,
        creditsTarget
      );
    }

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

    this.easterDropZones.forEach((zone) => {
      if (zone.glowEffect > 0) zone.glowEffect--;
      if (zone.hoverEffect > 0) zone.hoverEffect--;
      if (zone.snapEffect > 0) zone.snapEffect--;
    });

    this.sockBallAnimations = this.sockBallAnimations.filter((animation) => {
      animation.progress += deltaTime / 1000;
      return animation.progress < 1;
    });

    this.pointGainAnimations = this.pointGainAnimations.filter((animation) => {
      animation.progress += deltaTime / 2000;
      return animation.progress < 1;
    });

    const drawerAnimSpeed = 0.008;
    const drawerTarget = this.achievementsDrawer.isOpen ? 1 : 0;
    if (this.achievementsDrawer.animationProgress < drawerTarget) {
      this.achievementsDrawer.animationProgress = Math.min(
        this.achievementsDrawer.animationProgress + drawerAnimSpeed * deltaTime,
        drawerTarget
      );
    } else if (this.achievementsDrawer.animationProgress > drawerTarget) {
      this.achievementsDrawer.animationProgress = Math.max(
        this.achievementsDrawer.animationProgress - drawerAnimSpeed * deltaTime,
        drawerTarget
      );
    }

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

      if (this.isSockOutsideBounds(sock)) {
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
    if (this.game.storyManager.showingStory) {
      this.game.storyManager.handleMouseMove(x, y);
      return;
    }

    const previousHoveredLevel = this.hoveredLevel;
    this.hoveredLevel = this.getLevelAtPosition(x, y);

    if (
      this.hoveredLevel !== previousHoveredLevel &&
      this.hoveredLevel !== -1
    ) {
      this.game.audioManager.playSound("button-hover", false, 0.3);
    }

    const layout = this.layoutCache;
    const storyButtonX =
      layout.storyReplayButtonX - layout.storyReplayButtonWidth / 2;
    const storyButtonY =
      layout.storyReplayButtonY - layout.storyReplayButtonHeight / 2;

    this.storyReplayButton.hovered = this.isPointInRect(x, y, {
      x: storyButtonX,
      y: storyButtonY,
      width: layout.storyReplayButtonWidth,
      height: layout.storyReplayButtonHeight,
    });

    const creditsButtonX =
      layout.creditsButtonX - layout.creditsButtonWidth / 2;
    const creditsButtonY =
      layout.creditsButtonY - layout.creditsButtonHeight / 2;

    this.creditsButton.hovered = this.isPointInRect(x, y, {
      x: creditsButtonX,
      y: creditsButtonY,
      width: layout.creditsButtonWidth,
      height: layout.creditsButtonHeight,
    });

    const drawerButtonX =
      layout.achievementsDrawerButtonX -
      layout.achievementsDrawerButtonSize / 2;
    const drawerButtonY =
      layout.achievementsDrawerButtonY -
      layout.achievementsDrawerButtonSize / 2;

    this.achievementsDrawer.button.hovered = this.isPointInRect(x, y, {
      x: drawerButtonX,
      y: drawerButtonY,
      width: layout.achievementsDrawerButtonSize,
      height: layout.achievementsDrawerButtonSize,
    });

    if (
      this.achievementsDrawer.isOpen &&
      this.achievementsDrawer.animationProgress > 0.5
    ) {
      const drawerWidth = layout.achievementsDrawerWidth;
      const drawerX =
        -drawerWidth + drawerWidth * this.achievementsDrawer.animationProgress;
      const achievements = Object.values(GameConfig.ACHIEVEMENTS);
      const startY = this.game.getScaledValue(115);
      const spacing = this.game.getScaledValue(75);

      const scrollbarX = drawerX + drawerWidth - this.game.getScaledValue(20);
      const scrollbarY = this.game.getScaledValue(80);
      const scrollbarWidth = this.game.getScaledValue(10);
      const canvasHeight = this.game.getCanvasHeight();
      const scrollbarHeight = canvasHeight - this.game.getScaledValue(100);

      this.achievementsDrawer.scrollbarHover =
        x >= scrollbarX &&
        x <= scrollbarX + scrollbarWidth &&
        y >= scrollbarY &&
        y <= scrollbarY + scrollbarHeight;

      if (this.achievementsDrawer.isDraggingScrollbar) {
        const relativeY = y - scrollbarY;
        const scrollPercentage = Math.max(
          0,
          Math.min(1, relativeY / scrollbarHeight)
        );
        this.achievementsDrawer.scrollOffset =
          scrollPercentage * this.achievementsDrawer.maxScroll;
      }

      // Close button hover detection
      const closeButtonSize = this.game.getScaledValue(30);
      const closeButtonX = drawerX + drawerWidth - this.game.getScaledValue(20);
      const closeButtonY = this.game.getScaledValue(20);

      const dx = x - closeButtonX;
      const dy = y - closeButtonY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      this.achievementsDrawer.closeButton.hovered =
        distance <= closeButtonSize / 2;

      this.achievementsDrawer.hoveredAchievement = null;
      achievements.forEach((achievement, index) => {
        const achY =
          startY + index * spacing - this.achievementsDrawer.scrollOffset;
        const cardX = drawerX + this.game.getScaledValue(15);
        const cardY = achY - this.game.getScaledValue(22);
        const cardWidth = drawerWidth - this.game.getScaledValue(50);
        const cardHeight = this.game.getScaledValue(65);

        if (
          x >= cardX &&
          x <= cardX + cardWidth &&
          y >= cardY &&
          y <= cardY + cardHeight &&
          achY > this.game.getScaledValue(80) &&
          achY < canvasHeight - this.game.getScaledValue(20)
        ) {
          this.achievementsDrawer.hoveredAchievement = achievement.id;
        }
      });
    } else {
      this.achievementsDrawer.hoveredAchievement = null;
      this.achievementsDrawer.scrollbarHover = false;
      this.achievementsDrawer.closeButton.hovered = false;
    }

    if (this.isDragging && this.dragSock) {
      this.dragSock.x = x - this.dragOffset.x;
      this.dragSock.y = y - this.dragOffset.y;
    }

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
    // Check if close button was clicked (must be before scrollbar check)
    if (
      this.achievementsDrawer.closeButton.hovered &&
      this.achievementsDrawer.isOpen
    ) {
      return false; // Let onClick handle it
    }

    if (
      this.achievementsDrawer.isOpen &&
      this.achievementsDrawer.animationProgress > 0.5
    ) {
      const layout = this.layoutCache;
      const drawerWidth = layout.achievementsDrawerWidth;
      const drawerX =
        -drawerWidth + drawerWidth * this.achievementsDrawer.animationProgress;
      const scrollbarX = drawerX + drawerWidth - this.game.getScaledValue(20);
      const scrollbarY = this.game.getScaledValue(80);
      const scrollbarWidth = this.game.getScaledValue(10);
      const canvasHeight = this.game.getCanvasHeight();
      const scrollbarHeight = canvasHeight - this.game.getScaledValue(100);

      if (
        x >= scrollbarX &&
        x <= scrollbarX + scrollbarWidth &&
        y >= scrollbarY &&
        y <= scrollbarY + scrollbarHeight
      ) {
        this.achievementsDrawer.isDraggingScrollbar = true;
        return true;
      }
    }

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
    if (this.achievementsDrawer.isDraggingScrollbar) {
      this.achievementsDrawer.isDraggingScrollbar = false;
      return;
    }

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
    if (this.game.storyManager.showingStory) {
      this.game.storyManager.handleClick(x, y);
      return;
    }

    // Check close button FIRST and only if drawer is open
    if (
      this.achievementsDrawer.closeButton.hovered &&
      this.achievementsDrawer.isOpen
    ) {
      this.game.audioManager.playSound("button-click", false, 0.5);
      this.toggleAchievementsDrawer();
      return true;
    }

    if (this.achievementsDrawer.button.hovered) {
      this.game.audioManager.playSound("button-click", false, 0.5);
      this.toggleAchievementsDrawer();
      return true;
    }

    if (this.storyReplayButton.hovered) {
      this.game.audioManager.playSound("button-click", false, 0.5);
      this.game.storyManager.show();
      return true;
    }

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
        this.game.audioManager.playSound("button-click", false, 0.5);
        this.game.startLevel(levelIndex);
        return true;
      } else if (this.game.playerPoints >= GameConfig.LEVEL_COSTS[levelIndex]) {
        this.game.audioManager.playSound("level-unlock", false, 0.6);
        this.game.playerPoints -= GameConfig.LEVEL_COSTS[levelIndex];
        this.game.unlockedLevels[levelIndex] = true;
        this.game.saveGameData();
        this.game.startLevel(levelIndex);
        return true;
      } else {
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
    zone.snapEffect = 15;
  }

  removeMatchedSocks(sock1, sock2) {
    this.menuSocks = this.menuSocks.filter((s) => s !== sock1 && s !== sock2);

    if (this.dragSock === sock1 || this.dragSock === sock2) {
      this.isDragging = false;
      this.dragSock = null;
    }

    this.clearSockFromDropZones(sock1);
    this.clearSockFromDropZones(sock2);

    console.log("Removed matched socks:", sock1.type, sock2.type);
    console.log("Remaining socks count:", this.menuSocks.length);
  }

  checkForEasterEggMatches() {
    if (!this.easterDropZones || this.easterDropZones.length < 2) return;

    if (this.easterDropZones[0].sock && this.easterDropZones[1].sock) {
      const sock1 = this.easterDropZones[0].sock;
      const sock2 = this.easterDropZones[1].sock;

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
        this.game.audioManager.playSound("easter-egg-match", false, 0.8);
        this.easterDropZones[0].sock = null;
        this.easterDropZones[1].sock = null;

        this.createSockBallAnimation(sock1, sock2);
        this.awardPointsForMatch(sock1, sock2);

        this.removeMatchedSocks(sock1, sock2);
      } else {
        this.game.audioManager.playSound("easter-egg-mismatch", false, 0.6);
        this.easterDropZones[0].sock = null;
        this.easterDropZones[1].sock = null;
        this.handleEasterEggMismatch(sock1, sock2);
      }
    }
  }

  handleEasterEggMismatch(sock1, sock2) {
    if (
      !sock1 ||
      !sock2 ||
      sock1.type === undefined ||
      sock2.type === undefined
    ) {
      console.log("Invalid socks in mismatch handler, aborting");
      return;
    }

    this.game.audioManager.playSound("particle-burst", false, 0.4);

    this.createEasterEggMismatchEffect(sock1, sock2);

    const dx = sock2.x - sock1.x;
    const dy = sock2.y - sock1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const normalizedDx = distance > 0 ? dx / distance : 1;
    const normalizedDy = distance > 0 ? dy / distance : 0;

    const repulsionForce = 20;

    sock1.vx = -normalizedDx * repulsionForce + (Math.random() - 0.5) * 8;
    sock1.vy = -normalizedDy * repulsionForce + (Math.random() - 0.5) * 8;

    sock2.vx = normalizedDx * repulsionForce + (Math.random() - 0.5) * 8;
    sock2.vy = normalizedDy * repulsionForce + (Math.random() - 0.5) * 8;

    sock1.rotationSpeed = (Math.random() - 0.5) * 0.3;
    sock2.rotationSpeed = (Math.random() - 0.5) * 0.3;

    sock1.glowEffect = 30;
    sock2.glowEffect = 30;

    this.easterDropZones[0].glowEffect = 30;
    this.easterDropZones[1].glowEffect = 30;
  }

  createEasterEggMismatchEffect(sock1, sock2) {
    if (!sock1 || !sock2 || sock1.x === undefined || sock2.x === undefined) {
      console.log("Invalid socks in mismatch effect, aborting");
      return;
    }

    const centerX = (sock1.x + sock2.x) / 2;
    const centerY = (sock1.y + sock2.y) / 2;
    const mismatchColors = [
      "#FF4444",
      "#FF6B6B",
      "#FF8E53",
      "#FFB347",
      "#FF69B4",
    ];

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
    this.game.playerPoints += 1;
    this.game.saveGameData();

    this.game.audioManager.playSound("points-gained", false, 0.7);

    const centerX = (sock1.x + sock2.x) / 2;
    const centerY = (sock1.y + sock2.y) / 2;

    this.pointGainAnimations.push({
      x: centerX,
      y: centerY,
      progress: 0,
      text: "+1",
    });
  }

  toggleAchievementsDrawer() {
    this.achievementsDrawer.isOpen = !this.achievementsDrawer.isOpen;

    if (this.achievementsDrawer.isOpen) {
      this.achievementsDrawer.scrollOffset = 0;
    }
  }

  onMouseWheel(deltaY) {
    if (
      this.achievementsDrawer.isOpen &&
      this.achievementsDrawer.animationProgress > 0.5
    ) {
      const scrollSpeed = this.game.getScaledValue(30);
      this.achievementsDrawer.scrollOffset = Math.max(
        0,
        Math.min(
          this.achievementsDrawer.maxScroll,
          this.achievementsDrawer.scrollOffset + deltaY * scrollSpeed
        )
      );
      return true;
    }
    return false;
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
      const col = i % this.levelConfig.columns;
      const row = Math.floor(i / this.levelConfig.columns);

      const levelX =
        layout.levelGridStartX + col * layout.levelHorizontalSpacing;
      const levelY = layout.levelGridStartY + row * layout.levelVerticalSpacing;
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

  calculateYouWinImageSize() {
    const youWinImage = this.game.images["you-win.png"];
    if (!youWinImage) {
      return { width: 0, height: 0 };
    }

    const maxWidth = this.game.getScaledValue(this.YOU_WIN_CONFIG.maxWidth);
    const maxHeight = this.game.getScaledValue(this.YOU_WIN_CONFIG.maxHeight);

    if (this.YOU_WIN_CONFIG.maintainAspectRatio) {
      const aspectRatio = youWinImage.width / youWinImage.height;

      if (aspectRatio > maxWidth / maxHeight) {
        return {
          width: maxWidth,
          height: maxWidth / aspectRatio,
        };
      } else {
        return {
          width: maxHeight * aspectRatio,
          height: maxHeight,
        };
      }
    } else {
      return {
        width: maxWidth,
        height: maxHeight,
      };
    }
  }

  renderYouWinGraphic(ctx) {
    const layout = this.layoutCache;

    if (this.game.images["you-win.png"]) {
      ctx.save();

      const time = Date.now();
      const pulseIntensity =
        Math.sin(time * this.YOU_WIN_CONFIG.pulseSpeed) * 0.3 + 0.7;

      ctx.shadowColor = "#FFD700";
      ctx.shadowBlur = this.game.getScaledValue(
        this.YOU_WIN_CONFIG.glowIntensity * pulseIntensity
      );

      const scale = 1 + (pulseIntensity - 0.7) * 0.05;
      ctx.translate(layout.youWinX, layout.youWinY);
      ctx.scale(scale, scale);

      ctx.drawImage(
        this.game.images["you-win.png"],
        -layout.youWinWidth / 2,
        -layout.youWinHeight / 2,
        layout.youWinWidth,
        layout.youWinHeight
      );

      ctx.restore();
    }
  }

  onRender(ctx) {
    this.renderBackground(ctx);
    this.renderLogo(ctx);
    this.renderInstructions(ctx);
    this.renderMarthaImage(ctx);
    this.renderLevelButtons(ctx);

    if (this.areAllLevelsCompleted()) {
      this.renderYouWinGraphic(ctx);
    }

    this.renderPlayerStats(ctx);
    this.renderCreditsButton(ctx);
    this.renderStoryReplayButton(ctx);
    this.renderAchievementsDrawer(ctx);

    if (this.easterEggActive) {
      this.renderEasterDropZones(ctx);
    }

    this.renderSockBallAnimations(ctx);
    this.renderPointGainAnimations(ctx);
    this.renderMismatchParticles(ctx);

    if (this.easterEggActive) {
      this.renderMenuSocks(ctx);
    }

    if (this.game.storyManager.showingStory) {
      this.game.storyManager.render(ctx);
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
      {
        fontSize: layout.bodyFontSize,
        color: "rgba(255, 255, 255, 0.9)",
      }
    );

    this.renderText(
      ctx,
      "Match pairs to create sock balls, then give Martha your rent!",
      layout.centerX,
      layout.instructionsY + layout.mediumSpacing,
      {
        fontSize: layout.bodyFontSize,
        color: "rgba(255, 255, 255, 0.9)",
      }
    );

    if (this.easterEggActive && this.menuSocks.length > 0) {
      this.renderText(
        ctx,
        "Drag socks to the drop zones next to Martha!",
        layout.centerX,
        layout.instructionsY + layout.mediumSpacing * 2,
        {
          fontSize: layout.smallFontSize,
          color: "rgba(255, 215, 0, 0.8)",
        }
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
    const button = this.creditsButton;

    const hoverProgress = button.hoverProgress || 0;

    ctx.save();

    const x = layout.creditsButtonX - layout.creditsButtonWidth / 2;
    const y = layout.creditsButtonY - layout.creditsButtonHeight / 2;
    const radius = this.game.getScaledValue(8);

    const gradient = ctx.createLinearGradient(
      x,
      y,
      x,
      y + layout.creditsButtonHeight
    );
    const baseColor1 = { r: 80, g: 120, b: 200, a: 0.85 };
    const hoverColor1 = { r: 100, g: 150, b: 255, a: 0.95 };
    const baseColor2 = { r: 50, g: 85, b: 180, a: 0.85 };
    const hoverColor2 = { r: 65, g: 105, b: 225, a: 0.95 };

    const r1 = baseColor1.r + (hoverColor1.r - baseColor1.r) * hoverProgress;
    const g1 = baseColor1.g + (hoverColor1.g - baseColor1.g) * hoverProgress;
    const b1 = baseColor1.b + (hoverColor1.b - baseColor1.b) * hoverProgress;
    const a1 = baseColor1.a + (hoverColor1.a - baseColor1.a) * hoverProgress;

    const r2 = baseColor2.r + (hoverColor2.r - baseColor2.r) * hoverProgress;
    const g2 = baseColor2.g + (hoverColor2.g - baseColor2.g) * hoverProgress;
    const b2 = baseColor2.b + (hoverColor2.b - baseColor2.b) * hoverProgress;
    const a2 = baseColor2.a + (hoverColor2.a - baseColor2.a) * hoverProgress;

    gradient.addColorStop(0, `rgba(${r1}, ${g1}, ${b1}, ${a1})`);
    gradient.addColorStop(1, `rgba(${r2}, ${g2}, ${b2}, ${a2})`);
    ctx.fillStyle = gradient;

    if (hoverProgress > 0) {
      ctx.shadowColor = "rgba(100, 150, 255, 0.6)";
      ctx.shadowBlur = this.game.getScaledValue(12) * hoverProgress;
    }

    const strokeOpacity = 0.6 + 0.3 * hoverProgress;
    ctx.strokeStyle = `rgba(${100 + 50 * hoverProgress}, ${
      149 + 51 * hoverProgress
    }, 237, ${strokeOpacity})`;
    ctx.lineWidth = this.game.getScaledValue(3);

    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + layout.creditsButtonWidth - radius, y);
    ctx.quadraticCurveTo(
      x + layout.creditsButtonWidth,
      y,
      x + layout.creditsButtonWidth,
      y + radius
    );
    ctx.lineTo(
      x + layout.creditsButtonWidth,
      y + layout.creditsButtonHeight - radius
    );
    ctx.quadraticCurveTo(
      x + layout.creditsButtonWidth,
      y + layout.creditsButtonHeight,
      x + layout.creditsButtonWidth - radius,
      y + layout.creditsButtonHeight
    );
    ctx.lineTo(x + radius, y + layout.creditsButtonHeight);
    ctx.quadraticCurveTo(
      x,
      y + layout.creditsButtonHeight,
      x,
      y + layout.creditsButtonHeight - radius
    );
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();

    ctx.fill();
    ctx.stroke();

    if (hoverProgress > 0) {
      ctx.shadowColor = "rgba(100, 149, 237, 0.8)";
      ctx.shadowBlur = this.game.getScaledValue(10) * hoverProgress;
      ctx.stroke();
    }

    ctx.restore();

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

  renderStoryReplayButton(ctx) {
    const layout = this.layoutCache;
    const button = this.storyReplayButton;

    ctx.save();

    const x = layout.storyReplayButtonX - layout.storyReplayButtonWidth / 2;
    const y = layout.storyReplayButtonY - layout.storyReplayButtonHeight / 2;
    const radius = this.game.getScaledValue(8);

    const gradient = ctx.createLinearGradient(
      x,
      y,
      x,
      y + layout.storyReplayButtonHeight
    );
    if (button.hovered) {
      gradient.addColorStop(0, "rgba(100, 150, 255, 0.95)");
      gradient.addColorStop(1, "rgba(65, 105, 225, 0.95)");
    } else {
      gradient.addColorStop(0, "rgba(80, 120, 200, 0.85)");
      gradient.addColorStop(1, "rgba(50, 85, 180, 0.85)");
    }
    ctx.fillStyle = gradient;

    if (button.hovered) {
      ctx.shadowColor = "rgba(100, 150, 255, 0.6)";
      ctx.shadowBlur = this.game.getScaledValue(12);
    }

    ctx.strokeStyle = button.hovered
      ? "rgba(150, 200, 255, 0.9)"
      : "rgba(100, 149, 237, 0.6)";
    ctx.lineWidth = this.game.getScaledValue(3);

    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + layout.storyReplayButtonWidth - radius, y);
    ctx.quadraticCurveTo(
      x + layout.storyReplayButtonWidth,
      y,
      x + layout.storyReplayButtonWidth,
      y + radius
    );
    ctx.lineTo(
      x + layout.storyReplayButtonWidth,
      y + layout.storyReplayButtonHeight - radius
    );
    ctx.quadraticCurveTo(
      x + layout.storyReplayButtonWidth,
      y + layout.storyReplayButtonHeight,
      x + layout.storyReplayButtonWidth - radius,
      y + layout.storyReplayButtonHeight
    );
    ctx.lineTo(x + radius, y + layout.storyReplayButtonHeight);
    ctx.quadraticCurveTo(
      x,
      y + layout.storyReplayButtonHeight,
      x,
      y + layout.storyReplayButtonHeight - radius
    );
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();

    ctx.fill();
    ctx.stroke();

    if (button.hovered) {
      ctx.shadowColor = "rgba(100, 149, 237, 0.8)";
      ctx.shadowBlur = this.game.getScaledValue(10);
      ctx.stroke();
    }

    ctx.restore();

    this.renderText(
      ctx,
      "📖 Story",
      layout.storyReplayButtonX,
      layout.storyReplayButtonY,
      {
        fontSize: layout.smallFontSize,
        color: "white",
        weight: "bold",
      }
    );
  }

  renderAchievementsDrawer(ctx) {
    const layout = this.layoutCache;
    const progress = this.achievementsDrawer.animationProgress;

    const buttonX = layout.achievementsDrawerButtonX;
    const buttonY = layout.achievementsDrawerButtonY;
    const buttonSize = layout.achievementsDrawerButtonSize;

    ctx.save();

    const gradient = ctx.createLinearGradient(
      buttonX - buttonSize / 2,
      buttonY - buttonSize / 2,
      buttonX - buttonSize / 2,
      buttonY + buttonSize / 2
    );
    if (this.achievementsDrawer.button.hovered) {
      gradient.addColorStop(0, "rgba(255, 215, 0, 0.95)");
      gradient.addColorStop(1, "rgba(255, 165, 0, 0.95)");
    } else {
      gradient.addColorStop(0, "rgba(220, 180, 0, 0.85)");
      gradient.addColorStop(1, "rgba(200, 140, 0, 0.85)");
    }
    ctx.fillStyle = gradient;

    if (this.achievementsDrawer.button.hovered) {
      ctx.shadowColor = "rgba(255, 215, 0, 0.6)";
      ctx.shadowBlur = this.game.getScaledValue(12);
    }

    ctx.strokeStyle = this.achievementsDrawer.button.hovered
      ? "rgba(255, 230, 100, 0.9)"
      : "rgba(220, 180, 0, 0.6)";
    ctx.lineWidth = this.game.getScaledValue(3);

    const radius = this.game.getScaledValue(8);
    const x = buttonX - buttonSize / 2;
    const y = buttonY - buttonSize / 2;

    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + buttonSize - radius, y);
    ctx.quadraticCurveTo(x + buttonSize, y, x + buttonSize, y + radius);
    ctx.lineTo(x + buttonSize, y + buttonSize - radius);
    ctx.quadraticCurveTo(
      x + buttonSize,
      y + buttonSize,
      x + buttonSize - radius,
      y + buttonSize
    );
    ctx.lineTo(x + radius, y + buttonSize);
    ctx.quadraticCurveTo(x, y + buttonSize, x, y + buttonSize - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();

    ctx.fill();
    ctx.stroke();

    ctx.restore();

    this.renderText(ctx, "🏆", buttonX, buttonY, {
      fontSize: this.game.getScaledValue(28),
      align: "center",
      baseline: "middle",
    });

    if (progress > 0) {
      const drawerWidth = layout.achievementsDrawerWidth;
      const drawerX = -drawerWidth + drawerWidth * progress;
      const canvasHeight = this.game.getCanvasHeight();

      ctx.save();

      const bgGradient = ctx.createLinearGradient(
        drawerX,
        0,
        drawerX + drawerWidth,
        0
      );
      bgGradient.addColorStop(0, "rgba(20, 20, 40, 0.98)");
      bgGradient.addColorStop(1, "rgba(30, 30, 50, 0.98)");
      ctx.fillStyle = bgGradient;
      ctx.fillRect(drawerX, 0, drawerWidth, canvasHeight);

      ctx.shadowColor = "rgba(255, 215, 0, 0.4)";
      ctx.shadowBlur = this.game.getScaledValue(15);
      ctx.strokeStyle = "rgba(255, 215, 0, 0.6)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(drawerX + drawerWidth, 0);
      ctx.lineTo(drawerX + drawerWidth, canvasHeight);
      ctx.stroke();

      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;

      ctx.save();
      ctx.shadowColor = "rgba(255, 215, 0, 0.8)";
      ctx.shadowBlur = this.game.getScaledValue(20);
      this.renderText(
        ctx,
        "🏆 Achievements",
        drawerX + drawerWidth / 2,
        this.game.getScaledValue(35),
        {
          fontSize: layout.headerFontSize,
          align: "center",
          color: "#FFD700",
          weight: "bold",
        }
      );
      ctx.restore();

      ctx.strokeStyle = "rgba(255, 215, 0, 0.3)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(
        drawerX + this.game.getScaledValue(20),
        this.game.getScaledValue(60)
      );
      ctx.lineTo(
        drawerX + drawerWidth - this.game.getScaledValue(20),
        this.game.getScaledValue(60)
      );
      ctx.stroke();

      // Render close button
      const closeButtonSize = this.game.getScaledValue(30);
      const closeButtonX = drawerX + drawerWidth - this.game.getScaledValue(20);
      const closeButtonY = this.game.getScaledValue(20);

      ctx.save();

      // Close button background
      const closeGradient = ctx.createRadialGradient(
        closeButtonX,
        closeButtonY,
        0,
        closeButtonX,
        closeButtonY,
        closeButtonSize / 2
      );
      if (this.achievementsDrawer.closeButton.hovered) {
        closeGradient.addColorStop(0, "rgba(255, 100, 100, 0.8)");
        closeGradient.addColorStop(1, "rgba(200, 50, 50, 0.8)");
        ctx.shadowColor = "rgba(255, 100, 100, 0.6)";
        ctx.shadowBlur = this.game.getScaledValue(10);
      } else {
        closeGradient.addColorStop(0, "rgba(180, 180, 180, 0.6)");
        closeGradient.addColorStop(1, "rgba(120, 120, 120, 0.6)");
      }
      ctx.fillStyle = closeGradient;

      ctx.beginPath();
      ctx.arc(closeButtonX, closeButtonY, closeButtonSize / 2, 0, Math.PI * 2);
      ctx.fill();

      // Close button border
      ctx.strokeStyle = this.achievementsDrawer.closeButton.hovered
        ? "rgba(255, 150, 150, 0.9)"
        : "rgba(200, 200, 200, 0.5)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(closeButtonX, closeButtonY, closeButtonSize / 2, 0, Math.PI * 2);
      ctx.stroke();

      // X symbol
      ctx.strokeStyle = this.achievementsDrawer.closeButton.hovered
        ? "#FFFFFF"
        : "rgba(255, 255, 255, 0.8)";
      ctx.lineWidth = this.game.getScaledValue(3);
      ctx.lineCap = "round";

      const xSize = closeButtonSize * 0.35;
      ctx.beginPath();
      ctx.moveTo(closeButtonX - xSize, closeButtonY - xSize);
      ctx.lineTo(closeButtonX + xSize, closeButtonY + xSize);
      ctx.moveTo(closeButtonX + xSize, closeButtonY - xSize);
      ctx.lineTo(closeButtonX - xSize, closeButtonY + xSize);
      ctx.stroke();

      ctx.restore();

      const contentStartY = this.game.getScaledValue(80);
      const contentEndY = canvasHeight - this.game.getScaledValue(20);
      const contentHeight = contentEndY - contentStartY;

      ctx.save();
      ctx.beginPath();
      ctx.rect(drawerX, contentStartY, drawerWidth, contentHeight);
      ctx.clip();

      const achievements = Object.values(GameConfig.ACHIEVEMENTS);
      const startY = this.game.getScaledValue(115);
      const spacing = this.game.getScaledValue(75);
      const cardMargin = this.game.getScaledValue(15);

      const totalContentHeight = achievements.length * spacing;
      this.achievementsDrawer.maxScroll = Math.max(
        0,
        totalContentHeight - contentHeight + this.game.getScaledValue(40)
      );

      achievements.forEach((achievement, index) => {
        const achY =
          startY + index * spacing - this.achievementsDrawer.scrollOffset;
        const unlocked =
          this.game.achievements &&
          this.game.achievements[achievement.id]?.unlocked;
        const isHovered =
          this.achievementsDrawer.hoveredAchievement === achievement.id;

        if (achY < contentStartY - spacing || achY > contentEndY + spacing) {
          return;
        }

        ctx.save();

        const cardX = drawerX + cardMargin;
        const cardY = achY;
        const cardWidth =
          drawerWidth - cardMargin * 2 - this.game.getScaledValue(25);
        const cardHeight = this.game.getScaledValue(65);
        const cardRadius = this.game.getScaledValue(8);

        const cardGradient = ctx.createLinearGradient(
          cardX,
          cardY,
          cardX,
          cardY + cardHeight
        );
        if (unlocked) {
          if (isHovered) {
            cardGradient.addColorStop(0, "rgba(255, 215, 0, 0.35)");
            cardGradient.addColorStop(1, "rgba(255, 165, 0, 0.25)");
          } else {
            cardGradient.addColorStop(0, "rgba(255, 215, 0, 0.25)");
            cardGradient.addColorStop(1, "rgba(255, 165, 0, 0.15)");
          }
        } else {
          if (isHovered) {
            cardGradient.addColorStop(0, "rgba(60, 60, 80, 0.25)");
            cardGradient.addColorStop(1, "rgba(40, 40, 60, 0.15)");
          } else {
            cardGradient.addColorStop(0, "rgba(60, 60, 80, 0.15)");
            cardGradient.addColorStop(1, "rgba(40, 40, 60, 0.1)");
          }
        }
        ctx.fillStyle = cardGradient;

        ctx.beginPath();
        ctx.moveTo(cardX + cardRadius, cardY);
        ctx.lineTo(cardX + cardWidth - cardRadius, cardY);
        ctx.quadraticCurveTo(
          cardX + cardWidth,
          cardY,
          cardX + cardWidth,
          cardY + cardRadius
        );
        ctx.lineTo(cardX + cardWidth, cardY + cardHeight - cardRadius);
        ctx.quadraticCurveTo(
          cardX + cardWidth,
          cardY + cardHeight,
          cardX + cardWidth - cardRadius,
          cardY + cardHeight
        );
        ctx.lineTo(cardX + cardRadius, cardY + cardHeight);
        ctx.quadraticCurveTo(
          cardX,
          cardY + cardHeight,
          cardX,
          cardY + cardHeight - cardRadius
        );
        ctx.lineTo(cardX, cardY + cardRadius);
        ctx.quadraticCurveTo(cardX, cardY, cardX + cardRadius, cardY);
        ctx.closePath();
        ctx.fill();

        if (unlocked) {
          ctx.strokeStyle = isHovered
            ? "rgba(255, 215, 0, 0.7)"
            : "rgba(255, 215, 0, 0.5)";
          ctx.lineWidth = 2;
          ctx.stroke();
        } else {
          ctx.strokeStyle = isHovered
            ? "rgba(100, 100, 120, 0.5)"
            : "rgba(100, 100, 120, 0.3)";
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        const iconX = cardX + this.game.getScaledValue(30);
        const iconY = cardY + cardHeight / 2;

        ctx.globalAlpha = unlocked ? 1 : 0.4;
        this.renderText(ctx, achievement.icon, iconX, iconY, {
          fontSize: this.game.getScaledValue(32),
          align: "center",
          baseline: "middle",
        });
        ctx.globalAlpha = 1;

        const textX = cardX + this.game.getScaledValue(60);
        const nameY = cardY + this.game.getScaledValue(20);

        ctx.font = `bold ${layout.smallFontSize}px "Courier New", monospace`;
        ctx.fillStyle = unlocked ? "#FFD700" : "rgba(255, 255, 255, 0.5)";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";

        let displayName = achievement.name;
        const maxTextWidth = cardWidth - this.game.getScaledValue(80);
        let textWidth = ctx.measureText(displayName).width;

        if (textWidth > maxTextWidth) {
          while (textWidth > maxTextWidth && displayName.length > 0) {
            displayName = displayName.slice(0, -1);
            textWidth = ctx.measureText(displayName + "...").width;
          }
          displayName += "...";
        }

        ctx.fillText(displayName, textX, nameY);

        const descY = cardY + this.game.getScaledValue(40);

        ctx.font = `${layout.smallFontSize - 2}px "Courier New", monospace`;
        ctx.fillStyle = unlocked
          ? "rgba(255, 255, 255, 0.8)"
          : "rgba(255, 255, 255, 0.4)";

        let displayDesc = achievement.description;
        textWidth = ctx.measureText(displayDesc).width;

        if (textWidth > maxTextWidth) {
          while (textWidth > maxTextWidth && displayDesc.length > 0) {
            displayDesc = displayDesc.slice(0, -1);
            textWidth = ctx.measureText(displayDesc + "...").width;
          }
          displayDesc += "...";
        }

        ctx.fillText(displayDesc, textX, descY);

        const statusX = cardX + cardWidth - this.game.getScaledValue(15);
        const statusY = cardY + cardHeight - this.game.getScaledValue(15);

        this.renderText(ctx, unlocked ? "✓" : "🔒", statusX, statusY, {
          fontSize: this.game.getScaledValue(16),
          align: "right",
          baseline: "bottom",
          color: unlocked ? "#90EE90" : "#888888",
        });

        ctx.restore();
      });

      ctx.restore();

      if (this.achievementsDrawer.maxScroll > 0) {
        const scrollbarX = drawerX + drawerWidth - this.game.getScaledValue(20);
        const scrollbarY = contentStartY;
        const scrollbarWidth = this.game.getScaledValue(10);
        const scrollbarHeight = contentHeight;

        ctx.fillStyle = "rgba(100, 100, 100, 0.3)";
        ctx.fillRect(scrollbarX, scrollbarY, scrollbarWidth, scrollbarHeight);

        const thumbHeight = Math.max(
          this.game.getScaledValue(30),
          (contentHeight / totalContentHeight) * scrollbarHeight
        );
        const thumbY =
          scrollbarY +
          (this.achievementsDrawer.scrollOffset /
            this.achievementsDrawer.maxScroll) *
            (scrollbarHeight - thumbHeight);

        const scrollbarGradient = ctx.createLinearGradient(
          scrollbarX,
          thumbY,
          scrollbarX + scrollbarWidth,
          thumbY
        );
        if (
          this.achievementsDrawer.scrollbarHover ||
          this.achievementsDrawer.isDraggingScrollbar
        ) {
          scrollbarGradient.addColorStop(0, "rgba(255, 215, 0, 0.9)");
          scrollbarGradient.addColorStop(1, "rgba(255, 165, 0, 0.9)");
        } else {
          scrollbarGradient.addColorStop(0, "rgba(200, 200, 200, 0.7)");
          scrollbarGradient.addColorStop(1, "rgba(150, 150, 150, 0.7)");
        }
        ctx.fillStyle = scrollbarGradient;
        ctx.fillRect(scrollbarX, thumbY, scrollbarWidth, thumbHeight);
      }

      ctx.restore();
    }
  }

  renderEasterDropZones(ctx) {
    const layout = this.layoutCache;

    this.easterDropZones.forEach((zone) => {
      ctx.save();

      let glowIntensity = 0;
      let isHovered = this.dropZoneHover === zone.id;
      let isOccupied = zone.sock !== null;

      if (zone.glowEffect > 0) {
        glowIntensity = zone.glowEffect / this.DROP_ZONE_CONFIG.glowDuration;
      }

      if (isHovered) {
        glowIntensity = Math.max(glowIntensity, 0.8);
      }

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

      if (glowIntensity > 0) {
        ctx.shadowColor = shadowColor;
        ctx.shadowBlur = shadowBlur * (1 + glowIntensity);
      }

      ctx.fillStyle = backgroundColor;
      ctx.fillRect(
        zone.x - zone.width / 2,
        zone.y - zone.height / 2,
        zone.width,
        zone.height
      );

      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = this.game.getScaledValue(isHovered ? 3 : 2);
      ctx.strokeRect(
        zone.x - zone.width / 2,
        zone.y - zone.height / 2,
        zone.width,
        zone.height
      );

      ctx.setLineDash([]);

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
      layout.levelGridStartY - this.game.getScaledValue(120),
      {
        fontSize: layout.titleFontSize,
        weight: "bold",
      }
    );

    for (let i = 0; i < GameConfig.LEVELS.length; i++) {
      const col = i % this.levelConfig.columns;
      const row = Math.floor(i / this.levelConfig.columns);

      const x = layout.levelGridStartX + col * layout.levelHorizontalSpacing;
      const y = layout.levelGridStartY + row * layout.levelVerticalSpacing;

      this.renderLevelButton(ctx, i, x, y);
    }
  }

  renderLevelButton(ctx, levelIndex, x, y) {
    const layout = this.layoutCache;
    const buttonSize = layout.levelButtonSize;

    let sockImageIndex = levelIndex + 1;
    let colorFilter = null;

    if (levelIndex === 6) {
      sockImageIndex = 1;
      colorFilter = "hue-rotate(270deg) saturate(1.5)";
    } else if (levelIndex === 7) {
      sockImageIndex = 2;
      colorFilter = "hue-rotate(30deg) saturate(1.3)";
    } else if (levelIndex === 8) {
      sockImageIndex = 3;
      colorFilter = "hue-rotate(180deg) saturate(1.4)";
    }

    const sockImageName = `sock${sockImageIndex}.png`;
    const sockImage = this.game.images[sockImageName];

    const isUnlocked = this.game.unlockedLevels[levelIndex];
    const isCompleted = this.game.completedLevels[levelIndex];
    const isHovered = this.hoveredLevel === levelIndex;
    const isAffordable =
      this.game.playerPoints >= GameConfig.LEVEL_COSTS[levelIndex];

    const hoverProgress = this.levelHoverAnimations[levelIndex] || 0;
    const pulseTimer = this.levelPulseTimers[levelIndex] || 0;

    ctx.save();

    const baseScale = 1;
    const hoverScale = this.levelConfig.hoverScale;
    const currentScale =
      baseScale + (hoverScale - baseScale) * this.easeOutCubic(hoverProgress);

    ctx.translate(x, y);
    ctx.scale(currentScale, currentScale);
    ctx.translate(-x, -y);

    const halfSize = buttonSize / 2;

    ctx.save();
    const bgRadius = halfSize + this.game.getScaledValue(8);

    if (isUnlocked) {
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, bgRadius);
      if (isCompleted) {
        gradient.addColorStop(0, "rgba(255, 215, 0, 0.3)");
        gradient.addColorStop(1, "rgba(255, 215, 0, 0.05)");
      } else {
        const pulse = Math.sin(pulseTimer) * 0.1 + 0.2;
        gradient.addColorStop(0, `rgba(100, 150, 255, ${pulse})`);
        gradient.addColorStop(1, "rgba(100, 150, 255, 0.05)");
      }
      ctx.fillStyle = gradient;
    } else {
      ctx.fillStyle = isAffordable
        ? "rgba(100, 100, 100, 0.2)"
        : "rgba(50, 50, 50, 0.2)";
    }

    ctx.beginPath();
    ctx.arc(x, y, bgRadius, 0, Math.PI * 2);
    ctx.fill();

    if (isUnlocked) {
      ctx.strokeStyle = isCompleted
        ? "rgba(255, 215, 0, 0.6)"
        : "rgba(100, 150, 255, 0.6)";
      ctx.lineWidth = this.game.getScaledValue(3);

      if (hoverProgress > 0) {
        ctx.shadowColor = isCompleted ? "#FFD700" : "#6496FF";
        ctx.shadowBlur = this.game.getScaledValue(15) * hoverProgress;
      }

      ctx.beginPath();
      ctx.arc(x, y, bgRadius, 0, Math.PI * 2);
      ctx.stroke();
    } else if (isAffordable) {
      const affordablePulse = Math.sin(pulseTimer * 2) * 0.3 + 0.7;
      ctx.strokeStyle = `rgba(255, 215, 0, ${affordablePulse})`;
      ctx.lineWidth = this.game.getScaledValue(4);
      ctx.shadowColor = "#FFD700";
      ctx.shadowBlur = this.game.getScaledValue(20) * affordablePulse;
      ctx.beginPath();
      ctx.arc(x, y, bgRadius, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.strokeStyle = "rgba(100, 100, 100, 0.3)";
      ctx.lineWidth = this.game.getScaledValue(2);
      ctx.beginPath();
      ctx.arc(x, y, bgRadius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    if (isUnlocked) {
      ctx.save();

      ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
      ctx.shadowBlur = this.game.getScaledValue(8);
      ctx.shadowOffsetY = this.game.getScaledValue(3);

      if (isCompleted) {
        if (sockImage) {
          if (colorFilter) {
            ctx.filter = colorFilter;
          }

          ctx.drawImage(
            sockImage,
            x - halfSize,
            y - halfSize,
            buttonSize,
            buttonSize
          );
        }
      } else {
        const wiggle =
          Math.sin(
            this.animationFrame * this.levelConfig.wiggleSpeed + levelIndex
          ) * this.game.getScaledValue(this.levelConfig.wiggleAmount);
        const bounce =
          Math.abs(Math.sin(pulseTimer * 0.8)) * this.game.getScaledValue(3);

        if (sockImage) {
          if (colorFilter) {
            ctx.filter = colorFilter;
          }

          ctx.drawImage(
            sockImage,
            x - halfSize + wiggle,
            y - halfSize - bounce,
            buttonSize,
            buttonSize
          );
        }
      }
      ctx.restore();

      if (isCompleted && this.game.images["star.png"]) {
        ctx.save();
        ctx.shadowColor = "#FFD700";
        ctx.shadowBlur = this.game.getScaledValue(15);
        const starSize = this.game.getScaledValue(45);
        const starRotation = Math.sin(this.animationFrame * 0.002) * 0.1;

        ctx.translate(x, y - this.game.getScaledValue(55));
        ctx.rotate(starRotation);
        ctx.drawImage(
          this.game.images["star.png"],
          -starSize / 2,
          -starSize / 2,
          starSize,
          starSize
        );
        ctx.restore();
      }

      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = this.game.getScaledValue(4);
      this.renderText(
        ctx,
        `Level ${levelIndex + 1}`,
        x,
        y + this.game.getScaledValue(65),
        {
          fontSize: layout.bodyFontSize,
          weight: "bold",
          color: isCompleted ? "#FFD700" : "#FFFFFF",
        }
      );
      ctx.restore();
    } else {
      if (sockImage) {
        ctx.save();
        ctx.globalAlpha = isAffordable ? 0.5 : 0.25;

        if (colorFilter) {
          ctx.filter = isAffordable
            ? `${colorFilter} brightness(0.5) grayscale(0.3)`
            : `${colorFilter} brightness(0.3) grayscale(0.7)`;
        } else {
          ctx.filter = isAffordable
            ? "brightness(0.5) grayscale(0.3)"
            : "brightness(0.3) grayscale(0.7)";
        }

        ctx.drawImage(
          sockImage,
          x - halfSize,
          y - halfSize,
          buttonSize,
          buttonSize
        );
        ctx.restore();
      }

      ctx.save();
      ctx.fillStyle = isAffordable
        ? "rgba(144, 238, 144, 0.8)"
        : "rgba(255, 182, 193, 0.8)";
      ctx.font = `${this.game.getScaledValue(24)}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = this.game.getScaledValue(4);
      ctx.fillText("🔒", x, y);
      ctx.restore();

      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = this.game.getScaledValue(4);
      this.renderText(
        ctx,
        `💎 ${GameConfig.LEVEL_COSTS[levelIndex]}`,
        x,
        y - this.game.getScaledValue(55),
        {
          fontSize: layout.smallFontSize + 2,
          color: isAffordable ? "#90EE90" : "#FFB6C1",
          weight: "bold",
        }
      );
      ctx.restore();

      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = this.game.getScaledValue(4);
      this.renderText(
        ctx,
        `Level ${levelIndex + 1}`,
        x,
        y + this.game.getScaledValue(65),
        {
          fontSize: layout.bodyFontSize,
          color: "rgba(255, 255, 255, 0.6)",
        }
      );
      ctx.restore();

      if (isAffordable) {
        const pulse =
          Math.abs(Math.sin(this.animationFrame * 0.003)) * 0.3 + 0.7;
        ctx.save();
        ctx.globalAlpha = pulse;
        ctx.shadowColor = "#90EE90";
        ctx.shadowBlur = this.game.getScaledValue(8);
        this.renderText(
          ctx,
          "Click to unlock!",
          x,
          y + this.game.getScaledValue(85),
          {
            fontSize: layout.smallFontSize,
            color: "#90EE90",
            weight: "bold",
          }
        );
        ctx.restore();
      }
    }

    ctx.restore();
  }

  renderPlayerStats(ctx) {
    const layout = this.layoutCache;
    const panelX = layout.statsX - layout.statsPanelWidth / 2;
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
      layout.statsX,
      panelY + layout.statsPanelHeight / 2,
      {
        fontSize: layout.headerFontSize,
        color: "#FFD700",
        weight: "bold",
      }
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
