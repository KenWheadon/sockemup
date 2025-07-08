class SockManager {
  constructor(game) {
    this.game = game;
    this.socks = [];
    this.sockList = [];
    this.sockPile = null;
    this.particleEffects = [];

    // Animation states
    this.shootAnimations = [];
    this.matchAnimations = [];
    this.sockballAnimations = [];
  }

  initialize() {
    // Initialize sock pile with responsive positioning
    this.sockPile = {
      x: this.game.canvas.width / 2, // Will be updated by match screen
      y: this.game.canvas.height - 100,
      width: Math.min(120, this.game.canvas.width / 10),
      height: Math.min(120, this.game.canvas.width / 10),
      currentImage: "sockpile1.png",
      glowEffect: 0,
      bounceEffect: 0,
      pulseEffect: 0,
    };

    this.socks = [];
    this.particleEffects = [];
    this.shootAnimations = [];
    this.matchAnimations = [];
    this.sockballAnimations = [];
  }

  setSockList(sockList) {
    this.sockList = [...sockList];
    this.updateSockPileImage();
    console.log("SockManager initialized with", this.sockList.length, "socks");
  }

  shootSockFromPile() {
    if (this.sockList.length === 0) {
      console.log("No socks left in pile");
      return null;
    }

    const sockType = this.sockList.pop();
    console.log(
      "Shooting sock type:",
      sockType,
      "- remaining:",
      this.sockList.length
    );

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
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      scale: 1,
      glowEffect: 15,
    };

    this.socks.push(newSock);
    this.updateSockPileImage();
    this.createShootEffect(newSock);

    return newSock;
  }

  createShootEffect(sock) {
    // Create simple particles when shooting
    for (let i = 0; i < 6; i++) {
      this.particleEffects.push({
        x: sock.x + (Math.random() - 0.5) * 20,
        y: sock.y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        life: 30,
        maxLife: 30,
        color: "#FFD700",
        size: 2 + Math.random() * 2,
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

  getSockAt(x, y) {
    for (let i = this.socks.length - 1; i >= 0; i--) {
      const sock = this.socks[i];

      // Skip socks that are in animations
      if (this.isSockInAnimation(sock)) continue;

      if (
        x >= sock.x - sock.width / 2 &&
        x <= sock.x + sock.width / 2 &&
        y >= sock.y - sock.height / 2 &&
        y <= sock.y + sock.height / 2
      ) {
        return sock;
      }
    }
    return null;
  }

  isSockInAnimation(sock) {
    return this.matchAnimations.some((anim) => anim.socks.includes(sock));
  }

  removeSock(sock) {
    const index = this.socks.indexOf(sock);
    if (index > -1) {
      this.socks.splice(index, 1);
    }
  }

  startMatchAnimation(sock1, sock2) {
    const animation = {
      socks: [sock1, sock2],
      phase: "wiggle",
      timer: 0,
      wiggleDuration: 45, // Increased from 15 to 45 (0.75 seconds at 60fps)
      shrinkDuration: 30, // Increased from 15 to 30 (0.5 seconds at 60fps)
      sockType: sock1.type,
      centerX: (sock1.x + sock2.x) / 2,
      centerY: (sock1.y + sock2.y) / 2,
      scale: 1,
      wiggleIntensity: 0,
      glowEffect: 30,
    };

    this.matchAnimations.push(animation);
    this.createMatchStartEffect(animation);
  }

  createMatchStartEffect(animation) {
    // Create excitement particles
    const colors = ["#FFD700", "#FF69B4", "#00CED1", "#98FB98", "#DDA0DD"];

    for (let i = 0; i < 15; i++) {
      this.particleEffects.push({
        x: animation.centerX + (Math.random() - 0.5) * 80,
        y: animation.centerY + (Math.random() - 0.5) * 80,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 50,
        maxLife: 50,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3 + Math.random() * 4,
      });
    }
  }

  updateMatchAnimations() {
    this.matchAnimations.forEach((animation, index) => {
      animation.timer++;

      if (animation.phase === "wiggle") {
        // Smooth wiggle and grow phase with easing
        const progress = animation.timer / animation.wiggleDuration;
        const easeProgress = this.easeInOutSine(progress);

        // Gentle growth with smooth easing
        animation.scale = 1 + easeProgress * 0.2; // Reduced from 0.3 to 0.2 for gentler effect

        // Smoother wiggle with less intensity
        const wiggleFreq = progress * Math.PI * 3; // Reduced frequency
        animation.wiggleIntensity = Math.sin(wiggleFreq) * 3 * easeProgress; // Reduced intensity

        // Less frequent particle generation
        if (animation.timer % 8 === 0) {
          // Reduced from every 3 frames to every 8
          this.particleEffects.push({
            x: animation.centerX + (Math.random() - 0.5) * 40,
            y: animation.centerY + (Math.random() - 0.5) * 40,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            life: 40,
            maxLife: 40,
            color: "#FFD700",
            size: 1 + Math.random() * 1.5,
          });
        }

        if (animation.timer >= animation.wiggleDuration) {
          animation.phase = "shrink";
          animation.timer = 0;
          console.log(
            "Creating sockball at:",
            animation.centerX,
            animation.centerY
          );
          this.createSockballAnimation(animation);
        }
      } else if (animation.phase === "shrink") {
        // Smooth shrink phase with easing
        const progress = animation.timer / animation.shrinkDuration;
        const easeProgress = this.easeInQuart(progress); // Smooth ease-in for shrinking

        animation.scale = 1.2 * (1 - easeProgress); // Shrink smoothly
        animation.wiggleIntensity = 0;

        if (animation.timer >= animation.shrinkDuration) {
          console.log("Match animation complete, removing socks");
          this.completeMatch(animation);
          this.matchAnimations.splice(index, 1);
        }
      }
    });
  }

  // Easing functions for smooth animations
  easeInOutSine(t) {
    return -(Math.cos(Math.PI * t) - 1) / 2;
  }

  easeInQuart(t) {
    return t * t * t * t;
  }

  easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  createSockballAnimation(animation) {
    const sockballImage = GameConfig.IMAGES.SOCK_BALLS[animation.sockType - 1];
    const targetX = this.game.canvas.width - 50;
    const targetY = 20;

    // console.log("Creating sockball:", {
    //   image: sockballImage,
    //   startX: animation.centerX,
    //   startY: animation.centerY,
    //   targetX: targetX,
    //   targetY: targetY,
    //   sockType: animation.sockType,
    // });

    const sockballAnim = {
      image: sockballImage,
      x: animation.centerX,
      y: animation.centerY,
      targetX: targetX,
      targetY: targetY,
      progress: 0,
      wiggleOffset: 0,
      scale: 4,
      rotation: 0,
      rotationSpeed: 0.1, // Reduced from 0.2 to 0.05 for smoother rotation
      glowEffect: 40,
      rainbowEffect: 60,
      rainbowOffset: 0,
      phase: "entrance",
      entranceTimer: 0,
    };

    this.sockballAnimations.push(sockballAnim);
    console.log(
      "Sockball animation created, total animations:",
      this.sockballAnimations.length
    );
  }

  updateSockballAnimations() {
    this.sockballAnimations.forEach((animation, index) => {
      animation.wiggleOffset += 0.1; // Reduced from 0.4 to 0.1 for gentler wiggle
      animation.rotation += animation.rotationSpeed;
      animation.rainbowOffset += 0.05; // Reduced from 0.1 to 0.05 for smoother rainbow

      if (animation.phase === "entrance") {
        // Smooth entrance phase
        animation.entranceTimer += 1;
        const entranceProgress = animation.entranceTimer / 60; // 60 frames = 1 second entrance

        // Gentle pulsing scale with smooth easing
        const pulse = Math.sin(animation.entranceTimer * 0.15) * 0.1; // Reduced frequency and intensity
        animation.scale =
          2 + pulse * this.easeInOutSine(Math.min(entranceProgress, 1));

        // After 60 frames (1 second), start traveling
        if (animation.entranceTimer >= 60) {
          animation.phase = "traveling";
          animation.progress = 0;
          console.log("Sockball starting to travel");
        }
      } else if (animation.phase === "traveling") {
        // Smooth traveling phase
        animation.progress += 0.012; // Reduced from GameConfig.SOCKBALL_ANIMATION_SPEED/100 for slower travel

        // Smooth scale transition
        const scaleProgress = this.easeOutCubic(animation.progress);
        animation.scale = 1.2 - scaleProgress * 0.4; // Gentle scale down
        if (animation.scale < 0.8) animation.scale = 0.8;

        // Smooth position interpolation with easing
        const positionProgress = this.easeInOutCubic(animation.progress);
        const startX = animation.x || animation.centerX;
        const startY = animation.y || animation.centerY;

        // Store initial position if not set
        if (!animation.startX) {
          animation.startX = animation.x;
          animation.startY = animation.y;
        }

        animation.x =
          animation.startX +
          (animation.targetX - animation.startX) * positionProgress;
        animation.y =
          animation.startY +
          (animation.targetY - animation.startY) * positionProgress;

        if (animation.progress >= 1) {
          console.log("Sockball reached target, incrementing counter");
          this.game.sockBalls++;
          this.sockballAnimations.splice(index, 1);
          this.createArrivalEffect(animation.targetX, animation.targetY);
        }
      }

      // Gentler effect diminishing
      if (animation.glowEffect > 0) animation.glowEffect -= 0.3; // Reduced from 0.5
      if (animation.rainbowEffect > 0) animation.rainbowEffect -= 0.4; // Reduced from 0.8
    });
  }

  createArrivalEffect(x, y) {
    const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7"];

    for (let i = 0; i < 20; i++) {
      this.particleEffects.push({
        x: x + (Math.random() - 0.5) * 60,
        y: y + (Math.random() - 0.5) * 60,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12,
        life: 40,
        maxLife: 40,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 2 + Math.random() * 3,
      });
    }
  }

  completeMatch(animation) {
    // Remove matched socks
    this.socks = this.socks.filter(
      (sock) => sock !== animation.socks[0] && sock !== animation.socks[1]
    );
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
    // Update sock pile effects
    if (this.sockPile.bounceEffect > 0) this.sockPile.bounceEffect--;
    if (this.sockPile.glowEffect > 0) this.sockPile.glowEffect--;
    if (this.sockPile.pulseEffect > 0) this.sockPile.pulseEffect--;

    // Update sock effects
    this.socks.forEach((sock) => {
      if (sock.glowEffect > 0) sock.glowEffect--;
    });
  }

  update() {
    this.updateMatchAnimations();
    this.updateSockballAnimations();
    this.updateParticleEffects();
    this.updateEffects();
  }

  renderSockPile(ctx) {
    if (
      !this.sockPile.currentImage ||
      !this.game.images[this.sockPile.currentImage]
    )
      return;

    ctx.save();

    // Apply effects
    let scale = 1.5;
    let bounceOffset = 0;

    if (this.sockPile.glowEffect > 0) {
      ctx.shadowColor = "#FFD700";
      ctx.shadowBlur = this.sockPile.glowEffect;
    }

    if (this.sockPile.bounceEffect > 0) {
      bounceOffset = Math.sin(this.sockPile.bounceEffect * 0.5) * 8;
    }

    if (this.sockPile.pulseEffect > 0) {
      scale = 1 + Math.sin(this.sockPile.pulseEffect * 0.3) * 0.1;
    }

    // Draw sock pile with full width consideration
    const drawWidth = this.sockPile.width * scale;
    const drawHeight = this.sockPile.height * scale;

    ctx.drawImage(
      this.game.images[this.sockPile.currentImage],
      this.sockPile.x - drawWidth / 2,
      this.sockPile.y - drawHeight / 2 + bounceOffset,
      drawWidth,
      drawHeight
    );

    // Draw border around sock pile area to show full width
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(
      50, // Full width border
      this.sockPile.y - drawHeight / 2 - 20,
      this.game.canvas.width - 100,
      drawHeight + 40
    );

    ctx.restore();
  }

  renderSocks(ctx) {
    this.socks.forEach((sock) => {
      ctx.save();

      let drawX = sock.x - sock.width / 2;
      let drawY = sock.y - sock.height / 2;

      // Apply match animation effects
      this.matchAnimations.forEach((animation) => {
        if (animation.socks.includes(sock)) {
          if (animation.phase === "wiggle") {
            drawX +=
              Math.sin(animation.timer * 0.8) * animation.wiggleIntensity;
            drawY +=
              Math.cos(animation.timer * 0.8) * animation.wiggleIntensity;
          }

          ctx.translate(sock.x, sock.y);
          ctx.scale(animation.scale, animation.scale);
          ctx.translate(-sock.x, -sock.y);

          // Add glow during animation
          ctx.shadowColor = "#FFD700";
          ctx.shadowBlur = 20;
        }
      });

      // Apply glow effect
      if (sock.glowEffect > 0) {
        ctx.shadowColor = "rgba(255, 200, 100, 0.8)";
        ctx.shadowBlur = sock.glowEffect;
      }

      // Apply rotation
      if (sock.rotation) {
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
      if (!this.game.images[animation.image]) {
        console.log("Missing sockball image:", animation.image);
        return;
      }

      ctx.save();

      // Gentler rainbow effect
      if (animation.rainbowEffect > 0) {
        const hue = (animation.rainbowOffset * 180) % 360; // Reduced speed
        const intensity = Math.min(animation.rainbowEffect / 60, 1);
        ctx.shadowColor = `hsl(${hue}, 70%, 60%)`;
        ctx.shadowBlur = 10 * intensity; // Reduced blur intensity
      }

      // Gentler glow effect
      if (animation.glowEffect > 0) {
        ctx.shadowColor = "#FFD700";
        ctx.shadowBlur = Math.min(animation.glowEffect, 15); // Capped blur
      }

      // Subtle wiggle and rotation
      const wiggle = Math.sin(animation.wiggleOffset) * 1.5; // Reduced from 4 to 1.5
      ctx.translate(animation.x, animation.y);
      ctx.rotate(animation.rotation);
      ctx.scale(animation.scale, animation.scale);

      // Draw the sockball
      const size = GameConfig.SOCKBALL_SIZE;
      ctx.drawImage(
        this.game.images[animation.image],
        -size / 2 + wiggle,
        -size / 2,
        size,
        size
      );

      // Debug: draw a circle to show position
      if (GameConfig.DEBUG_PHYSICS_BOUNDS) {
        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;
        ctx.strokeRect(-size / 2, -size / 2, size, size);
      }

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
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });
  }

  checkSockPileClick(x, y) {
    if (!this.sockPile || !this.sockPile.currentImage) {
      // console.log("No sock pile or image");
      return false;
    }

    const inBounds =
      x >= this.sockPile.x - this.sockPile.width / 2 &&
      x <= this.sockPile.x + this.sockPile.width / 2 &&
      y >= this.sockPile.y - this.sockPile.height / 2 &&
      y <= this.sockPile.y + this.sockPile.height / 2;

    const hasStock = this.sockList.length > 0;

    // console.log("Sock pile click check:", {
    //   inBounds,
    //   hasStock,
    //   sockCount: this.sockList.length,
    // });

    return inBounds && hasStock;
  }

  getSockCount() {
    return this.socks.length;
  }

  getSockListLength() {
    return this.sockList.length;
  }
}
