class MarthaScene extends Screen {
  constructor(game) {
    super(game);
    this.throwPhysics = new ThrowPhysics(game);
    this.marthaManager = new MarthaManager(game);
    this.thrownSocks = [];
    this.gameEndTimer = null;
    this.gameEndDelay = 60; // 1 second at 60 FPS

    // UI animation timers
    this.crosshairPulseTimer = 0;
    this.messageFlashTimer = 0;
  }

  createLayoutCache() {
    const baseLayout = super.createLayoutCache();
    const canvasWidth = this.game.getCanvasWidth();
    const canvasHeight = this.game.getCanvasHeight();

    return {
      ...baseLayout,

      // Crosshair configuration
      crosshairSize: this.game.getScaledValue(12),
      crosshairLineWidth: this.game.getScaledValue(3),
      crosshairDotSize: this.game.getScaledValue(2),

      // UI panel positioning
      pointsPanelX: this.game.getScaledValue(10),
      pointsPanelY: this.game.getScaledValue(10),
      pointsPanelWidth: this.game.getScaledValue(150),
      pointsPanelHeight: this.game.getScaledValue(50),

      sockBallsPanelWidth: this.game.getScaledValue(150),
      sockBallsPanelHeight: this.game.getScaledValue(50),
      sockBallsPanelX:
        canvasWidth -
        this.game.getScaledValue(150) -
        this.game.getScaledValue(10),
      sockBallsPanelY: this.game.getScaledValue(10),

      // Dialogue panel positioning
      dialoguePanelWidth: this.game.getScaledValue(400),
      dialoguePanelHeight: this.game.getScaledValue(80),
      dialoguePanelX: canvasWidth / 2,
      dialoguePanelY: this.game.getScaledValue(70),

      // Progress bar configuration
      progressBarWidth: this.game.getScaledValue(200),
      progressBarHeight: this.game.getScaledValue(10),

      // Message positioning
      timerMessageY: canvasHeight - this.game.getScaledValue(80),
      awayMessageY: canvasHeight / 2 + this.game.getScaledValue(100),

      // Trajectory configuration
      trajectoryStartY: canvasHeight - this.game.getScaledValue(30),
      trajectoryDashLength: this.game.getScaledValue(8),
      trajectoryLineWidth: this.game.getScaledValue(3),
      targetIndicatorSize: this.game.getScaledValue(8),
    };
  }

  setup() {
    super.setup();
    this.game.gameState = "shooting";
    this.game.canvas.className = "shooting-phase";

    // Setup Martha for current level
    this.marthaManager.setup(this.game.currentLevel);

    // Clear any existing thrown socks
    this.thrownSocks = [];

    // Reset game end timer
    this.gameEndTimer = null;

    // Reset specific animation timers
    this.crosshairPulseTimer = 0;
    this.messageFlashTimer = 0;
  }

  // Clean up when leaving Martha scene
  cleanup() {
    super.cleanup();

    // Remove CSS class that affects canvas styling
    this.game.canvas.className = "";

    // Reset canvas context to default state
    this.game.ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform matrix
    this.game.ctx.globalAlpha = 1;
    this.game.ctx.filter = "none";
    this.game.ctx.shadowColor = "transparent";
    this.game.ctx.shadowBlur = 0;
    this.game.ctx.shadowOffsetX = 0;
    this.game.ctx.shadowOffsetY = 0;
    this.game.ctx.lineDashOffset = 0;
    this.game.ctx.setLineDash([]);

    // Reset crosshair to center
    this.game.crosshair.x = this.game.getCanvasWidth() / 2;
    this.game.crosshair.y = this.game.getCanvasHeight() / 2;

    // Clear thrown socks
    this.thrownSocks = [];
  }

  onResize() {
    // Reset crosshair position to center
    this.game.crosshair.x = this.game.getCanvasWidth() / 2;
    this.game.crosshair.y = this.game.getCanvasHeight() / 2;
  }

  fireSock(cursorX, cursorY) {
    // Block firing if Martha is away or no sock balls remaining
    if (this.marthaManager.isMarthaAway() || this.game.sockBalls <= 0) {
      return;
    }

    // Fire from bottom of screen - use centralized scaling
    const startX = cursorX;
    const startY = this.layoutCache.trajectoryStartY;
    const targetX = cursorX;
    const targetY = cursorY;

    // Create sock with physics
    const sock = this.throwPhysics.createThrownSock(
      startX,
      startY,
      targetX,
      targetY
    );

    this.thrownSocks.push(sock);
    this.game.sockBalls--;
  }

  onUpdate(deltaTime) {
    // Update specific animation timers
    const timeMultiplier = deltaTime / 16.67; // Normalize to 60fps
    this.crosshairPulseTimer += timeMultiplier * 0.1;
    this.messageFlashTimer += timeMultiplier;

    // Update Martha
    this.marthaManager.update(deltaTime);

    // Update thrown socks
    this.thrownSocks.forEach((sock, index) => {
      this.throwPhysics.updateSock(sock);

      // Check collision with Martha
      if (this.marthaManager.checkSockCollision(sock)) {
        this.thrownSocks.splice(index, 1);
        const isLevelComplete = this.marthaManager.consumeSock();

        if (isLevelComplete) {
          this.endLevel();
        }
      }

      // Remove socks that go off screen
      if (this.throwPhysics.isSockOffScreen(sock)) {
        this.thrownSocks.splice(index, 1);
      }
    });

    // Check if we should start the game end timer
    if (
      this.game.sockBalls === 0 &&
      this.thrownSocks.length === 0 &&
      !this.marthaManager.isSatisfied()
    ) {
      if (this.gameEndTimer === null) {
        this.gameEndTimer = this.gameEndDelay;
      } else {
        this.gameEndTimer -= timeMultiplier;
        if (this.gameEndTimer <= 0) {
          this.endLevel();
        }
      }
    } else {
      if (this.gameEndTimer !== null) {
        this.gameEndTimer = null;
      }
    }
  }

  endLevel() {
    // Clean up before transitioning
    this.cleanup();

    // Calculate score based on extra sock balls
    const extraSockBalls = this.game.sockBalls;
    const extraPoints = extraSockBalls * 10;
    this.game.playerPoints += extraPoints;

    this.game.saveGameData();
    this.game.gameState = "gameOver";
  }

  onRender(ctx) {
    // Clear canvas
    ctx.clearRect(
      0,
      0,
      this.game.getCanvasWidth(),
      this.game.getCanvasHeight()
    );

    // Draw Martha and background elements
    this.marthaManager.render(ctx);

    // Draw enhanced Martha dialogue
    this.renderEnhancedDialogue(ctx);

    // Draw trajectory preview line (only if Martha is not away)
    if (!this.marthaManager.isMarthaAway()) {
      this.renderEnhancedTrajectoryPreview(ctx);
    }

    // Draw thrown socks
    this.thrownSocks.forEach((sock) => {
      this.throwPhysics.renderSock(ctx, sock);
    });

    // Draw UI elements
    this.renderEnhancedCrosshair(ctx);
    this.renderEnhancedPoints(ctx);
    this.renderEnhancedSockBalls(ctx);

    // Draw game state messages
    if (this.gameEndTimer !== null) {
      this.renderEnhancedGameEndTimer(ctx);
    }

    if (this.marthaManager.isMarthaAway()) {
      this.renderEnhancedMarthaAwayMessage(ctx);
    }
  }

  renderEnhancedCrosshair(ctx) {
    // Only show crosshair if Martha is not away
    if (this.marthaManager.isMarthaAway()) return;

    const layout = this.layoutCache;
    const x = this.game.crosshair.x;
    const y = this.game.crosshair.y;

    // Pulsing animation
    const pulseScale = 1 + Math.sin(this.crosshairPulseTimer) * 0.1;
    const canFire = this.game.sockBalls > 0;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(pulseScale, pulseScale);

    // Crosshair color based on state
    const crosshairColor = canFire ? "#ff4444" : "#666666";
    const glowColor = canFire
      ? "rgba(255, 68, 68, 0.5)"
      : "rgba(102, 102, 102, 0.3)";

    // Add glow effect
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = this.game.getScaledValue(10);

    // Draw crosshair
    ctx.strokeStyle = crosshairColor;
    ctx.lineWidth = layout.crosshairLineWidth;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(-layout.crosshairSize, 0);
    ctx.lineTo(layout.crosshairSize, 0);
    ctx.moveTo(0, -layout.crosshairSize);
    ctx.lineTo(0, layout.crosshairSize);
    ctx.stroke();

    // Draw center dot
    ctx.fillStyle = crosshairColor;
    ctx.beginPath();
    ctx.arc(0, 0, layout.crosshairDotSize, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  renderEnhancedTrajectoryPreview(ctx) {
    const layout = this.layoutCache;
    const startX = this.game.crosshair.x;
    const startY = layout.trajectoryStartY;
    const targetX = this.game.crosshair.x;
    const targetY = this.game.crosshair.y;

    // Calculate trajectory points
    const points = this.throwPhysics.calculateTrajectoryPoints(
      startX,
      startY,
      targetX,
      targetY,
      15
    );

    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
    ctx.lineWidth = layout.trajectoryLineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Add glow effect
    ctx.shadowColor = "rgba(255, 255, 255, 0.3)";
    ctx.shadowBlur = this.game.getScaledValue(5);

    // Draw dashed line with animation
    const dashOffset = (this.uiAnimationTimer * 0.5) % 16;
    ctx.setLineDash([layout.trajectoryDashLength, layout.trajectoryDashLength]);
    ctx.lineDashOffset = dashOffset;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
      if (points[i].y < this.game.getCanvasHeight() + 100) {
        ctx.lineTo(points[i].x, points[i].y);
      }
    }

    ctx.stroke();

    // Target indicator
    const targetPulse = 1 + Math.sin(this.uiAnimationTimer * 0.15) * 0.3;
    ctx.fillStyle = "rgba(255, 255, 0, 0.9)";
    ctx.shadowColor = "rgba(255, 255, 0, 0.6)";
    ctx.shadowBlur = this.game.getScaledValue(15);

    ctx.beginPath();
    ctx.arc(
      targetX,
      targetY,
      layout.targetIndicatorSize * targetPulse,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Start point indicator
    ctx.fillStyle = "rgba(0, 255, 0, 0.9)";
    ctx.shadowColor = "rgba(0, 255, 0, 0.6)";
    ctx.shadowBlur = this.game.getScaledValue(10);

    ctx.beginPath();
    ctx.arc(startX, startY, layout.targetIndicatorSize * 0.75, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  renderEnhancedPoints(ctx) {
    const layout = this.layoutCache;

    // Panel background
    this.renderPanel(
      ctx,
      layout.pointsPanelX,
      layout.pointsPanelY,
      layout.pointsPanelWidth,
      layout.pointsPanelHeight
    );

    // Points text
    this.renderText(
      ctx,
      "Points",
      layout.pointsPanelX + layout.padding,
      layout.pointsPanelY + layout.pointsPanelHeight * 0.35,
      {
        fontSize: layout.bodyFontSize,
        align: "left",
        baseline: "middle",
        color: "#ffd700",
        weight: "bold",
      }
    );

    this.renderText(
      ctx,
      `${this.game.playerPoints}`,
      layout.pointsPanelX + layout.padding,
      layout.pointsPanelY + layout.pointsPanelHeight * 0.7,
      {
        fontSize: layout.bodyFontSize * 0.9,
        align: "left",
        baseline: "middle",
        color: "#ffffff",
        weight: "bold",
      }
    );
  }

  renderEnhancedSockBalls(ctx) {
    const layout = this.layoutCache;

    // Panel background
    this.renderPanel(
      ctx,
      layout.sockBallsPanelX,
      layout.sockBallsPanelY,
      layout.sockBallsPanelWidth,
      layout.sockBallsPanelHeight
    );

    // Sock balls text
    this.renderText(
      ctx,
      "Sock Balls",
      layout.sockBallsPanelX + layout.padding,
      layout.sockBallsPanelY + layout.sockBallsPanelHeight * 0.35,
      {
        fontSize: layout.bodyFontSize,
        align: "left",
        baseline: "middle",
        color: "#87ceeb",
        weight: "bold",
      }
    );

    this.renderText(
      ctx,
      `${this.game.sockBalls}`,
      layout.sockBallsPanelX + layout.padding,
      layout.sockBallsPanelY + layout.sockBallsPanelHeight * 0.7,
      {
        fontSize: layout.bodyFontSize * 0.9,
        align: "left",
        baseline: "middle",
        color: "#ffffff",
        weight: "bold",
      }
    );

    // Visual sock ball indicators
    const ballSize = this.game.getScaledValue(6);
    const ballSpacing = this.game.getScaledValue(10);
    const maxBalls = Math.min(this.game.sockBalls, 8);

    for (let i = 0; i < maxBalls; i++) {
      const ballX =
        layout.sockBallsPanelX +
        layout.sockBallsPanelWidth * 0.65 +
        i * ballSpacing;
      const ballY = layout.sockBallsPanelY + layout.sockBallsPanelHeight * 0.5;

      // Glowing effect
      const glowIntensity = this.getGlowIntensity(0.5, 0.8);
      ctx.shadowColor = `rgba(135, 206, 235, ${glowIntensity})`;
      ctx.shadowBlur = this.game.getScaledValue(8);

      ctx.fillStyle = "#87ceeb";
      ctx.beginPath();
      ctx.arc(ballX, ballY, ballSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  renderEnhancedDialogue(ctx) {
    const layout = this.layoutCache;
    const progress = this.marthaManager.getProgress();

    ctx.save();
    ctx.translate(layout.dialoguePanelX, layout.dialoguePanelY);

    // Panel background
    this.renderPanel(
      ctx,
      -layout.dialoguePanelWidth / 2,
      -layout.dialoguePanelHeight / 2,
      layout.dialoguePanelWidth,
      layout.dialoguePanelHeight,
      "secondary"
    );

    // Dynamic dialogue text
    let dialogueText = `RENT IS DUE: ${this.marthaManager.targetSocks} SOCKBALLS!`;
    if (progress.percentage > 0.5) {
      dialogueText = `GETTING FULL... ${progress.consumed}/${progress.target} SOCKS!`;
    }
    if (progress.percentage > 0.8) {
      dialogueText = `ALMOST SATISFIED! ${progress.consumed}/${progress.target}!`;
    }

    // Dialogue text with pulse effect
    const textScale = this.getPulseScale(0.02);
    ctx.scale(textScale, textScale);

    this.renderText(ctx, dialogueText, 0, -layout.dialoguePanelHeight * 0.15, {
      fontSize: layout.bodyFontSize,
      weight: "bold",
      color: "white",
    });

    ctx.restore();

    // Progress bar
    const barX = layout.dialoguePanelX - layout.progressBarWidth / 2;
    const barY = layout.dialoguePanelY + layout.dialoguePanelHeight * 0.25;

    this.renderProgressBar(
      ctx,
      barX,
      barY,
      layout.progressBarWidth,
      layout.progressBarHeight,
      progress.percentage,
      { glow: true }
    );
  }

  renderEnhancedGameEndTimer(ctx) {
    const layout = this.layoutCache;
    const secondsRemaining = Math.ceil(this.gameEndTimer / 60);

    // Timer panel
    const panelWidth = this.game.getScaledValue(300);
    const panelHeight = this.game.getScaledValue(60);
    const panelX = layout.centerX - panelWidth / 2;
    const panelY = layout.timerMessageY;

    const style = secondsRemaining <= 5 ? "warning" : "primary";
    this.renderPanel(ctx, panelX, panelY, panelWidth, panelHeight, style);

    // Timer text with scale effect
    const textScale = secondsRemaining <= 3 ? this.getPulseScale(0.1) : 1;

    ctx.save();
    ctx.translate(layout.centerX, panelY + panelHeight / 2);
    ctx.scale(textScale, textScale);

    this.renderText(ctx, `Level ending in ${secondsRemaining}...`, 0, 0, {
      fontSize: layout.headerFontSize,
      weight: "bold",
      color: "white",
    });

    ctx.restore();
  }

  renderEnhancedMarthaAwayMessage(ctx) {
    const layout = this.layoutCache;

    // Martha away message panel
    const panelWidth = this.game.getScaledValue(400);
    const panelHeight = this.game.getScaledValue(80);
    const panelX = layout.centerX - panelWidth / 2;
    const panelY = layout.awayMessageY;

    this.renderPanel(ctx, panelX, panelY, panelWidth, panelHeight, "warning");

    // Message text with pulse effect
    const textScale = this.getPulseScale(0.05);

    ctx.save();
    ctx.translate(layout.centerX, panelY + panelHeight / 2);
    ctx.scale(textScale, textScale);

    this.renderText(ctx, "Martha is away!", 0, -panelHeight * 0.15, {
      fontSize: layout.bodyFontSize,
      weight: "bold",
      color: "white",
    });

    this.renderText(ctx, "Wait for her to return...", 0, panelHeight * 0.2, {
      fontSize: layout.bodyFontSize * 0.85,
      color: "white",
    });

    ctx.restore();
  }
}
