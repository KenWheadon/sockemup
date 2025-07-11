class LevelEndScreen extends Screen {
  constructor(game) {
    super(game);
    this.resetScores();
    this.initializeButton();
    this.marthaImage = null;
    this.showRentDue = false;
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

  initializeButton() {
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
    const marthaImageSize = this.game.getScaledValue(100);
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
      scoreStartY:
        canvasHeight / 2 -
        this.game.getScaledValue(130) +
        marthaImageSize +
        marthaToStatsMargin,
      scoreLineHeight: this.game.getScaledValue(35),
      buttonWidth: this.game.getScaledValue(200),
      buttonHeight: this.game.getScaledValue(50),
      buttonY: canvasHeight / 2 + this.game.getScaledValue(240),
    };
  }

  setup() {
    super.setup();
    this.resetScores();
    this.calculateScoresAndRent();
    this.setupScoreAnimation();
    this.onResize();
  }

  calculateScoresAndRent() {
    const marthaWanted = this.game.throwingScreen.marthaManager.sockballsWanted;
    const marthaGot = this.game.throwingScreen.marthaManager.collectedSockballs;
    const totalSockballsCreated = this.game.sockBalls;
    const sockballsThrown = this.game.throwingScreen.sockballsThrown || 0;

    this.sockballsPaid = marthaGot;
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

    this.showRentDue = this.rentPenalty > 0;
    this.marthaImage = this.showRentDue
      ? this.game.images["martha-rentdue.png"]
      : this.game.images["martha-win.png"];
  }

  setupScoreAnimation() {
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
      { label: "totalScoreDisplay", start: 0, end: this.totalScore, rate: 60 },
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
    this.updateScoreAnimation(deltaTime);
  }

  onMouseMove(x, y) {
    const b = this.continueButton;
    b.hovered =
      x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height;
  }

  onMouseDown(x, y) {
    if (this.continueButton.hovered) {
      this.continueButton.pressed = true;
    }
  }

  onMouseUp() {
    this.continueButton.pressed = false;
  }

  onClick(x, y) {
    if (this.continueButton.hovered) {
      this.game.playerPoints += this.totalScore;
      this.game.saveGameData();
      this.game.gameState = "menu";
    }
  }

  onRender(ctx) {
    ctx.save();
    this.renderMainContainer(ctx);
    this.renderContent(ctx);
    this.renderContinueButton(ctx);
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

    this.renderTitle(ctx, layout);
    this.renderMarthaImage(ctx, layout);
    this.renderScoreLines(ctx, layout);
  }

  renderTitle(ctx, layout) {
    ctx.save();
    ctx.shadowColor = "#FFD700";
    ctx.shadowBlur = this.game.getScaledValue(10);
    this.renderText(ctx, "LEVEL COMPLETE!", layout.centerX, layout.titleY, {
      fontSize: this.game.getScaledValue(48),
      weight: "bold",
      align: "center",
    });
    ctx.restore();
  }

  renderMarthaImage(ctx, layout) {
    if (!this.marthaImage) return;

    const image = this.marthaImage;
    const desiredHeight = layout.marthaImageSize;
    const aspectRatio = image.width / image.height;
    const desiredWidth = desiredHeight * aspectRatio;

    const imageX = layout.centerX - desiredWidth / 2;
    const imageY = layout.marthaImageY;

    ctx.drawImage(image, imageX, imageY, desiredWidth, desiredHeight);
  }

  renderScoreLines(ctx, layout) {
    const scoreLines = [
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

    scoreLines.forEach((line, index) => {
      const y = layout.scoreStartY + index * layout.scoreLineHeight;
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

    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "right";
    ctx.fillText(label, centerX - 20, y);

    ctx.fillStyle = valueColor;
    ctx.textAlign = "left";
    ctx.fillText(`${value} points`, centerX + 20, y);

    ctx.restore();
  }

  renderContinueButton(ctx) {
    const button = this.continueButton;

    ctx.save();

    let fillColor = "#3498DB";
    if (button.hovered) fillColor = "#4ECDC4";
    if (button.pressed) fillColor = "#2980B9";

    ctx.fillStyle = fillColor;
    ctx.fillRect(button.x, button.y, button.width, button.height);

    ctx.strokeStyle = "#2980B9";
    ctx.lineWidth = this.game.getScaledValue(2);
    ctx.strokeRect(button.x, button.y, button.width, button.height);

    if (button.hovered) {
      ctx.shadowColor = "#4ECDC4";
      ctx.shadowBlur = this.game.getScaledValue(15);
      ctx.strokeRect(button.x, button.y, button.width, button.height);
    }

    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${this.game.getScaledValue(18)}px Courier New`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      "CONTINUE",
      button.x + button.width / 2,
      button.y + button.height / 2
    );

    ctx.restore();
  }
}
