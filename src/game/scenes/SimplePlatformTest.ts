import { Scene } from "phaser";
import { SimplePlatformManager } from "../SimplePlatform";

export class SimplePlatformTest extends Scene {
  private platformManager: SimplePlatformManager;
  private testObject: Phaser.Physics.Arcade.Image;

  constructor() {
    super("SimplePlatformTest");
  }

  create() {
    this.cameras.main.setBackgroundColor(0x222222);

    // Create simple platform manager
    this.platformManager = new SimplePlatformManager(this);

    // Add title
    this.add.text(
      16,
      16,
      [
        "🔧 Simple Platform Physics Test",
        "Testing basic collision detection",
        "Press R to restart, ESC to return to main menu",
      ],
      {
        fontFamily: "Arial",
        fontSize: 14,
        color: "#ffffff",
        backgroundColor: "#000000",
        padding: { x: 8, y: 4 },
      }
    );

    // Create simple test platforms (colored rectangles)
    this.createSimpleTestPlatforms();

    // Create a test falling object
    this.createTestFallingObject();

    // Add keyboard controls
    if (this.input.keyboard) {
      this.input.keyboard.on("keydown-ESC", () => {
        this.scene.start("MainMenu");
      });

      this.input.keyboard.on("keydown-R", () => {
        this.scene.restart();
      });
    }
  }

  private createSimpleTestPlatforms(): void {
    console.log("Creating simple test platforms...");

    // Create platforms at different positions using colored rectangles
    this.platformManager.createPlatform(300, 500, 200, 20, 0xff0000); // Red platform
    this.platformManager.createPlatform(600, 400, 200, 20, 0x00ff00); // Green platform
    this.platformManager.createPlatform(400, 300, 200, 20, 0x0000ff); // Blue platform
    this.platformManager.createPlatform(200, 600, 300, 20, 0xffff00); // Yellow platform

    console.log(
      "Simple platforms created:",
      this.platformManager.getPlatforms().length
    );
  }

  private createTestFallingObject(): void {
    console.log("Creating test falling object...");

    // Create a simple falling object using ship sprite
    this.testObject = this.physics.add.image(350, 50, "ship");
    this.testObject.setTint(0xffffff); // White color
    this.testObject.setScale(0.5);
    this.testObject.setBounce(0.3);
    this.testObject.setCollideWorldBounds(true);

    // Add collision with platforms
    this.physics.add.collider(
      this.testObject,
      this.platformManager.getPlatformGroup(),
      () => {
        console.log("✅ COLLISION DETECTED! Test object hit platform!");
      }
    );

    console.log(
      "Test falling object created at:",
      this.testObject.x,
      this.testObject.y
    );
    console.log(
      "Platform group has",
      this.platformManager.getPlatformGroup().children.size,
      "platforms"
    );
  }

  update() {
    // Show debug info
    if (this.testObject) {
      // Reset object if it falls too far
      if (this.testObject.y > this.cameras.main.height + 100) {
        console.log("Resetting test object position");
        this.testObject.setPosition(350, 50);
        this.testObject.setVelocity(0, 0);
      }
    }
  }
}
