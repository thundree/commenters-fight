import { PlatformConfig } from "../Platform";

/**
 * Centralized platform configurations using manually tested crop coordinates from PlatformConfigurator
 * These coordinates were carefully configured and tested to work correctly with the joust-sprites.jpg
 * Access platforms by index: PLATFORM_CONFIGS[0], PLATFORM_CONFIGS[1], etc.
 */
export const PLATFORM_CONFIGS: PlatformConfig[] = [
  {
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
  {
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
  {
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
  {
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
  {
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
];

/**
 * Get platform configuration by index (no cloning - returns the exact object)
 */
export function getPlatformConfig(index: number): PlatformConfig {
  if (index < 0 || index >= PLATFORM_CONFIGS.length) {
    throw new Error(
      `Platform index ${index} out of bounds. Available indices: 0-${
        PLATFORM_CONFIGS.length - 1
      }`
    );
  }
  return PLATFORM_CONFIGS[index];
}

/**
 * Get the total number of available platform configurations
 */
export function getPlatformConfigCount(): number {
  return PLATFORM_CONFIGS.length;
}
