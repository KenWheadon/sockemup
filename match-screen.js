class MatchScreen {
  constructor(game) {
    this.game = game;
    this.sockPile = null;
    this.socks = [];
    this.dropZones = [];
    this.sockList = [];
    this.matchAnimations = [];
    this.sockballAnimations = [];
    this.particleEffects = [];

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

    this.sockPile = {
      x: GameConfig.SOCK_PILE_POS.x,
      y: GameConfig.SOCK_PILE_POS.y,
      width: 100,
      height: 100,
      currentImage: "sockpile1.png",
      glowEffect: 0,
      bounceEffect: 0,
    };

    this.dropZones = GameConfig.DROP_ZONE_POSITIONS.map((pos, index) => ({
      ...pos,
      sock: null,
      glowEffect: 0,
      hoverEffect: 0,
      id: index,
    }));

    this.socks = [];
    this.matchAnimations = [];
    this.sockballAnimations = [];
    this.particleEffects = [];
    this.draggedSock = null;
    this.isDragging = false;
    this.dropZoneHover = null;
    this.sockPileHover = false;
  }

  handleMouseDown(x, y) {
    // Check if clicking on sock pile
    if (this.checkSockPileClick(x, y)) {
      this.shootSockFromPile();
      return true;
    }

    // Check if clicking on existing sock
    return this.checkSockClick(x, y);
  }

  checkSockPileClick(x, y) {
    if (!this.sockPile || !this.sockPile.currentImage) return false;

    return (
      x >= this.sockPile.x - this.sockPile.width / 2 &&
      x <= this.sockPile.x + this.sockPile.width / 2 &&
      y >= this.sockPile.y - this.sockPile.height / 2 &&
      y <= this.sockPile.y + this.sockPile.height / 2 &&
      this.sockList.length > 0
    );
  }

  checkSockClick(x, y) {
    for (let i = this.socks.length - 1; i >= 0; i--) {
      const sock = this.socks[i];

      // Skip socks that are in match animations
      const sockInAnimation = this.matchAnimations.some((anim) =>
        anim.socks.includes(sock)
      );
      if (sockInAnimation) continue;

      if (
        x >= sock.x - sock.width / 2 &&
        x <= sock.x + sock.width / 2 &&
        y >= sock.y - sock.height / 2 &&
        y <= sock.y + sock.height / 2
      ) {
        this.draggedSock = sock;
        this.dragOffset = { x: x - sock.x, y: y - sock.y };
        this.isDragging = true;
        sock.bouncing = false;

        // Remove from drop zone if it was there
        this.dropZones.forEach((zone) => {
          if (zone.sock === sock) {
            zone.sock = null;
          }
        });

        return true;
      }
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
    this.sockPileHover = this.checkSockPileClick(x, y);

    // Check drop zone hover
    this.dropZoneHover = null;
    if (this.draggedSock) {
      this.dropZones.forEach((zone) => {
        const distance = Math.sqrt(
          Math.pow(x - zone.x, 2) + Math.pow(y - zone.y, 2)
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
      const distance = Math.sqrt(
        Math.pow(sock.x - zone.x, 2) + Math.pow(sock.y - zone.y, 2)
      );

      if (distance < 60) {
        if (zone.sock === null) {
          zone.sock = sock;
          sock.x = zone.x;
          sock.y = zone.y;
          snapped = true;

          // Add satisfying snap effect
          this.createSnapEffect(zone);
        } else {
          // Zone occupied, throw sock away with more dramatic effect
          sock.vx = (Math.random() - 0.5) * 15;
          sock.vy = (Math.random() - 0.5) * 15;
          sock.bouncing = true;
          this.createBounceEffect(sock);
        }
      }
    });

    // If not snapped, start bouncing
    if (!snapped) {
      sock.vx = (Math.random() - 0.5) * 12;
      sock.vy = (Math.random() - 0.5) * 12;
      sock.bouncing = true;
      this.createBounceEffect(sock);
    }

    this.draggedSock = null;
    this.isDragging = false;
    this.dropZoneHover = null;
    this.checkForMatch();
  }

  shootSockFromPile() {
    if (this.sockList.length === 0) return;

    const sockType = this.sockList.pop();

    // Create exciting shoot animation
    this.sockPile.bounceEffect = 20;
    this.sockPile.glowEffect = 30;

    // Random upward angle with more variation
    const angle = Math.PI / 4 + (Math.random() * Math.PI) / 2;
    const speed = GameConfig.SOCK_SHOOT_SPEED + Math.random() * 4;

    const newSock = {
      id: Date.now(),
      type: sockType,
      x: this.sockPile.x,
      y: this.sockPile.y,
      width: GameConfig.SOCK_SIZE,
      height: GameConfig.SOCK_SIZE,
      vx: Math.cos(angle) * speed,
      vy: -Math.sin(angle) * speed,
      bouncing: true,
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 0.3,
      scale: 1,
      glowEffect: 15,
    };

    this.socks.push(newSock);
    this.updateSockPileImage();
    this.createShootEffect(newSock);
  }

  createShootEffect(sock) {
    // Create particles when shooting
    for (let i = 0; i < 8; i++) {
      this.particleEffects.push({
        x: sock.x + (Math.random() - 0.5) * 20,
        y: sock.y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 30,
        maxLife: 30,
        color: `hsl(${Math.random() * 360}, 70%, 70%)`,
      });
    }
  }

  createSnapEffect(zone) {
    zone.glowEffect = 20;

    // Create snap particles
    for (let i = 0; i < 6; i++) {
      this.particleEffects.push({
        x: zone.x + (Math.random() - 0.5) * 40,
        y: zone.y + (Math.random() - 0.5) * 40,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        life: 25,
        maxLife: 25,
        color: "rgba(255, 255, 255, 0.8)",
      });
    }
  }

  createBounceEffect(sock) {
    sock.glowEffect = 10;

    // Create bounce particles
    for (let i = 0; i < 4; i++) {
      this.particleEffects.push({
        x: sock.x + (Math.random() - 0.5) * 30,
        y: sock.y + (Math.random() - 0.5) * 30,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        life: 20,
        maxLife: 20,
        color: "rgba(255, 200, 100, 0.6)",
      });
    }
  }

  updateSockPileImage() {
    const remaining = this.sockList.length;
    const total = GameConfig.LEVELS[this.game.currentLevel].sockPairs * 2;
    const percentage = (remaining / total) * 100;

    if (percentage <= 0) {
      this.sockPile.currentImage = null;
    } else if (percentage <= GameConfig.SOCK_PILE_THRESHOLDS.IMAGE_4) {
      this.sockPile.currentImage = "sockpile4.png";
    } else if (percentage <= GameConfig.SOCK_PILE_THRESHOLDS.IMAGE_3) {
      this.sockPile.currentImage = "sockpile3.png";
    } else if (percentage <= GameConfig.SOCK_PILE_THRESHOLDS.IMAGE_2) {
      this.sockPile.currentImage = "sockpile2.png";
    } else {
      this.sockPile.currentImage = "sockpile1.png";
    }
  }

  checkForMatch() {
    if (this.dropZones[0].sock && this.dropZones[1].sock) {
      if (this.dropZones[0].sock.type === this.dropZones[1].sock.type) {
        this.startMatchAnimation(
          this.dropZones[0].sock,
          this.dropZones[1].sock
        );
      }
    }
  }

  startMatchAnimation(sock1, sock2) {
    // Create dramatic match animation
    this.matchAnimations.push({
      socks: [sock1, sock2],
      phase: "buildup",
      timer: 0,
      buildupDuration: 30,
      explosionDuration: 15,
      sockType: sock1.type,
      centerX: (sock1.x + sock2.x) / 2,
      centerY: (sock1.y + sock2.y) / 2,
      scale: 1,
      rotation: 0,
      particles: [],
    });

    // Create initial excitement particles
    for (let i = 0; i < 12; i++) {
      this.particleEffects.push({
        x: (sock1.x + sock2.x) / 2 + (Math.random() - 0.5) * 60,
        y: (sock1.y + sock2.y) / 2 + (Math.random() - 0.5) * 60,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 40,
        maxLife: 40,
        color: `hsl(${60 + Math.random() * 120}, 80%, 70%)`,
      });
    }
  }

  updateMatchAnimations() {
    this.matchAnimations.forEach((animation, index) => {
      animation.timer++;

      if (animation.phase === "buildup") {
        // Buildup phase - socks grow and shake
        const progress = animation.timer / animation.buildupDuration;
        animation.scale = 1 + Math.sin(progress * Math.PI * 4) * 0.1;
        animation.rotation = Math.sin(progress * Math.PI * 8) * 0.2;

        // Add more particles during buildup
        if (animation.timer % 5 === 0) {
          for (let i = 0; i < 3; i++) {
            this.particleEffects.push({
              x: animation.centerX + (Math.random() - 0.5) * 80,
              y: animation.centerY + (Math.random() - 0.5) * 80,
              vx: (Math.random() - 0.5) * 8,
              vy: (Math.random() - 0.5) * 8,
              life: 30,
              maxLife: 30,
              color: `hsl(${120 + Math.random() * 120}, 70%, 60%)`,
            });
          }
        }

        if (animation.timer >= animation.buildupDuration) {
          animation.phase = "explosion";
          animation.timer = 0;
          this.createExplosionEffect(animation);
        }
      } else if (animation.phase === "explosion") {
        // Explosion phase - dramatic effect
        const progress = animation.timer / animation.explosionDuration;
        animation.scale = 1 + progress * 2;
        animation.rotation += 0.5;

        if (animation.timer >= animation.explosionDuration) {
          // Create sockball and clean up
          this.createSockballAnimation(animation);
          this.completeMatch(animation);
          this.matchAnimations.splice(index, 1);
        }
      }
    });
  }

  createExplosionEffect(animation) {
    // Create dramatic explosion particles
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const speed = 5 + Math.random() * 8;
      this.particleEffects.push({
        x: animation.centerX,
        y: animation.centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 35,
        maxLife: 35,
        color: `hsl(${Math.random() * 360}, 80%, 70%)`,
      });
    }
  }

  createSockballAnimation(animation) {
    const sockballImage = GameConfig.IMAGES.SOCK_BALLS[animation.sockType - 1];
    const targetX = this.game.canvas.width - 200;
    const targetY = 150;

    this.sockballAnimations.push({
      image: sockballImage,
      x: animation.centerX,
      y: animation.centerY,
      targetX: targetX,
      targetY: targetY,
      progress: 0,
      wiggleOffset: 0,
      scale: 2, // Start large
      rotation: 0,
      rotationSpeed: 0.2,
      glowEffect: 30,
    });
  }

  completeMatch(animation) {
    // Remove matched socks
    this.socks = this.socks.filter(
      (sock) => sock !== animation.socks[0] && sock !== animation.socks[1]
    );

    // Clear drop zones
    this.dropZones[0].sock = null;
    this.dropZones[1].sock = null;

    // Add glow effect to drop zones
    this.dropZones.forEach((zone) => {
      zone.glowEffect = 25;
    });
  }

  updateSockballAnimations() {
    this.sockballAnimations.forEach((animation, index) => {
      animation.progress += GameConfig.SOCKBALL_ANIMATION_SPEED / 100;
      animation.wiggleOffset += 0.3;
      animation.rotation += animation.rotationSpeed;

      // Scale decreases as it moves
      animation.scale = 2 - animation.progress * 1.5;
      if (animation.scale < 0.5) animation.scale = 0.5;

      // Glow effect diminishes
      if (animation.glowEffect > 0) animation.glowEffect--;

      if (animation.progress >= 1) {
        // Animation complete - increment sockball counter
        this.game.sockBalls++;
        this.sockballAnimations.splice(index, 1);

        // Create arrival effect
        this.createArrivalEffect(animation.targetX, animation.targetY);
      } else {
        // Smooth interpolation with easing
        const ease = 1 - Math.pow(1 - animation.progress, 3);
        animation.x = animation.x + (animation.targetX - animation.x) * ease;
        animation.y = animation.y + (animation.targetY - animation.y) * ease;
      }
    });
  }

  createArrivalEffect(x, y) {
    // Create arrival particles
    for (let i = 0; i < 10; i++) {
      this.particleEffects.push({
        x: x + (Math.random() - 0.5) * 50,
        y: y + (Math.random() - 0.5) * 50,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        life: 25,
        maxLife: 25,
        color: `hsl(${Math.random() * 60 + 30}, 90%, 70%)`,
      });
    }
  }

  updateParticleEffects() {
    this.particleEffects.forEach((particle, index) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vx *= 0.98;
      particle.vy *= 0.98;
      particle.life--;

      if (particle.life <= 0) {
        this.particleEffects.splice(index, 1);
      }
    });
  }

  updateEffects() {
    // Update all visual effects
    if (this.sockPile.bounceEffect > 0) this.sockPile.bounceEffect--;
    if (this.sockPile.glowEffect > 0) this.sockPile.glowEffect--;

    this.dropZones.forEach((zone) => {
      if (zone.glowEffect > 0) zone.glowEffect--;
      if (zone.hoverEffect > 0) zone.hoverEffect--;
    });

    this.socks.forEach((sock) => {
      if (sock.glowEffect > 0) sock.glowEffect--;
      if (sock.bouncing) {
        sock.rotation += sock.rotationSpeed;
      }
    });
  }

  update() {
    // Update time
    this.game.timeRemaining -= 1 / 60;

    if (this.game.timeRemaining <= 0) {
      this.game.startShootingPhase();
      return;
    }

    // Update bouncing socks
    this.updateBouncingSocks();

    // Update all animations and effects
    this.updateMatchAnimations();
    this.updateSockballAnimations();
    this.updateParticleEffects();
    this.updateEffects();

    // Check if matching phase is complete
    if (
      this.sockList.length === 0 &&
      this.game.sockBalls >= GameConfig.LEVELS[this.game.currentLevel].sockPairs
    ) {
      this.game.startShootingPhase();
    }
  }

  updateBouncingSocks() {
    this.socks.forEach((sock) => {
      if (sock.bouncing) {
        sock.x += sock.vx;
        sock.y += sock.vy;
        sock.vy += GameConfig.GRAVITY;

        // Bounce off physics bounds
        if (
          sock.x <= GameConfig.PHYSICS_BOUNDS.LEFT + sock.width / 2 ||
          sock.x >= GameConfig.PHYSICS_BOUNDS.RIGHT - sock.width / 2
        ) {
          sock.vx *= -GameConfig.BOUNCE_DAMPING;
          sock.x = Math.max(
            GameConfig.PHYSICS_BOUNDS.LEFT + sock.width / 2,
            Math.min(GameConfig.PHYSICS_BOUNDS.RIGHT - sock.width / 2, sock.x)
          );
        }
        if (
          sock.y <= GameConfig.PHYSICS_BOUNDS.TOP + sock.height / 2 ||
          sock.y >= GameConfig.PHYSICS_BOUNDS.BOTTOM - sock.height / 2
        ) {
          sock.vy *= -GameConfig.BOUNCE_DAMPING;
          sock.y = Math.max(
            GameConfig.PHYSICS_BOUNDS.TOP + sock.height / 2,
            Math.min(GameConfig.PHYSICS_BOUNDS.BOTTOM - sock.height / 2, sock.y)
          );
        }

        // Apply friction
        sock.vx *= GameConfig.FRICTION;
        sock.vy *= GameConfig.FRICTION;

        // Stop bouncing if velocity is low
        if (Math.abs(sock.vx) < 0.1 && Math.abs(sock.vy) < 0.1) {
          sock.bouncing = false;
        }
      }
    });
  }

  render(ctx) {
    // Draw background instruction with pulsing effect
    const pulse = Math.sin(Date.now() * 0.003) * 0.1 + 0.9;
    ctx.fillStyle = `rgba(255, 255, 255, ${0.1 * pulse})`;
    ctx.font = "48px Courier New";
    ctx.textAlign = "center";
    ctx.fillText(
      "MATCH THOSE SOCKS",
      this.game.canvas.width / 2,
      this.game.canvas.height / 2
    );

    // Draw physics bounds if debug is enabled
    if (GameConfig.DEBUG_PHYSICS_BOUNDS) {
      this.renderDebugBounds(ctx);
    }

    // Draw sock pile with effects
    this.renderSockPile(ctx);

    // Draw drop zones with effects
    this.renderDropZones(ctx);

    // Draw socks with effects
    this.renderSocks(ctx);

    // Draw sockball animations
    this.renderSockballAnimations(ctx);

    // Draw particle effects
    this.renderParticleEffects(ctx);

    // Draw match animations
    this.renderMatchAnimations(ctx);
  }

  renderDebugBounds(ctx) {
    ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
    ctx.lineWidth = 2;
    ctx.strokeRect(
      GameConfig.PHYSICS_BOUNDS.LEFT,
      GameConfig.PHYSICS_BOUNDS.TOP,
      GameConfig.PHYSICS_BOUNDS.RIGHT - GameConfig.PHYSICS_BOUNDS.LEFT,
      GameConfig.PHYSICS_BOUNDS.BOTTOM - GameConfig.PHYSICS_BOUNDS.TOP
    );

    ctx.fillStyle = "rgba(255, 0, 0, 0.8)";
    ctx.font = "12px Courier New";
    ctx.textAlign = "left";
    ctx.fillText(
      `${GameConfig.PHYSICS_BOUNDS.LEFT}, ${GameConfig.PHYSICS_BOUNDS.TOP}`,
      GameConfig.PHYSICS_BOUNDS.LEFT + 5,
      GameConfig.PHYSICS_BOUNDS.TOP + 15
    );
    ctx.textAlign = "right";
    ctx.fillText(
      `${GameConfig.PHYSICS_BOUNDS.RIGHT}, ${GameConfig.PHYSICS_BOUNDS.BOTTOM}`,
      GameConfig.PHYSICS_BOUNDS.RIGHT - 5,
      GameConfig.PHYSICS_BOUNDS.BOTTOM - 5
    );
  }

  renderSockPile(ctx) {
    if (
      !this.sockPile.currentImage ||
      !this.game.images[this.sockPile.currentImage]
    )
      return;

    ctx.save();

    // Apply glow effect
    if (this.sockPile.glowEffect > 0) {
      ctx.shadowColor = "rgba(255, 255, 100, 0.8)";
      ctx.shadowBlur = this.sockPile.glowEffect;
    }

    // Apply bounce effect
    let bounceOffset = 0;
    if (this.sockPile.bounceEffect > 0) {
      bounceOffset = Math.sin(this.sockPile.bounceEffect * 0.5) * 5;
    }

    // Apply hover effect
    let scale = 1;
    if (this.sockPileHover) {
      scale = 1.1;
      ctx.shadowColor = "rgba(255, 255, 255, 0.6)";
      ctx.shadowBlur = 10;
    }

    ctx.drawImage(
      this.game.images[this.sockPile.currentImage],
      this.sockPile.x - (this.sockPile.width * scale) / 2,
      this.sockPile.y - (this.sockPile.height * scale) / 2 + bounceOffset,
      this.sockPile.width * scale,
      this.sockPile.height * scale
    );

    ctx.restore();
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

      // Draw corner indicators
      if (this.dropZoneHover === index) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
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

  renderSocks(ctx) {
    this.socks.forEach((sock) => {
      ctx.save();

      let drawX = sock.x - sock.width / 2;
      let drawY = sock.y - sock.height / 2;

      // Apply effects from match animations
      this.matchAnimations.forEach((animation) => {
        if (animation.socks.includes(sock)) {
          if (animation.phase === "buildup") {
            drawX += (Math.random() - 0.5) * 4;
            drawY += (Math.random() - 0.5) * 4;
          }
          ctx.scale(animation.scale, animation.scale);
          ctx.rotate(animation.rotation);
        }
      });

      // Apply glow effect
      if (sock.glowEffect > 0) {
        ctx.shadowColor = "rgba(255, 200, 100, 0.8)";
        ctx.shadowBlur = sock.glowEffect;
      }

      // Highlight dragged sock
      if (this.draggedSock === sock) {
        ctx.strokeStyle = "yellow";
        ctx.lineWidth = 3;
        ctx.shadowColor = "rgba(255, 255, 0, 0.8)";
        ctx.shadowBlur = 15;
        ctx.strokeRect(drawX - 2, drawY - 2, sock.width + 4, sock.height + 4);
      }

      // Apply rotation for bouncing socks
      if (sock.bouncing && sock.rotation) {
        ctx.translate(sock.x, sock.y);
        ctx.rotate(sock.rotation);
        ctx.translate(-sock.x, -sock.y);
      }

      if (this.game.images[`sock${sock.type}.png`]) {
        ctx.drawImage(
          this.game.images[`sock${sock.type}.png`],
          drawX,
          drawY,
          sock.width,
          sock.height
        );
      }

      ctx.restore();
    });
  }

  renderSockballAnimations(ctx) {
    this.sockballAnimations.forEach((animation) => {
      if (!this.game.images[animation.image]) return;

      ctx.save();

      // Apply glow effect
      if (animation.glowEffect > 0) {
        ctx.shadowColor = "rgba(255, 255, 100, 0.8)";
        ctx.shadowBlur = animation.glowEffect;
      }

      // Apply wiggle and rotation
      const wiggle = Math.sin(animation.wiggleOffset) * 2;
      ctx.translate(animation.x, animation.y);
      ctx.rotate(animation.rotation);
      ctx.scale(animation.scale, animation.scale);

      ctx.drawImage(
        this.game.images[animation.image],
        -GameConfig.SOCKBALL_SIZE / 2 + wiggle,
        -GameConfig.SOCKBALL_SIZE / 2,
        GameConfig.SOCKBALL_SIZE,
        GameConfig.SOCKBALL_SIZE
      );

      ctx.restore();
    });
  }

  renderParticleEffects(ctx) {
    this.particleEffects.forEach((particle) => {
      ctx.save();

      const alpha = particle.life / particle.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;

      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });
  }

  renderMatchAnimations(ctx) {
    this.matchAnimations.forEach((animation) => {
      if (animation.phase === "explosion") {
        ctx.save();

        // Draw explosion effect
        const alpha = 1 - animation.timer / animation.explosionDuration;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";

        ctx.beginPath();
        ctx.arc(
          animation.centerX,
          animation.centerY,
          animation.scale * 30,
          0,
          Math.PI * 2
        );
        ctx.fill();

        ctx.restore();
      }
    });
  }
}
