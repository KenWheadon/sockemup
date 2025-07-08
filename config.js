const GameConfig = {
  CANVAS_WIDTH: 1200,
  CANVAS_HEIGHT: 800,

  // Physics bounds (adjust these to match your background graphic)
  PHYSICS_BOUNDS: {
    LEFT: 50,
    RIGHT: 1150,
    TOP: 50,
    BOTTOM: 750,
  },

  // Game settings
  INITIAL_HP: 10,
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

  // Martha settings
  MARTHA_SIZE: { width: 60, height: 80 },
  MARTHA_HIT_EFFECT_DURATION: 60, // frames

  // UI positions - Updated for full-width drawer and 3 pairs of drop zones
  SOCK_PILE_POS: { x: 600, y: 700 }, // Will be calculated dynamically for full width
  DROP_ZONE_POSITIONS: [
    // Pair 1 (left side)
    { x: 200, y: 150, width: 80, height: 80, pairId: 0 },
    { x: 200, y: 250, width: 80, height: 80, pairId: 0 },

    // Pair 2 (center)
    { x: 600, y: 150, width: 80, height: 80, pairId: 1 },
    { x: 600, y: 250, width: 80, height: 80, pairId: 1 },

    // Pair 3 (right side)
    { x: 1000, y: 150, width: 80, height: 80, pairId: 2 },
    { x: 1000, y: 250, width: 80, height: 80, pairId: 2 },
  ],

  // Drop zone pair boxes
  DROP_ZONE_PAIR_BOXES: [
    { x: 200, y: 200, width: 120, height: 160, pairId: 0 },
    { x: 600, y: 200, width: 120, height: 160, pairId: 1 },
    { x: 1000, y: 200, width: 120, height: 160, pairId: 2 },
  ],

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
    },
    {
      sockTarget: 3,
      marthaSpeed: 1,
      sockPairs: 4,
      typesAvailable: [1, 2],
      matchingTime: 60,
    },
    {
      sockTarget: 5,
      marthaSpeed: 1.2,
      sockPairs: 6,
      typesAvailable: [1, 2, 3],
      matchingTime: 55,
    },
    {
      sockTarget: 10,
      marthaSpeed: 1.5,
      sockPairs: 10,
      typesAvailable: [1, 2, 3, 4],
      matchingTime: 50,
    },
    {
      sockTarget: 12,
      marthaSpeed: 1.75,
      sockPairs: 14,
      typesAvailable: [1, 2, 3, 4, 5],
      matchingTime: 45,
    },
    {
      sockTarget: 16,
      marthaSpeed: 2,
      sockPairs: 20,
      typesAvailable: [1, 2, 3, 4, 5, 6],
      matchingTime: 40,
    },
  ],

  // Level costs and unlock data
  LEVEL_COSTS: [0, 10, 25, 50, 100, 150],
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
    CHARACTERS: ["martha.png"],
    UI: ["background.png", "logo.png", "star.png"],
  },
};
