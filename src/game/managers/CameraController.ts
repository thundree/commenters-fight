import { Scene } from "phaser";
import { getGameDimensions } from "../constants/GameDimensions";

export class CameraController {
  private readonly scene: Scene;
  private controls: Phaser.Cameras.Controls.SmoothedKeyControl | null = null;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  setupCameraControls(): void {
    if (!this.scene.input.keyboard) return;

    const cursors = this.scene.input.keyboard.createCursorKeys();

    const controlConfig = {
      camera: this.scene.cameras.main,
      left: cursors.left,
      right: cursors.right,
      up: cursors.up,
      down: cursors.down,
      acceleration: 0.06,
      drag: 0.0005,
      maxSpeed: 1.0,
    };

    this.controls = new Phaser.Cameras.Controls.SmoothedKeyControl(
      controlConfig
    );

    // Set camera bounds to match dynamic world bounds
    const { worldWidth, worldHeight } = getGameDimensions();
    this.scene.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
  }

  update(delta: number): void {
    if (this.controls) {
      this.controls.update(delta);
    }
  }
}
