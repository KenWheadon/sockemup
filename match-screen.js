class MatchScreen {
  constructor(game) {
    this.game = game;
    this.sockManager = new SockManager(game);
    this.physics = new MatchPhysics(game);

    // Drop zones
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

    // Setup drop zones
    this.dropZones = GameConfig.DROP_ZONE_POSITIONS.map((pos, index) => ({
      ...pos,
      sock: null,
      glowEffect: 0,
      hoverEffect: 0,
      id: index,
    }));

    // Reset states
    this.draggedSock = null;
    this.isDragging = false;
    this.dropZoneHover = null;
    this.sockPileHover = false;
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

    // Check for match
    this.checkForMatch();
  }

  shootSockFromPile() {
    const newSock = this.sockManager.shootSockFromPile();
    if (!newSock) return;

    console.log("Shot sock from pile:", newSock.type);
  }

  createSnapEffect(zone) {
    zone.glowEffect = 20;
  }

  checkForMatch() {
    if (this.dropZones[0].sock && this.dropZones[1].sock) {
      if (this.dropZones[0].sock.type === this.dropZones[1].sock.type) {
        this.startMatchAnimation(
          this.dropZones[0].sock,
          this.dropZones[1].sock
        );

        // Clear drop zones
        this.dropZones[0].sock = null;
        this.dropZones[1].sock = null;
      }
    }
  }

  startMatchAnimation(sock1, sock2) {
    this.sockManager.startMatchAnimation(sock1, sock2);
  }

  update() {
    // Update time
    this.game.timeRemaining -= 1 / 60;

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
    // Simple background instruction
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.font = "32px Arial";
    ctx.textAlign = "center";
    ctx.fillText("MATCH THOSE SOCKS", this.game.canvas.width / 2, 50);

    // Draw physics bounds if debug is enabled
    this.physics.renderDebugBounds(ctx);

    // Draw sock pile
    this.sockManager.renderSockPile(ctx);

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
}
