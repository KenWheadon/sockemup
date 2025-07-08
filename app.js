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

    // Initialize match screen
    this.matchScreen = new MatchScreen(this);

    // Game objects for shooting phase
    this.crosshair = { x: 600, y: 400 };
    this.martha = null;
    this.thrownSocks = [];

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

    // Generate sock list for match screen
    this.generateSockList(level);

    // Setup match screen
    this.matchScreen.sockList = [...this.sockList];
    this.matchScreen.setup();
    this.gameState = "matching";
  }

  generateSockList(level) {
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
  }

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  handleMouseDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (this.gameState === "matching") {
      this.matchScreen.handleMouseDown(x, y);
    }
  }

  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (this.gameState === "matching") {
      this.matchScreen.handleMouseMove(x, y);
    } else if (this.gameState === "shooting") {
      this.crosshair.x = x;
      this.crosshair.y = y;
    }
  }

  handleMouseUp(e) {
    if (this.gameState === "matching") {
      this.matchScreen.handleMouseUp();
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

  handleShootingClick(x, y) {
    this.fireSock();
  }

  startShootingPhase() {
    this.gameState = "shooting";
    this.canvas.className = "shooting-phase";
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
      this.matchScreen.update();
    } else if (this.gameState === "shooting") {
      this.updateShooting();
    }
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
      this.matchScreen.render(this.ctx);
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
      "Click sock pile to shoot socks, drag socks to drop zones",
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
    // Update time display with warning effect
    const timeElement = document.getElementById("timeValue");
    const timeValue = Math.max(0, Math.floor(this.timeRemaining));
    timeElement.textContent = timeValue;

    // Add warning class if time is low
    if (timeValue <= 10 && this.gameState === "matching") {
      timeElement.parentElement.classList.add("time-warning");
    } else {
      timeElement.parentElement.classList.remove("time-warning");
    }

    // Update sockball counter with animation
    const sockballsElement = document.getElementById("sockBallsValue");
    const currentValue = parseInt(sockballsElement.textContent);
    if (currentValue !== this.sockBalls) {
      sockballsElement.textContent = this.sockBalls;
      sockballsElement.parentElement.classList.add(
        "sockball-counter",
        "updated"
      );
      setTimeout(() => {
        sockballsElement.parentElement.classList.remove("updated");
      }, 500);
    }

    document.getElementById("pointsValue").textContent = this.playerPoints;

    // Update remaining socks counter
    const remainingSocks =
      this.gameState === "matching" ? this.matchScreen.sockList.length : 0;
    document.getElementById("remainingSocksValue").textContent = remainingSocks;
  }

  gameLoop() {
    this.update();
    this.render();
    requestAnimationFrame(() => this.gameLoop());
  }
}

// Start the game when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  const game = new SockGame();
});
