class LevelSelect {
  constructor(game) {
    this.game = game;
    this.canvas = game.canvas;
    this.ctx = game.ctx;

    // Level selection state
    this.hoveredLevel = -1;
    this.selectedLevel = -1;
    this.animationFrame = 0;

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
        left: 50,
        right: this.canvas.width - 50,
        top: 50,
        bottom: this.canvas.height - 50,
      },
    };

    // Level button configuration
    this.levelConfig = {
      spacing: 150,
      buttonSize: 80,
      wiggleSpeed: 0.01,
      wiggleAmount: 3,
      hoverScale: 1.1,
      clickScale: 0.95,
    };

    this.setupEventListeners();
  }

  setupEventListeners() {
    // We'll handle events through the main game loop
    // This is just for organization
  }

  update() {
    this.animationFrame++;

    // Update easter egg socks if active
    if (this.easterEggActive) {
      this.updateMenuSocks();
    }
  }

  updateMenuSocks() {
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

      // Apply physics
      sock.vy += this.menuPhysics.gravity;
      sock.vx *= this.menuPhysics.friction;
      sock.vy *= this.menuPhysics.friction;

      // Update position
      sock.x += sock.vx;
      sock.y += sock.vy;

      // Update rotation
      sock.rotation += sock.rotationSpeed;

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
      sock.rotationSpeed *= 0.99;
    });

    // Clean up array if we removed items
    this.menuSocks = this.menuSocks.filter((sock) => sock !== undefined);
  }

  handleMouseMove(x, y) {
    // Check level hover
    this.hoveredLevel = this.getLevelAtPosition(x, y);

    // Handle sock dragging
    if (this.isDragging && this.dragSock) {
      this.dragSock.x = x - this.dragOffset.x;
      this.dragSock.y = y - this.dragOffset.y;
    }
  }

  handleMouseDown(x, y) {
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

  handleMouseUp(x, y) {
    if (this.isDragging && this.dragSock) {
      // Give the sock some velocity based on mouse movement
      this.dragSock.vx = (Math.random() - 0.5) * 10;
      this.dragSock.vy = (Math.random() - 0.5) * 10;
      this.dragSock.rotationSpeed = (Math.random() - 0.5) * 0.3;

      this.isDragging = false;
      this.dragSock = null;
    }
  }

  handleClick(x, y) {
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
    const logoX = this.canvas.width / 2;
    const logoY = 150; // Logo center position
    const logoWidth = 200;
    const logoHeight = 100;

    return (
      x >= logoX - logoWidth / 2 &&
      x <= logoX + logoWidth / 2 &&
      y >= logoY - logoHeight / 2 &&
      y <= logoY + logoHeight / 2
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
    const sock = {
      type: this.currentSockType,
      x: this.canvas.width / 2 + (Math.random() - 0.5) * 100,
      y: -this.canvas.height + (Math.random() - 0.5) * 100,
      size: (Math.random() + 0.5) * 60,
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
    const startX = this.canvas.width / 3.5 - this.levelConfig.spacing;

    for (let i = 0; i < GameConfig.LEVELS.length; i++) {
      const levelX = startX + i * this.levelConfig.spacing;
      const levelY = this.canvas.height / 2 + 50;
      const halfSize = this.levelConfig.buttonSize / 2;

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

  render(ctx) {
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
    const logoX = this.canvas.width / 2;
    const logoY = 150;

    // Add glow effect if easter egg is active
    if (this.easterEggActive) {
      ctx.save();
      const glowIntensity = Math.sin(this.animationFrame * 0.1) * 10 + 15;
      ctx.shadowColor = "#FFD700";
      ctx.shadowBlur = glowIntensity;

      if (this.game.images["logo.png"]) {
        ctx.drawImage(
          this.game.images["logo.png"],
          logoX - 100,
          logoY - 50,
          200,
          100
        );
      }

      ctx.restore();
    } else {
      if (this.game.images["logo.png"]) {
        ctx.drawImage(
          this.game.images["logo.png"],
          logoX - 100,
          logoY - 50,
          200,
          100
        );
      }
    }
  }

  renderInstructions(ctx) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.font = "18px Courier New";
    ctx.textAlign = "center";
    ctx.fillText(
      "Click sock pile to shoot socks, drag socks to drop zones",
      this.canvas.width / 2,
      220
    );
    ctx.fillText(
      "Match pairs to create sock balls, then throw them at Martha!",
      this.canvas.width / 2,
      245
    );

    // Easter egg hint
    if (this.easterEggActive && this.menuSocks.length > 0) {
      ctx.fillStyle = "rgba(255, 215, 0, 0.8)";
      ctx.font = "14px Courier New";
      ctx.fillText(
        "Drag the sock around! Click logo for next type!",
        this.canvas.width / 2,
        270
      );
    }
  }

  renderLevelButtons(ctx) {
    ctx.fillStyle = "white";
    ctx.font = "24px Courier New";
    ctx.textAlign = "center";
    ctx.fillText(
      "Select Level",
      this.canvas.width / 2,
      this.canvas.height / 2 - 50
    );

    const startX = this.canvas.width / 3.5 - this.levelConfig.spacing;

    for (let i = 0; i < GameConfig.LEVELS.length; i++) {
      this.renderLevelButton(ctx, i, startX + i * this.levelConfig.spacing);
    }
  }

  renderLevelButton(ctx, levelIndex, x) {
    const y = this.canvas.height / 2 + 50;
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
      ctx.translate(x, y);
      ctx.scale(this.levelConfig.hoverScale, this.levelConfig.hoverScale);
      ctx.translate(-x, -y);
    }

    if (isUnlocked) {
      if (isCompleted) {
        // Completed level: show sock without animation and star above
        if (sockImage) {
          ctx.drawImage(sockImage, x - 40, y - 40, 80, 80);
        }

        // Draw star with glow effect
        if (this.game.images["star.png"]) {
          ctx.save();
          ctx.shadowColor = "#FFD700";
          ctx.shadowBlur = 10;
          ctx.drawImage(this.game.images["star.png"], x - 20, y - 80, 40, 40);
          ctx.restore();
        }
      } else {
        // Unlocked but not completed: show wiggling sock
        const wiggle =
          Math.sin(
            this.animationFrame * this.levelConfig.wiggleSpeed + levelIndex
          ) * this.levelConfig.wiggleAmount;
        if (sockImage) {
          ctx.drawImage(sockImage, x - 40 + wiggle, y - 40, 80, 80);
        }
      }

      // Level number
      ctx.fillStyle = "white";
      ctx.font = "16px Courier New";
      ctx.textAlign = "center";
      ctx.fillText(`Level ${levelIndex + 1}`, x, y + 60);
    } else {
      // Locked level
      if (sockImage) {
        ctx.save();
        ctx.globalAlpha = isAffordable ? 0.7 : 0.3;
        ctx.filter = isAffordable ? "brightness(0.6)" : "brightness(0.3)";
        ctx.drawImage(sockImage, x - 40, y - 40, 80, 80);
        ctx.restore();
      }

      // Cost and level info
      ctx.fillStyle = isAffordable ? "#90EE90" : "#FFB6C1";
      ctx.font = "14px Courier New";
      ctx.textAlign = "center";
      ctx.fillText(`Cost: ${GameConfig.LEVEL_COSTS[levelIndex]}`, x, y - 50);

      ctx.fillStyle = "white";
      ctx.font = "16px Courier New";
      ctx.fillText(`Level ${levelIndex + 1}`, x, y + 60);

      if (isAffordable) {
        ctx.fillStyle = "#90EE90";
        ctx.font = "12px Courier New";
        ctx.fillText("Click to unlock!", x, y + 80);
      }
    }

    ctx.restore();
  }

  renderPlayerStats(ctx) {
    // Points display with background
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(this.canvas.width / 2 - 100, this.canvas.height - 70, 200, 40);

    ctx.fillStyle = "#FFD700";
    ctx.font = "20px Courier New";
    ctx.textAlign = "center";
    ctx.fillText(
      `Points: ${this.game.playerPoints}`,
      this.canvas.width / 2,
      this.canvas.height - 45
    );
    ctx.restore();
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
