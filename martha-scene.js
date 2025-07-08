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

  // Get responsive dimensions
  getCanvasWidth() {
    return this.game.canvas.width;
  }

  getCanvasHeight() {
    return this.game.canvas.height;
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

    console.log("Martha scene setup complete:", {
      currentLevel: this.game.currentLevel,
      sockBalls: this.game.sockBalls,
      targetSocks: this.marthaManager.targetSocks,
      canvasSize: {
        width: this.getCanvasWidth(),
        height: this.getCanvasHeight(),
      },
    });
  }

  fireSock(cursorX, cursorY) {
    console.log("=== FIRING SOCK ===");
    console.log("Cursor position:", { x: cursorX, y: cursorY });
    console.log("Sock balls remaining:", this.game.sockBalls);
    console.log("Martha away status:", this.marthaManager.isAway);

    // Block firing if Martha is away or no sock balls remaining
    if (this.marthaManager.isMarthaAway() || this.game.sockBalls <= 0) {
      console.log("Cannot fire: Martha is away or no sock balls remaining");
      return;
    }

    // Fire from bottom of screen - responsive
    const startX = cursorX;
    const startY = this.getCanvasHeight() - this.getCanvasHeight() * 0.04; // 4% from bottom
    const targetX = cursorX;
    const targetY = cursorY;

    console.log("Launch parameters:", {
      start: { x: startX, y: startY },
      target: { x: targetX, y: targetY },
    });

    // Create sock with simple physics
    const sock = this.throwPhysics.createThrownSock(
      startX,
      startY,
      targetX,
      targetY
    );

    this.thrownSocks.push(sock);
    this.game.sockBalls--;

    console.log("Sock created and added to array:", {
      sockPosition: { x: sock.x, y: sock.y },
      sockVelocity: { vx: sock.vx, vy: sock.vy },
      totalThrown: this.thrownSocks.length,
      remainingSockBalls: this.game.sockBalls,
    });
    console.log("=== SOCK FIRED ===");
  }

  update() {
    // Update animation timers
    this.uiAnimationTimer++;
    this.crosshairPulseTimer++;
    this.messageFlashTimer++;

    // Update Martha
    this.marthaManager.update();

    // Update thrown socks
    this.thrownSocks.forEach((sock, index) => {
      this.throwPhysics.updateSock(sock);

      // Check collision with Martha
      if (this.marthaManager.checkSockCollision(sock)) {
        console.log("Sock hit Martha! Removing sock and feeding Martha");
        this.thrownSocks.splice(index, 1);
        const isLevelComplete = this.marthaManager.consumeSock();

        if (isLevelComplete) {
          console.log("Level complete! Martha is satisfied");
          this.endLevel();
        }
      }

      // Remove socks that go off screen (no HP penalty)
      if (this.throwPhysics.isSockOffScreen(sock)) {
        console.log("Sock went off screen, removing (no penalty)");
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
        // Start the countdown timer
        this.gameEndTimer = this.gameEndDelay;
        console.log(
          "Starting game end timer - no more socks available and Martha not satisfied"
        );
      } else {
        // Count down the timer
        this.gameEndTimer--;
        console.log("Game end timer countdown:", this.gameEndTimer);

        if (this.gameEndTimer <= 0) {
          console.log("Game end timer expired, ending game");
          this.endLevel(); // End level instead of game over
        }
      }
    } else {
      // Reset timer if conditions are no longer met
      if (this.gameEndTimer !== null) {
        console.log("Resetting game end timer - conditions changed");
        this.gameEndTimer = null;
      }
    }

    // Debug logging for game state
    console.log("Game state update:", {
      sockBalls: this.game.sockBalls,
      thrownSocks: this.thrownSocks.length,
      marthaConsumption: this.marthaManager.getProgress(),
      gameEndTimer: this.gameEndTimer,
      marthaAway: this.marthaManager.isMarthaAway(),
    });
  }

  endLevel() {
    // Calculate score based on extra sock balls (10 points each)
    const extraSockBalls = this.game.sockBalls;
    const extraPoints = extraSockBalls * 10;
    this.game.playerPoints += extraPoints;

    console.log("Level ended:", {
      extraSockBalls: extraSockBalls,
      extraPoints: extraPoints,
      totalPoints: this.game.playerPoints,
    });

    this.game.saveGameData();
    this.game.gameState = "gameOver";
  }

  render(ctx) {
    // Clear canvas first
    ctx.clearRect(0, 0, this.getCanvasWidth(), this.getCanvasHeight());

    // Draw background elements first
    this.marthaManager.render(ctx);

    // Draw enhanced Martha dialogue
    this.renderEnhancedDialogue(ctx);

    // Draw trajectory preview line (only if Martha is not away)
    if (!this.marthaManager.isMarthaAway()) {
      this.renderEnhancedTrajectoryPreview(ctx);
    }

    // Draw thrown socks ON TOP of everything else
    if (this.thrownSocks.length > 0) {
      this.thrownSocks.forEach((sock, index) => {
        console.log(`Rendering sock ${index}:`, {
          position: { x: sock.x, y: sock.y },
          age: sock.age,
          visible: true,
        });
        this.throwPhysics.renderSock(ctx, sock);
      });
    }

    // Draw enhanced UI elements
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

    console.log("=== RENDER COMPLETE ===");
  }

  renderEnhancedCrosshair(ctx) {
    // Only show crosshair if Martha is not away
    if (this.marthaManager.isMarthaAway()) return;

    const x = this.game.crosshair.x;
    const y = this.game.crosshair.y;

    // Responsive crosshair size
    const crosshairSize = Math.max(12, this.getCanvasWidth() * 0.015); // 1.5% of canvas width, min 12px

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
    ctx.shadowBlur = 10;

    // Draw crosshair
    ctx.strokeStyle = crosshairColor;
    ctx.lineWidth = 3;
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
    ctx.arc(0, 0, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  renderEnhancedTrajectoryPreview(ctx) {
    // Show trajectory from bottom of screen to cursor
    const startX = this.game.crosshair.x;
    const startY = this.getCanvasHeight() - this.getCanvasHeight() * 0.04; // 4% from bottom
    const targetX = this.game.crosshair.x;
    const targetY = this.game.crosshair.y;

    // Enhanced trajectory line
    const points = this.throwPhysics.calculateTrajectoryPoints(
      startX,
      startY,
      targetX,
      targetY,
      15
    );

    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Add glow effect
    ctx.shadowColor = "rgba(255, 255, 255, 0.3)";
    ctx.shadowBlur = 5;

    // Draw dashed line with animation
    const dashOffset = (this.uiAnimationTimer * 0.5) % 16;
    ctx.setLineDash([8, 8]);
    ctx.lineDashOffset = dashOffset;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
      if (points[i].y < this.getCanvasHeight() + 100) {
        ctx.lineTo(points[i].x, points[i].y);
      }
    }

    ctx.stroke();

    // Enhanced target indicator - responsive sizing
    const targetSize = Math.max(6, this.getCanvasWidth() * 0.008); // 0.8% of canvas width, min 6px
    const targetPulse = 1 + Math.sin(this.uiAnimationTimer * 0.15) * 0.3;
    ctx.fillStyle = "rgba(255, 255, 0, 0.9)";
    ctx.shadowColor = "rgba(255, 255, 0, 0.6)";
    ctx.shadowBlur = 15;

    ctx.beginPath();
    ctx.arc(targetX, targetY, targetSize * targetPulse, 0, Math.PI * 2);
    ctx.fill();

    // Start point indicator
    ctx.fillStyle = "rgba(0, 255, 0, 0.9)";
    ctx.shadowColor = "rgba(0, 255, 0, 0.6)";
    ctx.shadowBlur = 10;

    ctx.beginPath();
    ctx.arc(startX, startY, targetSize * 0.75, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  renderEnhancedPoints(ctx) {
    // Enhanced points panel - responsive sizing
    const panelX = this.getCanvasWidth() * 0.01; // 1% from left
    const panelY = this.getCanvasHeight() * 0.01; // 1% from top
    const panelWidth = Math.max(120, this.getCanvasWidth() * 0.12); // 12% of canvas width, min 120px
    const panelHeight = Math.max(40, this.getCanvasHeight() * 0.06); // 6% of canvas height, min 40px

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
    ctx.lineWidth = 2;
    ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

    // Points text - responsive font size
    const fontSize = Math.max(14, this.getCanvasWidth() * 0.015); // 1.5% of canvas width, min 14px
    ctx.fillStyle = "#ffd700";
    ctx.font = `bold ${fontSize}px Courier New`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("Points", panelX + 10, panelY + panelHeight * 0.35);

    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${fontSize * 0.9}px Courier New`;
    ctx.fillText(
      `${this.game.playerPoints}`,
      panelX + 10,
      panelY + panelHeight * 0.7
    );

    ctx.restore();
  }

  renderEnhancedSockBalls(ctx) {
    // Enhanced sock balls panel - responsive sizing
    const panelWidth = Math.max(120, this.getCanvasWidth() * 0.12); // 12% of canvas width, min 120px
    const panelHeight = Math.max(40, this.getCanvasHeight() * 0.06); // 6% of canvas height, min 40px
    const panelX =
      this.getCanvasWidth() - panelWidth - this.getCanvasWidth() * 0.01; // 1% from right
    const panelY = this.getCanvasHeight() * 0.01; // 1% from top

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
    ctx.lineWidth = 2;
    ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

    // Sock balls text - responsive font size
    const fontSize = Math.max(14, this.getCanvasWidth() * 0.015); // 1.5% of canvas width, min 14px
    ctx.fillStyle = "#87ceeb";
    ctx.font = `bold ${fontSize}px Courier New`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("Sock Balls", panelX + 10, panelY + panelHeight * 0.35);

    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${fontSize * 0.9}px Courier New`;
    ctx.fillText(
      `${this.game.sockBalls}`,
      panelX + 10,
      panelY + panelHeight * 0.7
    );

    // Visual sock ball indicators - responsive sizing
    const ballSize = Math.max(4, this.getCanvasWidth() * 0.005); // 0.5% of canvas width, min 4px
    const ballSpacing = Math.max(8, this.getCanvasWidth() * 0.008); // 0.8% of canvas width, min 8px
    const maxBalls = Math.min(this.game.sockBalls, 8); // Show max 8 balls

    for (let i = 0; i < maxBalls; i++) {
      const ballX = panelX + panelWidth * 0.65 + i * ballSpacing;
      const ballY = panelY + panelHeight * 0.5;

      // Glowing effect
      const glowIntensity =
        0.5 + Math.sin(this.uiAnimationTimer * 0.1 + i * 0.5) * 0.3;
      ctx.shadowColor = `rgba(135, 206, 235, ${glowIntensity})`;
      ctx.shadowBlur = 8;

      ctx.fillStyle = "#87ceeb";
      ctx.beginPath();
      ctx.arc(ballX, ballY, ballSize, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  renderEnhancedDialogue(ctx) {
    const progress = this.marthaManager.getProgress();

    // Enhanced dialogue panel - responsive sizing
    const panelWidth = Math.max(300, this.getCanvasWidth() * 0.33); // 33% of canvas width, min 300px
    const panelHeight = Math.max(60, this.getCanvasHeight() * 0.08); // 8% of canvas height, min 60px
    const panelX = this.getCanvasWidth() / 2;
    const panelY = this.getCanvasHeight() * 0.09; // 9% from top

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
    ctx.lineWidth = 3;
    ctx.strokeRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight);

    // Dynamic dialogue text based on progress
    let dialogueText = `I DEMAND ${this.marthaManager.targetSocks} PAIRS OF SOCKS!`;
    if (progress.percentage > 0.5) {
      dialogueText = `GETTING FULL... ${progress.consumed}/${progress.target} SOCKS!`;
    }
    if (progress.percentage > 0.8) {
      dialogueText = `ALMOST SATISFIED! ${progress.consumed}/${progress.target}!`;
    }

    // Dialogue text with pulse effect - responsive font size
    const fontSize = Math.max(14, this.getCanvasWidth() * 0.014); // 1.4% of canvas width, min 14px
    const textScale = 1 + Math.sin(this.uiAnimationTimer * 0.08) * 0.02;
    ctx.scale(textScale, textScale);

    ctx.fillStyle = "white";
    ctx.font = `bold ${fontSize}px Courier New`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(dialogueText, 0, -panelHeight * 0.15);

    ctx.restore();

    // Progress bar - responsive sizing
    const barWidth = Math.max(150, this.getCanvasWidth() * 0.17); // 17% of canvas width, min 150px
    const barHeight = Math.max(8, this.getCanvasHeight() * 0.01); // 1% of canvas height, min 8px
    const barX = panelX - barWidth / 2;
    const barY = panelY + panelHeight * 0.25;

    ctx.save();

    // Progress bar background
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Progress bar border
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 1;
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
    ctx.shadowBlur = 5;
    ctx.fillRect(barX, barY, fillWidth, barHeight);

    ctx.restore();
  }

  renderEnhancedGameEndTimer(ctx) {
    const secondsRemaining = Math.ceil(this.gameEndTimer / 60);

    // Enhanced timer panel - responsive sizing
    const panelWidth = Math.max(250, this.getCanvasWidth() * 0.25); // 25% of canvas width, min 250px
    const panelHeight = Math.max(50, this.getCanvasHeight() * 0.06); // 6% of canvas height, min 50px
    const panelX = this.getCanvasWidth() / 2;
    const panelY = this.getCanvasHeight() - this.getCanvasHeight() * 0.12; // 12% from bottom

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
    ctx.lineWidth = 3;
    ctx.strokeRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight);

    // Timer text with scale effect - responsive font size
    const fontSize = Math.max(18, this.getCanvasWidth() * 0.018); // 1.8% of canvas width, min 18px
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
    // Enhanced Martha away message - responsive sizing
    const panelWidth = Math.max(300, this.getCanvasWidth() * 0.33); // 33% of canvas width, min 300px
    const panelHeight = Math.max(60, this.getCanvasHeight() * 0.08); // 8% of canvas height, min 60px
    const panelX = this.getCanvasWidth() / 2;
    const panelY = this.getCanvasHeight() / 2 + this.getCanvasHeight() * 0.1; // 10% below center

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
    ctx.lineWidth = 3;
    ctx.strokeRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight);

    // Message text with pulse effect - responsive font size
    const fontSize = Math.max(16, this.getCanvasWidth() * 0.016); // 1.6% of canvas width, min 16px
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
