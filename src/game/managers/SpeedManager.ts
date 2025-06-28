export class SpeedManager {
  private speedBoostLogged: boolean = false;
  private progressiveSpeedMultiplier: number = 1.0;
  private lastProgressiveBoostTime: number = 0;
  private progressiveBoostCount: number = 0;

  reset(): void {
    this.speedBoostLogged = false;
    this.progressiveSpeedMultiplier = 1.0;
    this.progressiveBoostCount = 0;
    this.lastProgressiveBoostTime = 0;
  }

  calculateSpeedMultiplier(activePlayers: number): number {
    const baseSpeedMultiplier = activePlayers < 8 ? 1.5 : 1.0;

    // Handle initial speed boost activation
    if (activePlayers < 8 && baseSpeedMultiplier > 1.0 && !this.speedBoostLogged) {
      console.log(
        `⚡ SPEED BOOST ACTIVE! ${activePlayers} players remaining, speed increased by ${(
          (baseSpeedMultiplier - 1) * 100
        ).toFixed(0)}%`
      );
      this.speedBoostLogged = true;
      this.progressiveSpeedMultiplier = 1.0;
      this.progressiveBoostCount = 0;
      this.lastProgressiveBoostTime = Date.now();
    } else if (activePlayers >= 8 && this.speedBoostLogged) {
      console.log("⚡ SPEED BOOST DEACTIVATED - back to normal speed");
      this.reset();
    }

    // Handle progressive speed increases (only when speed boost is active)
    if (this.speedBoostLogged && this.progressiveBoostCount < 8) {
      const timeSinceLastBoost = Date.now() - this.lastProgressiveBoostTime;

      if (timeSinceLastBoost >= 10000) { // 10 seconds
        this.progressiveBoostCount++;
        this.progressiveSpeedMultiplier += 0.25; // Add 25% each time
        this.lastProgressiveBoostTime = Date.now();

        console.log(
          `⚡ PROGRESSIVE SPEED BOOST ${this.progressiveBoostCount}/8! Speed now ${(
            (baseSpeedMultiplier * this.progressiveSpeedMultiplier - 1) * 100
          ).toFixed(0)}% faster than normal`
        );
      }
    }

    return baseSpeedMultiplier * this.progressiveSpeedMultiplier;
  }

  isSpeedBoostActive(): boolean {
    return this.speedBoostLogged;
  }

  getProgressiveBoostInfo(): { count: number; multiplier: number } {
    return {
      count: this.progressiveBoostCount,
      multiplier: this.progressiveSpeedMultiplier,
    };
  }
}
