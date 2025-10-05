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
  POINTS_PER_SOCKBALL_PAID: 5,
  POINTS_PER_SOCK: 10,
  GRAVITY: 0.2,
  FRICTION: 0.98,
  BOUNCE_DAMPING: 0.8,

  // Sock settings
  SOCK_SIZE: 80,
  SOCKBALL_SIZE: 30,
  SOCK_SHOOT_SPEED: 37,

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
  SOCKBALL_THROW_SPEED: 20,
  SOCKBALL_THROW_COOLDOWN: 2000, // milliseconds
  SOCKBALL_LAUNCH_POSITION: { x: 50, y: 750 }, // bottom left corner

  // Martha movement patterns
  MARTHA_PATTERNS: {
    HORIZONTAL: {
      name: "horizontal",
      baseSpeed: 1.6,
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
      baseSpeed: 1.1,
      description: "Moves in circular patterns",
    },
    RANDOM: {
      name: "random",
      baseSpeed: 1.2,
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
  DEBUG_PHYSICS_BOUNDS: false, // Set to false to hide bounds

  // Game levels
  LEVELS: [
    {
      marthaSpeed: 0.5,
      sockPairs: 3,
      typesAvailable: [1],
      matchingTime: 60,
      marthaWantsSockballs: 1,
      marthaPatterns: ["horizontal", "vertical"],
      marthaPatternSpeed: 0.5,
    },
    {
      marthaSpeed: 0.75,
      sockPairs: 6,
      typesAvailable: [1, 2],
      matchingTime: 60,
      marthaWantsSockballs: 3,
      marthaPatterns: ["horizontal", "vertical", "diagonal"],
      marthaPatternSpeed: 0.8,
    },
    {
      marthaSpeed: 1,
      sockPairs: 9,
      typesAvailable: [1, 2, 3],
      matchingTime: 60,
      marthaWantsSockballs: 4,
      marthaPatterns: ["horizontal", "vertical", "diagonal", "circular"],
      marthaPatternSpeed: 1,
    },
    {
      marthaSpeed: 1.15,
      sockPairs: 12,
      typesAvailable: [1, 2, 3, 4],
      matchingTime: 50,
      marthaWantsSockballs: 6,
      marthaPatterns: ["horizontal", "vertical", "diagonal", "circular"],
      marthaPatternSpeed: 1,
    },
    {
      marthaSpeed: 1.25,
      sockPairs: 15,
      typesAvailable: [1, 2, 3, 4, 5],
      matchingTime: 55,
      marthaWantsSockballs: 8,
      marthaPatterns: ["diagonal", "circular", "random"],
      marthaPatternSpeed: 1.15,
    },
    {
      marthaSpeed: 1.35,
      sockPairs: 24,
      typesAvailable: [1, 2, 3, 4, 5, 6],
      matchingTime: 80,
      marthaWantsSockballs: 12,
      marthaPatterns: [
        "horizontal",
        "vertical",
        "diagonal",
        "circular",
        "random",
      ],
      marthaPatternSpeed: 1.25,
    },
    // NEW LEVELS - Phase 3.1
    {
      marthaSpeed: 1.45,
      sockPairs: 30,
      typesAvailable: [1, 2, 3, 4],
      matchingTime: 90,
      marthaWantsSockballs: 15,
      marthaPatterns: ["diagonal", "circular"],
      marthaPatternSpeed: 1.35,
    },
    {
      marthaSpeed: 1.55,
      sockPairs: 36,
      typesAvailable: [1, 2, 3, 4, 5],
      matchingTime: 100,
      marthaWantsSockballs: 18,
      marthaPatterns: [
        "horizontal",
        "vertical",
        "diagonal",
        "circular",
        "random",
      ],
      marthaPatternSpeed: 1.45,
    },
    {
      marthaSpeed: 1.7,
      sockPairs: 45,
      typesAvailable: [1, 2, 3, 4, 5, 6],
      matchingTime: 120,
      marthaWantsSockballs: 22,
      marthaPatterns: ["random", "circular"],
      marthaPatternSpeed: 1.6,
    },
  ],

  // Level costs and unlock data (updated for 9 levels)
  LEVEL_COSTS: [0, 25, 45, 70, 100, 150, 200, 250, 300],
  MARTHA_FRAMES: [0, 1, 0, 2, 0, 3, 1, 2, 3],
  INITIAL_UNLOCKED_LEVELS: [
    true,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
  ],
  INITIAL_COMPLETED_LEVELS: [
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
  ],

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
    CHARACTERS: [
      "martha.png",
      "martha2.png",
      "martha3.png",
      "martha3.png",
      "martha-rentdue.png",
      "martha-win.png",
      "martha-demand.png",
    ],
    UI: [
      "background.png",
      "logo.png",
      "star.png",
      "throw-bg.png",
      "throw-bg-2.png",
      "throw-bg-3.png",
      "throw-bg-4.png",
      "throw-bg-5.png",
      "throw-bg-6.png",
      "throw-bg-7.png",
      "throw-bg-8.png",
      "throw-bg-9.png",
      "level-select-bg.png",
      "you-win.png",
    ],
  },

  // Sockball queue management utilities
  // These methods will be added to the main game object
  SOCKBALL_QUEUE_METHODS: {
    // Initialize the sockball queue
    initializeSockballQueue: function () {
      this.sockballQueue = [];
    },

    // Add a sockball type to the queue (called when socks are matched)
    addSockballToQueue: function (sockType) {
      this.sockballQueue.push(sockType);
      this.sockBalls++; // Increment total sockballs
    },

    // Get the next sockball type from the queue (for throwing)
    getNextSockballFromQueue: function () {
      if (this.sockballQueue.length > 0) {
        return this.sockballQueue.shift(); // Remove and return first item (FIFO)
      }
      return null;
    },

    // Preview the next sockball type without removing it
    getNextSockballType: function () {
      if (this.sockballQueue.length > 0) {
        return this.sockballQueue[0]; // Return first item without removing
      }
      return null;
    },

    // Clear the sockball queue (called when starting a new level)
    clearSockballQueue: function () {
      this.sockballQueue = [];
    },

    // Get the remaining sockballs in queue
    getSockballQueueLength: function () {
      return this.sockballQueue.length;
    },
  },

  // ========== ENHANCED GAME CONFIGURATION - PHASE 1.1 ==========

  // Martha catch mechanics settings
  CATCH_MECHANICS: {
    CATCH_RADIUS_MULTIPLIER: 1.3, // 1.3x Martha's actual size
    PERFECT_CATCH_THRESHOLD: 0.3, // Center 30% of Martha = perfect
    GOOD_CATCH_THRESHOLD: 0.6, // Center 60% of Martha = good
    PERFECT_CATCH_BONUS: 15,
    GOOD_CATCH_BONUS: 10,
    REGULAR_CATCH_BONUS: 5,
  },

  // Perfect catch scoring thresholds
  CATCH_QUALITY: {
    PERFECT: {
      name: "Perfect!",
      points: 15,
      color: "#FFD700", // Gold
      particleColor: "#FFD700",
    },
    GOOD: {
      name: "Good!",
      points: 10,
      color: "#00FF00", // Green
      particleColor: "#00FF00",
    },
    REGULAR: {
      name: "Nice!",
      points: 5,
      color: "#FFFFFF", // White
      particleColor: "#FFFFFF",
    },
  },

  // NEW GAME+ Difficulty multipliers
  DIFFICULTY_MODES: {
    BASE: {
      name: "Normal",
      speedMultiplier: 1.0,
      timeMultiplier: 1.0,
      throwCooldownMultiplier: 1.0,
      displayName: "Normal",
      stars: 0,
    },
    PLUS_1: {
      name: "NEW GAME+1",
      speedMultiplier: 1.1,
      timeMultiplier: 0.98,
      throwCooldownMultiplier: 0.95,
      displayName: "★",
      stars: 1,
    },
    PLUS_2: {
      name: "NEW GAME+2",
      speedMultiplier: 1.25,
      timeMultiplier: 0.95,
      throwCooldownMultiplier: 0.9,
      displayName: "★★",
      stars: 2,
    },
    PLUS_3: {
      name: "NEW GAME+3",
      speedMultiplier: 1.4,
      timeMultiplier: 0.92,
      throwCooldownMultiplier: 0.85,
      displayName: "★★★",
      stars: 3,
    },
    PLUS_4: {
      name: "NEW GAME+4",
      speedMultiplier: 1.5,
      timeMultiplier: 0.9,
      throwCooldownMultiplier: 0.8,
      displayName: "★★★★",
      stars: 4,
    },
  },

  // Get difficulty mode by level
  getDifficultyMode: function (difficultyLevel) {
    const modes = [
      this.DIFFICULTY_MODES.BASE,
      this.DIFFICULTY_MODES.PLUS_1,
      this.DIFFICULTY_MODES.PLUS_2,
      this.DIFFICULTY_MODES.PLUS_3,
      this.DIFFICULTY_MODES.PLUS_4,
    ];
    return modes[Math.min(difficultyLevel, modes.length - 1)];
  },

  // Level background mappings
  LEVEL_BACKGROUNDS: [
    "throw-bg.png", // Level 1
    "throw-bg-2.png", // Level 2
    "throw-bg-3.png", // Level 3
    "throw-bg-4.png", // Level 4
    "throw-bg-5.png", // Level 5
    "throw-bg-6.png", // Level 6
    "throw-bg-7.png", // Level 7
    "throw-bg-8.png", // Level 8
    "throw-bg-9.png", // Level 9
  ],

  // Achievement definitions
  ACHIEVEMENTS: {
    FIRST_MATCH: {
      id: "first_match",
      name: "First Match",
      description: "Match your first pair of socks",
      icon: "⚡",
      unlocked: false,
    },
    PERFECT_THROW: {
      id: "perfect_throw",
      name: "Perfect Throw",
      description: "Hit Martha in the center (perfect catch)",
      icon: "🎯",
      unlocked: false,
    },
    SPEEDY_MATCHER: {
      id: "speedy_matcher",
      name: "Speedy Matcher",
      description: "Complete matching phase with 30+ seconds remaining",
      icon: "⚡",
      unlocked: false,
    },
    MARTHAS_FAVORITE: {
      id: "marthas_favorite",
      name: "Martha's Favorite",
      description: "Complete a level without missing any throws",
      icon: "❤️",
      unlocked: false,
    },
    SOCK_MASTER: {
      id: "sock_master",
      name: "Sock Master",
      description: "Complete all 9 levels",
      icon: "👑",
      unlocked: false,
    },
    PERFECTIONIST: {
      id: "perfectionist",
      name: "Perfectionist",
      description: "Get 10 perfect throws in one level",
      icon: "💎",
      unlocked: false,
    },
    QUICK_HANDS: {
      id: "quick_hands",
      name: "Quick Hands",
      description: "Match 5 pairs in under 10 seconds",
      icon: "👐",
      unlocked: false,
    },
    STREAK_KING: {
      id: "streak_king",
      name: "Streak King",
      description: "Get a 5x match streak",
      icon: "🔥",
      unlocked: false,
    },
    NEW_GAME_PLUS_HERO: {
      id: "new_game_plus_hero",
      name: "NEW GAME+ Hero",
      description: "Complete any level on +1 difficulty",
      icon: "⭐",
      unlocked: false,
    },
    ULTIMATE_CHAMPION: {
      id: "ultimate_champion",
      name: "Ultimate Champion",
      description: "Complete all levels on +4 difficulty",
      icon: "🏆",
      unlocked: false,
    },
  },

  // Tutorial step definitions
  TUTORIAL_STEPS: {
    MATCH_PHASE: [
      {
        id: "shoot_socks",
        message: "Click the sock pile to shoot socks!",
        highlightElement: "sockPile",
        arrowDirection: "down",
      },
      {
        id: "drag_socks",
        message: "Drag socks to matching drop zones",
        highlightElement: "dropZones",
        arrowDirection: "down",
      },
      {
        id: "create_sockball",
        message: "Match 2 same socks to create a sockball!",
        highlightElement: "dropZones",
        arrowDirection: "down",
      },
    ],
    THROW_PHASE: [
      {
        id: "aim_throw",
        message: "Click to aim and throw at Martha!",
        highlightElement: "martha",
        arrowDirection: "up",
      },
      {
        id: "hit_martha",
        message: "Hit Martha to give her sockballs!",
        highlightElement: "martha",
        arrowDirection: "up",
      },
    ],
  },

  // Story intro slides
  STORY_SLIDES: [
    {
      id: "meet_martha",
      title: "Meet Martha",
      text: "This is Martha! She's a sock-loving champion who needs your help!",
      image: "martha.png",
    },
    {
      id: "rent_problem",
      title: "The Rent Problem",
      text: "Martha's rent is due! She needs sockballs to pay her landlord!",
      image: "martha-rentdue.png",
    },
    {
      id: "sock_power",
      title: "Sock Power!",
      text: "Match pairs of socks to create powerful sockballs!",
      image: "sockball1.png",
    },
    {
      id: "how_to_play",
      title: "How to Play",
      text: "Shoot socks, match pairs, then throw sockballs to Martha!",
      image: "martha-demand.png",
    },
    {
      id: "good_luck",
      title: "Good Luck!",
      text: "Help Martha pay her rent and become a sock master!",
      image: "martha-win.png",
    },
  ],

  // Encouraging feedback messages
  ENCOURAGEMENT_MESSAGES: {
    PERFECT_CATCH: [
      "Incredible aim!",
      "You're a natural!",
      "Amazing throw!",
      "Perfect shot!",
      "That was beautiful!",
    ],
    GOOD_CATCH: [
      "Great throw!",
      "Nice one!",
      "Well done!",
      "Keep it up!",
      "Excellent!",
    ],
    MATCH_MADE: [
      "Nice match!",
      "Great pairing!",
      "You're doing great!",
      "Keep matching!",
      "Fantastic!",
    ],
    LEVEL_START: [
      "You can do this!",
      "Let's go!",
      "Time to shine!",
      "Show me what you got!",
      "Ready to rock!",
    ],
    STRUGGLING: [
      "Keep trying!",
      "You're getting there!",
      "Don't give up!",
      "You've got this!",
      "Stay focused!",
    ],
    LEVEL_COMPLETE: [
      "You're amazing!",
      "Fantastic work!",
      "You did it!",
      "Incredible job!",
      "You're the best!",
    ],
  },

  // Get random encouragement message
  getRandomEncouragement: function (category) {
    const messages = this.ENCOURAGEMENT_MESSAGES[category] || [];
    if (messages.length === 0) return "";
    return messages[Math.floor(Math.random() * messages.length)];
  },
};
