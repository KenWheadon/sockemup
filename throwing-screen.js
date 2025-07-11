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
    this.sockballsThrown = 0;

    // UI state
    this.showingMessage = false;
    this.messageText = "";
    this.messageType = "info";
    this.messageTimer = 0;

    // Game state
    this.gamePhase = "throwing";
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

    // Background image
    this.backgroundImage = null;

    // Next sockball preview
    this.nextSockballType = null;
  }

  setup() {
    super.setup();

    // Initialize game state
    this.availableSockballs = this.game.sockBalls;
    this.gamePhase = "throwing";
    this.levelComplete = false;
    this.waitingForMartha = false;
    this.sockballProjectiles = [];
    this.lastThrowTime = 0;
    this.sockballsThrown = 0;
    this.showingMessage = false;

    // Setup Martha for current level
    const level = GameConfig.LEVELS[this.game.currentLevel];
    this.marthaManager.setup(level);

    // Scale launch position
    this.launchPosition.x = this.game.getScaledValue(
      GameConfig.SOCKBALL_LAUNCH_POSITION.x
    );
    this.launchPosition.y = this.game.getScaledValue(
      GameConfig.SOCKBALL_LAUNCH_POSITION.y
    );

    // Load background image
    this.backgroundImage = this.game.images["throw-bg.png"];

    // Set up next sockball type
    this.updateNextSockballType();

    // Start throwing music
    if (this.game.audioManager) {
      this.game.audioManager.playMusic("throwing-music");
    }

    this.showMessage("Click to throw sockballs at Martha!", "info", 3000);
  }

  cleanup() {
    super.cleanup();
    this.sockballProjectiles = [];
    this.showingMessage = false;
  }

  updateNextSockballType() {
    // Get the next sockball type from the queue
    this.nextSockballType = this.game.getNextSockballType();
  }

  createLayoutCache() {
    const cache = super.createLayoutCache();

    // Position UI elements near launch position (bottom area)
    const panelSpacing = this.game.getScaledValue(10);

    // Sockball counter positioned near launch area
    cache.sockballCounterPos = {
      x: this.launchPosition.x + this.game.getScaledValue(80),
      y: this.game.getCanvasHeight() - this.game.getScaledValue(100),
    };

    // Martha status positioned next to sockball counter
    cache.marthaStatusPos = {
      x:
        cache.sockballCounterPos.x +
        this.game.getScaledValue(160) +
        panelSpacing,
      y: cache.sockballCounterPos.y,
    };

    // Cooldown bar positioned below counters - moved up 20px
    cache.cooldownBarPos = {
      x: cache.sockballCounterPos.x,
      y: cache.sockballCounterPos.y + this.game.getScaledValue(70), // Changed from 70 to 50 (20px up)
    };

    return cache;
  }

  onMouseMove(x, y) {
    this.mouseX = x;
    this.mouseY = y;

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

    // Get the sockball type from the queue
    const sockballType = this.game.getNextSockballFromQueue();
    if (!sockballType) {
      console.warn("No sockball type available from queue, using random");
      sockballType = Math.floor(Math.random() * 6) + 1;
    }

    this.sockballsThrown++;
    this.availableSockballs--;
    this.lastThrowTime = Date.now();

    // Calculate throw velocity
    const deltaX = targetX - this.launchPosition.x;
    const deltaY = targetY - this.launchPosition.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const normalizedVelocity = GameConfig.SOCKBALL_THROW_SPEED / distance;

    // Create sockball projectile with the tracked type
    const sockball = {
      x: this.launchPosition.x,
      y: this.launchPosition.y,
      vx: deltaX * normalizedVelocity,
      vy: deltaY * normalizedVelocity,
      size: GameConfig.SOCKBALL_SIZE,
      type: sockballType, // Use the tracked type instead of random
      rotation: 0,
      rotationSpeed: 0.2,
      gravity: GameConfig.GRAVITY,
      bounced: false,
      active: true,
    };

    this.sockballProjectiles.push(sockball);
    this.showTrajectory = false;

    // Update next sockball type for preview
    this.updateNextSockballType();
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
    const deltaScale = deltaTime / 16.67;

    this.sockballProjectiles = this.sockballProjectiles.filter((sockball) => {
      if (!sockball.active) return false;

      // Update position
      sockball.x += sockball.vx * deltaScale;
      sockball.y += sockball.vy * deltaScale;
      sockball.vy += sockball.gravity * deltaScale;
      sockball.rotation += sockball.rotationSpeed * deltaScale;

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
      if (!this.waitingForMartha) {
        this.waitingForMartha = true;
        this.marthaManager.startExit();
        this.showMessage("Martha got her rent money!", "success", 2000);
      }

      if (!this.marthaManager.onScreen) {
        this.levelComplete = true;
        this.gamePhase = "complete";
        setTimeout(() => this.game.completeLevel(), 1000);
      }
    } else if (!hasActiveSockballs && !hasAvailableSockballs) {
      if (!this.waitingForMartha) {
        this.waitingForMartha = true;
        this.marthaManager.startExit();
        this.showMessage(
          "Martha didn't get enough rent money...",
          "warning",
          2000
        );
      }

      if (!this.marthaManager.onScreen) {
        this.levelComplete = true;
        this.gamePhase = "complete";
        setTimeout(() => this.game.completeLevel(), 1000);
      }
    } else if (
      !this.marthaManager.onScreen &&
      this.marthaManager.needsMoreSockballs() &&
      (hasActiveSockballs || hasAvailableSockballs)
    ) {
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
    this.marthaManager.update(deltaTime);
    this.updateSockballs(deltaTime);
    this.checkGameEnd();

    if (this.showingMessage) {
      this.messageTimer -= deltaTime;
      if (this.messageTimer <= 0) {
        this.showingMessage = false;
      }
    }
  }

  onRender(ctx) {
    // Render background first
    this.renderBackground(ctx);

    this.marthaManager.render(ctx);

    this.sockballProjectiles.forEach((sockball) => {
      this.renderSockball(ctx, sockball);
    });

    if (this.showTrajectory && this.trajectoryPoints.length > 0) {
      this.renderTrajectory(ctx);
    }

    this.renderLaunchIndicator(ctx);
    this.renderUI(ctx);

    if (this.showingMessage) {
      this.renderMessage(ctx);
    }
  }

  renderBackground(ctx) {
    if (this.backgroundImage) {
      // Scale background to fill canvas while maintaining aspect ratio
      const canvasAspect =
        this.game.getCanvasWidth() / this.game.getCanvasHeight();
      const imageAspect =
        this.backgroundImage.width / this.backgroundImage.height;

      let drawWidth, drawHeight, drawX, drawY;

      if (canvasAspect > imageAspect) {
        // Canvas is wider than image
        drawWidth = this.game.getCanvasWidth();
        drawHeight = drawWidth / imageAspect;
        drawX = 0;
        drawY = (this.game.getCanvasHeight() - drawHeight) / 2;
      } else {
        // Canvas is taller than image
        drawHeight = this.game.getCanvasHeight();
        drawWidth = drawHeight * imageAspect;
        drawX = (this.game.getCanvasWidth() - drawWidth) / 2;
        drawY = 0;
      }

      ctx.drawImage(this.backgroundImage, drawX, drawY, drawWidth, drawHeight);
    } else {
      // Fallback gradient background
      const gradient = ctx.createLinearGradient(
        0,
        0,
        0,
        this.game.getCanvasHeight()
      );
      gradient.addColorStop(0, "#1a1a2e");
      gradient.addColorStop(1, "#16213e");
      ctx.fillStyle = gradient;
      ctx.fillRect(
        0,
        0,
        this.game.getCanvasWidth(),
        this.game.getCanvasHeight()
      );
    }
  }

  renderSockball(ctx, sockball) {
    ctx.save();
    ctx.translate(sockball.x, sockball.y);
    ctx.rotate(sockball.rotation);

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
    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
    ctx.lineWidth = this.game.getScaledValue(3);
    ctx.setLineDash([this.game.getScaledValue(8), this.game.getScaledValue(4)]);

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
    const radius = this.game.getScaledValue(20) * pulseScale;

    // Outer glow
    ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
    ctx.beginPath();
    ctx.arc(
      this.launchPosition.x,
      this.launchPosition.y,
      radius * 1.5,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Inner circle
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    ctx.lineWidth = this.game.getScaledValue(3);

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

    // Render the next sockball type in the launch indicator
    if (this.nextSockballType) {
      const sockballImage =
        this.game.images[`sockball${this.nextSockballType}.png`];
      if (sockballImage) {
        const sockballSize = this.game.getScaledValue(16) * pulseScale;
        ctx.drawImage(
          sockballImage,
          this.launchPosition.x - sockballSize / 2,
          this.launchPosition.y - sockballSize / 2,
          sockballSize,
          sockballSize
        );
      } else {
        // Fallback colored circle
        ctx.fillStyle = `hsl(${this.nextSockballType * 60}, 70%, 50%)`;
        ctx.beginPath();
        ctx.arc(
          this.launchPosition.x,
          this.launchPosition.y,
          radius * 0.4,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    }

    ctx.restore();
  }

  renderUI(ctx) {
    const counterX = this.layoutCache.sockballCounterPos.x;
    const counterY = this.layoutCache.sockballCounterPos.y;
    const panelWidth = this.game.getScaledValue(150);
    const panelHeight = this.game.getScaledValue(60);

    // Sockball counter panel
    this.renderPanel(
      ctx,
      counterX,
      counterY,
      panelWidth,
      panelHeight,
      "primary"
    );

    this.renderText(
      ctx,
      "Sockballs:",
      counterX + panelWidth / 2,
      counterY + this.game.getScaledValue(20),
      { fontSize: this.layoutCache.bodyFontSize, align: "center" }
    );

    this.renderText(
      ctx,
      this.availableSockballs.toString(),
      counterX + panelWidth / 2,
      counterY + this.game.getScaledValue(40),
      {
        fontSize: this.layoutCache.headerFontSize,
        color: "#ffd700",
        align: "center",
      }
    );

    // Martha status panel
    const statusX = this.layoutCache.marthaStatusPos.x;
    const statusY = this.layoutCache.marthaStatusPos.y;
    const statusWidth = this.game.getScaledValue(180);
    const statusHeight = this.game.getScaledValue(60);

    this.renderPanel(
      ctx,
      statusX,
      statusY,
      statusWidth,
      statusHeight,
      "secondary"
    );

    this.renderText(
      ctx,
      "Martha wants:",
      statusX + statusWidth / 2,
      statusY + this.game.getScaledValue(20),
      { fontSize: this.layoutCache.bodyFontSize, align: "center" }
    );

    this.renderText(
      ctx,
      `${this.marthaManager.collectedSockballs}/${this.marthaManager.sockballsWanted}`,
      statusX + statusWidth / 2,
      statusY + this.game.getScaledValue(40),
      {
        fontSize: this.layoutCache.headerFontSize,
        color: "#4caf50",
        align: "center",
      }
    );

    // Throw cooldown
    const cooldownX = this.layoutCache.cooldownBarPos.x;
    const cooldownY = this.layoutCache.cooldownBarPos.y;
    const cooldownWidth = this.game.getScaledValue(250);
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
      cooldownProgress >= 1 ? "READY TO THROW" : "RECHARGING...",
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
    const panelWidth = (textWidth + this.game.getScaledValue(60)) * 2.5; // Increased by 2.5x
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
