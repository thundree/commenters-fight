import { Scene } from "phaser";
import { PlatformManager } from "../Platform";

export class PlatformTest extends Scene {
  private platformManager: PlatformManager;
  private testObject: Phaser.Physics.Arcade.Image;

  constructor() {
    super("PlatformTest");
  }

  create() {
    this.cameras.main.setBackgroundColor(0x2c3e50);

    // Enable physics debug rendering to see collision bodies
    this.physics.world.createDebugGraphic();
    this.physics.world.debugGraphic.setAlpha(0.75);

    // Create platform manager
    this.platformManager = new PlatformManager(this);

    // Check if joust-sprites loaded correctly
    const texture = this.textures.get("joust-sprites");
    if (texture?.source?.[0]) {
      const width = texture.source[0].width;
      const height = texture.source[0].height;

      // Display image info on screen
      this.add.text(
        16,
        16,
        [
          "🧪 Platform Test Scene",
          "",
          "Joust Sprites Information:",
          `Image size: ${width} x ${height}`,
          `Slice width: ${Math.floor(width / 14)} (14 slices)`,
          `Full height: ${height}`,
        ],
        {
          fontFamily: "Arial",
          fontSize: 16,
          color: "#ffffff",
          backgroundColor: "#000000",
          padding: { x: 10, y: 10 },
        }
      );

      // Create test platforms with physics debugging
      this.createTestPlatforms();

      // Create a test object that falls and should collide with platforms
      this.createTestFallingObject();

      // Display the full image for reference (smaller scale)
      const fullImage = this.add.image(
        width / 4 + 50,
        height / 4 + 150,
        "joust-sprites"
      );
      fullImage.setScale(0.25); // Scale down more to fit better

      // Add label for full image
      this.add
        .text(
          fullImage.x,
          fullImage.y - fullImage.displayHeight / 2 - 20,
          "Full Joust Sprites Image (25% scale)",
          {
            fontFamily: "Arial",
            fontSize: 12,
            color: "#ffff00",
            backgroundColor: "#000000",
            padding: { x: 4, y: 2 },
          }
        )
        .setOrigin(0.5);
    } else {
      console.error("Failed to load joust-sprites texture!");
      this.add.text(16, 16, "❌ Error: Failed to load joust-sprites!", {
        fontFamily: "Arial",
        fontSize: 16,
        color: "#ff0000",
      });
    }

    // Add instructions
    this.add.text(
      16,
      this.cameras.main.height - 80,
      [
        "🧪 Platform collision test - Watch the falling blue square",
        "Use the Platform Configurator (C key) to create custom platforms",
        "Press ESC to return to main menu, R to restart test",
      ],
      {
        fontFamily: "Arial",
        fontSize: 12,
        color: "#ffffff",
        backgroundColor: "#000000",
        padding: { x: 8, y: 4 },
      }
    );

    // Add keyboard controls
    if (this.input.keyboard) {
      this.input.keyboard.on("keydown-ESC", () => {
        this.scene.start("MainMenu");
      });

      this.input.keyboard.on("keydown-C", () => {
        this.scene.start("PlatformConfigurator");
      });

      this.input.keyboard.on("keydown-R", () => {
        this.scene.restart();
      });
    }
  }

  private createTestPlatforms(): void {
    // Create simple test platforms at known positions using the manually configured platforms
    console.log("Creating test platforms for physics testing...");

    // Create a few platforms at different heights using all available types
    this.platformManager.createPlatform(300, 500, "STONE_PLATFORM");
    this.platformManager.createPlatform(500, 400, "METAL_PLATFORM");
    this.platformManager.createPlatform(700, 350, "CRYSTAL_PLATFORM");
    this.platformManager.createPlatform(200, 300, "WOODEN_PLATFORM");
    this.platformManager.createPlatform(850, 450, "BRIDGE_PLATFORM");

    console.log(
      "Test platforms created:",
      this.platformManager.getPlatforms().length
    );
  }

  private createTestFallingObject(): void {
    console.log("Creating test falling object...");

    // Create a simple falling rectangle that should collide with platforms
    this.testObject = this.physics.add.image(400, 100, "ship");
    this.testObject.setTint(0x0066ff); // Blue color
    this.testObject.setScale(0.5); // Smaller scale
    this.testObject.setBounce(0.3);
    this.testObject.setCollideWorldBounds(true);

    // Add collision with platforms
    this.physics.add.collider(
      this.testObject,
      this.platformManager.getPlatformGroup(),
      () => {
        console.log("Test object collided with platform!");
      }
    );

    console.log(
      "Test object created at:",
      this.testObject.x,
      this.testObject.y
    );
  }
}
