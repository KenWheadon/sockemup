# Refactoring Guide for Sock Em Up

## Overview

This document outlines the current codebase structure and provides recommendations for future refactoring to improve maintainability and code organization.

## Current File Structure

### Large Files (Priority for Refactoring)

1. **level-select.js** (3,858 lines) - CRITICAL
   - Contains: Level selection, Easter egg mini-game, achievements drawer, difficulty modal, story viewer, credits
   - Recommendation: Extract into separate modules

2. **match-screen.js** (1,225 lines)
   - Contains: Sock matching game logic
   - Recommendation: Extract sock manager and physics

3. **throwing-screen.js** (953 lines)
   - Contains: Sock throwing mechanics
   - Recommendation: Extract trajectory calculations

4. **level-end-screen.js** (939 lines)
   - Contains: End screen with stats and rewards
   - Recommendation: Extract achievement logic

5. **app.js** (930 lines)
   - Contains: Main game loop and state management
   - Recommendation: Extract save/load system

## Recommended Module Extraction

### For level-select.js

#### 1. UI Helpers Module ✅ COMPLETED
**File**: `level-select/ui-helpers.js`
- Shared rendering utilities
- Button rendering
- Text wrapping
- Easing functions

#### 2. Story Viewer Module ✅ COMPLETED
**File**: `level-select/story-viewer.js`
- Story panel browsing
- Navigation between panels
- Modal rendering

#### 3. Easter Egg Manager (Future)
**File**: `level-select/easter-egg-manager.js`
**Responsibilities**:
- Sock spawning and physics
- Drop zone management
- Matching logic
- Particle effects

**Methods to Extract**:
- `activateEasterEgg()`
- `spawnSingleSock()`
- `updateMenuSocks(deltaTime)`
- `checkForEasterEggMatches()`
- `snapSockToDropZone()`
- `renderEasterDropZones()`
- `renderMenuSocks()`
- All Easter egg-related state

#### 4. Achievements Drawer (Future)
**File**: `level-select/achievements-drawer.js`
**Responsibilities**:
- Achievement display
- Scrolling logic
- Progress tracking
- Drawer animation

**Methods to Extract**:
- `toggleAchievementsDrawer()`
- `renderAchievementsDrawer()`
- All achievement drawer state

#### 5. Difficulty Modal (Future)
**File**: `level-select/difficulty-modal.js`
**Responsibilities**:
- NEW GAME+ difficulty selection
- Modal rendering
- Difficulty button handling

**Methods to Extract**:
- `openDifficultyModal()`
- `closeDifficultyModal()`
- `handleDifficultyModalClick()`
- `renderDifficultyModal()`
- All difficulty modal state

## Refactoring Benefits

### Immediate Benefits
1. **Improved Readability**: Smaller, focused files are easier to understand
2. **Better Maintainability**: Changes to one feature don't affect others
3. **Easier Testing**: Isolated modules can be tested independently
4. **Reduced Merge Conflicts**: Team members can work on different modules

### Long-term Benefits
1. **Reusability**: Modules can be reused in other screens
2. **Performance**: Easier to optimize specific features
3. **Scalability**: Adding new features doesn't bloat existing files
4. **Documentation**: Each module can have its own focused documentation

## Implementation Strategy

### Phase 1: Extract Independent Modules ✅ IN PROGRESS
- [x] Create UI Helpers
- [x] Extract Story Viewer
- [ ] Extract Difficulty Modal

### Phase 2: Extract Complex Features
- [ ] Extract Easter Egg Manager
- [ ] Extract Achievements Drawer

### Phase 3: Refactor Main Class
- [ ] Reduce level-select.js to core responsibilities
- [ ] Add JSDoc documentation
- [ ] Organize methods into logical sections

### Phase 4: Apply to Other Large Files
- [ ] Refactor match-screen.js
- [ ] Refactor throwing-screen.js
- [ ] Extract shared utilities

## Code Organization Best Practices

### 1. Single Responsibility Principle
Each class should have one primary responsibility.

### 2. Clear Interfaces
Modules should communicate through well-defined interfaces.

### 3. Minimal Dependencies
Each module should depend on as few other modules as possible.

### 4. Consistent Naming
- Classes: PascalCase (e.g., `StoryViewer`)
- Methods: camelCase (e.g., `renderButton`)
- Constants: UPPER_SNAKE_CASE (e.g., `MAX_PANELS`)

### 5. Documentation
Use JSDoc comments for all public methods:

```javascript
/**
 * Open the story viewer modal
 * @returns {void}
 */
open() {
  // ...
}
```

## Current Progress

### Completed
- ✅ UI Helpers module created
- ✅ Story Viewer module extracted
- ✅ HTML updated with new script references

### In Progress
- 🔄 Documentation of refactoring strategy

### Pending
- ⏳ Difficulty Modal extraction
- ⏳ Easter Egg Manager extraction
- ⏳ Achievements Drawer extraction
- ⏳ Update level-select.js to use extracted modules

## Migration Path

To minimize risk, follow this gradual migration:

1. **Create module file** with all necessary code
2. **Test module independently** to ensure it works
3. **Update main file** to instantiate and use the module
4. **Remove old code** from main file
5. **Test thoroughly** to ensure no regressions
6. **Commit changes** with clear message

## Example: Using Story Viewer Module

```javascript
// In level-select.js constructor
this.uiHelpers = new UIHelpers(this.game);
this.storyViewer = new StoryViewer(this.game, this.uiHelpers);

// In onUpdate
this.storyViewer.update(deltaTime);

// In handleMouseMove
this.storyViewer.updateButtonHover(x, y, layout);

// In onClick
if (this.storyViewer.button.hovered) {
  this.storyViewer.open();
  return true;
}

// In onKeyPress
if (this.storyViewer.handleKeyPress(e)) {
  return;
}

// In onRender
this.storyViewer.renderButton(ctx, layout);
this.storyViewer.renderModal(ctx, layout);
```

## Notes

- Keep backward compatibility during refactoring
- Test after each extraction
- Document all public APIs
- Consider performance implications
- Maintain consistent code style

## Future Considerations

1. **TypeScript Migration**: Consider TypeScript for better type safety
2. **Build System**: Add bundler (Webpack/Rollup) for production builds
3. **Testing Framework**: Add Jest or Mocha for unit tests
4. **Linting**: Add ESLint for code quality
5. **Module Bundling**: Consider ES6 modules once extracted

---

Last Updated: 2025-10-08
Status: In Progress
