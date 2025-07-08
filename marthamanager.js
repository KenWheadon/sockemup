class MarthaManager {
  constructor(game) {
    this.game = game;
    this.martha = null;
    this.consumedSocks = 0;
    this.targetSocks = 0;
  }

  // Initialize Martha for the current level
  setup(level) {
    this.targetSocks = GameConfig.LEVELS[level].sockTarget;
    this.consumedSocks = 0;

    this.martha = {
      x: this.game.canvas.width + 50,
      y: this.game.canvas.height / 2,
      width: GameConfig.MARTHA_SIZE.width,
      height: GameConfig.MARTHA_SIZE.height,
      vx: -GameConfig.LEVELS[level].marthaSpeed,
      direction: -1,
      hitEffect: 0,
    };
  }

  // Update Martha's position and behavior
  update() {
    if (!this.martha) return;

    // Update Martha's position
    this.martha.x += this.martha.vx;

    // Martha movement pattern - bounce between screen edges
    if (this.martha.x <= 50) {
      this.martha.vx = GameConfig.LEVELS[this.game.currentLevel].marthaSpeed;
      this.martha.direction = 1;
    } else if (this.martha.x >= this.game.canvas.width - 50) {
      this.martha.vx = -GameConfig.LEVELS[this.game.currentLevel].marthaSpeed;
      this.martha.direction = -1;
    }

    // Update hit effect
    if (this.martha.hitEffect > 0) {
      this.martha.hitEffect--;
    }
  }

  // Check if a sock hits Martha
  checkSockCollision(sock) {
    if (!this.martha) return false;

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
    if (!this.martha) return;

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
    if (!this.martha) return;

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
    if (!this.martha) return null;

    return {
      x: this.martha.x,
      y: this.martha.y,
      width: this.martha.width,
      height: this.martha.height,
    };
  }
}
