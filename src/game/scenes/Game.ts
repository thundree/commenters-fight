import { Scene } from "phaser";
import { ServiceManager } from "../../services/ServiceManager";
import { PlatformManager } from "../Platform";
import {
  YouTubeCommentsResponse,
  CommentThread,
} from "../../services/YouTubeService";

export class Game extends Scene {
  camera: Phaser.Cameras.Scene2D.Camera;
  controls: Phaser.Cameras.Controls.SmoothedKeyControl;
  boxes: Phaser.Physics.Arcade.Group;
  private platformManager: PlatformManager;
  private youtubeNames: string[] = [];
  private readonly serviceManager: ServiceManager;
  private scoreText: Phaser.GameObjects.Text;
  private readonly scores: Map<string, number> = new Map();
  private gameStartTime: number = 0;
  private readonly gracePeriodMs: number = 3000; // 3 seconds grace period
  private gracePeriodText: Phaser.GameObjects.Text;
  private fightText: Phaser.GameObjects.Text;
  private speedBoostLogged: boolean = false; // Track if speed boost message has been logged
  private gracePeriodLogged: boolean = false; // Track if grace period message has been logged
  private fightMessageLogged: boolean = false; // Track if fight message has been logged
  private winnerText: Phaser.GameObjects.Text; // Winner announcement text
  private winnerAnnounced: boolean = false; // Track if winner has been announced
  private winnerAnnounceTime: number = 0; // Time when winner was announced
  private progressiveSpeedMultiplier: number = 1.0; // Progressive speed multiplier
  private lastProgressiveBoostTime: number = 0; // Last time progressive boost was applied
  private progressiveBoostCount: number = 0; // Number of progressive boosts applied (max 8)

  /**
   * Properly manages the player names list to ensure:
   * 1. ElodineCodes always appears exactly once
   * 2. No duplicate names
   * 3. Proper fallback when no YouTube names are available
   */
  private getPlayerNames(): string[] {
    // Start with an empty set to ensure no duplicates
    const nameSet = new Set<string>();

    // Always add ElodineCodes first
    nameSet.add("ElodineCodes");

    // Add YouTube names if available (Set will automatically handle duplicates)
    if (this.youtubeNames && this.youtubeNames.length > 0) {
      this.youtubeNames.forEach((name) => {
        // Normalize and clean the name
        const cleanName = name.trim();
        if (cleanName) {
          nameSet.add(cleanName);
        }
      });
    }

    // If we only have ElodineCodes (no other YouTube names), that's fine
    // The game should work with just one player
    const finalNames = Array.from(nameSet);

    return finalNames;
  }

  constructor() {
    super("Game");
    this.serviceManager = ServiceManager.getInstance();
  }

  async create(data?: { commentsData?: YouTubeCommentsResponse }) {
    this.camera = this.cameras.main;
    this.camera.setBackgroundColor(0x2c3e50);

    // Set up physics world bounds (larger than screen for camera movement)
    this.physics.world.setBounds(0, 0, 2048, 1536);

    // Create a group for our boxes
    this.boxes = this.physics.add.group();

    // Create platform manager and add platforms
    this.platformManager = new PlatformManager(this);
    this.createGamePlatforms();

    // Extract YouTube commenter names from passed data or fetch them
    if (data?.commentsData) {
      console.log("Using passed comments data from MainMenu");
      this.extractNamesFromCommentsData(data.commentsData);
    } else {
      console.log("No comments data passed, fetching from YouTube service");
      await this.fetchYouTubeNames();
    }

    // Create multiple colored boxes
    this.createBoxes();

    // Add collisions between all boxes with Joust-style scoring
    this.physics.add.collider(this.boxes, this.boxes, (obj1, obj2) => {
      this.handlePlayerCollision(
        obj1 as Phaser.Physics.Arcade.Image,
        obj2 as Phaser.Physics.Arcade.Image
      );
    });

    // Add collisions between players and platforms
    this.physics.add.collider(
      this.boxes,
      this.platformManager.getPlatformGroup()
    );

    // Set up camera controls
    this.setupCameraControls();

    // Add instructions text
    this.add
      .text(
        16,
        16,
        [
          "🎮 Use Arrow Keys to move camera",
          "⚔️ Players fight for platform dominance!",
          "🏛️ Land on platforms to gain advantage",
        ],
        {
          fontFamily: "Arial",
          fontSize: 14,
          color: "#ffffff",
          backgroundColor: "#000000",
          padding: { x: 10, y: 10 },
        }
      )
      .setZ(10) // Ensure text is above other objects
      .setScrollFactor(0); // Keep text fixed to camera

    // Initialize scores for all players
    this.initializeScores();

    // Set game start time for grace period
    this.gameStartTime = Date.now();

    // Add score display text
    this.scoreText = this.add
      .text(16, 60, this.getScoreDisplayText(), {
        fontFamily: "Arial",
        fontSize: 12,
        color: "#00ff00",
        backgroundColor: "#000000",
        padding: { x: 8, y: 4 },
        wordWrap: { width: this.cameras.main.width - 32 }, // Wrap text if too long
      })
      .setZ(10)
      .setScrollFactor(0);

    // Add grace period indicator text
    this.gracePeriodText = this.add
      .text(this.cameras.main.width / 2, 100, "⚡ GRACE PERIOD ACTIVE ⚡", {
        fontFamily: "Arial",
        fontSize: 20,
        color: "#ffffff", // White text
        backgroundColor: "#ff0000", // Red background
        padding: { x: 12, y: 8 },
      })
      .setOrigin(0.5) // Center the text
      .setZ(20)
      .setScrollFactor(0)
      .setVisible(true);

    // Add fight message text (hidden initially)
    this.fightText = this.add
      .text(this.cameras.main.width / 2, 100, "FIGHT!", {
        fontFamily: "Arial",
        fontSize: 32,
        color: "#ff0000", // Red text
        backgroundColor: "#ffffff", // White background
        padding: { x: 16, y: 12 },
        stroke: "#000000", // Black outline
        strokeThickness: 3,
      })
      .setOrigin(0.5) // Center the text
      .setZ(21) // Above grace period text
      .setScrollFactor(0)
      .setVisible(false); // Hidden initially

    // Add winner announcement text (hidden initially)
    this.winnerText = this.add
      .text(this.cameras.main.width / 2, this.cameras.main.height / 2, "", {
        fontFamily: "Arial",
        fontSize: 48,
        color: "#ffff00", // Yellow text
        backgroundColor: "#000000", // Black background
        padding: { x: 20, y: 16 },
        stroke: "#ff0000", // Red outline
        strokeThickness: 4,
      })
      .setOrigin(0.5) // Center the text
      .setZ(30) // Above all other UI elements
      .setScrollFactor(0)
      .setVisible(false); // Hidden initially
  }

  /**
   * Fetch commenter names from YouTube service
   */
  private async fetchYouTubeNames(): Promise<void> {
    try {
      console.log("Fetching YouTube commenter names...");
      const youtubeService = this.serviceManager.getYouTubeService();
      const response: YouTubeCommentsResponse =
        await youtubeService.getCommentThreads("dQw4w9WgXcQ", 20);

      console.log("YouTube API response:", response);

      // Extract unique commenter names from top-level comments and replies
      const nameSet = new Set<string>();

      response.items.forEach((item: CommentThread) => {
        // Add top-level comment author (clean and validate)
        const authorName =
          item.snippet.topLevelComment.snippet.authorDisplayName?.trim();
        if (authorName) {
          nameSet.add(authorName);
        }

        // Add reply authors if they exist
        if (item.replies?.comments) {
          item.replies.comments.forEach((reply) => {
            const replyAuthor = reply.snippet.authorDisplayName?.trim();
            if (replyAuthor) {
              nameSet.add(replyAuthor);
            }
          });
        }
      });

      // Store the YouTube names (without forcing ElodineCodes here)
      // The getPlayerNames() method will handle ElodineCodes properly
      this.youtubeNames = Array.from(nameSet);

      console.log("Fetched YouTube names from API:", this.youtubeNames);
    } catch (error) {
      console.error("Failed to fetch YouTube names:", error);
      // Clear YouTube names on failure - getPlayerNames() will handle fallback
      this.youtubeNames = [];
      console.log("YouTube service failed, will use ElodineCodes only");
    }
  }

  /**
   * Extract commenter names from already-fetched comments data
   */
  private extractNamesFromCommentsData(
    commentsData: YouTubeCommentsResponse
  ): void {
    try {
      console.log("Extracting names from comments data:", commentsData);

      // Extract unique commenter names from top-level comments and replies
      const nameSet = new Set<string>();

      commentsData.items.forEach((item: CommentThread) => {
        // Add top-level comment author (clean and validate)
        const authorName =
          item.snippet.topLevelComment.snippet.authorDisplayName?.trim();
        if (authorName) {
          nameSet.add(authorName);
        }

        // Add reply authors if they exist
        if (item.replies?.comments) {
          item.replies.comments.forEach((reply) => {
            const replyAuthor = reply.snippet.authorDisplayName?.trim();
            if (replyAuthor) {
              nameSet.add(replyAuthor);
            }
          });
        }
      });

      // Store the YouTube names (without forcing ElodineCodes here)
      // The getPlayerNames() method will handle ElodineCodes properly
      this.youtubeNames = Array.from(nameSet);

      console.log("Extracted YouTube names from comments:", this.youtubeNames);
    } catch (error) {
      console.error("Failed to extract names from comments data:", error);
      // Clear YouTube names on failure - getPlayerNames() will handle fallback
      this.youtubeNames = [];
      console.log("Comments extraction failed, will use ElodineCodes only");
    }
  }

  createBoxes() {
    // No need to create a box texture - we'll use the ship sprite instead
    const colors = [
      0xff6b6b, 0x4ecdc4, 0x45b7d1, 0x96ceb4, 0xfeca57, 0xff9ff3, 0x54a0ff,
      0x2ed573, 0xff6348, 0x1dd1a1, 0x7f8c8d, 0xf39c12, 0x8e44ad, 0xe74c3c,
      0x3498db, 0x2ecc71,
    ];

    // Use properly managed player names (ensures ElodineCodes appears exactly once)
    const availableNames = this.getPlayerNames();

    // Create boxes based on available names (minimum 1 for ElodineCodes, maximum 12)
    const numBoxes = Math.min(availableNames.length, 12);

    console.log(
      `Creating ${numBoxes} players from ${availableNames.length} available names`
    );

    for (let i = 0; i < numBoxes; i++) {
      // Spawn boxes in the center of the initial camera view (dynamic based on screen size)
      const centerX = this.cameras.main.width / 2;
      const centerY = this.cameras.main.height / 2;
      const spawnRadius = 150; // Radius around center to spawn boxes

      const x = Phaser.Math.Between(
        centerX - spawnRadius,
        centerX + spawnRadius
      );
      const y = Phaser.Math.Between(
        centerY - spawnRadius,
        centerY + spawnRadius
      );

      // Create a physics-enabled image using the ship sprite
      const box = this.physics.add.image(x, y, "ship");

      // Make the ship larger (2x scale)
      box.setScale(2);

      // Set bounce properties for better platform interaction
      box.setBounce(0.3);
      box.setCollideWorldBounds(false); // Allow wrapping instead

      // Set random color tint
      box.setTint(Phaser.Math.RND.pick(colors));

      // Use names directly from the array (no cycling to avoid duplicates)
      const playerName = availableNames[i];

      // Special styling for ElodineCodes
      const isElodine = playerName === "ElodineCodes";
      const nameText = this.add.text(x, y - 30, playerName, {
        fontFamily: "Arial",
        fontSize: 13,
        color: "#ffffff", // White text for all players
        backgroundColor: isElodine ? "#006400" : "#000000", // Dark green for ElodineCodes, black for others
        padding: { x: 4, y: 2 },
      });
      nameText.setOrigin(0.5); // Center the text

      // Store reference to text in box data so we can move it with the box
      box.setData("nameText", nameText);
      box.setData("playerName", playerName);

      // Simple horizontal movement - pick a direction and stick to it
      const horizontalSpeed = Phaser.Math.Between(50, 100);
      const direction = Phaser.Math.RND.pick([-1, 1]); // Left or right

      box.setVelocityX(horizontalSpeed * direction);
      box.setVelocityY(0); // Start with no vertical velocity

      // Store flap timing data and direction
      box.setData("nextFlapTime", Phaser.Math.Between(1000, 3000)); // Random flap interval
      box.setData("lastFlapTime", 0);
      box.setData("horizontalSpeed", horizontalSpeed);
      box.setData("direction", direction);
      box.setData("nextDirectionChange", Phaser.Math.Between(3000, 8000)); // Change direction every 3-8 seconds
      box.setData("lastDirectionChange", 0);

      // Add to the ships group
      this.boxes.add(box);
    }
  }

  private createGamePlatforms(): void {
    // Create multiple platforms across the game world
    const worldHeight = 1536;

    // Bottom platforms (ground level) - spread out more
    this.platformManager.createPlatform(
      150,
      worldHeight - 80,
      "STONE_PLATFORM"
    );
    this.platformManager.createPlatform(
      500,
      worldHeight - 80,
      "METAL_PLATFORM"
    );
    this.platformManager.createPlatform(
      850,
      worldHeight - 80,
      "CRYSTAL_PLATFORM"
    );
    this.platformManager.createPlatform(
      1200,
      worldHeight - 80,
      "STONE_PLATFORM"
    );
    this.platformManager.createPlatform(
      1550,
      worldHeight - 80,
      "METAL_PLATFORM"
    );
    this.platformManager.createPlatform(
      1850,
      worldHeight - 80,
      "CRYSTAL_PLATFORM"
    );

    // Lower-mid platforms
    this.platformManager.createPlatform(
      75,
      worldHeight - 250,
      "CRYSTAL_PLATFORM"
    );
    this.platformManager.createPlatform(
      325,
      worldHeight - 200,
      "STONE_PLATFORM"
    );
    this.platformManager.createPlatform(
      675,
      worldHeight - 280,
      "METAL_PLATFORM"
    );
    this.platformManager.createPlatform(
      1025,
      worldHeight - 220,
      "CRYSTAL_PLATFORM"
    );
    this.platformManager.createPlatform(
      1375,
      worldHeight - 260,
      "STONE_PLATFORM"
    );
    this.platformManager.createPlatform(
      1725,
      worldHeight - 210,
      "METAL_PLATFORM"
    );

    // Mid-level platforms
    this.platformManager.createPlatform(
      200,
      worldHeight - 400,
      "METAL_PLATFORM"
    );
    this.platformManager.createPlatform(
      550,
      worldHeight - 450,
      "CRYSTAL_PLATFORM"
    );
    this.platformManager.createPlatform(
      900,
      worldHeight - 380,
      "STONE_PLATFORM"
    );
    this.platformManager.createPlatform(
      1250,
      worldHeight - 420,
      "METAL_PLATFORM"
    );
    this.platformManager.createPlatform(
      1600,
      worldHeight - 390,
      "CRYSTAL_PLATFORM"
    );

    // Upper platforms
    this.platformManager.createPlatform(
      100,
      worldHeight - 600,
      "CRYSTAL_PLATFORM"
    );
    this.platformManager.createPlatform(
      450,
      worldHeight - 650,
      "STONE_PLATFORM"
    );
    this.platformManager.createPlatform(
      800,
      worldHeight - 580,
      "METAL_PLATFORM"
    );
    this.platformManager.createPlatform(
      1150,
      worldHeight - 620,
      "CRYSTAL_PLATFORM"
    );
    this.platformManager.createPlatform(
      1500,
      worldHeight - 590,
      "STONE_PLATFORM"
    );
    this.platformManager.createPlatform(
      1850,
      worldHeight - 630,
      "METAL_PLATFORM"
    );

    // High platforms (strategic positions)
    this.platformManager.createPlatform(
      275,
      worldHeight - 800,
      "CRYSTAL_PLATFORM"
    );
    this.platformManager.createPlatform(
      625,
      worldHeight - 850,
      "STONE_PLATFORM"
    );
    this.platformManager.createPlatform(
      975,
      worldHeight - 780,
      "METAL_PLATFORM"
    );
    this.platformManager.createPlatform(
      1325,
      worldHeight - 820,
      "CRYSTAL_PLATFORM"
    );
    this.platformManager.createPlatform(
      1675,
      worldHeight - 790,
      "STONE_PLATFORM"
    );

    // Top platforms (hardest to reach)
    this.platformManager.createPlatform(
      400,
      worldHeight - 1000,
      "METAL_PLATFORM"
    );
    this.platformManager.createPlatform(
      800,
      worldHeight - 1050,
      "CRYSTAL_PLATFORM"
    );
    this.platformManager.createPlatform(
      1200,
      worldHeight - 980,
      "STONE_PLATFORM"
    );
    this.platformManager.createPlatform(
      1600,
      worldHeight - 1020,
      "METAL_PLATFORM"
    );

    // Special custom platforms with unique properties
    this.platformManager.createCustomPlatform(1000, worldHeight - 1200, {
      sliceIndex: 9,
      name: "Golden Platform",
      width: 300,
      height: 40,
      tint: 0xffd700,
      solid: true,
    });

    this.platformManager.createCustomPlatform(500, worldHeight - 1150, {
      sliceIndex: 11,
      name: "Ruby Platform",
      width: 250,
      height: 35,
      tint: 0xff1493,
      solid: true,
    });

    this.platformManager.createCustomPlatform(1500, worldHeight - 1180, {
      sliceIndex: 13,
      name: "Emerald Platform",
      width: 280,
      height: 38,
      tint: 0x00ff7f,
      solid: true,
    });

    console.log("Created strategic platform layout across the world");
  }

  setupCameraControls() {
    if (!this.input.keyboard) return;

    const cursors = this.input.keyboard.createCursorKeys();

    const controlConfig = {
      camera: this.cameras.main,
      left: cursors.left,
      right: cursors.right,
      up: cursors.up,
      down: cursors.down,
      acceleration: 0.06,
      drag: 0.0005,
      maxSpeed: 1.0,
    };

    this.controls = new Phaser.Cameras.Controls.SmoothedKeyControl(
      controlConfig
    );

    // Set camera bounds to match world bounds
    this.camera.setBounds(0, 0, 2048, 1536);
  }

  update(_time: number, delta: number) {
    // Update camera controls (only if they exist)
    if (this.controls) {
      this.controls.update(delta);
    }

    // Update grace period indicator
    const timeSinceGameStart = Date.now() - this.gameStartTime;
    const gracePeriodActive = timeSinceGameStart < this.gracePeriodMs;

    if (this.gracePeriodText) {
      this.gracePeriodText.setVisible(gracePeriodActive);

      if (gracePeriodActive) {
        const remainingTime = Math.ceil(
          (this.gracePeriodMs - timeSinceGameStart) / 1000
        );
        this.gracePeriodText.setText(`⚡ GRACE PERIOD: ${remainingTime}s ⚡`);
      }
    }

    // Handle fight message after grace period ends
    if (this.fightText) {
      const timeSinceGraceEnd = timeSinceGameStart - this.gracePeriodMs;
      const showFightMessage = !gracePeriodActive && timeSinceGraceEnd < 1000; // Show for 1 second after grace period

      this.fightText.setVisible(showFightMessage);

      // Log fight message only once when it becomes active
      if (showFightMessage && !this.fightMessageLogged) {
        console.log("🥊 FIGHT MESSAGE ACTIVATED!");
        this.fightMessageLogged = true;
      } else if (!showFightMessage && this.fightMessageLogged) {
        // Reset the flag when fight message is no longer showing
        this.fightMessageLogged = false;
      }
    }

    // Calculate speed multiplier based on remaining players
    const activePlayers = this.boxes.children.entries.length;
    const baseSpeedMultiplier = activePlayers < 8 ? 1.5 : 1.0; // 50% faster when < 8 players

    // Handle initial speed boost activation
    if (
      activePlayers < 8 &&
      baseSpeedMultiplier > 1.0 &&
      !this.speedBoostLogged
    ) {
      console.log(
        `⚡ SPEED BOOST ACTIVE! ${activePlayers} players remaining, speed increased by ${(
          (baseSpeedMultiplier - 1) *
          100
        ).toFixed(0)}%`
      );
      this.speedBoostLogged = true;
      this.progressiveSpeedMultiplier = 1.0; // Reset progressive multiplier
      this.progressiveBoostCount = 0; // Reset boost count
      this.lastProgressiveBoostTime = Date.now(); // Initialize progressive boost timer
    } else if (activePlayers >= 8 && this.speedBoostLogged) {
      // Reset everything when speed boost deactivates
      console.log("⚡ SPEED BOOST DEACTIVATED - back to normal speed");
      this.speedBoostLogged = false;
      this.progressiveSpeedMultiplier = 1.0;
      this.progressiveBoostCount = 0;
      this.lastProgressiveBoostTime = 0;
    }

    // Handle progressive speed increases (only when speed boost is active)
    if (this.speedBoostLogged && this.progressiveBoostCount < 8) {
      const timeSinceLastBoost = Date.now() - this.lastProgressiveBoostTime;

      // Apply progressive boost every 10 seconds, up to 8 times
      if (timeSinceLastBoost >= 10000) {
        // 10 seconds
        this.progressiveBoostCount++;
        this.progressiveSpeedMultiplier += 0.25; // Add 25% each time
        this.lastProgressiveBoostTime = Date.now();

        console.log(
          `⚡ PROGRESSIVE SPEED BOOST ${
            this.progressiveBoostCount
          }/8! Speed now ${(
            (baseSpeedMultiplier * this.progressiveSpeedMultiplier - 1) *
            100
          ).toFixed(0)}% faster than normal`
        );
      }
    }

    // Calculate final speed multiplier (base speed boost * progressive multiplier)
    const speedMultiplier =
      baseSpeedMultiplier * this.progressiveSpeedMultiplier;

    // Simple Flappy Bird-style movement
    if (this.boxes?.children) {
      this.boxes.children.entries.forEach((box) => {
        const physicsBox = box as Phaser.Physics.Arcade.Image;

        // Check if body exists
        if (!physicsBox.body) return;

        // Update name text position to follow the box
        const nameText = physicsBox.getData(
          "nameText"
        ) as Phaser.GameObjects.Text;
        if (nameText) {
          nameText.setPosition(physicsBox.x, physicsBox.y - 30);
        }

        // Get stored data
        const nextFlapTime = physicsBox.getData("nextFlapTime") ?? 2000;
        const lastFlapTime = physicsBox.getData("lastFlapTime") ?? 0;
        const baseHorizontalSpeed = physicsBox.getData("horizontalSpeed") ?? 75;
        const direction = physicsBox.getData("direction") ?? 1;
        const nextDirectionChange =
          physicsBox.getData("nextDirectionChange") ?? 5000;
        const lastDirectionChange =
          physicsBox.getData("lastDirectionChange") ?? 0;

        // Apply speed multiplier to horizontal movement
        const horizontalSpeed = baseHorizontalSpeed * speedMultiplier;

        // Maintain horizontal movement (in case it gets lost due to collisions)
        const currentVelY = physicsBox.body.velocity.y;
        physicsBox.setVelocity(horizontalSpeed * direction, currentVelY);

        // Faster direction changes when speed boosted
        const directionChangeInterval =
          activePlayers < 8
            ? Phaser.Math.Between(2000, 5000) // Faster changes when < 8 players
            : Phaser.Math.Between(3000, 8000); // Normal changes

        // Randomly change direction occasionally
        if (_time - lastDirectionChange > nextDirectionChange) {
          const newDirection = Phaser.Math.RND.pick([-1, 1]);
          const newSpeed = Phaser.Math.Between(50, 100);

          physicsBox.setData("direction", newDirection);
          physicsBox.setData("horizontalSpeed", newSpeed);
          physicsBox.setData("lastDirectionChange", _time);
          physicsBox.setData("nextDirectionChange", directionChangeInterval);

          // Award points for direction changes (activity bonus) - DISABLED FOR DEBUGGING
          // const playerName = physicsBox.getData("playerName") as string;
          // if (playerName) {
          //   this.updatePlayerScore(playerName, 1);
          // }
        }

        // Faster flapping when speed boosted
        const flapInterval =
          activePlayers < 8
            ? Phaser.Math.Between(1000, 2500) // Faster flapping when < 8 players
            : Phaser.Math.Between(1500, 4000); // Normal flapping

        // Check if it's time to flap (like Flappy Bird wing beat)
        if (_time - lastFlapTime > nextFlapTime) {
          // Apply upward flap force while preserving horizontal movement
          const currentVelX = physicsBox.body.velocity.x;
          const flapForce = activePlayers < 8 ? -180 : -150; // Reduced flap force to make platforms more important
          physicsBox.setVelocity(currentVelX, flapForce);

          // Set next flap time (faster when speed boosted)
          physicsBox.setData("lastFlapTime", _time);
          physicsBox.setData("nextFlapTime", flapInterval);
        }

        // Screen wrapping logic - teleport to opposite side when half the ship is off the camera view
        const camera = this.cameras.main;
        const halfSpriteSize = 40; // Approximate half size of scaled ship sprite (2x scale)

        // Get camera bounds (visible area)
        const leftBound = camera.scrollX;
        const rightBound = camera.scrollX + camera.width;
        const topBound = camera.scrollY;
        const bottomBound = camera.scrollY + camera.height;

        // Horizontal wrapping (based on camera view)
        if (physicsBox.x > rightBound + halfSpriteSize) {
          physicsBox.x = leftBound - halfSpriteSize; // Teleport to left side of camera view
        } else if (physicsBox.x < leftBound - halfSpriteSize) {
          physicsBox.x = rightBound + halfSpriteSize; // Teleport to right side of camera view
        }

        // Vertical wrapping (based on camera view)
        if (physicsBox.y > bottomBound + halfSpriteSize) {
          physicsBox.y = topBound - halfSpriteSize; // Teleport to top of camera view
        } else if (physicsBox.y < topBound - halfSpriteSize) {
          physicsBox.y = bottomBound + halfSpriteSize; // Teleport to bottom of camera view
        }
      });
    }

    // Check for respawn conditions continuously (especially during winner announcement)
    this.checkAndRespawnPlayers();
  }

  /**
   * Initialize scores for all players (starting at 0)
   */
  private initializeScores(): void {
    this.scores.clear();
    const playerNames = this.getPlayerNames();
    playerNames.forEach((name) => {
      this.scores.set(name, 0);
    });
    console.log(
      "Initialized scores for",
      this.scores.size,
      "players:",
      Array.from(this.scores.keys())
    );
  }

  /**
   * Get formatted score display text
   */
  private getScoreDisplayText(): string {
    if (this.scores.size === 0) {
      return "No players loaded";
    }

    // Get list of currently active players
    const activePlayers = new Set(
      this.boxes.children.entries.map(
        (box) =>
          (box as Phaser.Physics.Arcade.Image).getData("playerName") as string
      )
    );

    // Create individual score displays for each player with alive/dead indicators
    const scoreEntries = Array.from(this.scores.entries())
      .sort(([, scoreA], [, scoreB]) => scoreB - scoreA) // Sort by score descending
      .map(([name, score]) => {
        const isAlive = activePlayers.has(name);
        const indicator = isAlive ? "+" : "-";
        return `${indicator} ${name}: ${score}`;
      })
      .slice(0, 8); // Show top 8 players to avoid text overflow

    return scoreEntries.join("\n");
  }
  /**
   * Update score for a specific player
   */
  private updatePlayerScore(playerName: string, points: number): void {
    const currentScore = this.scores.get(playerName) ?? 0;
    this.scores.set(playerName, currentScore + points);

    // Update the score display
    if (this.scoreText) {
      this.scoreText.setText(this.getScoreDisplayText());
    }
  }

  /**
   * Handle collision between two players with Joust-style logic
   */
  private handlePlayerCollision(
    player1: Phaser.Physics.Arcade.Image,
    player2: Phaser.Physics.Arcade.Image
  ): void {
    if (!player1.body || !player2.body) return;

    // Check for grace period at game start
    const graceCheckTime = Date.now();
    const timeSinceGameStart = graceCheckTime - this.gameStartTime;

    if (timeSinceGameStart < this.gracePeriodMs) {
      // Log grace period message only once per grace period
      if (!this.gracePeriodLogged) {
        console.log(
          `⏰ GRACE PERIOD ACTIVE: ${(
            this.gracePeriodMs - timeSinceGameStart
          ).toFixed(0)}ms remaining - no eliminations allowed`
        );
        this.gracePeriodLogged = true;
      }

      // Simple bounce effect during grace period
      const player1VelX = player1.body.velocity.x;
      const player2VelX = player2.body.velocity.x;
      player1.setVelocityX(-player1VelX * 0.8);
      player2.setVelocityX(-player2VelX * 0.8);
      return;
    } else if (this.gracePeriodLogged) {
      // Reset the flag when grace period ends and log deactivation
      console.log("⏰ GRACE PERIOD ENDED - eliminations now allowed");
      this.gracePeriodLogged = false;
    }

    const player1Name = player1.getData("playerName") as string;
    const player2Name = player2.getData("playerName") as string;

    if (!player1Name || !player2Name) return;

    // Add collision cooldown to prevent rapid repeated collisions
    const currentTime = Date.now();
    const lastCollision = player1.getData("lastCollision") ?? 0;

    if (currentTime - lastCollision < 500) {
      // 500ms cooldown
      console.log(
        `⏰ COLLISION COOLDOWN: ${player1Name} vs ${player2Name} (${
          currentTime - lastCollision
        }ms ago)`
      );
      return;
    }

    // Set collision cooldown for both players
    player1.setData("lastCollision", currentTime);
    player2.setData("lastCollision", currentTime);

    console.log(`🔥 COLLISION: ${player1Name} vs ${player2Name}`);

    // Get the vertical positions and velocities
    const player1Top = player1.y - player1.height / 2;
    const player2Top = player2.y - player2.height / 2;

    console.log(
      `Player positions - ${player1Name}: y=${player1.y.toFixed(
        1
      )}, top=${player1Top.toFixed(1)}, vel.y=${player1.body.velocity.y.toFixed(
        1
      )}`
    );
    console.log(
      `Player positions - ${player2Name}: y=${player2.y.toFixed(
        1
      )}, top=${player2Top.toFixed(1)}, vel.y=${player2.body.velocity.y.toFixed(
        1
      )}`
    );

    // Check if one player is significantly above the other and moving downward
    const verticalThreshold = 10; // Reduced threshold to make stomps easier
    const player1MovingDown = player1.body.velocity.y > 0; // Any downward movement
    const player2MovingDown = player2.body.velocity.y > 0; // Any downward movement

    console.log(
      `Movement check - ${player1Name} moving down: ${player1MovingDown} (vel.y: ${player1.body.velocity.y.toFixed(
        1
      )}), ${player2Name} moving down: ${player2MovingDown} (vel.y: ${player2.body.velocity.y.toFixed(
        1
      )})`
    );

    let winner: string | null = null;
    let loser: Phaser.Physics.Arcade.Image | null = null;

    // Simplified stomp logic: if one player is clearly above another, they win
    if (player1Top < player2Top - verticalThreshold) {
      // Player 1 is above Player 2
      winner = player1Name;
      loser = player2;
      console.log(
        `✅ POSITION STOMP! ${winner} is above ${loser.getData(
          "playerName"
        )} by ${(player2Top - player1Top).toFixed(1)}px`
      );
    } else if (player2Top < player1Top - verticalThreshold) {
      // Player 2 is above Player 1
      winner = player2Name;
      loser = player1;
      console.log(
        `✅ POSITION STOMP! ${winner} is above ${loser.getData(
          "playerName"
        )} by ${(player1Top - player2Top).toFixed(1)}px`
      );
    } else {
      console.log(
        `↔️ SIDE COLLISION - no clear height advantage (diff: ${Math.abs(
          player1Top - player2Top
        ).toFixed(1)}px)`
      );
      // Simple bounce effect for side collisions
      const player1VelX = player1.body.velocity.x;
      const player2VelX = player2.body.velocity.x;

      player1.setVelocityX(-player1VelX * 0.8);
      player2.setVelocityX(-player2VelX * 0.8);
      return;
    }

    console.log(
      `🎯 WINNER DETERMINED: ${winner}, LOSER: ${loser?.getData("playerName")}`
    );

    // Player 1 stomps Player 2 (Player 1 is above and moving down while Player 2 is not moving down as fast)
    const player1CanStomp = false; // Disabled old logic
    const player2CanStomp = false; // Disabled old logic

    console.log(
      `Stomp check - ${player1Name} can stomp ${player2Name}: ${player1CanStomp}`
    );
    console.log(
      `Stomp check - ${player2Name} can stomp ${player1Name}: ${player2CanStomp}`
    );

    // Skip the old complex conditional logic - winner and loser are already determined above

    // If we have a clear winner, award point and remove loser
    if (winner && loser) {
      console.log(
        `🏆 ${winner} STOMPED ${loser.getData(
          "playerName"
        )}! Player eliminated!`
      );
      this.updatePlayerScore(winner, 1);
      this.removePlayer(loser);

      // Give the winner a slight upward boost as feedback
      const winnerBox = winner === player1Name ? player1 : player2;
      winnerBox.setVelocityY(-150);
    }
  }

  /**
   * Remove a defeated player from the game
   */
  private removePlayer(player: Phaser.Physics.Arcade.Image): void {
    const playerName = player.getData("playerName") as string;
    const nameText = player.getData("nameText") as Phaser.GameObjects.Text;

    console.log(`💀 ELIMINATING PLAYER: ${playerName}`);
    console.log(
      `Players before removal: ${this.boxes.children.entries.length}`
    );

    // Log all current players before removal
    const currentPlayers = this.boxes.children.entries
      .map((box) => (box as Phaser.Physics.Arcade.Image).getData("playerName"))
      .join(", ");
    console.log(`Current players: ${currentPlayers}`);

    // Remove the name text first
    if (nameText) {
      nameText.destroy();
      console.log(`✅ Name text destroyed for ${playerName}`);
    }

    // Remove the player from the ships group and destroy it
    this.boxes.remove(player, true, true); // remove, destroyChild, removeCallback
    console.log(`✅ Player removed from physics group: ${playerName}`);

    console.log(`Players after removal: ${this.boxes.children.entries.length}`);

    // Log all remaining players after removal
    const remainingPlayers = this.boxes.children.entries
      .map((box) => (box as Phaser.Physics.Arcade.Image).getData("playerName"))
      .join(", ");
    console.log(`Remaining players: ${remainingPlayers}`);

    console.log(`Player ${playerName} has been eliminated!`);

    // Update the score display immediately after removal
    if (this.scoreText) {
      this.scoreText.setText(this.getScoreDisplayText());
    }

    // Check if we need to spawn a new player to keep the game active
    this.checkAndRespawnPlayers();
  }

  /**
   * Check if we need to respawn players to keep the game active
   */
  private checkAndRespawnPlayers(): void {
    const activePlayers = this.boxes.children.entries.length;
    const totalAvailablePlayers = this.getPlayerNames().length;

    // Only respawn when there's just 1 player left standing and we have more players available
    if (activePlayers <= 1 && totalAvailablePlayers > 1) {
      if (!this.winnerAnnounced) {
        // Get the winner's name
        const winnerName =
          this.boxes.children.entries.length > 0
            ? ((
                this.boxes.children.entries[0] as Phaser.Physics.Arcade.Image
              ).getData("playerName") as string)
            : "Unknown";

        console.log(`🏆 LAST PLAYER STANDING! ${winnerName} wins this round!`);

        // Show winner announcement
        this.winnerText.setText(`🏆 ${winnerName} WINS! 🏆`);
        this.winnerText.setVisible(true);
        this.winnerAnnounced = true;
        this.winnerAnnounceTime = Date.now();

        console.log(
          "Winner announcement displayed, waiting 3 seconds before respawn..."
        );
        return; // Don't respawn yet, wait for the announcement period
      }

      // Check if 3 seconds have passed since winner announcement
      const timeSinceAnnouncement = Date.now() - this.winnerAnnounceTime;

      if (timeSinceAnnouncement >= 3000) {
        // 3 seconds
        console.log(
          "✅ 3 seconds passed! Respawning all players after winner announcement..."
        );

        // Hide winner text
        this.winnerText.setVisible(false);
        this.winnerAnnounced = false;

        // Reset grace period when respawning players
        this.gameStartTime = Date.now();
        this.gracePeriodLogged = false; // Reset grace period logging flag
        this.fightMessageLogged = false; // Reset fight message logging flag

        // Reset speed boost system
        this.speedBoostLogged = false;
        this.progressiveSpeedMultiplier = 1.0;
        this.progressiveBoostCount = 0;
        this.lastProgressiveBoostTime = 0;

        console.log(
          "⏰ GRACE PERIOD RESET: 3 seconds of protection for all players"
        );

        // Respawn all available players except the one currently active
        const playersToSpawn = totalAvailablePlayers - activePlayers;
        console.log(`🔄 SPAWNING ${playersToSpawn} players...`);

        for (let i = 0; i < playersToSpawn; i++) {
          this.spawnRandomPlayer();
        }

        console.log("🎮 RESPAWN COMPLETE - game should continue!");
      } else {
        console.log(
          `⏳ Still waiting... ${(3000 - timeSinceAnnouncement).toFixed(
            0
          )}ms remaining`
        );
      }
    } else if (activePlayers <= 1 && totalAvailablePlayers === 1) {
      console.log(
        "🎯 Only ElodineCodes available - game continues with single player"
      );
    }
  }

  /**
   * Spawn a random player at a safe location
   */
  private spawnRandomPlayer(): void {
    const allPlayerNames = this.getPlayerNames();

    // Find names that are not currently active in the game
    const availableNames = allPlayerNames.filter(
      (name) =>
        !this.boxes.children.entries.some(
          (box) =>
            (box as Phaser.Physics.Arcade.Image).getData("playerName") === name
        )
    );

    // If no names are available (all players are active), don't spawn
    if (availableNames.length === 0) {
      console.log(
        "No available names to spawn - all players are already active"
      );
      return;
    }

    const playerName = Phaser.Math.RND.pick(availableNames);
    console.log(
      `Spawning available player: ${playerName} (${availableNames.length} names available)`
    );

    // Find a safe spawn location (away from other players)
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    let x, y;
    let attempts = 0;
    do {
      x = Phaser.Math.Between(centerX - 200, centerX + 200);
      y = Phaser.Math.Between(centerY - 200, centerY + 200);
      attempts++;
    } while (this.isLocationOccupied(x, y, 80) && attempts < 10);

    // Create the new player using ship sprite
    const box = this.physics.add.image(x, y, "ship");

    // Make the ship larger (2x scale)
    box.setScale(2);

    // Set bounce properties for better platform interaction
    box.setBounce(0.3);
    box.setCollideWorldBounds(false); // Allow wrapping instead

    const colors = [
      0xff6b6b, 0x4ecdc4, 0x45b7d1, 0x96ceb4, 0xfeca57, 0xff9ff3, 0x54a0ff,
      0x2ed573, 0xff6348, 0x1dd1a1, 0x7f8c8d, 0xf39c12, 0x8e44ad, 0xe74c3c,
      0x3498db, 0x2ecc71,
    ];

    box.setTint(Phaser.Math.RND.pick(colors));

    // Special styling for ElodineCodes
    const isElodine = playerName === "ElodineCodes";
    const nameText = this.add.text(x, y - 30, playerName, {
      fontFamily: "Arial",
      fontSize: 13,
      color: "#ffffff", // White text for all players
      backgroundColor: isElodine ? "#006400" : "#000000", // Dark green for ElodineCodes, black for others
      padding: { x: 4, y: 2 },
    });
    nameText.setOrigin(0.5);

    // Set up player data
    box.setData("nameText", nameText);
    box.setData("playerName", playerName);

    const horizontalSpeed = Phaser.Math.Between(50, 100);
    const direction = Phaser.Math.RND.pick([-1, 1]);

    box.setVelocityX(horizontalSpeed * direction);
    box.setVelocityY(0);

    box.setData("nextFlapTime", Phaser.Math.Between(1000, 3000));
    box.setData("lastFlapTime", 0);
    box.setData("horizontalSpeed", horizontalSpeed);
    box.setData("direction", direction);
    box.setData("nextDirectionChange", Phaser.Math.Between(3000, 8000));
    box.setData("lastDirectionChange", 0);

    this.boxes.add(box);

    console.log(`Respawned player: ${playerName}`);
  }

  /**
   * Check if a location is too close to existing players
   */
  private isLocationOccupied(
    x: number,
    y: number,
    minDistance: number
  ): boolean {
    return this.boxes.children.entries.some((box) => {
      const playerBox = box as Phaser.Physics.Arcade.Image;
      const distance = Phaser.Math.Distance.Between(
        x,
        y,
        playerBox.x,
        playerBox.y
      );
      return distance < minDistance;
    });
  }
}
