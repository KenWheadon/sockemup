class MarthaManager {
  constructor(game) {
    this.game = game;
    this.martha = null;
    this.consumedSocks = 0;
    this.targetSocks = 0;
    this.isAway = false;
    this.awayTimer = 0;
    this.awayDuration = 90; // 1.5 seconds at 60 FPS
    this.movementPattern = 0;
    this.patternTimer = 0;
    this.movementPatterns = [
      "horizontal",
      "vertical",
      "circular",
      "figure8",
      "diagonal",
    ];

    // Animation properties
    this.animationFrames = [0, 1, 0, 2]; // martha.png, martha2.png, martha.png, martha3.png
    this.currentFrameIndex = 0;
    this.animationTimer = 0;
    this.animationSpeed = 15; // Change frame every 15 game ticks
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

    // Martha spawns in bottom 2/3 of screen (33.33% to 100% from top)
    const topBound = this.game.getCanvasHeight() * 0.3333; // 33.33% from top
    const bottomBound = this.game.getCanvasHeight() * 0.9; // 90% from top (leave space for Martha height)
    const randomY = topBound + Math.random() * (bottomBound - topBound);

    // Use centralized scaling for Martha size
    const marthaSize = this.game.getScaledSize(
      GameConfig.MARTHA_SIZE.width,
      GameConfig.MARTHA_SIZE.height
    );

    this.martha = {
      x: this.game.getCanvasWidth() / 2,
      y: randomY,
      width: marthaSize.width,
      height: marthaSize.height,
      vx: -GameConfig.LEVELS[level].marthaSpeed,
      vy: 0,
      direction: -1,
      hitEffect: 0,
      centerX: this.game.getCanvasWidth() / 2,
      centerY: randomY,
      radius:
        Math.min(this.game.getCanvasWidth(), this.game.getCanvasHeight()) *
        0.125,
      angle: 0,
      originalSpeed: GameConfig.LEVELS[level].marthaSpeed,
    };
  }

  // Update Martha's position and behavior
  update(deltaTime) {
    if (!this.martha) return;

    const timeMultiplier = deltaTime / 16.67; // Normalize to 60fps

    // Handle away state
    if (this.isAway) {
      this.awayTimer -= timeMultiplier;
      if (this.awayTimer <= 0) {
        this.respawnMartha();
      }
      return;
    }

    // Update pattern timer
    this.patternTimer += timeMultiplier;

    // Update Martha's position based on movement pattern
    this.updateMovementPattern(timeMultiplier);

    // Update animation frame
    this.updateAnimation(timeMultiplier);

    // Update hit effect
    if (this.martha.hitEffect > 0) {
      this.martha.hitEffect -= timeMultiplier;
    }
  }

  // Update animation frame cycling
  updateAnimation(timeMultiplier) {
    this.animationTimer += timeMultiplier;

    if (this.animationTimer >= this.animationSpeed) {
      this.animationTimer = 0;
      this.currentFrameIndex =
        (this.currentFrameIndex + 1) % this.animationFrames.length;
    }
  }

  updateMovementPattern(timeMultiplier) {
    const pattern = this.movementPatterns[this.movementPattern];

    switch (pattern) {
      case "horizontal":
        this.updateHorizontalMovement(timeMultiplier);
        break;
      case "vertical":
        this.updateVerticalMovement(timeMultiplier);
        break;
      case "circular":
        this.updateCircularMovement(timeMultiplier);
        break;
      case "figure8":
        this.updateFigure8Movement(timeMultiplier);
        break;
      case "diagonal":
        this.updateDiagonalMovement(timeMultiplier);
        break;
    }
  }

  updateHorizontalMovement(timeMultiplier) {
    this.martha.x += this.martha.vx * timeMultiplier;

    const leftBound = this.game.getCanvasWidth() * 0.05;
    const rightBound = this.game.getCanvasWidth() * 0.95;

    if (this.martha.x <= leftBound) {
      this.martha.vx = this.martha.originalSpeed;
      this.martha.direction = 1;
    } else if (this.martha.x >= rightBound) {
      this.martha.vx = -this.martha.originalSpeed;
      this.martha.direction = -1;
    }
  }

  updateVerticalMovement(timeMultiplier) {
    this.martha.y += this.martha.vy * timeMultiplier;

    if (this.martha.vy === 0) {
      this.martha.vy = this.martha.originalSpeed;
    }

    // Movement bounds for bottom 2/3 of screen
    const topBound = this.game.getCanvasHeight() * 0.3333;
    const bottomBound = this.game.getCanvasHeight() * 0.9;

    if (this.martha.y <= topBound) {
      this.martha.vy = this.martha.originalSpeed;
    } else if (this.martha.y >= bottomBound) {
      this.martha.vy = -this.martha.originalSpeed;
    }
  }

  updateCircularMovement(timeMultiplier) {
    this.martha.angle += this.martha.originalSpeed * 0.02 * timeMultiplier;
    this.martha.x =
      this.martha.centerX + Math.cos(this.martha.angle) * this.martha.radius;
    this.martha.y =
      this.martha.centerY +
      Math.sin(this.martha.angle) * this.martha.radius * 0.5;

    // Keep within bottom 2/3 bounds
    const leftBound = this.game.getCanvasWidth() * 0.05;
    const rightBound = this.game.getCanvasWidth() * 0.95;
    const topBound = this.game.getCanvasHeight() * 0.3333;
    const bottomBound = this.game.getCanvasHeight() * 0.9;

    if (this.martha.x < leftBound) this.martha.x = leftBound;
    if (this.martha.x > rightBound) this.martha.x = rightBound;
    if (this.martha.y < topBound) this.martha.y = topBound;
    if (this.martha.y > bottomBound) this.martha.y = bottomBound;
  }

  updateFigure8Movement(timeMultiplier) {
    this.martha.angle += this.martha.originalSpeed * 0.015 * timeMultiplier;
    this.martha.x =
      this.martha.centerX + Math.cos(this.martha.angle) * this.martha.radius;
    this.martha.y =
      this.martha.centerY +
      Math.sin(this.martha.angle * 2) * this.martha.radius * 0.3;

    // Keep within bottom 2/3 bounds
    const leftBound = this.game.getCanvasWidth() * 0.05;
    const rightBound = this.game.getCanvasWidth() * 0.95;
    const topBound = this.game.getCanvasHeight() * 0.3333;
    const bottomBound = this.game.getCanvasHeight() * 0.9;

    if (this.martha.x < leftBound) this.martha.x = leftBound;
    if (this.martha.x > rightBound) this.martha.x = rightBound;
    if (this.martha.y < topBound) this.martha.y = topBound;
    if (this.martha.y > bottomBound) this.martha.y = bottomBound;
  }

  updateDiagonalMovement(timeMultiplier) {
    this.martha.x += this.martha.vx * timeMultiplier;
    this.martha.y += this.martha.vy * timeMultiplier;

    if (this.martha.vy === 0) {
      this.martha.vy = this.martha.originalSpeed * 0.5;
    }

    // Bounce off walls within bottom 2/3 bounds
    const leftBound = this.game.getCanvasWidth() * 0.05;
    const rightBound = this.game.getCanvasWidth() * 0.95;
    const topBound = this.game.getCanvasHeight() * 0.3333;
    const bottomBound = this.game.getCanvasHeight() * 0.9;

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
  }

  // Respawn Martha with bottom 2/3 bounds
  respawnMartha() {
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

    // Random spawn in bottom 2/3 of screen
    const topBound = this.game.getCanvasHeight() * 0.3333;
    const bottomBound = this.game.getCanvasHeight() * 0.9;
    const randomY = topBound + Math.random() * (bottomBound - topBound);

    // Spawn from random side
    const spawnFromLeft = Math.random() < 0.5;
    const spawnMargin = this.game.getCanvasWidth() * 0.1;

    // Update Martha properties
    this.martha.x = spawnFromLeft
      ? -spawnMargin
      : this.game.getCanvasWidth() + spawnMargin;
    this.martha.y = randomY;
    this.martha.vx = spawnFromLeft
      ? this.martha.originalSpeed
      : -this.martha.originalSpeed;
    this.martha.vy = 0;
    this.martha.direction = spawnFromLeft ? 1 : -1;
    this.martha.centerX = this.game.getCanvasWidth() / 2;
    this.martha.centerY = randomY;
    this.martha.angle = 0;
    this.martha.hitEffect = 0;
    this.martha.radius =
      Math.min(this.game.getCanvasWidth(), this.game.getCanvasHeight()) * 0.125;
  }

  // Check if Martha is currently away
  isMarthaAway() {
    return this.isAway;
  }

  // Check if a sock hits Martha
  checkSockCollision(sock) {
    if (!this.martha || this.isAway) return false;

    const sockSize = this.game.getScaledValue(20);
    const sockBounds = {
      left: sock.x - sockSize,
      right: sock.x + sockSize,
      top: sock.y - sockSize,
      bottom: sock.y + sockSize,
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

    // Award points immediately when Martha consumes a sock
    this.game.playerPoints += 5;

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

    // Get current animation frame
    const currentImageIndex = this.animationFrames[this.currentFrameIndex];
    const imageName = GameConfig.IMAGES.CHARACTERS[currentImageIndex];
    const marthaImage = this.game.images[imageName];

    // Draw Martha with current animation frame
    if (marthaImage && marthaImage.complete) {
      ctx.save();

      // Apply hit effect
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
      // Fallback rendering
      ctx.save();

      // Apply hit effect to fallback
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
      ctx.lineWidth = this.game.getScaledValue(2);
      ctx.strokeRect(
        this.martha.x - this.martha.width / 2,
        this.martha.y - this.martha.height / 2,
        this.martha.width,
        this.martha.height
      );

      // Add label
      ctx.fillStyle = "white";
      ctx.font = `bold ${this.game.getScaledValue(14)}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
      ctx.shadowBlur = this.game.getScaledValue(3);
      ctx.fillText("MARTHA", this.martha.x, this.martha.y);

      ctx.restore();
    }

    // Draw Martha's fullness bar
    this.renderFullnessBar(ctx);
  }

  // Render Martha's fullness bar
  renderFullnessBar(ctx) {
    if (!this.martha || this.isAway) return;

    // Use centralized scaling for bar sizing
    const barWidth = this.game.getScaledValue(70);
    const barHeight = this.game.getScaledValue(12);
    const barX = this.martha.x - barWidth / 2;
    const barY =
      this.martha.y + this.martha.height / 2 + this.game.getScaledValue(15);

    ctx.save();

    // Draw bar background
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

    // Draw bar border
    ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
    ctx.lineWidth = this.game.getScaledValue(2);
    ctx.shadowColor = "rgba(255, 255, 255, 0.3)";
    ctx.shadowBlur = this.game.getScaledValue(3);
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    // Draw fill based on consumed socks
    const progress = this.getProgress();
    const fillWidth = barWidth * progress.percentage;

    if (fillWidth > 0) {
      // Color changes based on fullness
      let fillColor1 = "#4CAF50";
      let fillColor2 = "#8BC34A";
      let glowColor = "rgba(76, 175, 80, 0.5)";

      if (progress.percentage > 0.7) {
        fillColor1 = "#FFC107";
        fillColor2 = "#FF9800";
        glowColor = "rgba(255, 193, 7, 0.5)";
      }
      if (progress.percentage >= 1) {
        fillColor1 = "#FF5722";
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
      ctx.shadowBlur = this.game.getScaledValue(5);
      ctx.fillRect(barX, barY, fillWidth, barHeight);

      // Add inner highlight
      ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
      ctx.fillRect(barX, barY, fillWidth, this.game.getScaledValue(2));
    }

    ctx.restore();

    // Draw progress text
    ctx.save();
    ctx.fillStyle = "white";
    const fontSize = this.game.getScaledValue(14);
    ctx.font = `bold ${fontSize}px Courier New`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
    ctx.shadowBlur = this.game.getScaledValue(3);
    ctx.fillText(
      `${progress.consumed}/${progress.target}`,
      this.martha.x,
      barY + barHeight + this.game.getScaledValue(8)
    );
    ctx.restore();
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
