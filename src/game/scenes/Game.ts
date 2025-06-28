import { Scene } from "phaser";
import { PlatformManager } from "../Platform";
import { YouTubeCommentsResponse } from "../../services/YouTubeService";
import {
  PlayerManager,
  GameStateManager,
  CollisionManager,
  SpeedManager,
  CommentDataManager,
  PlatformCreator,
  CameraController,
  RespawnManager,
} from "../managers";

export class Game extends Scene {
  camera: Phaser.Cameras.Scene2D.Camera;
  boxes: Phaser.Physics.Arcade.Group;

  // Managers
  private playerManager!: PlayerManager; // Will be initialized in create()
  private readonly gameStateManager: GameStateManager;
  private readonly collisionManager: CollisionManager;
  private readonly speedManager: SpeedManager;
  private readonly commentDataManager: CommentDataManager;
  private platformCreator!: PlatformCreator; // Will be initialized in create()
  private readonly cameraController: CameraController;
  private readonly respawnManager: RespawnManager;

  // Platform manager (existing)
  private platformManager!: PlatformManager; // Will be initialized in create()

  constructor() {
    super("Game");

    // Initialize managers
    this.gameStateManager = new GameStateManager(this);
    this.collisionManager = new CollisionManager();
    this.speedManager = new SpeedManager();
    this.commentDataManager = new CommentDataManager();
    this.cameraController = new CameraController(this);
    this.respawnManager = new RespawnManager();

    // Note: playerManager and platformCreator will be initialized after create()
    // when we have the required dependencies
  }

  async create(data?: { commentsData?: YouTubeCommentsResponse }) {
    this.camera = this.cameras.main;
    this.camera.setBackgroundColor(0x2c3e50);

    // Set up physics world bounds (larger than screen for camera movement)
    this.physics.world.setBounds(0, 0, 2048, 1536);

    // Create a group for our boxes
    this.boxes = this.physics.add.group();

    // Initialize managers that need dependencies
    this.playerManager = new PlayerManager(this, this.boxes);

    // Create platform manager and add platforms
    this.platformManager = new PlatformManager(this);
    this.platformCreator = new PlatformCreator(this.platformManager);
    this.platformCreator.createGamePlatforms();

    // Extract YouTube commenter names from passed data or fetch them
    let youtubeNames: string[] = [];
    if (data?.commentsData) {
      console.log("Using passed comments data from MainMenu");
      youtubeNames = this.commentDataManager.extractNamesFromCommentsData(
        data.commentsData
      );
    } else {
      console.log("No comments data passed, fetching from YouTube service");
      youtubeNames = await this.commentDataManager.fetchYouTubeNames();
    }

    // Set YouTube names in player manager
    this.playerManager.setYouTubeNames(youtubeNames);

    // Create multiple colored boxes
    this.playerManager.createPlayers();

    // Add collisions between all boxes with Joust-style scoring
    this.physics.add.collider(this.boxes, this.boxes, (obj1, obj2) => {
      this.collisionManager.handlePlayerCollision(
        obj1 as Phaser.Physics.Arcade.Image,
        obj2 as Phaser.Physics.Arcade.Image,
        this.gameStateManager.isGracePeriodActive(),
        (winner: string, loser: Phaser.Physics.Arcade.Image) => {
          this.gameStateManager.updatePlayerScore(winner, 1);
          this.playerManager.removePlayer(loser);
        }
      );
    });

    // Add collisions between players and platforms
    this.physics.add.collider(
      this.boxes,
      this.platformManager.getPlatformGroup()
    );

    // Set up camera controls
    this.cameraController.setupCameraControls();

    // Initialize UI and game state
    this.gameStateManager.initializeUI();
    this.gameStateManager.initializeScores(this.playerManager.getPlayerNames());
    this.gameStateManager.setGameStartTime();
  }

  update(time: number, delta: number) {
    // Update camera controls
    this.cameraController.update(delta);

    // Update grace period and game state
    this.gameStateManager.updateGracePeriod();

    // Calculate speed multiplier based on remaining players
    const activePlayers = this.playerManager.getActivePlayerCount();
    const speedMultiplier =
      this.speedManager.calculateSpeedMultiplier(activePlayers);

    // Update player movement
    this.playerManager.updatePlayerMovement(time, speedMultiplier);

    // Update score display with active players
    const activePlayerNames = new Set(
      this.boxes.children.entries.map(
        (box) =>
          (box as Phaser.Physics.Arcade.Image).getData("playerName") as string
      )
    );
    this.gameStateManager.updateScoreDisplay(activePlayerNames);

    // Check for respawn conditions
    this.checkAndRespawnPlayers();
  }

  private checkAndRespawnPlayers(): void {
    const activePlayers = this.playerManager.getActivePlayerCount();
    const totalAvailablePlayers =
      this.playerManager.getTotalAvailablePlayerCount();

    this.respawnManager.checkAndRespawnPlayers(
      activePlayers,
      totalAvailablePlayers,
      this.gameStateManager,
      this.playerManager,
      (winnerName: string) => {
        // Get the actual winner name from the remaining player
        const remainingPlayer = this.boxes.children
          .entries[0] as Phaser.Physics.Arcade.Image;
        const actualWinnerName =
          remainingPlayer?.getData("playerName") ?? winnerName;
        this.gameStateManager.announceWinner(actualWinnerName);
      }
    );
  }
}
