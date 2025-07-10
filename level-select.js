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

    // Martha display and animation
    this.marthaWiggleTimer = 0;
    this.marthaWiggling = false;
    this.marthaImageSize = { width: 0, height: 0 };

    // Easter egg drop zones
    this.easterDropZones = [];

    // Sock ball animations
    this.sockBallAnimations = [];

    // Physics for menu socks
    this.menuPhysics = {
      friction: 0.992,
      minVelocity: 0.05,
      bounceRestitution: 0.4,
      rotationFriction: 0.98,
      bounds: {
        left: this.game.getScaledValue(this.DRAG_BOUNDARIES.left),
        right:
          this.game.getCanvasWidth() -
          this.game.getScaledValue(this.DRAG_BOUNDARIES.right),
        top: this.game.getScaledValue(this.DRAG_BOUNDARIES.top),
        bottom:
          this.game.getCanvasHeight() -
          this.game.getScaledValue(this.DRAG_BOUNDARIES.bottom),
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
    };
  }

  onResize() {
    // No bounds needed - socks can go anywhere
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
  }

  setup() {
    super.setup();
    this.setupEasterDropZones();
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

    this.easterDropZones.forEach((zone) => {
      if (zone.glowEffect > 0) zone.glowEffect--;
    });

    this.sockBallAnimations = this.sockBallAnimations.filter((animation) => {
      animation.progress += deltaTime / 1000;
      return animation.progress < 1;
    });
  }

  updateMenuSocks(deltaTime) {
    const timeMultiplier = deltaTime / 16.67;

    this.menuSocks.forEach((sock, index) => {
      const age = Date.now() - sock.spawnTime;
      if (age > 20000) {
        this.menuSocks.splice(index, 1);
        if (sock === this.dragSock) {
          this.isDragging = false;
          this.dragSock = null;
        }
        return;
      }

      if (age > 17000) {
        const fadeProgress = (age - 17000) / 3000;
        sock.alpha = 1 - fadeProgress;
      }

      // Skip physics for dragged sock
      if (sock === this.dragSock) return;

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

      // No bounds checking - socks can go anywhere

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

  // checkSockBounds method removed - no bounds checking needed

  onMouseMove(x, y) {
    this.hoveredLevel = this.getLevelAtPosition(x, y);

    if (this.isDragging && this.dragSock) {
      // Direct position assignment - no bounds checking at all
      this.dragSock.x = x - this.dragOffset.x;
      this.dragSock.y = y - this.dragOffset.y;
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
      this.checkForEasterEggMatches();
    }
  }

  onClick(x, y) {
    if (this.isLogoClicked(x, y)) {
      this.activateEasterEgg();
      return true;
    }

    const levelIndex = this.getLevelAtPosition(x, y);
    if (levelIndex !== -1) {
      if (this.game.unlockedLevels[levelIndex]) {
        this.game.startLevel(levelIndex);
        return true;
      } else if (this.game.playerPoints >= GameConfig.LEVEL_COSTS[levelIndex]) {
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
    zone.glowEffect = this.DROP_ZONE_CONFIG.glowDuration;
  }

  checkForEasterEggMatches() {
    if (!this.easterDropZones || this.easterDropZones.length < 2) return;

    if (this.easterDropZones[0].sock && this.easterDropZones[1].sock) {
      const sock1 = this.easterDropZones[0].sock;
      const sock2 = this.easterDropZones[1].sock;

      if (sock1.type === sock2.type) {
        this.createSockBallAnimation(sock1, sock2);
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
    this.renderLogo(ctx);
    this.renderInstructions(ctx);
    this.renderMarthaImage(ctx);
    this.renderLevelButtons(ctx);
    this.renderPlayerStats(ctx);

    if (this.easterEggActive) {
      this.renderEasterDropZones(ctx);
    }

    this.renderSockBallAnimations(ctx);

    if (this.easterEggActive) {
      this.renderMenuSocks(ctx);
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

  renderEasterDropZones(ctx) {
    const layout = this.layoutCache;

    this.easterDropZones.forEach((zone, index) => {
      ctx.save();

      let glowIntensity = 0;
      if (zone.glowEffect > 0) {
        glowIntensity = zone.glowEffect / this.DROP_ZONE_CONFIG.glowDuration;
      }

      const outerBorderWidth = this.game.getScaledValue(
        this.DROP_ZONE_CONFIG.outerBorderWidth
      );

      ctx.strokeStyle = "rgba(0, 150, 255, 0.9)";
      ctx.lineWidth = this.game.getScaledValue(5);
      ctx.strokeRect(
        zone.x - zone.width / 2 - outerBorderWidth,
        zone.y - zone.height / 2 - outerBorderWidth,
        zone.width + outerBorderWidth * 2,
        zone.height + outerBorderWidth * 2
      );

      ctx.fillStyle = "rgba(0, 150, 255, 0.1)";
      ctx.fillRect(
        zone.x - zone.width / 2 - outerBorderWidth,
        zone.y - zone.height / 2 - outerBorderWidth,
        zone.width + outerBorderWidth * 2,
        zone.height + outerBorderWidth * 2
      );

      if (glowIntensity > 0) {
        ctx.shadowColor = "rgba(255, 255, 0, " + glowIntensity + ")";
        ctx.shadowBlur = this.game.getScaledValue(15);
      }

      ctx.strokeStyle = zone.sock
        ? "rgba(255, 255, 0, 1.0)"
        : "rgba(255, 255, 0, 0.8)";
      ctx.lineWidth = this.game.getScaledValue(4);
      ctx.strokeRect(
        zone.x - zone.width / 2,
        zone.y - zone.height / 2,
        zone.width,
        zone.height
      );

      ctx.fillStyle = zone.sock
        ? "rgba(255, 255, 0, 0.3)"
        : "rgba(255, 255, 0, 0.15)";
      ctx.fillRect(
        zone.x - zone.width / 2,
        zone.y - zone.height / 2,
        zone.width,
        zone.height
      );

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

      ctx.fillStyle = "rgba(255, 255, 255, 1.0)";
      ctx.strokeStyle = "rgba(0, 0, 0, 0.8)";
      ctx.lineWidth = this.game.getScaledValue(2);

      const labelText = index === 0 ? "Drop Zone 1" : "Drop Zone 2";
      const labelY = zone.y - zone.height / 2 - this.game.getScaledValue(25);

      ctx.strokeText(labelText, zone.x, labelY);
      ctx.fillText(labelText, zone.x, labelY);

      if (!zone.sock) {
        ctx.fillStyle = "rgba(255, 215, 0, 0.9)";
        ctx.strokeStyle = "rgba(0, 0, 0, 0.8)";
        ctx.lineWidth = this.game.getScaledValue(1);

        const instructionText = "Drop socks here!";
        const instructionY =
          zone.y + zone.height / 2 + this.game.getScaledValue(20);

        ctx.strokeText(instructionText, zone.x, instructionY);
        ctx.fillText(instructionText, zone.x, instructionY);
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

  renderMenuSocks(ctx) {
    this.menuSocks.forEach((sock) => {
      ctx.save();

      if (sock.alpha < 1) {
        ctx.globalAlpha = sock.alpha;
      }

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
}
