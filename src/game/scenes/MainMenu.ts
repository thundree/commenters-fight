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
        "Fetching data from YouTube API... Click anywhere to start!",
        {
          fontFamily: "Arial",
          fontSize: 16,
          color: "#cccccc",
          align: "center",
        }
      )
      .setOrigin(0.5);

    // Fetch YouTube comments
    this.fetchCommentsData();

    this.input.once("pointerdown", () => {
      console.log("Starting game...");
      if (this.commentsData) {
        console.log(
          "Comments data loaded, starting game with:",
          this.commentsData
        );
        // Pass the comments data to the Game scene
        this.scene.start("Game", { commentsData: this.commentsData });
      } else {
        console.log("Comments data not loaded, game will use fallback names");
        // Start game without data (will use fallback names)
        this.scene.start("Game");
      }
    });

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
          `Found ${this.commentsData.items.length} comments. Click to start game.`
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
        this.statusText.setText("Using default names. Click to start game!");
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
}
