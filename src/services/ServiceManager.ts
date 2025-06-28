import { YouTubeService, YouTubeServiceConfig } from "./YouTubeService";

export class ServiceManager {
  private static instance: ServiceManager;
  private readonly youtubeService: YouTubeService;

  private constructor() {
    // Initialize services with configuration from environment variables
    const youtubeConfig: YouTubeServiceConfig = {
      apiKey:
        import.meta.env.VITE_YOUTUBE_API_KEY ?? "mock_youtube_api_key_fallback",
      baseUrl:
        import.meta.env.VITE_YOUTUBE_BASE_URL ??
        "https://www.googleapis.com/youtube/v3",
    };

    // Check if we should start in mock mode (default to true for development)
    const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
    const isExplicitMockMode = import.meta.env.VITE_MOCK_MODE === "true";
    const isDefaultMockMode = import.meta.env.VITE_MOCK_MODE === undefined;
    const hasNoApiKey = !apiKey;
    const isMockApiKey = apiKey?.includes("mock") ?? false;
    const isPlaceholderApiKey = apiKey === "your_youtube_api_key_here";

    const mockMode =
      isExplicitMockMode ||
      isDefaultMockMode ||
      hasNoApiKey ||
      isMockApiKey ||
      isPlaceholderApiKey;

    this.youtubeService = new YouTubeService(youtubeConfig, mockMode);

    // Log configuration for debugging (without exposing the full API key)
    const maskedApiKey = youtubeConfig.apiKey
      ? youtubeConfig.apiKey.substring(0, 4) +
        "***" +
        youtubeConfig.apiKey.slice(-4)
      : "undefined";

    console.log("ServiceManager initialized:", {
      mockMode,
      apiKey: maskedApiKey,
      baseUrl: youtubeConfig.baseUrl,
    });
  }

  public static getInstance(): ServiceManager {
    if (!ServiceManager.instance) {
      ServiceManager.instance = new ServiceManager();
    }
    return ServiceManager.instance;
  }

  public getYouTubeService(): YouTubeService {
    return this.youtubeService;
  }

  /**
   * Enable or disable mock mode for all services
   */
  public setMockMode(enabled: boolean): void {
    this.youtubeService.setMockMode(enabled);
  }

  /**
   * Check if services are in mock mode
   */
  public isMockMode(): boolean {
    return this.youtubeService.isMock();
  }
}
