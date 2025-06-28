import { Scene } from "phaser";

export class GameStateManager {
  private readonly scene: Scene;
  private readonly scores: Map<string, number> = new Map();
  private scoreText: Phaser.GameObjects.Text;
  private gracePeriodText: Phaser.GameObjects.Text;
  private fightText: Phaser.GameObjects.Text;
  private winnerText: Phaser.GameObjects.Text;

  private gameStartTime: number = 0;
  private readonly gracePeriodMs: number = 3000;
  private gracePeriodLogged: boolean = false;
  private fightMessageLogged: boolean = false;
  private winnerAnnounced: boolean = false;
  private winnerAnnounceTime: number = 0;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  initializeUI(): void {
    // Add instructions text
    this.scene.add
      .text(
        16,
        16,
        [
          "🎮 Use Arrow Keys to move camera",
          "⚔️ Players fight for platform dominance!",
          "🏛️ Land on platforms to gain advantage",
        ],
        {
          fontFamily: "Arial",
          fontSize: 14,
          color: "#ffffff",
          backgroundColor: "#000000",
          padding: { x: 10, y: 10 },
        }
      )
      .setZ(10)
      .setScrollFactor(0);

    // Add score display text
    this.scoreText = this.scene.add
      .text(16, 60, this.getScoreDisplayText(), {
        fontFamily: "Arial",
        fontSize: 12,
        color: "#00ff00",
        backgroundColor: "#000000",
        padding: { x: 8, y: 4 },
        wordWrap: { width: this.scene.cameras.main.width - 32 },
      })
      .setZ(10)
      .setScrollFactor(0);

    // Add grace period indicator text
    this.gracePeriodText = this.scene.add
      .text(
        this.scene.cameras.main.width / 2,
        100,
        "⚡ GRACE PERIOD ACTIVE ⚡",
        {
          fontFamily: "Arial",
          fontSize: 20,
          color: "#ffffff",
          backgroundColor: "#ff0000",
          padding: { x: 12, y: 8 },
        }
      )
      .setOrigin(0.5)
      .setZ(20)
      .setScrollFactor(0)
      .setVisible(true);

    // Add fight message text (hidden initially)
    this.fightText = this.scene.add
      .text(this.scene.cameras.main.width / 2, 100, "FIGHT!", {
        fontFamily: "Arial",
        fontSize: 32,
        color: "#ff0000",
        backgroundColor: "#ffffff",
        padding: { x: 16, y: 12 },
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setZ(21)
      .setScrollFactor(0)
      .setVisible(false);

    // Add winner announcement text (hidden initially)
    this.winnerText = this.scene.add
      .text(
        this.scene.cameras.main.width / 2,
        this.scene.cameras.main.height / 2,
        "",
        {
          fontFamily: "Arial",
          fontSize: 48,
          color: "#ffff00",
          backgroundColor: "#000000",
          padding: { x: 20, y: 16 },
          stroke: "#ff0000",
          strokeThickness: 4,
        }
      )
      .setOrigin(0.5)
      .setZ(30)
      .setScrollFactor(0)
      .setVisible(false);
  }

  initializeScores(playerNames: string[]): void {
    this.scores.clear();
    playerNames.forEach((name) => {
      this.scores.set(name, 0);
    });
    console.log(
      "Initialized scores for",
      this.scores.size,
      "players:",
      Array.from(this.scores.keys())
    );
  }

  updatePlayerScore(playerName: string, points: number): void {
    const currentScore = this.scores.get(playerName) ?? 0;
    this.scores.set(playerName, currentScore + points);

    if (this.scoreText) {
      this.scoreText.setText(this.getScoreDisplayText());
    }
  }

  private getScoreDisplayText(): string {
    if (this.scores.size === 0) {
      return "No players loaded";
    }

    // Get active players from the scene (we'll need to pass this info)
    const scoreEntries = Array.from(this.scores.entries())
      .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
      .map(([name, score]) => `${name}: ${score}`)
      .slice(0, 8);

    return scoreEntries.join("\n");
  }

  updateScoreDisplay(activePlayers: Set<string>): void {
    if (this.scores.size === 0) {
      this.scoreText?.setText("No players loaded");
      return;
    }

    const scoreEntries = Array.from(this.scores.entries())
      .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
      .map(([name, score]) => {
        const isAlive = activePlayers.has(name);
        const indicator = isAlive ? "+" : "-";
        return `${indicator} ${name}: ${score}`;
      })
      .slice(0, 8);

    this.scoreText?.setText(scoreEntries.join("\n"));
  }

  setGameStartTime(): void {
    this.gameStartTime = Date.now();
  }

  resetGameState(): void {
    this.gameStartTime = Date.now();
    this.gracePeriodLogged = false;
    this.fightMessageLogged = false;
    this.winnerAnnounced = false;
    console.log(
      "⏰ GRACE PERIOD RESET: 3 seconds of protection for all players"
    );
  }

  updateGracePeriod(): boolean {
    const timeSinceGameStart = Date.now() - this.gameStartTime;
    const gracePeriodActive = timeSinceGameStart < this.gracePeriodMs;

    if (this.gracePeriodText) {
      this.gracePeriodText.setVisible(gracePeriodActive);

      if (gracePeriodActive) {
        const remainingTime = Math.ceil(
          (this.gracePeriodMs - timeSinceGameStart) / 1000
        );
        this.gracePeriodText.setText(`⚡ GRACE PERIOD: ${remainingTime}s ⚡`);
      }
    }

    // Handle fight message after grace period ends
    if (this.fightText) {
      const timeSinceGraceEnd = timeSinceGameStart - this.gracePeriodMs;
      const showFightMessage = !gracePeriodActive && timeSinceGraceEnd < 1000;

      this.fightText.setVisible(showFightMessage);

      if (showFightMessage && !this.fightMessageLogged) {
        console.log("🥊 FIGHT MESSAGE ACTIVATED!");
        this.fightMessageLogged = true;
      } else if (!showFightMessage && this.fightMessageLogged) {
        this.fightMessageLogged = false;
      }
    }

    return gracePeriodActive;
  }

  isGracePeriodActive(): boolean {
    const timeSinceGameStart = Date.now() - this.gameStartTime;
    return timeSinceGameStart < this.gracePeriodMs;
  }

  logGracePeriod(): void {
    if (!this.gracePeriodLogged) {
      const timeSinceGameStart = Date.now() - this.gameStartTime;
      console.log(
        `⏰ GRACE PERIOD ACTIVE: ${(
          this.gracePeriodMs - timeSinceGameStart
        ).toFixed(0)}ms remaining - no eliminations allowed`
      );
      this.gracePeriodLogged = true;
    }
  }

  endGracePeriod(): void {
    if (this.gracePeriodLogged) {
      console.log("⏰ GRACE PERIOD ENDED - eliminations now allowed");
      this.gracePeriodLogged = false;
    }
  }

  announceWinner(winnerName: string): void {
    if (!this.winnerAnnounced) {
      console.log(`🏆 LAST PLAYER STANDING! ${winnerName} wins this round!`);
      this.winnerText.setText(`🏆 ${winnerName} WINS! 🏆`);
      this.winnerText.setVisible(true);
      this.winnerAnnounced = true;
      this.winnerAnnounceTime = Date.now();
      console.log(
        "Winner announcement displayed, waiting 3 seconds before respawn..."
      );
    }
  }

  shouldRespawnAfterWinner(): boolean {
    if (!this.winnerAnnounced) return false;

    const timeSinceAnnouncement = Date.now() - this.winnerAnnounceTime;
    return timeSinceAnnouncement >= 3000;
  }

  hideWinnerAnnouncement(): void {
    this.winnerText.setVisible(false);
    this.winnerAnnounced = false;
  }

  isWinnerAnnounced(): boolean {
    return this.winnerAnnounced;
  }

  getWinnerWaitTime(): number {
    if (!this.winnerAnnounced) return 0;
    return 3000 - (Date.now() - this.winnerAnnounceTime);
  }
}
