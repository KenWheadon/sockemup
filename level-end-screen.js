class LevelEndScreen extends Screen {
  constructor(game) {
    super(game);
    this.animationState = "entering";
    this.animationProgress = 0;
    this.animationSpeed = 0.05;

    this.resetScores();
    this.particles = [];
    this.particleTimer = 0;

    this.continueButton = {
      x: 0,
      y: 0,
      width: 200,
      height: 50,
      hovered: false,
      pressed: false,
    };
  }

  createLayoutCache() {
    const baseLayout = super.createLayoutCache();
    const canvasWidth = this.game.getCanvasWidth();
    const canvasHeight = this.game.getCanvasHeight();

    return {
      ...baseLayout,

      // Main container positioning
      containerWidth: this.game.getScaledValue(500),
      containerHeight: this.game.getScaledValue(400),
      containerX: canvasWidth / 2 - this.game.getScaledValue(250),
      containerY: canvasHeight / 2 - this.game.getScaledValue(200),

      // Title positioning
      titleY: canvasHeight / 2 - this.game.getScaledValue(150),

      // Score section positioning
      scoreY: canvasHeight / 2 - this.game.getScaledValue(80),
      scoreLineHeight: this.game.getScaledValue(30),

      // Button positioning
      buttonWidth: this.game.getScaledValue(200),
      buttonHeight: this.game.getScaledValue(50),
      buttonY: canvasHeight / 2 + this.game.getScaledValue(200),
    };
  }

  resetScores() {
    this.consumedSocksDisplay = 0;
    this.extraSockBallsDisplay = 0;
    this.consumedPointsDisplay = 0;
    this.extraPointsDisplay = 0;
    this.totalPointsDisplay = 0;
    this.finalTotalDisplay = 0;
    this.scoreAnimationTimer = 0;
    this.scoreAnimationPhase = 0;
  }

  onResize() {
    const layout = this.layoutCache;
    this.continueButton.width = layout.buttonWidth;
    this.continueButton.height = layout.buttonHeight;
    this.continueButton.x = layout.centerX - layout.buttonWidth / 2;
    this.continueButton.y = layout.buttonY;
  }

  setup() {
    super.setup();
    this.animationState = "entering";
    this.animationProgress = 0;
    this.resetScores();
    this.particles = [];
    this.particleTimer = 0;
    this.createCelebrationParticles();
  }

  createCelebrationParticles() {
    const w = this.game.getCanvasWidth();
    const h = this.game.getCanvasHeight();
    const s = this.game.getScaledValue(6);
    for (let i = 0; i < 20; i++) {
      this.particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        size: s + Math.random() * s,
        color: this.getRandomColor(),
        life: 1.0,
        decay: 0.005 + Math.random() * 0.005,
      });
    }
  }

  getRandomColor() {
    return ["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7"][
      Math.floor(Math.random() * 6)
    ];
  }

  onUpdate(deltaTime) {
    const t = deltaTime / 16.67;
    if (this.animationState === "entering") {
      this.animationProgress += this.animationSpeed * t;
      if (this.animationProgress >= 1) {
        this.animationProgress = 1;
        this.animationState = "showing";
      }
    }
    if (this.animationState === "showing") this.updateScoreAnimation(t);
    this.updateParticles(t);
    if ((this.particleTimer += t) >= 30) {
      this.particleTimer = 0;
      this.addRandomParticle();
    }
  }

  updateScoreAnimation(t) {
    const m = this.game.throwingScreen.marthaManager.collectedSockballs;
    const b = this.game.sockBalls;
    const c = m * 5;
    const e = b * 10;
    const total = c + e;
    const final = this.game.playerPoints;

    this.scoreAnimationTimer += 2 * t;
    switch (this.scoreAnimationPhase) {
      case 0:
        this.consumedSocksDisplay = Math.min(
          m,
          Math.floor(this.scoreAnimationTimer / 10)
        );
        this.consumedPointsDisplay = this.consumedSocksDisplay * 5;
        if (this.consumedSocksDisplay >= m)
          this.scoreAnimationPhase++, (this.scoreAnimationTimer = 0);
        break;
      case 1:
        this.extraSockBallsDisplay = Math.min(
          b,
          Math.floor(this.scoreAnimationTimer / 10)
        );
        this.extraPointsDisplay = this.extraSockBallsDisplay * 10;
        if (this.extraSockBallsDisplay >= b)
          this.scoreAnimationPhase++, (this.scoreAnimationTimer = 0);
        break;
      case 2:
        this.totalPointsDisplay = Math.min(
          total,
          Math.floor(this.scoreAnimationTimer / 5)
        );
        if (this.totalPointsDisplay >= total)
          this.scoreAnimationPhase++, (this.scoreAnimationTimer = 0);
        break;
      case 3:
        this.finalTotalDisplay = Math.min(
          final,
          Math.floor(this.scoreAnimationTimer / 3)
        );
        break;
    }
  }

  updateParticles(t) {
    this.particles = this.particles.filter((p) => (p.life -= p.decay * t) > 0);
    this.particles.forEach((p) => {
      p.x += p.vx * t;
      p.y += p.vy * t;
    });
    if (this.particles.length > 100) this.particles.shift();
  }

  addRandomParticle() {
    const w = this.game.getCanvasWidth();
    const h = this.game.getCanvasHeight();
    const s = this.game.getScaledValue(4);
    this.particles.push({
      x: Math.random() * w,
      y: h + this.game.getScaledValue(10),
      vx: (Math.random() - 0.5) * 2,
      vy: -Math.random() * 3 - 1,
      size: s + Math.random() * s,
      color: this.getRandomColor(),
      life: 1.0,
      decay: 0.01 + Math.random() * 0.01,
    });
  }

  onMouseMove(x, y) {
    const b = this.continueButton;
    b.hovered =
      x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height;
  }

  onMouseDown(x, y) {
    if (this.continueButton.hovered) this.continueButton.pressed = true;
  }

  onMouseUp() {
    this.continueButton.pressed = false;
  }

  onClick(x, y) {
    if (this.continueButton.hovered) this.game.gameState = "menu";
  }

  onRender(ctx) {
    const s = this.easeOutBack(this.animationProgress);
    ctx.save();
    ctx.globalAlpha = this.animationProgress;
    ctx.translate(
      this.game.getCanvasWidth() / 2,
      this.game.getCanvasHeight() / 2
    );
    ctx.scale(s, s);
    ctx.translate(
      -this.game.getCanvasWidth() / 2,
      -this.game.getCanvasHeight() / 2
    );
    this.renderParticles(ctx);
    this.renderMainContainer(ctx);
    this.renderContent(ctx);
    this.renderContinueButton(ctx);
    ctx.restore();
  }

  renderParticles(ctx) {
    ctx.save();
    for (const p of this.particles) {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  renderMainContainer(ctx) {
    const layout = this.layoutCache;

    // Background overlay
    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.fillRect(0, 0, this.game.getCanvasWidth(), this.game.getCanvasHeight());

    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(
      layout.containerX + 5,
      layout.containerY + 5,
      layout.containerWidth,
      layout.containerHeight
    );

    // Main container using shared panel rendering
    this.renderPanel(
      ctx,
      layout.containerX,
      layout.containerY,
      layout.containerWidth,
      layout.containerHeight,
      "primary"
    );
  }

  renderContent(ctx) {
    const layout = this.layoutCache;

    // Title with glow effect
    ctx.save();
    ctx.shadowColor = "#FFD700";
    ctx.shadowBlur = this.game.getScaledValue(10);

    this.renderText(ctx, "LEVEL COMPLETE!", layout.centerX, layout.titleY, {
      fontSize: this.game.getScaledValue(48),
      weight: "bold",
      color: "#FFD700",
    });
    ctx.restore();

    // Score breakdown
    let y = layout.scoreY;
    const lineHeight = layout.scoreLineHeight;

    this.renderText(
      ctx,
      `Socks Fed to Martha: ${this.consumedSocksDisplay} × 5 = ${this.consumedPointsDisplay} pts`,
      layout.centerX,
      y,
      { fontSize: layout.headerFontSize }
    );
    y += lineHeight;

    this.renderText(
      ctx,
      `Extra Sock Balls: ${this.extraSockBallsDisplay} × 10 = ${this.extraPointsDisplay} pts`,
      layout.centerX,
      y,
      { fontSize: layout.headerFontSize }
    );
    y += lineHeight;

    // Separator line
    ctx.strokeStyle = "#95a5a6";
    ctx.lineWidth = this.game.getScaledValue(2);
    ctx.beginPath();
    ctx.moveTo(
      layout.centerX - this.game.getScaledValue(150),
      y + this.game.getScaledValue(10)
    );
    ctx.lineTo(
      layout.centerX + this.game.getScaledValue(150),
      y + this.game.getScaledValue(10)
    );
    ctx.stroke();
    y += this.game.getScaledValue(30);

    // Total points earned
    this.renderText(
      ctx,
      `Points Earned: ${this.totalPointsDisplay}`,
      layout.centerX,
      y,
      {
        fontSize: layout.titleFontSize,
        weight: "bold",
        color: "#2ecc71",
      }
    );
    y += lineHeight + this.game.getScaledValue(10);

    // Final total
    this.renderText(
      ctx,
      `Total Points: ${this.finalTotalDisplay}`,
      layout.centerX,
      y,
      {
        fontSize: this.game.getScaledValue(28),
        weight: "bold",
        color: "#f39c12",
      }
    );
  }

  renderContinueButton(ctx) {
    const button = this.continueButton;

    // Use shared button rendering
    this.renderButton(ctx, {
      x: button.x,
      y: button.y,
      width: button.width,
      height: button.height,
      text: "CONTINUE",
      hovered: button.hovered,
      pressed: button.pressed,
      enabled: true,
    });
  }

  easeOutBack(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }
}
