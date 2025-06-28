import { GameStateManager } from "./GameStateManager";
import { PlayerManager } from "./PlayerManager";

export class RespawnManager {
  checkAndRespawnPlayers(
    activePlayers: number,
    totalAvailablePlayers: number,
    gameStateManager: GameStateManager,
    playerManager: PlayerManager,
    onWinnerAnnounced: (winnerName: string) => void
  ): void {
    // Only respawn when there's just 1 player left standing and we have more players available
    if (activePlayers <= 1 && totalAvailablePlayers > 1) {
      if (!gameStateManager.isWinnerAnnounced()) {
        // Get the winner's name from the remaining player
        const winnerName = "Winner"; // This will be properly implemented in integration
        
        console.log(`🏆 LAST PLAYER STANDING! ${winnerName} wins this round!`);
        onWinnerAnnounced(winnerName);
        return;
      }

      // Check if enough time has passed since winner announcement
      if (gameStateManager.shouldRespawnAfterWinner()) {
        console.log("✅ 3 seconds passed! Respawning all players after winner announcement...");
        
        gameStateManager.hideWinnerAnnouncement();
        gameStateManager.resetGameState();

        // Respawn all available players except the one currently active
        const playersToSpawn = totalAvailablePlayers - activePlayers;
        console.log(`🔄 SPAWNING ${playersToSpawn} players...`);

        for (let i = 0; i < playersToSpawn; i++) {
          playerManager.spawnRandomPlayer();
        }

        console.log("🎮 RESPAWN COMPLETE - game should continue!");
      } else {
        const waitTime = gameStateManager.getWinnerWaitTime();
        console.log(`⏳ Still waiting... ${waitTime.toFixed(0)}ms remaining`);
      }
    } else if (activePlayers <= 1 && totalAvailablePlayers === 1) {
      console.log("🎯 Only ElodineCodes available - game continues with single player");
    }
  }
}
