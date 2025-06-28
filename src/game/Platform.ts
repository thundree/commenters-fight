import { Scene } from "phaser";

export interface PlatformConfig {
  /** Which horizontal slice (0-13) to use for this platform variant */
  sliceIndex: number;
  /** Display name for this platform type */
  name: string;
  /** Width in pixels (will be scaled to fit slice width) */
  width: number;
  /** Height in pixels */
  height: number;
  /** Color tint to apply (optional) */
  tint?: number;
  /** Whether this platform is solid (players can land on it) */
  solid: boolean;
}

export class Platform extends Phaser.GameObjects.Image {
  private readonly config: PlatformConfig;
  declare body: Phaser.Physics.Arcade.StaticBody;

  constructor(scene: Scene, x: number, y: number, config: PlatformConfig) {
    // Create a basic rectangle for now, we'll add texture slicing later
    super(scene, x, y, "joust-sprites");

    this.config = config;

    // Add to scene first
    scene.add.existing(this);

    // Create crop rectangle for the slice
    this.createCrop(config.sliceIndex);

    // Force the cropped sprite to stretch to the platform size
    this.stretchToFitPlatform();

    // Apply tint if specified
    if (config.tint) {
      this.setTint(config.tint);
    }

    // Add physics AFTER all visual setup is complete
    scene.physics.add.existing(this, true); // true = static body

    // Configure physics body to exactly match the visual platform
    if (this.body) {
      // Set the physics body to exactly match the displayed platform size
      this.body.setSize(this.displayWidth, this.displayHeight);
      this.body.setOffset(0, 0);

      console.log(
        `Platform created: visual=(${this.displayWidth}x${this.displayHeight}), physics=(${this.body.width}x${this.body.height}), pos=(${this.x}, ${this.y})`
      );
    }

    // Add visual boundary for debugging (AFTER all setup)
    this.createPlatformBoundary(
      scene,
      x,
      y,
      this.displayWidth,
      this.displayHeight
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
    boundary.setDepth(10); // Put boundary above the platform sprite so it's visible
  }

  /**
   * Force the cropped sprite to stretch to fill the entire platform container
   */
  private stretchToFitPlatform(): void {
    // Get the actual cropped dimensions
    const croppedWidth = this.width;
    const croppedHeight = this.height;

    // Calculate scale factors to stretch the cropped sprite to platform size
    const scaleX = this.config.width / croppedWidth;
    const scaleY = this.config.height / croppedHeight;

    // Apply the scale to stretch the sprite
    this.setScale(scaleX, scaleY);

    console.log(
      `Platform stretch: cropped=${croppedWidth}x${croppedHeight}, target=${
        this.config.width
      }x${this.config.height}, scale=${scaleX.toFixed(2)}x${scaleY.toFixed(2)}`
    );
  }

  /**
   * Create a crop rectangle for a specific slice of the joust sprites
   * Crops the correct 64px slice, then setDisplaySize() stretches it to fit platform
   */
  private createCrop(sliceIndex: number): void {
    const texture = this.scene.textures.get("joust-sprites");
    if (texture?.source?.[0]) {
      const fullWidth = texture.source[0].width;
      const fullHeight = texture.source[0].height;

      // Correct sprite sheet layout: 14 columns, multiple rows
      const platformsPerRow = 14;

      // Use fixed 64x64 platform size (standard for joust sprites)
      const platformWidth = 64;
      const platformHeight = 64;

      // Calculate which row and column this slice index corresponds to
      const row = Math.floor(sliceIndex / platformsPerRow);
      const col = sliceIndex % platformsPerRow;

      const cropX = col * platformWidth;
      const cropY = row * platformHeight;

      // Ensure we don't go beyond texture bounds
      if (
        cropX + platformWidth <= fullWidth &&
        cropY + platformHeight <= fullHeight
      ) {
        // Set crop rectangle for a platform-sized area
        this.setCrop(cropX, cropY, platformWidth, platformHeight);

        console.log(
          `Platform slice ${sliceIndex}: crop(${cropX}, ${cropY}, ${platformWidth}, ${platformHeight}) - row=${row}, col=${col} | Full texture: ${fullWidth}x${fullHeight} | Will stretch to: ${this.config.width}x${this.config.height}`
        );
      } else {
        console.warn(
          `Platform slice ${sliceIndex} out of bounds: crop would be (${cropX}, ${cropY}, ${platformWidth}, ${platformHeight}) but texture is only ${fullWidth}x${fullHeight}`
        );
        // Fall back to first slice
        this.setCrop(0, 0, platformWidth, platformHeight);
      }
    } else {
      console.warn("Could not crop joust sprites - texture not found");
    }
  }

  /**
   * Get the platform configuration
   */
  getConfig(): PlatformConfig {
    return { ...this.config };
  }

  /**
   * Update the platform's slice index (change visual appearance)
   */
  setSliceIndex(sliceIndex: number): void {
    this.config.sliceIndex = sliceIndex;
    this.createCrop(sliceIndex);
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

  // Predefined platform configurations
  public static readonly PLATFORM_CONFIGS: Record<string, PlatformConfig> = {
    STONE_PLATFORM: {
      sliceIndex: 0,
      name: "Stone Platform",
      width: 250,
      height: 40,
      tint: 0x808080,
      solid: true,
    },
    METAL_PLATFORM: {
      sliceIndex: 3,
      name: "Metal Platform",
      width: 200,
      height: 35,
      tint: 0x404040,
      solid: true,
    },
    CRYSTAL_PLATFORM: {
      sliceIndex: 7,
      name: "Crystal Platform",
      width: 220,
      height: 38,
      tint: 0x00ffff,
      solid: true,
    },
  };

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
    configKey: keyof typeof PlatformManager.PLATFORM_CONFIGS
  ): Platform {
    const config = PlatformManager.PLATFORM_CONFIGS[configKey];
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
   * Create a visual demonstration of all available slice indices
   */
  createSliceDemo(startX: number, startY: number, spacing: number = 150): void {
    console.log("Creating platform slice demonstration...");

    // With 14 columns and probably 28 rows (double), we have many more platforms available
    const maxSlicesToShow = 28; // Show more slices to demonstrate the 14-column grid

    for (let i = 0; i < maxSlicesToShow; i++) {
      const x = startX + (i % 14) * spacing; // 14 columns per row
      const y = startY + Math.floor(i / 14) * 100; // New row every 14 platforms

      const config: PlatformConfig = {
        sliceIndex: i,
        name: `Slice ${i}`,
        width: 120,
        height: 32,
        solid: true,
      };

      this.createCustomPlatform(x, y, config);

      // Add text label showing slice index
      this.scene.add
        .text(x, y - 50, `Slice ${i}`, {
          fontFamily: "Arial",
          fontSize: 12,
          color: "#ffffff",
          backgroundColor: "#000000",
          padding: { x: 4, y: 2 },
        })
        .setOrigin(0.5);
    }
  }
}
