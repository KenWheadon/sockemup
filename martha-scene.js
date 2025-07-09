class MarthaScene {
  constructor(game) {
    this.game = game;
    this.throwPhysics = new ThrowPhysics(game);
    this.marthaManager = new MarthaManager(game);
    this.thrownSocks = [];
    this.gameEndTimer = null;
    this.gameEndDelay = 60; // 1 second at 60 FPS

    // UI animation timers
    this.uiAnimationTimer = 0;
    this.crosshairPulseTimer = 0;
    this.messageFlashTimer = 0;
  }

  // Handle resize events from the main game
  handleResize() {
    // Reset crosshair position to center
    this.game.crosshair.x = this.game.getCanvasWidth() / 2;
    this.game.crosshair.y = this.game.getCanvasHeight() / 2;
  }

  setup() {
    this.game.gameState = "shooting";
    this.game.canvas.className = "shooting-phase";

    // Setup Martha for current level
    this.marthaManager.setup(this.game.currentLevel);

    // Clear any existing thrown socks
    this.thrownSocks = [];

    // Reset game end timer
    this.gameEndTimer = null;

    // Reset UI animation timers
    this.uiAnimationTimer = 0;
    this.crosshairPulseTimer = 0;
    this.messageFlashTimer = 0;
  }

  fireSock(cursorX, cursorY) {
    // Block firing if Martha is away or no sock balls remaining
    if (this.marthaManager.isMarthaAway() || this.game.sockBalls <= 0) {
      return;
    }

    // Fire from bottom of screen - use centralized scaling
    const startX = cursorX;
    const startY = this.game.getCanvasHeight() - this.game.getScaledValue(30);
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

  update(deltaTime) {
    // Update animation timers with frame-rate independent timing
    const timeMultiplier = deltaTime / 16.67; // Normalize to 60fps
    this.uiAnimationTimer += timeMultiplier;
    this.crosshairPulseTimer += timeMultiplier;
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
    // Calculate score based on extra sock balls
    const extraSockBalls = this.game.sockBalls;
    const extraPoints = extraSockBalls * 10;
    this.game.playerPoints += extraPoints;

    this.game.saveGameData();
    this.game.gameState = "gameOver";
  }

  render(ctx) {
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

    const x = this.game.crosshair.x;
    const y = this.game.crosshair.y;

    // Use centralized scaling for crosshair size
    const crosshairSize = this.game.getScaledValue(12);
    const lineWidth = this.game.getScaledValue(3);
    const dotSize = this.game.getScaledValue(2);

    // Pulsing animation
    const pulseScale = 1 + Math.sin(this.crosshairPulseTimer * 0.1) * 0.1;
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
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(-crosshairSize, 0);
    ctx.lineTo(crosshairSize, 0);
    ctx.moveTo(0, -crosshairSize);
    ctx.lineTo(0, crosshairSize);
    ctx.stroke();

    // Draw center dot
    ctx.fillStyle = crosshairColor;
    ctx.beginPath();
    ctx.arc(0, 0, dotSize, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  renderEnhancedTrajectoryPreview(ctx) {
    // Fixed trajectory line positioning using centralized scaling
    const startX = this.game.crosshair.x;
    const startY = this.game.getCanvasHeight() - this.game.getScaledValue(30);
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
    ctx.lineWidth = this.game.getScaledValue(3);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Add glow effect
    ctx.shadowColor = "rgba(255, 255, 255, 0.3)";
    ctx.shadowBlur = this.game.getScaledValue(5);

    // Draw dashed line with animation
    const dashLength = this.game.getScaledValue(8);
    const dashOffset = (this.uiAnimationTimer * 0.5) % 16;
    ctx.setLineDash([dashLength, dashLength]);
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
    const targetSize = this.game.getScaledValue(8);
    const targetPulse = 1 + Math.sin(this.uiAnimationTimer * 0.15) * 0.3;
    ctx.fillStyle = "rgba(255, 255, 0, 0.9)";
    ctx.shadowColor = "rgba(255, 255, 0, 0.6)";
    ctx.shadowBlur = this.game.getScaledValue(15);

    ctx.beginPath();
    ctx.arc(targetX, targetY, targetSize * targetPulse, 0, Math.PI * 2);
    ctx.fill();

    // Start point indicator
    ctx.fillStyle = "rgba(0, 255, 0, 0.9)";
    ctx.shadowColor = "rgba(0, 255, 0, 0.6)";
    ctx.shadowBlur = this.game.getScaledValue(10);

    ctx.beginPath();
    ctx.arc(startX, startY, targetSize * 0.75, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  renderEnhancedPoints(ctx) {
    // Points panel positioning using centralized scaling
    const panelX = this.game.getScaledValue(10);
    const panelY = this.game.getScaledValue(10);
    const panelWidth = this.game.getScaledValue(150);
    const panelHeight = this.game.getScaledValue(50);
    const padding = this.game.getScaledValue(10);
    const fontSize = this.game.getScaledValue(18);

    ctx.save();

    // Panel background with gradient
    const gradient = ctx.createLinearGradient(
      panelX,
      panelY,
      panelX + panelWidth,
      panelY + panelHeight
    );
    gradient.addColorStop(0, "rgba(0, 0, 0, 0.8)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0.6)");

    ctx.fillStyle = gradient;
    ctx.fillRect(panelX, panelY, panelWidth, panelHeight);

    // Panel border
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = this.game.getScaledValue(2);
    ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

    // Points text
    ctx.fillStyle = "#ffd700";
    ctx.font = `bold ${fontSize}px Courier New`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("Points", panelX + padding, panelY + panelHeight * 0.35);

    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${fontSize * 0.9}px Courier New`;
    ctx.fillText(
      `${this.game.playerPoints}`,
      panelX + padding,
      panelY + panelHeight * 0.7
    );

    ctx.restore();
  }

  renderEnhancedSockBalls(ctx) {
    // Sock balls panel positioning using centralized scaling
    const panelWidth = this.game.getScaledValue(150);
    const panelHeight = this.game.getScaledValue(50);
    const panelX =
      this.game.getCanvasWidth() - panelWidth - this.game.getScaledValue(10);
    const panelY = this.game.getScaledValue(10);
    const padding = this.game.getScaledValue(10);
    const fontSize = this.game.getScaledValue(18);

    ctx.save();

    // Panel background with gradient
    const gradient = ctx.createLinearGradient(
      panelX,
      panelY,
      panelX + panelWidth,
      panelY + panelHeight
    );
    gradient.addColorStop(0, "rgba(0, 0, 0, 0.6)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0.8)");

    ctx.fillStyle = gradient;
    ctx.fillRect(panelX, panelY, panelWidth, panelHeight);

    // Panel border
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = this.game.getScaledValue(2);
    ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

    // Sock balls text
    ctx.fillStyle = "#87ceeb";
    ctx.font = `bold ${fontSize}px Courier New`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("Sock Balls", panelX + padding, panelY + panelHeight * 0.35);

    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${fontSize * 0.9}px Courier New`;
    ctx.fillText(
      `${this.game.sockBalls}`,
      panelX + padding,
      panelY + panelHeight * 0.7
    );

    // Visual sock ball indicators
    const ballSize = this.game.getScaledValue(6);
    const ballSpacing = this.game.getScaledValue(10);
    const maxBalls = Math.min(this.game.sockBalls, 8);

    for (let i = 0; i < maxBalls; i++) {
      const ballX = panelX + panelWidth * 0.65 + i * ballSpacing;
      const ballY = panelY + panelHeight * 0.5;

      // Glowing effect
      const glowIntensity =
        0.5 + Math.sin(this.uiAnimationTimer * 0.1 + i * 0.5) * 0.3;
      ctx.shadowColor = `rgba(135, 206, 235, ${glowIntensity})`;
      ctx.shadowBlur = this.game.getScaledValue(8);

      ctx.fillStyle = "#87ceeb";
      ctx.beginPath();
      ctx.arc(ballX, ballY, ballSize, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  renderEnhancedDialogue(ctx) {
    const progress = this.marthaManager.getProgress();

    // Dialogue panel positioning using centralized scaling
    const panelWidth = this.game.getScaledValue(400);
    const panelHeight = this.game.getScaledValue(80);
    const panelX = this.game.getCanvasWidth() / 2;
    const panelY = this.game.getScaledValue(70);
    const fontSize = this.game.getScaledValue(16);

    ctx.save();
    ctx.translate(panelX, panelY);

    // Panel background with gradient
    const gradient = ctx.createLinearGradient(
      -panelWidth / 2,
      -panelHeight / 2,
      panelWidth / 2,
      panelHeight / 2
    );
    gradient.addColorStop(0, "rgba(75, 0, 130, 0.9)");
    gradient.addColorStop(1, "rgba(138, 43, 226, 0.8)");

    ctx.fillStyle = gradient;
    ctx.fillRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight);

    // Panel border
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = this.game.getScaledValue(3);
    ctx.strokeRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight);

    // Dynamic dialogue text
    let dialogueText = `RENT IS DUE: ${this.marthaManager.targetSocks} SOCKBALLS!`;
    if (progress.percentage > 0.5) {
      dialogueText = `GETTING FULL... ${progress.consumed}/${progress.target} SOCKS!`;
    }
    if (progress.percentage > 0.8) {
      dialogueText = `ALMOST SATISFIED! ${progress.consumed}/${progress.target}!`;
    }

    // Dialogue text with pulse effect
    const textScale = 1 + Math.sin(this.uiAnimationTimer * 0.08) * 0.02;
    ctx.scale(textScale, textScale);

    ctx.fillStyle = "white";
    ctx.font = `bold ${fontSize}px Courier New`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(dialogueText, 0, -panelHeight * 0.15);

    ctx.restore();

    // Progress bar using centralized scaling
    const barWidth = this.game.getScaledValue(200);
    const barHeight = this.game.getScaledValue(10);
    const barX = panelX - barWidth / 2;
    const barY = panelY + panelHeight * 0.25;

    ctx.save();

    // Progress bar background
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Progress bar border
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = this.game.getScaledValue(1);
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    // Progress bar fill
    const fillWidth = barWidth * progress.percentage;
    let fillColor = "#4caf50";
    if (progress.percentage > 0.7) fillColor = "#ffc107";
    if (progress.percentage >= 1) fillColor = "#ff5722";

    ctx.fillStyle = fillColor;
    ctx.fillRect(barX, barY, fillWidth, barHeight);

    // Progress bar glow
    ctx.shadowColor = fillColor;
    ctx.shadowBlur = this.game.getScaledValue(5);
    ctx.fillRect(barX, barY, fillWidth, barHeight);

    ctx.restore();
  }

  renderEnhancedGameEndTimer(ctx) {
    const secondsRemaining = Math.ceil(this.gameEndTimer / 60);

    // Timer panel positioning using centralized scaling
    const panelWidth = this.game.getScaledValue(300);
    const panelHeight = this.game.getScaledValue(60);
    const panelX = this.game.getCanvasWidth() / 2;
    const panelY = this.game.getCanvasHeight() - this.game.getScaledValue(80);
    const fontSize = this.game.getScaledValue(22);

    ctx.save();
    ctx.translate(panelX, panelY);

    // Panel background with gradient
    const gradient = ctx.createLinearGradient(
      -panelWidth / 2,
      -panelHeight / 2,
      panelWidth / 2,
      panelHeight / 2
    );
    gradient.addColorStop(0, "rgba(255, 215, 0, 0.9)");
    gradient.addColorStop(1, "rgba(255, 140, 0, 0.8)");

    // Warning animation
    if (secondsRemaining <= 5) {
      const warningIntensity = Math.sin(this.messageFlashTimer * 0.3);
      gradient.addColorStop(
        0,
        `rgba(255, 69, 0, ${0.9 + warningIntensity * 0.1})`
      );
      gradient.addColorStop(
        1,
        `rgba(255, 0, 0, ${0.8 + warningIntensity * 0.1})`
      );
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight);

    // Panel border
    ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
    ctx.lineWidth = this.game.getScaledValue(3);
    ctx.strokeRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight);

    // Timer text with scale effect
    const textScale =
      secondsRemaining <= 3
        ? 1 + Math.sin(this.messageFlashTimer * 0.4) * 0.1
        : 1;
    ctx.scale(textScale, textScale);

    ctx.fillStyle = "white";
    ctx.font = `bold ${fontSize}px Courier New`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`Level ending in ${secondsRemaining}...`, 0, 0);

    ctx.restore();
  }

  renderEnhancedMarthaAwayMessage(ctx) {
    // Martha away message positioning using centralized scaling
    const panelWidth = this.game.getScaledValue(400);
    const panelHeight = this.game.getScaledValue(80);
    const panelX = this.game.getCanvasWidth() / 2;
    const panelY =
      this.game.getCanvasHeight() / 2 + this.game.getScaledValue(100);
    const fontSize = this.game.getScaledValue(18);

    ctx.save();
    ctx.translate(panelX, panelY);

    // Panel background with gradient
    const gradient = ctx.createLinearGradient(
      -panelWidth / 2,
      -panelHeight / 2,
      panelWidth / 2,
      panelHeight / 2
    );
    gradient.addColorStop(0, "rgba(255, 140, 0, 0.9)");
    gradient.addColorStop(1, "rgba(255, 165, 0, 0.8)");

    ctx.fillStyle = gradient;
    ctx.fillRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight);

    // Panel border
    ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
    ctx.lineWidth = this.game.getScaledValue(3);
    ctx.strokeRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight);

    // Message text with pulse effect
    const textScale = 1 + Math.sin(this.messageFlashTimer * 0.1) * 0.05;
    ctx.scale(textScale, textScale);

    ctx.fillStyle = "white";
    ctx.font = `bold ${fontSize}px Courier New`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Martha is away!", 0, -panelHeight * 0.15);

    ctx.font = `${fontSize * 0.85}px Courier New`;
    ctx.fillText("Wait for her to return...", 0, panelHeight * 0.2);

    ctx.restore();
  }
}
