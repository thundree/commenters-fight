# Commenters Fight 🥊

**Commenters Fight** is an entertaining battle royale game built with Phaser 3 where YouTube commenters become playable characters fighting in an arena! Watch as real YouTube usernames battle it out in Joust-style aerial combat.

### 🎮 Game Features

- **Dynamic Player Generation**: Fetches real YouTube commenters from video comments and turns them into fighters
- **Joust-Style Combat**: Players fly around the arena and try to stomp each other from above
- **Progressive Difficulty**: Game speeds up as fewer players remain, with progressive speed boosts
- **Grace Period System**: 3-second protection period at game start and after respawns
- **Real-time Scoring**: Track eliminations and see who's dominating the arena
- **Responsive Design**: Full-screen gameplay that adapts to any screen size
- **Mock Data Support**: Works offline with pre-generated commenter data for development

### 🛠️ Built With

- [Phaser 3.90.0](https://github.com/phaserjs/phaser) - Game engine
- [Vite 6.3.1](https://github.com/vitejs/vite) - Build tool and dev server
- [TypeScript 5.7.2](https://github.com/microsoft/TypeScript) - Type safety

### 🎯 How to Play

1. **Start the Game**: Launch the development server and open the game in your browser
2. **Watch the Battle**: YouTube commenters automatically spawn as colored squares with their usernames
3. **Camera Controls**: Use arrow keys to move the camera around the battlefield
4. **Combat Mechanics**: Players automatically fly around and try to stomp each other from above
5. **Scoring**: Players earn points for eliminating others - watch the live scoreboard
6. **Winner Declaration**: When only one player remains, they're declared the winner and all players respawn

### 🎮 Game Mechanics

- **Flappy Bird Movement**: Players automatically "flap" to stay airborne with gravity pulling them down
- **Joust Combat**: Players must be above their opponents to eliminate them on collision
- **Speed Boosts**: Game speeds up when fewer than 8 players remain, with progressive increases every 10 seconds
- **Screen Wrapping**: Players teleport to the opposite side when they leave the camera view
- **Grace Period**: 3-second protection at game start prevents immediate eliminations

## 🚀 Quick Start

### Prerequisites

[Node.js](https://nodejs.org) is required to install dependencies and run scripts via `npm`.

### Installation & Running

```bash
# Clone the repository
git clone <repository-url>
cd commenters-fight

# Install dependencies
npm install

# Start development server
npm run dev
```

The game will be available at `http://localhost:8080` by default.

## 📋 Available Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install project dependencies |
| `npm run dev` | Launch development server with analytics |
| `npm run build` | Create production build in the `dist` folder |
| `npm run dev-nolog` | Launch development server without analytics |
| `npm run build-nolog` | Create production build without analytics |

## 🎮 YouTube Integration

The game features a YouTube service that fetches real commenter names from videos:

- **Mock Mode** (default): Uses pre-generated mock data from `public/mock-data/youtube-comments.json`
- **Live Mode**: Requires YouTube Data API v3 key to fetch real comments
- **Fallback Player**: "ElodineCodes" is always included as a guaranteed player

### Setting Up YouTube API (Optional)

To use real YouTube comments instead of mock data:

1. Get a YouTube Data API v3 key from [Google Cloud Console](https://console.cloud.google.com/)
2. Configure the `YouTubeService` in `src/services/YouTubeService.ts`
3. Set `mockMode: false` when initializing the service

## 🏗️ Project Structure

| Path                         | Description                                                |
|------------------------------|------------------------------------------------------------|
| `index.html`                 | Main HTML entry point containing the game container       |
| `public/assets/`             | Game sprites and static assets (ship.png, favicon, etc.)  |
| `public/style.css`           | Global layout and UI styles                               |
| `public/mock-data/`          | Mock YouTube comments data for offline development        |
| `src/main.ts`                | Application bootstrap and entry point                     |
| `src/game/`                  | Core game logic and Phaser scenes                         |
| `src/game/main.ts`           | Game configuration and scene management                    |
| `src/game/scenes/`           | All Phaser game scenes (Boot, Preloader, MainMenu, Game, GameOver) |
| `src/services/`              | External service integrations (YouTube API, Service Manager) |
| `vite/`                      | Vite build configuration files                            |

### Key Game Files

- **`src/game/scenes/Game.ts`**: Main game logic, physics, combat system, and player management
- **`src/services/YouTubeService.ts`**: Handles fetching YouTube comments and mock data
- **`src/services/ServiceManager.ts`**: Singleton service container for dependency management
- **`public/mock-data/youtube-comments.json`**: Sample commenter data for offline play 


## 🎨 Asset Management

The game uses Vite's asset handling system for optimal performance:

### Embedded Assets
```typescript
import logoImg from './assets/logo.png'
// Use in Phaser: this.load.image('logo', logoImg);
```

### Static Assets
Place files in `public/assets/` folder:
```typescript
// Loads from public/assets/ship.png
this.load.image('ship', 'assets/ship.png');
```

Current game assets:
- `public/assets/ship.png` - Player ship sprite
- `public/favicon.png` - Browser favicon
- `public/mock-data/youtube-comments.json` - Mock commenter data

## 🚀 Building for Production

```bash
# Create optimized production build
npm run build

# Output will be in the dist/ folder
# Upload entire dist/ folder contents to your web server
```

The build process:
- Bundles and minifies all code
- Optimizes images and assets
- Generates source maps for debugging
- Copies static assets to `dist/assets/`

## 🔧 Development Features

### Hot Module Replacement
Vite provides instant updates during development - edit any file and see changes immediately without losing game state.

### TypeScript Support
Full TypeScript integration with:
- Type checking during development
- IntelliSense and autocompletion
- Compile-time error detection

### Physics Debugging
Enable physics debug mode in `src/game/main.ts`:
```typescript
physics: {
  default: "arcade",
  arcade: {
    gravity: { x: 0, y: 150 },
    debug: true, // Shows collision boundaries
  },
}
```

## 🎯 Game Design Philosophy

**Commenters Fight** transforms the often chaotic nature of YouTube comment sections into an entertaining battle royale experience. The game mechanics are designed to be:

- **Accessible**: Simple to understand, no complex controls needed
- **Emergent**: Complex battles arise from simple rules (positioning + timing)
- **Community-Driven**: Real commenter names create personal investment
- **Fast-Paced**: Progressive speed increases keep games exciting
- **Fair**: Grace periods and respawn mechanics ensure everyone gets a chance

The Joust-inspired combat system rewards positioning and timing over button mashing, making each elimination feel earned rather than random.

## 🛠️ Customization

### Game Parameters

Easily adjust game mechanics in `src/game/scenes/Game.ts`:

```typescript
// Grace period duration (ms)
private readonly gracePeriodMs: number = 3000;

// Speed boost threshold (players remaining)
const baseSpeedMultiplier = activePlayers < 8 ? 1.5 : 1.0;

// Progressive speed boost timing (ms)
if (timeSinceLastBoost >= 10000) // 10 seconds

// Physics settings
physics: {
  arcade: {
    gravity: { x: 0, y: 150 }, // Adjust gravity
  }
}
```

### Adding New Player Colors

Expand the color palette in `createBoxes()`:
```typescript
const colors = [
  0xff6b6b, 0x4ecdc4, 0x45b7d1, // Add more hex colors
  // Your custom colors here...
];
```

### Vite Configuration

Modify build settings in `vite/config.*.mjs` files for:
- Custom plugins (CSS preprocessors, additional file loaders)
- Development server settings (port, host, HTTPS)
- Build optimization options

See the [Vite documentation](https://vitejs.dev/) for comprehensive configuration options.

## 📊 Analytics & Logging

The project includes optional anonymous analytics via `log.js` that sends minimal usage data to help improve the Phaser template ecosystem.

**Data Sent:**
- Template type (typescript)
- Build type (dev/prod) 
- Phaser version

**No personal data** is collected - no file contents, device info, or user identification.

### Disable Analytics

Use the `-nolog` commands:
```bash
npm run dev-nolog    # Development without analytics
npm run build-nolog  # Production build without analytics
```

Or remove analytics entirely by deleting `log.js` and updating `package.json`:

```json
{
  "scripts": {
    "dev": "vite --config vite/config.dev.mjs",
    "build": "vite build --config vite/config.prod.mjs"
  }
}
```

## 🤝 Contributing

This project is built on the Phaser community template. Improvements and suggestions are welcome!

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly
4. Commit your changes: `git commit -m 'Add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

### Ideas for Contributions

- **New Combat Mechanics**: Special abilities, power-ups, different player types
- **Visual Improvements**: Particle effects, better sprites, UI enhancements
- **Audio**: Sound effects, background music, audio feedback
- **Multiplayer**: Real-time multiplayer battles
- **Mobile Support**: Touch controls and responsive design improvements
- **Tournament Mode**: Bracket-style competitions, advanced scoring

## 🎮 Community & Support

**Commenters Fight** is built with Phaser 3! Join the amazing Phaser community:

**Visit:** The [Phaser website](https://phaser.io) and follow on [Phaser Twitter](https://twitter.com/phaser_)<br />
**Play:** Games [#madewithphaser](https://twitter.com/search?q=%23madewithphaser&src=typed_query&f=live)<br />
**Learn:** [API Docs](https://newdocs.phaser.io), [Support Forum](https://phaser.discourse.group/) and [StackOverflow](https://stackoverflow.com/questions/tagged/phaser-framework)<br />
**Discord:** Join us on [Discord](https://discord.gg/phaser)<br />
**Code:** 2000+ [Examples](https://labs.phaser.io)<br />
**Read:** The [Phaser World](https://phaser.io/community/newsletter) Newsletter<br />

## 🏆 Game Inspiration

This game draws inspiration from:
- **Joust (1982)**: Classic arcade combat mechanics
- **Battle Royale**: Last-player-standing gameplay
- **Flappy Bird**: Simple but engaging flight mechanics
- **YouTube Comments**: The chaotic energy of comment sections

## 📝 License

Created by [Phaser Studio](mailto:support@phaser.io). Powered by coffee, anime, pixels and love.

The Phaser logo and characters are &copy; 2011 - 2025 Phaser Studio Inc.

All rights reserved.

---

**Ready to watch commenters battle it out? Start the game and let the chaos begin! 🥊⚡**
