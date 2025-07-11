class MatchPhysics {
  constructor(game) {
    this.game = game;
    this.updateBounds();

    this.friction = 0.992;
    this.minVelocity = 0.05;
    this.bounceRestitution = 0.4;
    this.rotationFriction = 0.98;

    // Audio cooldown to prevent sound spam
    this.lastBounceSound = 0;
    this.bounceAudioCooldown = 200; // milliseconds
    this.lastCollisionSound = 0;
    this.collisionAudioCooldown = 300; // milliseconds
  }

  updateBounds() {
    this.bounds = {
      left: this.game.getScaledValue(50),
      right: this.game.getCanvasWidth() - this.game.getScaledValue(50),
      top: this.game.getScaledValue(70),
      bottom: this.game.getCanvasHeight() - this.game.getScaledValue(100),
    };
  }

  updateSock(sock) {
    this.updateBounds();

    sock.vx *= this.friction;
    sock.vy *= this.friction;

    if (sock.rotationSpeed) {
      sock.rotationSpeed *= this.rotationFriction;
    }

    sock.x += sock.vx;
    sock.y += sock.vy;

    if (sock.rotationSpeed) {
      sock.rotation += sock.rotationSpeed;
    }

    this.checkBounds(sock);

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
    let bounced = false;

    if (sock.x - halfWidth <= this.bounds.left) {
      sock.x = this.bounds.left + halfWidth;
      sock.vx = Math.abs(sock.vx) * this.bounceRestitution;
      bounced = true;
      this.createBounceEffect(sock);
    } else if (sock.x + halfWidth >= this.bounds.right) {
      sock.x = this.bounds.right - halfWidth;
      sock.vx = -Math.abs(sock.vx) * this.bounceRestitution;
      bounced = true;
      this.createBounceEffect(sock);
    }

    if (sock.y - halfHeight <= this.bounds.top) {
      sock.y = this.bounds.top + halfHeight;
      sock.vy = Math.abs(sock.vy) * this.bounceRestitution;
      bounced = true;
      this.createBounceEffect(sock);
    } else if (sock.y + halfHeight >= this.bounds.bottom) {
      sock.y = this.bounds.bottom - halfHeight;
      sock.vy = -Math.abs(sock.vy) * this.bounceRestitution;
      bounced = true;
      this.createBounceEffect(sock);
    }

    // Play bounce sound with cooldown to prevent spam
    if (bounced && this.shouldPlayBounceSound()) {
      this.game.audioManager.playSound("sock-bounce", false, 0.2);
      this.lastBounceSound = Date.now();
    }
  }

  shouldPlayBounceSound() {
    return Date.now() - this.lastBounceSound > this.bounceAudioCooldown;
  }

  shouldPlayCollisionSound() {
    return Date.now() - this.lastCollisionSound > this.collisionAudioCooldown;
  }

  createBounceEffect(sock) {
    sock.glowEffect = Math.max(sock.glowEffect, 15);

    if (sock.rotationSpeed !== undefined) {
      sock.rotationSpeed += (Math.random() - 0.5) * 0.1;
    }
  }

  applySockThrow(sock, throwVelocity) {
    sock.vx = throwVelocity.x + (Math.random() - 0.5) * 1;
    sock.vy = throwVelocity.y + (Math.random() - 0.5) * 1;
    sock.rotationSpeed = (Math.random() - 0.5) * 0.1;
    sock.glowEffect = 10;
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
    sock.glowEffect = 25;
  }

  isSockMoving(sock) {
    return (
      Math.abs(sock.vx) > this.minVelocity ||
      Math.abs(sock.vy) > this.minVelocity
    );
  }

  calculateSockCollision(sock1, sock2) {
    const dx = sock2.x - sock1.x;
    const dy = sock2.y - sock1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < (sock1.width + sock2.width) / 2) {
      const angle = Math.atan2(dy, dx);
      const sin = Math.sin(angle);
      const cos = Math.cos(angle);

      const overlap = (sock1.width + sock2.width) / 2 - distance;
      const separationX = (cos * overlap) / 2;
      const separationY = (sin * overlap) / 2;

      sock1.x -= separationX;
      sock1.y -= separationY;
      sock2.x += separationX;
      sock2.y += separationY;

      const force = 3;
      sock1.vx -= cos * force;
      sock1.vy -= sin * force;
      sock2.vx += cos * force;
      sock2.vy += sin * force;

      sock1.glowEffect = 15;
      sock2.glowEffect = 15;

      // Play collision sound with cooldown to prevent spam
      if (this.shouldPlayCollisionSound()) {
        this.game.audioManager.playSound("particle-burst", false, 0.1);
        this.lastCollisionSound = Date.now();
      }

      return true;
    }

    return false;
  }

  addImpulse(sock, impulseX, impulseY) {
    sock.vx += impulseX;
    sock.vy += impulseY;

    const maxVelocity = 20;
    sock.vx = Math.max(-maxVelocity, Math.min(maxVelocity, sock.vx));
    sock.vy = Math.max(-maxVelocity, Math.min(maxVelocity, sock.vy));
  }

  isSockStable(sock) {
    return !this.isSockMoving(sock) && sock.rotationSpeed === 0;
  }

  getVelocityMagnitude(sock) {
    return Math.sqrt(sock.vx * sock.vx + sock.vy * sock.vy);
  }

  setVelocityFromAngle(sock, angle, speed) {
    sock.vx = Math.cos(angle) * speed;
    sock.vy = Math.sin(angle) * speed;
  }

  getVelocityAngle(sock) {
    return Math.atan2(sock.vy, sock.vx);
  }
}
