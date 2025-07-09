class ThrowPhysics {
  constructor(game) {
    this.game = game;
    this.gravity = GameConfig.GRAVITY; // 0.2 from config
    this.debugMode = true; // Enable debug mode for slow motion
  }

  // Simple velocity calculation - launch toward target with fixed initial speed
  calculateThrowVelocity(startX, startY, targetX, targetY) {
    // Calculate direction vector
    const dx = targetX - startX;
    const dy = targetY - startY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Normalize direction and apply speed
    const speed = GameConfig.STARTING_SPEED; // 5 pixels per frame
    const vx = (dx / distance) * speed;
    const vy = (dy / distance) * speed;

    console.log("Simple velocity calculation:", {
      start: { x: startX, y: startY },
      target: { x: targetX, y: targetY },
      distance: distance,
      velocity: { vx: vx, vy: vy },
      speed: speed,
    });

    return { vx, vy };
  }

  // Create a new thrown sock with simple physics
  createThrownSock(startX, startY, targetX, targetY, sockType = 1) {
    const velocity = this.calculateThrowVelocity(
      startX,
      startY,
      targetX,
      targetY
    );

    const sock = {
      x: startX,
      y: startY,
      vx: velocity.vx,
      vy: velocity.vy,
      type: sockType,
      rotation: 0,
      rotationSpeed: 0.05, // Much slower rotation for debugging
      glowEffect: 30, // Start with glow effect
      age: 0, // Track how long sock has been alive
    };

    console.log("Created thrown sock:", {
      startPos: { x: startX, y: startY },
      targetPos: { x: targetX, y: targetY },
      velocity: velocity,
      sockType: sockType,
      sock: sock,
    });

    return sock;
  }

  // Update sock physics - much simpler and slower
  updateSock(sock) {
    const oldPos = { x: sock.x, y: sock.y };
    const oldVel = { vx: sock.vx, vy: sock.vy };

    // Apply velocity to position (slower in debug mode)
    const speedMultiplier = this.debugMode ? 0.5 : 1; // Half speed for debugging
    sock.x += sock.vx * speedMultiplier;
    sock.y += sock.vy * speedMultiplier;

    // Apply gravity to vertical velocity only
    sock.vy += this.gravity * speedMultiplier;

    // Update rotation (very slow)
    sock.rotation += sock.rotationSpeed * speedMultiplier;

    // Update glow effect
    if (sock.glowEffect > 0) {
      sock.glowEffect--;
    }

    // Update age
    sock.age++;

    // Debug logging every 30 frames (half second)
    if (sock.age % 30 === 0) {
      console.log("Sock update (every 30 frames):", {
        age: sock.age,
        oldPos: oldPos,
        newPos: { x: sock.x, y: sock.y },
        oldVel: oldVel,
        newVel: { vx: sock.vx, vy: sock.vy },
        rotation: sock.rotation,
        speedMultiplier: speedMultiplier,
      });
    }
  }

  // Check if sock is off screen (for cleanup) - now uses game canvas dimensions
  isSockOffScreen(sock) {
    const buffer = this.game.getScaledValue(100); // Use scaled buffer
    const canvasWidth = this.game.getCanvasWidth();
    const canvasHeight = this.game.getCanvasHeight();

    const isOffScreen =
      sock.y > canvasHeight + buffer ||
      sock.x < -buffer ||
      sock.x > canvasWidth + buffer;

    if (isOffScreen) {
      console.log("Sock went off screen:", {
        position: { x: sock.x, y: sock.y },
        canvasSize: { width: canvasWidth, height: canvasHeight },
        buffer: buffer,
        age: sock.age,
      });
    }

    return isOffScreen;
  }

  // Get sock bounds for collision detection
  getSockBounds(sock) {
    const size = this.game.getScaledValue(40); // Use scaled sock size
    return {
      left: sock.x - size / 2,
      right: sock.x + size / 2,
      top: sock.y - size / 2,
      bottom: sock.y + size / 2,
    };
  }

  // Check collision between sock and a rectangular target
  checkCollision(sock, target) {
    const sockBounds = this.getSockBounds(sock);

    return (
      sockBounds.left < target.x + target.width / 2 &&
      sockBounds.right > target.x - target.width / 2 &&
      sockBounds.top < target.y + target.height / 2 &&
      sockBounds.bottom > target.y - target.height / 2
    );
  }

  // Simple trajectory prediction for visual feedback
  calculateTrajectoryPoints(startX, startY, targetX, targetY, steps = 20) {
    const velocity = this.calculateThrowVelocity(
      startX,
      startY,
      targetX,
      targetY
    );
    const points = [];

    // Show trajectory for 3 seconds
    const totalFrames = 180; // 3 seconds at 60fps
    const speedMultiplier = this.debugMode ? 0.5 : 1;

    for (let i = 0; i <= steps; i++) {
      const frame = (i / steps) * totalFrames;
      const x = startX + velocity.vx * frame * speedMultiplier;
      const y =
        startY +
        velocity.vy * frame * speedMultiplier +
        0.5 * this.gravity * frame * frame * speedMultiplier * speedMultiplier;
      points.push({ x, y, frame });
    }

    return points;
  }

  // Render trajectory prediction line
  renderTrajectoryPreview(ctx, startX, startY, targetX, targetY) {
    const points = this.calculateTrajectoryPoints(
      startX,
      startY,
      targetX,
      targetY
    );

    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
    ctx.lineWidth = this.game.getScaledValue(3);
    ctx.setLineDash([this.game.getScaledValue(8), this.game.getScaledValue(8)]);

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
      // Only draw points that are on screen
      if (
        points[i].y <
        this.game.getCanvasHeight() + this.game.getScaledValue(100)
      ) {
        ctx.lineTo(points[i].x, points[i].y);
      }
    }

    ctx.stroke();

    // Draw target point marker - bigger and more visible using scaled values
    ctx.fillStyle = "rgba(255, 255, 0, 0.9)";
    ctx.shadowColor = "rgba(255, 255, 0, 0.6)";
    ctx.shadowBlur = this.game.getScaledValue(15);

    ctx.beginPath();
    ctx.arc(targetX, targetY, this.game.getScaledValue(8), 0, Math.PI * 2);
    ctx.fill();

    // Draw start point marker
    ctx.fillStyle = "rgba(0, 255, 0, 0.9)";
    ctx.shadowColor = "rgba(0, 255, 0, 0.6)";
    ctx.shadowBlur = this.game.getScaledValue(10);

    ctx.beginPath();
    ctx.arc(startX, startY, this.game.getScaledValue(6), 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Render a single sock - make it very visible using scaled dimensions
  renderSock(ctx, sock) {
    console.log("Rendering sock at frame:", sock.age, {
      position: { x: sock.x, y: sock.y },
      type: sock.type,
      rotation: sock.rotation,
      glowEffect: sock.glowEffect,
    });

    ctx.save();

    // Make sock very visible with glow
    ctx.shadowColor = "yellow";
    ctx.shadowBlur = this.game.getScaledValue(20);

    // Apply rotation
    ctx.translate(sock.x, sock.y);
    ctx.rotate(sock.rotation);

    // Try to find the image
    const imageKey = `sock${sock.type}.png`;
    console.log("Looking for image:", imageKey);
    console.log("Available images:", Object.keys(this.game.images || {}));

    // Draw sock - use scaled size for consistency
    const sockSize = this.game.getScaledValue(50);
    const halfSize = sockSize / 2;

    if (this.game.images && this.game.images[imageKey]) {
      console.log("Drawing sock image");
      ctx.drawImage(
        this.game.images[imageKey],
        -halfSize,
        -halfSize,
        sockSize,
        sockSize
      );
    } else {
      console.log("Drawing fallback sock - bright colored rectangle");
      // Fallback: draw a bright colored rectangle
      ctx.fillStyle = `hsl(${sock.type * 60}, 100%, 50%)`;
      ctx.fillRect(-halfSize, -halfSize, sockSize, sockSize);

      // Add a white border for visibility
      ctx.strokeStyle = "white";
      ctx.lineWidth = this.game.getScaledValue(3);
      ctx.strokeRect(-halfSize, -halfSize, sockSize, sockSize);

      // Add a label for debugging
      ctx.fillStyle = "white";
      ctx.font = `bold ${this.game.getScaledValue(16)}px Arial`;
      ctx.textAlign = "center";
      ctx.fillText(`S${sock.type}`, 0, this.game.getScaledValue(5));
    }

    // Draw debug info around the sock
    if (GameConfig.DEBUG_PHYSICS_BOUNDS) {
      ctx.fillStyle = "white";
      ctx.font = `${this.game.getScaledValue(12)}px Arial`;
      ctx.textAlign = "center";
      // ctx.fillText(`Age: ${sock.age}`, 0, -this.game.getScaledValue(35));
      // ctx.fillText(`Pos: ${Math.round(sock.x)},${Math.round(sock.y)}`, 0, this.game.getScaledValue(40));
    }

    ctx.restore();
  }
}
