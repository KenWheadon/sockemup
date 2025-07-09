// 📁 martha-manager.js - Manages Martha's AI, movement patterns, and behavior

class MarthaManager {
  constructor(game) {
    this.game = game;
    this.canvas = game.canvas;
    this.ctx = game.ctx;

    // Martha's position and size
    this.x = 600;
    this.y = 300;
    this.width = GameConfig.MARTHA_SIZE.width;
    this.height = GameConfig.MARTHA_SIZE.height;
    this.scale = 1;

    // Movement state
    this.velocity = { x: 0, y: 0 };
    this.direction = 1; // 1 or -1
    this.currentPattern = "horizontal";
    this.patternData = {};
    this.patternTimer = 0;
    this.patternSwitchTimer = 0;
    this.patternSwitchInterval = 3000; // Switch patterns every 3 seconds

    // Animation state
    this.animationFrame = 0;
    this.animationSpeed = 5;
    this.facingRight = true;

    // Hit effects
    this.hitEffect = {
      active: false,
      timer: 0,
      flashTimer: 0,
      knockbackVelocity: { x: 0, y: 0 },
      pointPopups: [],
    };

    // State management
    this.onScreen = true;
    this.isExiting = false;
    this.isEntering = false;
    this.exitDirection = 1; // 1 for right, -1 for left

    // Sockball collection
    this.collectedSockballs = 0;
    this.targetSockballs = 0;
    this.sockballsWanted = 0;

    // Level configuration
    this.speed = 1;
    this.availablePatterns = ["horizontal"];
    this.patternSpeed = 1;

    // Bounds
    this.bounds = {
      left: GameConfig.THROWING_BOUNDS.LEFT,
      right: GameConfig.THROWING_BOUNDS.RIGHT,
      top: GameConfig.THROWING_BOUNDS.TOP,
      bottom: GameConfig.THROWING_BOUNDS.BOTTOM,
    };
  }

  setup(level) {
    // Reset state
    this.collectedSockballs = 0;
    this.targetSockballs = level.marthaWantsSockballs;
    this.sockballsWanted = level.marthaWantsSockballs;
    this.speed = level.marthaSpeed;
    this.availablePatterns = level.marthaPatterns;
    this.patternSpeed = level.marthaPatternSpeed;

    // Reset position
    this.x = this.bounds.left + (this.bounds.right - this.bounds.left) / 2;
    this.y = this.bounds.top + (this.bounds.bottom - this.bounds.top) / 2;

    // Reset state flags
    this.onScreen = true;
    this.isExiting = false;
    this.isEntering = false;

    // Reset hit effects
    this.hitEffect.active = false;
    this.hitEffect.pointPopups = [];

    // Initialize first pattern
    this.switchPattern();
  }

  update(deltaTime) {
    this.animationFrame += deltaTime / 16.67; // Normalize to 60fps
    this.patternTimer += deltaTime;
    this.patternSwitchTimer += deltaTime;

    // Update hit effects
    this.updateHitEffects(deltaTime);

    // Handle pattern switching
    if (this.patternSwitchTimer >= this.patternSwitchInterval) {
      this.switchPattern();
      this.patternSwitchTimer = 0;
    }

    // Update movement based on current state
    if (this.isExiting) {
      this.updateExitMovement(deltaTime);
    } else if (this.isEntering) {
      this.updateEnterMovement(deltaTime);
    } else if (this.onScreen) {
      this.updatePatternMovement(deltaTime);
    }

    // Apply velocity and bounds checking
    this.applyMovement(deltaTime);
  }

  updateHitEffects(deltaTime) {
    if (this.hitEffect.active) {
      this.hitEffect.timer -= deltaTime;
      this.hitEffect.flashTimer += deltaTime;

      // Apply knockback
      this.x += this.hitEffect.knockbackVelocity.x;
      this.y += this.hitEffect.knockbackVelocity.y;

      // Reduce knockback velocity
      this.hitEffect.knockbackVelocity.x *= 0.9;
      this.hitEffect.knockbackVelocity.y *= 0.9;

      if (this.hitEffect.timer <= 0) {
        this.hitEffect.active = false;
      }
    }

    // Update point popups
    this.hitEffect.pointPopups = this.hitEffect.pointPopups.filter((popup) => {
      popup.timer -= deltaTime;
      popup.y -= popup.velocity * (deltaTime / 16.67);
      popup.velocity *= 0.98;
      return popup.timer > 0;
    });
  }

  updateExitMovement(deltaTime) {
    const exitSpeed = this.speed * 3; // Exit quickly
    this.velocity.x = this.exitDirection * exitSpeed;
    this.velocity.y = 0;

    // Check if Martha is off screen
    if (
      this.exitDirection > 0 &&
      this.x > this.game.getCanvasWidth() + this.width
    ) {
      this.onScreen = false;
      this.isExiting = false;
    } else if (this.exitDirection < 0 && this.x < -this.width) {
      this.onScreen = false;
      this.isExiting = false;
    }
  }

  updateEnterMovement(deltaTime) {
    const enterSpeed = this.speed * 2; // Enter at moderate speed
    this.velocity.x = this.exitDirection * enterSpeed;
    this.velocity.y = 0;

    // Check if Martha is back on screen
    if (this.exitDirection > 0 && this.x < this.bounds.right - this.width) {
      this.isEntering = false;
      this.x = this.bounds.right - this.width;
    } else if (this.exitDirection < 0 && this.x > this.bounds.left) {
      this.isEntering = false;
      this.x = this.bounds.left;
    }
  }

  updatePatternMovement(deltaTime) {
    const timeMultiplier = deltaTime / 16.67;

    switch (this.currentPattern) {
      case "horizontal":
        this.updateHorizontalPattern(timeMultiplier);
        break;
      case "vertical":
        this.updateVerticalPattern(timeMultiplier);
        break;
      case "diagonal":
        this.updateDiagonalPattern(timeMultiplier);
        break;
      case "circular":
        this.updateCircularPattern(timeMultiplier);
        break;
      case "random":
        this.updateRandomPattern(timeMultiplier);
        break;
    }
  }

  updateHorizontalPattern(timeMultiplier) {
    const baseSpeed = GameConfig.MARTHA_PATTERNS.HORIZONTAL.baseSpeed;
    this.velocity.x =
      this.direction * baseSpeed * this.patternSpeed * timeMultiplier;
    this.velocity.y = 0;

    // Bounce off horizontal bounds
    if (
      this.x <= this.bounds.left ||
      this.x >= this.bounds.right - this.width
    ) {
      this.direction *= -1;
      this.facingRight = this.direction > 0;
    }
  }

  updateVerticalPattern(timeMultiplier) {
    const baseSpeed = GameConfig.MARTHA_PATTERNS.VERTICAL.baseSpeed;
    this.velocity.x = 0;
    this.velocity.y =
      this.direction * baseSpeed * this.patternSpeed * timeMultiplier;

    // Bounce off vertical bounds
    if (
      this.y <= this.bounds.top ||
      this.y >= this.bounds.bottom - this.height
    ) {
      this.direction *= -1;
    }
  }

  updateDiagonalPattern(timeMultiplier) {
    const baseSpeed = GameConfig.MARTHA_PATTERNS.DIAGONAL.baseSpeed;
    if (!this.patternData.diagonalDirection) {
      this.patternData.diagonalDirection = { x: 1, y: 1 };
    }

    this.velocity.x =
      this.patternData.diagonalDirection.x *
      baseSpeed *
      this.patternSpeed *
      timeMultiplier;
    this.velocity.y =
      this.patternData.diagonalDirection.y *
      baseSpeed *
      this.patternSpeed *
      timeMultiplier;

    // Bounce off bounds
    if (
      this.x <= this.bounds.left ||
      this.x >= this.bounds.right - this.width
    ) {
      this.patternData.diagonalDirection.x *= -1;
      this.facingRight = this.patternData.diagonalDirection.x > 0;
    }
    if (
      this.y <= this.bounds.top ||
      this.y >= this.bounds.bottom - this.height
    ) {
      this.patternData.diagonalDirection.y *= -1;
    }
  }

  updateCircularPattern(timeMultiplier) {
    const baseSpeed = GameConfig.MARTHA_PATTERNS.CIRCULAR.baseSpeed;
    if (!this.patternData.circularAngle) {
      this.patternData.circularAngle = 0;
      this.patternData.centerX =
        this.bounds.left + (this.bounds.right - this.bounds.left) / 2;
      this.patternData.centerY =
        this.bounds.top + (this.bounds.bottom - this.bounds.top) / 2;
      this.patternData.radius = Math.min(
        (this.bounds.right - this.bounds.left) / 4,
        (this.bounds.bottom - this.bounds.top) / 4
      );
    }

    this.patternData.circularAngle +=
      baseSpeed * this.patternSpeed * timeMultiplier * 0.02;

    const targetX =
      this.patternData.centerX +
      Math.cos(this.patternData.circularAngle) * this.patternData.radius;
    const targetY =
      this.patternData.centerY +
      Math.sin(this.patternData.circularAngle) * this.patternData.radius;

    this.velocity.x = (targetX - this.x) * 0.1;
    this.velocity.y = (targetY - this.y) * 0.1;

    this.facingRight = this.velocity.x > 0;
  }

  updateRandomPattern(timeMultiplier) {
    const baseSpeed = GameConfig.MARTHA_PATTERNS.RANDOM.baseSpeed;

    // Change direction randomly
    if (Math.random() < 0.02) {
      this.patternData.randomDirection = {
        x: (Math.random() - 0.5) * 2,
        y: (Math.random() - 0.5) * 2,
      };
    }

    if (!this.patternData.randomDirection) {
      this.patternData.randomDirection = { x: 1, y: 0 };
    }

    this.velocity.x =
      this.patternData.randomDirection.x *
      baseSpeed *
      this.patternSpeed *
      timeMultiplier;
    this.velocity.y =
      this.patternData.randomDirection.y *
      baseSpeed *
      this.patternSpeed *
      timeMultiplier;

    this.facingRight = this.velocity.x > 0;
  }

  applyMovement(deltaTime) {
    // Apply velocity
    this.x += this.velocity.x;
    this.y += this.velocity.y;

    // Bounds checking for normal movement (not exit/enter)
    if (!this.isExiting && !this.isEntering) {
      if (this.x < this.bounds.left) this.x = this.bounds.left;
      if (this.x > this.bounds.right - this.width)
        this.x = this.bounds.right - this.width;
      if (this.y < this.bounds.top) this.y = this.bounds.top;
      if (this.y > this.bounds.bottom - this.height)
        this.y = this.bounds.bottom - this.height;
    }
  }

  switchPattern() {
    if (this.availablePatterns.length > 0) {
      this.currentPattern =
        this.availablePatterns[
          Math.floor(Math.random() * this.availablePatterns.length)
        ];
      this.patternData = {};
      this.patternTimer = 0;

      // Reset direction for new pattern
      this.direction = Math.random() < 0.5 ? 1 : -1;
    }
  }

  hitBySockball(sockball) {
    if (this.hitEffect.active) return false; // Already hit recently

    this.collectedSockballs++;

    // Activate hit effect
    this.hitEffect.active = true;
    this.hitEffect.timer = GameConfig.MARTHA_HIT_EFFECTS.FLASH_DURATION;
    this.hitEffect.flashTimer = 0;

    // Calculate knockback
    const knockbackForce = GameConfig.MARTHA_HIT_EFFECTS.KNOCKBACK_DISTANCE;
    const angle = Math.atan2(sockball.y - this.y, sockball.x - this.x);
    this.hitEffect.knockbackVelocity = {
      x: Math.cos(angle) * knockbackForce,
      y: Math.sin(angle) * knockbackForce,
    };

    // Add point popup
    this.hitEffect.pointPopups.push({
      x: this.x + this.width / 2,
      y: this.y,
      text: "+" + GameConfig.POINTS_PER_SOCK,
      timer: GameConfig.MARTHA_HIT_EFFECTS.POINT_POP_DURATION,
      velocity: 2,
    });

    return true;
  }

  checkCollision(sockball) {
    const sockballRadius = GameConfig.SOCKBALL_SIZE / 2;
    const marthaRect = {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };

    // Simple rectangle-circle collision
    const closestX = Math.max(
      marthaRect.x,
      Math.min(sockball.x, marthaRect.x + marthaRect.width)
    );
    const closestY = Math.max(
      marthaRect.y,
      Math.min(sockball.y, marthaRect.y + marthaRect.height)
    );

    const distanceX = sockball.x - closestX;
    const distanceY = sockball.y - closestY;
    const distanceSquared = distanceX * distanceX + distanceY * distanceY;

    return distanceSquared < sockballRadius * sockballRadius;
  }

  startExit() {
    this.isExiting = true;
    this.exitDirection = Math.random() < 0.5 ? 1 : -1;
    this.facingRight = this.exitDirection > 0;
  }

  startEnter() {
    this.isEntering = true;
    this.onScreen = true;

    // Position Martha off screen in the opposite direction
    if (this.exitDirection > 0) {
      this.x = -this.width;
    } else {
      this.x = this.game.getCanvasWidth() + this.width;
    }

    this.exitDirection *= -1; // Reverse direction for entering
  }

  hasCollectedEnoughSockballs() {
    return this.collectedSockballs >= this.sockballsWanted;
  }

  needsMoreSockballs() {
    return this.collectedSockballs < this.sockballsWanted;
  }

  render(ctx) {
    if (!this.onScreen && !this.isEntering) return;

    ctx.save();

    // Apply hit flash effect
    if (this.hitEffect.active) {
      const flashIntensity =
        Math.sin(this.hitEffect.flashTimer * 0.3) * 0.5 + 0.5;
      ctx.filter = `brightness(${100 + flashIntensity * 100}%) saturate(${
        100 + flashIntensity * 50
      }%)`;
    }

    // Draw Martha
    const marthaImage = this.game.images["martha.png"];
    if (marthaImage) {
      ctx.save();

      // Flip horizontally if facing left
      if (!this.facingRight) {
        ctx.translate(this.x + this.width, this.y);
        ctx.scale(-1, 1);
        ctx.drawImage(marthaImage, 0, 0, this.width, this.height);
      } else {
        ctx.drawImage(marthaImage, this.x, this.y, this.width, this.height);
      }

      ctx.restore();
    } else {
      // Fallback rectangle
      ctx.fillStyle = this.hitEffect.active ? "#ff6b6b" : "#8b4513";
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    // Draw debug bounds
    if (GameConfig.DEBUG_PHYSICS_BOUNDS) {
      ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
      ctx.lineWidth = 2;
      ctx.strokeRect(
        this.bounds.left,
        this.bounds.top,
        this.bounds.right - this.bounds.left,
        this.bounds.bottom - this.bounds.top
      );
    }

    // Draw point popups
    this.hitEffect.pointPopups.forEach((popup) => {
      ctx.fillStyle = "#ffd700";
      ctx.font = `bold ${this.game.getScaledValue(20)}px Courier New`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(popup.text, popup.x, popup.y);
    });

    ctx.restore();
  }
}
