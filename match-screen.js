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
  }

  createLayoutCache() {
    const baseLayout = super.createLayoutCache();
    const canvasWidth = this.game.getCanvasWidth();
    const canvasHeight = this.game.getCanvasHeight();

    return {
      ...baseLayout,
      titleY: this.game.getScaledValue(50),
      instructionY: this.game.getScaledValue(80),
      dropZoneSize: this.game.getScaledValue(80),
      dropZoneSpacing: this.game.getScaledValue(100),
      dropZoneAreaY: canvasHeight / 3,
      pairWidth: canvasWidth / GameConfig.DROP_TARGET_PAIRS,
      sockPileX: canvasWidth / 2,
      sockPileY: canvasHeight - this.game.getScaledValue(100),
      sockPileSize: this.game.getScaledValue(120),
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
    this.sockManager.initialize();
    this.sockManager.setSockList(this.game.sockList);
    this.setupDropZones();
    this.setupSockPilePosition();
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
    }

    this.updateHoverEffects(x, y);
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
          this.physics.applySockThrow(sock, {
            x: (Math.random() - 0.5) * 10,
            y: (Math.random() - 0.5) * 10,
          });
        }
      }
    });

    if (!snapped) {
      this.physics.applySockThrow(sock, {
        x: (Math.random() - 0.5) * 8,
        y: (Math.random() - 0.5) * 8,
      });
    }

    this.draggedSock = null;
    this.isDragging = false;
    this.dropZoneHover = null;
    this.checkForMatches();
  }

  shootSockFromPile() {
    const newSock = this.sockManager.shootSockFromPile();
    if (!newSock) return;
  }

  createSnapEffect(zone) {
    zone.glowEffect = 20;
  }

  checkForMatches() {
    for (let pairId = 0; pairId < GameConfig.DROP_TARGET_PAIRS; pairId++) {
      const pairZones = this.dropZones.filter((zone) => zone.pairId === pairId);

      if (pairZones.length === 2 && pairZones[0].sock && pairZones[1].sock) {
        if (pairZones[0].sock.type === pairZones[1].sock.type) {
          this.startMatchAnimation(pairZones[0].sock, pairZones[1].sock);
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
    const timeDecrement = (0.25 / 60) * (deltaTime / 16.67);
    this.game.timeRemaining -= timeDecrement;

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
    this.physics.renderDebugBounds(ctx);
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
