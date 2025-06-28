export interface CommentThread {
  id: string;
  snippet: {
    videoId: string;
    topLevelComment: {
      snippet: {
        textDisplay: string;
        authorDisplayName: string;
        authorProfileImageUrl: string;
        likeCount: number;
        publishedAt: string;
      };
    };
    totalReplyCount: number;
    canReply: boolean;
  };
  replies?: {
    comments: Array<{
      snippet: {
        textDisplay: string;
        authorDisplayName: string;
        authorProfileImageUrl: string;
        likeCount: number;
        publishedAt: string;
      };
    }>;
  };
}

export interface YouTubeCommentsResponse {
  kind: string;
  etag: string;
  nextPageToken?: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  items: CommentThread[];
}

export interface YouTubeServiceConfig {
  apiKey: string;
  baseUrl?: string;
}

export class YouTubeService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private isMockMode: boolean;

  constructor(config: YouTubeServiceConfig, mockMode: boolean = true) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? "https://www.googleapis.com/youtube/v3";
    this.isMockMode = mockMode;
  }

  /**
   * Fetch comment threads for a specific video
   * @param videoId - The YouTube video ID
   * @param maxResults - Maximum number of results to return (default: 20)
   * @param pageToken - Token for pagination
   * @returns Promise with comment threads data
   */
  async getCommentThreads(
    videoId: string,
    maxResults: number = 20,
    pageToken?: string
  ): Promise<YouTubeCommentsResponse> {
    if (this.isMockMode) {
      // Simulate network delay
      await this.delay(500 + Math.random() * 1000);
      return this.getMockCommentThreads(videoId, maxResults);
    }

    const url = new URL(`${this.baseUrl}/commentThreads`);
    url.searchParams.append("part", "snippet,replies");
    url.searchParams.append("videoId", videoId);
    url.searchParams.append("key", this.apiKey);
    url.searchParams.append("maxResults", maxResults.toString());

    if (pageToken) {
      url.searchParams.append("pageToken", pageToken);
    }

    try {
      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: YouTubeCommentsResponse = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching comment threads:", error);
      throw error;
    }
  }

  /**
   * Get mock comment threads data for development
   */
  private async getMockCommentThreads(
    videoId: string,
    maxResults: number
  ): Promise<YouTubeCommentsResponse> {
    // Load mock data from JSON file
    try {
      const response = await fetch("/mock-data/youtube-comments.json");
      const mockData: YouTubeCommentsResponse = await response.json();

      // Simulate different video IDs by modifying the mock data
      const modifiedData = {
        ...mockData,
        items: mockData.items.slice(0, maxResults).map((item) => ({
          ...item,
          snippet: {
            ...item.snippet,
            videoId: videoId,
          },
        })),
      };

      return modifiedData;
    } catch (error) {
      console.error("Error loading mock data:", error);
      // Fallback to hardcoded mock data
      return this.getHardcodedMockData(videoId, maxResults);
    }
  }

  /**
   * Fallback hardcoded mock data
   */
  private getHardcodedMockData(
    videoId: string,
    maxResults: number
  ): YouTubeCommentsResponse {
    const mockComments: CommentThread[] = [
      {
        id: "mock-comment-1",
        snippet: {
          videoId: videoId,
          topLevelComment: {
            snippet: {
              textDisplay: "This is an amazing video! Thanks for sharing.",
              authorDisplayName: "GameFan2024",
              authorProfileImageUrl: "https://via.placeholder.com/50",
              likeCount: 42,
              publishedAt: "2024-12-01T10:30:00Z",
            },
          },
          totalReplyCount: 3,
          canReply: true,
        },
        replies: {
          comments: [
            {
              snippet: {
                textDisplay: "I totally agree! This was super helpful.",
                authorDisplayName: "DevLearner",
                authorProfileImageUrl: "https://via.placeholder.com/50",
                likeCount: 8,
                publishedAt: "2024-12-01T11:15:00Z",
              },
            },
          ],
        },
      },
      {
        id: "mock-comment-2",
        snippet: {
          videoId: videoId,
          topLevelComment: {
            snippet: {
              textDisplay:
                "Great tutorial! Could you make one about advanced topics?",
              authorDisplayName: "CodeMaster99",
              authorProfileImageUrl: "https://via.placeholder.com/50",
              likeCount: 15,
              publishedAt: "2024-12-01T09:45:00Z",
            },
          },
          totalReplyCount: 0,
          canReply: true,
        },
      },
    ];

    return {
      kind: "youtube#commentThreadListResponse",
      etag: "mock-etag-123",
      pageInfo: {
        totalResults: mockComments.length,
        resultsPerPage: maxResults,
      },
      items: mockComments.slice(0, maxResults),
    };
  }

  /**
   * Utility method to simulate network delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Switch between mock and real API mode
   */
  setMockMode(enabled: boolean): void {
    this.isMockMode = enabled;
  }

  /**
   * Check if service is in mock mode
   */
  isMock(): boolean {
    return this.isMockMode;
  }
}
