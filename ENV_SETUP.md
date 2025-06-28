# Environment Configuration

This project uses environment variables for configuration. Follow these steps to set up your environment:

## Quick Setup

1. **Copy the example environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit the `.env` file with your configuration:**
   ```bash
   # For development with mock data (default)
   VITE_MOCK_MODE=true
   VITE_YOUTUBE_API_KEY=mock_youtube_api_key_abc123def456
   
   # For production with real YouTube API
   VITE_MOCK_MODE=false
   VITE_YOUTUBE_API_KEY=your_actual_youtube_api_key_here
   ```

## Environment Variables

### `VITE_YOUTUBE_API_KEY`
- **Required:** Yes
- **Description:** Your YouTube Data API v3 key
- **Development:** Use any mock value (e.g., `mock_youtube_api_key_abc123def456`)
- **Production:** Get your API key from [Google Cloud Console](https://console.cloud.google.com/)

### `VITE_YOUTUBE_BASE_URL`
- **Required:** No
- **Default:** `https://www.googleapis.com/youtube/v3`
- **Description:** Base URL for YouTube API endpoints

### `VITE_MOCK_MODE`
- **Required:** No
- **Default:** `true` (automatically enabled in development)
- **Values:** `true` | `false`
- **Description:** When `true`, uses mock data instead of real API calls

## Automatic Mock Mode Detection

The service automatically enables mock mode when:
- `VITE_MOCK_MODE=true`
- `VITE_MOCK_MODE` is not set (undefined)
- `VITE_YOUTUBE_API_KEY` is not set
- `VITE_YOUTUBE_API_KEY` contains the word "mock"
- `VITE_YOUTUBE_API_KEY` equals "your_youtube_api_key_here"

## Getting a YouTube API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the YouTube Data API v3
4. Create credentials (API Key)
5. Restrict the API key to YouTube Data API v3 (recommended)
6. Add your domain to authorized referrers (for production)

## Usage in Code

The service manager automatically loads configuration from environment variables:

```typescript
import { ServiceManager } from './services';

const serviceManager = ServiceManager.getInstance();
const youtubeService = serviceManager.getYouTubeService();

// Check if in mock mode
console.log('Mock mode:', youtubeService.isMock());

// Fetch comments (will use mock data if in mock mode)
const comments = await youtubeService.getCommentThreads('dQw4w9WgXcQ');
```

## Security Notes

- Never commit your real API key to version control
- The `.env` file is in `.gitignore` to prevent accidental commits
- The service manager masks API keys in console logs for security
- In production, consider using environment variables from your hosting platform instead of `.env` files
