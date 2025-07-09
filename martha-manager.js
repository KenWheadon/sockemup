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
    this.animationTimer = 0;
    this.currentFrameIndex = 0;
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

    // Bounds with buffer zones
    this.bounds = {
      left: GameConfig.THROWING_BOUNDS.LEFT,
      right: GameConfig.THROWING_BOUNDS.RIGHT,
      top: GameConfig.THROWING_BOUNDS.TOP,
      bottom: GameConfig.THROWING_BOUNDS.BOTTOM,
    };

    // AI improvement properties
    this.edgeBuffer = 50; // Distance from edge to start avoiding
    this.centerAttraction = 0.002; // How much Martha is attracted to center (much weaker)
    this.edgeRepulsion = 0.05; // How much Martha avoids edges (much weaker)
    this.lastEdgeHit = 0; // Timer to prevent rapid edge bouncing
    this.edgeHitCooldown = 500; // milliseconds

    // Edge escape system
    this.isEscapingEdge = false;
    this.edgeEscapeTimer = 0;
    this.edgeEscapeDuration = 1000; // 1 second
    this.edgeEscapeDirection = { x: 0, y: 0 };
  }

  setup(level) {
    // Reset state
    this.collectedSockballs = 0;
    this.targetSockballs = level.marthaWantsSockballs;
    this.sockballsWanted = level.marthaWantsSockballs;
    this.speed = level.marthaSpeed;
    this.availablePatterns = level.marthaPatterns;
    this.patternSpeed = level.marthaPatternSpeed;

    // Reset position to center area
    this.x = this.bounds.left + (this.bounds.right - this.bounds.left) / 2;
    this.y = this.bounds.top + (this.bounds.bottom - this.bounds.top) / 2;

    // Reset state flags
    this.onScreen = true;
    this.isExiting = false;
    this.isEntering = false;

    // Reset hit effects
    this.hitEffect.active = false;
    this.hitEffect.pointPopups = [];

    // Reset animation and edge escape state
    this.animationFrame = 0;
    this.animationTimer = 0;
    this.currentFrameIndex = 0;
    this.isEscapingEdge = false;
    this.edgeEscapeTimer = 0;

    // Initialize first pattern
    this.switchPattern();
  }

  update(deltaTime) {
    // Update animation
    this.updateAnimation(deltaTime);

    this.patternTimer += deltaTime;
    this.patternSwitchTimer += deltaTime;

    // Update hit effects
    this.updateHitEffects(deltaTime);

    // Update edge escape timer
    if (this.isEscapingEdge) {
      this.edgeEscapeTimer -= deltaTime;
      if (this.edgeEscapeTimer <= 0) {
        this.isEscapingEdge = false;
      }
    }

    // Handle pattern switching (only if not escaping edge)
    if (
      !this.isEscapingEdge &&
      this.patternSwitchTimer >= this.patternSwitchInterval
    ) {
      this.switchPattern();
      this.patternSwitchTimer = 0;
    }

    // Update movement based on current state
    if (this.isExiting) {
      this.updateExitMovement(deltaTime);
    } else if (this.isEntering) {
      this.updateEnterMovement(deltaTime);
    } else if (this.onScreen) {
      if (this.isEscapingEdge) {
        this.updateEdgeEscapeMovement(deltaTime);
      } else {
        this.updatePatternMovement(deltaTime);
      }
    }

    // Apply velocity and intelligent bounds checking
    this.applyIntelligentMovement(deltaTime);
  }

  updateAnimation(deltaTime) {
    // Only animate if moving
    const isMoving =
      Math.abs(this.velocity.x) > 0.1 || Math.abs(this.velocity.y) > 0.1;

    if (isMoving) {
      this.animationTimer += deltaTime;

      // Animation speed should be proportional to movement speed
      const movementSpeed = Math.sqrt(
        this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y
      );
      const animationSpeed = Math.max(200, 400 - movementSpeed * 50); // Faster animation for faster movement

      if (this.animationTimer >= animationSpeed) {
        this.currentFrameIndex =
          (this.currentFrameIndex + 1) % GameConfig.MARTHA_FRAMES.length;
        this.animationTimer = 0;
      }
    }
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

    // Calculate base movement from pattern
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

    // Apply AI improvements (only if not escaping edge)
    if (!this.isEscapingEdge) {
      this.applyAIImprovements(timeMultiplier);
    }
  }

  updateEdgeEscapeMovement(deltaTime) {
    const timeMultiplier = deltaTime / 16.67;
    const baseSpeed = 2; // Fixed speed for edge escape

    // Move in the escape direction
    this.velocity.x =
      this.edgeEscapeDirection.x *
      baseSpeed *
      this.patternSpeed *
      timeMultiplier;
    this.velocity.y =
      this.edgeEscapeDirection.y *
      baseSpeed *
      this.patternSpeed *
      timeMultiplier;

    // Update facing direction
    if (Math.abs(this.velocity.x) > 0.1) {
      this.facingRight = this.velocity.x > 0;
    }
  }

  applyAIImprovements(timeMultiplier) {
    // Only apply AI improvements if Martha is close to edges or needs center guidance
    const currentTime = Date.now();

    // Calculate center attraction - only apply when far from center
    const centerX =
      this.bounds.left + (this.bounds.right - this.bounds.left) / 2;
    const centerY =
      this.bounds.top + (this.bounds.bottom - this.bounds.top) / 2;

    const distanceFromCenterX = centerX - this.x;
    const distanceFromCenterY = centerY - this.y;
    const distanceFromCenter = Math.sqrt(
      distanceFromCenterX * distanceFromCenterX +
        distanceFromCenterY * distanceFromCenterY
    );

    // Only apply center attraction if Martha is far from center (more than 1/3 of screen)
    const maxDistance =
      Math.min(
        this.bounds.right - this.bounds.left,
        this.bounds.bottom - this.bounds.top
      ) / 3;
    if (distanceFromCenter > maxDistance) {
      const attractionStrength = Math.min(
        (distanceFromCenter - maxDistance) / maxDistance,
        1
      );
      this.velocity.x +=
        distanceFromCenterX *
        this.centerAttraction *
        attractionStrength *
        timeMultiplier;
      this.velocity.y +=
        distanceFromCenterY *
        this.centerAttraction *
        attractionStrength *
        timeMultiplier;
    }

    // Apply edge repulsion - only when actually close to edges
    // Left edge repulsion
    if (this.x < this.bounds.left + this.edgeBuffer) {
      const repulsionForce = Math.pow(
        (this.bounds.left + this.edgeBuffer - this.x) / this.edgeBuffer,
        2
      );
      this.velocity.x += repulsionForce * this.edgeRepulsion * timeMultiplier;
    }

    // Right edge repulsion
    if (this.x > this.bounds.right - this.width - this.edgeBuffer) {
      const repulsionForce = Math.pow(
        (this.x - (this.bounds.right - this.width - this.edgeBuffer)) /
          this.edgeBuffer,
        2
      );
      this.velocity.x -= repulsionForce * this.edgeRepulsion * timeMultiplier;
    }

    // Top edge repulsion
    if (this.y < this.bounds.top + this.edgeBuffer) {
      const repulsionForce = Math.pow(
        (this.bounds.top + this.edgeBuffer - this.y) / this.edgeBuffer,
        2
      );
      this.velocity.y += repulsionForce * this.edgeRepulsion * timeMultiplier;
    }

    // Bottom edge repulsion
    if (this.y > this.bounds.bottom - this.height - this.edgeBuffer) {
      const repulsionForce = Math.pow(
        (this.y - (this.bounds.bottom - this.height - this.edgeBuffer)) /
          this.edgeBuffer,
        2
      );
      this.velocity.y -= repulsionForce * this.edgeRepulsion * timeMultiplier;
    }
  }

  updateHorizontalPattern(timeMultiplier) {
    const baseSpeed = GameConfig.MARTHA_PATTERNS.HORIZONTAL.baseSpeed;
    this.velocity.x =
      this.direction * baseSpeed * this.patternSpeed * timeMultiplier;
    this.velocity.y = 0;

    // Check for direction change at bounds with some randomness
    if (
      this.x <= this.bounds.left + this.edgeBuffer ||
      this.x >= this.bounds.right - this.width - this.edgeBuffer
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

    // Check for direction change at bounds
    if (
      this.y <= this.bounds.top + this.edgeBuffer ||
      this.y >= this.bounds.bottom - this.height - this.edgeBuffer
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

    // Check for direction change at bounds
    if (
      this.x <= this.bounds.left + this.edgeBuffer ||
      this.x >= this.bounds.right - this.width - this.edgeBuffer
    ) {
      this.patternData.diagonalDirection.x *= -1;
      this.facingRight = this.patternData.diagonalDirection.x > 0;
    }
    if (
      this.y <= this.bounds.top + this.edgeBuffer ||
      this.y >= this.bounds.bottom - this.height - this.edgeBuffer
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
      // Reduce radius to keep Martha away from edges
      this.patternData.radius = Math.min(
        (this.bounds.right - this.bounds.left) / 3,
        (this.bounds.bottom - this.bounds.top) / 3
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

    // Change direction randomly, but less frequently
    if (Math.random() < 0.01) {
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

  applyIntelligentMovement(deltaTime) {
    const currentTime = Date.now();

    // Apply velocity
    this.x += this.velocity.x;
    this.y += this.velocity.y;

    // Intelligent bounds checking with edge escape system
    if (!this.isExiting && !this.isEntering) {
      let hitEdge = false;
      let escapeDirection = { x: 0, y: 0 };

      // Left boundary
      if (this.x < this.bounds.left) {
        this.x = this.bounds.left + 3; // Push 3 pixels away from edge
        escapeDirection.x = 1; // Move right
        hitEdge = true;
      }

      // Right boundary
      if (this.x > this.bounds.right - this.width) {
        this.x = this.bounds.right - this.width - 3; // Push 3 pixels away from edge
        escapeDirection.x = -1; // Move left
        hitEdge = true;
      }

      // Top boundary
      if (this.y < this.bounds.top) {
        this.y = this.bounds.top + 3; // Push 3 pixels away from edge
        escapeDirection.y = 1; // Move down
        hitEdge = true;
      }

      // Bottom boundary
      if (this.y > this.bounds.bottom - this.height) {
        this.y = this.bounds.bottom - this.height - 3; // Push 3 pixels away from edge
        escapeDirection.y = -1; // Move up
        hitEdge = true;
      }

      // If we hit an edge, start edge escape mode
      if (hitEdge) {
        this.isEscapingEdge = true;
        this.edgeEscapeTimer = this.edgeEscapeDuration;
        this.edgeEscapeDirection = escapeDirection;
        this.facingRight = escapeDirection.x > 0;
      }

      // Update facing direction based on velocity (only if not escaping)
      if (!this.isEscapingEdge && Math.abs(this.velocity.x) > 0.1) {
        this.facingRight = this.velocity.x > 0;
      }
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

    // Get the current animation frame
    const frameIndex = GameConfig.MARTHA_FRAMES[this.currentFrameIndex];
    const marthaImage =
      this.game.images[GameConfig.IMAGES.CHARACTERS[frameIndex]];

    // Draw Martha
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

      // Draw edge buffer zones
      ctx.strokeStyle = "rgba(255, 255, 0, 0.3)";
      ctx.lineWidth = 1;
      ctx.strokeRect(
        this.bounds.left + this.edgeBuffer,
        this.bounds.top + this.edgeBuffer,
        this.bounds.right - this.bounds.left - this.edgeBuffer * 2,
        this.bounds.bottom - this.bounds.top - this.edgeBuffer * 2
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
