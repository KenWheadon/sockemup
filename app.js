class SockGame {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");

    // Check if canvas element exists
    if (!this.canvas) {
      console.error(
        "Canvas element with id 'gameCanvas' not found! Make sure the HTML contains: <canvas id='gameCanvas'></canvas>"
      );
      throw new Error("Canvas element not found. Cannot initialize game.");
    }

    this.ctx = this.canvas.getContext("2d");

    // Check if context was created successfully
    if (!this.ctx) {
      console.error("Failed to get 2D context from canvas element");
      throw new Error("Canvas context not available. Cannot initialize game.");
    }

    // DON'T initialize canvas here - wait for GameConfig to load
    // this.initializeCanvas(); // MOVED TO init() method

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

    // Centralized scaling system - initialize with defaults
    this.viewport = {
      width: 800,
      height: 600,
      scaleFactor: 1,
      offsetX: 0,
      offsetY: 0,
    };

    // Frame timing system
    this.frameRate = 60;
    this.frameInterval = 1000 / this.frameRate;
    this.lastFrameTime = 0;
    this.deltaTime = 0;
    this.frameCount = 0;
    this.fpsDisplay = 0;
    this.fpsTimer = 0;

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
    // Validate canvas element exists
    if (!this.canvas) {
      console.error("Canvas element is not available in initializeCanvas");
      throw new Error("Canvas element not found during initialization");
    }

    // Validate GameConfig is loaded
    if (typeof GameConfig === "undefined") {
      console.error("GameConfig not loaded in initializeCanvas");
      throw new Error("GameConfig not available during canvas initialization");
    }

    // Validate GameConfig.calculateCanvasSize exists
    if (typeof GameConfig.calculateCanvasSize !== "function") {
      console.error("GameConfig.calculateCanvasSize is not a function");
      throw new Error("GameConfig.calculateCanvasSize method not available");
    }

    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    console.log(
      "Calculating canvas size with viewport:",
      viewportWidth,
      "x",
      viewportHeight
    );

    // Calculate optimal canvas size maintaining aspect ratio
    const canvasSize = GameConfig.calculateCanvasSize(
      viewportWidth,
      viewportHeight
    );

    // Validate canvasSize was returned
    if (!canvasSize) {
      console.error("GameConfig.calculateCanvasSize returned undefined");
      throw new Error("Failed to calculate canvas size");
    }

    // Validate canvasSize has required properties
    if (
      typeof canvasSize.width !== "number" ||
      typeof canvasSize.height !== "number"
    ) {
      console.error(
        "GameConfig.calculateCanvasSize returned invalid size:",
        canvasSize
      );
      throw new Error("Invalid canvas size returned from GameConfig");
    }

    console.log("Canvas size calculated:", canvasSize);

    // Set canvas dimensions
    this.canvas.width = canvasSize.width;
    this.canvas.height = canvasSize.height;

    // Store viewport information
    this.viewport.width = canvasSize.width;
    this.viewport.height = canvasSize.height;
    this.viewport.scaleFactor = canvasSize.scale;

    // Center canvas in viewport
    this.centerCanvas();

    // Set up canvas for optimal rendering
    this.optimizeCanvas();

    console.log("Canvas initialized:", {
      viewport: { width: viewportWidth, height: viewportHeight },
      canvas: { width: canvasSize.width, height: canvasSize.height },
      scaleFactor: this.viewport.scaleFactor,
    });
  }

  centerCanvas() {
    // Validate canvas exists
    if (!this.canvas) {
      console.error("Cannot center canvas - canvas element not found");
      return;
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Center canvas in viewport
    const leftOffset = (viewportWidth - this.canvas.width) / 2;
    const topOffset = (viewportHeight - this.canvas.height) / 2;

    this.canvas.style.position = "absolute";
    this.canvas.style.left = `${leftOffset}px`;
    this.canvas.style.top = `${topOffset}px`;

    // Store offset for coordinate conversion
    this.viewport.offsetX = leftOffset;
    this.viewport.offsetY = topOffset;

    // Set container background to black for letterboxing
    const container = document.getElementById("gameContainer");
    if (container) {
      container.style.backgroundColor = "#000000";
    } else {
      console.warn(
        "gameContainer element not found - letterboxing may not work properly"
      );
    }
  }

  optimizeCanvas() {
    // Validate context exists
    if (!this.ctx) {
      console.error("Cannot optimize canvas - context not available");
      return;
    }

    // Optimize canvas for performance
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.webkitImageSmoothingEnabled = false;
    this.ctx.mozImageSmoothingEnabled = false;
    this.ctx.msImageSmoothingEnabled = false;

    // Set up text rendering
    this.ctx.textBaseline = "top";
    this.ctx.textAlign = "left";
  }

  // Centralized scaling methods
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

  // Get canvas dimensions (consistent across all screens)
  getCanvasWidth() {
    return this.viewport.width;
  }

  getCanvasHeight() {
    return this.viewport.height;
  }

  // Convert screen coordinates to canvas coordinates
  screenToCanvas(screenX, screenY) {
    if (!this.canvas) {
      console.error("Cannot convert screen coordinates - canvas not available");
      return { x: 0, y: 0 };
    }

    const rect = this.canvas.getBoundingClientRect();
    return {
      x: screenX - rect.left,
      y: screenY - rect.top,
    };
  }

  init() {
    // Validate essential elements exist
    if (!this.canvas || !this.ctx) {
      console.error("Game cannot initialize - missing canvas or context");
      return;
    }

    // Wait for GameConfig to be loaded
    if (typeof GameConfig === "undefined") {
      console.log("Waiting for GameConfig to load...");
      setTimeout(() => this.init(), 100);
      return;
    }

    console.log("GameConfig loaded, initializing canvas...");

    // NOW it's safe to initialize canvas since GameConfig is loaded
    this.initializeCanvas();

    console.log("Initializing game...");
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
    // Validate canvas exists before adding listeners
    if (!this.canvas) {
      console.error("Cannot setup event listeners - canvas element not found");
      return;
    }

    this.canvas.addEventListener("mousedown", (e) => this.handleMouseDown(e));
    this.canvas.addEventListener("mousemove", (e) => this.handleMouseMove(e));
    this.canvas.addEventListener("mouseup", (e) => this.handleMouseUp(e));
    this.canvas.addEventListener("click", (e) => this.handleClick(e));

    // Add resize listener for responsive design
    window.addEventListener("resize", () => this.handleResize());

    console.log("Event listeners setup successfully");
  }

  handleResize() {
    console.log("Window resized, updating canvas...");

    // Recalculate canvas size maintaining aspect ratio
    this.initializeCanvas();

    // Notify all screens about the resize
    if (this.levelSelect) this.levelSelect.handleResize();
    if (this.matchScreen) this.matchScreen.handleResize();
    if (this.marthaScene) this.marthaScene.handleResize();
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

  update(deltaTime) {
    // Update current screen with delta time
    if (this.gameState === "menu") {
      this.levelSelect.update(deltaTime);
    } else if (this.gameState === "matching") {
      this.matchScreen.update(deltaTime);
    } else if (this.gameState === "shooting") {
      this.marthaScene.update(deltaTime);
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
    // Clear canvas with background
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

    // Render current screen
    if (this.gameState === "menu") {
      this.levelSelect.render(this.ctx);
    } else if (this.gameState === "matching") {
      this.matchScreen.render(this.ctx);
    } else if (this.gameState === "shooting") {
      this.marthaScene.render(this.ctx);
    } else if (this.gameState === "gameOver") {
      this.levelEndScreen.render(this.ctx);
    }

    // Debug: Show FPS
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
      // Calculate delta time
      this.deltaTime = currentTime - this.lastFrameTime;

      // Limit frame rate to 60fps
      if (this.deltaTime >= this.frameInterval) {
        this.lastFrameTime =
          currentTime - (this.deltaTime % this.frameInterval);

        // Update and render
        this.update(this.deltaTime);
        this.render();
      }

      requestAnimationFrame(gameLoop);
    };

    requestAnimationFrame(gameLoop);
  }

  // Legacy method for backward compatibility
  gameLoop() {
    // This method is no longer used but kept for compatibility
    console.warn("Legacy gameLoop() called - use startGameLoop() instead");
  }
}

// Start the game when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded, checking for game elements...");

  // Check if required elements exist
  const canvas = document.getElementById("gameCanvas");
  const container = document.getElementById("gameContainer");

  if (!canvas) {
    console.error("Canvas element with id 'gameCanvas' not found in HTML!");
    console.error(
      "Make sure your HTML contains: <canvas id='gameCanvas'></canvas>"
    );
    return;
  }

  if (!container) {
    console.error(
      "Container element with id 'gameContainer' not found in HTML!"
    );
    console.error(
      "Make sure your HTML contains: <div id='gameContainer'></div>"
    );
    return;
  }

  // Elements exist, safe to initialize game
  console.log("All required elements found, initializing game...");
  try {
    const game = new SockGame();
    console.log("Game initialized successfully");
  } catch (error) {
    console.error("Failed to initialize game:", error);
    console.error(
      "Please check the console for details and ensure all HTML elements are present"
    );
  }
});
