import { Scene } from "phaser";

/**
 * Simple platform implementation for debugging platform physics issues
 */
export class SimplePlatform extends Phaser.GameObjects.Rectangle {
  declare body: Phaser.Physics.Arcade.StaticBody;

  constructor(
    scene: Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    color: number = 0x00ff00
  ) {
    super(scene, x, y, width, height, color);

    // Add to scene
    scene.add.existing(this);
    scene.physics.add.existing(this, true); // true = static body

    // Set physics body size to match rectangle
    if (this.body) {
      this.body.setSize(width, height);
    }

    console.log(
      `Simple platform created at (${x}, ${y}) with size ${width}x${height}`
    );
  }
}

/**
 * Simple Platform Manager for testing basic platform functionality
 */
export class SimplePlatformManager {
  private readonly scene: Scene;
  private platforms: SimplePlatform[] = [];
  private readonly platformGroup: Phaser.Physics.Arcade.StaticGroup;

  constructor(scene: Scene) {
    this.scene = scene;
    this.platformGroup = scene.physics.add.staticGroup();
  }

  /**
   * Create a simple colored rectangle platform
   */
  createPlatform(
    x: number,
    y: number,
    width: number,
    height: number,
    color: number = 0x00ff00
  ): SimplePlatform {
    const platform = new SimplePlatform(this.scene, x, y, width, height, color);
    this.platforms.push(platform);
    this.platformGroup.add(platform);
    return platform;
  }

  /**
   * Get the physics group containing all platforms
   */
  getPlatformGroup(): Phaser.Physics.Arcade.StaticGroup {
    return this.platformGroup;
  }

  /**
   * Get all created platforms
   */
  getPlatforms(): SimplePlatform[] {
    return [...this.platforms];
  }

  /**
   * Remove all platforms
   */
  clearPlatforms(): void {
    this.platforms.forEach((platform) => platform.destroy());
    this.platforms = [];
    this.platformGroup.clear(true, true);
  }
}
