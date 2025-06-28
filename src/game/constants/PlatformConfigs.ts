import { PlatformConfig } from "../Platform";
import { getPlatformSizes } from "./GameDimensions";

/**
 * Centralized platform configurations using manually tested crop coordinates from PlatformConfigurator
 * These coordinates were carefully configured and tested to work correctly with the joust-sprites.jpg
 * Display sizes now scale dynamically based on screen size
 * Access platforms by index: PLATFORM_CONFIGS[0], PLATFORM_CONFIGS[1], etc.
 */
function createPlatformConfigs(): PlatformConfig[] {
  const sizes = getPlatformSizes();

  return [
    {
      name: "Platform 1",
      cropX: 80,
      cropY: 0,
      cropWidth: 90,
      cropHeight: 18,
      displayWidth: sizes.medium.width,
      displayHeight: sizes.medium.height,
      tint: 0x808080,
      solid: true,
    },
    {
      name: "Platform 2",
      cropX: 184,
      cropY: 0,
      cropWidth: 180,
      cropHeight: 18,
      displayWidth: sizes.small.width,
      displayHeight: sizes.medium.height,
      tint: 0x404040,
      solid: true,
    },
    {
      name: "Platform 3",
      cropX: 0,
      cropY: 29,
      cropWidth: 120,
      cropHeight: 25,
      displayWidth: sizes.medium.width,
      displayHeight: sizes.medium.height,
      tint: 0x00ffff,
      solid: true,
    },
    {
      name: "Platform 4",
      cropX: 130,
      cropY: 29,
      cropWidth: 95,
      cropHeight: 18,
      displayWidth: sizes.small.width,
      displayHeight: sizes.small.height,
      tint: 0xd2691e,
      solid: true,
    },
    {
      name: "Platform 5",
      cropX: 234,
      cropY: 29,
      cropWidth: 128,
      cropHeight: 18,
      displayWidth: sizes.large.width,
      displayHeight: sizes.small.height,
      tint: 0x8b4513,
      solid: true,
    },
  ];
}

// Generate platform configs dynamically
export const PLATFORM_CONFIGS: PlatformConfig[] = createPlatformConfigs();

/**
 * Get platform configuration by index (no cloning - returns the exact object)
 * Note: Configs are generated dynamically based on current screen size
 */
export function getPlatformConfig(index: number): PlatformConfig {
  // Regenerate configs to get current screen size scaling
  const configs = createPlatformConfigs();

  if (index < 0 || index >= configs.length) {
    throw new Error(
      `Platform index ${index} out of bounds. Available indices: 0-${
        configs.length - 1
      }`
    );
  }
  return configs[index];
}

/**
 * Get the total number of available platform configurations
 */
export function getPlatformConfigCount(): number {
  return PLATFORM_CONFIGS.length;
}

/**
 * Refresh platform configs (useful when window is resized)
 */
export function refreshPlatformConfigs(): void {
  const newConfigs = createPlatformConfigs();
  PLATFORM_CONFIGS.length = 0;
  PLATFORM_CONFIGS.push(...newConfigs);
}
