// 📁 story-manager.js - Phase 4.1 Story Intro System
// Manages the story intro sequence and modal displays

class StoryManager {
  constructor(game) {
    this.game = game;

    // Story state
    this.showingStory = false;
    this.currentSlideIndex = 0;
    this.slides = GameConfig.STORY_SLIDES;
    this.transitionProgress = 0;
    this.isTransitioning = false;
    this.transitionDuration = 300; // ms

    // UI elements
    this.slideContainer = {
      width: 0,
      height: 0,
      x: 0,
      y: 0,
      padding: 40,
    };

    this.buttons = {
      skip: { x: 0, y: 0, width: 100, height: 40, hovered: false },
      next: { x: 0, y: 0, width: 100, height: 40, hovered: false },
      previous: { x: 0, y: 0, width: 100, height: 40, hovered: false },
    };
  }

  // Start showing the story intro
  show() {
    this.showingStory = true;
    this.currentSlideIndex = 0;
    this.transitionProgress = 0;
    this.isTransitioning = false;
    this.calculateLayout();
  }

  // Hide the story intro
  hide() {
    this.showingStory = false;
    this.currentSlideIndex = 0;

    // Mark story as viewed
    if (!this.game.storyViewed) {
      this.game.storyViewed = true;
      this.game.saveGameData();
    }
  }

  // Check if we should show story (first time playing)
  shouldShowStory() {
    return !this.game.storyViewed;
  }

  calculateLayout() {
    const canvasWidth = this.game.getCanvasWidth();
    const canvasHeight = this.game.getCanvasHeight();

    // Center container
    const containerWidth = Math.min(
      this.game.getScaledValue(700),
      canvasWidth * 0.9
    );
    const containerHeight = Math.min(
      this.game.getScaledValue(500),
      canvasHeight * 0.8
    );

    this.slideContainer = {
      width: containerWidth,
      height: containerHeight,
      x: (canvasWidth - containerWidth) / 2,
      y: (canvasHeight - containerHeight) / 2,
      padding: this.game.getScaledValue(40),
    };

    // Position buttons
    const buttonY = this.slideContainer.y + containerHeight - 60;
    const buttonSpacing = this.game.getScaledValue(120);

    this.buttons.skip.x = this.slideContainer.x + 20;
    this.buttons.skip.y = buttonY;
    this.buttons.skip.width = this.game.getScaledValue(100);
    this.buttons.skip.height = this.game.getScaledValue(40);

    this.buttons.previous.x =
      canvasWidth / 2 - buttonSpacing - this.game.getScaledValue(50);
    this.buttons.previous.y = buttonY;
    this.buttons.previous.width = this.game.getScaledValue(100);
    this.buttons.previous.height = this.game.getScaledValue(40);

    this.buttons.next.x = canvasWidth / 2 + buttonSpacing / 2;
    this.buttons.next.y = buttonY;
    this.buttons.next.width = this.game.getScaledValue(100);
    this.buttons.next.height = this.game.getScaledValue(40);
  }

  update(deltaTime) {
    if (!this.showingStory) return;

    // Update transition animation
    if (this.isTransitioning) {
      this.transitionProgress += deltaTime / this.transitionDuration;
      if (this.transitionProgress >= 1) {
        this.transitionProgress = 1;
        this.isTransitioning = false;
      }
    }
  }

  handleMouseMove(x, y) {
    if (!this.showingStory) return false;

    // Check button hovers
    for (const key in this.buttons) {
      const button = this.buttons[key];
      const wasHovered = button.hovered;
      button.hovered = this.isPointInRect(x, y, button);
    }

    return true;
  }

  handleClick(x, y) {
    if (!this.showingStory) return false;

    // Skip button
    if (this.buttons.skip.hovered) {
      this.hide();
      return true;
    }

    // Previous button
    if (this.buttons.previous.hovered && this.currentSlideIndex > 0) {
      this.previousSlide();
      return true;
    }

    // Next button
    if (this.buttons.next.hovered) {
      if (this.currentSlideIndex < this.slides.length - 1) {
        this.nextSlide();
      } else {
        // Last slide - close story
        this.hide();
      }
      return true;
    }

    return true; // Consume click even if not on button
  }

  nextSlide() {
    if (this.currentSlideIndex < this.slides.length - 1) {
      this.currentSlideIndex++;
      this.startTransition();
    }
  }

  previousSlide() {
    if (this.currentSlideIndex > 0) {
      this.currentSlideIndex--;
      this.startTransition();
    }
  }

  startTransition() {
    this.isTransitioning = true;
    this.transitionProgress = 0;
  }

  isPointInRect(x, y, rect) {
    return (
      x >= rect.x &&
      x <= rect.x + rect.width &&
      y >= rect.y &&
      y <= rect.y + rect.height
    );
  }

  render(ctx) {
    if (!this.showingStory) return;

    ctx.save();

    // Darken background
    ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
    ctx.fillRect(0, 0, this.game.getCanvasWidth(), this.game.getCanvasHeight());

    // Render slide container
    this.renderSlideContainer(ctx);

    // Render current slide
    const currentSlide = this.slides[this.currentSlideIndex];
    if (currentSlide) {
      this.renderSlide(ctx, currentSlide);
    }

    // Render buttons
    this.renderButtons(ctx);

    // Render slide indicators
    this.renderSlideIndicators(ctx);

    ctx.restore();
  }

  renderSlideContainer(ctx) {
    const container = this.slideContainer;

    // Container background
    const gradient = ctx.createLinearGradient(
      container.x,
      container.y,
      container.x,
      container.y + container.height
    );
    gradient.addColorStop(0, "rgba(30, 30, 60, 0.95)");
    gradient.addColorStop(1, "rgba(20, 20, 40, 0.95)");

    ctx.fillStyle = gradient;
    this.drawRoundedRect(
      ctx,
      container.x,
      container.y,
      container.width,
      container.height,
      this.game.getScaledValue(15)
    );
    ctx.fill();

    // Container border
    ctx.strokeStyle = "rgba(100, 150, 255, 0.5)";
    ctx.lineWidth = this.game.getScaledValue(3);
    this.drawRoundedRect(
      ctx,
      container.x,
      container.y,
      container.width,
      container.height,
      this.game.getScaledValue(15)
    );
    ctx.stroke();
  }

  renderSlide(ctx, slide) {
    const container = this.slideContainer;
    const contentY = container.y + container.padding;

    // Apply transition animation
    let alpha = 1;
    if (this.isTransitioning) {
      alpha = this.easeInOut(this.transitionProgress);
    }

    ctx.globalAlpha = alpha;

    // Title
    ctx.fillStyle = "#FFD700";
    ctx.font = `bold ${this.game.getScaledValue(36)}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(slide.title, container.x + container.width / 2, contentY);

    // Image (if available)
    const image = this.game.images[slide.image];
    if (image) {
      const imageSize = this.game.getScaledValue(120);
      const imageX = container.x + container.width / 2 - imageSize / 2;
      const imageY = contentY + this.game.getScaledValue(60);

      ctx.drawImage(image, imageX, imageY, imageSize, imageSize);
    }

    // Text
    const textY = contentY + this.game.getScaledValue(200);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `${this.game.getScaledValue(20)}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    // Word wrap text
    this.wrapText(
      ctx,
      slide.text,
      container.x + container.width / 2,
      textY,
      container.width - container.padding * 2,
      this.game.getScaledValue(28)
    );

    ctx.globalAlpha = 1;
  }

  renderButtons(ctx) {
    // Skip button
    this.renderButton(ctx, this.buttons.skip, "Skip", "#888888");

    // Previous button (only if not on first slide)
    if (this.currentSlideIndex > 0) {
      this.renderButton(ctx, this.buttons.previous, "Previous", "#4A90E2");
    }

    // Next button
    const isLastSlide = this.currentSlideIndex === this.slides.length - 1;
    this.renderButton(
      ctx,
      this.buttons.next,
      isLastSlide ? "Start" : "Next",
      "#4CAF50"
    );
  }

  renderButton(ctx, button, text, color) {
    ctx.save();

    // Button background
    ctx.fillStyle = button.hovered ? color : `${color}CC`;
    this.drawRoundedRect(
      ctx,
      button.x,
      button.y,
      button.width,
      button.height,
      this.game.getScaledValue(8)
    );
    ctx.fill();

    // Button border
    ctx.strokeStyle = button.hovered ? "#FFFFFF" : "rgba(255, 255, 255, 0.5)";
    ctx.lineWidth = this.game.getScaledValue(2);
    this.drawRoundedRect(
      ctx,
      button.x,
      button.y,
      button.width,
      button.height,
      this.game.getScaledValue(8)
    );
    ctx.stroke();

    // Button text
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `bold ${this.game.getScaledValue(18)}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      text,
      button.x + button.width / 2,
      button.y + button.height / 2
    );

    ctx.restore();
  }

  renderSlideIndicators(ctx) {
    const container = this.slideContainer;
    const indicatorY = container.y + container.height - 100;
    const indicatorSize = this.game.getScaledValue(10);
    const indicatorSpacing = this.game.getScaledValue(15);
    const totalWidth =
      this.slides.length * indicatorSize +
      (this.slides.length - 1) * indicatorSpacing;
    let startX = container.x + container.width / 2 - totalWidth / 2;

    for (let i = 0; i < this.slides.length; i++) {
      ctx.fillStyle =
        i === this.currentSlideIndex
          ? "#FFD700"
          : "rgba(255, 255, 255, 0.3)";
      ctx.beginPath();
      ctx.arc(
        startX + indicatorSize / 2,
        indicatorY,
        indicatorSize / 2,
        0,
        Math.PI * 2
      );
      ctx.fill();

      startX += indicatorSize + indicatorSpacing;
    }
  }

  drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(" ");
    let line = "";
    let currentY = y;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;

      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, currentY);
        line = words[n] + " ";
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
  }

  easeInOut(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }
}
