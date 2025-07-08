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
    this.sockPile = {
      x: GameConfig.SOCK_PILE_POS.x,
      y: GameConfig.SOCK_PILE_POS.y,
      width: 100,
      height: 100,
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
      wiggleDuration: 15, // 0.25 seconds at 60fps
      shrinkDuration: 15, // 0.25 seconds at 60fps
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
        // Wiggle and grow phase
        const progress = animation.timer / animation.wiggleDuration;
        animation.scale = 1 + Math.sin(progress * Math.PI) * 0.3; // Grow up to 1.3x
        animation.wiggleIntensity = Math.sin(progress * Math.PI * 6) * 8; // Wiggle intensity

        // Add sparkle particles during wiggle
        if (animation.timer % 3 === 0) {
          this.particleEffects.push({
            x: animation.centerX + (Math.random() - 0.5) * 60,
            y: animation.centerY + (Math.random() - 0.5) * 60,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 25,
            maxLife: 25,
            color: "#FFD700",
            size: 1 + Math.random() * 2,
          });
        }

        if (animation.timer >= animation.wiggleDuration) {
          animation.phase = "shrink";
          animation.timer = 0;
          this.createSockballAnimation(animation);
        }
      } else if (animation.phase === "shrink") {
        // Shrink phase
        const progress = animation.timer / animation.shrinkDuration;
        animation.scale = 1.3 * (1 - progress); // Shrink from 1.3x to 0
        animation.wiggleIntensity = 0;

        if (animation.timer >= animation.shrinkDuration) {
          this.completeMatch(animation);
          this.matchAnimations.splice(index, 1);
        }
      }
    });
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
      scale: 1.5,
      rotation: 0,
      rotationSpeed: 0.1,
      glowEffect: 40,
      rainbowEffect: 60,
      rainbowOffset: 0,
    });
  }

  updateSockballAnimations() {
    this.sockballAnimations.forEach((animation, index) => {
      animation.progress += GameConfig.SOCKBALL_ANIMATION_SPEED / 100;
      animation.wiggleOffset += 0.4;
      animation.rotation += animation.rotationSpeed;
      animation.rainbowOffset += 0.1;

      // Scale adjustments
      if (animation.progress < 0.2) {
        animation.scale =
          1.5 + Math.sin(animation.progress * Math.PI * 10) * 0.2;
      } else {
        animation.scale = 1.5 - (animation.progress - 0.2) * 0.8;
      }

      // Effects diminish over time
      if (animation.glowEffect > 0) animation.glowEffect -= 0.5;
      if (animation.rainbowEffect > 0) animation.rainbowEffect -= 0.8;

      if (animation.progress >= 1) {
        this.game.sockBalls++;
        this.sockballAnimations.splice(index, 1);
        this.createArrivalEffect(animation.targetX, animation.targetY);
      } else {
        // Smooth interpolation
        const ease = 1 - Math.pow(1 - animation.progress, 3);
        animation.x = animation.x + (animation.targetX - animation.x) * ease;
        animation.y = animation.y + (animation.targetY - animation.y) * ease;
      }
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
    let scale = 1;
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

    ctx.drawImage(
      this.game.images[this.sockPile.currentImage],
      this.sockPile.x - (this.sockPile.width * scale) / 2,
      this.sockPile.y - (this.sockPile.height * scale) / 2 + bounceOffset,
      this.sockPile.width * scale,
      this.sockPile.height * scale
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
      if (!this.game.images[animation.image]) return;

      ctx.save();

      // Rainbow effect
      if (animation.rainbowEffect > 0) {
        const hue = (animation.rainbowOffset * 360) % 360;
        ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
        ctx.shadowBlur = animation.rainbowEffect;
      }

      // Apply wiggle and rotation
      const wiggle = Math.sin(animation.wiggleOffset) * 3;
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
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });
  }

  checkSockPileClick(x, y) {
    if (!this.sockPile || !this.sockPile.currentImage) {
      console.log("No sock pile or image");
      return false;
    }

    const inBounds =
      x >= this.sockPile.x - this.sockPile.width / 2 &&
      x <= this.sockPile.x + this.sockPile.width / 2 &&
      y >= this.sockPile.y - this.sockPile.height / 2 &&
      y <= this.sockPile.y + this.sockPile.height / 2;

    const hasStock = this.sockList.length > 0;

    console.log("Sock pile click check:", {
      inBounds,
      hasStock,
      sockCount: this.sockList.length,
    });

    return inBounds && hasStock;
  }

  getSockCount() {
    return this.socks.length;
  }

  getSockListLength() {
    return this.sockList.length;
  }
}
