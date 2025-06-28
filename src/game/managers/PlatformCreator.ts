import { PlatformManager } from "../Platform";
import {
  getGameDimensions,
  getPlatformSizes,
  PLATFORM_LAYERS,
} from "../constants/GameDimensions";

export class PlatformCreator {
  private readonly platformManager: PlatformManager;

  constructor(platformManager: PlatformManager) {
    this.platformManager = platformManager;
  }

  createGamePlatforms(): void {
    const { worldHeight } = getGameDimensions();

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

    console.log(
      `Created strategic platform layout across the world (${worldHeight}h)`
    );
  }

  private createBottomPlatforms(worldHeight: number): void {
    // Use responsive positioning based on percentage of world width
    const positions = [
      { x: 0.075, y: worldHeight - worldHeight * PLATFORM_LAYERS.ground }, // 7.5% from left
      { x: 0.25, y: worldHeight - worldHeight * PLATFORM_LAYERS.ground }, // 25% from left
      { x: 0.425, y: worldHeight - worldHeight * PLATFORM_LAYERS.ground }, // 42.5% from left
      { x: 0.6, y: worldHeight - worldHeight * PLATFORM_LAYERS.ground }, // 60% from left
      { x: 0.775, y: worldHeight - worldHeight * PLATFORM_LAYERS.ground }, // 77.5% from left
      { x: 0.925, y: worldHeight - worldHeight * PLATFORM_LAYERS.ground }, // 92.5% from left
    ];

    const { worldWidth } = getGameDimensions();

    positions.forEach((pos, index) => {
      this.platformManager.createPlatform(
        pos.x * worldWidth,
        pos.y,
        index % 5 // Cycle through platform types
      );
    });
  }

  private createLowerMidPlatforms(worldHeight: number): void {
    this.platformManager.createPlatform(75, worldHeight - 250, 3);
    this.platformManager.createPlatform(325, worldHeight - 200, 0);
    this.platformManager.createPlatform(675, worldHeight - 280, 4);
    this.platformManager.createPlatform(1025, worldHeight - 220, 2);
    this.platformManager.createPlatform(1375, worldHeight - 260, 1);
    this.platformManager.createPlatform(1725, worldHeight - 210, 3);
  }

  private createMidLevelPlatforms(worldHeight: number): void {
    this.platformManager.createPlatform(200, worldHeight - 400, 4);
    this.platformManager.createPlatform(550, worldHeight - 450, 2);
    this.platformManager.createPlatform(900, worldHeight - 380, 3);
    this.platformManager.createPlatform(1250, worldHeight - 420, 1);
    this.platformManager.createPlatform(1600, worldHeight - 390, 0);
  }

  private createUpperPlatforms(worldHeight: number): void {
    this.platformManager.createPlatform(100, worldHeight - 600, 2);
    this.platformManager.createPlatform(450, worldHeight - 650, 4);
    this.platformManager.createPlatform(800, worldHeight - 580, 3);
    this.platformManager.createPlatform(1150, worldHeight - 620, 1);
    this.platformManager.createPlatform(1500, worldHeight - 590, 0);
    this.platformManager.createPlatform(1850, worldHeight - 630, 2);
  }

  private createHighPlatforms(worldHeight: number): void {
    this.platformManager.createPlatform(275, worldHeight - 800, 3);
    this.platformManager.createPlatform(625, worldHeight - 850, 4);
    this.platformManager.createPlatform(975, worldHeight - 780, 2);
    this.platformManager.createPlatform(1325, worldHeight - 820, 1);
    this.platformManager.createPlatform(1675, worldHeight - 790, 0);
  }

  private createTopPlatforms(worldHeight: number): void {
    this.platformManager.createPlatform(400, worldHeight - 1000, 4); // Bridge Platform
    this.platformManager.createPlatform(800, worldHeight - 1050, 3); // Wooden Platform
    this.platformManager.createPlatform(1200, worldHeight - 980, 2); // Crystal Platform
    this.platformManager.createPlatform(1600, worldHeight - 1020, 1); // Metal Platform
  }

  private createSpecialPlatforms(worldHeight: number): void {
    // Use the wooden and bridge platform types (using indices)
    this.platformManager.createPlatform(1000, worldHeight - 1200, 3); // Wooden Platform
    this.platformManager.createPlatform(500, worldHeight - 1150, 4); // Bridge Platform

    // Create a custom golden platform using Platform 1 as base with dynamic sizing
    const { worldWidth } = getGameDimensions();
    const platformSizes = getPlatformSizes();

    this.platformManager.createCustomPlatform(
      Math.min(1500, worldWidth * 0.75),
      worldHeight - 1180,
      {
        name: "Golden Platform",
        cropX: 80, // Same as Platform 1
        cropY: 0,
        cropWidth: 90,
        cropHeight: 18,
        displayWidth: platformSizes.extraLarge.width,
        displayHeight: platformSizes.medium.height,
        tint: 0xffd700, // Gold tint
        solid: true,
      }
    );
  }
}
