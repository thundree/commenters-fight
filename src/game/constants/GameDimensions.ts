/**
 * Centralized game dimension constants that scale based on window size
 * This replaces magic numbers throughout the codebase
 */

export interface GameDimensions {
  /** Base world width for calculations */
  worldWidth: number;
  /** Base world height for calculations */
  worldHeight: number;
  /** Scale factor for platforms based on screen size */
  platformScale: number;
  /** Scale factor for UI elements */
  uiScale: number;
}

/**
 * Calculate game dimensions based on current window size
 * Uses a base resolution of 1920x1080 as reference
 */
export function calculateGameDimensions(): GameDimensions {
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  // Base reference resolution (1080p)
  const BASE_WIDTH = 1920;
  const BASE_HEIGHT = 1080;

  // Calculate scaling factors
  const widthScale = windowWidth / BASE_WIDTH;
  const heightScale = windowHeight / BASE_HEIGHT;
  const minScale = Math.min(widthScale, heightScale);
  const avgScale = (widthScale + heightScale) / 2;

  // World should be larger than screen for camera movement
  // Scale the world size based on window size but maintain aspect ratio
  const worldWidth = Math.max(windowWidth * 1.5, BASE_WIDTH);
  const worldHeight = Math.max(windowHeight * 1.5, BASE_HEIGHT);

  return {
    worldWidth,
    worldHeight,
    platformScale: Math.max(0.5, Math.min(2.0, avgScale)), // Clamp between 0.5x and 2x
    uiScale: Math.max(0.7, Math.min(1.5, minScale)), // More conservative UI scaling
  };
}

/**
 * Get current game dimensions (calculates on each call)
 */
export function getGameDimensions(): GameDimensions {
  return calculateGameDimensions();
}

/**
 * Platform size constants that scale with screen size
 */
export function getPlatformSizes(scale: number = 1) {
  const baseScale = getGameDimensions().platformScale * scale;

  return {
    small: {
      width: Math.round(180 * baseScale),
      height: Math.round(30 * baseScale),
    },
    medium: {
      width: Math.round(220 * baseScale),
      height: Math.round(35 * baseScale),
    },
    large: {
      width: Math.round(280 * baseScale),
      height: Math.round(40 * baseScale),
    },
    extraLarge: {
      width: Math.round(320 * baseScale),
      height: Math.round(45 * baseScale),
    },
  };
}

/**
 * Sprite viewer dimensions for platform configurator
 */
export function getSpriteViewerDimensions() {
  const { uiScale } = getGameDimensions();
  return {
    maxWidth: Math.round(800 * uiScale),
    maxHeight: Math.round(400 * uiScale),
    previewWidth: Math.round(300 * uiScale),
    previewHeight: Math.round(100 * uiScale),
  };
}

/**
 * Platform positioning utilities for responsive layout
 */
export interface PositionConfig {
  /** Horizontal position as percentage of world width (0-1) */
  x: number;
  /** Vertical position as percentage from bottom of world (0-1) */
  yFromBottom: number;
}

/**
 * Convert relative position to absolute coordinates
 */
export function getAbsolutePosition(config: PositionConfig): {
  x: number;
  y: number;
} {
  const { worldWidth, worldHeight } = getGameDimensions();

  return {
    x: worldWidth * config.x,
    y: worldHeight - worldHeight * config.yFromBottom,
  };
}

/**
 * Get common platform layer heights (as percentages from bottom)
 */
export const PLATFORM_LAYERS = {
  ground: 0.05, // 5% from bottom
  lowerMid: 0.16, // 16% from bottom
  mid: 0.28, // 28% from bottom
  upper: 0.42, // 42% from bottom
  high: 0.58, // 58% from bottom
  top: 0.75, // 75% from bottom
  special: 0.88, // 88% from bottom
} as const;
