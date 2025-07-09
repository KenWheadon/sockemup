// 📁 level-end-screen.js - REWRITTEN with queue-based score animation
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
      centerX: canvasWidth / 2,
      centerY: canvasHeight / 2,
      containerWidth: this.game.getScaledValue(500),
      containerHeight: this.game.getScaledValue(400),
      containerX: canvasWidth / 2 - this.game.getScaledValue(250),
      containerY: canvasHeight / 2 - this.game.getScaledValue(200),
      titleY: canvasHeight / 2 - this.game.getScaledValue(150),
      scoreY: canvasHeight / 2 - this.game.getScaledValue(80),
      scoreLineHeight: this.game.getScaledValue(30),
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
    this.currentStageIndex = 0;
    this.scoreStages = [];
  }

  setup() {
    super.setup();
    this.animationState = "entering";
    this.animationProgress = 0;
    this.resetScores();
    this.prepareScoreAnimation();
    this.particles = [];
    this.particleTimer = 0;
    this.createCelebrationParticles();
    this.onResize();
  }

  prepareScoreAnimation() {
    const m = this.game.throwingScreen.marthaManager.collectedSockballs;
    const b = this.game.sockBalls;
    const consumedPoints = m * 5;
    const extraPoints = b * 10;
    const total = consumedPoints + extraPoints;

    this.scoreStages = [
      {
        label: "consumedSocksDisplay",
        start: 0,
        end: m,
        rate: 100,
        pointsPerUnit: 5,
        valueName: "consumedPointsDisplay",
      },
      {
        label: "extraSockBallsDisplay",
        start: 0,
        end: b,
        rate: 100,
        pointsPerUnit: 10,
        valueName: "extraPointsDisplay",
      },
      { label: "totalPointsDisplay", start: 0, end: total, rate: 50 },
      { label: "finalTotalDisplay", start: 0, end: total, rate: 30 },
    ];

    this.currentStageIndex = 0;
    this.scoreAnimationTimer = 0;
  }

  updateScoreAnimation(deltaTime) {
    if (this.currentStageIndex >= this.scoreStages.length) return;
    const t = deltaTime;
    const stage = this.scoreStages[this.currentStageIndex];
    this.scoreAnimationTimer += t;

    const stepsToAdd = Math.floor(this.scoreAnimationTimer / stage.rate);
    if (stepsToAdd > 0) {
      this.scoreAnimationTimer -= stepsToAdd * stage.rate;
      const currentValue = this[stage.label] || 0;
      const newValue = Math.min(currentValue + stepsToAdd, stage.end);
      this[stage.label] = newValue;

      if (stage.valueName) {
        this[stage.valueName] = newValue * stage.pointsPerUnit;
      }

      if (newValue >= stage.end) {
        this.currentStageIndex++;
        this.scoreAnimationTimer = 0;
      }
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

  getRandomColor() {
    return ["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7"][
      Math.floor(Math.random() * 6)
    ];
  }

  onResize() {
    const layout = this.layoutCache;
    this.continueButton.width = layout.buttonWidth;
    this.continueButton.height = layout.buttonHeight;
    this.continueButton.x = layout.centerX - layout.buttonWidth / 2;
    this.continueButton.y = layout.buttonY;
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
    if (this.animationState === "showing") this.updateScoreAnimation(deltaTime);
    this.updateParticles(t);
    if ((this.particleTimer += t) >= 30) {
      this.particleTimer = 0;
      this.addRandomParticle();
    }
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
    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.fillRect(0, 0, this.game.getCanvasWidth(), this.game.getCanvasHeight());
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(
      layout.containerX + 5,
      layout.containerY + 5,
      layout.containerWidth,
      layout.containerHeight
    );
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
    ctx.save();
    ctx.shadowColor = "#FFD700";
    ctx.shadowBlur = this.game.getScaledValue(10);
    this.renderText(ctx, "LEVEL COMPLETE!", layout.centerX, layout.titleY, {
      fontSize: this.game.getScaledValue(48),
      fontWeight: "bold",
      textAlign: "center",
    });
    ctx.restore();

    const lines = [
      ["Sockballs collected", this.consumedSocksDisplay],
      ["Points from Martha", this.consumedPointsDisplay],
      ["Leftover sockballs", this.extraSockBallsDisplay],
      ["Bonus points", this.extraPointsDisplay],
      ["Total round score", this.totalPointsDisplay],
      ["Final total score", this.finalTotalDisplay],
    ];

    lines.forEach((line, i) => {
      const y = layout.scoreY + i * layout.scoreLineHeight;
      this.renderScoreLine(ctx, line[0], line[1], layout.centerX, y);
    });
  }

  renderScoreLine(ctx, label, value, x, y) {
    ctx.fillStyle = "#fff";
    ctx.font = `${this.game.getScaledValue(18)}px ${this.game.font}`;
    ctx.textAlign = "right";
    ctx.fillText(label, x - 20, y);
    ctx.textAlign = "left";
    ctx.fillStyle = "#FFD700";
    ctx.fillText(value, x + 20, y);
  }

  renderContinueButton(ctx) {
    const b = this.continueButton;
    ctx.save();
    ctx.fillStyle = b.hovered ? "#4ECDC4" : "#3498DB";
    ctx.fillRect(b.x, b.y, b.width, b.height);
    ctx.fillStyle = "#fff";
    ctx.font = `${this.game.getScaledValue(18)}px ${this.game.font}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("CONTINUE", b.x + b.width / 2, b.y + b.height / 2);
    ctx.restore();
  }
}
