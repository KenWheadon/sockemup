class MarthaManager {
  constructor(game) {
    this.game = game;
    this.martha = null;
    this.consumedSocks = 0;
    this.targetSocks = 0;
    this.isAway = false;
    this.awayTimer = 0;
    this.awayDuration = 90; // Reduced from 120 to 90 frames (1.5 seconds)
    this.movementPattern = 0;
    this.patternTimer = 0;
    this.movementPatterns = [
      "horizontal",
      "vertical",
      "circular",
      "figure8",
      "diagonal",
    ];

    // Animation properties - using array indices instead of filenames
    this.animationFrames = [0, 1, 0, 2]; // martha.png, martha2.png, martha.png, martha3.png
    this.currentFrameIndex = 0;
    this.animationTimer = 0;
    this.animationSpeed = 15; // Change frame every 15 game ticks for smoother animation
  }

  // Get responsive canvas dimensions
  getCanvasWidth() {
    return this.game.canvas.width;
  }

  getCanvasHeight() {
    return this.game.canvas.height;
  }

  // Initialize Martha for the current level
  setup(level) {
    this.targetSocks = GameConfig.LEVELS[level].sockTarget;
    this.consumedSocks = 0;
    this.isAway = false;
    this.awayTimer = 0;
    this.patternTimer = 0;

    // Reset animation
    this.currentFrameIndex = 0;
    this.animationTimer = 0;

    // Select random movement pattern
    this.movementPattern = Math.floor(
      Math.random() * this.movementPatterns.length
    );

    // Random spawn height within safe bounds - responsive to screen size
    const minY = this.getCanvasHeight() * 0.125; // 12.5% from top
    const maxY = this.getCanvasHeight() * 0.75; // 75% from top
    const randomY = minY + Math.random() * (maxY - minY);

    this.martha = {
      x: this.getCanvasWidth() / 2, // Start Martha in the middle for visibility
      y: randomY,
      width: GameConfig.MARTHA_SIZE.width,
      height: GameConfig.MARTHA_SIZE.height,
      vx: -GameConfig.LEVELS[level].marthaSpeed,
      vy: 0,
      direction: -1,
      hitEffect: 0,
      centerX: this.getCanvasWidth() / 2, // For circular patterns
      centerY: randomY, // For circular patterns
      radius: Math.min(this.getCanvasWidth(), this.getCanvasHeight()) * 0.125, // 12.5% of smaller dimension
      angle: 0, // For circular patterns
      originalSpeed: GameConfig.LEVELS[level].marthaSpeed,
    };

    console.log("Martha setup complete:", {
      position: { x: this.martha.x, y: this.martha.y },
      targetSocks: this.targetSocks,
      movementPattern: this.movementPatterns[this.movementPattern],
      canvasSize: {
        width: this.getCanvasWidth(),
        height: this.getCanvasHeight(),
      },
    });
  }

  // Update Martha's position and behavior
  update() {
    if (!this.martha) return;

    // Handle away state with improved logging
    if (this.isAway) {
      console.log(`Martha is away, timer: ${this.awayTimer}`);
      this.awayTimer--;
      if (this.awayTimer <= 0) {
        console.log("Martha away timer expired, respawning...");
        this.respawnMartha();
      }
      return;
    }

    // Update pattern timer
    this.patternTimer++;

    // Update Martha's position based on movement pattern
    this.updateMovementPattern();

    // Update animation frame
    this.updateAnimation();

    // Update hit effect
    if (this.martha.hitEffect > 0) {
      this.martha.hitEffect--;
    }
  }

  // Update animation frame cycling
  updateAnimation() {
    this.animationTimer++;

    if (this.animationTimer >= this.animationSpeed) {
      this.animationTimer = 0;
      this.currentFrameIndex =
        (this.currentFrameIndex + 1) % this.animationFrames.length;

      const currentImageIndex = this.animationFrames[this.currentFrameIndex];
      const imageName = GameConfig.IMAGES.CHARACTERS[currentImageIndex];
      console.log(
        `Martha animation frame changed to index ${currentImageIndex} (${imageName})`
      );
    }
  }

  updateMovementPattern() {
    const pattern = this.movementPatterns[this.movementPattern];

    switch (pattern) {
      case "horizontal":
        this.updateHorizontalMovement();
        break;
      case "vertical":
        this.updateVerticalMovement();
        break;
      case "circular":
        this.updateCircularMovement();
        break;
      case "figure8":
        this.updateFigure8Movement();
        break;
      case "diagonal":
        this.updateDiagonalMovement();
        break;
    }
  }

  updateHorizontalMovement() {
    this.martha.x += this.martha.vx;

    const leftBound = this.getCanvasWidth() * 0.05; // 5% from left
    const rightBound = this.getCanvasWidth() * 0.95; // 95% from left

    if (this.martha.x <= leftBound) {
      this.martha.vx = this.martha.originalSpeed;
      this.martha.direction = 1;
    } else if (this.martha.x >= rightBound) {
      this.martha.vx = -this.martha.originalSpeed;
      this.martha.direction = -1;
    }
  }

  updateVerticalMovement() {
    this.martha.y += this.martha.vy;

    if (this.martha.vy === 0) {
      this.martha.vy = this.martha.originalSpeed;
    }

    const topBound = this.getCanvasHeight() * 0.125; // 12.5% from top
    const bottomBound = this.getCanvasHeight() * 0.75; // 75% from top

    if (this.martha.y <= topBound) {
      this.martha.vy = this.martha.originalSpeed;
    } else if (this.martha.y >= bottomBound) {
      this.martha.vy = -this.martha.originalSpeed;
    }
  }

  updateCircularMovement() {
    this.martha.angle += this.martha.originalSpeed * 0.02;
    this.martha.x =
      this.martha.centerX + Math.cos(this.martha.angle) * this.martha.radius;
    this.martha.y =
      this.martha.centerY +
      Math.sin(this.martha.angle) * this.martha.radius * 0.5;

    // Keep within responsive bounds
    const leftBound = this.getCanvasWidth() * 0.05;
    const rightBound = this.getCanvasWidth() * 0.95;
    const topBound = this.getCanvasHeight() * 0.125;
    const bottomBound = this.getCanvasHeight() * 0.75;

    if (this.martha.x < leftBound) this.martha.x = leftBound;
    if (this.martha.x > rightBound) this.martha.x = rightBound;
    if (this.martha.y < topBound) this.martha.y = topBound;
    if (this.martha.y > bottomBound) this.martha.y = bottomBound;
  }

  updateFigure8Movement() {
    this.martha.angle += this.martha.originalSpeed * 0.015;
    this.martha.x =
      this.martha.centerX + Math.cos(this.martha.angle) * this.martha.radius;
    this.martha.y =
      this.martha.centerY +
      Math.sin(this.martha.angle * 2) * this.martha.radius * 0.3;

    // Keep within responsive bounds
    const leftBound = this.getCanvasWidth() * 0.05;
    const rightBound = this.getCanvasWidth() * 0.95;
    const topBound = this.getCanvasHeight() * 0.125;
    const bottomBound = this.getCanvasHeight() * 0.75;

    if (this.martha.x < leftBound) this.martha.x = leftBound;
    if (this.martha.x > rightBound) this.martha.x = rightBound;
    if (this.martha.y < topBound) this.martha.y = topBound;
    if (this.martha.y > bottomBound) this.martha.y = bottomBound;
  }

  updateDiagonalMovement() {
    this.martha.x += this.martha.vx;
    this.martha.y += this.martha.vy;

    if (this.martha.vy === 0) {
      this.martha.vy = this.martha.originalSpeed * 0.5;
    }

    // Bounce off walls - responsive bounds
    const leftBound = this.getCanvasWidth() * 0.05;
    const rightBound = this.getCanvasWidth() * 0.95;
    const topBound = this.getCanvasHeight() * 0.125;
    const bottomBound = this.getCanvasHeight() * 0.75;

    if (this.martha.x <= leftBound || this.martha.x >= rightBound) {
      this.martha.vx = -this.martha.vx;
    }
    if (this.martha.y <= topBound || this.martha.y >= bottomBound) {
      this.martha.vy = -this.martha.vy;
    }
  }

  // Make Martha disappear when hit
  makeAway() {
    this.isAway = true;
    this.awayTimer = this.awayDuration;
    console.log("Martha is going away for", this.awayDuration, "frames");
  }

  // Respawn Martha at a new random position - IMPROVED
  respawnMartha() {
    console.log("=== RESPAWNING MARTHA ===");

    this.isAway = false;
    this.awayTimer = 0;
    this.patternTimer = 0;

    // Reset animation when respawning
    this.currentFrameIndex = 0;
    this.animationTimer = 0;

    // Select new random movement pattern
    this.movementPattern = Math.floor(
      Math.random() * this.movementPatterns.length
    );

    // Random spawn height within safe bounds - responsive
    const minY = this.getCanvasHeight() * 0.125; // 12.5% from top
    const maxY = this.getCanvasHeight() * 0.75; // 75% from top
    const randomY = minY + Math.random() * (maxY - minY);

    // Spawn from random side - but ensure Martha is visible
    const spawnFromLeft = Math.random() < 0.5;
    const spawnMargin = this.getCanvasWidth() * 0.1; // 10% margin

    // Update Martha properties
    this.martha.x = spawnFromLeft
      ? -spawnMargin
      : this.getCanvasWidth() + spawnMargin;
    this.martha.y = randomY;
    this.martha.vx = spawnFromLeft
      ? this.martha.originalSpeed
      : -this.martha.originalSpeed;
    this.martha.vy = 0;
    this.martha.direction = spawnFromLeft ? 1 : -1;
    this.martha.centerX = this.getCanvasWidth() / 2;
    this.martha.centerY = randomY;
    this.martha.angle = 0;
    this.martha.hitEffect = 0; // Reset hit effect
    this.martha.radius =
      Math.min(this.getCanvasWidth(), this.getCanvasHeight()) * 0.125;

    console.log("Martha respawned:", {
      position: { x: this.martha.x, y: this.martha.y },
      pattern: this.movementPatterns[this.movementPattern],
      spawnFromLeft: spawnFromLeft,
      isAway: this.isAway,
      awayTimer: this.awayTimer,
    });
    console.log("=== RESPAWN COMPLETE ===");
  }

  // Check if Martha is currently away
  isMarthaAway() {
    return this.isAway;
  }

  // Check if a sock hits Martha
  checkSockCollision(sock) {
    if (!this.martha || this.isAway) return false;

    const sockBounds = {
      left: sock.x - 20,
      right: sock.x + 20,
      top: sock.y - 20,
      bottom: sock.y + 20,
    };

    const marthaBounds = {
      left: this.martha.x - this.martha.width / 2,
      right: this.martha.x + this.martha.width / 2,
      top: this.martha.y - this.martha.height / 2,
      bottom: this.martha.y + this.martha.height / 2,
    };

    return (
      sockBounds.left < marthaBounds.right &&
      sockBounds.right > marthaBounds.left &&
      sockBounds.top < marthaBounds.bottom &&
      sockBounds.bottom > marthaBounds.top
    );
  }

  // Handle Martha consuming a sock
  consumeSock() {
    this.martha.hitEffect = GameConfig.MARTHA_HIT_EFFECT_DURATION;
    this.consumedSocks++;

    console.log(
      `Martha consumed sock! Total: ${this.consumedSocks}/${this.targetSocks}`
    );

    // Award points immediately when Martha consumes a sock
    this.game.playerPoints += 5; // 5 points per sock consumed

    // Make Martha go away after being hit
    this.makeAway();

    return this.consumedSocks >= this.targetSocks;
  }

  // Get Martha's current state
  getMartha() {
    return this.martha;
  }

  // Get consumption progress
  getProgress() {
    return {
      consumed: this.consumedSocks,
      target: this.targetSocks,
      percentage: Math.min(this.consumedSocks / this.targetSocks, 1),
    };
  }

  // Check if Martha is satisfied
  isSatisfied() {
    return this.consumedSocks >= this.targetSocks;
  }

  // Render Martha
  render(ctx) {
    if (!this.martha || this.isAway) return;

    // Get current animation frame index
    const currentImageIndex = this.animationFrames[this.currentFrameIndex];
    const imageName = GameConfig.IMAGES.CHARACTERS[currentImageIndex];
    const marthaImage = this.game.images[imageName];

    console.log("Rendering Martha:", {
      currentFrameIndex: this.currentFrameIndex,
      imageIndex: currentImageIndex,
      imageName: imageName,
      imageLoaded: marthaImage && marthaImage.complete,
      position: { x: this.martha.x, y: this.martha.y },
      isAway: this.isAway,
    });

    // Draw Martha with current animation frame
    if (marthaImage && marthaImage.complete) {
      ctx.save();

      // Apply hit effect with enhanced visual feedback
      if (this.martha.hitEffect > 0) {
        ctx.globalAlpha = 0.7;
        ctx.filter = "brightness(180%) saturate(150%)";

        // Add pulsing effect during hit
        const hitPulse = 1 + Math.sin(this.martha.hitEffect * 0.5) * 0.1;
        ctx.scale(hitPulse, hitPulse);
        ctx.translate(
          this.martha.x * (1 - hitPulse),
          this.martha.y * (1 - hitPulse)
        );
      }

      ctx.drawImage(
        marthaImage,
        this.martha.x - this.martha.width / 2,
        this.martha.y - this.martha.height / 2,
        this.martha.width,
        this.martha.height
      );

      ctx.restore();
    } else {
      // Enhanced fallback rendering
      ctx.save();

      // Apply hit effect to fallback too
      if (this.martha.hitEffect > 0) {
        ctx.globalAlpha = 0.7;
        const hitPulse = 1 + Math.sin(this.martha.hitEffect * 0.5) * 0.1;
        ctx.scale(hitPulse, hitPulse);
        ctx.translate(
          this.martha.x * (1 - hitPulse),
          this.martha.y * (1 - hitPulse)
        );
      }

      // Enhanced fallback with gradient
      const gradient = ctx.createLinearGradient(
        this.martha.x - this.martha.width / 2,
        this.martha.y - this.martha.height / 2,
        this.martha.x + this.martha.width / 2,
        this.martha.y + this.martha.height / 2
      );
      gradient.addColorStop(0, "#8B008B");
      gradient.addColorStop(1, "#4B0082");

      ctx.fillStyle = gradient;
      ctx.fillRect(
        this.martha.x - this.martha.width / 2,
        this.martha.y - this.martha.height / 2,
        this.martha.width,
        this.martha.height
      );

      // Add border
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.strokeRect(
        this.martha.x - this.martha.width / 2,
        this.martha.y - this.martha.height / 2,
        this.martha.width,
        this.martha.height
      );

      // Add enhanced label
      ctx.fillStyle = "white";
      ctx.font = "bold 14px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
      ctx.shadowBlur = 3;
      ctx.fillText("MARTHA", this.martha.x, this.martha.y);

      ctx.restore();

      console.log("Drew enhanced fallback Martha rectangle");
    }

    // Draw Martha's enhanced fullness bar
    this.renderFullnessBar(ctx);
  }

  // Render Martha's fullness bar - responsive
  renderFullnessBar(ctx) {
    if (!this.martha || this.isAway) return;

    // Responsive bar sizing
    const barWidth = Math.max(60, this.getCanvasWidth() * 0.06); // 6% of canvas width, min 60px
    const barHeight = Math.max(10, this.getCanvasHeight() * 0.015); // 1.5% of canvas height, min 10px
    const barX = this.martha.x - barWidth / 2;
    const barY = this.martha.y + this.martha.height / 2 + 15;

    ctx.save();

    // Draw bar background with gradient
    const bgGradient = ctx.createLinearGradient(
      barX,
      barY,
      barX,
      barY + barHeight
    );
    bgGradient.addColorStop(0, "rgba(0, 0, 0, 0.7)");
    bgGradient.addColorStop(1, "rgba(0, 0, 0, 0.5)");

    ctx.fillStyle = bgGradient;
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Draw bar border with glow
    ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
    ctx.lineWidth = 2;
    ctx.shadowColor = "rgba(255, 255, 255, 0.3)";
    ctx.shadowBlur = 3;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    // Draw fill based on consumed socks
    const progress = this.getProgress();
    const fillWidth = barWidth * progress.percentage;

    if (fillWidth > 0) {
      // Color changes based on how full Martha is
      let fillColor1 = "#4CAF50"; // Green
      let fillColor2 = "#8BC34A";
      let glowColor = "rgba(76, 175, 80, 0.5)";

      if (progress.percentage > 0.7) {
        fillColor1 = "#FFC107"; // Yellow
        fillColor2 = "#FF9800";
        glowColor = "rgba(255, 193, 7, 0.5)";
      }
      if (progress.percentage >= 1) {
        fillColor1 = "#FF5722"; // Red
        fillColor2 = "#F44336";
        glowColor = "rgba(255, 87, 34, 0.5)";
      }

      // Create gradient for fill
      const fillGradient = ctx.createLinearGradient(
        barX,
        barY,
        barX,
        barY + barHeight
      );
      fillGradient.addColorStop(0, fillColor1);
      fillGradient.addColorStop(1, fillColor2);

      ctx.fillStyle = fillGradient;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 5;
      ctx.fillRect(barX, barY, fillWidth, barHeight);

      // Add inner highlight
      ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
      ctx.fillRect(barX, barY, fillWidth, 2);
    }

    ctx.restore();

    // Draw text showing progress with responsive sizing
    ctx.save();
    ctx.fillStyle = "white";
    const fontSize = Math.max(12, this.getCanvasWidth() * 0.012); // 1.2% of canvas width, min 12px
    ctx.font = `bold ${fontSize}px Courier New`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
    ctx.shadowBlur = 3;
    ctx.fillText(
      `${progress.consumed}/${progress.target}`,
      this.martha.x,
      barY + barHeight + 8
    );
    ctx.restore();
  }

  // Render Martha's dialogue (this method is called from MarthaScene now)
  renderDialogue(ctx) {
    // This method is now handled by MarthaScene.renderEnhancedDialogue()
    // Keeping for compatibility but functionality moved to scene
  }

  // Get Martha's bounds for collision detection
  getBounds() {
    if (!this.martha || this.isAway) return null;

    return {
      x: this.martha.x,
      y: this.martha.y,
      width: this.martha.width,
      height: this.martha.height,
    };
  }
}
