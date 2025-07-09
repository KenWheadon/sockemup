class MatchScreen extends Screen {
  constructor(game) {
    super(game);
    this.sockManager = new SockManager(game);
    this.physics = new MatchPhysics(game);

    // Drop zones - now supports 3 pairs
    this.dropZones = [];

    // Drag state
    this.draggedSock = null;
    this.dragOffset = { x: 0, y: 0 };
    this.isDragging = false;

    // UI state
    this.dropZoneHover = null;
    this.sockPileHover = false;
  }

  createLayoutCache() {
    const baseLayout = super.createLayoutCache();
    const canvasWidth = this.game.getCanvasWidth();
    const canvasHeight = this.game.getCanvasHeight();

    return {
      ...baseLayout,

      // Title positioning
      titleY: this.game.getScaledValue(50),
      instructionY: this.game.getScaledValue(80),

      // Drop zone configuration
      dropZoneSize: this.game.getScaledValue(80),
      dropZoneSpacing: this.game.getScaledValue(100),
      dropZoneAreaY: canvasHeight / 3,
      pairWidth: canvasWidth / GameConfig.DROP_TARGET_PAIRS,

      // Sock pile configuration
      sockPileX: canvasWidth / 2,
      sockPileY: canvasHeight - this.game.getScaledValue(100),
      sockPileSize: this.game.getScaledValue(120),

      // UI stats positioning
      timeX: this.game.getScaledValue(20),
      timeY: this.game.getScaledValue(30),
      sockBallsX: canvasWidth - this.game.getScaledValue(20),
      sockBallsY: this.game.getScaledValue(30),
      remainingX: canvasWidth - this.game.getScaledValue(20),
      remainingY: canvasHeight - this.game.getScaledValue(20),
    };
  }

  setup() {
    super.setup();
    this.game.canvas.className = "matching-phase";

    // Initialize components
    this.sockManager.initialize();
    this.sockManager.setSockList(this.game.sockList);

    // Setup drop zones and sock pile
    this.setupDropZones();
    this.setupSockPilePosition();

    // Reset states
    this.draggedSock = null;
    this.isDragging = false;
    this.dropZoneHover = null;
    this.sockPileHover = false;
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

      // First zone of the pair (top)
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

      // Second zone of the pair (bottom)
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
    this.sockManager.sockPile.x = layout.sockPileX;
    this.sockManager.sockPile.y = layout.sockPileY;
    this.sockManager.sockPile.width = layout.sockPileSize;
    this.sockManager.sockPile.height = layout.sockPileSize;
  }

  onMouseDown(x, y) {
    // Check if clicking on sock pile
    if (this.sockManager.checkSockPileClick(x, y)) {
      this.shootSockFromPile();
      return true;
    }

    // Check if clicking on existing sock
    return this.checkSockClick(x, y);
  }

  checkSockClick(x, y) {
    const sock = this.sockManager.getSockAt(x, y);
    if (sock) {
      this.draggedSock = sock;
      this.dragOffset = { x: x - sock.x, y: y - sock.y };
      this.isDragging = true;

      // Remove from drop zone if it was there
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
    // Update drag position
    if (this.draggedSock) {
      this.draggedSock.x = x - this.dragOffset.x;
      this.draggedSock.y = y - this.dragOffset.y;
      this.draggedSock.vx = 0;
      this.draggedSock.vy = 0;
    }

    // Update hover effects
    this.updateHoverEffects(x, y);
  }

  updateHoverEffects(x, y) {
    // Check sock pile hover
    this.sockPileHover = this.sockManager.checkSockPileClick(x, y);

    // Check drop zone hover
    this.dropZoneHover = null;
    if (this.draggedSock) {
      this.dropZones.forEach((zone) => {
        const distance = this.physics.getDropZoneDistance(
          this.draggedSock,
          zone
        );
        if (distance < this.game.getScaledValue(80)) {
          this.dropZoneHover = zone.id;
        }
      });
    }
  }

  onMouseUp() {
    if (!this.draggedSock) return;

    const sock = this.draggedSock;
    let snapped = false;

    // Check for drop zone snapping
    this.dropZones.forEach((zone) => {
      const distance = this.physics.getDropZoneDistance(sock, zone);
      const snapDistance = this.game.getScaledValue(60);

      if (distance < snapDistance) {
        if (zone.sock === null) {
          zone.sock = sock;
          this.physics.snapToDropZone(sock, zone);
          snapped = true;
          this.createSnapEffect(zone);
        } else {
          // Zone occupied, throw sock away
          this.physics.applySockThrow(sock, {
            x: (Math.random() - 0.5) * 10,
            y: (Math.random() - 0.5) * 10,
          });
        }
      }
    });

    // If not snapped, apply throw physics
    if (!snapped) {
      this.physics.applySockThrow(sock, {
        x: (Math.random() - 0.5) * 8,
        y: (Math.random() - 0.5) * 8,
      });
    }

    this.draggedSock = null;
    this.isDragging = false;
    this.dropZoneHover = null;

    // Check for matches across all pairs
    this.checkForMatches();
  }

  shootSockFromPile() {
    const newSock = this.sockManager.shootSockFromPile();
    if (!newSock) return;

    console.log("Shot sock from pile:", newSock.type);
  }

  createSnapEffect(zone) {
    zone.glowEffect = 20;
  }

  checkForMatches() {
    // Check each pair for matches
    for (let pairId = 0; pairId < GameConfig.DROP_TARGET_PAIRS; pairId++) {
      const pairZones = this.dropZones.filter((zone) => zone.pairId === pairId);

      if (pairZones.length === 2 && pairZones[0].sock && pairZones[1].sock) {
        if (pairZones[0].sock.type === pairZones[1].sock.type) {
          this.startMatchAnimation(pairZones[0].sock, pairZones[1].sock);

          // Clear the pair
          pairZones[0].sock = null;
          pairZones[1].sock = null;
        }
      }
    }
  }

  startMatchAnimation(sock1, sock2) {
    this.sockManager.startMatchAnimation(sock1, sock2);
  }

  onUpdate(deltaTime) {
    // Update time with frame-rate independent timing
    const timeDecrement = (0.25 / 60) * (deltaTime / 16.67); // Normalize to 60fps
    this.game.timeRemaining -= timeDecrement;

    if (this.game.timeRemaining <= 0) {
      this.game.startThrowingPhase();
      return;
    }

    // Update physics for all socks
    this.sockManager.socks.forEach((sock) => {
      if (
        sock !== this.draggedSock &&
        !this.sockManager.isSockInAnimation(sock)
      ) {
        this.physics.updateSock(sock);
      }
    });

    // Update sock manager with delta time
    this.sockManager.update(deltaTime);

    // Update drop zone effects
    this.dropZones.forEach((zone) => {
      if (zone.glowEffect > 0) zone.glowEffect--;
      if (zone.hoverEffect > 0) zone.hoverEffect--;
    });

    // Check if matching phase is complete
    if (
      this.sockManager.getSockListLength() === 0 &&
      this.game.sockBalls >= GameConfig.LEVELS[this.game.currentLevel].sockPairs
    ) {
      this.game.startThrowingPhase();
    }
  }

  onRender(ctx) {
    // Draw physics bounds if debug is enabled
    this.physics.renderDebugBounds(ctx);

    // Draw sock pile
    this.sockManager.renderSockPile(ctx);

    // Draw drop zone pair boxes
    this.renderDropZonePairBoxes(ctx);

    // Draw drop zones
    this.renderDropZones(ctx);

    // Draw socks
    this.sockManager.renderSocks(ctx);

    // Highlight dragged sock
    if (this.draggedSock) {
      this.renderDraggedSock(ctx);
    }

    // Draw sockball animations
    this.sockManager.renderSockballAnimations(ctx);

    // Draw particle effects
    this.sockManager.renderParticleEffects(ctx);

    // Render UI elements on canvas
    this.renderMatchScreenUI(ctx);
  }

  renderDropZonePairBoxes(ctx) {
    const layout = this.layoutCache;
    const lineWidth = this.game.getScaledValue(2);
    const dashLength = this.game.getScaledValue(5);
    const margin = this.game.getScaledValue(50);

    // Draw boxes around each pair of drop zones
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

        // Draw pair label
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

      // Base drop zone
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

      // Draw hover background
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

    // Simple highlight for dragged sock
    ctx.shadowColor = "yellow";
    ctx.shadowBlur = shadowBlur;
    ctx.strokeStyle = "yellow";
    ctx.lineWidth = lineWidth;

    const sock = this.draggedSock;
    const drawX = sock.x - sock.width / 2;
    const drawY = sock.y - sock.height / 2;

    ctx.strokeRect(
      drawX - borderOffset,
      drawY - borderOffset,
      sock.width + borderOffset * 2,
      sock.height + borderOffset * 2
    );

    ctx.restore();
  }

  renderMatchScreenUI(ctx) {
    const layout = this.layoutCache;

    // Instructions at top
    this.renderText(ctx, "MATCH THOSE SOCKS", layout.centerX, layout.titleY, {
      fontSize: layout.titleFontSize,
      weight: "bold",
      color: "rgba(255, 255, 255, 0.9)",
    });

    this.renderText(
      ctx,
      "Click sock pile to shoot socks • Drag socks to drop zones",
      layout.centerX,
      layout.instructionY,
      {
        fontSize: layout.bodyFontSize,
        color: "rgba(255, 255, 255, 0.9)",
      }
    );

    // Time remaining (top left)
    const timeValue = Math.max(0, Math.floor(this.game.timeRemaining));
    const timeColor =
      timeValue <= 10
        ? Math.sin(this.pulseTimer * 0.5) > 0
          ? "rgba(255, 68, 68, 0.9)"
          : "rgba(255, 255, 255, 0.9)"
        : "rgba(255, 255, 255, 0.9)";

    this.renderText(ctx, `Time: ${timeValue}s`, layout.timeX, layout.timeY, {
      fontSize: layout.headerFontSize,
      align: "left",
      color: timeColor,
    });

    // Sock balls (top right)
    this.renderText(
      ctx,
      `Sock Balls: ${this.game.sockBalls}`,
      layout.sockBallsX,
      layout.sockBallsY,
      {
        fontSize: layout.headerFontSize,
        align: "right",
        color: "rgba(255, 255, 255, 0.9)",
      }
    );

    // Remaining socks (bottom right)
    const remainingSocks = this.sockManager.getSockListLength();
    this.renderText(
      ctx,
      `Remaining: ${remainingSocks}`,
      layout.remainingX,
      layout.remainingY,
      {
        fontSize: layout.headerFontSize,
        align: "right",
        color: "rgba(255, 255, 255, 0.9)",
      }
    );
  }
}
