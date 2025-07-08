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

    // Calculate button position
    this.continueButton.x =
      this.game.canvas.width / 2 - this.continueButton.width / 2;
    this.continueButton.y = this.game.canvas.height / 2 + 200;

    // Initialize particles
    this.particles = [];
    this.particleTimer = 0;

    // Create celebration particles
    this.createCelebrationParticles();
  }

  createCelebrationParticles() {
    for (let i = 0; i < 20; i++) {
      this.particles.push({
        x: Math.random() * this.game.canvas.width,
        y: Math.random() * this.game.canvas.height,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        size: Math.random() * 6 + 2,
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

  update() {
    // Update main animation
    if (this.animationState === "entering") {
      this.animationProgress += this.animationSpeed;
      if (this.animationProgress >= 1) {
        this.animationProgress = 1;
        this.animationState = "showing";
      }
    }

    // Update score animation
    if (this.animationState === "showing") {
      this.updateScoreAnimation();
    }

    // Update particles
    this.updateParticles();

    // Update particle timer
    this.particleTimer++;
    if (this.particleTimer % 30 === 0) {
      this.addRandomParticle();
    }
  }

  updateScoreAnimation() {
    this.scoreAnimationTimer += 2;

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

  updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life -= particle.decay;

      if (particle.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  addRandomParticle() {
    this.particles.push({
      x: Math.random() * this.game.canvas.width,
      y: this.game.canvas.height + 10,
      vx: (Math.random() - 0.5) * 2,
      vy: -Math.random() * 3 - 1,
      size: Math.random() * 4 + 1,
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
    ctx.translate(this.game.canvas.width / 2, this.game.canvas.height / 2);
    ctx.scale(scale, scale);
    ctx.translate(-this.game.canvas.width / 2, -this.game.canvas.height / 2);

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
    const centerX = this.game.canvas.width / 2;
    const centerY = this.game.canvas.height / 2;

    // Draw backdrop
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(0, 0, this.game.canvas.width, this.game.canvas.height);

    // Draw main card
    const cardWidth = 500;
    const cardHeight = 400;
    const cardX = centerX - cardWidth / 2;
    const cardY = centerY - cardHeight / 2;

    // Card shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.fillRect(cardX + 5, cardY + 5, cardWidth, cardHeight);

    // Card background
    const gradient = ctx.createLinearGradient(
      cardX,
      cardY,
      cardX,
      cardY + cardHeight
    );
    gradient.addColorStop(0, "#2c3e50");
    gradient.addColorStop(1, "#34495e");
    ctx.fillStyle = gradient;
    ctx.fillRect(cardX, cardY, cardWidth, cardHeight);

    // Card border
    ctx.strokeStyle = "#3498db";
    ctx.lineWidth = 3;
    ctx.strokeRect(cardX, cardY, cardWidth, cardHeight);

    // Glow effect
    ctx.shadowColor = "#3498db";
    ctx.shadowBlur = 20;
    ctx.strokeRect(cardX, cardY, cardWidth, cardHeight);
    ctx.shadowBlur = 0;
  }

  renderContent(ctx) {
    const centerX = this.game.canvas.width / 2;
    const centerY = this.game.canvas.height / 2;

    // Title
    ctx.fillStyle = "#FFD700";
    ctx.font = "bold 48px Courier New";
    ctx.textAlign = "center";
    ctx.fillText("LEVEL COMPLETE!", centerX, centerY - 150);

    // Add title shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillText("LEVEL COMPLETE!", centerX + 2, centerY - 148);

    // Score breakdown
    ctx.fillStyle = "#ecf0f1";
    ctx.font = "20px Courier New";

    const lineHeight = 30;
    let currentY = centerY - 80;

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
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX - 150, currentY + 10);
    ctx.lineTo(centerX + 150, currentY + 10);
    ctx.stroke();
    currentY += 30;

    // Total earned
    ctx.fillStyle = "#2ecc71";
    ctx.font = "bold 24px Courier New";
    ctx.fillText(
      `Points Earned: ${this.totalPointsDisplay}`,
      centerX,
      currentY
    );
    currentY += lineHeight + 10;

    // Final total
    ctx.fillStyle = "#f39c12";
    ctx.font = "bold 28px Courier New";
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
    ctx.lineWidth = 2;
    ctx.strokeRect(button.x, button.y, button.width, button.height);

    // Button text
    ctx.fillStyle = "white";
    ctx.font = "bold 18px Courier New";
    ctx.textAlign = "center";
    ctx.fillText(
      "CONTINUE",
      button.x + button.width / 2,
      button.y + button.height / 2 + 6
    );

    // Button glow effect when hovered
    if (button.hovered) {
      ctx.shadowColor = "#3498db";
      ctx.shadowBlur = 15;
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
