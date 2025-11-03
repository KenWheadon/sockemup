/**
 * EasterEggManager - Manages the bonus game/easter egg system
 *
 * Features:
 * - Menu socks spawning and physics
 * - Drop zone management and rendering
 * - Sock dragging mechanics
 * - Match/mismatch detection
 * - Easter egg activation/deactivation
 * - Logo click counter
 * - Particle effects for matches/mismatches
 */

class EasterEggManager {
  constructor(game, marthaCharacter) {
    this.game = game;
    this.marthaCharacter = marthaCharacter;

    // Configuration
    this.DROP_ZONE_CONFIG = {
      snapDistance: 40,
      size: 60,
      offsetX: 1200,
      offsetY1: 200,
      offsetY2: 300,
      outerBorderWidth: 10,
      glowDuration: 20,
    };

    this.menuPhysics = {
      friction: 0.992,
      minVelocity: 0.05,
      bounceRestitution: 0.4,
      rotationFriction: 0.98,
      bounds: {
        left: -500,
        right: 2000,
        top: -500,
        bottom: 2000,
      },
    };

    // Animation constants
    this.ANIMATION_SPEED = 0.008;
    this.PULSE_SPEED = 0.005;
    this.PRESS_DURATION = 150;
    this.PRESS_MIN_SCALE = 0.95;
    this.PRESS_SCALE_RANGE = 0.05;
    this.ROTATION_VELOCITY_THRESHOLD = 0.01;
    this.TIME_MULTIPLIER_BASE = 16.67;

    // Core state
    this.easterEggActive = false;
    this.logoClickCount = 0;
    this.currentSockType = 1;
    this.menuSocks = [];
    this.easterDropZones = [];

    // Dragging state
    this.isDragging = false;
    this.dragSock = null;
    this.dragOffset = { x: 0, y: 0 };
    this.dropZoneHover = null;
    this.hoveredMenuSock = null;

    // Particle effects
    this.mismatchParticles = [];

    // Animations
    this.sockBallAnimations = [];
    this.pointGainAnimations = [];

    // Logo press effect
    this.logoPressed = false;
    this.logoPressTimer = 0;
    this.logoPressScale = 1.0;

    // Momentum tracking
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.mouseVelocityX = 0;
    this.mouseVelocityY = 0;

    // Reference to layout cache (will be set by controller)
    this.layoutCache = null;
  }

  /**
   * Initialize the easter egg system
   */
  setup() {
    this.setupEasterDropZones();
  }

  /**
   * Setup drop zones for matching socks
   */
  setupEasterDropZones() {
    if (this.easterDropZones.length === 0) {
      this.easterDropZones = [
        {
          x: this.DROP_ZONE_CONFIG.offsetX,
          y: this.DROP_ZONE_CONFIG.offsetY1,
          width: this.DROP_ZONE_CONFIG.size,
          height: this.DROP_ZONE_CONFIG.size,
          sock: null,
          glowEffect: 0,
          hoverEffect: 0,
          snapEffect: 0,
          id: 0,
        },
        {
          x: this.DROP_ZONE_CONFIG.offsetX,
          y: this.DROP_ZONE_CONFIG.offsetY2,
          width: this.DROP_ZONE_CONFIG.size,
          height: this.DROP_ZONE_CONFIG.size,
          sock: null,
          glowEffect: 0,
          hoverEffect: 0,
          snapEffect: 0,
          id: 1,
        },
      ];
    }
  }

  /**
   * Clean up easter egg state
   */
  cleanup() {
    this.menuSocks = [];
    this.easterEggActive = false;
    this.isDragging = false;
    this.dragSock = null;
    this.dragOffset = { x: 0, y: 0 };
    this.dropZoneHover = null;
    this.hoveredMenuSock = null;

    for (const zone of this.easterDropZones) {
      zone.sock = null;
      zone.glowEffect = 0;
      zone.hoverEffect = 0;
      zone.snapEffect = 0;
    }
  }

  /**
   * Update all easter egg systems
   */
  update(deltaTime) {
    if (this.easterEggActive) {
      this.updateMenuSocks(deltaTime);
    }
    this.updateMismatchParticles(deltaTime);
    this.updateDropZoneEffects(deltaTime);
    this.updateAnimations(deltaTime);
  }

  /**
   * Update drop zone visual effects
   */
  updateDropZoneEffects(deltaTime) {
    for (const zone of this.easterDropZones) {
      if (zone.glowEffect > 0) {
        zone.glowEffect -= deltaTime / this.TIME_MULTIPLIER_BASE;
        if (zone.glowEffect < 0) zone.glowEffect = 0;
      }
      if (zone.snapEffect > 0) {
        zone.snapEffect -= deltaTime / this.TIME_MULTIPLIER_BASE;
        if (zone.snapEffect < 0) zone.snapEffect = 0;
      }
    }
  }

  /**
   * Update sockball and point animations
   */
  updateAnimations(deltaTime) {
    const timeMultiplier = deltaTime / this.TIME_MULTIPLIER_BASE;

    // Update sockball animations
    this.sockBallAnimations = this.sockBallAnimations.filter((anim) => {
      anim.progress += 0.02 * timeMultiplier;
      if (anim.progress >= 1) {
        if (!anim.soundPlayed) {
          this.game.audioManager.play("rent-collected");
          this.marthaCharacter.triggerWiggle();
          anim.soundPlayed = true;
        }
        return false;
      }
      return true;
    });

    // Update point gain animations
    this.pointGainAnimations = this.pointGainAnimations.filter((anim) => {
      anim.progress += 0.02 * timeMultiplier;
      return anim.progress < 1;
    });
  }

  /**
   * Update menu sock physics
   */
  updateMenuSocks(deltaTime) {
    const timeMultiplier = deltaTime / this.TIME_MULTIPLIER_BASE;

    for (let i = this.menuSocks.length - 1; i >= 0; i--) {
      const sock = this.menuSocks[i];

      // Skip physics for dragged socks or socks in drop zones
      if (this.isDragging && this.dragSock === sock) continue;
      if (this.isSockInDropZone(sock)) continue;

      // Update glow effect
      if (sock.glowEffect > 0) {
        sock.glowEffect -= timeMultiplier;
      }

      // Apply friction to velocity
      sock.vx *= Math.pow(this.menuPhysics.friction, timeMultiplier);
      sock.vy *= Math.pow(this.menuPhysics.friction, timeMultiplier);

      // Update position
      sock.x += sock.vx * timeMultiplier;
      sock.y += sock.vy * timeMultiplier;

      // Apply friction to rotation
      sock.rotationSpeed *= Math.pow(this.menuPhysics.rotationFriction, timeMultiplier);

      // Update rotation
      sock.rotation += sock.rotationSpeed * timeMultiplier;

      // Stop velocity when below threshold
      if (Math.abs(sock.vx) < this.menuPhysics.minVelocity) sock.vx = 0;
      if (Math.abs(sock.vy) < this.menuPhysics.minVelocity) sock.vy = 0;
      if (Math.abs(sock.rotationSpeed) < this.ROTATION_VELOCITY_THRESHOLD) sock.rotationSpeed = 0;

      // Remove socks outside bounds
      if (this.isSockOutsideBounds(sock)) {
        this.menuSocks.splice(i, 1);
      }
    }
  }

  /**
   * Check if sock is in any drop zone
   */
  isSockInDropZone(sock) {
    return this.easterDropZones.some((zone) => zone.sock === sock);
  }

  /**
   * Check if sock is outside physics bounds
   */
  isSockOutsideBounds(sock) {
    const { left, right, top, bottom } = this.menuPhysics.bounds;
    return sock.x < left || sock.x > right || sock.y < top || sock.y > bottom;
  }

  /**
   * Update mismatch particle effects
   */
  updateMismatchParticles(deltaTime) {
    const timeMultiplier = deltaTime / this.TIME_MULTIPLIER_BASE;

    this.mismatchParticles = this.mismatchParticles.filter((particle) => {
      particle.x += particle.vx * timeMultiplier;
      particle.y += particle.vy * timeMultiplier;
      particle.vx *= Math.pow(this.menuPhysics.friction, timeMultiplier);
      particle.vy *= Math.pow(this.menuPhysics.friction, timeMultiplier);
      particle.life -= timeMultiplier;
      return particle.life > 0;
    });
  }

  /**
   * Clear sock from all drop zones
   */
  clearSockFromDropZones(sock) {
    for (const zone of this.easterDropZones) {
      if (zone.sock === sock) {
        zone.sock = null;
      }
    }
  }

  /**
   * Activate the easter egg and spawn a sock
   */
  activateEasterEgg() {
    this.logoClickCount++;
    this.easterEggActive = true;

    // Check achievements
    if (this.logoClickCount === 1) {
      this.game.unlockAchievement("EASTER_EGG_HUNTER");
    }
    this.game.checkAchievement("LOGO_CLICKER");

    this.spawnSingleSock();
  }

  /**
   * Spawn a single sock
   */
  spawnSingleSock() {
    const canvasWidth = this.game.canvas.width;
    const canvasHeight = this.game.canvas.height;

    const newSock = {
      type: this.currentSockType,
      x: canvasWidth / 2 + (Math.random() - 0.5) * 200,
      y: canvasHeight / 2 + (Math.random() - 0.5) * 200,
      size: (0.5 + Math.random()) * 60,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.1,
      glowEffect: 30,
      spawnTime: Date.now(),
    };

    this.menuSocks.push(newSock);

    // Cycle sock type
    this.currentSockType = (this.currentSockType % 9) + 1;
  }

  /**
   * Check if logo was clicked
   */
  isLogoClicked(x, y) {
    if (!this.layoutCache) return false;

    const logo = this.layoutCache.logo;
    return (
      x >= logo.x &&
      x <= logo.x + logo.width &&
      y >= logo.y &&
      y <= logo.y + logo.height
    );
  }

  /**
   * Get sock at position (for clicking/dragging)
   */
  getSockAtPosition(x, y) {
    for (const sock of this.menuSocks) {
      const dx = x - sock.x;
      const dy = y - sock.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance <= sock.size / 2) {
        return sock;
      }
    }
    return null;
  }

  /**
   * Get distance between sock and drop zone
   */
  getDropZoneDistance(sock, dropZone) {
    const dx = sock.x - (dropZone.x + dropZone.width / 2);
    const dy = sock.y - (dropZone.y + dropZone.height / 2);
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Snap sock to drop zone
   */
  snapSockToDropZone(sock, dropZone) {
    sock.x = dropZone.x + dropZone.width / 2;
    sock.y = dropZone.y + dropZone.height / 2;
    sock.vx = 0;
    sock.vy = 0;
    sock.rotationSpeed = 0;
    dropZone.sock = sock;
  }

  /**
   * Create snap effect on drop zone
   */
  createSnapEffect(zone) {
    zone.glowEffect = this.DROP_ZONE_CONFIG.glowDuration;
    zone.snapEffect = 15;
  }

  /**
   * Handle mouse down event
   */
  onMouseDown(x, y) {
    if (!this.easterEggActive) return false;

    const sock = this.getSockAtPosition(x, y);
    if (sock) {
      this.isDragging = true;
      this.dragSock = sock;
      this.dragOffset = {
        x: x - sock.x,
        y: y - sock.y,
      };
      sock.vx = 0;
      sock.vy = 0;
      sock.rotationSpeed = 0;

      // Reset momentum tracking
      this.lastMouseX = x;
      this.lastMouseY = y;
      this.mouseVelocityX = 0;
      this.mouseVelocityY = 0;

      // Clear from drop zones
      this.clearSockFromDropZones(sock);

      return true;
    }

    return false;
  }

  /**
   * Handle mouse move event
   */
  onMouseMove(x, y) {
    if (this.isDragging && this.dragSock) {
      // Update sock position
      this.dragSock.x = x - this.dragOffset.x;
      this.dragSock.y = y - this.dragOffset.y;

      // Calculate mouse velocity for momentum
      this.mouseVelocityX = x - this.lastMouseX;
      this.mouseVelocityY = y - this.lastMouseY;
      this.lastMouseX = x;
      this.lastMouseY = y;

      // Check for drop zone hover
      this.dropZoneHover = null;
      for (const zone of this.easterDropZones) {
        if (!zone.sock) {
          const distance = this.getDropZoneDistance(this.dragSock, zone);
          if (distance <= this.DROP_ZONE_CONFIG.snapDistance) {
            this.dropZoneHover = zone.id;
            zone.hoverEffect = 1;
          } else {
            zone.hoverEffect = 0;
          }
        }
      }

      return true;
    } else {
      // Update hover state for non-dragged socks
      this.hoveredMenuSock = this.getSockAtPosition(x, y);

      // Reset drop zone hover effects
      for (const zone of this.easterDropZones) {
        zone.hoverEffect = 0;
      }
    }

    return false;
  }

  /**
   * Handle mouse up event
   */
  onMouseUp(x, y) {
    if (this.isDragging && this.dragSock) {
      let snapped = false;

      // Try to snap to drop zone
      for (const zone of this.easterDropZones) {
        if (!zone.sock) {
          const distance = this.getDropZoneDistance(this.dragSock, zone);
          if (distance <= this.DROP_ZONE_CONFIG.snapDistance) {
            this.snapSockToDropZone(this.dragSock, zone);
            this.createSnapEffect(zone);
            this.game.audioManager.play("sock-snap");
            snapped = true;
            break;
          }
        }
      }

      // Apply momentum if not snapped
      if (!snapped) {
        this.dragSock.vx = this.mouseVelocityX * 0.5;
        this.dragSock.vy = this.mouseVelocityY * 0.5;
        const velocityMagnitude = Math.sqrt(
          this.mouseVelocityX ** 2 + this.mouseVelocityY ** 2
        );
        this.dragSock.rotationSpeed = velocityMagnitude * 0.01;
      }

      // Clear dragging state
      this.isDragging = false;
      this.dragSock = null;
      this.dragOffset = { x: 0, y: 0 };
      this.dropZoneHover = null;

      // Check for matches
      this.checkForEasterEggMatches();

      return true;
    }

    return false;
  }

  /**
   * Check for matches in drop zones
   */
  checkForEasterEggMatches() {
    const zone1 = this.easterDropZones[0];
    const zone2 = this.easterDropZones[1];

    if (!zone1.sock || !zone2.sock) return;

    const sock1 = zone1.sock;
    const sock2 = zone2.sock;

    if (sock1.type === sock2.type) {
      // Match!
      this.game.audioManager.play("easter-egg-match");
      zone1.sock = null;
      zone2.sock = null;
      this.createSockBallAnimation(sock1, sock2);
      this.awardPointsForMatch(sock1, sock2);
      this.removeMatchedSocks(sock1, sock2);
      this.checkEasterEggDeactivation();
    } else {
      // Mismatch
      this.game.audioManager.play("easter-egg-mismatch");
      zone1.sock = null;
      zone2.sock = null;
      this.handleEasterEggMismatch(sock1, sock2);
    }
  }

  /**
   * Remove matched socks from game
   */
  removeMatchedSocks(sock1, sock2) {
    this.menuSocks = this.menuSocks.filter((s) => s !== sock1 && s !== sock2);
    if (this.dragSock === sock1 || this.dragSock === sock2) {
      this.dragSock = null;
    }
    this.clearSockFromDropZones(sock1);
    this.clearSockFromDropZones(sock2);
  }

  /**
   * Check if easter egg should be deactivated
   */
  checkEasterEggDeactivation() {
    if (this.menuSocks.length === 0) {
      this.easterEggActive = false;
    }
  }

  /**
   * Cancel active drag
   */
  cancelActiveDrag() {
    if (this.isDragging) {
      this.isDragging = false;
      this.dragSock = null;
      this.dragOffset = { x: 0, y: 0 };
      this.dropZoneHover = null;
    }
  }

  /**
   * Handle mismatch between two socks
   */
  handleEasterEggMismatch(sock1, sock2) {
    this.game.audioManager.play("particle-burst");
    this.createEasterEggMismatchEffect(sock1, sock2);

    // Calculate repulsion vector
    const dx = sock2.x - sock1.x;
    const dy = sock2.y - sock1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const nx = dx / distance;
    const ny = dy / distance;

    // Apply repulsion
    const repulsionForce = 20;
    sock1.vx = -nx * repulsionForce + (Math.random() - 0.5) * 10;
    sock1.vy = -ny * repulsionForce + (Math.random() - 0.5) * 10;
    sock2.vx = nx * repulsionForce + (Math.random() - 0.5) * 10;
    sock2.vy = ny * repulsionForce + (Math.random() - 0.5) * 10;

    sock1.rotationSpeed = (Math.random() - 0.5) * 0.3;
    sock2.rotationSpeed = (Math.random() - 0.5) * 0.3;

    sock1.glowEffect = 30;
    sock2.glowEffect = 30;

    this.easterDropZones[0].glowEffect = this.DROP_ZONE_CONFIG.glowDuration;
    this.easterDropZones[1].glowEffect = this.DROP_ZONE_CONFIG.glowDuration;
  }

  /**
   * Create mismatch visual effect
   */
  createEasterEggMismatchEffect(sock1, sock2) {
    const centerX = (sock1.x + sock2.x) / 2;
    const centerY = (sock1.y + sock2.y) / 2;

    const colors = [
      "#FF6B6B",
      "#FFD93D",
      "#6BCB77",
      "#4D96FF",
      "#9D4EDD",
      "#FF6B9D",
      "#FFA07A",
    ];

    // Create circle particles
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 2;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const offsetX = (Math.random() - 0.5) * 100;
      const offsetY = (Math.random() - 0.5) * 100;
      this.createMismatchParticle(
        centerX + offsetX,
        centerY + offsetY,
        vx,
        vy,
        color,
        Math.random() * 10 + 5,
        60,
        "circle"
      );
    }

    // Create cross particles
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const speed = Math.random() * 5 + 3;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      this.createMismatchParticle(centerX, centerY, vx, vy, "#FF0000", 15, 45, "cross");
    }
  }

  /**
   * Create a single mismatch particle
   */
  createMismatchParticle(x, y, vx, vy, color, size, life, shape) {
    this.mismatchParticles.push({
      x,
      y,
      vx,
      vy,
      color,
      size,
      life,
      shape,
    });
  }

  /**
   * Award points for a match
   */
  awardPointsForMatch(sock1, sock2) {
    this.game.playerPoints += 1;
    this.game.sockBalls += 1;
    this.game.totalSockMatches += 1;
    this.game.easterEggSockballsCreated += 1;
    this.game.checkAchievement("SOCKBALL_WIZARD");
    this.game.totalSockballsEarned += 1;
    this.game.saveGameData();

    const centerX = (sock1.x + sock2.x) / 2;
    const centerY = (sock1.y + sock2.y) / 2;

    this.game.audioManager.play("points-gained");

    this.pointGainAnimations.push({
      x: centerX,
      y: centerY,
      progress: 0,
    });
  }

  /**
   * Create sockball animation flying to Martha
   */
  createSockBallAnimation(sock1, sock2) {
    const centerX = (sock1.x + sock2.x) / 2;
    const centerY = (sock1.y + sock2.y) / 2;

    this.sockBallAnimations.push({
      startX: centerX,
      startY: centerY,
      endX: this.marthaCharacter.marthaX,
      endY: this.marthaCharacter.marthaY,
      progress: 0,
      type: sock1.type,
      soundPlayed: false,
    });
  }

  /**
   * Render all easter egg elements
   */
  render(ctx) {
    this.renderMenuSocks(ctx);
    this.renderEasterDropZonePairBox(ctx);
    this.renderEasterDropZones(ctx);
    this.renderSockBallAnimations(ctx);
    this.renderPointGainAnimations(ctx);
    this.renderMismatchParticles(ctx);
  }

  /**
   * Render the drop zone pair box
   */
  renderEasterDropZonePairBox(ctx) {
    if (this.easterDropZones.length < 2) return;

    const zone1 = this.easterDropZones[0];
    const zone2 = this.easterDropZones[1];

    const margin = 20;
    const boxX = Math.min(zone1.x, zone2.x) - margin;
    const boxY = Math.min(zone1.y, zone2.y) - margin;
    const boxWidth =
      Math.max(zone1.x + zone1.width, zone2.x + zone2.width) - boxX + margin;
    const boxHeight =
      Math.max(zone1.y + zone1.height, zone2.y + zone2.height) - boxY + margin;

    ctx.save();

    // Draw box
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 3;
    ctx.fillStyle = "rgba(255, 215, 0, 0.05)";

    const radius = 10;
    ctx.beginPath();
    ctx.moveTo(boxX + radius, boxY);
    ctx.lineTo(boxX + boxWidth - radius, boxY);
    ctx.quadraticCurveTo(boxX + boxWidth, boxY, boxX + boxWidth, boxY + radius);
    ctx.lineTo(boxX + boxWidth, boxY + boxHeight - radius);
    ctx.quadraticCurveTo(
      boxX + boxWidth,
      boxY + boxHeight,
      boxX + boxWidth - radius,
      boxY + boxHeight
    );
    ctx.lineTo(boxX + radius, boxY + boxHeight);
    ctx.quadraticCurveTo(boxX, boxY + boxHeight, boxX, boxY + boxHeight - radius);
    ctx.lineTo(boxX, boxY + radius);
    ctx.quadraticCurveTo(boxX, boxY, boxX + radius, boxY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw label
    ctx.fillStyle = "#FFD700";
    ctx.font = "bold 20px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Drop Here", boxX + boxWidth / 2, boxY - 5);

    ctx.restore();
  }

  /**
   * Render easter egg drop zones
   */
  renderEasterDropZones(ctx) {
    for (const zone of this.easterDropZones) {
      ctx.save();

      const glowIntensity = Math.max(0, zone.glowEffect / this.DROP_ZONE_CONFIG.glowDuration);
      const isOccupied = zone.sock !== null;
      const isHovered = zone.hoverEffect > 0;

      // Draw zone border
      ctx.strokeStyle = isOccupied || isHovered ? "#00FF00" : "#FFD700";
      ctx.lineWidth = this.DROP_ZONE_CONFIG.outerBorderWidth;

      if (glowIntensity > 0 || isHovered) {
        ctx.shadowColor = isOccupied || isHovered ? "#00FF00" : "#FFD700";
        ctx.shadowBlur = 20 * (glowIntensity || 1);
      }

      const radius = 10;
      ctx.beginPath();
      ctx.moveTo(zone.x + radius, zone.y);
      ctx.lineTo(zone.x + zone.width - radius, zone.y);
      ctx.quadraticCurveTo(
        zone.x + zone.width,
        zone.y,
        zone.x + zone.width,
        zone.y + radius
      );
      ctx.lineTo(zone.x + zone.width, zone.y + zone.height - radius);
      ctx.quadraticCurveTo(
        zone.x + zone.width,
        zone.y + zone.height,
        zone.x + zone.width - radius,
        zone.y + zone.height
      );
      ctx.lineTo(zone.x + radius, zone.y + zone.height);
      ctx.quadraticCurveTo(
        zone.x,
        zone.y + zone.height,
        zone.x,
        zone.y + zone.height - radius
      );
      ctx.lineTo(zone.x, zone.y + radius);
      ctx.quadraticCurveTo(zone.x, zone.y, zone.x + radius, zone.y);
      ctx.closePath();

      // Fill with semi-transparent white if hovered
      if (isHovered) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
        ctx.fill();
      }

      ctx.stroke();
      ctx.restore();
    }
  }

  /**
   * Render sockball animations
   */
  renderSockBallAnimations(ctx) {
    for (const anim of this.sockBallAnimations) {
      const x = anim.startX + (anim.endX - anim.startX) * anim.progress;
      const y = anim.startY + (anim.endY - anim.startY) * anim.progress;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(anim.progress * Math.PI * 4);

      const sockballImg = this.game.images[`sockball${anim.type}`];
      if (sockballImg) {
        ctx.drawImage(sockballImg, -30, -30, 60, 60);
      }

      ctx.restore();
    }
  }

  /**
   * Render point gain animations
   */
  renderPointGainAnimations(ctx) {
    for (const anim of this.pointGainAnimations) {
      const easedProgress = this.easeOutCubic(anim.progress);
      const y = anim.y - easedProgress * 50;
      const alpha = 1 - anim.progress;
      const scale = 1 + easedProgress * 0.2;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `bold ${24 * scale}px Arial`;
      ctx.fillStyle = "#FFD700";
      ctx.textAlign = "center";
      ctx.fillText("+1", anim.x, y);
      ctx.restore();
    }
  }

  /**
   * Easing function
   */
  easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  /**
   * Render mismatch particles
   */
  renderMismatchParticles(ctx) {
    for (const particle of this.mismatchParticles) {
      const alpha = particle.life / 60;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;

      if (particle.shape === "circle") {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (particle.shape === "cross") {
        const halfSize = particle.size / 2;
        const thickness = particle.size / 5;
        ctx.fillRect(particle.x - halfSize, particle.y - thickness, particle.size, thickness * 2);
        ctx.fillRect(particle.x - thickness, particle.y - halfSize, thickness * 2, particle.size);
      }

      ctx.restore();
    }
  }

  /**
   * Render menu socks
   */
  renderMenuSocks(ctx) {
    for (const sock of this.menuSocks) {
      ctx.save();

      // Apply glow effect
      if (sock.glowEffect > 0) {
        const glowIntensity = sock.glowEffect / 30;
        ctx.shadowColor =
          this.isDragging && this.dragSock === sock
            ? "#FFD700"
            : sock === this.hoveredMenuSock
            ? "#4D96FF"
            : "#FFFF00";
        ctx.shadowBlur = 30 * glowIntensity;
      }

      ctx.translate(sock.x, sock.y);
      ctx.rotate(sock.rotation);

      // Scale up if being dragged
      if (this.isDragging && this.dragSock === sock) {
        ctx.scale(1.1, 1.1);
      }

      const sockImg = this.game.images[`sock${sock.type}`];
      if (sockImg) {
        ctx.drawImage(sockImg, -sock.size / 2, -sock.size / 2, sock.size, sock.size);
      }

      ctx.restore();
    }
  }

  /**
   * Check if easter egg is active
   */
  isActive() {
    return this.easterEggActive;
  }

  /**
   * Get number of logo clicks
   */
  getLogoClickCount() {
    return this.logoClickCount;
  }
}
