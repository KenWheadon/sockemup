class LevelEndScreen {
  constructor(game) {
    this.game = game;
    this.animationState = "entering"; // entering, showing, exiting
    this.animationProgress = 0;
    this.animationSpeed = 0.05;

    // Score animation properties
    this.consumedSocksDisplay = 0;
    this.extraSockBallsDisplay = 0;
    this.consumedPointsDisplay = 0;
    this.extraPointsDisplay = 0;
    this.totalPointsDisplay = 0;
    this.finalTotalDisplay = 0;

    // Animation timers
    this.scoreAnimationTimer = 0;
    this.scoreAnimationPhase = 0; // 0: consumed, 1: extra, 2: total, 3: final

    // Button properties
    this.continueButton = {
      x: 0,
      y: 0,
      width: 200,
      height: 50,
      hovered: false,
      pressed: false,
    };

    // Celebration particles
    this.particles = [];
    this.particleTimer = 0;
  }

  // Handle resize events from the main game
  handleResize() {
    this.setupButtonPosition();
  }

  setupButtonPosition() {
    // Use centralized scaling for button positioning
    const buttonSize = this.game.getScaledSize(200, 50);
    this.continueButton.width = buttonSize.width;
    this.continueButton.height = buttonSize.height;
    this.continueButton.x =
      this.game.getCanvasWidth() / 2 - buttonSize.width / 2;
    this.continueButton.y =
      this.game.getCanvasHeight() / 2 + this.game.getScaledValue(200);
  }

  setup() {
    this.animationState = "entering";
    this.animationProgress = 0;
    this.scoreAnimationTimer = 0;
    this.scoreAnimationPhase = 0;

    // Reset display values
    this.consumedSocksDisplay = 0;
    this.extraSockBallsDisplay = 0;
    this.consumedPointsDisplay = 0;
    this.extraPointsDisplay = 0;
    this.totalPointsDisplay = 0;
    this.finalTotalDisplay = 0;

    // Setup button position
    this.setupButtonPosition();

    // Initialize particles
    this.particles = [];
    this.particleTimer = 0;

    // Create celebration particles
    this.createCelebrationParticles();
  }

  createCelebrationParticles() {
    const canvasWidth = this.game.getCanvasWidth();
    const canvasHeight = this.game.getCanvasHeight();
    const particleSize = this.game.getScaledValue(6);

    for (let i = 0; i < 20; i++) {
      this.particles.push({
        x: Math.random() * canvasWidth,
        y: Math.random() * canvasHeight,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        size: particleSize + Math.random() * particleSize,
        color: this.getRandomColor(),
        life: 1.0,
        decay: 0.005 + Math.random() * 0.005,
      });
    }
  }

  getRandomColor() {
    const colors = [
      "#FFD700",
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#96CEB4",
      "#FFEAA7",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  update(deltaTime) {
    const timeMultiplier = deltaTime / 16.67; // Normalize to 60fps

    // Update main animation
    if (this.animationState === "entering") {
      this.animationProgress += this.animationSpeed * timeMultiplier;
      if (this.animationProgress >= 1) {
        this.animationProgress = 1;
        this.animationState = "showing";
      }
    }

    // Update score animation
    if (this.animationState === "showing") {
      this.updateScoreAnimation(timeMultiplier);
    }

    // Update particles
    this.updateParticles(timeMultiplier);

    // Update particle timer
    this.particleTimer += timeMultiplier;
    if (this.particleTimer >= 30) {
      this.particleTimer = 0;
      this.addRandomParticle();
    }
  }

  updateScoreAnimation(timeMultiplier) {
    this.scoreAnimationTimer += 2 * timeMultiplier;

    const consumedSocks = this.game.marthaScene.marthaManager.consumedSocks;
    const extraSockBalls = this.game.sockBalls;
    const consumedPoints = consumedSocks * 5;
    const extraPoints = extraSockBalls * 10;
    const totalPointsEarned = consumedPoints + extraPoints;
    const finalTotal = this.game.playerPoints;

    switch (this.scoreAnimationPhase) {
      case 0: // Animate consumed socks
        this.consumedSocksDisplay = Math.min(
          consumedSocks,
          Math.floor(this.scoreAnimationTimer / 10)
        );
        this.consumedPointsDisplay = this.consumedSocksDisplay * 5;
        if (this.consumedSocksDisplay >= consumedSocks) {
          this.scoreAnimationPhase = 1;
          this.scoreAnimationTimer = 0;
        }
        break;

      case 1: // Animate extra sock balls
        this.extraSockBallsDisplay = Math.min(
          extraSockBalls,
          Math.floor(this.scoreAnimationTimer / 10)
        );
        this.extraPointsDisplay = this.extraSockBallsDisplay * 10;
        if (this.extraSockBallsDisplay >= extraSockBalls) {
          this.scoreAnimationPhase = 2;
          this.scoreAnimationTimer = 0;
        }
        break;

      case 2: // Animate total earned
        this.totalPointsDisplay = Math.min(
          totalPointsEarned,
          Math.floor(this.scoreAnimationTimer / 5)
        );
        if (this.totalPointsDisplay >= totalPointsEarned) {
          this.scoreAnimationPhase = 3;
          this.scoreAnimationTimer = 0;
        }
        break;

      case 3: // Animate final total
        this.finalTotalDisplay = Math.min(
          finalTotal,
          Math.floor(this.scoreAnimationTimer / 3)
        );
        break;
    }
  }

  updateParticles(timeMultiplier) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.x += particle.vx * timeMultiplier;
      particle.y += particle.vy * timeMultiplier;
      particle.life -= particle.decay * timeMultiplier;

      if (particle.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  addRandomParticle() {
    const canvasWidth = this.game.getCanvasWidth();
    const canvasHeight = this.game.getCanvasHeight();
    const particleSize = this.game.getScaledValue(4);

    this.particles.push({
      x: Math.random() * canvasWidth,
      y: canvasHeight + this.game.getScaledValue(10),
      vx: (Math.random() - 0.5) * 2,
      vy: -Math.random() * 3 - 1,
      size: particleSize + Math.random() * particleSize,
      color: this.getRandomColor(),
      life: 1.0,
      decay: 0.01 + Math.random() * 0.01,
    });
  }

  handleMouseMove(x, y) {
    // Check if mouse is over continue button
    this.continueButton.hovered =
      x >= this.continueButton.x &&
      x <= this.continueButton.x + this.continueButton.width &&
      y >= this.continueButton.y &&
      y <= this.continueButton.y + this.continueButton.height;
  }

  handleMouseDown(x, y) {
    if (this.continueButton.hovered) {
      this.continueButton.pressed = true;
    }
  }

  handleMouseUp() {
    this.continueButton.pressed = false;
  }

  handleClick(x, y) {
    if (this.continueButton.hovered) {
      this.game.gameState = "menu";
    }
  }

  render(ctx) {
    // Apply entrance animation transform
    const scale = this.easeOutBack(this.animationProgress);
    const alpha = this.animationProgress;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(
      this.game.getCanvasWidth() / 2,
      this.game.getCanvasHeight() / 2
    );
    ctx.scale(scale, scale);
    ctx.translate(
      -this.game.getCanvasWidth() / 2,
      -this.game.getCanvasHeight() / 2
    );

    // Draw particles
    this.renderParticles(ctx);

    // Draw main container
    this.renderMainContainer(ctx);

    // Draw content
    this.renderContent(ctx);

    // Draw continue button
    this.renderContinueButton(ctx);

    ctx.restore();
  }

  renderParticles(ctx) {
    ctx.save();
    for (const particle of this.particles) {
      ctx.globalAlpha = particle.life;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  renderMainContainer(ctx) {
    const centerX = this.game.getCanvasWidth() / 2;
    const centerY = this.game.getCanvasHeight() / 2;

    // Draw backdrop
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(0, 0, this.game.getCanvasWidth(), this.game.getCanvasHeight());

    // Draw main card using centralized scaling
    const cardSize = this.game.getScaledSize(500, 400);
    const cardX = centerX - cardSize.width / 2;
    const cardY = centerY - cardSize.height / 2;

    // Card shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.fillRect(
      cardX + this.game.getScaledValue(5),
      cardY + this.game.getScaledValue(5),
      cardSize.width,
      cardSize.height
    );

    // Card background
    const gradient = ctx.createLinearGradient(
      cardX,
      cardY,
      cardX,
      cardY + cardSize.height
    );
    gradient.addColorStop(0, "#2c3e50");
    gradient.addColorStop(1, "#34495e");
    ctx.fillStyle = gradient;
    ctx.fillRect(cardX, cardY, cardSize.width, cardSize.height);

    // Card border
    ctx.strokeStyle = "#3498db";
    ctx.lineWidth = this.game.getScaledValue(3);
    ctx.strokeRect(cardX, cardY, cardSize.width, cardSize.height);

    // Glow effect
    ctx.shadowColor = "#3498db";
    ctx.shadowBlur = this.game.getScaledValue(20);
    ctx.strokeRect(cardX, cardY, cardSize.width, cardSize.height);
    ctx.shadowBlur = 0;
  }

  renderContent(ctx) {
    const centerX = this.game.getCanvasWidth() / 2;
    const centerY = this.game.getCanvasHeight() / 2;

    // Title using centralized scaling
    const titleFontSize = this.game.getScaledValue(48);
    ctx.fillStyle = "#FFD700";
    ctx.font = `bold ${titleFontSize}px Courier New`;
    ctx.textAlign = "center";
    ctx.fillText(
      "LEVEL COMPLETE!",
      centerX,
      centerY - this.game.getScaledValue(150)
    );

    // Add title shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillText(
      "LEVEL COMPLETE!",
      centerX + this.game.getScaledValue(2),
      centerY - this.game.getScaledValue(148)
    );

    // Score breakdown using centralized scaling
    ctx.fillStyle = "#ecf0f1";
    const contentFontSize = this.game.getScaledValue(20);
    ctx.font = `${contentFontSize}px Courier New`;

    const lineHeight = this.game.getScaledValue(30);
    let currentY = centerY - this.game.getScaledValue(80);

    // Consumed socks
    ctx.fillText(
      `Socks Fed to Martha: ${this.consumedSocksDisplay} × 5 = ${this.consumedPointsDisplay} pts`,
      centerX,
      currentY
    );
    currentY += lineHeight;

    // Extra sock balls
    ctx.fillText(
      `Extra Sock Balls: ${this.extraSockBallsDisplay} × 10 = ${this.extraPointsDisplay} pts`,
      centerX,
      currentY
    );
    currentY += lineHeight;

    // Divider line
    ctx.strokeStyle = "#95a5a6";
    ctx.lineWidth = this.game.getScaledValue(2);
    ctx.beginPath();
    ctx.moveTo(
      centerX - this.game.getScaledValue(150),
      currentY + this.game.getScaledValue(10)
    );
    ctx.lineTo(
      centerX + this.game.getScaledValue(150),
      currentY + this.game.getScaledValue(10)
    );
    ctx.stroke();
    currentY += this.game.getScaledValue(30);

    // Total earned
    ctx.fillStyle = "#2ecc71";
    const totalFontSize = this.game.getScaledValue(24);
    ctx.font = `bold ${totalFontSize}px Courier New`;
    ctx.fillText(
      `Points Earned: ${this.totalPointsDisplay}`,
      centerX,
      currentY
    );
    currentY += lineHeight + this.game.getScaledValue(10);

    // Final total
    ctx.fillStyle = "#f39c12";
    const finalFontSize = this.game.getScaledValue(28);
    ctx.font = `bold ${finalFontSize}px Courier New`;
    ctx.fillText(`Total Points: ${this.finalTotalDisplay}`, centerX, currentY);
  }

  renderContinueButton(ctx) {
    const button = this.continueButton;

    // Button background
    let buttonColor = "#3498db";
    if (button.pressed) {
      buttonColor = "#2980b9";
    } else if (button.hovered) {
      buttonColor = "#5dade2";
    }

    ctx.fillStyle = buttonColor;
    ctx.fillRect(button.x, button.y, button.width, button.height);

    // Button border
    ctx.strokeStyle = "#2980b9";
    ctx.lineWidth = this.game.getScaledValue(2);
    ctx.strokeRect(button.x, button.y, button.width, button.height);

    // Button text
    const buttonFontSize = this.game.getScaledValue(18);
    ctx.fillStyle = "white";
    ctx.font = `bold ${buttonFontSize}px Courier New`;
    ctx.textAlign = "center";
    ctx.fillText(
      "CONTINUE",
      button.x + button.width / 2,
      button.y + button.height / 2 + this.game.getScaledValue(6)
    );

    // Button glow effect when hovered
    if (button.hovered) {
      ctx.shadowColor = "#3498db";
      ctx.shadowBlur = this.game.getScaledValue(15);
      ctx.strokeRect(button.x, button.y, button.width, button.height);
      ctx.shadowBlur = 0;
    }
  }

  easeOutBack(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }
}
