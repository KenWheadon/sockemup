class AudioPlayer {
  constructor(game) {
    this.game = game;
    this.isOpen = false;
    this.selectedTrack = null;
    this.isPlaying = false;

    // Hover tracking
    this.hoveredTrack = null;
    this.hoveredButton = null; // 'close', 'play', 'stop'
    this.closeButtonHovered = false;

    // Animation state
    this.openProgress = 0;
    this.scrollOffset = 0;
    this.maxScroll = 0;

    // Initialize unlocked tracks if not exists
    if (!this.game.unlockedTracks) {
      this.game.unlockedTracks = ['menu-music']; // Menu music always unlocked
    }

    // Available music tracks
    this.tracks = [
      { id: 'menu-music', name: 'Menu Theme', type: 'menu', icon: '🎵' },
      { id: 'match-music', name: 'Matching Time - Easy', type: 'match', difficulty: 0, icon: '🧦' },
      { id: 'match-music-1', name: 'Matching Time - NG+1', type: 'match', difficulty: 1, icon: '🧦' },
      { id: 'match-music-2', name: 'Matching Time - NG+2', type: 'match', difficulty: 2, icon: '🧦' },
      { id: 'match-music-3', name: 'Matching Time - NG+3', type: 'match', difficulty: 3, icon: '🧦' },
      { id: 'throwing-music', name: 'Sockball Showdown - Easy', type: 'throwing', difficulty: 0, icon: '⚾' },
      { id: 'throwing-music-1', name: 'Sockball Showdown - NG+1', type: 'throwing', difficulty: 1, icon: '⚾' },
      { id: 'throwing-music-2', name: 'Sockball Showdown - NG+2', type: 'throwing', difficulty: 2, icon: '⚾' },
      { id: 'throwing-music-3', name: 'Sockball Showdown - NG+3', type: 'throwing', difficulty: 3, icon: '⚾' },
      { id: 'victory-music', name: 'Victory!', type: 'victory', icon: '🏆' },
      { id: 'defeat-music', name: 'Defeat', type: 'defeat', icon: '💔' },
    ];
  }

  unlockTrack(trackId) {
    if (!this.game.unlockedTracks.includes(trackId)) {
      this.game.unlockedTracks.push(trackId);
      this.game.saveGameData();
      return true; // Return true if newly unlocked
    }
    return false; // Already unlocked
  }

  isTrackUnlocked(trackId) {
    return this.game.unlockedTracks.includes(trackId);
  }

  open() {
    this.isOpen = true;
    this.openProgress = 0;
    // Pause current menu music when opening player
    this.game.audioManager.pauseMusic();
  }

  close() {
    this.isOpen = false;
    this.stopCurrentTrack();
    this.openProgress = 0;
    this.hoveredTrack = null;
    this.hoveredButton = null;
    // Resume menu music when closing player
    this.game.audioManager.resumeMusic();
  }

  selectTrack(trackId) {
    if (!this.isTrackUnlocked(trackId)) return;

    // Stop current track if playing
    if (this.isPlaying && this.selectedTrack) {
      this.game.audioManager.stopMusic();
    }

    this.selectedTrack = trackId;
    this.isPlaying = false;
  }

  playCurrentTrack() {
    if (!this.selectedTrack || !this.isTrackUnlocked(this.selectedTrack)) return;

    this.game.audioManager.playMusic(this.selectedTrack, true, 0.5);
    this.isPlaying = true;
  }

  pauseCurrentTrack() {
    this.game.audioManager.pauseMusic();
    this.isPlaying = false;
  }

  stopCurrentTrack() {
    if (this.selectedTrack) {
      this.game.audioManager.stopMusic();
      this.isPlaying = false;
    }
  }

  update(deltaTime) {
    if (!this.isOpen) return;

    // Animate opening
    if (this.openProgress < 1) {
      this.openProgress = Math.min(1, this.openProgress + deltaTime * 0.005);
    }
  }

  updateHover(x, y, canvas) {
    if (!this.isOpen) {
      this.hoveredTrack = null;
      this.hoveredButton = null;
      this.closeButtonHovered = false;
      return;
    }

    const playerWidth = Math.min(700, canvas.width - 100);
    const playerHeight = Math.min(600, canvas.height - 100);
    const playerX = (canvas.width - playerWidth) / 2;
    const playerY = (canvas.height - playerHeight) / 2;

    // Check close button hover
    const closeButtonX = playerX + playerWidth - 50;
    const closeButtonY = playerY + 10;
    const closeButtonSize = 40;

    const dx = x - (closeButtonX + closeButtonSize / 2);
    const dy = y - (closeButtonY + closeButtonSize / 2);
    const distance = Math.sqrt(dx * dx + dy * dy);
    this.closeButtonHovered = distance <= closeButtonSize / 2;

    // Check track list hover
    const listStartY = playerY + 80;
    const trackHeight = 50;
    const listHeight = playerHeight - 240; // Leave room for controls

    this.hoveredTrack = null;
    let currentY = listStartY - this.scrollOffset;

    for (let i = 0; i < this.tracks.length; i++) {
      const track = this.tracks[i];
      const trackX = playerX + 20;
      const trackY = currentY;
      const trackW = playerWidth - 40;
      const trackH = trackHeight - 5;

      // Check if track is in visible area
      if (trackY + trackH >= listStartY && trackY <= listStartY + listHeight) {
        if (x >= trackX && x <= trackX + trackW &&
            y >= trackY && y <= trackY + trackH &&
            y >= listStartY && y <= listStartY + listHeight) {
          this.hoveredTrack = track.id;
          break;
        }
      }

      currentY += trackHeight;
    }

    // Check button hovers
    const controlsY = playerY + playerHeight - 100;
    const buttonSize = 60;
    const buttonSpacing = 20;
    const totalWidth = (buttonSize * 2) + buttonSpacing;
    let buttonX = (canvas.width - totalWidth) / 2;

    this.hoveredButton = null;

    // Play/Pause button
    if (x >= buttonX && x <= buttonX + buttonSize &&
        y >= controlsY && y <= controlsY + buttonSize) {
      this.hoveredButton = 'play';
    }

    buttonX += buttonSize + buttonSpacing;

    // Stop button
    if (x >= buttonX && x <= buttonX + buttonSize &&
        y >= controlsY && y <= controlsY + buttonSize) {
      this.hoveredButton = 'stop';
    }
  }

  render(ctx) {
    if (!this.isOpen) return;

    const canvas = ctx.canvas;

    // Ease function for smooth animations
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);
    const progress = easeOut(this.openProgress);

    // Dark overlay with fade-in
    ctx.fillStyle = `rgba(0, 0, 0, ${0.85 * progress})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Player container with scale animation
    const playerWidth = Math.min(700, canvas.width - 100);
    const playerHeight = Math.min(600, canvas.height - 100);
    const playerX = (canvas.width - playerWidth) / 2;
    const playerY = (canvas.height - playerHeight) / 2;

    ctx.save();

    // Scale from center
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    ctx.translate(centerX, centerY);
    ctx.scale(0.8 + 0.2 * progress, 0.8 + 0.2 * progress);
    ctx.translate(-centerX, -centerY);

    // Player background with gradient
    const gradient = ctx.createLinearGradient(playerX, playerY, playerX, playerY + playerHeight);
    gradient.addColorStop(0, '#2a2a3a');
    gradient.addColorStop(1, '#1a1a2a');
    ctx.fillStyle = gradient;
    ctx.fillRect(playerX, playerY, playerWidth, playerHeight);

    // Fancy border with glow
    ctx.shadowColor = '#4a9eff';
    ctx.shadowBlur = 15;
    ctx.strokeStyle = '#4a9eff';
    ctx.lineWidth = 4;
    ctx.strokeRect(playerX, playerY, playerWidth, playerHeight);
    ctx.shadowBlur = 0;

    // Title bar background
    ctx.fillStyle = 'rgba(74, 158, 255, 0.2)';
    ctx.fillRect(playerX, playerY, playerWidth, 70);

    // Title with icon
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 32px Arial";
    ctx.textAlign = "center";
    ctx.fillText("🎵 Music Player 🎵", canvas.width / 2, playerY + 45);

    // Close button (circular with hover effect)
    const closeButtonX = playerX + playerWidth - 50;
    const closeButtonY = playerY + 10;
    const closeButtonSize = 40;

    ctx.beginPath();
    ctx.arc(closeButtonX + closeButtonSize / 2, closeButtonY + closeButtonSize / 2,
            closeButtonSize / 2, 0, Math.PI * 2);

    if (this.closeButtonHovered) {
      ctx.fillStyle = "#ff4444";
      ctx.shadowColor = "#ff4444";
      ctx.shadowBlur = 10;
    } else {
      ctx.fillStyle = "#ff6b6b";
    }
    ctx.fill();
    ctx.shadowBlur = 0;

    // X symbol
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    const xSize = 12;
    const xCenterX = closeButtonX + closeButtonSize / 2;
    const xCenterY = closeButtonY + closeButtonSize / 2;
    ctx.beginPath();
    ctx.moveTo(xCenterX - xSize, xCenterY - xSize);
    ctx.lineTo(xCenterX + xSize, xCenterY + xSize);
    ctx.moveTo(xCenterX + xSize, xCenterY - xSize);
    ctx.lineTo(xCenterX - xSize, xCenterY + xSize);
    ctx.stroke();

    // Track list area with clipping
    const listStartY = playerY + 80;
    const trackHeight = 50;
    const listHeight = playerHeight - 240;

    // Scrollbar if needed
    const totalTracksHeight = this.tracks.length * trackHeight;
    this.maxScroll = Math.max(0, totalTracksHeight - listHeight);

    // Draw tracks with clipping
    ctx.save();
    ctx.beginPath();
    ctx.rect(playerX + 10, listStartY, playerWidth - 20, listHeight);
    ctx.clip();

    let currentY = listStartY - this.scrollOffset;

    for (let i = 0; i < this.tracks.length; i++) {
      const track = this.tracks[i];
      const isUnlocked = this.isTrackUnlocked(track.id);
      const isSelected = this.selectedTrack === track.id;
      const isHovered = this.hoveredTrack === track.id;

      const trackX = playerX + 20;
      const trackY = currentY;
      const trackW = playerWidth - 40;
      const trackH = trackHeight - 5;

      // Only render if visible
      if (trackY + trackH >= listStartY && trackY <= listStartY + listHeight) {
        // Track background with gradient
        if (isSelected) {
          const trackGradient = ctx.createLinearGradient(trackX, trackY, trackX, trackY + trackH);
          trackGradient.addColorStop(0, '#4a9eff');
          trackGradient.addColorStop(1, '#2d7dd2');
          ctx.fillStyle = trackGradient;
        } else if (isHovered && isUnlocked) {
          ctx.fillStyle = "#4a4a5a";
        } else if (isUnlocked) {
          ctx.fillStyle = "#3a3a4a";
        } else {
          ctx.fillStyle = "#2a2a3a";
        }

        // Rounded corners
        const radius = 8;
        ctx.beginPath();
        ctx.moveTo(trackX + radius, trackY);
        ctx.lineTo(trackX + trackW - radius, trackY);
        ctx.quadraticCurveTo(trackX + trackW, trackY, trackX + trackW, trackY + radius);
        ctx.lineTo(trackX + trackW, trackY + trackH - radius);
        ctx.quadraticCurveTo(trackX + trackW, trackY + trackH, trackX + trackW - radius, trackY + trackH);
        ctx.lineTo(trackX + radius, trackY + trackH);
        ctx.quadraticCurveTo(trackX, trackY + trackH, trackX, trackY + trackH - radius);
        ctx.lineTo(trackX, trackY + radius);
        ctx.quadraticCurveTo(trackX, trackY, trackX + radius, trackY);
        ctx.closePath();
        ctx.fill();

        // Track border with glow on hover
        if (isHovered && isUnlocked) {
          ctx.shadowColor = '#4a9eff';
          ctx.shadowBlur = 8;
        }
        ctx.strokeStyle = isSelected ? "#6ab7ff" : (isUnlocked ? "#5a5a6a" : "#3a3a4a");
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Icon
        ctx.font = "24px Arial";
        ctx.textAlign = "left";
        if (isUnlocked) {
          ctx.fillText(track.icon, trackX + 15, trackY + 32);
        } else {
          ctx.fillText("🔒", trackX + 15, trackY + 32);
        }

        // Track text
        ctx.font = isSelected ? "bold 18px Arial" : "18px Arial";
        ctx.fillStyle = isUnlocked ? "#ffffff" : "#666666";
        const displayName = isUnlocked ? track.name : "???";
        ctx.fillText(displayName, trackX + 50, trackY + 30);

        // Now playing indicator (animated)
        if (isSelected && this.isPlaying) {
          const pulseTime = Date.now() % 1000 / 1000;
          const pulse = 0.5 + Math.sin(pulseTime * Math.PI * 2) * 0.5;

          ctx.fillStyle = `rgba(74, 158, 255, ${0.5 + pulse * 0.5})`;
          for (let b = 0; b < 3; b++) {
            const barHeight = 8 + Math.sin(pulseTime * Math.PI * 2 + b * 0.5) * 6;
            ctx.fillRect(trackX + trackW - 50 + b * 8, trackY + trackH / 2 + 6 - barHeight, 5, barHeight);
          }
        }
      }

      currentY += trackHeight;
    }

    ctx.restore();

    // Scrollbar
    if (this.maxScroll > 0) {
      const scrollbarHeight = (listHeight / totalTracksHeight) * listHeight;
      const scrollbarY = listStartY + (this.scrollOffset / this.maxScroll) * (listHeight - scrollbarHeight);

      ctx.fillStyle = "rgba(74, 158, 255, 0.5)";
      ctx.fillRect(playerX + playerWidth - 15, scrollbarY, 5, scrollbarHeight);
    }

    // Playback controls area with background
    const controlsAreaY = playerY + playerHeight - 150;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(playerX, controlsAreaY, playerWidth, 150);

    // Now playing / Selected text
    if (this.selectedTrack) {
      const track = this.tracks.find(t => t.id === this.selectedTrack);
      if (this.isPlaying) {
        ctx.fillStyle = "#4a9eff";
        ctx.font = "bold 20px Arial";
        ctx.textAlign = "center";
        ctx.fillText(`${track.icon} Now Playing: ${track.name}`, canvas.width / 2, controlsAreaY + 35);
      } else {
        ctx.fillStyle = "#888888";
        ctx.font = "18px Arial";
        ctx.textAlign = "center";
        ctx.fillText(`${track.icon} Selected: ${track.name}`, canvas.width / 2, controlsAreaY + 35);
      }
    } else {
      ctx.fillStyle = "#666666";
      ctx.font = "italic 16px Arial";
      ctx.textAlign = "center";
      ctx.fillText("Select a track to play", canvas.width / 2, controlsAreaY + 35);
    }

    // Playback control buttons
    const controlsY = playerY + playerHeight - 100;
    const buttonSize = 60;
    const buttonSpacing = 20;
    const totalWidth = (buttonSize * 2) + buttonSpacing;
    let buttonX = (canvas.width - totalWidth) / 2;

    // Play/Pause button
    const canPlay = this.selectedTrack && this.isTrackUnlocked(this.selectedTrack);
    const playHovered = this.hoveredButton === 'play';

    if (canPlay) {
      if (playHovered) {
        ctx.shadowColor = '#4a9eff';
        ctx.shadowBlur = 15;
      }
      ctx.fillStyle = this.isPlaying ? "#5a5a6a" : "#4a9eff";
    } else {
      ctx.fillStyle = "#3a3a4a";
    }

    // Rounded button
    const playRadius = 10;
    ctx.beginPath();
    ctx.moveTo(buttonX + playRadius, controlsY);
    ctx.lineTo(buttonX + buttonSize - playRadius, controlsY);
    ctx.quadraticCurveTo(buttonX + buttonSize, controlsY, buttonX + buttonSize, controlsY + playRadius);
    ctx.lineTo(buttonX + buttonSize, controlsY + buttonSize - playRadius);
    ctx.quadraticCurveTo(buttonX + buttonSize, controlsY + buttonSize, buttonX + buttonSize - playRadius, controlsY + buttonSize);
    ctx.lineTo(buttonX + playRadius, controlsY + buttonSize);
    ctx.quadraticCurveTo(buttonX, controlsY + buttonSize, buttonX, controlsY + buttonSize - playRadius);
    ctx.lineTo(buttonX, controlsY + playRadius);
    ctx.quadraticCurveTo(buttonX, controlsY, buttonX + playRadius, controlsY);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = canPlay ? "#ffffff" : "#5a5a6a";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Play/Pause icon
    ctx.fillStyle = canPlay ? "#ffffff" : "#5a5a6a";
    if (!this.isPlaying) {
      // Play triangle
      ctx.beginPath();
      ctx.moveTo(buttonX + 20, controlsY + 15);
      ctx.lineTo(buttonX + 20, controlsY + 45);
      ctx.lineTo(buttonX + 45, controlsY + 30);
      ctx.closePath();
      ctx.fill();
    } else {
      // Pause bars
      ctx.fillRect(buttonX + 18, controlsY + 15, 10, 30);
      ctx.fillRect(buttonX + 32, controlsY + 15, 10, 30);
    }

    buttonX += buttonSize + buttonSpacing;

    // Stop button
    const stopHovered = this.hoveredButton === 'stop';

    if (canPlay) {
      if (stopHovered) {
        ctx.shadowColor = '#ff6b6b';
        ctx.shadowBlur = 15;
      }
      ctx.fillStyle = "#ff6b6b";
    } else {
      ctx.fillStyle = "#3a3a4a";
    }

    ctx.beginPath();
    ctx.moveTo(buttonX + playRadius, controlsY);
    ctx.lineTo(buttonX + buttonSize - playRadius, controlsY);
    ctx.quadraticCurveTo(buttonX + buttonSize, controlsY, buttonX + buttonSize, controlsY + playRadius);
    ctx.lineTo(buttonX + buttonSize, controlsY + buttonSize - playRadius);
    ctx.quadraticCurveTo(buttonX + buttonSize, controlsY + buttonSize, buttonX + buttonSize - playRadius, controlsY + buttonSize);
    ctx.lineTo(buttonX + playRadius, controlsY + buttonSize);
    ctx.quadraticCurveTo(buttonX, controlsY + buttonSize, buttonX, controlsY + buttonSize - playRadius);
    ctx.lineTo(buttonX, controlsY + playRadius);
    ctx.quadraticCurveTo(buttonX, controlsY, buttonX + playRadius, controlsY);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = canPlay ? "#ffffff" : "#5a5a6a";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Stop square
    ctx.fillStyle = canPlay ? "#ffffff" : "#5a5a6a";
    ctx.fillRect(buttonX + 18, controlsY + 18, 24, 24);

    // Progress text with unlock count
    const unlockedCount = this.tracks.filter(t => this.isTrackUnlocked(t.id)).length;
    const percentUnlocked = Math.round((unlockedCount / this.tracks.length) * 100);

    ctx.fillStyle = "#aaaaaa";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      `Collection: ${unlockedCount}/${this.tracks.length} (${percentUnlocked}%)`,
      canvas.width / 2,
      playerY + playerHeight - 20
    );

    ctx.restore();
  }

  handleClick(x, y, canvas) {
    if (!this.isOpen) return false;

    const playerWidth = Math.min(700, canvas.width - 100);
    const playerHeight = Math.min(600, canvas.height - 100);
    const playerX = (canvas.width - playerWidth) / 2;
    const playerY = (canvas.height - playerHeight) / 2;

    // Check close button (circular hitbox)
    const closeButtonX = playerX + playerWidth - 50;
    const closeButtonY = playerY + 10;
    const closeButtonSize = 40;

    const dx = x - (closeButtonX + closeButtonSize / 2);
    const dy = y - (closeButtonY + closeButtonSize / 2);
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= closeButtonSize / 2) {
      this.close();
      this.game.audioManager.playSound("button-click", false, 0.5);
      return true;
    }

    // Check track list
    const listStartY = playerY + 80;
    const trackHeight = 50;
    const listHeight = playerHeight - 240;

    let currentY = listStartY - this.scrollOffset;

    for (let i = 0; i < this.tracks.length; i++) {
      const track = this.tracks[i];
      const trackX = playerX + 20;
      const trackY = currentY;
      const trackW = playerWidth - 40;
      const trackH = trackHeight - 5;

      // Check if click is in visible area and on track
      if (x >= trackX && x <= trackX + trackW &&
          y >= trackY && y <= trackY + trackH &&
          y >= listStartY && y <= listStartY + listHeight) {
        if (this.isTrackUnlocked(track.id)) {
          this.selectTrack(track.id);
          this.game.audioManager.playSound("button-click", false, 0.5);
        } else {
          // Play error sound for locked tracks
          this.game.audioManager.playSound("sock-mismatch", false, 0.3);
        }
        return true;
      }

      currentY += trackHeight;
    }

    // Check playback controls
    const controlsY = playerY + playerHeight - 100;
    const buttonSize = 60;
    const buttonSpacing = 20;
    const totalWidth = (buttonSize * 2) + buttonSpacing;
    let buttonX = (canvas.width - totalWidth) / 2;

    // Play/Pause button
    if (x >= buttonX && x <= buttonX + buttonSize &&
        y >= controlsY && y <= controlsY + buttonSize) {
      if (this.selectedTrack && this.isTrackUnlocked(this.selectedTrack)) {
        if (this.isPlaying) {
          this.pauseCurrentTrack();
        } else {
          this.playCurrentTrack();
        }
        this.game.audioManager.playSound("button-click", false, 0.5);
      }
      return true;
    }

    buttonX += buttonSize + buttonSpacing;

    // Stop button
    if (x >= buttonX && x <= buttonX + buttonSize &&
        y >= controlsY && y <= controlsY + buttonSize) {
      if (this.selectedTrack && this.isTrackUnlocked(this.selectedTrack)) {
        this.stopCurrentTrack();
        this.game.audioManager.playSound("button-click", false, 0.5);
      }
      return true;
    }

    return true; // Consume click even if outside specific elements
  }

  handleScroll(deltaY) {
    if (!this.isOpen || this.maxScroll === 0) return;

    this.scrollOffset += deltaY;
    this.scrollOffset = Math.max(0, Math.min(this.maxScroll, this.scrollOffset));
  }
}
