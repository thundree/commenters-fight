import { Scene, GameObjects } from "phaser";
import { ServiceManager, YouTubeCommentsResponse } from "../../services";

export class MainMenu extends Scene {
  title: GameObjects.Text;
  gradientGraphics: GameObjects.Graphics;
  loadingText: GameObjects.Text;
  statusText: GameObjects.Text;
  commentsData: YouTubeCommentsResponse | null = null;

  constructor() {
    super("MainMenu");
  }

  create() {
    // Create a gradient background from pastel green to dark green
    this.createGradientBackground();

    this.title = this.add
      .text(
        this.cameras.main.width / 2,
        this.cameras.main.height / 2 - 100,
        "Main Menu",
        {
          fontFamily: "Arial Black",
          fontSize: 38,
          color: "#ffffff",
          stroke: "#000000",
          strokeThickness: 8,
          align: "center",
        }
      )
      .setOrigin(0.5);

    // Add loading text
    this.loadingText = this.add
      .text(
        this.cameras.main.width / 2,
        this.cameras.main.height / 2,
        "Loading comments...",
        {
          fontFamily: "Arial",
          fontSize: 24,
          color: "#ffffff",
          stroke: "#000000",
          strokeThickness: 4,
          align: "center",
        }
      )
      .setOrigin(0.5);

    // Add status text
    this.statusText = this.add
      .text(
        this.cameras.main.width / 2,
        this.cameras.main.height / 2 + 50,
        "Fetching data from YouTube API...",
        {
          fontFamily: "Arial",
          fontSize: 16,
          color: "#cccccc",
          align: "center",
        }
      )
      .setOrigin(0.5);

    // Add navigation menu
    this.createNavigationMenu();

    // Fetch YouTube comments
    this.fetchCommentsData();

    // Listen for resize events to update gradient
    this.scale.on("resize", this.updateGradient, this);
  }

  shutdown() {
    // Clean up when scene is being shut down
    console.log("MainMenu scene shutting down");
    // Remove resize listener
    this.scale.off("resize", this.updateGradient, this);
  }

  async fetchCommentsData() {
    try {
      const serviceManager = ServiceManager.getInstance();
      const youtubeService = serviceManager.getYouTubeService();

      // Update status (check if scene is still active)
      if (this.scene.isActive() && this.statusText) {
        this.statusText.setText(
          `Mock mode: ${youtubeService.isMock() ? "ON" : "OFF"}`
        );
      }

      // Fetch comments for a sample video
      const videoId = "dQw4w9WgXcQ"; // Sample video ID
      this.commentsData = await youtubeService.getCommentThreads(videoId, 10);

      // Update UI when data is loaded (check if scene is still active)
      if (this.scene.isActive() && this.loadingText && this.statusText) {
        this.loadingText.setText("Comments loaded!");
        this.statusText.setText(
          `Found ${this.commentsData.items.length} comments. Use the menu below to start.`
        );
      }

      // Log the data for debugging
      console.log("YouTube Comments Data:", this.commentsData);

      // Show first comment as preview (check if scene is still active)
      if (this.scene.isActive() && this.commentsData.items.length > 0) {
        const firstComment = this.commentsData.items[0];
        const previewText =
          firstComment.snippet.topLevelComment.snippet.textDisplay;
        const truncatedText =
          previewText.length > 60
            ? previewText.substring(0, 60) + "..."
            : previewText;

        this.add
          .text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 100,
            `Preview: "${truncatedText}"`,
            {
              fontFamily: "Arial",
              fontSize: 14,
              color: "#aaffaa",
              align: "center",
              wordWrap: { width: this.cameras.main.width - 40 },
            }
          )
          .setOrigin(0.5);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
      // Update UI only if scene is still active
      if (this.scene.isActive() && this.loadingText && this.statusText) {
        this.loadingText.setText("Failed to load comments");
        this.statusText.setText(
          "Using default names. Use the menu below to start!"
        );
      }
    }
  }

  createGradientBackground() {
    this.gradientGraphics = this.add.graphics();
    this.updateGradient();
  }

  updateGradient() {
    if (!this.gradientGraphics) return;

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Clear previous gradient
    this.gradientGraphics.clear();

    // Create a gradient from pastel green (#a8e6cf) to dark green (#2d5a3d)
    // Using fillGradientStyle for better performance and persistence
    this.gradientGraphics.fillGradientStyle(
      0xa8e6cf, // top-left: pastel green
      0xa8e6cf, // top-right: pastel green
      0x2d5a3d, // bottom-left: dark green
      0x2d5a3d, // bottom-right: dark green
      1 // alpha
    );

    // Fill the entire screen
    this.gradientGraphics.fillRect(0, 0, width, height);
  }

  createNavigationMenu() {
    const menuY = this.cameras.main.height - 150;
    const buttonSpacing = 200;

    // Create menu background
    this.add.rectangle(
      this.cameras.main.width / 2,
      menuY,
      this.cameras.main.width - 40,
      100,
      0x000000,
      0.7
    );

    // Add menu title
    this.add
      .text(this.cameras.main.width / 2, menuY - 35, "🎮 Game Options", {
        fontFamily: "Arial",
        fontSize: 16,
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 2,
      })
      .setOrigin(0.5);

    // Button 1: Start Game
    const startButton = this.add
      .text(
        this.cameras.main.width / 2 - buttonSpacing,
        menuY,
        "▶️ Start Game",
        {
          fontFamily: "Arial",
          fontSize: 14,
          color: "#ffffff",
          backgroundColor: "#2d5a3d",
          padding: { x: 12, y: 8 },
        }
      )
      .setOrigin(0.5)
      .setInteractive();

    startButton.on("pointerdown", () => {
      console.log("Starting game...");
      if (this.commentsData) {
        console.log(
          "Comments data loaded, starting game with:",
          this.commentsData
        );
        this.scene.start("Game", { commentsData: this.commentsData });
      } else {
        console.log("Comments data not loaded, game will use fallback names");
        this.scene.start("Game");
      }
    });

    startButton.on("pointerover", () => {
      startButton.setBackgroundColor("#4a8c5a");
    });

    startButton.on("pointerout", () => {
      startButton.setBackgroundColor("#2d5a3d");
    });

    // Button 2: Platform Configurator
    const configButton = this.add
      .text(this.cameras.main.width / 2, menuY, "🛠️ Platform Config", {
        fontFamily: "Arial",
        fontSize: 14,
        color: "#ffffff",
        backgroundColor: "#3d4b5a",
        padding: { x: 12, y: 8 },
      })
      .setOrigin(0.5)
      .setInteractive();

    configButton.on("pointerdown", () => {
      this.scene.start("PlatformConfigurator");
    });

    configButton.on("pointerover", () => {
      configButton.setBackgroundColor("#5a6b7d");
    });

    configButton.on("pointerout", () => {
      configButton.setBackgroundColor("#3d4b5a");
    });

    // Button 3: Platform Test
    const testButton = this.add
      .text(
        this.cameras.main.width / 2 + buttonSpacing,
        menuY,
        "🧪 Platform Test",
        {
          fontFamily: "Arial",
          fontSize: 14,
          color: "#ffffff",
          backgroundColor: "#5a3d2d",
          padding: { x: 12, y: 8 },
        }
      )
      .setOrigin(0.5)
      .setInteractive();

    testButton.on("pointerdown", () => {
      this.scene.start("PlatformTest");
    });

    testButton.on("pointerover", () => {
      testButton.setBackgroundColor("#8c5a4a");
    });

    testButton.on("pointerout", () => {
      testButton.setBackgroundColor("#5a3d2d");
    });

    // Add keyboard shortcuts info
    this.add
      .text(
        this.cameras.main.width / 2,
        menuY + 35,
        "Shortcuts: SPACE = Start Game | C = Platform Config | T = Platform Test",
        {
          fontFamily: "Arial",
          fontSize: 10,
          color: "#cccccc",
        }
      )
      .setOrigin(0.5);

    // Add keyboard controls
    if (this.input.keyboard) {
      this.input.keyboard.on("keydown-SPACE", () => {
        startButton.emit("pointerdown");
      });

      this.input.keyboard.on("keydown-C", () => {
        configButton.emit("pointerdown");
      });

      this.input.keyboard.on("keydown-T", () => {
        testButton.emit("pointerdown");
      });
    }
  }
}
