// 📁 level-end-screen.js (cleaned)
// Canvas-based animated level end screen with score animation and celebration particles
class LevelEndScreen {
  constructor(game) {
    this.game = game;
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

  handleResize() {
    const { width, height } = this.game.getScaledSize(200, 50);
    this.continueButton.width = width;
    this.continueButton.height = height;
    this.continueButton.x = this.game.getCanvasWidth() / 2 - width / 2;
    this.continueButton.y =
      this.game.getCanvasHeight() / 2 + this.game.getScaledValue(200);
  }

  setup() {
    this.animationState = "entering";
    this.animationProgress = 0;
    this.resetScores();
    this.handleResize();
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

  update(dt) {
    const t = dt / 16.67;
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
    const m = this.game.marthaScene.marthaManager.consumedSocks;
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

  handleMouseMove(x, y) {
    const b = this.continueButton;
    b.hovered =
      x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height;
  }
  handleMouseDown(x, y) {
    if (this.continueButton.hovered) this.continueButton.pressed = true;
  }
  handleMouseUp() {
    this.continueButton.pressed = false;
  }
  handleClick(x, y) {
    if (this.continueButton.hovered) this.game.gameState = "menu";
  }

  render(ctx) {
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
    const cx = this.game.getCanvasWidth() / 2;
    const cy = this.game.getCanvasHeight() / 2;
    const size = this.game.getScaledSize(500, 400);
    const x = cx - size.width / 2;
    const y = cy - size.height / 2;

    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.fillRect(0, 0, this.game.getCanvasWidth(), this.game.getCanvasHeight());
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(x + 5, y + 5, size.width, size.height);
    const grad = ctx.createLinearGradient(x, y, x, y + size.height);
    grad.addColorStop(0, "#2c3e50");
    grad.addColorStop(1, "#34495e");
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, size.width, size.height);
    ctx.strokeStyle = "#3498db";
    ctx.lineWidth = this.game.getScaledValue(3);
    ctx.shadowColor = "#3498db";
    ctx.shadowBlur = this.game.getScaledValue(20);
    ctx.strokeRect(x, y, size.width, size.height);
    ctx.shadowBlur = 0;
  }

  renderContent(ctx) {
    const cx = this.game.getCanvasWidth() / 2;
    const cy = this.game.getCanvasHeight() / 2;
    const v = this.game.getScaledValue.bind(this.game);
    ctx.textAlign = "center";

    ctx.fillStyle = "#FFD700";
    ctx.font = `bold ${v(48)}px Courier New`;
    ctx.fillText("LEVEL COMPLETE!", cx, cy - v(150));
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillText("LEVEL COMPLETE!", cx + v(2), cy - v(148));

    ctx.fillStyle = "#ecf0f1";
    ctx.font = `${v(20)}px Courier New`;
    let y = cy - v(80);
    const lh = v(30);
    ctx.fillText(
      `Socks Fed to Martha: ${this.consumedSocksDisplay} × 5 = ${this.consumedPointsDisplay} pts`,
      cx,
      y
    );
    y += lh;
    ctx.fillText(
      `Extra Sock Balls: ${this.extraSockBallsDisplay} × 10 = ${this.extraPointsDisplay} pts`,
      cx,
      y
    );
    y += lh;

    ctx.strokeStyle = "#95a5a6";
    ctx.lineWidth = v(2);
    ctx.beginPath();
    ctx.moveTo(cx - v(150), y + v(10));
    ctx.lineTo(cx + v(150), y + v(10));
    ctx.stroke();
    y += v(30);

    ctx.fillStyle = "#2ecc71";
    ctx.font = `bold ${v(24)}px Courier New`;
    ctx.fillText(`Points Earned: ${this.totalPointsDisplay}`, cx, y);
    y += lh + v(10);

    ctx.fillStyle = "#f39c12";
    ctx.font = `bold ${v(28)}px Courier New`;
    ctx.fillText(`Total Points: ${this.finalTotalDisplay}`, cx, y);
  }

  renderContinueButton(ctx) {
    const b = this.continueButton;
    const s = this.game.getScaledValue.bind(this.game);
    const color = b.pressed ? "#2980b9" : b.hovered ? "#5dade2" : "#3498db";

    ctx.fillStyle = color;
    ctx.fillRect(b.x, b.y, b.width, b.height);
    ctx.strokeStyle = "#2980b9";
    ctx.lineWidth = s(2);
    ctx.strokeRect(b.x, b.y, b.width, b.height);
    ctx.fillStyle = "white";
    ctx.font = `bold ${s(18)}px Courier New`;
    ctx.textAlign = "center";
    ctx.fillText("CONTINUE", b.x + b.width / 2, b.y + b.height / 2 + s(6));

    if (b.hovered) {
      ctx.shadowColor = "#3498db";
      ctx.shadowBlur = s(15);
      ctx.strokeRect(b.x, b.y, b.width, b.height);
      ctx.shadowBlur = 0;
    }
  }

  easeOutBack(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }
}
