class LoadingScreen {
  constructor() {
    this.loadingComplete = false;
    this.loadingStartTime = 0;
    this.assetsToLoad = 0;
    this.assetsLoaded = 0;
    this.progressInterval = null;
    this.imageCache = new Map();
    this.minimumLoadingTime = 1000;

    // Audio loading state
    this.audioManager = new AudioManager();
    this.audioLoaded = false;
    this.imagesLoaded = false;
  }

  init() {
    this.loadingStartTime = Date.now();
    this.showLoadingScreen();
    this.loadAllAssets();
    this.startProgressAnimation();
  }

  showLoadingScreen() {
    if (!document.querySelector(".loading-screen")) {
      const loadingHTML = `
        <div class="loading-screen">
          <div class="loading-content">
            <div class="loading-logo">
              <img src="images/company-logo.png" alt="Company Logo" class="loading-logo-image" />
              <div class="loading-text">Loading Sock Game...</div>
            </div>
            <div class="loading-bar-container">
              <div class="loading-bar" id="loadingBar"></div>
            </div>
            <div class="loading-percentage" id="loadingPercentage">0%</div>
            <div class="loading-status" id="loadingStatus">Loading images...</div>
          </div>
        </div>
      `;

      const gameContainer = document.getElementById("gameContainer");
      if (gameContainer) {
        gameContainer.insertAdjacentHTML("beforeend", loadingHTML);
      } else {
        document.body.insertAdjacentHTML("beforeend", loadingHTML);
      }
    }
  }

  startProgressAnimation() {
    this.progressInterval = setInterval(() => {
      this.updateLoadingProgress();
      if (this.loadingComplete) {
        this.cleanup();
      }
    }, 50);
  }

  cleanup() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  updateLoadingProgress() {
    if (!this.loadingComplete) {
      const elapsed = Date.now() - this.loadingStartTime;

      // Calculate progress from both images and audio
      const imageProgress =
        this.assetsToLoad > 0 ? this.assetsLoaded / this.assetsToLoad : 0;
      const audioProgress = this.audioManager.getLoadingProgress();
      const overallProgress = (imageProgress + audioProgress) / 2;

      const timeProgress = Math.min(elapsed / this.minimumLoadingTime, 1);
      const finalProgress = Math.min(overallProgress, timeProgress);
      const percentage = Math.floor(finalProgress * 100);

      const loadingBar = document.getElementById("loadingBar");
      const loadingPercentage = document.getElementById("loadingPercentage");
      const loadingStatus = document.getElementById("loadingStatus");

      if (loadingBar) loadingBar.style.width = percentage + "%";
      if (loadingPercentage) loadingPercentage.textContent = percentage + "%";

      // Update status text
      if (loadingStatus) {
        if (!this.imagesLoaded) {
          loadingStatus.textContent = "Loading images...";
        } else if (!this.audioLoaded) {
          loadingStatus.textContent = "Loading audio...";
        } else {
          loadingStatus.textContent = "Ready!";
        }
      }

      if (
        this.imagesLoaded &&
        this.audioLoaded &&
        elapsed >= this.minimumLoadingTime
      ) {
        this.loadingComplete = true;
        this.transitionToGame();
      }
    }
  }

  transitionToGame() {
    if (window.gameInitCallback) {
      window.gameInitCallback();
    }

    setTimeout(() => {
      const loadingScreen = document.querySelector(".loading-screen");
      if (loadingScreen) {
        loadingScreen.style.pointerEvents = "none";
        loadingScreen.style.opacity = "0";
        loadingScreen.style.transition = "opacity 0.5s ease-out";

        setTimeout(() => {
          if (loadingScreen.parentNode) {
            loadingScreen.parentNode.removeChild(loadingScreen);
          }
        }, 500);
      }
    }, 200);
  }

  async loadAllAssets() {
    // Load images and audio in parallel
    const imagePromise = this.loadImages();
    const audioPromise = this.loadAudio();

    await Promise.all([imagePromise, audioPromise]);
  }

  async loadImages() {
    const imagesToLoad = [
      ...GameConfig.IMAGES.SOCKS,
      ...GameConfig.IMAGES.SOCK_BALLS,
      ...GameConfig.IMAGES.SOCK_PILES,
      ...GameConfig.IMAGES.CHARACTERS,
      ...GameConfig.IMAGES.UI,
      "company-logo.png",
    ];

    this.assetsToLoad = imagesToLoad.length;
    await this.loadImageFiles(imagesToLoad);
    this.imagesLoaded = true;
  }

  async loadAudio() {
    try {
      await this.audioManager.loadAllAudio();
      this.audioLoaded = true;
    } catch (error) {
      console.warn("Audio loading failed:", error);
      this.audioLoaded = true; // Continue anyway
    }
  }

  async loadImageFiles(imagesToLoad) {
    const imagePromises = imagesToLoad.map((imageName) => {
      return new Promise((resolve) => {
        if (!this.imageCache.has(imageName)) {
          const img = new Image();

          const onLoad = () => {
            this.assetsLoaded++;
            img.removeEventListener("load", onLoad);
            img.removeEventListener("error", onError);
            this.imageCache.set(imageName, img);
            resolve();
          };

          const onError = () => {
            this.assetsLoaded++;
            img.removeEventListener("load", onLoad);
            img.removeEventListener("error", onError);
            resolve();
          };

          img.addEventListener("load", onLoad);
          img.addEventListener("error", onError);
          img.src = `images/${imageName}`;
        } else {
          this.assetsLoaded++;
          resolve();
        }
      });
    });

    return Promise.all(imagePromises);
  }

  getImage(imageName) {
    return this.imageCache.get(imageName);
  }

  getImageCache() {
    return this.imageCache;
  }

  getAudioManager() {
    return this.audioManager;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.loadingScreenManager = new LoadingScreen();
  window.loadingScreenManager.init();
});
