// keyboard-controller.js - Keyboard to Gamepad Emulation
// This controller emulates gamepad input from keyboard, allowing keyboard controls
// to leverage the existing controller system

class KeyboardController {
  constructor(controllerManager) {
    this.controllerManager = controllerManager;
    this.isEnabled = false;

    // Virtual gamepad state - mimics navigator.Gamepad structure
    this.virtualGamepad = {
      index: 99, // Use index 99 for virtual keyboard gamepad
      id: "Keyboard Emulator",
      connected: true,
      timestamp: 0,
      mapping: "standard",
      axes: [0, 0, 0, 0], // [leftStickX, leftStickY, rightStickX, rightStickY]
      buttons: Array(16).fill({ pressed: false, touched: false, value: 0 }),
    };

    // Key state tracking for smooth analog input
    this.keyState = {
      // Movement keys
      ArrowUp: false,
      ArrowDown: false,
      ArrowLeft: false,
      ArrowRight: false,
      'w': false,
      'W': false,
      'a': false,
      'A': false,
      's': false,
      'S': false,
      'd': false,
      'D': false,

      // Action keys
      ' ': false,  // Space - A button
      'Enter': false, // Enter - A button
      'Escape': false, // Esc - B button
    };

    // Bind keyboard event listeners
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);

    // Poll for updates
    this.pollInterval = null;
    this.pollRate = 16; // ~60fps, same as controller polling

    // Always listen for keyboard input (with capture phase to intercept early)
    window.addEventListener('keydown', this.handleKeyDown, true);
    window.addEventListener('keyup', this.handleKeyUp, true);

    // Start polling immediately
    this.startPolling();
  }

  enable() {
    if (this.isEnabled) return;

    this.isEnabled = true;

    // Add the virtual gamepad to the controller manager
    this.controllerManager.connectedControllers.set(99, this.virtualGamepad);

    // Start polling if not already polling
    if (!this.controllerManager.pollInterval) {
      this.controllerManager.startPolling();
    }

    console.log('🎮 Keyboard controls enabled');
  }

  disable() {
    if (!this.isEnabled) return;

    this.isEnabled = false;
    window.removeEventListener('keydown', this.handleKeyDown, true);
    window.removeEventListener('keyup', this.handleKeyUp, true);

    this.stopPolling();

    // Remove virtual gamepad from controller manager
    this.controllerManager.connectedControllers.delete(99);

    // Reset all key states
    for (const key in this.keyState) {
      this.keyState[key] = false;
    }

    // Hide reticle if no real controllers connected
    if (this.controllerManager.connectedControllers.size === 0) {
      this.controllerManager.reticle.visible = false;
    }

    console.log('🎮 Keyboard controls disabled');
  }

  toggle() {
    if (this.isEnabled) {
      this.disable();
    } else {
      this.enable();
    }
  }

  handleKeyDown(e) {
    // Show reticle when ANY keyboard button is pressed
    if (!this.controllerManager.reticle.visible) {
      this.controllerManager.reticle.visible = true;
      this.controllerManager.mouseUsedRecently = false;
      this.controllerManager.mouseInactiveTimer = 0;

      // Initialize reticle position at center
      const canvasWidth = this.controllerManager.game.getCanvasWidth();
      const canvasHeight = this.controllerManager.game.getCanvasHeight();
      this.controllerManager.reticle.x = canvasWidth / 2;
      this.controllerManager.reticle.y = canvasHeight / 2;

      console.log('🎮 Reticle shown at', this.controllerManager.reticle.x, this.controllerManager.reticle.y);
    }

    // Track key state - include WASD and arrow keys
    const isTracked = this.keyState.hasOwnProperty(e.key) ||
                     ['w', 'W', 'a', 'A', 's', 'S', 'd', 'D'].includes(e.key);

    if (!isTracked) return;

    // Track the key state
    this.keyState[e.key] = true;

    // If keyboard mode is not enabled, enable it on first key press
    if (!this.isEnabled) {
      this.enable();
      console.log('🎮 Keyboard mode auto-enabled by key press');
    }

    // Prevent default behavior for keyboard-controlled keys
    e.preventDefault();
    e.stopPropagation();
  }

  handleKeyUp(e) {
    // Track key state - include WASD and arrow keys
    const isTracked = this.keyState.hasOwnProperty(e.key) ||
                     ['w', 'W', 'a', 'A', 's', 'S', 'd', 'D'].includes(e.key);

    if (!isTracked) return;

    // Always track the key state
    this.keyState[e.key] = false;

    // Only prevent default if keyboard mode is enabled
    if (this.isEnabled) {
      // Prevent default behavior for keyboard-controlled keys
      e.preventDefault();
      e.stopPropagation();
    }
  }

  startPolling() {
    this.pollInterval = setInterval(() => {
      this.updateVirtualGamepad();
    }, this.pollRate);
  }

  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  updateVirtualGamepad() {
    if (!this.isEnabled) return;

    // Update analog sticks based on key presses
    // Left stick: Arrow keys or WASD
    const moveUp = this.keyState.ArrowUp || this.keyState['w'] || this.keyState['W'];
    const moveDown = this.keyState.ArrowDown || this.keyState['s'] || this.keyState['S'];
    const moveLeft = this.keyState.ArrowLeft || this.keyState['a'] || this.keyState['A'];
    const moveRight = this.keyState.ArrowRight || this.keyState['d'] || this.keyState['D'];

    // Calculate analog stick values (digital to analog conversion with smooth values)
    let stickX = 0;
    let stickY = 0;

    if (moveLeft) stickX -= 1;
    if (moveRight) stickX += 1;
    if (moveUp) stickY -= 1;
    if (moveDown) stickY += 1;

    // Normalize diagonal movement
    if (stickX !== 0 && stickY !== 0) {
      const magnitude = Math.sqrt(stickX * stickX + stickY * stickY);
      stickX /= magnitude;
      stickY /= magnitude;
    }

    // Update the virtual gamepad axes
    this.virtualGamepad.axes[0] = stickX; // Left stick X
    this.virtualGamepad.axes[1] = stickY; // Left stick Y
    this.virtualGamepad.axes[2] = 0;      // Right stick X (not used by keyboard)
    this.virtualGamepad.axes[3] = 0;      // Right stick Y (not used by keyboard)

    // Debug: log when stick is moved
    if (stickX !== 0 || stickY !== 0) {
      console.log('🎮 Keyboard axes updated:', stickX, stickY);
    }

    // Update buttons
    // Button mapping:
    // 0 = A button (Space or Enter)
    // 1 = B button (Escape)
    // 12-15 = D-pad (handled via analog stick in this controller)

    this.virtualGamepad.buttons[0] = {
      pressed: this.keyState[' '] || this.keyState['Enter'],
      touched: this.keyState[' '] || this.keyState['Enter'],
      value: (this.keyState[' '] || this.keyState['Enter']) ? 1 : 0
    };

    this.virtualGamepad.buttons[1] = {
      pressed: this.keyState['Escape'],
      touched: this.keyState['Escape'],
      value: this.keyState['Escape'] ? 1 : 0
    };

    // D-pad buttons (12-15) for menu navigation when using keyboard
    this.virtualGamepad.buttons[12] = {
      pressed: moveUp,
      touched: moveUp,
      value: moveUp ? 1 : 0
    };

    this.virtualGamepad.buttons[13] = {
      pressed: moveDown,
      touched: moveDown,
      value: moveDown ? 1 : 0
    };

    this.virtualGamepad.buttons[14] = {
      pressed: moveLeft,
      touched: moveLeft,
      value: moveLeft ? 1 : 0
    };

    this.virtualGamepad.buttons[15] = {
      pressed: moveRight,
      touched: moveRight,
      value: moveRight ? 1 : 0
    };

    // Update timestamp for gamepad API
    this.virtualGamepad.timestamp = performance.now();
  }

  isKeyboardEnabled() {
    return this.isEnabled;
  }

  cleanup() {
    this.disable();
  }
}
