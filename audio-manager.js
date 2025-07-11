class AudioManager {
  constructor() {
    this.sounds = new Map();
    this.currentMusic = null;
    this.musicVolume = 0.7;
    this.sfxVolume = 0.8;
    this.isMuted = false;
    this.isLoading = false;
    this.loadedCount = 0;
    this.totalCount = 0;

    // Audio file definitions
    this.audioFiles = {
      // Background Music
      music: [
        "menu-music.mp3",
        "match-music.mp3",
        "throwing-music.mp3",
        "victory-music.mp3",
        "defeat-music.mp3",
      ],

      // Sound Effects
      sfx: [
        "sock-shoot.mp3",
        "sock-bounce.mp3",
        "sock-match.mp3",
        "sock-mismatch.mp3",
        "sockball-throw.mp3",
        "sockball-hit.mp3",
        "martha-hit.mp3",
        "martha-laugh.mp3",
        "martha-angry.mp3",
        "level-complete.mp3",
        "level-unlock.mp3",
        "button-click.mp3",
        "button-hover.mp3",
        "pile-click.mp3",
        "snap-to-zone.mp3",
        "screen-shake.mp3",
        "particle-burst.mp3",
        "easter-egg-match.mp3",
        "easter-egg-mismatch.mp3",
        "countdown-tick.mp3",
        "time-warning.mp3",
        "points-gained.mp3",
        "rent-collected.mp3",
        "game-over.mp3",
      ],
    };
  }

  async loadAllAudio() {
    this.isLoading = true;
    this.loadedCount = 0;

    // Calculate total files
    this.totalCount = this.audioFiles.music.length + this.audioFiles.sfx.length;

    const loadPromises = [];

    // Load music files
    for (const filename of this.audioFiles.music) {
      loadPromises.push(this.loadAudioFile(filename, "music"));
    }

    // Load SFX files
    for (const filename of this.audioFiles.sfx) {
      loadPromises.push(this.loadAudioFile(filename, "sfx"));
    }

    await Promise.all(loadPromises);
    this.isLoading = false;

    return this.sounds;
  }

  async loadAudioFile(filename, type) {
    return new Promise((resolve) => {
      const audio = new Audio();
      const key = filename.replace(".mp3", "");

      const onLoad = () => {
        audio.removeEventListener("canplaythrough", onLoad);
        audio.removeEventListener("error", onError);

        // Set default properties
        if (type === "music") {
          audio.loop = true;
          audio.volume = this.musicVolume;
        } else {
          audio.loop = false;
          audio.volume = this.sfxVolume;
        }

        this.sounds.set(key, { audio, type, filename });
        this.loadedCount++;
        resolve();
      };

      const onError = () => {
        audio.removeEventListener("canplaythrough", onLoad);
        audio.removeEventListener("error", onError);

        console.warn(`Failed to load audio: ${filename}`);
        this.loadedCount++;
        resolve();
      };

      audio.addEventListener("canplaythrough", onLoad);
      audio.addEventListener("error", onError);
      audio.src = `audio/${filename}`;
    });
  }

  playMusic(key, fadeIn = true) {
    if (this.isMuted) return;

    // Stop current music
    if (this.currentMusic) {
      this.stopMusic();
    }

    const soundData = this.sounds.get(key);
    if (!soundData || soundData.type !== "music") {
      console.warn(`Music not found: ${key}`);
      return;
    }

    const audio = soundData.audio;
    audio.currentTime = 0;

    if (fadeIn) {
      audio.volume = 0;
      audio.play().catch((e) => console.warn("Audio play failed:", e));
      this.fadeIn(audio, this.musicVolume);
    } else {
      audio.volume = this.musicVolume;
      audio.play().catch((e) => console.warn("Audio play failed:", e));
    }

    this.currentMusic = audio;
  }

  stopMusic(fadeOut = true) {
    if (!this.currentMusic) return;

    if (fadeOut) {
      this.fadeOut(this.currentMusic, () => {
        this.currentMusic.pause();
        this.currentMusic = null;
      });
    } else {
      this.currentMusic.pause();
      this.currentMusic = null;
    }
  }

  playSound(key, volume = null) {
    if (this.isMuted) return;

    const soundData = this.sounds.get(key);
    if (!soundData || soundData.type !== "sfx") {
      console.warn(`Sound effect not found: ${key}`);
      return;
    }

    // Clone the audio to allow overlapping plays
    const audio = soundData.audio.cloneNode();
    audio.volume = volume !== null ? volume : this.sfxVolume;
    audio.play().catch((e) => console.warn("Audio play failed:", e));

    return audio;
  }

  fadeIn(audio, targetVolume, duration = 1000) {
    const startVolume = 0;
    const volumeStep = targetVolume / (duration / 50);

    const fadeInterval = setInterval(() => {
      if (audio.volume < targetVolume) {
        audio.volume = Math.min(audio.volume + volumeStep, targetVolume);
      } else {
        clearInterval(fadeInterval);
      }
    }, 50);
  }

  fadeOut(audio, callback, duration = 1000) {
    const startVolume = audio.volume;
    const volumeStep = startVolume / (duration / 50);

    const fadeInterval = setInterval(() => {
      if (audio.volume > 0) {
        audio.volume = Math.max(audio.volume - volumeStep, 0);
      } else {
        clearInterval(fadeInterval);
        if (callback) callback();
      }
    }, 50);
  }

  setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.currentMusic) {
      this.currentMusic.volume = this.musicVolume;
    }
  }

  setSFXVolume(volume) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
  }

  toggleMute() {
    this.isMuted = !this.isMuted;

    if (this.isMuted) {
      if (this.currentMusic) {
        this.currentMusic.volume = 0;
      }
    } else {
      if (this.currentMusic) {
        this.currentMusic.volume = this.musicVolume;
      }
    }

    return this.isMuted;
  }

  getLoadingProgress() {
    if (this.totalCount === 0) return 1;
    return this.loadedCount / this.totalCount;
  }

  getAudioFileList() {
    return {
      music: [...this.audioFiles.music],
      sfx: [...this.audioFiles.sfx],
      total: this.audioFiles.music.length + this.audioFiles.sfx.length,
    };
  }
}
