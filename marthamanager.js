class MarthaManager {
  constructor(game) {
    this.game = game;
    this.martha = null;
    this.consumedSocks = 0;
    this.targetSocks = 0;
    this.isAway = false;
    this.awayTimer = 0;
    this.awayDuration = 120; // 2 seconds at 60 FPS
    this.movementPattern = 0;
    this.patternTimer = 0;
    this.movementPatterns = [
      "horizontal",
      "vertical",
      "circular",
      "figure8",
      "diagonal",
    ];
  }

  // Initialize Martha for the current level
  setup(level) {
    this.targetSocks = GameConfig.LEVELS[level].sockTarget;
    this.consumedSocks = 0;
    this.isAway = false;
    this.awayTimer = 0;
    this.patternTimer = 0;

    // Select random movement pattern
    this.movementPattern = Math.floor(
      Math.random() * this.movementPatterns.length
    );

    // Random spawn height within safe bounds
    const minY = 100;
    const maxY = this.game.canvas.height - 200;
    const randomY = minY + Math.random() * (maxY - minY);

    this.martha = {
      x: this.game.canvas.width + 50,
      y: randomY,
      width: GameConfig.MARTHA_SIZE.width,
      height: GameConfig.MARTHA_SIZE.height,
      vx: -GameConfig.LEVELS[level].marthaSpeed,
      vy: 0,
      direction: -1,
      hitEffect: 0,
      centerX: this.game.canvas.width / 2, // For circular patterns
      centerY: randomY, // For circular patterns
      radius: 150, // For circular patterns
      angle: 0, // For circular patterns
      originalSpeed: GameConfig.LEVELS[level].marthaSpeed,
    };
  }

  // Update Martha's position and behavior
  update() {
    if (!this.martha) return;

    // Handle away state
    if (this.isAway) {
      this.awayTimer--;
      if (this.awayTimer <= 0) {
        this.respawnMartha();
      }
      return;
    }

    // Update pattern timer
    this.patternTimer++;

    // Update Martha's position based on movement pattern
    this.updateMovementPattern();

    // Update hit effect
    if (this.martha.hitEffect > 0) {
      this.martha.hitEffect--;
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

    if (this.martha.x <= 50) {
      this.martha.vx = this.martha.originalSpeed;
      this.martha.direction = 1;
    } else if (this.martha.x >= this.game.canvas.width - 50) {
      this.martha.vx = -this.martha.originalSpeed;
      this.martha.direction = -1;
    }
  }

  updateVerticalMovement() {
    this.martha.y += this.martha.vy;

    if (this.martha.vy === 0) {
      this.martha.vy = this.martha.originalSpeed;
    }

    if (this.martha.y <= 100) {
      this.martha.vy = this.martha.originalSpeed;
    } else if (this.martha.y >= this.game.canvas.height - 200) {
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

    // Keep within bounds
    if (this.martha.x < 50) this.martha.x = 50;
    if (this.martha.x > this.game.canvas.width - 50)
      this.martha.x = this.game.canvas.width - 50;
    if (this.martha.y < 100) this.martha.y = 100;
    if (this.martha.y > this.game.canvas.height - 200)
      this.martha.y = this.game.canvas.height - 200;
  }

  updateFigure8Movement() {
    this.martha.angle += this.martha.originalSpeed * 0.015;
    this.martha.x =
      this.martha.centerX + Math.cos(this.martha.angle) * this.martha.radius;
    this.martha.y =
      this.martha.centerY +
      Math.sin(this.martha.angle * 2) * this.martha.radius * 0.3;

    // Keep within bounds
    if (this.martha.x < 50) this.martha.x = 50;
    if (this.martha.x > this.game.canvas.width - 50)
      this.martha.x = this.game.canvas.width - 50;
    if (this.martha.y < 100) this.martha.y = 100;
    if (this.martha.y > this.game.canvas.height - 200)
      this.martha.y = this.game.canvas.height - 200;
  }

  updateDiagonalMovement() {
    this.martha.x += this.martha.vx;
    this.martha.y += this.martha.vy;

    if (this.martha.vy === 0) {
      this.martha.vy = this.martha.originalSpeed * 0.5;
    }

    // Bounce off walls
    if (this.martha.x <= 50 || this.martha.x >= this.game.canvas.width - 50) {
      this.martha.vx = -this.martha.vx;
    }
    if (
      this.martha.y <= 100 ||
      this.martha.y >= this.game.canvas.height - 200
    ) {
      this.martha.vy = -this.martha.vy;
    }
  }

  // Make Martha disappear when hit
  makeAway() {
    this.isAway = true;
    this.awayTimer = this.awayDuration;
    console.log("Martha is going away for", this.awayDuration, "frames");
  }

  // Respawn Martha at a new random position
  respawnMartha() {
    this.isAway = false;
    this.awayTimer = 0;
    this.patternTimer = 0;

    // Select new random movement pattern
    this.movementPattern = Math.floor(
      Math.random() * this.movementPatterns.length
    );

    // Random spawn height within safe bounds
    const minY = 100;
    const maxY = this.game.canvas.height - 200;
    const randomY = minY + Math.random() * (maxY - minY);

    // Spawn from random side
    const spawnFromLeft = Math.random() < 0.5;

    this.martha.x = spawnFromLeft ? -50 : this.game.canvas.width + 50;
    this.martha.y = randomY;
    this.martha.vx = spawnFromLeft
      ? this.martha.originalSpeed
      : -this.martha.originalSpeed;
    this.martha.vy = 0;
    this.martha.direction = spawnFromLeft ? 1 : -1;
    this.martha.centerX = this.game.canvas.width / 2;
    this.martha.centerY = randomY;
    this.martha.angle = 0;

    console.log(
      "Martha respawned with pattern:",
      this.movementPatterns[this.movementPattern],
      "at y:",
      randomY
    );
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

    // Draw Martha
    if (this.game.images["martha.png"]) {
      ctx.save();

      // Apply hit effect
      if (this.martha.hitEffect > 0) {
        ctx.globalAlpha = 0.5;
        ctx.filter = "brightness(200%)";
      }

      ctx.drawImage(
        this.game.images["martha.png"],
        this.martha.x - this.martha.width / 2,
        this.martha.y - this.martha.height / 2,
        this.martha.width,
        this.martha.height
      );

      ctx.restore();
    }

    // Draw Martha's fullness bar
    this.renderFullnessBar(ctx);
  }

  // Render Martha's fullness bar
  renderFullnessBar(ctx) {
    if (!this.martha || this.isAway) return;

    const barWidth = 60;
    const barHeight = 8;
    const barX = this.martha.x - barWidth / 2;
    const barY = this.martha.y + this.martha.height / 2 + 10;

    // Draw bar background
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Draw bar border
    ctx.strokeStyle = "white";
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    // Draw fill based on consumed socks
    const progress = this.getProgress();
    const fillWidth = barWidth * progress.percentage;

    // Color changes based on how full Martha is
    let fillColor = "#4CAF50"; // Green
    if (progress.percentage > 0.7) {
      fillColor = "#FFC107"; // Yellow
    }
    if (progress.percentage >= 1) {
      fillColor = "#FF5722"; // Red
    }

    ctx.fillStyle = fillColor;
    ctx.fillRect(barX, barY, fillWidth, barHeight);

    // Draw text showing progress
    ctx.fillStyle = "white";
    ctx.font = "12px Courier New";
    ctx.textAlign = "center";
    ctx.fillText(
      `${progress.consumed}/${progress.target}`,
      this.martha.x,
      barY + barHeight + 15
    );
  }

  // Render Martha's dialogue
  renderDialogue(ctx) {
    ctx.fillStyle = "white";
    ctx.font = "16px Courier New";
    ctx.textAlign = "center";
    ctx.fillText(
      `I DEMAND ${this.targetSocks} PAIRS OF SOCKS OR ELSE!`,
      this.game.canvas.width / 2,
      50
    );
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
