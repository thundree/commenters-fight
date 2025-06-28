import { Scene } from "phaser";
import { PlatformConfig } from "../Platform";
import { PLATFORM_CONFIGS } from "../constants/PlatformConfigs";

export class PlatformConfigurator extends Scene {
  private selectedPlatform: number = 0;
  private previewPlatform: Phaser.GameObjects.Image | null = null;
  private configText: Phaser.GameObjects.Text;
  private positionText: Phaser.GameObjects.Text;
  private fullSpriteImage: Phaser.GameObjects.Image;
  private selectionRect: Phaser.GameObjects.Rectangle;
  private readonly platformButtons: Phaser.GameObjects.Container[] = [];

  private readonly platformConfigs: PlatformConfig[] =
    Object.values(PLATFORM_CONFIGS);

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

    // Display sprite sheet info
    this.add.text(
      20,
      70,
      [
        `📊 Sprite Sheet Info:`,
        `Total Size: ${fullWidth} x ${fullHeight}px`,
        `Configuring ${this.platformConfigs.length} Manual Platform Types`,
        `Adjust cropX, cropY, cropWidth, cropHeight in code`,
      ],
      {
        fontFamily: "Arial",
        fontSize: 12,
        color: "#ffffff",
        backgroundColor: "#16213e",
        padding: { x: 8, y: 4 },
      }
    );

    // Display full sprite sheet with selection overlay
    this.createFullSpriteViewer(fullWidth, fullHeight);

    // Create platform selector buttons (3 platforms)
    this.createPlatformSelector();

    // Create platform preview area
    this.createPlatformPreview();

    // Create configuration panel
    this.createConfigurationPanel();

    // Add controls instructions
    this.add.text(
      20,
      this.cameras.main.height - 100,
      [
        "🎮 Controls:",
        "• Click Platform buttons or use keys 1-5 to select",
        "• ESC: Return to Main Menu",
        "• P: Go to Platform Test Scene",
        "• Adjust crop values in code to position selections",
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

      // Number keys 1-5 for platform selection
      for (let i = 1; i <= this.platformConfigs.length; i++) {
        this.input.keyboard.on(`keydown-${i}`, () => {
          this.selectPlatform(i - 1);
        });
      }
    }

    // Initialize with platform 0
    this.selectPlatform(0);
  }

  private createFullSpriteViewer(fullWidth: number, fullHeight: number): void {
    const scale = Math.min(800 / fullWidth, 400 / fullHeight); // Doubled from 400/200 to 800/400
    const displayWidth = fullWidth * scale;
    const displayHeight = fullHeight * scale;

    // Create container for the sprite viewer
    const viewerX = this.cameras.main.width - displayWidth / 2 - 20;
    const viewerY = 150 + displayHeight / 2;

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

    // Selection rectangle (shows current platform crop area)
    this.selectionRect = this.add.rectangle(
      viewerX - displayWidth / 2,
      viewerY - displayHeight / 2,
      50 * scale,
      50 * scale,
      0x00ff00,
      0
    );
    this.selectionRect.setStrokeStyle(2, 0x00ff00);

    // Add label
    this.add
      .text(
        viewerX,
        viewerY - displayHeight / 2 - 20,
        "Full Sprite Sheet (Green box shows crop area)",
        {
          fontFamily: "Arial",
          fontSize: 10,
          color: "#ffffff",
        }
      )
      .setOrigin(0.5);
  }

  private createPlatformSelector(): void {
    const startX = 20;
    const startY = 200;
    const buttonWidth = 120;
    const buttonHeight = 60;
    const spacing = 140;

    this.add.text(startX, startY - 25, "🔢 Platform Types:", {
      fontFamily: "Arial",
      fontSize: 14,
      color: "#ffffff",
    });

    // Create buttons for each platform
    for (let i = 0; i < this.platformConfigs.length; i++) {
      const config = this.platformConfigs[i];
      const x = startX + i * spacing;
      const y = startY;

      // Create button container
      const container = this.add.container(x, y);

      // Create button background
      const button = this.add.rectangle(
        buttonWidth / 2,
        buttonHeight / 2,
        buttonWidth,
        buttonHeight,
        0x333333
      );
      button.setStrokeStyle(2, 0x666666);
      button.setInteractive();

      // Add platform name
      const nameText = this.add
        .text(buttonWidth / 2, buttonHeight / 2 - 15, config.name, {
          fontFamily: "Arial",
          fontSize: 12,
          color: "#ffffff",
        })
        .setOrigin(0.5);

      // Create cropped preview of the platform
      const preview = this.add.image(
        buttonWidth / 2,
        buttonHeight / 2 + 5,
        "joust-sprites"
      );
      preview.setCrop(
        config.cropX,
        config.cropY,
        config.cropWidth,
        config.cropHeight
      );
      preview.setDisplaySize(buttonWidth - 20, 20);

      container.add([button, nameText, preview]);

      // Store button index for selection
      button.setData("platformIndex", i);

      // Click handler
      button.on("pointerdown", () => {
        this.selectPlatform(i);
      });

      // Hover effects
      button.on("pointerover", () => {
        button.setFillStyle(0x555555);
      });

      button.on("pointerout", () => {
        if (this.selectedPlatform !== i) {
          button.setFillStyle(0x333333);
        }
      });

      this.platformButtons.push(container);
    }

    // Position info display
    this.positionText = this.add.text(startX, startY + 100, "", {
      fontFamily: "Arial",
      fontSize: 11,
      color: "#ffff00",
      backgroundColor: "#000000",
      padding: { x: 4, y: 2 },
    });
  }

  private createPlatformPreview(): void {
    const previewX = this.cameras.main.width / 2;
    const previewY = 400;

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

    // This will be updated when platform is selected
    this.previewPlatform = this.add.image(previewX, previewY, "joust-sprites");
  }

  private createConfigurationPanel(): void {
    const panelX = this.cameras.main.width / 2;
    const panelY = 530;

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

  private selectPlatform(index: number): void {
    if (index < 0 || index >= this.platformConfigs.length) return;

    this.selectedPlatform = index;
    const config = this.platformConfigs[index];

    // Update platform selector buttons
    this.platformButtons.forEach((container, i) => {
      const button = container.list[0] as Phaser.GameObjects.Rectangle;
      if (i === index) {
        button.setFillStyle(0x00ff00);
      } else {
        button.setFillStyle(0x333333);
      }
    });

    // Get sprite dimensions for calculating scale
    const texture = this.textures.get("joust-sprites");
    const fullWidth = texture.source[0].width;
    const fullHeight = texture.source[0].height;
    const scale = Math.min(800 / fullWidth, 400 / fullHeight); // Doubled from 400/200 to 800/400

    // Update selection rectangle on full sprite
    const displayWidth = fullWidth * scale;
    const displayHeight = fullHeight * scale;
    const viewerX = this.cameras.main.width - displayWidth / 2 - 20;
    const viewerY = 150 + displayHeight / 2;

    this.selectionRect.x =
      viewerX -
      displayWidth / 2 +
      config.cropX * scale +
      (config.cropWidth * scale) / 2;
    this.selectionRect.y =
      viewerY -
      displayHeight / 2 +
      config.cropY * scale +
      (config.cropHeight * scale) / 2;
    this.selectionRect.setSize(
      config.cropWidth * scale,
      config.cropHeight * scale
    );

    // Update platform preview
    if (this.previewPlatform) {
      this.previewPlatform.setCrop(
        config.cropX,
        config.cropY,
        config.cropWidth,
        config.cropHeight
      );
      // Use the configured display size to show how it will look in game
      this.previewPlatform.setDisplaySize(
        config.displayWidth,
        config.displayHeight
      );
      if (config.tint) {
        this.previewPlatform.setTint(config.tint);
      } else {
        this.previewPlatform.clearTint();
      }
    }

    // Update configuration text
    this.updateConfigurationText(index);
    this.updatePositionInfo(index);
  }

  private updatePositionInfo(index: number): void {
    const config = this.platformConfigs[index];

    this.positionText.setText([
      `${config.name} Position Info:`,
      `Crop X: ${config.cropX}px`,
      `Crop Y: ${config.cropY}px`,
      `Crop Width: ${config.cropWidth}px`,
      `Crop Height: ${config.cropHeight}px`,
      `Display: ${config.displayWidth}x${config.displayHeight}px`,
    ]);
  }

  private updateConfigurationText(index: number): void {
    const config = this.platformConfigs[index];

    const exampleConfig = `{
  name: "${config.name}",
  cropX: ${config.cropX},
  cropY: ${config.cropY}, 
  cropWidth: ${config.cropWidth},
  cropHeight: ${config.cropHeight},
  displayWidth: ${config.displayWidth},
  displayHeight: ${config.displayHeight},
  tint: ${config.tint ? "0x" + config.tint.toString(16) : "undefined"},
  solid: ${config.solid}
}`;

    const codeExample = `// Create platform using manual crop coordinates
const config = ${exampleConfig.replace(/\n/g, "\n  ")};
const platform = new Platform(scene, x, y, config);

// Adjust cropX, cropY, cropWidth, cropHeight values
// in the platformConfigs array to position the selection correctly!`;

    this.configText.setText([
      `Selected: ${config.name}`,
      "",
      "💡 To adjust crop position:",
      "1. Edit platformConfigs array in code",
      "2. Modify cropX, cropY, cropWidth, cropHeight",
      "3. Modify displayWidth, displayHeight for stretching",
      "4. Reload to see changes",
      "",
      `🔍 Current: Crop ${config.cropWidth}x${config.cropHeight} → Display ${config.displayWidth}x${config.displayHeight}`,
      `📏 Stretch Factor: X=${(config.displayWidth / config.cropWidth).toFixed(
        2
      )}x, Y=${(config.displayHeight / config.cropHeight).toFixed(2)}x`,
      "",
      "Configuration:",
      exampleConfig,
      "",
      "Usage Example:",
      codeExample,
    ]);
  }
}
