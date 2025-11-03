/**
 * MarthaCharacter - Manages the Martha landlord character on the level select screen
 * Handles Martha's appearance, animations, quotes, and interactions
 */
class MarthaCharacter {
  constructor(game) {
    this.game = game;

    // Martha display configuration
    this.MARTHA_CONFIG = {
      offsetX: 150,
      offsetY: 250,
      maxSize: 200,
      maintainAspectRatio: true,
    };

    // Martha image size (calculated)
    this.marthaImageSize = { width: 0, height: 0 };

    // Martha wiggle animation state
    this.marthaWiggleTimer = 0;
    this.marthaWiggling = false;

    // Martha laughing animation state
    this.marthaLaughing = false;
    this.marthaLaughFrameIndex = 0;
    this.marthaLaughAnimationTimer = 0;

    // Martha quote system - rotating speech bubbles
    this.marthaQuotes = [
      "Rent's due, kiddo!",
      "I could 10x my rates if you just leave...",
      "I want to evict you, so you better not pay rent!",
      "Your lease is up for renewal... at 2x the price!",
      "You should go camping, I won't change the locks on you or anything....",
      "You know what? Your socks STINK!",
      "I've got 10 other tenants ready to pay more!",
      "Ever thought about moving? Like, today?",
      "I wish I wasn't so tiny...",
      "I'm quadrupling rent next month!",
      "If you leave, don't take your socks!",
      "I need your room for my pet rock collection.",
      "Your neighbors complained about your sock sorting!",
      "Time to pay up or ship out!",
      "I'm thinking about converting this place to a juice bar!",
    ];
    this.currentQuoteIndex = 0;
    this.currentQuote = this.marthaQuotes[0];
    this.quoteTimer = 0;
    this.quoteRotationInterval = 7500;
    this.quoteDisplayTime = 0;
    this.showingQuote = true;
  }

  /**
   * Calculate Martha's image size based on configuration
   */
  calculateMarthaImageSize() {
    const marthaImage = this.game.images["martha-demand-level-select.png"];
    if (!marthaImage) {
      this.marthaImageSize = { width: 0, height: 0 };
      return;
    }

    const maxSize = this.game.getScaledValue(this.MARTHA_CONFIG.maxSize);

    if (this.MARTHA_CONFIG.maintainAspectRatio) {
      const aspectRatio = marthaImage.width / marthaImage.height;

      if (aspectRatio > 1) {
        this.marthaImageSize.width = maxSize;
        this.marthaImageSize.height = maxSize / aspectRatio;
      } else {
        this.marthaImageSize.width = maxSize * aspectRatio;
        this.marthaImageSize.height = maxSize;
      }
    } else {
      this.marthaImageSize.width = maxSize;
      this.marthaImageSize.height = maxSize;
    }
  }

  /**
   * Setup Martha for the level select screen
   */
  setup() {
    this.currentQuoteIndex = 0;
    this.currentQuote = this.marthaQuotes[0];
    this.quoteTimer = 0;
    this.quoteDisplayTime = 0;
    this.showingQuote = true;
  }

  /**
   * Cycle to the next quote in the rotation
   */
  cycleToNextQuote() {
    this.currentQuoteIndex =
      (this.currentQuoteIndex + 1) % this.marthaQuotes.length;
    this.currentQuote = this.marthaQuotes[this.currentQuoteIndex];
    this.quoteTimer = 0;
    this.quoteDisplayTime = 0;
  }

  /**
   * Trigger Martha's laugh animation and sound
   */
  triggerLaugh() {
    // Only start animation if not already playing
    if (!this.marthaLaughing) {
      this.marthaLaughing = true;
      this.marthaLaughFrameIndex = 0;
      this.marthaLaughAnimationTimer = 0;
      // Play random goblin sound (8 different sounds)
      this.game.audioManager.playRandomSound("goblin-sound", 8, false, 0.7);
    }
  }

  /**
   * Trigger Martha's wiggle animation (when receiving sockballs)
   */
  triggerWiggle() {
    this.marthaWiggling = true;
    this.marthaWiggleTimer = 0;
  }

  /**
   * Check if a point (x, y) is clicking on Martha
   */
  isMarthaClicked(x, y, layout) {
    if (!layout.marthaX || !layout.marthaY) return false;

    const marthaLeft = layout.marthaX - layout.marthaWidth / 2;
    const marthaRight = layout.marthaX + layout.marthaWidth / 2;
    const marthaTop = layout.marthaY - layout.marthaHeight / 2;
    const marthaBottom = layout.marthaY + layout.marthaHeight / 2;

    return (
      x >= marthaLeft && x <= marthaRight && y >= marthaTop && y <= marthaBottom
    );
  }

  /**
   * Handle Martha being clicked
   */
  handleClick(x, y, layout) {
    if (this.isMarthaClicked(x, y, layout)) {
      this.cycleToNextQuote();
      this.triggerLaugh();
      return true;
    }
    return false;
  }

  /**
   * Update Martha's animations and quote system
   */
  update(deltaTime) {
    // Update wiggle animation
    if (this.marthaWiggling) {
      this.marthaWiggleTimer += deltaTime;
      if (this.marthaWiggleTimer >= 1000) {
        this.marthaWiggling = false;
        this.marthaWiggleTimer = 0;
      }
    }

    // Update Martha laughing animation
    if (this.marthaLaughing) {
      this.marthaLaughAnimationTimer += deltaTime;
      const spritesheet = GameConfig.MARTHA_LAUGHING_SPRITESHEET;
      const frameTime = 1000 / spritesheet.fps;

      if (this.marthaLaughAnimationTimer >= frameTime) {
        this.marthaLaughFrameIndex++;
        this.marthaLaughAnimationTimer = 0;

        // Check if animation is complete
        if (this.marthaLaughFrameIndex >= spritesheet.animationFrames.length) {
          this.marthaLaughing = false;
          this.marthaLaughFrameIndex = 0;
        }
      }
    }

    // Update quote rotation timer
    this.quoteTimer += deltaTime;
    if (this.quoteTimer >= this.quoteRotationInterval) {
      this.cycleToNextQuote();
    }
  }

  /**
   * Render Martha image with animations
   */
  renderMarthaImage(ctx, layout) {
    ctx.save();

    // Apply wiggle if active
    if (this.marthaWiggling) {
      const wiggleAmount = Math.sin(this.marthaWiggleTimer * 0.02) * 5;
      ctx.translate(layout.marthaX + wiggleAmount, layout.marthaY);
    } else {
      ctx.translate(layout.marthaX, layout.marthaY);
    }

    // Render either the spritesheet animation or the static image
    if (this.marthaLaughing) {
      // Draw spritesheet animation with correct aspect ratio
      const spritesheet = GameConfig.MARTHA_LAUGHING_SPRITESHEET;
      const marthaImage = this.game.images[spritesheet.filename];

      if (marthaImage && marthaImage.complete && marthaImage.naturalWidth > 0) {
        const frameNumber =
          spritesheet.animationFrames[this.marthaLaughFrameIndex];
        const col = frameNumber % spritesheet.columns;
        const row = Math.floor(frameNumber / spritesheet.columns);
        const sx = col * spritesheet.frameWidth;
        const sy = row * spritesheet.frameHeight;

        // Calculate correct dimensions maintaining spritesheet aspect ratio
        // Match the width to the static image and calculate height proportionally, then scale up by 20%
        const spritesheetAspectRatio =
          spritesheet.frameWidth / spritesheet.frameHeight;
        const drawWidth = layout.marthaWidth * 1.3;
        const drawHeight = (layout.marthaWidth / spritesheetAspectRatio) * 1.3;

        ctx.drawImage(
          marthaImage,
          sx,
          sy,
          spritesheet.frameWidth,
          spritesheet.frameHeight,
          -drawWidth / 2,
          -drawHeight / 2,
          drawWidth,
          drawHeight
        );
      }
    } else {
      // Draw static image
      if (this.game.images["martha-demand-level-select.png"]) {
        ctx.drawImage(
          this.game.images["martha-demand-level-select.png"],
          -layout.marthaWidth / 2,
          -layout.marthaHeight / 2,
          layout.marthaWidth,
          layout.marthaHeight
        );
      }
    }

    ctx.restore();
  }

  /**
   * Render Martha's quote bubble
   */
  renderMarthaQuote(ctx, layout, renderTextFn) {
    if (!this.showingQuote || !this.currentQuote) return;

    ctx.save();

    // No fade animations - quote is always fully visible
    const alpha = 1;

    // Position quote bubble below Martha
    const bubbleX = layout.marthaX;
    const bubbleY =
      layout.marthaY + layout.marthaHeight / 2 + this.game.getScaledValue(60);

    const padding = this.game.getScaledValue(15);
    const fontSize = this.game.getScaledValue(16);
    const maxWidth = this.game.getScaledValue(280);

    // Measure text
    ctx.font = `bold ${fontSize}px Arial`;
    const words = this.currentQuote.split(" ");
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const testLine = currentLine + " " + words[i];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth - padding * 2) {
        lines.push(currentLine);
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine);

    const lineHeight = fontSize * 1.3;
    const bubbleWidth = Math.min(
      maxWidth,
      Math.max(...lines.map((line) => ctx.measureText(line).width)) +
        padding * 2
    );
    const bubbleHeight = lines.length * lineHeight + padding * 2;

    // Draw speech bubble tail pointing upward
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
    ctx.strokeStyle = "rgba(0, 0, 0, 0.8)";
    ctx.lineWidth = this.game.getScaledValue(2);

    const tailSize = this.game.getScaledValue(15);
    ctx.beginPath();
    // Move tail point up by tailSize so it extends above the bubble
    ctx.moveTo(bubbleX, bubbleY - bubbleHeight / 2 - tailSize);
    ctx.lineTo(bubbleX - tailSize / 2, bubbleY - bubbleHeight / 2);
    ctx.lineTo(bubbleX + tailSize / 2, bubbleY - bubbleHeight / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw bubble background
    const radius = this.game.getScaledValue(10);
    const bubbleLeft = bubbleX - bubbleWidth / 2;
    const bubbleTop = bubbleY - bubbleHeight / 2;

    ctx.beginPath();
    ctx.moveTo(bubbleLeft + radius, bubbleTop);
    ctx.lineTo(bubbleLeft + bubbleWidth - radius, bubbleTop);
    ctx.arcTo(
      bubbleLeft + bubbleWidth,
      bubbleTop,
      bubbleLeft + bubbleWidth,
      bubbleTop + radius,
      radius
    );
    ctx.lineTo(bubbleLeft + bubbleWidth, bubbleTop + bubbleHeight - radius);
    ctx.arcTo(
      bubbleLeft + bubbleWidth,
      bubbleTop + bubbleHeight,
      bubbleLeft + bubbleWidth - radius,
      bubbleTop + bubbleHeight,
      radius
    );
    ctx.lineTo(bubbleLeft + radius, bubbleTop + bubbleHeight);
    ctx.arcTo(
      bubbleLeft,
      bubbleTop + bubbleHeight,
      bubbleLeft,
      bubbleTop + bubbleHeight - radius,
      radius
    );
    ctx.lineTo(bubbleLeft, bubbleTop + radius);
    ctx.arcTo(bubbleLeft, bubbleTop, bubbleLeft + radius, bubbleTop, radius);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw text
    ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const textStartY = bubbleY - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((line, index) => {
      ctx.fillText(line, bubbleX, textStartY + index * lineHeight);
    });

    ctx.restore();
  }

  /**
   * Render Martha - both image and quote
   */
  render(ctx, layout, renderTextFn) {
    this.renderMarthaImage(ctx, layout);
    this.renderMarthaQuote(ctx, layout, renderTextFn);
  }

  /**
   * Get Martha's layout information for the layout cache
   */
  getLayoutInfo(barHeight) {
    return {
      marthaX: this.game.getScaledValue(this.MARTHA_CONFIG.offsetX),
      marthaY: barHeight + this.game.getScaledValue(this.MARTHA_CONFIG.offsetY),
      marthaWidth: this.marthaImageSize.width,
      marthaHeight: this.marthaImageSize.height,
    };
  }
}
