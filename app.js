class SockGame {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    if (!this.canvas) {
      throw new Error("Canvas element 'gameCanvas' not found");
    }

    this.ctx = this.canvas.getContext("2d");
    if (!this.ctx) {
      throw new Error("Cannot get 2D context from canvas");
    }

    this.gameState = "menu";
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

    // Simplified viewport system
    this.viewport = {
      width: 800,
      height: 600,
      scaleFactor: 1,
    };

    // Frame timing
    this.frameRate = 60;
    this.frameInterval = 1000 / this.frameRate;
    this.lastFrameTime = 0;
    this.deltaTime = 0;
    this.frameCount = 0;
    this.fpsDisplay = 0;
    this.fpsTimer = 0;

    // Initialize screens - now using the base Screen class
    this.levelSelect = new LevelSelect(this);
    this.matchScreen = new MatchScreen(this);
    this.throwingScreen = new ThrowingScreen(this);
    this.levelEndScreen = new LevelEndScreen(this);

    // Game objects for shooting phase
    this.crosshair = { x: 600, y: 400 };

    this.init();
  }

  initializeCanvas() {
    if (typeof GameConfig === "undefined") {
      throw new Error("GameConfig not loaded");
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const canvasSize = GameConfig.calculateCanvasSize(
      viewportWidth,
      viewportHeight
    );

    this.canvas.width = canvasSize.width;
    this.canvas.height = canvasSize.height;

    this.viewport.width = canvasSize.width;
    this.viewport.height = canvasSize.height;
    this.viewport.scaleFactor = canvasSize.scale;

    this.centerCanvas();
    this.optimizeCanvas();
  }

  centerCanvas() {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Calculate centering offsets
    const leftOffset = Math.max(0, (viewportWidth - this.canvas.width) / 2);
    const topOffset = Math.max(0, (viewportHeight - this.canvas.height) / 2);

    // Apply positioning
    this.canvas.style.position = "absolute";
    this.canvas.style.left = `${leftOffset}px`;
    this.canvas.style.top = `${topOffset}px`;

    // Set container background for letterboxing
    const container = document.getElementById("gameContainer");
    if (container) {
      container.style.backgroundColor = "#000000";
    }
  }

  optimizeCanvas() {
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.textBaseline = "top";
    this.ctx.textAlign = "left";
  }

  // Scaling utilities
  getScaledValue(baseValue) {
    return baseValue * this.viewport.scaleFactor;
  }

  getScaledPosition(baseX, baseY) {
    return {
      x: baseX * this.viewport.scaleFactor,
      y: baseY * this.viewport.scaleFactor,
    };
  }

  getScaledSize(baseWidth, baseHeight) {
    return {
      width: baseWidth * this.viewport.scaleFactor,
      height: baseHeight * this.viewport.scaleFactor,
    };
  }

  getCanvasWidth() {
    return this.viewport.width;
  }

  getCanvasHeight() {
    return this.viewport.height;
  }

  // Fixed coordinate conversion
  screenToCanvas(screenX, screenY) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: screenX - rect.left,
      y: screenY - rect.top,
    };
  }

  init() {
    if (typeof GameConfig === "undefined") {
      setTimeout(() => this.init(), 100);
      return;
    }

    this.initializeCanvas();
    this.loadImages();
    this.setupEventListeners();
    this.loadGameData();
    this.startGameLoop();
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
    window.addEventListener("resize", () => this.handleResize());
  }

  handleResize() {
    this.initializeCanvas();

    // Notify screens about resize using new base class method
    if (this.levelSelect) this.levelSelect.handleResize();
    if (this.matchScreen) this.matchScreen.handleResize();
    if (this.throwingScreen) this.throwingScreen.handleResize();
    if (this.levelEndScreen) this.levelEndScreen.handleResize();

    // Update crosshair position if in shooting mode
    if (this.gameState === "shooting") {
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

    this.generateSockList(level);
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

    // Use the new Screen base class method
    if (this.gameState === "menu") {
      this.levelSelect.handleMouseDown(x, y);
    } else if (this.gameState === "matching") {
      this.matchScreen.handleMouseDown(x, y);
    } else if (this.gameState === "throwing") {
      this.throwingScreen.handleMouseDown(x, y);
    } else if (this.gameState === "gameOver") {
      this.levelEndScreen.handleMouseDown(x, y);
    }
  }

  handleMouseMove(e) {
    const coords = this.screenToCanvas(e.clientX, e.clientY);
    const x = coords.x;
    const y = coords.y;

    // Use the new Screen base class method
    if (this.gameState === "menu") {
      this.levelSelect.handleMouseMove(x, y);
    } else if (this.gameState === "matching") {
      this.matchScreen.handleMouseMove(x, y);
    } else if (this.gameState === "throwing") {
      this.throwingScreen.handleMouseMove(x, y);
    } else if (this.gameState === "gameOver") {
      this.levelEndScreen.handleMouseMove(x, y);
    }
  }

  handleMouseUp(e) {
    const coords = this.screenToCanvas(e.clientX, e.clientY);
    const x = coords.x;
    const y = coords.y;

    // Use the new Screen base class method
    if (this.gameState === "menu") {
      this.levelSelect.handleMouseUp(x, y);
    } else if (this.gameState === "matching") {
      this.matchScreen.handleMouseUp();
    } else if (this.gameState === "throwing") {
      this.throwingScreen.handleMouseUp(x, y);
    } else if (this.gameState === "gameOver") {
      this.levelEndScreen.handleMouseUp();
    }
  }

  handleClick(e) {
    const coords = this.screenToCanvas(e.clientX, e.clientY);
    const x = coords.x;
    const y = coords.y;

    // Use the new Screen base class method
    if (this.gameState === "menu") {
      this.levelSelect.handleClick(x, y);
    } else if (this.gameState === "throwing") {
      this.throwingScreen.handleClick(x, y);
    } else if (this.gameState === "gameOver") {
      this.levelEndScreen.handleClick(x, y);
    }
  }

  startThrowingPhase() {
    this.throwingScreen.setup();
    this.gameState = "throwing";
  }

  completeLevel() {
    // Clean up throwing screen before transitioning
    if (this.gameState === "throwing") {
      this.throwingScreen.cleanup();
    }

    this.completedLevels[this.currentLevel] = true;

    if (this.currentLevel + 1 < GameConfig.LEVELS.length) {
      this.unlockedLevels[this.currentLevel + 1] = true;
    }

    const consumedSocks = this.throwingScreen.marthaManager.collectedSockballs;
    const extraSockBalls = this.sockBalls - consumedSocks;
    const consumedPoints = consumedSocks * 5;
    const extraPoints = extraSockBalls * 10;
    const totalPointsEarned = consumedPoints + extraPoints;

    this.playerPoints += totalPointsEarned;
    this.saveGameData();

    this.levelEndScreen.setup();
    this.gameState = "gameOver";
  }

  update(deltaTime) {
    // Use the new Screen base class update method
    if (this.gameState === "menu") {
      this.levelSelect.update(deltaTime);
    } else if (this.gameState === "matching") {
      this.matchScreen.update(deltaTime);
    } else if (this.gameState === "throwing") {
      this.throwingScreen.update(deltaTime);
    } else if (this.gameState === "gameOver") {
      this.levelEndScreen.update(deltaTime);
    }

    // Update FPS counter
    this.frameCount++;
    this.fpsTimer += deltaTime;
    if (this.fpsTimer >= 1000) {
      this.fpsDisplay = Math.round((this.frameCount * 1000) / this.fpsTimer);
      this.frameCount = 0;
      this.fpsTimer = 0;
    }
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.images["background.png"]) {
      this.ctx.drawImage(
        this.images["background.png"],
        0,
        0,
        this.canvas.width,
        this.canvas.height
      );
    }

    // Use the new Screen base class render method
    if (this.gameState === "menu") {
      this.levelSelect.render(this.ctx);
    } else if (this.gameState === "matching") {
      this.matchScreen.render(this.ctx);
    } else if (this.gameState === "throwing") {
      this.throwingScreen.render(this.ctx);
    } else if (this.gameState === "gameOver") {
      this.levelEndScreen.render(this.ctx);
    }

    // Debug info
    if (GameConfig.DEBUG_PHYSICS_BOUNDS) {
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      this.ctx.fillRect(10, 10, 120, 60);
      this.ctx.fillStyle = "white";
      this.ctx.font = "12px monospace";
      this.ctx.fillText(`FPS: ${this.fpsDisplay}`, 15, 25);
      this.ctx.fillText(
        `Scale: ${this.viewport.scaleFactor.toFixed(2)}`,
        15,
        40
      );
      this.ctx.fillText(
        `Size: ${this.canvas.width}x${this.canvas.height}`,
        15,
        55
      );
    }
  }

  startGameLoop() {
    const gameLoop = (currentTime) => {
      this.deltaTime = currentTime - this.lastFrameTime;

      if (this.deltaTime >= this.frameInterval) {
        this.lastFrameTime =
          currentTime - (this.deltaTime % this.frameInterval);
        this.update(this.deltaTime);
        this.render();
      }

      requestAnimationFrame(gameLoop);
    };

    requestAnimationFrame(gameLoop);
  }
}

// Start the game when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("gameCanvas");
  const container = document.getElementById("gameContainer");

  if (!canvas) {
    console.error("Canvas element 'gameCanvas' not found in HTML!");
    return;
  }

  if (!container) {
    console.error("Container element 'gameContainer' not found in HTML!");
    return;
  }

  try {
    const game = new SockGame();
  } catch (error) {
    console.error("Failed to initialize game:", error);
  }
});
