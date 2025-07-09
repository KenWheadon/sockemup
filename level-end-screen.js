// 📁 level-end-screen.js - Updated with simplified scoring and Martha images
class LevelEndScreen extends Screen {
  constructor(game) {
    super(game);
    // Removed animation state properties
    this.resetScores();

    this.continueButton = {
      x: 0,
      y: 0,
      width: 200,
      height: 50,
      hovered: false,
      pressed: false,
    };

    // Martha image state
    this.marthaImage = null;
    this.showRentDue = false;
  }

  createLayoutCache() {
    const baseLayout = super.createLayoutCache();
    const canvasWidth = this.game.getCanvasWidth();
    const canvasHeight = this.game.getCanvasHeight();

    // Add margin between Martha image and stats
    const marthaImageSize = this.game.getScaledValue(80);
    const marthaToStatsMargin = this.game.getScaledValue(30);

    return {
      ...baseLayout,
      centerX: canvasWidth / 2,
      centerY: canvasHeight / 2,
      containerWidth: this.game.getScaledValue(600),
      containerHeight: this.game.getScaledValue(550),
      containerX: canvasWidth / 2 - this.game.getScaledValue(300),
      containerY: canvasHeight / 2 - this.game.getScaledValue(275),
      titleY: canvasHeight / 2 - this.game.getScaledValue(200),
      marthaImageY: canvasHeight / 2 - this.game.getScaledValue(130),
      marthaImageSize: marthaImageSize,
      // Add margin between Martha image and stats
      scoreStartY:
        canvasHeight / 2 -
        this.game.getScaledValue(130) +
        marthaImageSize +
        marthaToStatsMargin,
      scoreLineHeight: this.game.getScaledValue(35),
      buttonWidth: this.game.getScaledValue(200),
      buttonHeight: this.game.getScaledValue(50),
      buttonY: canvasHeight / 2 + this.game.getScaledValue(240),
      gapAboveButton: this.game.getScaledValue(20),
    };
  }

  resetScores() {
    this.sockballsPaidDisplay = 0;
    this.sockballsLeftoverDisplay = 0;
    this.rentPenaltyDisplay = 0;
    this.totalScoreDisplay = 0;
    this.scoreAnimationTimer = 0;
    this.currentStageIndex = 0;
    this.scoreStages = [];
  }

  setup() {
    super.setup();
    // Removed animation state setup
    this.resetScores();
    this.calculateScoresAndRent();
    this.prepareScoreAnimation();
    this.onResize();
  }

  calculateScoresAndRent() {
    const marthaWanted = this.game.throwingScreen.marthaManager.sockballsWanted;
    const marthaGot = this.game.throwingScreen.marthaManager.collectedSockballs;
    const totalSockballsCreated = this.game.sockBalls;

    // Get sockballs thrown from throwing screen, default to 0 if not available
    const sockballsThrown = this.game.throwingScreen.sockballsThrown || 0;

    this.sockballsPaid = marthaGot;
    // Only count sockballs that are physically leftover (not thrown)
    this.sockballsLeftover = Math.max(
      0,
      totalSockballsCreated - sockballsThrown
    );
    this.rentPenalty = Math.max(0, marthaWanted - marthaGot);

    this.sockballsPaidPoints = this.sockballsPaid * 5;
    this.sockballsLeftoverPoints = this.sockballsLeftover * 10;
    this.rentPenaltyPoints = this.rentPenalty * -10;
    this.totalScore =
      this.sockballsPaidPoints +
      this.sockballsLeftoverPoints +
      this.rentPenaltyPoints;

    // Determine which Martha image to show
    this.showRentDue = this.rentPenalty > 0;
    this.marthaImage = this.showRentDue
      ? this.game.images["martha-rentdue.png"]
      : this.game.images["martha-win.png"];
  }

  prepareScoreAnimation() {
    this.scoreStages = [
      {
        label: "sockballsPaidDisplay",
        start: 0,
        end: this.sockballsPaid,
        rate: 80,
      },
      {
        label: "sockballsLeftoverDisplay",
        start: 0,
        end: this.sockballsLeftover,
        rate: 80,
      },
      {
        label: "rentPenaltyDisplay",
        start: 0,
        end: this.rentPenalty,
        rate: 80,
      },
      {
        label: "totalScoreDisplay",
        start: 0,
        end: this.totalScore,
        rate: 60,
      },
    ];

    this.currentStageIndex = 0;
    this.scoreAnimationTimer = 0;
  }

  updateScoreAnimation(deltaTime) {
    if (this.currentStageIndex >= this.scoreStages.length) return;

    const stage = this.scoreStages[this.currentStageIndex];
    this.scoreAnimationTimer += deltaTime;

    const stepsToAdd = Math.floor(this.scoreAnimationTimer / stage.rate);
    if (stepsToAdd > 0) {
      this.scoreAnimationTimer -= stepsToAdd * stage.rate;
      const currentValue = this[stage.label] || 0;
      const newValue = Math.min(currentValue + stepsToAdd, stage.end);
      this[stage.label] = newValue;

      if (newValue >= stage.end) {
        this.currentStageIndex++;
        this.scoreAnimationTimer = 0;
      }
    }
  }

  onResize() {
    const layout = this.layoutCache;
    this.continueButton.width = layout.buttonWidth;
    this.continueButton.height = layout.buttonHeight;
    this.continueButton.x = layout.centerX - layout.buttonWidth / 2;
    this.continueButton.y = layout.buttonY;
  }

  onUpdate(deltaTime) {
    // Removed animation update logic - screen now shows immediately
    this.updateScoreAnimation(deltaTime);
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
    if (this.continueButton.hovered) {
      // Add points to player total
      this.game.playerPoints += this.totalScore;
      this.game.saveGameData();
      this.game.gameState = "menu";
    }
  }

  onRender(ctx) {
    // Removed animation transforms - screen shows immediately without scaling/fading
    ctx.save();

    this.renderMainContainer(ctx);
    this.renderContent(ctx);
    this.renderContinueButton(ctx);

    ctx.restore();
  }

  renderMainContainer(ctx) {
    const layout = this.layoutCache;

    // Dark overlay
    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.fillRect(0, 0, this.game.getCanvasWidth(), this.game.getCanvasHeight());

    // Main container with shadow
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

    // Title
    ctx.save();
    ctx.shadowColor = "#FFD700";
    ctx.shadowBlur = this.game.getScaledValue(10);
    this.renderText(ctx, "LEVEL COMPLETE!", layout.centerX, layout.titleY, {
      fontSize: this.game.getScaledValue(48),
      weight: "bold",
      align: "center",
    });
    ctx.restore();

    // Martha image
    this.renderMarthaImage(ctx, layout);

    // Score lines (now with proper margin from Martha image)
    this.renderScoreLines(ctx, layout);
  }

  renderMarthaImage(ctx, layout) {
    if (this.marthaImage) {
      const imageSize = layout.marthaImageSize;
      const imageX = layout.centerX - imageSize / 2;
      const imageY = layout.marthaImageY;

      ctx.save();
      ctx.drawImage(this.marthaImage, imageX, imageY, imageSize, imageSize);
      ctx.restore();
    }
  }

  renderScoreLines(ctx, layout) {
    const lines = [
      {
        label: `${this.sockballsPaidDisplay}x SOCKBALLS PAID:`,
        value: this.sockballsPaidDisplay * 5,
        color: "#4ECDC4",
      },
      {
        label: `SOCKBALLS LEFTOVER:`,
        value: this.sockballsLeftoverDisplay * 10,
        color: "#4ECDC4",
      },
      {
        label: `RENT PENALTY:`,
        value: this.rentPenaltyDisplay * -10,
        color: "#FF6B6B",
      },
      {
        label: `TOTAL SCORE:`,
        value: this.totalScoreDisplay,
        color: "#FFD700",
      },
    ];

    lines.forEach((line, i) => {
      const y = layout.scoreStartY + i * layout.scoreLineHeight;
      this.renderScoreLine(
        ctx,
        line.label,
        line.value,
        layout.centerX,
        y,
        line.color
      );
    });
  }

  renderScoreLine(ctx, label, value, centerX, y, valueColor = "#FFD700") {
    const fontSize = this.game.getScaledValue(20);

    ctx.save();
    ctx.font = `${fontSize}px Courier New`;
    ctx.textBaseline = "middle";

    // Label (left aligned)
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "right";
    ctx.fillText(label, centerX - 20, y);

    // Value (right aligned)
    ctx.fillStyle = valueColor;
    ctx.textAlign = "left";
    ctx.fillText(`${value} points`, centerX + 20, y);

    ctx.restore();
  }

  renderContinueButton(ctx) {
    const b = this.continueButton;
    const layout = this.layoutCache;

    ctx.save();

    // Button background
    let fillColor = "#3498DB";
    if (b.hovered) fillColor = "#4ECDC4";
    if (b.pressed) fillColor = "#2980B9";

    ctx.fillStyle = fillColor;
    ctx.fillRect(b.x, b.y, b.width, b.height);

    // Button border
    ctx.strokeStyle = "#2980B9";
    ctx.lineWidth = this.game.getScaledValue(2);
    ctx.strokeRect(b.x, b.y, b.width, b.height);

    // Button glow when hovered
    if (b.hovered) {
      ctx.shadowColor = "#4ECDC4";
      ctx.shadowBlur = this.game.getScaledValue(15);
      ctx.strokeRect(b.x, b.y, b.width, b.height);
      ctx.shadowBlur = 0;
    }

    // Button text
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${this.game.getScaledValue(18)}px Courier New`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("CONTINUE", b.x + b.width / 2, b.y + b.height / 2);

    ctx.restore();
  }
}
