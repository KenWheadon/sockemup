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

  // UI positions
  SOCK_PILE_POS: { x: 600, y: 700 }, // Bottom center
  DROP_ZONE_POSITIONS: [
    { x: 1050, y: 200, width: 80, height: 80 },
    { x: 1050, y: 320, width: 80, height: 80 },
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
      marthaSpeed: 1,
      sockPairs: 3,
      typesAvailable: [1],
      matchingTime: 100,
    },
    {
      sockTarget: 5,
      marthaSpeed: 1.5,
      sockPairs: 10,
      typesAvailable: [1, 2, 3],
      matchingTime: 45,
    },
    {
      sockTarget: 8,
      marthaSpeed: 2,
      sockPairs: 16,
      typesAvailable: [1, 2, 3, 4, 5, 6],
      matchingTime: 30,
    },
  ],

  // Level costs and unlock data
  LEVEL_COSTS: [0, 10, 25],
  INITIAL_UNLOCKED_LEVELS: [true, false, false],

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
    UI: ["background.png", "logo.png"],
  },
};
