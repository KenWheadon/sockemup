class MatchScreen {
  constructor(game) {
    this.game = game;
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

  setup() {
    this.game.canvas.className = "matching-phase";

    // Initialize components
    this.sockManager.initialize();
    this.sockManager.setSockList(this.game.sockList);

    // Setup drop zones with responsive positioning
    this.setupDropZones();

    // Setup responsive sock pile position
    this.setupSockPilePosition();

    // Reset states
    this.draggedSock = null;
    this.isDragging = false;
    this.dropZoneHover = null;
    this.sockPileHover = false;
  }

  setupDropZones() {
    // Calculate responsive positions for drop zones
    const canvasWidth = this.game.canvas.width;
    const canvasHeight = this.game.canvas.height;

    // Calculate positions for 3 pairs across the screen
    const pairWidth = canvasWidth / GameConfig.DROP_TARGET_PAIRS; // Leave space on edges
    const startX = pairWidth / 2;
    const centerY = canvasHeight / 3;

    this.dropZones = [];

    for (let pairId = 0; pairId < GameConfig.DROP_TARGET_PAIRS; pairId++) {
      const pairCenterX = startX + pairId * pairWidth;

      // First zone of the pair (top)
      this.dropZones.push({
        x: pairCenterX,
        y: centerY - 50,
        width: 80,
        height: 80,
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
        y: centerY + 50,
        width: 80,
        height: 80,
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
    // Make sock pile responsive to screen width
    const canvasWidth = this.game.canvas.width;
    const canvasHeight = this.game.canvas.height;

    // Position sock pile at bottom center, taking up full width consideration
    this.sockManager.sockPile.x = canvasWidth / 2;
    this.sockManager.sockPile.y = canvasHeight - 100; // 100px from bottom
    this.sockManager.sockPile.width = Math.min(120, canvasWidth / 10); // Responsive width
    this.sockManager.sockPile.height = Math.min(120, canvasWidth / 10); // Responsive height
  }

  handleMouseDown(x, y) {
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

  handleMouseMove(x, y) {
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
        if (distance < 80) {
          this.dropZoneHover = zone.id;
        }
      });
    }
  }

  handleMouseUp() {
    if (!this.draggedSock) return;

    const sock = this.draggedSock;
    let snapped = false;

    // Check for drop zone snapping
    this.dropZones.forEach((zone) => {
      const distance = this.physics.getDropZoneDistance(sock, zone);

      if (distance < 60) {
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

  update() {
    // Update time
    this.game.timeRemaining -= 0.25 / 60;

    if (this.game.timeRemaining <= 0) {
      this.game.startShootingPhase();
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

    // Update sock manager
    this.sockManager.update();

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
      this.game.startShootingPhase();
    }
  }

  render(ctx) {
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
    // Draw boxes around each pair of drop zones
    for (let pairId = 0; pairId < GameConfig.DROP_TARGET_PAIRS; pairId++) {
      const pairZones = this.dropZones.filter((zone) => zone.pairId === pairId);

      if (pairZones.length === 2) {
        const minX = Math.min(pairZones[0].x, pairZones[1].x) - 50;
        const maxX = Math.max(pairZones[0].x, pairZones[1].x) + 50;
        const minY = Math.min(pairZones[0].y, pairZones[1].y) - 50;
        const maxY = Math.max(pairZones[0].y, pairZones[1].y) + 50;

        ctx.save();
        ctx.strokeStyle = "rgba(200, 200, 200, 0.5)";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);

        // Draw pair label
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.fillText(`Pair ${pairId + 1}`, (minX + maxX) / 2, minY - 10);

        ctx.restore();
      }
    }
  }

  renderDropZones(ctx) {
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
        ctx.shadowBlur = 15;
      }

      ctx.strokeStyle = zone.sock ? "rgba(100, 255, 100, 0.8)" : "white";
      ctx.lineWidth = this.dropZoneHover === index ? 3 : 2;
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

    ctx.save();

    // Simple highlight for dragged sock
    ctx.shadowColor = "yellow";
    ctx.shadowBlur = 15;
    ctx.strokeStyle = "yellow";
    ctx.lineWidth = 3;

    const sock = this.draggedSock;
    const drawX = sock.x - sock.width / 2;
    const drawY = sock.y - sock.height / 2;

    ctx.strokeRect(drawX - 2, drawY - 2, sock.width + 4, sock.height + 4);

    ctx.restore();
  }

  renderMatchScreenUI(ctx) {
    ctx.save();

    // Set up UI text style
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.strokeStyle = "rgba(0, 0, 0, 0.7)";
    ctx.lineWidth = 2;
    ctx.font = "24px Arial";
    ctx.textAlign = "center";

    // Instructions at top
    ctx.font = "32px Arial";
    ctx.strokeText("MATCH THOSE SOCKS", this.game.canvas.width / 2, 50);
    ctx.fillText("MATCH THOSE SOCKS", this.game.canvas.width / 2, 50);

    // Smaller instruction text
    ctx.font = "16px Arial";
    ctx.strokeText(
      "Click sock pile to shoot socks • Drag socks to drop zones",
      this.game.canvas.width / 2,
      80
    );
    ctx.fillText(
      "Click sock pile to shoot socks • Drag socks to drop zones",
      this.game.canvas.width / 2,
      80
    );

    // Time remaining (top left)
    ctx.textAlign = "left";
    ctx.font = "20px Arial";
    const timeValue = Math.max(0, Math.floor(this.game.timeRemaining));
    const timeText = `Time: ${timeValue}s`;

    // Add warning color if time is low
    if (timeValue <= 10) {
      ctx.fillStyle =
        Math.sin(Date.now() * 0.01) > 0
          ? "rgba(255, 68, 68, 0.9)"
          : "rgba(255, 255, 255, 0.9)";
    } else {
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    }

    ctx.strokeText(timeText, 20, 30);
    ctx.fillText(timeText, 20, 30);

    // Sock balls (top right)
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    const sockBallsText = `Sock Balls: ${this.game.sockBalls}`;
    ctx.strokeText(sockBallsText, this.game.canvas.width - 20, 30);
    ctx.fillText(sockBallsText, this.game.canvas.width - 20, 30);

    // Remaining socks (bottom right)
    const remainingSocks = this.sockManager.getSockListLength();
    const remainingText = `Remaining: ${remainingSocks}`;
    ctx.strokeText(
      remainingText,
      this.game.canvas.width - 20,
      this.game.canvas.height - 20
    );
    ctx.fillText(
      remainingText,
      this.game.canvas.width - 20,
      this.game.canvas.height - 20
    );

    ctx.restore();
  }
}
