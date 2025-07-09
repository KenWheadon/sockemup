class MatchPhysics {
  constructor(game) {
    this.game = game;

    // Calculate bounds based on current canvas size using scaled values
    this.updateBounds();

    // Smoother friction-based physics constants
    this.friction = 0.992; // Increased from 0.985 for smoother slowdown
    this.minVelocity = 0.05; // Reduced from 0.1 for more gradual stopping
    this.bounceRestitution = 0.4; // Reduced from 0.6 for gentler bounces
    this.rotationFriction = 0.98; // Increased from 0.95 for smoother rotation slowdown
  }

  // Update bounds when canvas size changes
  updateBounds() {
    this.bounds = {
      left: this.game.getScaledValue(50),
      right: this.game.getCanvasWidth() - this.game.getScaledValue(50),
      top: this.game.getScaledValue(70),
      bottom: this.game.getCanvasHeight() - this.game.getScaledValue(100),
    };
  }

  updateSock(sock) {
    // Update bounds in case canvas was resized
    this.updateBounds();

    // Apply friction to velocity
    sock.vx *= this.friction;
    sock.vy *= this.friction;

    // Apply friction to rotation
    if (sock.rotationSpeed) {
      sock.rotationSpeed *= this.rotationFriction;
    }

    // Update position
    sock.x += sock.vx;
    sock.y += sock.vy;

    // Update rotation
    if (sock.rotationSpeed) {
      sock.rotation += sock.rotationSpeed;
    }

    // Check bounds and bounce
    this.checkBounds(sock);

    // Stop if velocity is too low
    if (
      Math.abs(sock.vx) < this.minVelocity &&
      Math.abs(sock.vy) < this.minVelocity
    ) {
      sock.vx = 0;
      sock.vy = 0;

      if (sock.rotationSpeed && Math.abs(sock.rotationSpeed) < 0.01) {
        sock.rotationSpeed = 0;
      }
    }
  }

  checkBounds(sock) {
    const halfWidth = sock.width / 2;
    const halfHeight = sock.height / 2;

    // Left and right bounds
    if (sock.x - halfWidth <= this.bounds.left) {
      sock.x = this.bounds.left + halfWidth;
      sock.vx = Math.abs(sock.vx) * this.bounceRestitution;
      this.createBounceEffect(sock);
    } else if (sock.x + halfWidth >= this.bounds.right) {
      sock.x = this.bounds.right - halfWidth;
      sock.vx = -Math.abs(sock.vx) * this.bounceRestitution;
      this.createBounceEffect(sock);
    }

    // Top and bottom bounds
    if (sock.y - halfHeight <= this.bounds.top) {
      sock.y = this.bounds.top + halfHeight;
      sock.vy = Math.abs(sock.vy) * this.bounceRestitution;
      this.createBounceEffect(sock);
    } else if (sock.y + halfHeight >= this.bounds.bottom) {
      sock.y = this.bounds.bottom - halfHeight;
      sock.vy = -Math.abs(sock.vy) * this.bounceRestitution;
      this.createBounceEffect(sock);
    }
  }

  createBounceEffect(sock) {
    // Add visual feedback for bouncing
    sock.glowEffect = Math.max(sock.glowEffect, 15);

    // Add some randomness to rotation on bounce
    if (sock.rotationSpeed !== undefined) {
      sock.rotationSpeed += (Math.random() - 0.5) * 0.1;
    }
  }

  applySockThrow(sock, throwVelocity) {
    // Apply throw velocity with reduced randomness for smoother motion
    sock.vx = throwVelocity.x + (Math.random() - 0.5) * 1; // Reduced from 2 to 1
    sock.vy = throwVelocity.y + (Math.random() - 0.5) * 1; // Reduced from 2 to 1

    // Gentler rotation based on throw
    sock.rotationSpeed = (Math.random() - 0.5) * 0.1; // Reduced from 0.2 to 0.1

    // Reduced visual effect
    sock.glowEffect = 10; // Reduced from 20 to 10
  }

  getDropZoneDistance(sock, dropZone) {
    return Math.sqrt(
      Math.pow(sock.x - dropZone.x, 2) + Math.pow(sock.y - dropZone.y, 2)
    );
  }

  snapToDropZone(sock, dropZone) {
    sock.x = dropZone.x;
    sock.y = dropZone.y;
    sock.vx = 0;
    sock.vy = 0;
    sock.rotationSpeed = 0;

    // Add snap effect
    sock.glowEffect = 25;
  }

  isSockMoving(sock) {
    return (
      Math.abs(sock.vx) > this.minVelocity ||
      Math.abs(sock.vy) > this.minVelocity
    );
  }

  // Calculate bounce off another sock (for future sock-to-sock collisions)
  calculateSockCollision(sock1, sock2) {
    const dx = sock2.x - sock1.x;
    const dy = sock2.y - sock1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < (sock1.width + sock2.width) / 2) {
      // Calculate collision response
      const angle = Math.atan2(dy, dx);
      const sin = Math.sin(angle);
      const cos = Math.cos(angle);

      // Separate the socks
      const overlap = (sock1.width + sock2.width) / 2 - distance;
      const separationX = (cos * overlap) / 2;
      const separationY = (sin * overlap) / 2;

      sock1.x -= separationX;
      sock1.y -= separationY;
      sock2.x += separationX;
      sock2.y += separationY;

      // Apply collision forces
      const force = 3;
      sock1.vx -= cos * force;
      sock1.vy -= sin * force;
      sock2.vx += cos * force;
      sock2.vy += sin * force;

      // Add visual effects
      sock1.glowEffect = 15;
      sock2.glowEffect = 15;

      return true;
    }

    return false;
  }

  // Add impulse to sock (for special effects)
  addImpulse(sock, impulseX, impulseY) {
    sock.vx += impulseX;
    sock.vy += impulseY;

    // Clamp to reasonable values
    const maxVelocity = 20;
    sock.vx = Math.max(-maxVelocity, Math.min(maxVelocity, sock.vx));
    sock.vy = Math.max(-maxVelocity, Math.min(maxVelocity, sock.vy));
  }

  // Check if sock is in a stable position
  isSockStable(sock) {
    return !this.isSockMoving(sock) && sock.rotationSpeed === 0;
  }

  // Debug render physics bounds
  renderDebugBounds(ctx) {
    if (!GameConfig.DEBUG_PHYSICS_BOUNDS) return;

    ctx.save();
    ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
    ctx.lineWidth = this.game.getScaledValue(2);
    ctx.setLineDash([this.game.getScaledValue(5), this.game.getScaledValue(5)]);

    ctx.strokeRect(
      this.bounds.left,
      this.bounds.top,
      this.bounds.right - this.bounds.left,
      this.bounds.bottom - this.bounds.top
    );

    // Draw corner labels
    ctx.fillStyle = "rgba(255, 0, 0, 0.8)";
    ctx.font = `${this.game.getScaledValue(12)}px Courier New`;
    ctx.textAlign = "left";
    ctx.fillText(
      `${Math.round(this.bounds.left)}, ${Math.round(this.bounds.top)}`,
      this.bounds.left + this.game.getScaledValue(5),
      this.bounds.top + this.game.getScaledValue(15)
    );
    ctx.textAlign = "right";
    ctx.fillText(
      `${Math.round(this.bounds.right)}, ${Math.round(this.bounds.bottom)}`,
      this.bounds.right - this.game.getScaledValue(5),
      this.bounds.bottom - this.game.getScaledValue(5)
    );

    ctx.restore();
  }

  // Get velocity magnitude
  getVelocityMagnitude(sock) {
    return Math.sqrt(sock.vx * sock.vx + sock.vy * sock.vy);
  }

  // Set velocity from angle and speed
  setVelocityFromAngle(sock, angle, speed) {
    sock.vx = Math.cos(angle) * speed;
    sock.vy = Math.sin(angle) * speed;
  }

  // Get angle from velocity
  getVelocityAngle(sock) {
    return Math.atan2(sock.vy, sock.vx);
  }
}
