import { Boot } from "./scenes/Boot";
import { GameOver } from "./scenes/GameOver";
import { Game as MainGame } from "./scenes/Game";
import { MainMenu } from "./scenes/MainMenu";
import { PlatformConfigurator } from "./scenes/PlatformConfigurator";
import { PlatformTest } from "./scenes/PlatformTest";
import { AUTO, Game } from "phaser";
import { Preloader } from "./scenes/Preloader";
import { refreshPlatformConfigs } from "./constants/PlatformConfigs";

//  Find out more information about the Game Config at:
//  https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config: Phaser.Types.Core.GameConfig = {
  type: AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  parent: "game-container",
  backgroundColor: "#028af8",
  render: {
    pixelArt: true, // Enable pixel-perfect rendering for crisp sprites
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 300 },
      debug: true,
    },
  },
  scene: [
    Boot,
    Preloader,
    MainMenu,
    MainGame,
    GameOver,
    PlatformConfigurator,
    PlatformTest,
  ],
};

const StartGame = (parent: string) => {
  const game = new Game({ ...config, parent });

  // Handle window resize events to refresh platform configurations
  window.addEventListener("resize", () => {
    // Refresh platform configs when window is resized
    refreshPlatformConfigs();
  });

  return game;
};

export default StartGame;
