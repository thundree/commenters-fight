import { PlatformManager } from "../Platform";

export class PlatformCreator {
  private readonly platformManager: PlatformManager;

  constructor(platformManager: PlatformManager) {
    this.platformManager = platformManager;
  }

  createGamePlatforms(): void {
    const worldHeight = 1536;

    // Bottom platforms (ground level)
    this.createBottomPlatforms(worldHeight);

    // Lower-mid platforms
    this.createLowerMidPlatforms(worldHeight);

    // Mid-level platforms
    this.createMidLevelPlatforms(worldHeight);

    // Upper platforms
    this.createUpperPlatforms(worldHeight);

    // High platforms (strategic positions)
    this.createHighPlatforms(worldHeight);

    // Top platforms (hardest to reach)
    this.createTopPlatforms(worldHeight);

    // Special custom platforms
    this.createSpecialPlatforms(worldHeight);

    console.log("Created strategic platform layout across the world");
  }

  private createBottomPlatforms(worldHeight: number): void {
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
      "WOODEN_PLATFORM"
    );
    this.platformManager.createPlatform(
      1550,
      worldHeight - 80,
      "BRIDGE_PLATFORM"
    );
    this.platformManager.createPlatform(
      1850,
      worldHeight - 80,
      "CRYSTAL_PLATFORM"
    );
  }

  private createLowerMidPlatforms(worldHeight: number): void {
    this.platformManager.createPlatform(
      75,
      worldHeight - 250,
      "WOODEN_PLATFORM"
    );
    this.platformManager.createPlatform(
      325,
      worldHeight - 200,
      "STONE_PLATFORM"
    );
    this.platformManager.createPlatform(
      675,
      worldHeight - 280,
      "BRIDGE_PLATFORM"
    );
    this.platformManager.createPlatform(
      1025,
      worldHeight - 220,
      "CRYSTAL_PLATFORM"
    );
    this.platformManager.createPlatform(
      1375,
      worldHeight - 260,
      "METAL_PLATFORM"
    );
    this.platformManager.createPlatform(
      1725,
      worldHeight - 210,
      "WOODEN_PLATFORM"
    );
  }

  private createMidLevelPlatforms(worldHeight: number): void {
    this.platformManager.createPlatform(
      200,
      worldHeight - 400,
      "BRIDGE_PLATFORM"
    );
    this.platformManager.createPlatform(
      550,
      worldHeight - 450,
      "CRYSTAL_PLATFORM"
    );
    this.platformManager.createPlatform(
      900,
      worldHeight - 380,
      "WOODEN_PLATFORM"
    );
    this.platformManager.createPlatform(
      1250,
      worldHeight - 420,
      "METAL_PLATFORM"
    );
    this.platformManager.createPlatform(
      1600,
      worldHeight - 390,
      "STONE_PLATFORM"
    );
  }

  private createUpperPlatforms(worldHeight: number): void {
    this.platformManager.createPlatform(
      100,
      worldHeight - 600,
      "CRYSTAL_PLATFORM"
    );
    this.platformManager.createPlatform(
      450,
      worldHeight - 650,
      "BRIDGE_PLATFORM"
    );
    this.platformManager.createPlatform(
      800,
      worldHeight - 580,
      "WOODEN_PLATFORM"
    );
    this.platformManager.createPlatform(
      1150,
      worldHeight - 620,
      "METAL_PLATFORM"
    );
    this.platformManager.createPlatform(
      1500,
      worldHeight - 590,
      "STONE_PLATFORM"
    );
    this.platformManager.createPlatform(
      1850,
      worldHeight - 630,
      "CRYSTAL_PLATFORM"
    );
  }

  private createHighPlatforms(worldHeight: number): void {
    this.platformManager.createPlatform(
      275,
      worldHeight - 800,
      "WOODEN_PLATFORM"
    );
    this.platformManager.createPlatform(
      625,
      worldHeight - 850,
      "BRIDGE_PLATFORM"
    );
    this.platformManager.createPlatform(
      975,
      worldHeight - 780,
      "CRYSTAL_PLATFORM"
    );
    this.platformManager.createPlatform(
      1325,
      worldHeight - 820,
      "METAL_PLATFORM"
    );
    this.platformManager.createPlatform(
      1675,
      worldHeight - 790,
      "STONE_PLATFORM"
    );
  }

  private createTopPlatforms(worldHeight: number): void {
    this.platformManager.createPlatform(
      400,
      worldHeight - 1000,
      "BRIDGE_PLATFORM"
    );
    this.platformManager.createPlatform(
      800,
      worldHeight - 1050,
      "WOODEN_PLATFORM"
    );
    this.platformManager.createPlatform(
      1200,
      worldHeight - 980,
      "CRYSTAL_PLATFORM"
    );
    this.platformManager.createPlatform(
      1600,
      worldHeight - 1020,
      "METAL_PLATFORM"
    );
  }

  private createSpecialPlatforms(worldHeight: number): void {
    // Use the new wooden and bridge platform types (manually configured in PlatformConfigurator)
    this.platformManager.createPlatform(
      1000,
      worldHeight - 1200,
      "WOODEN_PLATFORM"
    );
    this.platformManager.createPlatform(
      500,
      worldHeight - 1150,
      "BRIDGE_PLATFORM"
    );

    // Create a custom golden platform using Platform 1 as base
    this.platformManager.createCustomPlatform(1500, worldHeight - 1180, {
      name: "Golden Platform",
      cropX: 80, // Same as Platform 1
      cropY: 0,
      cropWidth: 90,
      cropHeight: 18,
      displayWidth: 300,
      displayHeight: 40,
      tint: 0xffd700, // Gold tint
      solid: true,
    });
  }
}
