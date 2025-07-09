// 📁 throwing-screen.js - Throwing Screen Implementation

class ThrowingScreen extends Screen {
  constructor(game) {
    super(game);

    // Martha management
    this.marthaManager = new MarthaManager(game);

    // Sockball management
    this.availableSockballs = 0;
    this.sockballProjectiles = [];
    this.lastThrowTime = 0;
    this.throwCooldownDuration = GameConfig.SOCKBALL_THROW_COOLDOWN;

    // UI state
    this.showingMessage = false;
    this.messageText = "";
    this.messageType = "info";
    this.messageTimer = 0;

    // Game state
    this.gamePhase = "throwing"; // 'throwing', 'waiting', 'complete'
    this.levelComplete = false;
    this.waitingForMartha = false;

    // Launch position
    this.launchPosition = {
      x: GameConfig.SOCKBALL_LAUNCH_POSITION.x,
      y: GameConfig.SOCKBALL_LAUNCH_POSITION.y,
    };

    // Trajectory preview
    this.showTrajectory = false;
    this.trajectoryPoints = [];
    this.mouseX = 0;
    this.mouseY = 0;
  }

  setup() {
    super.setup();

    // Get sockballs from previous screen
    this.availableSockballs = this.game.sockBalls;

    // Setup Martha for current level
    const level = GameConfig.LEVELS[this.game.currentLevel];
    this.marthaManager.setup(level);

    // Reset game state
    this.gamePhase = "throwing";
    this.levelComplete = false;
    this.waitingForMartha = false;
    this.sockballProjectiles = [];
    this.lastThrowTime = 0;

    // Clear messages
    this.showingMessage = false;

    // Scale launch position
    this.launchPosition.x = this.game.getScaledValue(
      GameConfig.SOCKBALL_LAUNCH_POSITION.x
    );
    this.launchPosition.y = this.game.getScaledValue(
      GameConfig.SOCKBALL_LAUNCH_POSITION.y
    );

    this.showMessage("Click to throw sockballs at Martha!", "info", 3000);
  }

  cleanup() {
    super.cleanup();
    this.sockballProjectiles = [];
    this.showingMessage = false;
  }

  createLayoutCache() {
    const cache = super.createLayoutCache();

    // Add throwing-specific layout values
    cache.sockballCounterPos = {
      x: this.game.getScaledValue(20),
      y: this.game.getScaledValue(20),
    };
    cache.marthaStatusPos = {
      x: this.game.getCanvasWidth() - this.game.getScaledValue(200),
      y: this.game.getScaledValue(20),
    };
    cache.cooldownBarPos = {
      x: this.game.getScaledValue(20),
      y: this.game.getCanvasHeight() - this.game.getScaledValue(120),
    };

    return cache;
  }

  onMouseMove(x, y) {
    this.mouseX = x;
    this.mouseY = y;

    // Update trajectory preview
    if (this.canThrow()) {
      this.updateTrajectoryPreview(x, y);
      this.showTrajectory = true;
    } else {
      this.showTrajectory = false;
    }

    return false;
  }

  onClick(x, y) {
    if (this.canThrow()) {
      this.throwSockball(x, y);
      return true;
    }
    return false;
  }

  canThrow() {
    const currentTime = Date.now();
    const cooldownPassed =
      currentTime - this.lastThrowTime >= this.throwCooldownDuration;

    return (
      this.availableSockballs > 0 &&
      this.gamePhase === "throwing" &&
      cooldownPassed &&
      !this.levelComplete
    );
  }

  throwSockball(targetX, targetY) {
    if (!this.canThrow()) return;

    this.availableSockballs--;
    this.lastThrowTime = Date.now();

    // Calculate throw velocity
    const deltaX = targetX - this.launchPosition.x;
    const deltaY = targetY - this.launchPosition.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const normalizedVelocity = GameConfig.SOCKBALL_THROW_SPEED / distance;

    // Create sockball projectile
    const sockball = {
      x: this.launchPosition.x,
      y: this.launchPosition.y,
      vx: deltaX * normalizedVelocity,
      vy: deltaY * normalizedVelocity,
      size: GameConfig.SOCKBALL_SIZE,
      type: Math.floor(Math.random() * 6) + 1, // Random sockball type
      rotation: 0,
      rotationSpeed: 0.2,
      gravity: GameConfig.GRAVITY,
      bounced: false,
      active: true,
    };

    this.sockballProjectiles.push(sockball);
    this.showTrajectory = false;
  }

  updateTrajectoryPreview(targetX, targetY) {
    this.trajectoryPoints = [];

    // Simulate trajectory
    const steps = 20;
    let x = this.launchPosition.x;
    let y = this.launchPosition.y;

    const deltaX = targetX - x;
    const deltaY = targetY - y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const normalizedVelocity = GameConfig.SOCKBALL_THROW_SPEED / distance;

    let vx = deltaX * normalizedVelocity;
    let vy = deltaY * normalizedVelocity;

    for (let i = 0; i < steps; i++) {
      this.trajectoryPoints.push({ x, y });

      x += vx;
      y += vy;
      vy += GameConfig.GRAVITY;

      // Stop if it goes off screen
      if (
        y > this.game.getCanvasHeight() ||
        x < 0 ||
        x > this.game.getCanvasWidth()
      ) {
        break;
      }
    }
  }

  updateSockballs(deltaTime) {
    const canvasWidth = this.game.getCanvasWidth();
    const canvasHeight = this.game.getCanvasHeight();

    this.sockballProjectiles = this.sockballProjectiles.filter((sockball) => {
      if (!sockball.active) return false;

      // Update position
      sockball.x += sockball.vx * (deltaTime / 16.67);
      sockball.y += sockball.vy * (deltaTime / 16.67);

      // Apply gravity
      sockball.vy += sockball.gravity * (deltaTime / 16.67);

      // Update rotation
      sockball.rotation += sockball.rotationSpeed * (deltaTime / 16.67);

      // Bounce off walls and top
      if (
        sockball.x <= sockball.size / 2 ||
        sockball.x >= canvasWidth - sockball.size / 2
      ) {
        sockball.vx *= -GameConfig.BOUNCE_DAMPING;
        sockball.x = Math.max(
          sockball.size / 2,
          Math.min(canvasWidth - sockball.size / 2, sockball.x)
        );
      }

      if (sockball.y <= sockball.size / 2) {
        sockball.vy *= -GameConfig.BOUNCE_DAMPING;
        sockball.y = sockball.size / 2;
        sockball.bounced = true;
      }

      // Remove if falls off bottom
      if (sockball.y > canvasHeight + sockball.size) {
        return false;
      }

      // Check collision with Martha
      if (this.marthaManager.checkCollision(sockball)) {
        if (this.marthaManager.hitBySockball(sockball)) {
          // Sockball was collected
          sockball.active = false;
          return false;
        }
      }

      return true;
    });
  }

  checkGameEnd() {
    const hasActiveSockballs = this.sockballProjectiles.length > 0;
    const hasAvailableSockballs = this.availableSockballs > 0;

    if (this.marthaManager.hasCollectedEnoughSockballs()) {
      // Martha has enough sockballs
      if (!this.waitingForMartha) {
        this.waitingForMartha = true;
        this.marthaManager.startExit();
        this.showMessage("Martha got her rent money!", "success", 2000);
      }

      // Check if Martha is off screen
      if (!this.marthaManager.onScreen) {
        this.levelComplete = true;
        this.gamePhase = "complete";

        // Delay before showing level end screen
        setTimeout(() => {
          this.game.completeLevel();
        }, 1000);
      }
    } else if (!hasActiveSockballs && !hasAvailableSockballs) {
      // No more sockballs and none in flight
      if (!this.waitingForMartha) {
        this.waitingForMartha = true;
        this.marthaManager.startExit();
        this.showMessage(
          "Martha didn't get enough rent money...",
          "warning",
          2000
        );
      }

      // Check if Martha is off screen
      if (!this.marthaManager.onScreen) {
        this.levelComplete = true;
        this.gamePhase = "complete";

        // Delay before showing level end screen
        setTimeout(() => {
          this.game.completeLevel();
        }, 1000);
      }
    } else if (
      !this.marthaManager.onScreen &&
      this.marthaManager.needsMoreSockballs() &&
      (hasActiveSockballs || hasAvailableSockballs)
    ) {
      // Martha needs more sockballs and there are still sockballs available
      this.waitingForMartha = false;
      this.marthaManager.startEnter();
      this.showMessage("Martha is back for more sockballs!", "info", 2000);
    }
  }

  showMessage(text, type = "info", duration = 3000) {
    this.showingMessage = true;
    this.messageText = text;
    this.messageType = type;
    this.messageTimer = duration;
  }

  onUpdate(deltaTime) {
    // Update Martha
    this.marthaManager.update(deltaTime);

    // Update sockball projectiles
    this.updateSockballs(deltaTime);

    // Check for game end conditions
    this.checkGameEnd();

    // Update message timer
    if (this.showingMessage) {
      this.messageTimer -= deltaTime;
      if (this.messageTimer <= 0) {
        this.showingMessage = false;
      }
    }
  }

  onRender(ctx) {
    // Draw Martha
    this.marthaManager.render(ctx);

    // Draw sockball projectiles
    this.sockballProjectiles.forEach((sockball) => {
      this.renderSockball(ctx, sockball);
    });

    // Draw trajectory preview
    if (this.showTrajectory && this.trajectoryPoints.length > 0) {
      this.renderTrajectory(ctx);
    }

    // Draw launch position indicator
    this.renderLaunchIndicator(ctx);

    // Draw UI
    this.renderUI(ctx);

    // Draw game message
    if (this.showingMessage) {
      this.renderMessage(ctx);
    }
  }

  renderSockball(ctx, sockball) {
    ctx.save();

    ctx.translate(sockball.x, sockball.y);
    ctx.rotate(sockball.rotation);

    // Draw sockball image or fallback
    const sockballImage = this.game.images[`sockball${sockball.type}.png`];
    if (sockballImage) {
      ctx.drawImage(
        sockballImage,
        -sockball.size / 2,
        -sockball.size / 2,
        sockball.size,
        sockball.size
      );
    } else {
      // Fallback circle
      ctx.fillStyle = `hsl(${sockball.type * 60}, 70%, 50%)`;
      ctx.beginPath();
      ctx.arc(0, 0, sockball.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  renderTrajectory(ctx) {
    if (this.trajectoryPoints.length < 2) return;

    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
    ctx.lineWidth = this.game.getScaledValue(2);
    ctx.setLineDash([this.game.getScaledValue(5), this.game.getScaledValue(5)]);

    ctx.beginPath();
    ctx.moveTo(this.trajectoryPoints[0].x, this.trajectoryPoints[0].y);

    for (let i = 1; i < this.trajectoryPoints.length; i++) {
      ctx.lineTo(this.trajectoryPoints[i].x, this.trajectoryPoints[i].y);
    }

    ctx.stroke();
    ctx.restore();
  }

  renderLaunchIndicator(ctx) {
    ctx.save();

    const pulseScale = this.getPulseScale(0.2);
    const radius = this.game.getScaledValue(15) * pulseScale;

    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
    ctx.lineWidth = this.game.getScaledValue(2);

    ctx.beginPath();
    ctx.arc(
      this.launchPosition.x,
      this.launchPosition.y,
      radius,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  renderUI(ctx) {
    // Sockball counter
    const counterX = this.layoutCache.sockballCounterPos.x;
    const counterY = this.layoutCache.sockballCounterPos.y;

    this.renderPanel(
      ctx,
      counterX,
      counterY,
      this.game.getScaledValue(150),
      this.game.getScaledValue(60),
      "primary"
    );

    this.renderText(
      ctx,
      "Sockballs:",
      counterX + this.game.getScaledValue(75),
      counterY + this.game.getScaledValue(20),
      {
        fontSize: this.layoutCache.bodyFontSize,
        align: "center",
      }
    );

    this.renderText(
      ctx,
      this.availableSockballs.toString(),
      counterX + this.game.getScaledValue(75),
      counterY + this.game.getScaledValue(40),
      {
        fontSize: this.layoutCache.headerFontSize,
        color: "#ffd700",
        align: "center",
      }
    );

    // Martha status
    const statusX = this.layoutCache.marthaStatusPos.x;
    const statusY = this.layoutCache.marthaStatusPos.y;

    this.renderPanel(
      ctx,
      statusX,
      statusY,
      this.game.getScaledValue(180),
      this.game.getScaledValue(80),
      "secondary"
    );

    this.renderText(
      ctx,
      "Martha wants:",
      statusX + this.game.getScaledValue(90),
      statusY + this.game.getScaledValue(20),
      {
        fontSize: this.layoutCache.smallFontSize,
        align: "center",
      }
    );

    this.renderText(
      ctx,
      `${this.marthaManager.collectedSockballs}/${this.marthaManager.sockballsWanted}`,
      statusX + this.game.getScaledValue(90),
      statusY + this.game.getScaledValue(40),
      {
        fontSize: this.layoutCache.bodyFontSize,
        color: "#4caf50",
        align: "center",
      }
    );

    // Throw cooldown
    const cooldownX = this.layoutCache.cooldownBarPos.x;
    const cooldownY = this.layoutCache.cooldownBarPos.y;
    const cooldownWidth = this.game.getScaledValue(200);
    const cooldownHeight = this.game.getScaledValue(20);

    const currentTime = Date.now();
    const timeSinceLastThrow = currentTime - this.lastThrowTime;
    const cooldownProgress = Math.min(
      timeSinceLastThrow / this.throwCooldownDuration,
      1
    );

    this.renderProgressBar(
      ctx,
      cooldownX,
      cooldownY,
      cooldownWidth,
      cooldownHeight,
      cooldownProgress,
      {
        fillColor: cooldownProgress >= 1 ? "#4caf50" : "#ffc107",
        glow: cooldownProgress >= 1,
      }
    );

    this.renderText(
      ctx,
      cooldownProgress >= 1 ? "READY" : "COOLDOWN",
      cooldownX + cooldownWidth / 2,
      cooldownY + cooldownHeight / 2,
      {
        fontSize: this.layoutCache.smallFontSize,
        align: "center",
        baseline: "middle",
      }
    );
  }

  renderMessage(ctx) {
    const centerX = this.layoutCache.centerX;
    const centerY = this.layoutCache.centerY - this.game.getScaledValue(100);

    let panelStyle = "primary";
    if (this.messageType === "success") panelStyle = "success";
    else if (this.messageType === "warning") panelStyle = "warning";

    const textWidth = ctx.measureText(this.messageText).width;
    const panelWidth = textWidth + this.game.getScaledValue(60);
    const panelHeight = this.game.getScaledValue(60);

    this.renderPanel(
      ctx,
      centerX - panelWidth / 2,
      centerY - panelHeight / 2,
      panelWidth,
      panelHeight,
      panelStyle
    );

    this.renderText(ctx, this.messageText, centerX, centerY, {
      fontSize: this.layoutCache.bodyFontSize,
      align: "center",
      baseline: "middle",
      weight: "bold",
    });
  }
}
