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

    // Initialize Martha scene
    this.marthaScene = new MarthaScene(this);

    // Game objects for shooting phase
    this.crosshair = { x: 600, y: 400 };

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
    this.marthaScene.fireSock(x, y);
  }

  startShootingPhase() {
    this.marthaScene.setup();
  }

  update() {
    if (this.gameState === "matching") {
      this.matchScreen.update();
    } else if (this.gameState === "shooting") {
      this.marthaScene.update();
    }
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
      this.marthaScene.render(this.ctx);
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

  renderGameOver() {
    this.ctx.fillStyle = "white";
    this.ctx.font = "32px Courier New";
    this.ctx.textAlign = "center";
    this.ctx.fillText(
      "Level Complete!",
      this.canvas.width / 2,
      this.canvas.height / 2 - 50
    );

    // Show points earned based on remaining sock balls
    const pointsEarned = this.sockBalls * GameConfig.POINTS_PER_SOCK;
    this.ctx.font = "18px Courier New";
    this.ctx.fillText(
      `Points Earned: ${pointsEarned}`,
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
