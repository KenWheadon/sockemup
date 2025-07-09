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

  // Get responsive dimensions based on target canvas size
  getCanvasWidth() {
    return this.game.canvas.width;
  }

  getCanvasHeight() {
    return this.game.canvas.height;
  }

  // Get scaled value for responsive UI
  getScaledValue(baseValue) {
    return this.game.getScaledValue(baseValue);
  }

  // Get relative position based on target canvas dimensions
  getRelativePosition(targetX, targetY) {
    return {
      x: (targetX / GameConfig.TARGET_WIDTH) * this.getCanvasWidth(),
      y: (targetY / GameConfig.TARGET_HEIGHT) * this.getCanvasHeight(),
    };
  }

  // Get relative size based on target canvas dimensions
  getRelativeSize(targetSize) {
    return {
      width:
        (targetSize.width / GameConfig.TARGET_WIDTH) * this.getCanvasWidth(),
      height:
        (targetSize.height / GameConfig.TARGET_HEIGHT) * this.getCanvasHeight(),
    };
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

    // Fire from bottom of screen - proportional to target canvas
    const startX = cursorX;
    const startY = this.getCanvasHeight() - this.getScaledValue(30); // Proportional distance from bottom
    const targetX = cursorX;
    const targetY = cursorY;

    console.log("Launch parameters:", {
      start: { x: startX, y: startY },
      target: { x: targetX, y: targetY },
      scaleFactor: this.game.scaleFactor,
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

    // Proportional crosshair size based on target canvas
    const crosshairSize = this.getScaledValue(12); // 12px at target size

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
    ctx.lineWidth = this.getScaledValue(3);
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
    ctx.arc(0, 0, this.getScaledValue(2), 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  renderEnhancedTrajectoryPreview(ctx) {
    // Show trajectory from bottom of screen to cursor
    const startX = this.game.crosshair.x;
    const startY = this.getCanvasHeight() - this.getScaledValue(30); // Proportional distance from bottom
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
    ctx.lineWidth = this.getScaledValue(3);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Add glow effect
    ctx.shadowColor = "rgba(255, 255, 255, 0.3)";
    ctx.shadowBlur = this.getScaledValue(5);

    // Draw dashed line with animation
    const dashOffset = (this.uiAnimationTimer * 0.5) % 16;
    ctx.setLineDash([this.getScaledValue(8), this.getScaledValue(8)]);
    ctx.lineDashOffset = dashOffset;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
      if (points[i].y < this.getCanvasHeight() + 100) {
        ctx.lineTo(points[i].x, points[i].y);
      }
    }

    ctx.stroke();

    // Enhanced target indicator - proportional sizing
    const targetSize = this.getScaledValue(8);
    const targetPulse = 1 + Math.sin(this.uiAnimationTimer * 0.15) * 0.3;
    ctx.fillStyle = "rgba(255, 255, 0, 0.9)";
    ctx.shadowColor = "rgba(255, 255, 0, 0.6)";
    ctx.shadowBlur = this.getScaledValue(15);

    ctx.beginPath();
    ctx.arc(targetX, targetY, targetSize * targetPulse, 0, Math.PI * 2);
    ctx.fill();

    // Start point indicator
    ctx.fillStyle = "rgba(0, 255, 0, 0.9)";
    ctx.shadowColor = "rgba(0, 255, 0, 0.6)";
    ctx.shadowBlur = this.getScaledValue(10);

    ctx.beginPath();
    ctx.arc(startX, startY, targetSize * 0.75, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  renderEnhancedPoints(ctx) {
    // Enhanced points panel - proportional sizing
    const basePanel = { x: 10, y: 10, width: 150, height: 50 };
    const panel = this.getRelativePosition(basePanel.x, basePanel.y);
    const panelSize = this.getRelativeSize({
      width: basePanel.width,
      height: basePanel.height,
    });

    ctx.save();

    // Panel background with gradient
    const gradient = ctx.createLinearGradient(
      panel.x,
      panel.y,
      panel.x + panelSize.width,
      panel.y + panelSize.height
    );
    gradient.addColorStop(0, "rgba(0, 0, 0, 0.8)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0.6)");

    ctx.fillStyle = gradient;
    ctx.fillRect(panel.x, panel.y, panelSize.width, panelSize.height);

    // Panel border
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = this.getScaledValue(2);
    ctx.strokeRect(panel.x, panel.y, panelSize.width, panelSize.height);

    // Points text - proportional font size
    const fontSize = this.getScaledValue(18);
    ctx.fillStyle = "#ffd700";
    ctx.font = `bold ${fontSize}px Courier New`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(
      "Points",
      panel.x + this.getScaledValue(10),
      panel.y + panelSize.height * 0.35
    );

    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${fontSize * 0.9}px Courier New`;
    ctx.fillText(
      `${this.game.playerPoints}`,
      panel.x + this.getScaledValue(10),
      panel.y + panelSize.height * 0.7
    );

    ctx.restore();
  }

  renderEnhancedSockBalls(ctx) {
    // Enhanced sock balls panel - proportional sizing
    const basePanel = { width: 150, height: 50 };
    const panelSize = this.getRelativeSize(basePanel);
    const panel = {
      x: this.getCanvasWidth() - panelSize.width - this.getScaledValue(10),
      y: this.getScaledValue(10),
    };

    ctx.save();

    // Panel background with gradient
    const gradient = ctx.createLinearGradient(
      panel.x,
      panel.y,
      panel.x + panelSize.width,
      panel.y + panelSize.height
    );
    gradient.addColorStop(0, "rgba(0, 0, 0, 0.6)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0.8)");

    ctx.fillStyle = gradient;
    ctx.fillRect(panel.x, panel.y, panelSize.width, panelSize.height);

    // Panel border
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = this.getScaledValue(2);
    ctx.strokeRect(panel.x, panel.y, panelSize.width, panelSize.height);

    // Sock balls text - proportional font size
    const fontSize = this.getScaledValue(18);
    ctx.fillStyle = "#87ceeb";
    ctx.font = `bold ${fontSize}px Courier New`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(
      "Sock Balls",
      panel.x + this.getScaledValue(10),
      panel.y + panelSize.height * 0.35
    );

    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${fontSize * 0.9}px Courier New`;
    ctx.fillText(
      `${this.game.sockBalls}`,
      panel.x + this.getScaledValue(10),
      panel.y + panelSize.height * 0.7
    );

    // Visual sock ball indicators - proportional sizing
    const ballSize = this.getScaledValue(6);
    const ballSpacing = this.getScaledValue(10);
    const maxBalls = Math.min(this.game.sockBalls, 8); // Show max 8 balls

    for (let i = 0; i < maxBalls; i++) {
      const ballX = panel.x + panelSize.width * 0.65 + i * ballSpacing;
      const ballY = panel.y + panelSize.height * 0.5;

      // Glowing effect
      const glowIntensity =
        0.5 + Math.sin(this.uiAnimationTimer * 0.1 + i * 0.5) * 0.3;
      ctx.shadowColor = `rgba(135, 206, 235, ${glowIntensity})`;
      ctx.shadowBlur = this.getScaledValue(8);

      ctx.fillStyle = "#87ceeb";
      ctx.beginPath();
      ctx.arc(ballX, ballY, ballSize, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  renderEnhancedDialogue(ctx) {
    const progress = this.marthaManager.getProgress();

    // Enhanced dialogue panel - proportional sizing
    const basePanel = { width: 400, height: 80 };
    const panelSize = this.getRelativeSize(basePanel);
    const panel = {
      x: this.getCanvasWidth() / 2,
      y: this.getScaledValue(70),
    };

    ctx.save();
    ctx.translate(panel.x, panel.y);

    // Panel background with gradient
    const gradient = ctx.createLinearGradient(
      -panelSize.width / 2,
      -panelSize.height / 2,
      panelSize.width / 2,
      panelSize.height / 2
    );
    gradient.addColorStop(0, "rgba(75, 0, 130, 0.9)");
    gradient.addColorStop(1, "rgba(138, 43, 226, 0.8)");

    ctx.fillStyle = gradient;
    ctx.fillRect(
      -panelSize.width / 2,
      -panelSize.height / 2,
      panelSize.width,
      panelSize.height
    );

    // Panel border
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = this.getScaledValue(3);
    ctx.strokeRect(
      -panelSize.width / 2,
      -panelSize.height / 2,
      panelSize.width,
      panelSize.height
    );

    // Dynamic dialogue text based on progress
    let dialogueText = `I DEMAND ${this.marthaManager.targetSocks} PAIRS OF SOCKS!`;
    if (progress.percentage > 0.5) {
      dialogueText = `GETTING FULL... ${progress.consumed}/${progress.target} SOCKS!`;
    }
    if (progress.percentage > 0.8) {
      dialogueText = `ALMOST SATISFIED! ${progress.consumed}/${progress.target}!`;
    }

    // Dialogue text with pulse effect - proportional font size
    const fontSize = this.getScaledValue(16);
    const textScale = 1 + Math.sin(this.uiAnimationTimer * 0.08) * 0.02;
    ctx.scale(textScale, textScale);

    ctx.fillStyle = "white";
    ctx.font = `bold ${fontSize}px Courier New`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(dialogueText, 0, -panelSize.height * 0.15);

    ctx.restore();

    // Progress bar - proportional sizing
    const baseBar = { width: 200, height: 10 };
    const barSize = this.getRelativeSize(baseBar);
    const bar = {
      x: panel.x - barSize.width / 2,
      y: panel.y + panelSize.height * 0.25,
    };

    ctx.save();

    // Progress bar background
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.fillRect(bar.x, bar.y, barSize.width, barSize.height);

    // Progress bar border
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = this.getScaledValue(1);
    ctx.strokeRect(bar.x, bar.y, barSize.width, barSize.height);

    // Progress bar fill
    const fillWidth = barSize.width * progress.percentage;
    let fillColor = "#4caf50";
    if (progress.percentage > 0.7) fillColor = "#ffc107";
    if (progress.percentage >= 1) fillColor = "#ff5722";

    ctx.fillStyle = fillColor;
    ctx.fillRect(bar.x, bar.y, fillWidth, barSize.height);

    // Progress bar glow
    ctx.shadowColor = fillColor;
    ctx.shadowBlur = this.getScaledValue(5);
    ctx.fillRect(bar.x, bar.y, fillWidth, barSize.height);

    ctx.restore();
  }

  renderEnhancedGameEndTimer(ctx) {
    const secondsRemaining = Math.ceil(this.gameEndTimer / 60);

    // Enhanced timer panel - proportional sizing
    const basePanel = { width: 300, height: 60 };
    const panelSize = this.getRelativeSize(basePanel);
    const panel = {
      x: this.getCanvasWidth() / 2,
      y: this.getCanvasHeight() - this.getScaledValue(80),
    };

    ctx.save();
    ctx.translate(panel.x, panel.y);

    // Panel background with gradient
    const gradient = ctx.createLinearGradient(
      -panelSize.width / 2,
      -panelSize.height / 2,
      panelSize.width / 2,
      panelSize.height / 2
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
    ctx.fillRect(
      -panelSize.width / 2,
      -panelSize.height / 2,
      panelSize.width,
      panelSize.height
    );

    // Panel border
    ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
    ctx.lineWidth = this.getScaledValue(3);
    ctx.strokeRect(
      -panelSize.width / 2,
      -panelSize.height / 2,
      panelSize.width,
      panelSize.height
    );

    // Timer text with scale effect - proportional font size
    const fontSize = this.getScaledValue(22);
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
    // Enhanced Martha away message - proportional sizing
    const basePanel = { width: 400, height: 80 };
    const panelSize = this.getRelativeSize(basePanel);
    const panel = {
      x: this.getCanvasWidth() / 2,
      y: this.getCanvasHeight() / 2 + this.getScaledValue(100),
    };

    ctx.save();
    ctx.translate(panel.x, panel.y);

    // Panel background with gradient
    const gradient = ctx.createLinearGradient(
      -panelSize.width / 2,
      -panelSize.height / 2,
      panelSize.width / 2,
      panelSize.height / 2
    );
    gradient.addColorStop(0, "rgba(255, 140, 0, 0.9)");
    gradient.addColorStop(1, "rgba(255, 165, 0, 0.8)");

    ctx.fillStyle = gradient;
    ctx.fillRect(
      -panelSize.width / 2,
      -panelSize.height / 2,
      panelSize.width,
      panelSize.height
    );

    // Panel border
    ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
    ctx.lineWidth = this.getScaledValue(3);
    ctx.strokeRect(
      -panelSize.width / 2,
      -panelSize.height / 2,
      panelSize.width,
      panelSize.height
    );

    // Message text with pulse effect - proportional font size
    const fontSize = this.getScaledValue(18);
    const textScale = 1 + Math.sin(this.messageFlashTimer * 0.1) * 0.05;
    ctx.scale(textScale, textScale);

    ctx.fillStyle = "white";
    ctx.font = `bold ${fontSize}px Courier New`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Martha is away!", 0, -panelSize.height * 0.15);

    ctx.font = `${fontSize * 0.85}px Courier New`;
    ctx.fillText("Wait for her to return...", 0, panelSize.height * 0.2);

    ctx.restore();
  }
}
