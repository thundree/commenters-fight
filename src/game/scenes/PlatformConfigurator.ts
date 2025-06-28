import { Scene } from "phaser";

interface PlatformConfig {
  sliceIndex: number;
  name: string;
  width: number;
  height: number;
  tint?: number;
  solid: boolean;
}

export class PlatformConfigurator extends Scene {
  private readonly sliceImages: Phaser.GameObjects.Image[] = [];
  private selectedSlice: number = 0;
  private previewPlatform: Phaser.GameObjects.Image | null = null;
  private configText: Phaser.GameObjects.Text;
  private sliceInfoText: Phaser.GameObjects.Text;
  private fullSpriteImage: Phaser.GameObjects.Image;
  private selectionRect: Phaser.GameObjects.Rectangle;

  // Predefined platform configurations
  private static readonly PLATFORM_CONFIGS: Record<string, PlatformConfig> = {
    STONE_PLATFORM: {
      sliceIndex: 0,
      name: "Stone Platform",
      width: 200,
      height: 32,
      tint: 0x808080,
      solid: true,
    },
    METAL_PLATFORM: {
      sliceIndex: 3,
      name: "Metal Platform",
      width: 150,
      height: 28,
      tint: 0x404040,
      solid: true,
    },
    CRYSTAL_PLATFORM: {
      sliceIndex: 7,
      name: "Crystal Platform",
      width: 180,
      height: 30,
      tint: 0x00ffff,
      solid: true,
    },
  };

  constructor() {
    super("PlatformConfigurator");
  }

  create() {
    this.cameras.main.setBackgroundColor(0x1a1a2e);

    // Title
    this.add
      .text(this.cameras.main.width / 2, 30, "🛠️ Platform Configurator", {
        fontFamily: "Arial",
        fontSize: 24,
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 2,
      })
      .setOrigin(0.5);

    // Check if joust-sprites loaded correctly
    const texture = this.textures.get("joust-sprites");
    if (!texture?.source?.[0]) {
      this.add
        .text(
          this.cameras.main.width / 2,
          100,
          "❌ Error: joust-sprites.jpg not loaded!",
          {
            fontFamily: "Arial",
            fontSize: 16,
            color: "#ff0000",
          }
        )
        .setOrigin(0.5);
      return;
    }

    const fullWidth = texture.source[0].width;
    const fullHeight = texture.source[0].height;

    // Let's analyze the actual sprite layout more carefully
    // From the screenshots, it seems platforms should be much shorter
    // Let's try a different approach - assume platforms are about 64px tall
    const platformsPerRow = 7;
    const assumedPlatformHeight = 64; // Much more reasonable for platforms
    const platformsPerColumn = Math.floor(fullHeight / assumedPlatformHeight); // Calculate how many rows we can fit
    const platformWidth = Math.floor(fullWidth / platformsPerRow);
    const platformHeight = assumedPlatformHeight;

    // Display sprite sheet info
    this.add.text(
      20,
      70,
      [
        `📊 Sprite Sheet Info:`,
        `Total Size: ${fullWidth} x ${fullHeight}px`,
        `Platform Grid: ${platformsPerRow} x ${platformsPerColumn} = ${
          platformsPerRow * platformsPerColumn
        } platforms`,
        `Each Platform: ${platformWidth} x ${platformHeight}px`,
        `Max Platforms: ${
          Math.floor(fullHeight / platformHeight) * platformsPerRow
        }`,
      ],
      {
        fontFamily: "Arial",
        fontSize: 12,
        color: "#ffffff",
        backgroundColor: "#16213e",
        padding: { x: 8, y: 4 },
      }
    );

    // Display full sprite sheet with platform grid indicators
    this.createFullSpriteViewer(
      fullWidth,
      fullHeight,
      platformWidth,
      platformHeight
    );

    // Create platform selector grid
    this.createSliceSelector(platformWidth, platformHeight);

    // Create platform preview area
    this.createPlatformPreview();

    // Create configuration panel
    this.createConfigurationPanel();

    // Create predefined platforms showcase
    this.createPredefinedShowcase();

    // Add controls instructions
    this.add.text(
      20,
      this.cameras.main.height - 100,
      [
        "🎮 Controls:",
        "• Click platform numbers (0-13) to select",
        "• Click on full sprite grid to jump to platform",
        "• ESC: Return to Main Menu",
        "• P: Go to Platform Test Scene",
      ],
      {
        fontFamily: "Arial",
        fontSize: 11,
        color: "#ffffff",
        backgroundColor: "#16213e",
        padding: { x: 6, y: 3 },
      }
    );

    // Add keyboard controls
    if (this.input.keyboard) {
      this.input.keyboard.on("keydown-ESC", () => {
        this.scene.start("MainMenu");
      });

      this.input.keyboard.on("keydown-P", () => {
        this.scene.start("PlatformTest");
      });

      // Number keys 0-9 for quick slice selection
      for (let i = 0; i <= 9; i++) {
        this.input.keyboard.on(`keydown-${i}`, () => {
          this.selectSlice(i);
        });
      }
    }

    // Initialize with slice 0
    this.selectSlice(0);
  }

  private createFullSpriteViewer(
    fullWidth: number,
    fullHeight: number,
    platformWidth: number,
    platformHeight: number
  ): void {
    const scale = Math.min(300 / fullWidth, 150 / fullHeight);
    const displayWidth = fullWidth * scale;
    const displayHeight = fullHeight * scale;

    // Create container for the sprite viewer
    const viewerX = this.cameras.main.width - displayWidth / 2 - 20;
    const viewerY = 120 + displayHeight / 2;

    // Add background
    this.add.rectangle(
      viewerX,
      viewerY,
      displayWidth + 10,
      displayHeight + 10,
      0x000000,
      0.5
    );

    // Display full sprite
    this.fullSpriteImage = this.add.image(viewerX, viewerY, "joust-sprites");
    this.fullSpriteImage.setScale(scale);
    this.fullSpriteImage.setInteractive();

    // Add grid lines to show platform boundaries
    const platformsPerRow = 7;
    const assumedPlatformHeight = 64;
    const platformsPerColumn = Math.floor(fullHeight / assumedPlatformHeight);

    // Vertical lines (column dividers)
    for (let i = 1; i < platformsPerRow; i++) {
      const lineX = viewerX - displayWidth / 2 + i * platformWidth * scale;
      this.add
        .line(
          0,
          0,
          lineX,
          viewerY - displayHeight / 2,
          lineX,
          viewerY + displayHeight / 2,
          0xff0000,
          0.7
        )
        .setLineWidth(1);
    }

    // Horizontal lines (row dividers) - now using fixed 64px height
    for (let i = 1; i <= platformsPerColumn; i++) {
      const lineY =
        viewerY - displayHeight / 2 + i * assumedPlatformHeight * scale;
      if (lineY <= viewerY + displayHeight / 2) {
        // Only draw lines within the sprite bounds
        this.add
          .line(
            0,
            0,
            viewerX - displayWidth / 2,
            lineY,
            viewerX + displayWidth / 2,
            lineY,
            0xff0000,
            0.7
          )
          .setLineWidth(1);
      }
    }

    // Selection rectangle (shows current platform) - using fixed 64px height
    this.selectionRect = this.add.rectangle(
      viewerX - displayWidth / 2,
      viewerY - displayHeight / 2,
      platformWidth * scale,
      assumedPlatformHeight * scale,
      0x00ff00,
      0
    );
    this.selectionRect.setStrokeStyle(2, 0x00ff00);

    // Add click handler for full sprite
    this.fullSpriteImage.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      const localX = pointer.x - (viewerX - displayWidth / 2);
      const localY = pointer.y - (viewerY - displayHeight / 2);

      const col = Math.floor((localX / displayWidth) * platformsPerRow);
      const row = Math.floor((localY / displayHeight) * platformsPerColumn);
      const sliceIndex = row * platformsPerRow + col;

      // Calculate max platforms available
      const maxPlatforms = Math.min(platformsPerRow * platformsPerColumn, 20);

      if (
        sliceIndex >= 0 &&
        sliceIndex < maxPlatforms &&
        col >= 0 &&
        col < platformsPerRow &&
        row >= 0 &&
        row < platformsPerColumn
      ) {
        this.selectSlice(sliceIndex);
      }
    });

    // Add label
    this.add
      .text(
        viewerX,
        viewerY - displayHeight / 2 - 20,
        "Full Sprite Sheet (Click to select platform)",
        {
          fontFamily: "Arial",
          fontSize: 10,
          color: "#ffffff",
        }
      )
      .setOrigin(0.5);
  }

  private createSliceSelector(
    platformWidth: number,
    platformHeight: number
  ): void {
    const startX = 20;
    const startY = 180;
    const buttonSize = 40;
    const spacing = 45;

    // Calculate total platforms available
    const texture = this.textures.get("joust-sprites");
    const fullHeight = texture.source[0].height;
    const platformsPerRow = 7;
    const platformsPerColumn = Math.floor(fullHeight / platformHeight);
    const totalPlatforms = Math.min(platformsPerRow * platformsPerColumn, 20); // Limit to 20 for UI

    this.add.text(
      startX,
      startY - 25,
      `🔢 Platform Selector (0-${totalPlatforms - 1}):`,
      {
        fontFamily: "Arial",
        fontSize: 14,
        color: "#ffffff",
      }
    );

    // Create buttons for each platform
    const maxCols = 7;
    for (let i = 0; i < totalPlatforms; i++) {
      const x = startX + (i % maxCols) * spacing;
      const y = startY + Math.floor(i / maxCols) * (spacing + 10);

      // Create button background
      const button = this.add.rectangle(
        x + buttonSize / 2,
        y + buttonSize / 2,
        buttonSize,
        buttonSize,
        0x333333
      );
      button.setStrokeStyle(2, 0x666666);
      button.setInteractive();

      // Add platform number
      this.add
        .text(x + buttonSize / 2, y + buttonSize / 2, i.toString(), {
          fontFamily: "Arial",
          fontSize: 12,
          color: "#ffffff",
        })
        .setOrigin(0.5);

      // Create cropped preview of the platform using grid coordinates
      const row = Math.floor(i / platformsPerRow);
      const col = i % platformsPerRow;
      const cropX = col * platformWidth;
      const cropY = row * platformHeight;

      const preview = this.add.image(
        x + buttonSize / 2,
        y + buttonSize / 2 - 8,
        "joust-sprites"
      );
      preview.setCrop(cropX, cropY, platformWidth, platformHeight);
      preview.setDisplaySize(buttonSize - 8, 16);

      // Store button index for selection
      button.setData("sliceIndex", i);

      // Click handler
      button.on("pointerdown", () => {
        this.selectSlice(i);
      });

      // Hover effects
      button.on("pointerover", () => {
        button.setFillStyle(0x555555);
        this.updateSliceInfo(i);
      });

      button.on("pointerout", () => {
        if (this.selectedSlice !== i) {
          button.setFillStyle(0x333333);
        }
      });

      this.sliceImages.push(preview);
    }

    // Platform info display
    this.sliceInfoText = this.add.text(startX, startY + 160, "", {
      fontFamily: "Arial",
      fontSize: 11,
      color: "#ffff00",
      backgroundColor: "#000000",
      padding: { x: 4, y: 2 },
    });
  }

  private createPlatformPreview(): void {
    const previewX = this.cameras.main.width / 2;
    const previewY = 350;

    this.add
      .text(previewX, previewY - 50, "🎯 Platform Preview", {
        fontFamily: "Arial",
        fontSize: 16,
        color: "#ffffff",
      })
      .setOrigin(0.5);

    // Preview area background
    this.add.rectangle(previewX, previewY, 300, 100, 0x16213e, 0.8);
    this.add
      .rectangle(previewX, previewY, 300, 100, 0x00ffff, 0)
      .setStrokeStyle(2, 0x00ffff);

    // This will be updated when slice is selected
    this.previewPlatform = this.add.image(previewX, previewY, "joust-sprites");
  }

  private createConfigurationPanel(): void {
    const panelX = this.cameras.main.width / 2;
    const panelY = 480;

    this.add
      .text(panelX, panelY - 30, "⚙️ Configuration", {
        fontFamily: "Arial",
        fontSize: 16,
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.configText = this.add
      .text(panelX, panelY, "", {
        fontFamily: "Arial",
        fontSize: 12,
        color: "#ffffff",
        backgroundColor: "#16213e",
        padding: { x: 8, y: 6 },
        align: "center",
      })
      .setOrigin(0.5);
  }

  private createPredefinedShowcase(): void {
    const showcaseY = 580;
    const spacing = 180;

    this.add
      .text(
        this.cameras.main.width / 2,
        showcaseY - 30,
        "🏗️ Predefined Platform Types",
        {
          fontFamily: "Arial",
          fontSize: 16,
          color: "#ffffff",
        }
      )
      .setOrigin(0.5);

    const configs = Object.entries(PlatformConfigurator.PLATFORM_CONFIGS);
    configs.forEach(([, config], index) => {
      const x = 150 + index * spacing;

      // Create example platform using grid-based cropping
      const platform = this.add.image(x, showcaseY, "joust-sprites");

      // Calculate grid position for this slice index
      const texture = this.textures.get("joust-sprites");
      const fullWidth = texture.source[0].width;
      const fullHeight = texture.source[0].height;
      const platformsPerRow = 7;
      const platformWidth = Math.floor(fullWidth / platformsPerRow);
      const platformHeight = Math.floor(fullHeight / 2);

      const row = Math.floor(config.sliceIndex / platformsPerRow);
      const col = config.sliceIndex % platformsPerRow;
      const cropX = col * platformWidth;
      const cropY = row * platformHeight;

      platform.setCrop(cropX, cropY, platformWidth, platformHeight);
      platform.setDisplaySize(config.width * 0.5, config.height * 0.8);
      if (config.tint) {
        platform.setTint(config.tint);
      }

      // Add label
      this.add
        .text(
          x,
          showcaseY + 40,
          [
            config.name,
            `Platform: ${config.sliceIndex}`,
            `Size: ${config.width}x${config.height}`,
          ],
          {
            fontFamily: "Arial",
            fontSize: 10,
            color: "#ffffff",
            align: "center",
          }
        )
        .setOrigin(0.5);

      // Make it clickable to select that platform
      platform.setInteractive();
      platform.on("pointerdown", () => {
        this.selectSlice(config.sliceIndex);
      });
    });
  }

  private selectSlice(index: number): void {
    // Calculate dynamic platform count
    const spriteTexture = this.textures.get("joust-sprites");
    const spriteFullHeight = spriteTexture.source[0].height;
    const spriteFullWidth = spriteTexture.source[0].width;
    const spritePlatformsPerRow = 7;
    const assumedPlatformHeight = 64;
    const spritePlatformsPerColumn = Math.floor(
      spriteFullHeight / assumedPlatformHeight
    );
    const maxPlatforms = Math.min(
      spritePlatformsPerRow * spritePlatformsPerColumn,
      20
    );

    if (index < 0 || index >= maxPlatforms) return;

    this.selectedSlice = index;

    // Update platform selector buttons
    this.children.list.forEach((child) => {
      if (
        child.type === "Rectangle" &&
        child.getData("sliceIndex") !== undefined
      ) {
        const buttonIndex = child.getData("sliceIndex");
        if (buttonIndex === index) {
          (child as Phaser.GameObjects.Rectangle).setFillStyle(0x00ff00);
        } else {
          (child as Phaser.GameObjects.Rectangle).setFillStyle(0x333333);
        }
      }
    });

    // Calculate platform dimensions
    const spritePlatformWidth = Math.floor(
      spriteFullWidth / spritePlatformsPerRow
    );
    const spritePlatformHeight = assumedPlatformHeight;

    // Update selection rectangle on full sprite using grid coordinates
    const row = Math.floor(index / spritePlatformsPerRow);
    const col = index % spritePlatformsPerRow;

    const scale = Math.min(300 / spriteFullWidth, 150 / spriteFullHeight);
    const displayWidth = spriteFullWidth * scale;
    const displayHeight = spriteFullHeight * scale;

    const viewerX = this.cameras.main.width - displayWidth / 2 - 20;
    const viewerY = 120 + displayHeight / 2;

    // Position selection rectangle at the correct grid position
    this.selectionRect.x =
      viewerX -
      displayWidth / 2 +
      col * spritePlatformWidth * scale +
      (spritePlatformWidth * scale) / 2;
    this.selectionRect.y =
      viewerY -
      displayHeight / 2 +
      row * spritePlatformHeight * scale +
      (spritePlatformHeight * scale) / 2;

    // Update the selection rectangle size to match the new platform dimensions
    this.selectionRect.setSize(
      spritePlatformWidth * scale,
      spritePlatformHeight * scale
    );

    // Update platform preview using grid-based cropping
    if (this.previewPlatform) {
      const cropX = col * spritePlatformWidth;
      const cropY = row * spritePlatformHeight;
      this.previewPlatform.setCrop(
        cropX,
        cropY,
        spritePlatformWidth,
        spritePlatformHeight
      );
      this.previewPlatform.setDisplaySize(200, 40);
    }

    // Update configuration text
    this.updateConfigurationText(index);
    this.updateSliceInfo(index);
  }

  private updateSliceInfo(index: number): void {
    const infoTexture = this.textures.get("joust-sprites");
    const infoFullWidth = infoTexture.source[0].width;
    const infoFullHeight = infoTexture.source[0].height;

    const infoPlatformsPerRow = 7;
    const assumedPlatformHeight = 64;
    const infoPlatformsPerColumn = Math.floor(
      infoFullHeight / assumedPlatformHeight
    );
    const infoPlatformWidth = Math.floor(infoFullWidth / infoPlatformsPerRow);
    const infoPlatformHeight = assumedPlatformHeight;

    const row = Math.floor(index / infoPlatformsPerRow);
    const col = index % infoPlatformsPerRow;
    const cropX = col * infoPlatformWidth;
    const cropY = row * infoPlatformHeight;

    this.sliceInfoText.setText([
      `Platform ${index} (Row ${row}, Col ${col}):`,
      `Position: ${cropX}, ${cropY}`,
      `Size: ${infoPlatformWidth} x ${infoPlatformHeight}px`,
      `Grid: ${infoPlatformsPerRow} columns x ${infoPlatformsPerColumn} rows`,
      `Fixed Height: ${assumedPlatformHeight}px (was ${Math.floor(
        infoFullHeight / 2
      )}px)`,
    ]);
  }

  private updateConfigurationText(index: number): void {
    const configPlatformsPerRow = 7;
    const row = Math.floor(index / configPlatformsPerRow);
    const col = index % configPlatformsPerRow;

    const exampleConfig = `{
  sliceIndex: ${index},
  name: "Platform ${index} (Row ${row}, Col ${col})",
  width: 200,
  height: 32,
  tint: 0xffffff,
  solid: true
}`;

    const codeExample = `// Create platform using FIXED grid-based slice ${index}
// Now crops 64px tall platforms instead of 256px!
const config = ${exampleConfig.replace(/\n/g, "\n  ")};
const platform = new Platform(scene, x, y, config);

// Or use PlatformManager:
const manager = new PlatformManager(scene);
const platform2 = manager.createCustomPlatform(x, y, config);`;

    this.configText.setText([
      `Selected Platform: ${index} (Row ${row}, Col ${col})`,
      "",
      "✅ FIXED: Platform height reduced from 256px to 64px",
      "✅ FIXED: Now crops proper platform rectangles",
      "❌ Old: 608x512 ÷ 7x2 = 86x256px (too tall!)",
      "✅ New: 608x512 with 64px height = 86x64px",
      "",
      "Configuration Example:",
      exampleConfig,
      "",
      "Usage Example:",
      codeExample,
    ]);
  }
}
