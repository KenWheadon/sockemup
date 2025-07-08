class MarthaScene {
  constructor(game) {
    this.game = game;
    this.throwPhysics = new ThrowPhysics(game);
    this.marthaManager = new MarthaManager(game);
    this.thrownSocks = [];
    this.gameEndTimer = null;
    this.gameEndDelay = 60; // 1 second at 60 FPS
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

    console.log("Martha scene setup complete:", {
      currentLevel: this.game.currentLevel,
      sockBalls: this.game.sockBalls,
      targetSocks: this.marthaManager.targetSocks,
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

    // Fire from bottom of screen
    const startX = cursorX;
    const startY = GameConfig.CANVAS_HEIGHT - 30; // Bottom of screen
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
    ctx.clearRect(0, 0, GameConfig.CANVAS_WIDTH, GameConfig.CANVAS_HEIGHT);

    // Draw background elements first
    this.marthaManager.render(ctx);
    this.marthaManager.renderDialogue(ctx);

    // Draw trajectory preview line (only if Martha is not away)
    if (!this.marthaManager.isMarthaAway()) {
      this.renderTrajectoryPreview(ctx);
    }

    // Draw thrown socks ON TOP of everything else
    if (this.thrownSocks.length > 0) {
      // Set high z-index equivalent by rendering last
      this.thrownSocks.forEach((sock, index) => {
        console.log(`Rendering sock ${index}:`, {
          position: { x: sock.x, y: sock.y },
          age: sock.age,
          visible: true,
        });
        this.throwPhysics.renderSock(ctx, sock);
      });
    } else {
      //   console.log("No socks to render");
    }

    // Draw UI elements on top
    this.renderCrosshair(ctx);
    this.renderPoints(ctx);
    this.renderSockBalls(ctx);

    // Draw game end timer if active
    if (this.gameEndTimer !== null) {
      this.renderGameEndTimer(ctx);
    }

    // Draw firing status
    if (this.marthaManager.isMarthaAway()) {
      this.renderMarthaAwayMessage(ctx);
    }

    console.log("=== RENDER COMPLETE ===");
  }

  renderCrosshair(ctx) {
    // Only show crosshair if Martha is not away
    if (this.marthaManager.isMarthaAway()) return;

    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.game.crosshair.x - 10, this.game.crosshair.y);
    ctx.lineTo(this.game.crosshair.x + 10, this.game.crosshair.y);
    ctx.moveTo(this.game.crosshair.x, this.game.crosshair.y - 10);
    ctx.lineTo(this.game.crosshair.x, this.game.crosshair.y + 10);
    ctx.stroke();
  }

  renderTrajectoryPreview(ctx) {
    // Show trajectory from bottom of screen to cursor
    const startX = this.game.crosshair.x;
    const startY = GameConfig.CANVAS_HEIGHT - 30;
    const targetX = this.game.crosshair.x;
    const targetY = this.game.crosshair.y;

    this.throwPhysics.renderTrajectoryPreview(
      ctx,
      startX,
      startY,
      targetX,
      targetY
    );
  }

  renderPoints(ctx) {
    ctx.fillStyle = "yellow";
    ctx.font = "18px Courier New";
    ctx.textAlign = "left";
    ctx.fillText(`Points: ${this.game.playerPoints}`, 10, 30);
  }

  renderSockBalls(ctx) {
    ctx.fillStyle = "white";
    ctx.font = "18px Courier New";
    ctx.textAlign = "left";
    ctx.fillText(`Sock Balls: ${this.game.sockBalls}`, 10, 55);
  }

  renderGameEndTimer(ctx) {
    const secondsRemaining = Math.ceil(this.gameEndTimer / 60);

    ctx.fillStyle = "rgba(255, 255, 0, 0.8)";
    ctx.font = "24px Courier New";
    ctx.textAlign = "center";
    ctx.fillText(
      `Level ending in ${secondsRemaining}...`,
      GameConfig.CANVAS_WIDTH / 2,
      GameConfig.CANVAS_HEIGHT - 50
    );
  }

  renderMarthaAwayMessage(ctx) {
    ctx.fillStyle = "rgba(255, 0, 0, 0.8)";
    ctx.font = "20px Courier New";
    ctx.textAlign = "center";
    ctx.fillText(
      "Martha is away! Wait for her to return...",
      GameConfig.CANVAS_WIDTH / 2,
      GameConfig.CANVAS_HEIGHT / 2 + 100
    );
  }
}
