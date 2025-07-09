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

    // Physics for menu socks
    this.menuPhysics = {
      friction: 0.98,
      bounce: 0.7,
      gravity: 0.3,
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
  }

  onUpdate(deltaTime) {
    // Update easter egg socks if active
    if (this.easterEggActive) {
      this.updateMenuSocks(deltaTime);
    }
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

      // Apply physics with delta time
      sock.vy += this.menuPhysics.gravity * timeMultiplier;
      sock.vx *= Math.pow(this.menuPhysics.friction, timeMultiplier);
      sock.vy *= Math.pow(this.menuPhysics.friction, timeMultiplier);

      // Update position
      sock.x += sock.vx * timeMultiplier;
      sock.y += sock.vy * timeMultiplier;

      // Update rotation
      sock.rotation += sock.rotationSpeed * timeMultiplier;

      // Bounce off bounds
      if (sock.x - sock.size / 2 < this.menuPhysics.bounds.left) {
        sock.x = this.menuPhysics.bounds.left + sock.size / 2;
        sock.vx = -sock.vx * this.menuPhysics.bounce;
      }
      if (sock.x + sock.size / 2 > this.menuPhysics.bounds.right) {
        sock.x = this.menuPhysics.bounds.right - sock.size / 2;
        sock.vx = -sock.vx * this.menuPhysics.bounce;
      }
      if (sock.y - sock.size / 2 < this.menuPhysics.bounds.top) {
        sock.y = this.menuPhysics.bounds.top + sock.size / 2;
        sock.vy = -sock.vy * this.menuPhysics.bounce;
      }
      if (sock.y + sock.size / 2 > this.menuPhysics.bounds.bottom) {
        sock.y = this.menuPhysics.bounds.bottom - sock.size / 2;
        sock.vy = -sock.vy * this.menuPhysics.bounce;

        // Add some randomness to prevent socks from getting stuck
        sock.vx += (Math.random() - 0.5) * 2;
      }

      // Gradually slow down rotation
      sock.rotationSpeed *= Math.pow(0.99, timeMultiplier);
    });

    // Clean up array if we removed items
    this.menuSocks = this.menuSocks.filter((sock) => sock !== undefined);
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
      // Give the sock some velocity based on mouse movement
      this.dragSock.vx = (Math.random() - 0.5) * 10;
      this.dragSock.vy = (Math.random() - 0.5) * 10;
      this.dragSock.rotationSpeed = (Math.random() - 0.5) * 0.3;

      this.isDragging = false;
      this.dragSock = null;
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
        this.game.playerPoints -= GameConfig.LEVEL_COSTS[levelIndex];
        this.game.unlockedLevels[levelIndex] = true;
        this.game.saveGameData();
        this.game.startLevel(levelIndex);
        return true;
      }
    }

    return false;
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
      y: -canvasHeight + (Math.random() - 0.5) * this.game.getScaledValue(100),
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
    this.renderLevelButtons(ctx);
    this.renderPlayerStats(ctx);

    // Render easter egg socks
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
      "Match pairs to create sock balls, then throw them at Martha!",
      layout.centerX,
      layout.instructionsY + layout.mediumSpacing,
      { fontSize: layout.bodyFontSize, color: "rgba(255, 255, 255, 0.9)" }
    );

    // Easter egg hint
    if (this.easterEggActive && this.menuSocks.length > 0) {
      this.renderText(
        ctx,
        "Drag the sock around! Click logo for next type!",
        layout.centerX,
        layout.instructionsY + layout.mediumSpacing * 2,
        { fontSize: layout.smallFontSize, color: "rgba(255, 215, 0, 0.8)" }
      );
    }
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
