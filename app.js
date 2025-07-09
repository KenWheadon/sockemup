class SockGame {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");

    // Initialize canvas with proper aspect ratio
    this.initializeCanvas();

    this.gameState = "menu"; // menu, matching, shooting, gameOver
    this.currentLevel = 0;
    this.playerPoints = 0;
    this.sockBalls = 0;
    this.matchingTime = 60;
    this.timeRemaining = 60;

    this.images = {};
    this.loadedImages = 0;
    this.totalImages = 0;

    this.unlockedLevels = [...GameConfig.INITIAL_UNLOCKED_LEVELS];
    this.completedLevels = [...GameConfig.INITIAL_COMPLETED_LEVELS];

    // Scale factor for responsive UI
    this.scaleFactor = 1;

    // Initialize level select screen
    this.levelSelect = new LevelSelect(this);

    // Initialize match screen
    this.matchScreen = new MatchScreen(this);

    // Initialize Martha scene
    this.marthaScene = new MarthaScene(this);

    // Initialize level end screen
    this.levelEndScreen = new LevelEndScreen(this);

    // Game objects for shooting phase
    this.crosshair = { x: 600, y: 400 };

    this.init();
  }

  initializeCanvas() {
    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Calculate optimal canvas size maintaining aspect ratio
    const canvasSize = GameConfig.calculateCanvasSize(
      viewportWidth,
      viewportHeight
    );

    // Set canvas dimensions
    this.canvas.width = canvasSize.width;
    this.canvas.height = canvasSize.height;

    // Store scale factor for responsive UI
    this.scaleFactor = canvasSize.scale;

    // Center canvas in viewport
    this.centerCanvas();

    console.log("Canvas initialized:", {
      viewport: { width: viewportWidth, height: viewportHeight },
      canvas: { width: canvasSize.width, height: canvasSize.height },
      scaleFactor: this.scaleFactor,
    });
  }

  centerCanvas() {
    const container = document.getElementById("gameContainer");
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Center canvas in viewport
    const leftOffset = (viewportWidth - this.canvas.width) / 2;
    const topOffset = (viewportHeight - this.canvas.height) / 2;

    this.canvas.style.position = "absolute";
    this.canvas.style.left = `${leftOffset}px`;
    this.canvas.style.top = `${topOffset}px`;

    // Set container background to black for letterboxing
    container.style.backgroundColor = "#000000";
  }

  // Get scaled dimensions for responsive UI
  getScaledValue(baseValue) {
    return baseValue * this.scaleFactor;
  }

  // Get canvas dimensions (for backward compatibility)
  getCanvasWidth() {
    return this.canvas.width;
  }

  getCanvasHeight() {
    return this.canvas.height;
  }

  // Convert screen coordinates to canvas coordinates
  screenToCanvas(screenX, screenY) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: screenX - rect.left,
      y: screenY - rect.top,
    };
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

    // Add resize listener for responsive design
    window.addEventListener("resize", () => this.handleResize());
  }

  handleResize() {
    console.log("Window resized, updating canvas...");

    // Recalculate canvas size maintaining aspect ratio
    this.initializeCanvas();

    // Update any screen-dependent elements
    if (this.gameState === "matching") {
      this.matchScreen.setup();
    } else if (this.gameState === "shooting") {
      // Update crosshair position to maintain relative position
      this.crosshair.x = this.canvas.width / 2;
      this.crosshair.y = this.canvas.height / 2;
    }
  }

  loadGameData() {
    const savedData = localStorage.getItem("sockGameData");
    if (savedData) {
      const data = JSON.parse(savedData);
      this.playerPoints = data.playerPoints || 0;
      this.unlockedLevels = data.unlockedLevels || [
        ...GameConfig.INITIAL_UNLOCKED_LEVELS,
      ];
      this.completedLevels = data.completedLevels || [
        ...GameConfig.INITIAL_COMPLETED_LEVELS,
      ];
    }
  }

  saveGameData() {
    const data = {
      playerPoints: this.playerPoints,
      unlockedLevels: this.unlockedLevels,
      completedLevels: this.completedLevels,
    };
    localStorage.setItem("sockGameData", JSON.stringify(data));
  }

  startLevel(levelIndex) {
    this.currentLevel = levelIndex;
    const level = GameConfig.LEVELS[levelIndex];
    this.matchingTime = level.matchingTime;
    this.timeRemaining = level.matchingTime;
    this.sockBalls = 0;

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
    const coords = this.screenToCanvas(e.clientX, e.clientY);
    const x = coords.x;
    const y = coords.y;

    if (this.gameState === "menu") {
      this.levelSelect.handleMouseDown(x, y);
    } else if (this.gameState === "matching") {
      this.matchScreen.handleMouseDown(x, y);
    } else if (this.gameState === "gameOver") {
      this.levelEndScreen.handleMouseDown(x, y);
    }
  }

  handleMouseMove(e) {
    const coords = this.screenToCanvas(e.clientX, e.clientY);
    const x = coords.x;
    const y = coords.y;

    if (this.gameState === "menu") {
      this.levelSelect.handleMouseMove(x, y);
    } else if (this.gameState === "matching") {
      this.matchScreen.handleMouseMove(x, y);
    } else if (this.gameState === "shooting") {
      this.crosshair.x = x;
      this.crosshair.y = y;
    } else if (this.gameState === "gameOver") {
      this.levelEndScreen.handleMouseMove(x, y);
    }
  }

  handleMouseUp(e) {
    const coords = this.screenToCanvas(e.clientX, e.clientY);
    const x = coords.x;
    const y = coords.y;

    if (this.gameState === "menu") {
      this.levelSelect.handleMouseUp(x, y);
    } else if (this.gameState === "matching") {
      this.matchScreen.handleMouseUp();
    } else if (this.gameState === "gameOver") {
      this.levelEndScreen.handleMouseUp();
    }
  }

  handleClick(e) {
    const coords = this.screenToCanvas(e.clientX, e.clientY);
    const x = coords.x;
    const y = coords.y;

    if (this.gameState === "menu") {
      this.levelSelect.handleClick(x, y);
    } else if (this.gameState === "shooting") {
      this.handleShootingClick(x, y);
    } else if (this.gameState === "gameOver") {
      this.levelEndScreen.handleClick(x, y);
    }
  }

  handleShootingClick(x, y) {
    this.marthaScene.fireSock(x, y);
  }

  startShootingPhase() {
    this.marthaScene.setup();
  }

  completeLevel() {
    // Mark the current level as completed
    this.completedLevels[this.currentLevel] = true;

    // Unlock next level if it exists and isn't already unlocked
    if (this.currentLevel + 1 < GameConfig.LEVELS.length) {
      this.unlockedLevels[this.currentLevel + 1] = true;
    }

    // Award points for completing the level
    const consumedSocks = this.marthaScene.marthaManager.consumedSocks;
    const extraSockBalls = this.sockBalls;
    const consumedPoints = consumedSocks * 5;
    const extraPoints = extraSockBalls * 10;
    const totalPointsEarned = consumedPoints + extraPoints;

    this.playerPoints += totalPointsEarned;

    this.saveGameData();

    // Setup and show level end screen
    this.levelEndScreen.setup();
    this.gameState = "gameOver";
  }

  update() {
    if (this.gameState === "menu") {
      this.levelSelect.update();
    } else if (this.gameState === "matching") {
      this.matchScreen.update();
    } else if (this.gameState === "shooting") {
      this.marthaScene.update();
    } else if (this.gameState === "gameOver") {
      this.levelEndScreen.update();
    }
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw background with proper scaling
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
      this.levelSelect.render(this.ctx);
    } else if (this.gameState === "matching") {
      this.matchScreen.render(this.ctx);
    } else if (this.gameState === "shooting") {
      this.marthaScene.render(this.ctx);
    } else if (this.gameState === "gameOver") {
      this.levelEndScreen.render(this.ctx);
    }
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
