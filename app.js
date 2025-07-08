class SockGame {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.canvas.width = GameConfig.CANVAS_WIDTH;
    this.canvas.height = GameConfig.CANVAS_HEIGHT;

    this.gameState = "menu"; // menu, matching, shooting, gameOver
    this.currentLevel = 0;
    this.playerPoints = 0;
    this.playerHP = GameConfig.INITIAL_HP;
    this.sockBalls = 0;
    this.matchingTime = 60;
    this.timeRemaining = 60;

    this.images = {};
    this.loadedImages = 0;
    this.totalImages = 0;

    this.unlockedLevels = [...GameConfig.INITIAL_UNLOCKED_LEVELS];

    // Game objects
    this.sockPile = null;
    this.socks = [];
    this.dropZones = [];
    this.sockList = [];
    this.crosshair = { x: 600, y: 400 };
    this.martha = null;
    this.thrownSocks = [];
    this.matchAnimations = [];
    this.sockballAnimations = [];

    // Drag state
    this.draggedSock = null;
    this.dragOffset = { x: 0, y: 0 };
    this.isDragging = false;

    this.init();
  }

  init() {
    // Wait for GameConfig to be loaded
    if (typeof GameConfig === "undefined") {
      setTimeout(() => this.init(), 100);
      return;
    }

    this.loadImages();
    this.setupEventListeners();
    this.loadGameData();
    this.gameLoop();
  }

  loadImages() {
    const allImages = [
      ...GameConfig.IMAGES.SOCKS,
      ...GameConfig.IMAGES.SOCK_BALLS,
      ...GameConfig.IMAGES.SOCK_PILES,
      ...GameConfig.IMAGES.CHARACTERS,
      ...GameConfig.IMAGES.UI,
    ];

    this.totalImages = allImages.length;

    allImages.forEach((imageName) => {
      const img = new Image();
      img.onload = () => {
        this.loadedImages++;
        if (this.loadedImages === this.totalImages) {
          console.log("All images loaded");
        }
      };
      img.onerror = () => {
        console.warn(`Failed to load image: ${imageName}`);
        this.loadedImages++;
      };
      img.src = `images/${imageName}`;
      this.images[imageName] = img;
    });
  }

  setupEventListeners() {
    this.canvas.addEventListener("mousedown", (e) => this.handleMouseDown(e));
    this.canvas.addEventListener("mousemove", (e) => this.handleMouseMove(e));
    this.canvas.addEventListener("mouseup", (e) => this.handleMouseUp(e));
    this.canvas.addEventListener("click", (e) => this.handleClick(e));
  }

  loadGameData() {
    const savedData = localStorage.getItem("sockGameData");
    if (savedData) {
      const data = JSON.parse(savedData);
      this.playerPoints = data.playerPoints || 0;
      this.unlockedLevels = data.unlockedLevels || [
        ...GameConfig.INITIAL_UNLOCKED_LEVELS,
      ];
    }
  }

  saveGameData() {
    const data = {
      playerPoints: this.playerPoints,
      unlockedLevels: this.unlockedLevels,
    };
    localStorage.setItem("sockGameData", JSON.stringify(data));
  }

  startLevel(levelIndex) {
    this.currentLevel = levelIndex;
    const level = GameConfig.LEVELS[levelIndex];
    this.matchingTime = level.matchingTime;
    this.timeRemaining = level.matchingTime;
    this.sockBalls = 0;
    this.playerHP = GameConfig.INITIAL_HP;

    // Generate sock list
    this.sockList = [];
    const socksPerType = Math.floor(
      (level.sockPairs * 2) / level.typesAvailable.length
    );
    level.typesAvailable.forEach((type) => {
      for (let i = 0; i < socksPerType; i++) {
        this.sockList.push(type);
      }
    });

    // Add remaining socks to reach exact pair count
    const remaining = level.sockPairs * 2 - this.sockList.length;
    for (let i = 0; i < remaining; i++) {
      this.sockList.push(level.typesAvailable[i % level.typesAvailable.length]);
    }

    // Shuffle the sock list
    this.shuffleArray(this.sockList);

    this.setupMatchingPhase();
    this.gameState = "matching";
  }

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  setupMatchingPhase() {
    this.canvas.className = ""; // Remove crosshair cursor
    this.sockPile = {
      x: GameConfig.SOCK_PILE_POS.x,
      y: GameConfig.SOCK_PILE_POS.y,
      width: 100,
      height: 100,
      currentImage: "sockpile1.png",
    };

    this.dropZones = GameConfig.DROP_ZONE_POSITIONS.map((pos) => ({
      ...pos,
      sock: null,
    }));

    this.socks = [];
    this.matchAnimations = [];
    this.sockballAnimations = [];
    this.draggedSock = null;
    this.isDragging = false;
  }

  updateSockPileImage() {
    const remaining = this.sockList.length;
    const total = GameConfig.LEVELS[this.currentLevel].sockPairs * 2;
    const percentage = (remaining / total) * 100;

    if (percentage <= 0) {
      this.sockPile.currentImage = null; // Pile disappears
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

  handleMouseDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (this.gameState === "matching") {
      // Check if clicking on sock pile
      if (
        this.sockPile &&
        this.sockPile.currentImage &&
        x >= this.sockPile.x - this.sockPile.width / 2 &&
        x <= this.sockPile.x + this.sockPile.width / 2 &&
        y >= this.sockPile.y - this.sockPile.height / 2 &&
        y <= this.sockPile.y + this.sockPile.height / 2
      ) {
        if (this.sockList.length > 0) {
          this.shootSockFromPile();
        }
        return;
      }

      // Check if clicking on existing sock - using the working logic from index.html
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

          break;
        }
      }
    }
  }

  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (this.gameState === "matching" && this.draggedSock) {
      this.draggedSock.x = x - this.dragOffset.x;
      this.draggedSock.y = y - this.dragOffset.y;
      this.draggedSock.vx = 0;
      this.draggedSock.vy = 0;
    }

    if (this.gameState === "shooting") {
      this.crosshair.x = x;
      this.crosshair.y = y;
    }
  }

  handleMouseUp(e) {
    if (this.gameState === "matching" && this.draggedSock) {
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
          } else {
            // Zone occupied, throw sock away
            sock.vx = (Math.random() - 0.5) * 10;
            sock.vy = (Math.random() - 0.5) * 10;
            sock.bouncing = true;
          }
        }
      });

      // If not snapped, start bouncing
      if (!snapped) {
        sock.vx = (Math.random() - 0.5) * 8;
        sock.vy = (Math.random() - 0.5) * 8;
        sock.bouncing = true;
      }

      this.draggedSock = null;
      this.isDragging = false;
      this.checkForMatch();
    }
  }

  handleMenuClick(x, y) {
    const levelSpacing = 150;
    const startX = this.canvas.width / 2 - levelSpacing;

    for (let i = 0; i < GameConfig.LEVELS.length; i++) {
      const levelX = startX + i * levelSpacing;
      const levelY = this.canvas.height / 2 + 50;

      if (
        x >= levelX - 40 &&
        x <= levelX + 40 &&
        y >= levelY - 40 &&
        y <= levelY + 40
      ) {
        if (this.unlockedLevels[i]) {
          this.startLevel(i);
        } else if (this.playerPoints >= GameConfig.LEVEL_COSTS[i]) {
          this.playerPoints -= GameConfig.LEVEL_COSTS[i];
          this.unlockedLevels[i] = true;
          this.saveGameData();
          this.startLevel(i);
        }
        break;
      }
    }
  }

  handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (this.gameState === "menu") {
      this.handleMenuClick(x, y);
    } else if (this.gameState === "shooting") {
      this.handleShootingClick(x, y);
    } else if (this.gameState === "gameOver") {
      this.gameState = "menu";
    }
  }

  handleShootingClick(x, y) {
    this.fireSock();
  }

  shootSockFromPile() {
    const sockType = this.sockList.pop();

    // Random upward angle (between 45 and 135 degrees)
    const angle = Math.PI / 4 + (Math.random() * Math.PI) / 2;
    const speed = GameConfig.SOCK_SHOOT_SPEED;

    const newSock = {
      id: Date.now(),
      type: sockType,
      x: this.sockPile.x,
      y: this.sockPile.y,
      width: GameConfig.SOCK_SIZE,
      height: GameConfig.SOCK_SIZE,
      vx: Math.cos(angle) * speed,
      vy: -Math.sin(angle) * speed, // Negative for upward
      bouncing: true,
    };

    this.socks.push(newSock);
    this.updateSockPileImage();
  }

  handleMouseMove(e) {
    if (this.gameState === "shooting") {
      const rect = this.canvas.getBoundingClientRect();
      this.crosshair.x = e.clientX - rect.left;
      this.crosshair.y = e.clientY - rect.top;
    }
  }

  checkForMatch() {
    if (this.dropZones[0].sock && this.dropZones[1].sock) {
      if (this.dropZones[0].sock.type === this.dropZones[1].sock.type) {
        // Start match animation
        this.startMatchAnimation(
          this.dropZones[0].sock,
          this.dropZones[1].sock
        );
      }
    }
  }

  startMatchAnimation(sock1, sock2) {
    // Add shaking animation
    this.matchAnimations.push({
      socks: [sock1, sock2],
      phase: "shake",
      timer: 0,
      duration: GameConfig.SHAKE_DURATION,
    });
  }

  updateMatchAnimations() {
    this.matchAnimations.forEach((animation, index) => {
      animation.timer++;

      if (animation.phase === "shake") {
        if (animation.timer >= animation.duration) {
          // Start pop phase
          animation.phase = "pop";
          animation.timer = 0;
          animation.duration = GameConfig.POP_DURATION;

          // Create sockball animation
          this.createSockballAnimation(animation.socks[0]);

          // Remove matched socks
          this.socks = this.socks.filter(
            (sock) => sock !== animation.socks[0] && sock !== animation.socks[1]
          );

          // Clear drop zones
          this.dropZones[0].sock = null;
          this.dropZones[1].sock = null;
        }
      } else if (animation.phase === "pop") {
        if (animation.timer >= animation.duration) {
          // Animation complete
          this.matchAnimations.splice(index, 1);

          // Check if matching phase is complete
          if (
            this.sockList.length === 0 &&
            this.sockBalls >= GameConfig.LEVELS[this.currentLevel].sockPairs
          ) {
            this.startShootingPhase();
          }
        }
      }
    });
  }

  createSockballAnimation(sock) {
    const sockballType = GameConfig.IMAGES.SOCK_BALLS[sock.type - 1];
    const targetX = this.canvas.width - 200;
    const targetY = 150;

    this.sockballAnimations.push({
      image: sockballType,
      x: sock.x,
      y: sock.y,
      targetX: targetX,
      targetY: targetY,
      progress: 0,
      wiggleOffset: 0,
    });
  }

  updateSockballAnimations() {
    this.sockballAnimations.forEach((animation, index) => {
      animation.progress += GameConfig.SOCKBALL_ANIMATION_SPEED / 100;
      animation.wiggleOffset += 0.2;

      if (animation.progress >= 1) {
        // Animation complete - increment sockball counter
        this.sockBalls++;
        this.sockballAnimations.splice(index, 1);
      } else {
        // Interpolate position
        animation.x =
          animation.x + (animation.targetX - animation.x) * animation.progress;
        animation.y =
          animation.y + (animation.targetY - animation.y) * animation.progress;
      }
    });
  }

  startShootingPhase() {
    this.gameState = "shooting";
    this.canvas.className = "shooting"; // Add crosshair cursor
    this.martha = {
      x: this.canvas.width + 50,
      y: this.canvas.height / 2,
      width: GameConfig.MARTHA_SIZE.width,
      height: GameConfig.MARTHA_SIZE.height,
      vx: -GameConfig.LEVELS[this.currentLevel].marthaSpeed,
      direction: -1,
      hitEffect: 0,
    };

    this.thrownSocks = [];
  }

  fireSock() {
    if (this.sockBalls > 0) {
      // Fire from bottom of screen toward crosshair
      const startX = this.crosshair.x;
      const startY = this.canvas.height - 50;

      const angle = Math.atan2(
        this.crosshair.y - startY,
        this.crosshair.x - startX
      );
      const speed = GameConfig.SOCK_SHOOT_SPEED;

      this.thrownSocks.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        type: 1, // Could be random from available types
      });

      this.sockBalls--;
    }
  }

  update() {
    if (this.gameState === "matching") {
      this.updateMatching();
    } else if (this.gameState === "shooting") {
      this.updateShooting();
    }

    this.updateMatchAnimations();
    this.updateSockballAnimations();
  }

  updateMatching() {
    // Proper 1-second countdown (60 FPS)
    this.timeRemaining -= 1 / 60;

    if (this.timeRemaining <= 0) {
      this.startShootingPhase();
    }

    // Update bouncing socks
    this.socks.forEach((sock) => {
      if (sock.bouncing) {
        sock.x += sock.vx;
        sock.y += sock.vy;
        sock.vy += GameConfig.GRAVITY; // Add gravity

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

  updateShooting() {
    // Update Martha
    this.martha.x += this.martha.vx;

    // Martha movement pattern
    if (this.martha.x <= 50) {
      this.martha.vx = GameConfig.LEVELS[this.currentLevel].marthaSpeed;
      this.martha.direction = 1;
    } else if (this.martha.x >= this.canvas.width - 50) {
      this.martha.vx = -GameConfig.LEVELS[this.currentLevel].marthaSpeed;
      this.martha.direction = -1;
    }

    // Update hit effect
    if (this.martha.hitEffect > 0) {
      this.martha.hitEffect--;
    }

    // Update thrown socks
    this.thrownSocks.forEach((sock, index) => {
      sock.x += sock.vx;
      sock.y += sock.vy;
      sock.vy += GameConfig.GRAVITY; // Gravity

      // Check collision with Martha
      if (
        sock.x >= this.martha.x - this.martha.width / 2 &&
        sock.x <= this.martha.x + this.martha.width / 2 &&
        sock.y >= this.martha.y - this.martha.height / 2 &&
        sock.y <= this.martha.y + this.martha.height / 2
      ) {
        this.martha.hitEffect = GameConfig.MARTHA_HIT_EFFECT_DURATION;
        this.thrownSocks.splice(index, 1);

        // Check if level complete
        if (this.sockBalls === 0 && this.thrownSocks.length === 0) {
          this.endLevel();
        }
      }

      // Remove socks that go off screen
      if (sock.y > this.canvas.height + 50) {
        this.thrownSocks.splice(index, 1);
        this.playerHP--;

        if (this.playerHP <= 0) {
          this.gameState = "gameOver";
        }
      }
    });

    // End level if no more socks
    if (this.sockBalls === 0 && this.thrownSocks.length === 0) {
      this.endLevel();
    }
  }

  endLevel() {
    // Calculate score
    const remainingSocks = this.sockBalls;
    const points = remainingSocks * GameConfig.POINTS_PER_SOCK;
    this.playerPoints += points;

    this.saveGameData();
    this.gameState = "gameOver";
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw background
    if (this.images["background.png"]) {
      this.ctx.drawImage(
        this.images["background.png"],
        0,
        0,
        this.canvas.width,
        this.canvas.height
      );
    }

    if (this.gameState === "menu") {
      this.renderMenu();
    } else if (this.gameState === "matching") {
      this.renderMatching();
    } else if (this.gameState === "shooting") {
      this.renderShooting();
    } else if (this.gameState === "gameOver") {
      this.renderGameOver();
    }

    this.updateUI();
  }

  renderMenu() {
    // Draw logo
    if (this.images["logo.png"]) {
      this.ctx.drawImage(
        this.images["logo.png"],
        this.canvas.width / 2 - 100,
        100,
        200,
        100
      );
    }

    // Draw instructions
    this.ctx.fillStyle = "white";
    this.ctx.font = "18px Courier New";
    this.ctx.textAlign = "center";
    this.ctx.fillText(
      "Click sock pile to shoot socks, click socks to place in drop zones",
      this.canvas.width / 2,
      220
    );
    this.ctx.fillText(
      "Match pairs to create sock balls, then throw them at Martha!",
      this.canvas.width / 2,
      245
    );

    // Draw level selection
    this.ctx.fillStyle = "white";
    this.ctx.font = "24px Courier New";
    this.ctx.textAlign = "center";
    this.ctx.fillText(
      "Select Level",
      this.canvas.width / 2,
      this.canvas.height / 2 - 50
    );

    const levelSpacing = 150;
    const startX = this.canvas.width / 2 - levelSpacing;

    for (let i = 0; i < GameConfig.LEVELS.length; i++) {
      const levelX = startX + i * levelSpacing;
      const levelY = this.canvas.height / 2 + 50;

      if (this.unlockedLevels[i]) {
        // Draw unlocked level as animated sock
        const wiggle = Math.sin(Date.now() * 0.01 + i) * 3;
        if (this.images["sock1.png"]) {
          this.ctx.drawImage(
            this.images["sock1.png"],
            levelX - 40 + wiggle,
            levelY - 40,
            80,
            80
          );
        }

        this.ctx.fillStyle = "white";
        this.ctx.font = "16px Courier New";
        this.ctx.fillText(`Level ${i + 1}`, levelX, levelY + 60);
      } else {
        // Draw locked level
        this.ctx.fillStyle = "gray";
        this.ctx.fillRect(levelX - 40, levelY - 40, 80, 80);

        this.ctx.fillStyle = "white";
        this.ctx.font = "16px Courier New";
        this.ctx.fillText(
          `Cost: ${GameConfig.LEVEL_COSTS[i]}`,
          levelX,
          levelY - 50
        );
        this.ctx.fillText(`Level ${i + 1}`, levelX, levelY + 60);
      }
    }

    // Show current points
    this.ctx.fillStyle = "yellow";
    this.ctx.font = "20px Courier New";
    this.ctx.fillText(
      `Points: ${this.playerPoints}`,
      this.canvas.width / 2,
      this.canvas.height - 50
    );
  }

  renderMatching() {
    // Draw background instruction
    this.ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    this.ctx.font = "48px Courier New";
    this.ctx.textAlign = "center";
    this.ctx.fillText(
      "MATCH THOSE SOCKS",
      this.canvas.width / 2,
      this.canvas.height / 2
    );

    // Draw physics bounds if debug is enabled
    if (GameConfig.DEBUG_PHYSICS_BOUNDS) {
      this.ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(
        GameConfig.PHYSICS_BOUNDS.LEFT,
        GameConfig.PHYSICS_BOUNDS.TOP,
        GameConfig.PHYSICS_BOUNDS.RIGHT - GameConfig.PHYSICS_BOUNDS.LEFT,
        GameConfig.PHYSICS_BOUNDS.BOTTOM - GameConfig.PHYSICS_BOUNDS.TOP
      );

      // Draw corner labels
      this.ctx.fillStyle = "rgba(255, 0, 0, 0.8)";
      this.ctx.font = "12px Courier New";
      this.ctx.textAlign = "left";
      this.ctx.fillText(
        `${GameConfig.PHYSICS_BOUNDS.LEFT}, ${GameConfig.PHYSICS_BOUNDS.TOP}`,
        GameConfig.PHYSICS_BOUNDS.LEFT + 5,
        GameConfig.PHYSICS_BOUNDS.TOP + 15
      );
      this.ctx.textAlign = "right";
      this.ctx.fillText(
        `${GameConfig.PHYSICS_BOUNDS.RIGHT}, ${GameConfig.PHYSICS_BOUNDS.BOTTOM}`,
        GameConfig.PHYSICS_BOUNDS.RIGHT - 5,
        GameConfig.PHYSICS_BOUNDS.BOTTOM - 5
      );
    }

    // Draw sock pile
    if (this.sockPile.currentImage && this.images[this.sockPile.currentImage]) {
      this.ctx.drawImage(
        this.images[this.sockPile.currentImage],
        this.sockPile.x - this.sockPile.width / 2,
        this.sockPile.y - this.sockPile.height / 2,
        this.sockPile.width,
        this.sockPile.height
      );
    }

    // Draw drop zones
    this.dropZones.forEach((zone) => {
      this.ctx.strokeStyle = "white";
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(
        zone.x - zone.width / 2,
        zone.y - zone.height / 2,
        zone.width,
        zone.height
      );
    });

    // Draw socks
    this.socks.forEach((sock) => {
      let drawX = sock.x - sock.width / 2;
      let drawY = sock.y - sock.height / 2;

      // Apply shake effect if in match animation
      this.matchAnimations.forEach((animation) => {
        if (animation.phase === "shake" && animation.socks.includes(sock)) {
          drawX += (Math.random() - 0.5) * 4;
          drawY += (Math.random() - 0.5) * 4;
        }
      });

      // Highlight dragged sock
      if (this.draggedSock === sock) {
        this.ctx.strokeStyle = "yellow";
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(
          drawX - 2,
          drawY - 2,
          sock.width + 4,
          sock.height + 4
        );
      }

      if (this.images[`sock${sock.type}.png`]) {
        this.ctx.drawImage(
          this.images[`sock${sock.type}.png`],
          drawX,
          drawY,
          sock.width,
          sock.height
        );
      }
    });

    // Draw sockball animations
    this.sockballAnimations.forEach((animation) => {
      if (this.images[animation.image]) {
        const wiggle = Math.sin(animation.wiggleOffset) * 2;
        this.ctx.drawImage(
          this.images[animation.image],
          animation.x - GameConfig.SOCKBALL_SIZE / 2 + wiggle,
          animation.y - GameConfig.SOCKBALL_SIZE / 2,
          GameConfig.SOCKBALL_SIZE,
          GameConfig.SOCKBALL_SIZE
        );
      }
    });
  }

  renderShooting() {
    // Draw Martha
    if (this.images["martha.png"]) {
      this.ctx.save();
      if (this.martha.hitEffect > 0) {
        this.ctx.globalAlpha = 0.5;
        this.ctx.filter = "brightness(200%)";
      }
      this.ctx.drawImage(
        this.images["martha.png"],
        this.martha.x - this.martha.width / 2,
        this.martha.y - this.martha.height / 2,
        this.martha.width,
        this.martha.height
      );
      this.ctx.restore();
    }

    // Draw crosshair
    this.ctx.strokeStyle = "red";
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(this.crosshair.x - 10, this.crosshair.y);
    this.ctx.lineTo(this.crosshair.x + 10, this.crosshair.y);
    this.ctx.moveTo(this.crosshair.x, this.crosshair.y - 10);
    this.ctx.lineTo(this.crosshair.x, this.crosshair.y + 10);
    this.ctx.stroke();

    // Draw trajectory line from bottom to crosshair
    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(this.crosshair.x, this.canvas.height - 50);
    this.ctx.lineTo(this.crosshair.x, this.crosshair.y);
    this.ctx.stroke();

    // Draw thrown socks
    this.thrownSocks.forEach((sock) => {
      if (this.images[`sock${sock.type}.png`]) {
        this.ctx.drawImage(
          this.images[`sock${sock.type}.png`],
          sock.x - 20,
          sock.y - 20,
          40,
          40
        );
      }
    });

    // Draw Martha's dialogue
    this.ctx.fillStyle = "white";
    this.ctx.font = "16px Courier New";
    this.ctx.textAlign = "center";
    this.ctx.fillText(
      `I DEMAND ${
        GameConfig.LEVELS[this.currentLevel].sockTarget
      } PAIRS OF SOCKS OR ELSE!`,
      this.canvas.width / 2,
      50
    );

    // Draw HP
    this.ctx.fillStyle = "red";
    this.ctx.font = "18px Courier New";
    this.ctx.textAlign = "left";
    this.ctx.fillText(`HP: ${this.playerHP}`, 10, 100);
  }

  renderGameOver() {
    this.ctx.fillStyle = "white";
    this.ctx.font = "32px Courier New";
    this.ctx.textAlign = "center";
    this.ctx.fillText(
      "Level Complete!",
      this.canvas.width / 2,
      this.canvas.height / 2 - 50
    );

    this.ctx.font = "18px Courier New";
    this.ctx.fillText(
      `Points Earned: ${this.sockBalls * GameConfig.POINTS_PER_SOCK}`,
      this.canvas.width / 2,
      this.canvas.height / 2
    );
    this.ctx.fillText(
      `Total Points: ${this.playerPoints}`,
      this.canvas.width / 2,
      this.canvas.height / 2 + 30
    );
    this.ctx.fillText(
      "Click to continue",
      this.canvas.width / 2,
      this.canvas.height / 2 + 80
    );
  }

  updateUI() {
    document.getElementById("timeValue").textContent = Math.max(
      0,
      Math.floor(this.timeRemaining)
    );
    document.getElementById("sockBallsValue").textContent = this.sockBalls;
    document.getElementById("pointsValue").textContent = this.playerPoints;
    document.getElementById("remainingSocksValue").textContent =
      this.sockList.length;
  }

  gameLoop() {
    this.update();
    this.render();
    requestAnimationFrame(() => this.gameLoop());
  }
}

// Start the game
const game = new SockGame();
