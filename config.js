const GameConfig = {
  // Target canvas dimensions and aspect ratio
  TARGET_WIDTH: 1200,
  TARGET_HEIGHT: 800,
  TARGET_ASPECT_RATIO: 1200 / 800, // 1.5 (3:2 ratio)

  // Canvas sizing constraints
  MIN_WIDTH: 600,
  MIN_HEIGHT: 400,
  MAX_WIDTH: 1920,
  MAX_HEIGHT: 1080,

  // Original canvas dimensions for backwards compatibility
  CANVAS_WIDTH: 1200,
  CANVAS_HEIGHT: 800,

  // Canvas sizing utility functions
  calculateCanvasSize: function (viewportWidth, viewportHeight) {
    const viewportRatio = viewportWidth / viewportHeight;
    const targetRatio = this.TARGET_ASPECT_RATIO;

    let canvasWidth, canvasHeight;

    if (viewportRatio > targetRatio) {
      // Viewport is wider than target ratio - fit to height
      canvasHeight = Math.min(viewportHeight, this.MAX_HEIGHT);
      canvasWidth = canvasHeight * targetRatio;
    } else {
      // Viewport is taller than target ratio - fit to width
      canvasWidth = Math.min(viewportWidth, this.MAX_WIDTH);
      canvasHeight = canvasWidth / targetRatio;
    }

    // Ensure minimum size constraints
    if (canvasWidth < this.MIN_WIDTH) {
      canvasWidth = this.MIN_WIDTH;
      canvasHeight = canvasWidth / targetRatio;
    }
    if (canvasHeight < this.MIN_HEIGHT) {
      canvasHeight = this.MIN_HEIGHT;
      canvasWidth = canvasHeight * targetRatio;
    }

    return {
      width: Math.round(canvasWidth),
      height: Math.round(canvasHeight),
      scale: canvasWidth / this.TARGET_WIDTH,
    };
  },

  // Get scale factor for responsive UI elements
  getScaleFactor: function (currentWidth) {
    return currentWidth / this.TARGET_WIDTH;
  },

  // Physics bounds (adjust these to match your background graphic)
  PHYSICS_BOUNDS: {
    LEFT: 50,
    RIGHT: 1300,
    TOP: 70,
    BOTTOM: 700,
  },

  // Game settings
  POINTS_PER_SOCK: 10,
  GRAVITY: 0.2,
  STARTING_SPEED: 15,
  FRICTION: 0.98,
  BOUNCE_DAMPING: 0.8,

  // Sock settings
  SOCK_SIZE: 80,
  SOCKBALL_SIZE: 30,
  SOCK_BOUNCE_VELOCITY: 8,
  SOCK_SHOOT_SPEED: 12,

  // dropssss
  DROP_TARGET_PAIRS: 5,

  // Martha settings
  MARTHA_SIZE: { width: 60, height: 80 },
  MARTHA_HIT_EFFECT_DURATION: 60, // frames

  // Throwing screen settings
  THROWING_BOUNDS: {
    LEFT: 0,
    RIGHT: 1200,
    TOP: 0,
    BOTTOM: 800,
  },

  // Sockball throwing settings
  SOCKBALL_THROW_SPEED: 15,
  SOCKBALL_THROW_COOLDOWN: 2000, // milliseconds
  SOCKBALL_LAUNCH_POSITION: { x: 100, y: 650 }, // bottom left corner

  // Martha movement patterns
  MARTHA_PATTERNS: {
    HORIZONTAL: {
      name: "horizontal",
      baseSpeed: 2,
      description: "Moves left and right",
    },
    VERTICAL: {
      name: "vertical",
      baseSpeed: 1.5,
      description: "Moves up and down",
    },
    DIAGONAL: {
      name: "diagonal",
      baseSpeed: 1.8,
      description: "Moves in diagonal patterns",
    },
    CIRCULAR: {
      name: "circular",
      baseSpeed: 1.2,
      description: "Moves in circular patterns",
    },
    RANDOM: {
      name: "random",
      baseSpeed: 2.5,
      description: "Moves randomly",
    },
  },

  // Martha hit effects
  MARTHA_HIT_EFFECTS: {
    FLASH_DURATION: 300, // milliseconds
    KNOCKBACK_DISTANCE: 20,
    POINT_POP_DURATION: 1000,
  },

  // UI positions - Updated for full-width drawer and 3 pairs of drop zones
  SOCK_PILE_POS: { x: 600, y: 700 }, // Will be calculated dynamically for full width

  // Sock pile image thresholds
  SOCK_PILE_THRESHOLDS: {
    IMAGE_1: 80, // Full pile
    IMAGE_2: 50, // 3/4 pile
    IMAGE_3: 30, // 1/2 pile
    IMAGE_4: 10, // Almost empty
  },

  // Animation settings
  SOCKBALL_ANIMATION_SPEED: 5,
  SHAKE_DURATION: 12, // frames
  POP_DURATION: 30, // frames

  // Debug settings
  DEBUG_PHYSICS_BOUNDS: true, // Set to false to hide bounds

  // Game levels
  LEVELS: [
    {
      sockTarget: 2,
      marthaSpeed: 0.5,
      sockPairs: 3,
      typesAvailable: [1],
      matchingTime: 60,
      marthaWantsSockballs: 2,
      marthaPatterns: ["horizontal", "vertical"],
      marthaPatternSpeed: 1.0,
    },
    {
      sockTarget: 3,
      marthaSpeed: 1,
      sockPairs: 4,
      typesAvailable: [1, 2],
      matchingTime: 60,
      marthaWantsSockballs: 3,
      marthaPatterns: ["horizontal", "vertical", "diagonal"],
      marthaPatternSpeed: 1.2,
    },
    {
      sockTarget: 5,
      marthaSpeed: 1.2,
      sockPairs: 6,
      typesAvailable: [1, 2, 3],
      matchingTime: 55,
      marthaWantsSockballs: 4,
      marthaPatterns: ["horizontal", "vertical", "diagonal", "circular"],
      marthaPatternSpeed: 1.4,
    },
    {
      sockTarget: 10,
      marthaSpeed: 1.5,
      sockPairs: 10,
      typesAvailable: [1, 2, 3, 4, 5],
      matchingTime: 50,
      marthaWantsSockballs: 6,
      marthaPatterns: [
        "horizontal",
        "vertical",
        "diagonal",
        "circular",
        "random",
      ],
      marthaPatternSpeed: 1.6,
    },
    {
      sockTarget: 12,
      marthaSpeed: 1.75,
      sockPairs: 14,
      typesAvailable: [1, 2, 3, 4, 5],
      matchingTime: 45,
      marthaWantsSockballs: 8,
      marthaPatterns: ["diagonal", "circular", "random"],
      marthaPatternSpeed: 1.8,
    },
    {
      sockTarget: 16,
      marthaSpeed: 2,
      sockPairs: 20,
      typesAvailable: [1, 2, 3, 4, 5, 6],
      matchingTime: 40,
      marthaWantsSockballs: 10,
      marthaPatterns: ["circular", "random"],
      marthaPatternSpeed: 2.0,
    },
  ],

  // Level costs and unlock data
  LEVEL_COSTS: [0, 10, 25, 50, 100, 150],
  MARTHA_FRAMES: [0, 1, 0, 2, 0, 3],
  INITIAL_UNLOCKED_LEVELS: [true, false, false, false, false, false],
  INITIAL_COMPLETED_LEVELS: [false, false, false, false, false, false],

  // Image files
  IMAGES: {
    SOCKS: [
      "sock1.png",
      "sock2.png",
      "sock3.png",
      "sock4.png",
      "sock5.png",
      "sock6.png",
    ],
    SOCK_BALLS: [
      "sockball1.png",
      "sockball2.png",
      "sockball3.png",
      "sockball4.png",
      "sockball5.png",
      "sockball6.png",
    ],
    SOCK_PILES: [
      "sockpile1.png",
      "sockpile2.png",
      "sockpile3.png",
      "sockpile4.png",
    ],
    CHARACTERS: ["martha.png", "martha2.png", "martha3.png", "martha3.png"],
    UI: ["background.png", "logo.png", "star.png"],
  },
};
