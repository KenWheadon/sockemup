class MatchScreen extends Screen {
  constructor(game) {
    super(game);
    this.sockManager = new SockManager(game);
    this.physics = new MatchPhysics(game);
    this.dropZones = [];
    this.draggedSock = null;
    this.dragOffset = { x: 0, y: 0 };
    this.isDragging = false;
    this.dropZoneHover = null;
    this.sockPileHover = false;
    this.matchStreak = 0;
    this.lastMatchTime = 0;
    this.timeWarningPlayed = false;
    this.countdownTickPlayed = false;

    // Velocity tracking for throwing
    this.dragHistory = [];
    this.maxDragHistoryLength = 5;
    this.velocityScale = 12; // Scale factor for throw velocity - increased significantly
    this.maxThrowVelocity = 45; // Maximum throw velocity - increased for more dramatic throws
  }

  createLayoutCache() {
    const baseLayout = super.createLayoutCache();
    const canvasWidth = this.game.getCanvasWidth();
    const canvasHeight = this.game.getCanvasHeight();

    return {
      ...baseLayout,
      titleX: this.game.getScaledValue(20),
      titleY: canvasHeight - this.game.getScaledValue(80),
      instructionX: this.game.getScaledValue(20),
      instructionY: canvasHeight - this.game.getScaledValue(40),
      timeX: canvasWidth / 2,
      timeY: this.game.getScaledValue(30),
      dropZoneSize: this.game.getScaledValue(80),
      dropZoneSpacing: this.game.getScaledValue(100),
      dropZoneAreaY: canvasHeight / 3,
      pairWidth: canvasWidth / GameConfig.DROP_TARGET_PAIRS,
      sockPileX: canvasWidth / 2,
      sockPileY: canvasHeight - this.game.getScaledValue(100),
      sockPileSize: this.game.getScaledValue(120),
      sockBallsOffsetX: this.game.getScaledValue(80),
      sockBallsOffsetY: this.game.getScaledValue(-50),
      streakX: canvasWidth - this.game.getScaledValue(20),
      streakY: this.game.getScaledValue(30),
    };
  }

  setup() {
    super.setup();
    this.game.canvas.className = "matching-phase";
    this.sockManager.initialize();
    this.sockManager.setSockList(this.game.sockList);
    this.setupDropZones();
    this.setupSockPilePosition();
    this.draggedSock = null;
    this.isDragging = false;
    this.dropZoneHover = null;
    this.sockPileHover = false;
    this.matchStreak = 0;
    this.lastMatchTime = 0;
    this.timeWarningPlayed = false;
    this.countdownTickPlayed = false;
    this.dragHistory = [];

    // Start match music
    console.log("🎵 Match screen setup - starting match music");
    this.game.audioManager.playMusic("match-music", true, 0.3);
  }

  cleanup() {
    super.cleanup();

    // Stop match music when leaving match screen
    console.log("🎵 Match screen cleanup - stopping match music");
    this.game.audioManager.stopMusic();
  }

  onResize() {
    this.setupDropZones();
    this.setupSockPilePosition();
  }

  setupDropZones() {
    const layout = this.layoutCache;
    this.dropZones = [];

    for (let pairId = 0; pairId < GameConfig.DROP_TARGET_PAIRS; pairId++) {
      const pairCenterX = layout.pairWidth / 2 + pairId * layout.pairWidth;

      this.dropZones.push({
        x: pairCenterX,
        y: layout.dropZoneAreaY - layout.dropZoneSpacing / 2,
        width: layout.dropZoneSize,
        height: layout.dropZoneSize,
        pairId: pairId,
        zoneIndex: 0,
        sock: null,
        glowEffect: 0,
        hoverEffect: 0,
        id: pairId * 2,
      });

      this.dropZones.push({
        x: pairCenterX,
        y: layout.dropZoneAreaY + layout.dropZoneSpacing / 2,
        width: layout.dropZoneSize,
        height: layout.dropZoneSize,
        pairId: pairId,
        zoneIndex: 1,
        sock: null,
        glowEffect: 0,
        hoverEffect: 0,
        id: pairId * 2 + 1,
      });
    }
  }

  setupSockPilePosition() {
    const layout = this.layoutCache;
    const sockPile = this.sockManager.sockPile;
    sockPile.x = layout.sockPileX;
    sockPile.y = layout.sockPileY;
    sockPile.width = layout.sockPileSize;
    sockPile.height = layout.sockPileSize;
  }

  onMouseDown(x, y) {
    if (this.sockManager.checkSockPileClick(x, y)) {
      this.shootSockFromPile();
      return true;
    }

    return this.checkSockClick(x, y);
  }

  checkSockClick(x, y) {
    const sock = this.sockManager.getSockAt(x, y);
    if (sock) {
      this.draggedSock = sock;
      this.dragOffset = { x: x - sock.x, y: y - sock.y };
      this.isDragging = true;

      // Initialize drag history for velocity tracking
      this.dragHistory = [
        {
          x: x,
          y: y,
          timestamp: Date.now(),
        },
      ];

      this.dropZones.forEach((zone) => {
        if (zone.sock === sock) {
          zone.sock = null;
        }
      });

      return true;
    }
    return false;
  }

  onMouseMove(x, y) {
    if (this.draggedSock) {
      this.draggedSock.x = x - this.dragOffset.x;
      this.draggedSock.y = y - this.dragOffset.y;
      this.draggedSock.vx = 0;
      this.draggedSock.vy = 0;

      // Track drag history for velocity calculation
      const currentTime = Date.now();
      this.dragHistory.push({
        x: x,
        y: y,
        timestamp: currentTime,
      });

      // Keep only recent history
      if (this.dragHistory.length > this.maxDragHistoryLength) {
        this.dragHistory.shift();
      }

      // Remove old entries (older than 150ms for more responsive throwing)
      this.dragHistory = this.dragHistory.filter(
        (entry) => currentTime - entry.timestamp < 150
      );
    }

    this.updateHoverEffects(x, y);
  }

  calculateThrowVelocity() {
    if (this.dragHistory.length < 2) {
      return { x: 0, y: 0 };
    }

    // Use the most recent entries to calculate velocity
    const recent = this.dragHistory.slice(-2); // Use last 2 entries for more responsive throwing
    if (recent.length < 2) {
      return { x: 0, y: 0 };
    }

    const startEntry = recent[0];
    const endEntry = recent[recent.length - 1];

    const deltaTime = endEntry.timestamp - startEntry.timestamp;
    if (deltaTime === 0) {
      return { x: 0, y: 0 };
    }

    const deltaX = endEntry.x - startEntry.x;
    const deltaY = endEntry.y - startEntry.y;

    // Calculate velocity (pixels per millisecond, then scale)
    let vx = (deltaX / deltaTime) * this.velocityScale;
    let vy = (deltaY / deltaTime) * this.velocityScale;

    // Apply velocity limits
    const magnitude = Math.sqrt(vx * vx + vy * vy);
    if (magnitude > this.maxThrowVelocity) {
      const scale = this.maxThrowVelocity / magnitude;
      vx *= scale;
      vy *= scale;
    }

    return { x: vx, y: vy };
  }

  updateHoverEffects(x, y) {
    this.sockPileHover = this.sockManager.checkSockPileClick(x, y);
    this.dropZoneHover = null;

    if (this.draggedSock) {
      const snapDistance = this.game.getScaledValue(80);

      this.dropZones.forEach((zone) => {
        const distance = this.physics.getDropZoneDistance(
          this.draggedSock,
          zone
        );
        if (distance < snapDistance) {
          this.dropZoneHover = zone.id;
        }
      });
    }
  }

  onMouseUp() {
    if (!this.draggedSock) return;

    const sock = this.draggedSock;
    const snapDistance = this.game.getScaledValue(60);
    let snapped = false;

    this.dropZones.forEach((zone) => {
      const distance = this.physics.getDropZoneDistance(sock, zone);

      if (distance < snapDistance) {
        if (zone.sock === null) {
          zone.sock = sock;
          this.physics.snapToDropZone(sock, zone);
          snapped = true;
          this.createSnapEffect(zone);
        } else {
          // Zone occupied, throw the sock with calculated velocity
          const throwVelocity = this.calculateThrowVelocity();
          this.physics.applySockThrow(sock, throwVelocity);
        }
      }
    });

    if (!snapped) {
      // Not near a drop zone, throw the sock with calculated velocity
      const throwVelocity = this.calculateThrowVelocity();
      this.physics.applySockThrow(sock, throwVelocity);
    }

    this.draggedSock = null;
    this.isDragging = false;
    this.dropZoneHover = null;
    this.dragHistory = [];
    this.checkForMatches();
  }

  shootSockFromPile() {
    const newSock = this.sockManager.shootSockFromPile();
    if (!newSock) return;

    // Play pile click sound
    this.game.audioManager.playSound("pile-click", false, 0.4);
  }

  createSnapEffect(zone) {
    zone.glowEffect = 20;

    // Play snap-to-zone sound
    this.game.audioManager.playSound("snap-to-zone", false, 0.3);
  }

  checkForMatches() {
    const currentTime = Date.now();
    let matchFound = false;

    for (let pairId = 0; pairId < GameConfig.DROP_TARGET_PAIRS; pairId++) {
      const pairZones = this.dropZones.filter((zone) => zone.pairId === pairId);

      if (pairZones.length === 2 && pairZones[0].sock && pairZones[1].sock) {
        if (pairZones[0].sock.type === pairZones[1].sock.type) {
          // MATCH - track the sock type for sockball creation
          const matchedSockType = pairZones[0].sock.type;

          // Add this sockball type to the game's sockball queue
          this.game.addSockballToQueue(matchedSockType);

          // Play match sound
          this.game.audioManager.playSound("easter-egg-match", false, 0.5);

          // Play points gained sound with slight delay
          setTimeout(() => {
            this.game.audioManager.playSound("points-gained", false, 0.4);
          }, 500);

          this.startMatchAnimation(pairZones[0].sock, pairZones[1].sock);
          pairZones[0].sock = null;
          pairZones[1].sock = null;
          matchFound = true;

          // Update streak
          if (currentTime - this.lastMatchTime < 3000) {
            this.matchStreak++;
          } else {
            this.matchStreak = 1;
          }
          this.lastMatchTime = currentTime;

          // Screen shake effect
          this.createScreenShake();
        } else {
          // MISMATCH - new behavior
          this.handleMismatch(pairZones[0].sock, pairZones[1].sock);
          pairZones[0].sock = null;
          pairZones[1].sock = null;

          // Reset streak on mismatch
          this.matchStreak = 0;
          this.lastMatchTime = 0;
        }
      }
    }

    if (!matchFound && currentTime - this.lastMatchTime > 5000) {
      this.matchStreak = 0;
    }
  }

  handleMismatch(sock1, sock2) {
    // Play mismatch sound
    this.game.audioManager.playSound("easter-egg-mismatch", false, 0.6);

    // Create mismatch particle effects
    this.sockManager.createMismatchEffect(sock1, sock2);

    // Throw both socks in random directions with more force
    const throwForce = 12; // Stronger than normal throws

    this.physics.applySockThrow(sock1, {
      x: (Math.random() - 0.5) * throwForce,
      y: (Math.random() - 0.5) * throwForce,
    });

    this.physics.applySockThrow(sock2, {
      x: (Math.random() - 0.5) * throwForce,
      y: (Math.random() - 0.5) * throwForce,
    });

    // Add some visual feedback
    sock1.glowEffect = 30;
    sock2.glowEffect = 30;

    // Create a different screen shake for mismatch
    this.createMismatchShake();
  }

  createMismatchShake() {
    // More intense shake for mismatch
    const canvas = this.game.canvas;
    const originalTransform = canvas.style.transform;

    let shakeIntensity = 4; // Stronger than match shake
    let shakeCount = 0;
    const maxShakes = 8; // More shakes

    const shake = () => {
      if (shakeCount < maxShakes) {
        const offsetX = (Math.random() - 0.5) * shakeIntensity;
        const offsetY = (Math.random() - 0.5) * shakeIntensity;
        canvas.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
        shakeCount++;
        shakeIntensity *= 0.85;
        setTimeout(shake, 40); // Slightly faster shake
      } else {
        canvas.style.transform = originalTransform;
      }
    };

    shake();
  }

  startMatchAnimation(sock1, sock2) {
    this.sockManager.startMatchAnimation(sock1, sock2);
  }

  createScreenShake() {
    // Simple screen shake effect by temporarily adjusting canvas transform
    const canvas = this.game.canvas;
    const originalTransform = canvas.style.transform;

    let shakeIntensity = 2;
    let shakeCount = 0;
    const maxShakes = 6;

    const shake = () => {
      if (shakeCount < maxShakes) {
        const offsetX = (Math.random() - 0.5) * shakeIntensity;
        const offsetY = (Math.random() - 0.5) * shakeIntensity;
        canvas.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
        shakeCount++;
        shakeIntensity *= 0.8;
        setTimeout(shake, 50);
      } else {
        canvas.style.transform = originalTransform;
      }
    };

    shake();
  }

  onUpdate(deltaTime) {
    // Fixed timer: Convert deltaTime from milliseconds to seconds and subtract directly
    // This makes the timer independent of framerate
    const timeDecrement = deltaTime / 1000; // Convert milliseconds to seconds
    this.game.timeRemaining -= timeDecrement;

    // Handle countdown audio
    const timeValue = Math.max(0, Math.floor(this.game.timeRemaining));
    if (timeValue <= 10 && timeValue > 0) {
      if (!this.timeWarningPlayed) {
        this.timeWarningPlayed = true;
        // Play countdown tick sound for last 10 seconds
        this.game.audioManager.playSound("countdown-tick", false, 0.3);
      }

      // Play tick sound every second during countdown
      if (timeValue !== this.lastCountdownTick) {
        this.lastCountdownTick = timeValue;
        this.game.audioManager.playSound("countdown-tick", false, 0.3);
      }
    }

    if (this.game.timeRemaining <= 0) {
      this.game.startThrowingPhase();
      return;
    }

    this.sockManager.socks.forEach((sock) => {
      if (
        sock !== this.draggedSock &&
        !this.sockManager.isSockInAnimation(sock)
      ) {
        this.physics.updateSock(sock);
      }
    });

    this.sockManager.update(deltaTime);

    this.dropZones.forEach((zone) => {
      if (zone.glowEffect > 0) zone.glowEffect--;
      if (zone.hoverEffect > 0) zone.hoverEffect--;
    });

    if (
      this.sockManager.getSockListLength() === 0 &&
      this.game.sockBalls >= GameConfig.LEVELS[this.game.currentLevel].sockPairs
    ) {
      this.game.startThrowingPhase();
    }
  }

  onRender(ctx) {
    this.sockManager.renderSockPile(ctx);
    this.renderDropZonePairBoxes(ctx);
    this.renderDropZones(ctx);
    this.sockManager.renderSocks(ctx);

    if (this.draggedSock) {
      this.renderDraggedSock(ctx);
    }

    this.sockManager.renderSockballAnimations(ctx);
    this.sockManager.renderParticleEffects(ctx);
    this.renderMatchScreenUI(ctx);
  }

  renderDropZonePairBoxes(ctx) {
    const layout = this.layoutCache;
    const lineWidth = this.game.getScaledValue(2);
    const dashLength = this.game.getScaledValue(5);
    const margin = this.game.getScaledValue(50);

    for (let pairId = 0; pairId < GameConfig.DROP_TARGET_PAIRS; pairId++) {
      const pairZones = this.dropZones.filter((zone) => zone.pairId === pairId);

      if (pairZones.length === 2) {
        const minX = Math.min(pairZones[0].x, pairZones[1].x) - margin;
        const maxX = Math.max(pairZones[0].x, pairZones[1].x) + margin;
        const minY = Math.min(pairZones[0].y, pairZones[1].y) - margin;
        const maxY = Math.max(pairZones[0].y, pairZones[1].y) + margin;

        ctx.save();
        ctx.strokeStyle = "rgba(200, 200, 200, 0.5)";
        ctx.lineWidth = lineWidth;
        ctx.setLineDash([dashLength, dashLength]);
        ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);

        this.renderText(
          ctx,
          `Pair ${pairId + 1}`,
          (minX + maxX) / 2,
          minY - this.game.getScaledValue(10),
          {
            fontSize: layout.bodyFontSize,
            color: "rgba(255, 255, 255, 0.8)",
          }
        );

        ctx.restore();
      }
    }
  }

  renderDropZones(ctx) {
    const lineWidth = this.game.getScaledValue(2);
    const hoverLineWidth = this.game.getScaledValue(3);
    const shadowBlur = this.game.getScaledValue(15);

    this.dropZones.forEach((zone, index) => {
      ctx.save();

      let glowIntensity = 0;
      if (zone.glowEffect > 0) {
        glowIntensity = zone.glowEffect / 20;
      }
      if (this.dropZoneHover === index) {
        glowIntensity = Math.max(glowIntensity, 0.8);
      }

      if (glowIntensity > 0) {
        ctx.shadowColor = "rgba(100, 255, 100, " + glowIntensity + ")";
        ctx.shadowBlur = shadowBlur;
      }

      ctx.strokeStyle = zone.sock ? "rgba(100, 255, 100, 0.8)" : "white";
      ctx.lineWidth = this.dropZoneHover === index ? hoverLineWidth : lineWidth;
      ctx.strokeRect(
        zone.x - zone.width / 2,
        zone.y - zone.height / 2,
        zone.width,
        zone.height
      );

      if (this.dropZoneHover === index) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
        ctx.fillRect(
          zone.x - zone.width / 2,
          zone.y - zone.height / 2,
          zone.width,
          zone.height
        );
      }

      ctx.restore();
    });
  }

  renderDraggedSock(ctx) {
    if (!this.draggedSock) return;

    const lineWidth = this.game.getScaledValue(3);
    const shadowBlur = this.game.getScaledValue(15);
    const borderOffset = this.game.getScaledValue(2);

    ctx.save();
    ctx.shadowColor = "yellow";
    ctx.shadowBlur = shadowBlur;

    ctx.restore();
  }

  renderMatchScreenUI(ctx) {
    const layout = this.layoutCache;

    // Title at bottom left
    this.renderText(ctx, "MATCH THOSE SOCKS", layout.titleX, layout.titleY, {
      fontSize: layout.titleFontSize,
      weight: "bold",
      color: "rgba(255, 255, 255, 0.9)",
      align: "left",
    });

    // Instructions at bottom left
    this.renderText(
      ctx,
      "Click sock pile - make sock pairs",
      layout.instructionX,
      layout.instructionY,
      {
        fontSize: layout.bodyFontSize,
        color: "rgba(255, 255, 255, 0.8)",
        align: "left",
      }
    );

    // Time at top center
    const timeValue = Math.max(0, Math.floor(this.game.timeRemaining));
    const timeColor =
      timeValue <= 10
        ? Math.sin(this.pulseTimer * 0.5) > 0
          ? "rgba(255, 68, 68, 0.9)"
          : "rgba(255, 255, 255, 0.9)"
        : "rgba(255, 255, 255, 0.9)";

    // Enhanced time display with background
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 2;
    const timeText = `Time: ${timeValue}s`;
    const timeMetrics = ctx.measureText(timeText);
    const timePadding = this.game.getScaledValue(16);
    const timeBoxWidth = timeMetrics.width + timePadding * 10;
    const timeBoxHeight = layout.headerFontSize + timePadding;

    ctx.fillRect(
      layout.timeX - timeBoxWidth / 2,
      layout.timeY - timeBoxHeight / 2,
      timeBoxWidth,
      timeBoxHeight
    );
    ctx.strokeRect(
      layout.timeX - timeBoxWidth / 2,
      layout.timeY - timeBoxHeight / 2,
      timeBoxWidth,
      timeBoxHeight
    );
    ctx.restore();

    this.renderText(ctx, timeText, layout.timeX, layout.timeY, {
      fontSize: layout.headerFontSize,
      align: "center",
      color: timeColor,
      weight: "bold",
    });

    // Sock balls counter near sock pile
    const sockBallsX = layout.sockPileX + layout.sockBallsOffsetX;
    const sockBallsY = layout.sockPileY + layout.sockBallsOffsetY;

    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.strokeStyle = "rgba(255, 215, 0, 0.6)";
    ctx.lineWidth = 2;
    const sockBallText = `${this.game.sockBalls}`;
    const sockBallMetrics = ctx.measureText(sockBallText);
    const sockBallPadding = this.game.getScaledValue(12);
    const sockBallBoxWidth = sockBallMetrics.width + sockBallPadding * 2;
    const sockBallBoxHeight = layout.headerFontSize + sockBallPadding;

    ctx.fillRect(
      sockBallsX - sockBallBoxWidth / 2,
      sockBallsY - sockBallBoxHeight / 2,
      sockBallBoxWidth,
      sockBallBoxHeight
    );
    ctx.strokeRect(
      sockBallsX - sockBallBoxWidth / 2,
      sockBallsY - sockBallBoxHeight / 2,
      sockBallBoxWidth,
      sockBallBoxHeight
    );
    ctx.restore();

    this.renderText(ctx, sockBallText, sockBallsX, sockBallsY, {
      fontSize: layout.headerFontSize,
      align: "center",
      color: "rgba(255, 215, 0, 0.9)",
      weight: "bold",
    });

    // Streak counter (only show if streak > 1)
    if (this.matchStreak > 1) {
      ctx.save();
      ctx.fillStyle = "rgba(138, 43, 226, 0.4)";
      ctx.strokeStyle = "rgba(138, 43, 226, 0.8)";
      ctx.lineWidth = 2;
      const streakText = `${this.matchStreak}x STREAK!`;
      const streakMetrics = ctx.measureText(streakText);
      const streakPadding = this.game.getScaledValue(12);
      const streakBoxWidth = streakMetrics.width + streakPadding * 10;
      const streakBoxHeight = layout.headerFontSize + streakPadding;

      ctx.fillRect(
        layout.streakX - streakBoxWidth,
        layout.streakY - streakBoxHeight / 2,
        streakBoxWidth,
        streakBoxHeight
      );
      ctx.strokeRect(
        layout.streakX - streakBoxWidth,
        layout.streakY - streakBoxHeight / 2,
        streakBoxWidth,
        streakBoxHeight
      );
      ctx.restore();

      this.renderText(
        ctx,
        streakText,
        layout.streakX - this.game.getScaledValue(10),
        layout.streakY,
        {
          fontSize: layout.headerFontSize,
          align: "right",
          color: "rgba(255, 255, 255, 0.9)",
          weight: "bold",
        }
      );
    }
  }
}
