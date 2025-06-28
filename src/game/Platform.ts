import { Scene } from "phaser";
import {
  PLATFORM_CONFIGS,
  getPlatformConfig,
  getPlatformConfigKeys,
} from "./constants/PlatformConfigs";

export interface PlatformConfig {
  /** Display name for this platform type */
  name: string;
  /** Crop X coordinate from sprite sheet */
  cropX: number;
  /** Crop Y coordinate from sprite sheet */
  cropY: number;
  /** Crop width from sprite sheet */
  cropWidth: number;
  /** Crop height from sprite sheet */
  cropHeight: number;
  /** Display width in pixels (will be scaled from crop) */
  displayWidth: number;
  /** Display height in pixels (will be scaled from crop) */
  displayHeight: number;
  /** Color tint to apply (optional) */
  tint?: number;
  /** Whether this platform is solid (players can land on it) */
  solid: boolean;
}

export class Platform extends Phaser.GameObjects.Image {
  private readonly config: PlatformConfig;
  declare body: Phaser.Physics.Arcade.StaticBody;

  constructor(scene: Scene, x: number, y: number, config: PlatformConfig) {
    // Create image with joust-sprites texture
    super(scene, x, y, "joust-sprites");

    this.config = config;

    // Add to scene first
    scene.add.existing(this);

    // Set depth to ensure it's visible
    this.setDepth(1);

    // Create crop rectangle using manual coordinates
    this.createCrop();

    // Force the cropped sprite to stretch to the platform size
    this.stretchToFitPlatform();

    // Apply tint if specified
    if (config.tint) {
      this.setTint(config.tint);
    }

    // Add physics body AFTER all visual setup is complete
    scene.physics.add.existing(this, true); // true = static body

    // Configure physics body to exactly match the visual platform
    if (this.body) {
      // Set the physics body size to match the display size (after scaling)
      this.body.setSize(config.displayWidth, config.displayHeight);
      // Center the physics body on the sprite (no offset needed since we're already centered)
      this.body.setOffset(0, 0);

      console.log(
        `Platform "${config.name}" created:`,
        `\n  Cropped size: ${this.width}x${this.height}`,
        `\n  Display size: ${this.displayWidth}x${this.displayHeight}`,
        `\n  Physics: ${this.body.width}x${this.body.height}`,
        `\n  Position: (${this.x}, ${this.y})`,
        `\n  Crop: (${config.cropX}, ${config.cropY}, ${config.cropWidth}, ${config.cropHeight})`,
        `\n  Scale: (${this.scaleX.toFixed(2)}, ${this.scaleY.toFixed(2)})`,
        `\n  Visible: ${this.visible}, Alpha: ${this.alpha}, Depth: ${this.depth}`
      );
    }

    // Add visual boundary for debugging (AFTER all setup)
    this.createPlatformBoundary(
      scene,
      x,
      y,
      config.displayWidth,
      config.displayHeight
    );
  }

  /**
   * Create a visual boundary around the platform for debugging
   */
  private createPlatformBoundary(
    scene: Scene,
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    // Create a thin outline to show the intended platform boundary
    const boundary = scene.add.rectangle(x, y, width, height, 0x000000, 0);
    boundary.setStrokeStyle(2, 0x00ff00, 0.8); // Green outline to match physics body
    boundary.setDepth(-1); // Put boundary BEHIND the platform sprite so it doesn't cover it
  }

  /**
   * Force the cropped sprite to stretch to fill the entire platform container
   */
  private stretchToFitPlatform(): void {
    // First ensure we have the cropped dimensions
    const croppedWidth = this.width;
    const croppedHeight = this.height;

    console.log(
      `Platform stretch for "${this.config.name}":`,
      `\n  Original cropped size: ${croppedWidth}x${croppedHeight}`,
      `\n  Target display size: ${this.config.displayWidth}x${this.config.displayHeight}`
    );

    // Method 1: Try setDisplaySize first
    this.setDisplaySize(this.config.displayWidth, this.config.displayHeight);

    // Method 2: If that doesn't work, calculate and apply scale manually
    if (
      this.displayWidth !== this.config.displayWidth ||
      this.displayHeight !== this.config.displayHeight
    ) {
      console.log(`setDisplaySize didn't work, trying manual scaling...`);
      const scaleX = this.config.displayWidth / croppedWidth;
      const scaleY = this.config.displayHeight / croppedHeight;
      this.setScale(scaleX, scaleY);
    }

    console.log(
      `Platform stretch result:`,
      `\n  Final display size: ${this.displayWidth}x${this.displayHeight}`,
      `\n  Final scale: ${this.scaleX.toFixed(2)}x${this.scaleY.toFixed(2)}`
    );
  }

  /**
   * Create a crop rectangle using manual coordinates from the config
   * Uses the exact crop coordinates specified in the platform configuration
   */
  private createCrop(): void {
    const texture = this.scene.textures.get("joust-sprites");
    if (texture?.source?.[0]) {
      const fullWidth = texture.source[0].width;
      const fullHeight = texture.source[0].height;

      const { cropX, cropY, cropWidth, cropHeight } = this.config;

      console.log(
        `Creating crop for "${this.config.name}": crop(${cropX}, ${cropY}, ${cropWidth}, ${cropHeight}) from texture ${fullWidth}x${fullHeight}`
      );

      // Ensure we don't go beyond texture bounds
      if (
        cropX >= 0 &&
        cropY >= 0 &&
        cropX + cropWidth <= fullWidth &&
        cropY + cropHeight <= fullHeight &&
        cropWidth > 0 &&
        cropHeight > 0
      ) {
        // Set crop rectangle using manual coordinates
        this.setCrop(cropX, cropY, cropWidth, cropHeight);

        // Ensure the sprite is visible by setting alpha to 1
        this.setAlpha(1);
        this.setVisible(true);

        console.log(
          `✅ Platform "${this.config.name}" crop successful: (${cropX}, ${cropY}, ${cropWidth}, ${cropHeight})`,
          `\n  Sprite dimensions after crop: ${this.width}x${this.height}`,
          `\n  Sprite visible: ${this.visible}, alpha: ${this.alpha}`
        );
      } else {
        console.error(
          `❌ Platform "${this.config.name}" crop out of bounds:`,
          `\n  Requested crop: (${cropX}, ${cropY}, ${cropWidth}, ${cropHeight})`,
          `\n  Texture bounds: ${fullWidth}x${fullHeight}`,
          `\n  Using fallback crop (0, 0, 64, 64)`
        );
        // Fall back to a safe default and make it visible with a tint
        this.setCrop(0, 0, Math.min(64, fullWidth), Math.min(64, fullHeight));
        this.setTint(0xff0000); // Red to indicate error
        this.setAlpha(1);
        this.setVisible(true);
      }
    } else {
      console.error(
        "❌ Could not crop joust sprites - texture not found or not loaded"
      );
      // Create a colored rectangle as fallback
      this.setTint(this.config.tint ?? 0xff0000); // Red if no tint specified
      this.setAlpha(1);
      this.setVisible(true);
    }
  }

  /**
   * Get the platform configuration (returns the exact config object, no cloning)
   */
  getConfig(): PlatformConfig {
    return this.config;
  }

  /**
   * Update the platform's crop coordinates (change visual appearance)
   */
  setCropCoordinates(
    cropX: number,
    cropY: number,
    cropWidth: number,
    cropHeight: number
  ): void {
    this.config.cropX = cropX;
    this.config.cropY = cropY;
    this.config.cropWidth = cropWidth;
    this.config.cropHeight = cropHeight;
    this.createCrop();
    this.stretchToFitPlatform();
  }

  /**
   * Update the platform's tint
   */
  updateTint(tint: number): void {
    this.config.tint = tint;
    this.setTint(tint);
  }
}

/**
 * Platform Manager - handles creation and configuration of multiple platform types
 */
export class PlatformManager {
  private readonly scene: Scene;
  private platforms: Platform[] = [];
  private readonly platformGroup: Phaser.Physics.Arcade.StaticGroup;

  constructor(scene: Scene) {
    this.scene = scene;
    this.platformGroup = scene.physics.add.staticGroup();
  }

  /**
   * Create a platform at the specified position using a predefined configuration
   */
  createPlatform(
    x: number,
    y: number,
    configKey: keyof typeof PLATFORM_CONFIGS
  ): Platform {
    const config = getPlatformConfig(configKey);
    const platform = new Platform(this.scene, x, y, config);

    this.platforms.push(platform);
    this.platformGroup.add(platform);

    return platform;
  }

  /**
   * Create a custom platform with custom configuration
   */
  createCustomPlatform(x: number, y: number, config: PlatformConfig): Platform {
    const platform = new Platform(this.scene, x, y, config);

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
  getPlatforms(): Platform[] {
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

  /**
   * Create a visual demonstration of the available configured platforms
   */
  createPlatformDemo(
    startX: number,
    startY: number,
    spacing: number = 150
  ): void {
    console.log("Creating platform demonstration...");

    // Get all predefined platform configs (now includes all manually configured platforms)
    const configKeys = getPlatformConfigKeys();

    configKeys.forEach((key, i) => {
      const x = startX + (i % 3) * spacing; // 3 columns per row
      const y = startY + Math.floor(i / 3) * 100; // New row every 3 platforms

      this.createPlatform(x, y, key);

      // Add text label showing platform name
      this.scene.add
        .text(x, y - 50, PLATFORM_CONFIGS[key].name, {
          fontFamily: "Arial",
          fontSize: 12,
          color: "#ffffff",
          backgroundColor: "#000000",
          padding: { x: 4, y: 2 },
        })
        .setOrigin(0.5);
    });
  }
}
