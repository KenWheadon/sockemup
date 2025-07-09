class LevelSelect extends Screen {
  constructor(game) {
    super(game);

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
    this.currentSockType = 1; // Cycles through sock types

    // Martha display and animation - removed marthaImage property
    this.marthaWiggleTimer = 0;
    this.marthaWiggling = false;

    // Easter egg drop zones - initialize as empty array
    this.easterDropZones = [];

    // Sock ball animations
    this.sockBallAnimations = [];

    // Physics for menu socks - using match screen physics instead of gravity
    this.menuPhysics = {
      friction: 0.992,
      minVelocity: 0.05,
      bounceRestitution: 0.4,
      rotationFriction: 0.98,
      bounds: {
        left: this.game.getScaledValue(50),
        right: this.game.getCanvasWidth() - this.game.getScaledValue(50),
        top: this.game.getScaledValue(50),
        bottom: this.game.getCanvasHeight() - this.game.getScaledValue(50),
      },
    };

    // Level button configuration - use base values, scaling applied by game
    this.levelConfig = {
      baseSpacing: 150,
      baseButtonSize: 80,
      wiggleSpeed: 0.01,
      wiggleAmount: 3,
      hoverScale: 1.1,
      clickScale: 0.95,
    };
  }

  createLayoutCache() {
    const baseLayout = super.createLayoutCache();
    const canvasWidth = this.game.getCanvasWidth();
    const canvasHeight = this.game.getCanvasHeight();

    return {
      ...baseLayout,

      // Logo positioning
      logoX: canvasWidth / 2,
      logoY: this.game.getScaledValue(150),
      logoWidth: this.game.getScaledValue(200),
      logoHeight: this.game.getScaledValue(100),

      // Instructions positioning
      instructionsY: this.game.getScaledValue(220),

      // Level button layout
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

      // Martha positioning - move to left side to be more visible
      marthaX: this.game.getScaledValue(150),
      marthaY: this.game.getScaledValue(350),
      marthaSize: this.game.getScaledValue(120),

      // Easter egg drop zones - position near Martha
      dropZoneSize: this.game.getScaledValue(60),
      dropZone1X: this.game.getScaledValue(250),
      dropZone1Y: this.game.getScaledValue(300),
      dropZone2X: this.game.getScaledValue(250),
      dropZone2Y: this.game.getScaledValue(400),

      // Player stats positioning
      statsY: canvasHeight - this.game.getScaledValue(80),
      statsPanelWidth: this.game.getScaledValue(200),
      statsPanelHeight: this.game.getScaledValue(40),
    };
  }

  onResize() {
    // Update physics bounds based on new canvas size
    this.menuPhysics.bounds = {
      left: this.game.getScaledValue(50),
      right: this.game.getCanvasWidth() - this.game.getScaledValue(50),
      top: this.game.getScaledValue(50),
      bottom: this.game.getCanvasHeight() - this.game.getScaledValue(50),
    };

    // Update any existing menu socks to stay within bounds
    this.menuSocks.forEach((sock) => {
      if (sock.x < this.menuPhysics.bounds.left) {
        sock.x = this.menuPhysics.bounds.left;
      }
      if (sock.x > this.menuPhysics.bounds.right) {
        sock.x = this.menuPhysics.bounds.right;
      }
      if (sock.y < this.menuPhysics.bounds.top) {
        sock.y = this.menuPhysics.bounds.top;
      }
      if (sock.y > this.menuPhysics.bounds.bottom) {
        sock.y = this.menuPhysics.bounds.bottom;
      }
    });

    // Setup easter egg drop zones
    this.setupEasterDropZones();
  }

  setupEasterDropZones() {
    // Ensure layoutCache is calculated
    this.clearLayoutCache(); // <- This forces recalculation
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
        id: 0,
      },
      {
        x: layout.dropZone2X,
        y: layout.dropZone2Y,
        width: layout.dropZoneSize,
        height: layout.dropZoneSize,
        sock: null,
        glowEffect: 0,
        id: 1,
      },
    ];

    console.log("Drop zones initialized:", this.easterDropZones);
  }

  setup() {
    super.setup();
    this.setupEasterDropZones();
  }

  onUpdate(deltaTime) {
    // Update easter egg socks if active
    if (this.easterEggActive) {
      this.updateMenuSocks(deltaTime);
    }

    // Update Martha wiggle animation
    if (this.marthaWiggling) {
      this.marthaWiggleTimer += deltaTime;
      if (this.marthaWiggleTimer >= 1000) {
        // 1 second
        this.marthaWiggling = false;
        this.marthaWiggleTimer = 0;
      }
    }

    // Update drop zone effects
    this.easterDropZones.forEach((zone) => {
      if (zone.glowEffect > 0) zone.glowEffect--;
    });

    // Update sock ball animations
    this.sockBallAnimations = this.sockBallAnimations.filter((animation) => {
      animation.progress += deltaTime / 1000; // 1 second animation
      return animation.progress < 1;
    });
  }

  updateMenuSocks(deltaTime) {
    const timeMultiplier = deltaTime / 16.67; // Normalize to 60fps

    this.menuSocks.forEach((sock, index) => {
      if (sock === this.dragSock) return; // Skip dragged sock

      // Check if sock should despawn (20 seconds = 20000ms)
      const age = Date.now() - sock.spawnTime;
      if (age > 20000) {
        // Remove expired sock
        this.menuSocks.splice(index, 1);

        // If this was the dragged sock, clear drag state
        if (sock === this.dragSock) {
          this.isDragging = false;
          this.dragSock = null;
        }

        return;
      }

      // Add fade out effect in the last 3 seconds
      if (age > 17000) {
        const fadeProgress = (age - 17000) / 3000; // 0 to 1 over 3 seconds
        sock.alpha = 1 - fadeProgress;
      }

      // Apply match screen physics instead of gravity
      sock.vx *= Math.pow(this.menuPhysics.friction, timeMultiplier);
      sock.vy *= Math.pow(this.menuPhysics.friction, timeMultiplier);

      // Apply friction to rotation
      if (sock.rotationSpeed) {
        sock.rotationSpeed *= Math.pow(
          this.menuPhysics.rotationFriction,
          timeMultiplier
        );
      }

      // Update position
      sock.x += sock.vx * timeMultiplier;
      sock.y += sock.vy * timeMultiplier;

      // Update rotation
      sock.rotation += sock.rotationSpeed * timeMultiplier;

      // Check bounds and bounce
      this.checkSockBounds(sock);

      // Stop if velocity is too low
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

    // Clean up array if we removed items
    this.menuSocks = this.menuSocks.filter((sock) => sock !== undefined);
  }

  checkSockBounds(sock) {
    const halfWidth = sock.size / 2;
    const halfHeight = sock.size / 2;

    // Left and right bounds
    if (sock.x - halfWidth <= this.menuPhysics.bounds.left) {
      sock.x = this.menuPhysics.bounds.left + halfWidth;
      sock.vx = Math.abs(sock.vx) * this.menuPhysics.bounceRestitution;
    } else if (sock.x + halfWidth >= this.menuPhysics.bounds.right) {
      sock.x = this.menuPhysics.bounds.right - halfWidth;
      sock.vx = -Math.abs(sock.vx) * this.menuPhysics.bounceRestitution;
    }

    // Top and bottom bounds
    if (sock.y - halfHeight <= this.menuPhysics.bounds.top) {
      sock.y = this.menuPhysics.bounds.top + halfHeight;
      sock.vy = Math.abs(sock.vy) * this.menuPhysics.bounceRestitution;
    } else if (sock.y + halfHeight >= this.menuPhysics.bounds.bottom) {
      sock.y = this.menuPhysics.bounds.bottom - halfHeight;
      sock.vy = -Math.abs(sock.vy) * this.menuPhysics.bounceRestitution;
    }
  }

  onMouseMove(x, y) {
    // Check level hover
    this.hoveredLevel = this.getLevelAtPosition(x, y);

    // Handle sock dragging
    if (this.isDragging && this.dragSock) {
      this.dragSock.x = x - this.dragOffset.x;
      this.dragSock.y = y - this.dragOffset.y;
    }
  }

  onMouseDown(x, y) {
    // Check if clicking on easter egg sock
    if (this.easterEggActive) {
      const sock = this.getSockAtPosition(x, y);
      if (sock) {
        this.isDragging = true;
        this.dragSock = sock;
        this.dragOffset.x = x - sock.x;
        this.dragOffset.y = y - sock.y;
        sock.vx = 0;
        sock.vy = 0;
        return true; // Handled
      }
    }

    return false; // Not handled
  }

  onMouseUp(x, y) {
    if (this.isDragging && this.dragSock) {
      const sock = this.dragSock;
      let snapped = false;

      // Check for drop zone snapping
      this.easterDropZones.forEach((zone) => {
        const distance = this.getDropZoneDistance(sock, zone);
        const snapDistance = this.game.getScaledValue(40);

        if (distance < snapDistance) {
          if (zone.sock === null) {
            zone.sock = sock;
            this.snapSockToDropZone(sock, zone);
            snapped = true;
            this.createSnapEffect(zone);
          }
        }
      });

      // If not snapped, apply throw physics
      if (!snapped) {
        sock.vx = (Math.random() - 0.5) * 8;
        sock.vy = (Math.random() - 0.5) * 8;
        sock.rotationSpeed = (Math.random() - 0.5) * 0.1;
      }

      this.isDragging = false;
      this.dragSock = null;

      // Check for matches
      this.checkForEasterEggMatches();
    }
  }

  onClick(x, y) {
    // Check logo click for easter egg
    if (this.isLogoClicked(x, y)) {
      this.activateEasterEgg();
      return true;
    }

    // Check level selection
    const levelIndex = this.getLevelAtPosition(x, y);
    if (levelIndex !== -1) {
      if (this.game.unlockedLevels[levelIndex]) {
        this.game.startLevel(levelIndex);
        return true;
      } else if (this.game.playerPoints >= GameConfig.LEVEL_COSTS[levelIndex]) {
        // Deduct points for unlocking
        this.game.playerPoints -= GameConfig.LEVEL_COSTS[levelIndex];
        this.game.unlockedLevels[levelIndex] = true;
        this.game.saveGameData();
        this.game.startLevel(levelIndex);
        return true;
      }
    }

    return false;
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
    zone.glowEffect = 20;
  }

  checkForEasterEggMatches() {
    // Add null checks to prevent errors
    if (!this.easterDropZones || this.easterDropZones.length < 2) {
      console.warn("Easter drop zones not properly initialized");
      return;
    }

    if (this.easterDropZones[0].sock && this.easterDropZones[1].sock) {
      const sock1 = this.easterDropZones[0].sock;
      const sock2 = this.easterDropZones[1].sock;

      if (sock1.type === sock2.type) {
        console.log("Easter egg match found!", sock1.type, sock2.type);
        // Create sock ball animation
        this.createSockBallAnimation(sock1, sock2);

        // Remove socks from zones and menu
        this.easterDropZones[0].sock = null;
        this.easterDropZones[1].sock = null;
        this.menuSocks = this.menuSocks.filter(
          (s) => s !== sock1 && s !== sock2
        );
      }
    }
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

    // Start Martha wiggle when animation completes
    setTimeout(() => {
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

    // Always spawn one sock, cycling through types
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
      alpha: 1,
    };

    this.menuSocks.push(sock);

    // Cycle to next sock type
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
    // Check in reverse order to get topmost sock
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
    this.renderLogo(ctx);
    this.renderInstructions(ctx);
    this.renderMarthaImage(ctx);
    this.renderLevelButtons(ctx);
    this.renderPlayerStats(ctx);

    // Always render drop zones if easter egg is active
    if (this.easterEggActive) {
      this.renderEasterDropZones(ctx);
    }

    this.renderSockBallAnimations(ctx);

    // Render easter egg socks last so they appear on top
    if (this.easterEggActive) {
      this.renderMenuSocks(ctx);
    }
  }

  renderLogo(ctx) {
    const layout = this.layoutCache;

    // Add glow effect if easter egg is active
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

    // Easter egg hint
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

    // Access Martha image directly from game.images like socks do
    if (this.game.images["martha-demand.png"]) {
      ctx.save();

      // Apply wiggle effect if wiggling
      if (this.marthaWiggling) {
        const wiggleAmount = Math.sin(this.marthaWiggleTimer * 0.02) * 5;
        ctx.translate(layout.marthaX + wiggleAmount, layout.marthaY);
      } else {
        ctx.translate(layout.marthaX, layout.marthaY);
      }

      ctx.drawImage(
        this.game.images["martha-demand.png"],
        -layout.marthaSize / 2,
        -layout.marthaSize / 2,
        layout.marthaSize,
        layout.marthaSize
      );

      ctx.restore();
    }
  }

  renderEasterDropZones(ctx) {
    const layout = this.layoutCache;

    console.log("Rendering easter drop zones, active:", this.easterEggActive);
    console.log("Drop zones array:", this.easterDropZones);

    this.easterDropZones.forEach((zone, index) => {
      ctx.save();

      // Calculate glow intensity
      let glowIntensity = 0;
      if (zone.glowEffect > 0) {
        glowIntensity = zone.glowEffect / 20;
      }

      // Draw bright blue border for the easter egg area (outer border)
      ctx.strokeStyle = "rgba(0, 150, 255, 0.9)"; // Bright blue
      ctx.lineWidth = this.game.getScaledValue(5);
      ctx.strokeRect(
        zone.x - zone.width / 2 - this.game.getScaledValue(10),
        zone.y - zone.height / 2 - this.game.getScaledValue(10),
        zone.width + this.game.getScaledValue(20),
        zone.height + this.game.getScaledValue(20)
      );

      // Add blue fill for the easter egg area
      ctx.fillStyle = "rgba(0, 150, 255, 0.1)";
      ctx.fillRect(
        zone.x - zone.width / 2 - this.game.getScaledValue(10),
        zone.y - zone.height / 2 - this.game.getScaledValue(10),
        zone.width + this.game.getScaledValue(20),
        zone.height + this.game.getScaledValue(20)
      );

      // Draw yellow border for the actual drop target (inner border)
      if (glowIntensity > 0) {
        ctx.shadowColor = "rgba(255, 255, 0, " + glowIntensity + ")";
        ctx.shadowBlur = this.game.getScaledValue(15);
      }

      ctx.strokeStyle = zone.sock
        ? "rgba(255, 255, 0, 1.0)" // Bright yellow when occupied
        : "rgba(255, 255, 0, 0.8)"; // Slightly transparent when empty
      ctx.lineWidth = this.game.getScaledValue(4);
      ctx.strokeRect(
        zone.x - zone.width / 2,
        zone.y - zone.height / 2,
        zone.width,
        zone.height
      );

      // Add yellow fill for the drop target
      ctx.fillStyle = zone.sock
        ? "rgba(255, 255, 0, 0.3)" // More visible when occupied
        : "rgba(255, 255, 0, 0.15)"; // Subtle when empty
      ctx.fillRect(
        zone.x - zone.width / 2,
        zone.y - zone.height / 2,
        zone.width,
        zone.height
      );

      // Add a pulsing effect for empty drop zones
      if (!zone.sock) {
        const pulseIntensity = Math.sin(Date.now() * 0.003) * 0.3 + 0.7;
        ctx.strokeStyle = `rgba(255, 255, 0, ${pulseIntensity})`;
        ctx.lineWidth = this.game.getScaledValue(2);
        ctx.strokeRect(
          zone.x - zone.width / 2,
          zone.y - zone.height / 2,
          zone.width,
          zone.height
        );
      }

      // Label with better visibility
      ctx.fillStyle = "rgba(255, 255, 255, 1.0)";
      ctx.strokeStyle = "rgba(0, 0, 0, 0.8)";
      ctx.lineWidth = this.game.getScaledValue(2);

      const labelText = index === 0 ? "Drop Zone 1" : "Drop Zone 2";
      const labelY = zone.y - zone.height / 2 - this.game.getScaledValue(25);

      // Draw text outline
      ctx.strokeText(labelText, zone.x, labelY);
      // Draw text fill
      ctx.fillText(labelText, zone.x, labelY);

      // Add instruction text
      if (!zone.sock) {
        ctx.fillStyle = "rgba(255, 215, 0, 0.9)";
        ctx.strokeStyle = "rgba(0, 0, 0, 0.8)";
        ctx.lineWidth = this.game.getScaledValue(1);

        const instructionText = "Drop socks here!";
        const instructionY =
          zone.y + zone.height / 2 + this.game.getScaledValue(20);

        // Draw instruction outline
        ctx.strokeText(instructionText, zone.x, instructionY);
        // Draw instruction fill
        ctx.fillText(instructionText, zone.x, instructionY);
      }

      ctx.restore();
    });
  }

  // Enhanced renderEasterDropZones method for level-select.js
  // Also add this method to render the overall easter egg area bounds

  renderEasterEggBounds(ctx) {
    if (
      !this.easterEggActive ||
      !this.easterDropZones ||
      this.easterDropZones.length < 2
    )
      return;

    const layout = this.layoutCache;

    // Draw a bright blue border around the entire easter egg area
    ctx.save();
    ctx.strokeStyle = "rgba(0, 150, 255, 0.6)";
    ctx.lineWidth = this.game.getScaledValue(3);
    ctx.setLineDash([
      this.game.getScaledValue(10),
      this.game.getScaledValue(5),
    ]);

    // Calculate bounds that encompass both drop zones and Martha
    const leftBound =
      Math.min(this.easterDropZones[0].x, this.easterDropZones[1].x) -
      this.game.getScaledValue(80);
    const rightBound =
      Math.max(this.easterDropZones[0].x, this.easterDropZones[1].x) +
      this.game.getScaledValue(80);
    const topBound =
      Math.min(this.easterDropZones[0].y, this.easterDropZones[1].y) -
      this.game.getScaledValue(80);
    const bottomBound =
      Math.max(this.easterDropZones[0].y, this.easterDropZones[1].y) +
      this.game.getScaledValue(80);

    ctx.strokeRect(
      leftBound,
      topBound,
      rightBound - leftBound,
      bottomBound - topBound
    );

    // Add title for easter egg area
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(0, 150, 255, 0.9)";
    ctx.strokeStyle = "rgba(0, 0, 0, 0.8)";
    ctx.lineWidth = this.game.getScaledValue(2);
    ctx.font = `${layout.bodyFontSize}px "Courier New", monospace`;
    ctx.textAlign = "center";

    const titleText = "Easter Egg Area";
    const titleY = topBound - this.game.getScaledValue(10);

    ctx.strokeText(titleText, (leftBound + rightBound) / 2, titleY);
    ctx.fillText(titleText, (leftBound + rightBound) / 2, titleY);

    ctx.restore();
  }

  renderEasterDropZones(ctx) {
    const layout = this.layoutCache;

    console.log("Rendering easter drop zones, active:", this.easterEggActive);
    console.log("Drop zones array:", this.easterDropZones);

    this.easterDropZones.forEach((zone, index) => {
      ctx.save();

      // Calculate glow intensity
      let glowIntensity = 0;
      if (zone.glowEffect > 0) {
        glowIntensity = zone.glowEffect / 20;
      }

      // Draw bright blue border for the easter egg area (outer border)
      ctx.strokeStyle = "rgba(0, 150, 255, 0.9)"; // Bright blue
      ctx.lineWidth = this.game.getScaledValue(5);
      ctx.strokeRect(
        zone.x - zone.width / 2 - this.game.getScaledValue(10),
        zone.y - zone.height / 2 - this.game.getScaledValue(10),
        zone.width + this.game.getScaledValue(20),
        zone.height + this.game.getScaledValue(20)
      );

      // Add blue fill for the easter egg area
      ctx.fillStyle = "rgba(0, 150, 255, 0.1)";
      ctx.fillRect(
        zone.x - zone.width / 2 - this.game.getScaledValue(10),
        zone.y - zone.height / 2 - this.game.getScaledValue(10),
        zone.width + this.game.getScaledValue(20),
        zone.height + this.game.getScaledValue(20)
      );

      // Draw yellow border for the actual drop target (inner border)
      if (glowIntensity > 0) {
        ctx.shadowColor = "rgba(255, 255, 0, " + glowIntensity + ")";
        ctx.shadowBlur = this.game.getScaledValue(15);
      }

      ctx.strokeStyle = zone.sock
        ? "rgba(255, 255, 0, 1.0)" // Bright yellow when occupied
        : "rgba(255, 255, 0, 0.8)"; // Slightly transparent when empty
      ctx.lineWidth = this.game.getScaledValue(4);
      ctx.strokeRect(
        zone.x - zone.width / 2,
        zone.y - zone.height / 2,
        zone.width,
        zone.height
      );

      // Add yellow fill for the drop target
      ctx.fillStyle = zone.sock
        ? "rgba(255, 255, 0, 0.3)" // More visible when occupied
        : "rgba(255, 255, 0, 0.15)"; // Subtle when empty
      ctx.fillRect(
        zone.x - zone.width / 2,
        zone.y - zone.height / 2,
        zone.width,
        zone.height
      );

      // Add a pulsing effect for empty drop zones
      if (!zone.sock) {
        const pulseIntensity = Math.sin(Date.now() * 0.003) * 0.3 + 0.7;
        ctx.strokeStyle = `rgba(255, 255, 0, ${pulseIntensity})`;
        ctx.lineWidth = this.game.getScaledValue(2);
        ctx.strokeRect(
          zone.x - zone.width / 2,
          zone.y - zone.height / 2,
          zone.width,
          zone.height
        );
      }

      // Label with better visibility
      ctx.fillStyle = "rgba(255, 255, 255, 1.0)";
      ctx.strokeStyle = "rgba(0, 0, 0, 0.8)";
      ctx.lineWidth = this.game.getScaledValue(2);

      const labelText = index === 0 ? "Drop Zone 1" : "Drop Zone 2";
      const labelY = zone.y - zone.height / 2 - this.game.getScaledValue(25);

      // Draw text outline
      ctx.strokeText(labelText, zone.x, labelY);
      // Draw text fill
      ctx.fillText(labelText, zone.x, labelY);

      // Add instruction text
      if (!zone.sock) {
        ctx.fillStyle = "rgba(255, 215, 0, 0.9)";
        ctx.strokeStyle = "rgba(0, 0, 0, 0.8)";
        ctx.lineWidth = this.game.getScaledValue(1);

        const instructionText = "Drop socks here!";
        const instructionY =
          zone.y + zone.height / 2 + this.game.getScaledValue(20);

        // Draw instruction outline
        ctx.strokeText(instructionText, zone.x, instructionY);
        // Draw instruction fill
        ctx.fillText(instructionText, zone.x, instructionY);
      }

      ctx.restore();
    });
  }

  // Enhanced renderMenuSocks method for better visibility
  renderMenuSocks(ctx) {
    this.menuSocks.forEach((sock) => {
      ctx.save();

      // Apply fade out effect
      if (sock.alpha < 1) {
        ctx.globalAlpha = sock.alpha;
      }

      // Enhanced glow effect for better visibility
      if (sock.glowEffect > 0) {
        ctx.shadowColor = "#FFD700";
        ctx.shadowBlur = sock.glowEffect;
        sock.glowEffect--;
      } else {
        // Add a subtle glow to all easter egg socks
        ctx.shadowColor = "rgba(255, 255, 255, 0.3)";
        ctx.shadowBlur = this.game.getScaledValue(5);
      }

      // Apply transformations
      ctx.translate(sock.x, sock.y);
      ctx.rotate(sock.rotation);

      // Draw sock with enhanced visibility
      const sockImageName = `sock${sock.type}.png`;
      if (this.game.images[sockImageName]) {
        ctx.drawImage(
          this.game.images[sockImageName],
          -sock.size / 2,
          -sock.size / 2,
          sock.size,
          sock.size
        );
      } else {
        // Fallback: draw a colored circle if sock image not found
        ctx.fillStyle = `hsl(${sock.type * 60}, 70%, 50%)`;
        ctx.strokeStyle = "white";
        ctx.lineWidth = this.game.getScaledValue(3);
        ctx.beginPath();
        ctx.arc(0, 0, sock.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Add type number
        ctx.fillStyle = "white";
        ctx.font = `${sock.size / 3}px "Courier New", monospace`;
        ctx.textAlign = "center";
        ctx.fillText(sock.type.toString(), 0, sock.size / 12);
      }

      ctx.restore();
    });
  }

  // Also update the main onRender method to include the easter egg bounds
  onRender(ctx) {
    this.renderLogo(ctx);
    this.renderInstructions(ctx);
    this.renderMarthaImage(ctx);
    this.renderLevelButtons(ctx);
    this.renderPlayerStats(ctx);

    // Render easter egg bounds first (behind everything else)
    this.renderEasterEggBounds(ctx);

    // Always render drop zones if easter egg is active
    if (this.easterEggActive) {
      this.renderEasterDropZones(ctx);
    }

    this.renderSockBallAnimations(ctx);

    // Render easter egg socks last so they appear on top
    if (this.easterEggActive) {
      this.renderMenuSocks(ctx);
    }
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
        ctx.rotate(animation.progress * Math.PI * 4); // Spin during animation
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

  renderLevelButtons(ctx) {
    const layout = this.layoutCache;

    // Title
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

    // Calculate button state
    const isUnlocked = this.game.unlockedLevels[levelIndex];
    const isCompleted = this.game.completedLevels[levelIndex];
    const isHovered = this.hoveredLevel === levelIndex;
    const isAffordable =
      this.game.playerPoints >= GameConfig.LEVEL_COSTS[levelIndex];

    ctx.save();

    // Apply hover effects
    if (isHovered && isUnlocked) {
      const scale = this.levelConfig.hoverScale;
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.translate(-x, -y);
    }

    const halfSize = buttonSize / 2;

    if (isUnlocked) {
      if (isCompleted) {
        // Completed level: show sock without animation and star above
        if (sockImage) {
          ctx.drawImage(
            sockImage,
            x - halfSize,
            y - halfSize,
            buttonSize,
            buttonSize
          );
        }

        // Draw star with glow effect
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
        // Unlocked but not completed: show wiggling sock
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

      // Level number
      this.renderText(
        ctx,
        `Level ${levelIndex + 1}`,
        x,
        y + this.game.getScaledValue(60),
        { fontSize: layout.bodyFontSize }
      );
    } else {
      // Locked level
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

      // Cost and level info
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
          {
            fontSize: layout.smallFontSize,
            color: "#90EE90",
          }
        );
      }
    }

    ctx.restore();
  }

  renderPlayerStats(ctx) {
    const layout = this.layoutCache;
    const panelX = layout.centerX - layout.statsPanelWidth / 2;
    const panelY = layout.statsY;

    // Points display with background panel
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
      {
        fontSize: layout.headerFontSize,
        color: "#FFD700",
        weight: "bold",
      }
    );
  }

  renderMenuSocks(ctx) {
    this.menuSocks.forEach((sock) => {
      ctx.save();

      // Apply fade out effect
      if (sock.alpha < 1) {
        ctx.globalAlpha = sock.alpha;
      }

      // Apply glow effect
      if (sock.glowEffect > 0) {
        ctx.shadowColor = "#FFD700";
        ctx.shadowBlur = sock.glowEffect;
        sock.glowEffect--;
      }

      // Apply transformations
      ctx.translate(sock.x, sock.y);
      ctx.rotate(sock.rotation);

      // Draw sock
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
}
