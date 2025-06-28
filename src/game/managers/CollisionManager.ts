export class CollisionManager {

  /**
   * Handle collision between two players with Joust-style logic
   */
  handlePlayerCollision(
    player1: Phaser.Physics.Arcade.Image,
    player2: Phaser.Physics.Arcade.Image,
    isGracePeriodActive: boolean,
    onPlayerEliminated: (winner: string, loser: Phaser.Physics.Arcade.Image) => void
  ): void {
    if (!player1.body || !player2.body) return;

    const player1Name = player1.getData("playerName") as string;
    const player2Name = player2.getData("playerName") as string;

    if (!player1Name || !player2Name) return;

    // Add collision cooldown to prevent rapid repeated collisions
    const currentTime = Date.now();
    const lastCollision = player1.getData("lastCollision") ?? 0;

    if (currentTime - lastCollision < 500) {
      console.log(
        `⏰ COLLISION COOLDOWN: ${player1Name} vs ${player2Name} (${
          currentTime - lastCollision
        }ms ago)`
      );
      return;
    }

    // Set collision cooldown for both players
    player1.setData("lastCollision", currentTime);
    player2.setData("lastCollision", currentTime);

    console.log(`🔥 COLLISION: ${player1Name} vs ${player2Name}`);

    // Handle grace period
    if (isGracePeriodActive) {
      this.handleGracePeriodCollision(player1, player2);
      return;
    }

    // Determine winner based on position
    const result = this.determineCollisionWinner(player1, player2);
    
    if (result.winner && result.loser) {
      console.log(`🏆 ${result.winner} STOMPED ${result.loser.getData("playerName")}! Player eliminated!`);
      onPlayerEliminated(result.winner, result.loser);

      // Give the winner a slight upward boost as feedback
      const winnerBox = result.winner === player1Name ? player1 : player2;
      winnerBox.setVelocityY(-150);
    } else {
      // Handle side collision with bounce
      this.handleSideCollision(player1, player2);
    }
  }

  private handleGracePeriodCollision(
    player1: Phaser.Physics.Arcade.Image,
    player2: Phaser.Physics.Arcade.Image
  ): void {
    // Simple bounce effect during grace period
    const player1VelX = player1.body?.velocity.x ?? 0;
    const player2VelX = player2.body?.velocity.x ?? 0;
    player1.setVelocityX(-player1VelX * 0.8);
    player2.setVelocityX(-player2VelX * 0.8);
  }

  private determineCollisionWinner(
    player1: Phaser.Physics.Arcade.Image,
    player2: Phaser.Physics.Arcade.Image
  ): { winner: string | null; loser: Phaser.Physics.Arcade.Image | null } {
    const player1Name = player1.getData("playerName") as string;
    const player2Name = player2.getData("playerName") as string;

    // Get the vertical positions
    const player1Top = player1.y - player1.height / 2;
    const player2Top = player2.y - player2.height / 2;

    console.log(
      `Player positions - ${player1Name}: y=${player1.y.toFixed(1)}, top=${player1Top.toFixed(1)}, vel.y=${player1.body?.velocity.y.toFixed(1) ?? 0}`
    );
    console.log(
      `Player positions - ${player2Name}: y=${player2.y.toFixed(1)}, top=${player2Top.toFixed(1)}, vel.y=${player2.body?.velocity.y.toFixed(1) ?? 0}`
    );

    const verticalThreshold = 10;

    if (player1Top < player2Top - verticalThreshold) {
      // Player 1 is above Player 2
      console.log(
        `✅ POSITION STOMP! ${player1Name} is above ${player2Name} by ${(player2Top - player1Top).toFixed(1)}px`
      );
      return { winner: player1Name, loser: player2 };
    } else if (player2Top < player1Top - verticalThreshold) {
      // Player 2 is above Player 1
      console.log(
        `✅ POSITION STOMP! ${player2Name} is above ${player1Name} by ${(player1Top - player2Top).toFixed(1)}px`
      );
      return { winner: player2Name, loser: player1 };
    }

    console.log(
      `↔️ SIDE COLLISION - no clear height advantage (diff: ${Math.abs(player1Top - player2Top).toFixed(1)}px)`
    );
    return { winner: null, loser: null };
  }

  private handleSideCollision(
    player1: Phaser.Physics.Arcade.Image,
    player2: Phaser.Physics.Arcade.Image
  ): void {
    // Different bounce behavior for side collisions vs grace period
    const player1VelX = player1.body?.velocity.x ?? 0;
    const player2VelX = player2.body?.velocity.x ?? 0;

    // More aggressive bounce for side collisions
    player1.setVelocityX(-player1VelX * 1.2);
    player2.setVelocityX(-player2VelX * 1.2);
  }
}
