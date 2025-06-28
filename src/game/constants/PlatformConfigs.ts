import { PlatformConfig } from "../Platform";

/**
 * Centralized platform configurations using manually tested crop coordinates from PlatformConfigurator
 * These coordinates were carefully configured and tested to work correctly with the joust-sprites.jpg
 */
export const PLATFORM_CONFIGS: Record<string, PlatformConfig> = {
  STONE_PLATFORM: {
    name: "Platform 1",
    cropX: 80,
    cropY: 0,
    cropWidth: 90,
    cropHeight: 18,
    displayWidth: 250,
    displayHeight: 40,
    tint: 0x808080,
    solid: true,
  },
  METAL_PLATFORM: {
    name: "Platform 2",
    cropX: 184,
    cropY: 0,
    cropWidth: 180,
    cropHeight: 18,
    displayWidth: 200,
    displayHeight: 40,
    tint: 0x404040,
    solid: true,
  },
  CRYSTAL_PLATFORM: {
    name: "Platform 3",
    cropX: 0,
    cropY: 29,
    cropWidth: 120,
    cropHeight: 25,
    displayWidth: 220,
    displayHeight: 40,
    tint: 0x00ffff,
    solid: true,
  },
  WOODEN_PLATFORM: {
    name: "Platform 4",
    cropX: 130,
    cropY: 29,
    cropWidth: 95,
    cropHeight: 18,
    displayWidth: 200,
    displayHeight: 35,
    tint: 0xd2691e,
    solid: true,
  },
  BRIDGE_PLATFORM: {
    name: "Platform 5",
    cropX: 234,
    cropY: 29,
    cropWidth: 128,
    cropHeight: 18,
    displayWidth: 280,
    displayHeight: 35,
    tint: 0x8b4513,
    solid: true,
  },
};

/**
 * Get platform configuration by key (no cloning - returns the exact object)
 */
export function getPlatformConfig(
  configKey: keyof typeof PLATFORM_CONFIGS
): PlatformConfig {
  return PLATFORM_CONFIGS[configKey];
}

/**
 * Get all available platform configuration keys
 */
export function getPlatformConfigKeys(): string[] {
  return Object.keys(PLATFORM_CONFIGS);
}
