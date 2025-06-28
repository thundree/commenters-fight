import { Scene } from "phaser";

export interface PlayerData {
  nextFlapTime: number;
  lastFlapTime: number;
  horizontalSpeed: number;
  direction: number;
  nextDirectionChange: number;
  lastDirectionChange: number;
  lastCollision: number;
  playerName: string;
  nameText: Phaser.GameObjects.Text;
}

export class PlayerManager {
  private readonly scene: Scene;
  private readonly boxes: Phaser.Physics.Arcade.Group;
  private youtubeNames: string[] = [];

  constructor(scene: Scene, boxes: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.boxes = boxes;
  }

  setYouTubeNames(names: string[]): void {
    this.youtubeNames = names;
  }

  /**
   * Properly manages the player names list to ensure:
   * 1. ElodineCodes always appears exactly once
   * 2. No duplicate names
   * 3. Proper fallback when no YouTube names are available
   */
  getPlayerNames(): string[] {
    const nameSet = new Set<string>();
    nameSet.add("ElodineCodes");

    if (this.youtubeNames && this.youtubeNames.length > 0) {
      this.youtubeNames.forEach((name) => {
        const cleanName = name.trim();
        if (cleanName) {
          nameSet.add(cleanName);
        }
      });
    }

    return Array.from(nameSet);
  }

  createPlayers(): void {
    const colors = [
      0xff6b6b, 0x4ecdc4, 0x45b7d1, 0x96ceb4, 0xfeca57, 0xff9ff3, 0x54a0ff,
      0x2ed573, 0xff6348, 0x1dd1a1, 0x7f8c8d, 0xf39c12, 0x8e44ad, 0xe74c3c,
      0x3498db, 0x2ecc71,
    ];

    const availableNames = this.getPlayerNames();
    const numBoxes = Math.min(availableNames.length, 12);

    console.log(
      `Creating ${numBoxes} players from ${availableNames.length} available names`
    );

    for (let i = 0; i < numBoxes; i++) {
      const centerX = this.scene.cameras.main.width / 2;
      const centerY = this.scene.cameras.main.height / 2;
      const spawnRadius = 150;

      const x = Phaser.Math.Between(
        centerX - spawnRadius,
        centerX + spawnRadius
      );
      const y = Phaser.Math.Between(
        centerY - spawnRadius,
        centerY + spawnRadius
      );

      this.createPlayer(x, y, availableNames[i], colors);
    }
  }

  createPlayer(
    x: number,
    y: number,
    playerName: string,
    colors: number[]
  ): Phaser.Physics.Arcade.Image {
    const box = this.scene.physics.add.image(x, y, "ship");
    box.setScale(2);
    box.setBounce(0.3);
    box.setCollideWorldBounds(false);
    box.setTint(Phaser.Math.RND.pick(colors));

    const isElodine = playerName === "ElodineCodes";
    const nameText = this.scene.add.text(x, y - 30, playerName, {
      fontFamily: "Arial",
      fontSize: 13,
      color: "#ffffff",
      backgroundColor: isElodine ? "#006400" : "#000000",
      padding: { x: 4, y: 2 },
    });
    nameText.setOrigin(0.5);

    // Set up player data
    const horizontalSpeed = Phaser.Math.Between(50, 100);
    const direction = Phaser.Math.RND.pick([-1, 1]);

    box.setData("nameText", nameText);
    box.setData("playerName", playerName);
    box.setData("nextFlapTime", Phaser.Math.Between(1000, 3000));
    box.setData("lastFlapTime", 0);
    box.setData("horizontalSpeed", horizontalSpeed);
    box.setData("direction", direction);
    box.setData("nextDirectionChange", Phaser.Math.Between(3000, 8000));
    box.setData("lastDirectionChange", 0);
    box.setData("lastCollision", 0);

    box.setVelocityX(horizontalSpeed * direction);
    box.setVelocityY(0);

    this.boxes.add(box);
    return box;
  }

  spawnRandomPlayer(): void {
    const allPlayerNames = this.getPlayerNames();
    const availableNames = allPlayerNames.filter(
      (name) =>
        !this.boxes.children.entries.some(
          (box) =>
            (box as Phaser.Physics.Arcade.Image).getData("playerName") === name
        )
    );

    if (availableNames.length === 0) {
      console.log(
        "No available names to spawn - all players are already active"
      );
      return;
    }

    const playerName = Phaser.Math.RND.pick(availableNames);
    console.log(
      `Spawning available player: ${playerName} (${availableNames.length} names available)`
    );

    const centerX = this.scene.cameras.main.width / 2;
    const centerY = this.scene.cameras.main.height / 2;

    let x, y;
    let attempts = 0;
    do {
      x = Phaser.Math.Between(centerX - 200, centerX + 200);
      y = Phaser.Math.Between(centerY - 200, centerY + 200);
      attempts++;
    } while (this.isLocationOccupied(x, y, 80) && attempts < 10);

    const colors = [
      0xff6b6b, 0x4ecdc4, 0x45b7d1, 0x96ceb4, 0xfeca57, 0xff9ff3, 0x54a0ff,
      0x2ed573, 0xff6348, 0x1dd1a1, 0x7f8c8d, 0xf39c12, 0x8e44ad, 0xe74c3c,
      0x3498db, 0x2ecc71,
    ];

    this.createPlayer(x, y, playerName, colors);
    console.log(`Respawned player: ${playerName}`);
  }

  removePlayer(player: Phaser.Physics.Arcade.Image): void {
    const playerName = player.getData("playerName") as string;
    const nameText = player.getData("nameText") as Phaser.GameObjects.Text;

    console.log(`💀 ELIMINATING PLAYER: ${playerName}`);

    if (nameText) {
      nameText.destroy();
    }

    this.boxes.remove(player, true, true);
    console.log(`Player ${playerName} has been eliminated!`);
  }

  updatePlayerMovement(time: number, speedMultiplier: number): void {
    if (!this.boxes?.children) return;

    const activePlayers = this.boxes.children.entries.length;

    this.boxes.children.entries.forEach((box) => {
      const physicsBox = box as Phaser.Physics.Arcade.Image;
      if (!physicsBox.body) return;

      // Update name text position
      const nameText = physicsBox.getData(
        "nameText"
      ) as Phaser.GameObjects.Text;
      if (nameText) {
        nameText.setPosition(physicsBox.x, physicsBox.y - 30);
      }

      this.handlePlayerMovement(
        physicsBox,
        time,
        speedMultiplier,
        activePlayers
      );
      this.handleScreenWrapping(physicsBox);
    });
  }

  private handlePlayerMovement(
    physicsBox: Phaser.Physics.Arcade.Image,
    time: number,
    speedMultiplier: number,
    activePlayers: number
  ): void {
    const nextFlapTime = physicsBox.getData("nextFlapTime") ?? 2000;
    const lastFlapTime = physicsBox.getData("lastFlapTime") ?? 0;
    const baseHorizontalSpeed = physicsBox.getData("horizontalSpeed") ?? 75;
    const direction = physicsBox.getData("direction") ?? 1;
    const nextDirectionChange =
      physicsBox.getData("nextDirectionChange") ?? 5000;
    const lastDirectionChange = physicsBox.getData("lastDirectionChange") ?? 0;

    const horizontalSpeed = baseHorizontalSpeed * speedMultiplier;
    const currentVelY = physicsBox.body?.velocity.y ?? 0;
    physicsBox.setVelocity(horizontalSpeed * direction, currentVelY);

    // Handle direction changes
    const directionChangeInterval =
      activePlayers < 8
        ? Phaser.Math.Between(2000, 5000)
        : Phaser.Math.Between(3000, 8000);

    if (time - lastDirectionChange > nextDirectionChange) {
      const newDirection = Phaser.Math.RND.pick([-1, 1]);
      const newSpeed = Phaser.Math.Between(50, 100);

      physicsBox.setData("direction", newDirection);
      physicsBox.setData("horizontalSpeed", newSpeed);
      physicsBox.setData("lastDirectionChange", time);
      physicsBox.setData("nextDirectionChange", directionChangeInterval);
    }

    // Handle flapping
    const flapInterval =
      activePlayers < 8
        ? Phaser.Math.Between(1000, 2500)
        : Phaser.Math.Between(1500, 4000);

    if (time - lastFlapTime > nextFlapTime) {
      const currentVelX = physicsBox.body?.velocity.x ?? 0;
      const flapForce = activePlayers < 8 ? -180 : -150;
      physicsBox.setVelocity(currentVelX, flapForce);

      physicsBox.setData("lastFlapTime", time);
      physicsBox.setData("nextFlapTime", flapInterval);
    }
  }

  private handleScreenWrapping(physicsBox: Phaser.Physics.Arcade.Image): void {
    const camera = this.scene.cameras.main;
    const halfSpriteSize = 40;

    const leftBound = camera.scrollX;
    const rightBound = camera.scrollX + camera.width;
    const topBound = camera.scrollY;
    const bottomBound = camera.scrollY + camera.height;

    // Horizontal wrapping
    if (physicsBox.x > rightBound + halfSpriteSize) {
      physicsBox.x = leftBound - halfSpriteSize;
    } else if (physicsBox.x < leftBound - halfSpriteSize) {
      physicsBox.x = rightBound + halfSpriteSize;
    }

    // Vertical wrapping
    if (physicsBox.y > bottomBound + halfSpriteSize) {
      physicsBox.y = topBound - halfSpriteSize;
    } else if (physicsBox.y < topBound - halfSpriteSize) {
      physicsBox.y = bottomBound + halfSpriteSize;
    }
  }

  private isLocationOccupied(
    x: number,
    y: number,
    minDistance: number
  ): boolean {
    return this.boxes.children.entries.some((box) => {
      const playerBox = box as Phaser.Physics.Arcade.Image;
      const distance = Phaser.Math.Distance.Between(
        x,
        y,
        playerBox.x,
        playerBox.y
      );
      return distance < minDistance;
    });
  }

  getActivePlayerCount(): number {
    return this.boxes.children.entries.length;
  }

  getTotalAvailablePlayerCount(): number {
    return this.getPlayerNames().length;
  }
}
