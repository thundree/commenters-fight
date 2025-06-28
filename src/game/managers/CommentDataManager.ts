import { ServiceManager } from "../../services/ServiceManager";
import {
  YouTubeCommentsResponse,
  CommentThread,
} from "../../services/YouTubeService";

export class CommentDataManager {
  private readonly serviceManager: ServiceManager;

  constructor() {
    this.serviceManager = ServiceManager.getInstance();
  }

  /**
   * Fetch commenter names from YouTube service
   */
  async fetchYouTubeNames(): Promise<string[]> {
    try {
      console.log("Fetching YouTube commenter names...");
      const youtubeService = this.serviceManager.getYouTubeService();
      const response: YouTubeCommentsResponse =
        await youtubeService.getCommentThreads("dQw4w9WgXcQ", 20);

      console.log("YouTube API response:", response);
      return this.extractNamesFromResponse(response);
    } catch (error) {
      console.error("Failed to fetch YouTube names:", error);
      console.log("YouTube service failed, will use ElodineCodes only");
      return [];
    }
  }

  /**
   * Extract commenter names from already-fetched comments data
   */
  extractNamesFromCommentsData(
    commentsData: YouTubeCommentsResponse
  ): string[] {
    try {
      console.log("Extracting names from comments data:", commentsData);
      return this.extractNamesFromResponse(commentsData);
    } catch (error) {
      console.error("Failed to extract names from comments data:", error);
      console.log("Comments extraction failed, will use ElodineCodes only");
      return [];
    }
  }

  private extractNamesFromResponse(
    response: YouTubeCommentsResponse
  ): string[] {
    const nameSet = new Set<string>();

    response.items.forEach((item: CommentThread) => {
      // Add top-level comment author
      const authorName =
        item.snippet.topLevelComment.snippet.authorDisplayName?.trim();
      if (authorName) {
        nameSet.add(authorName);
      }

      // Add reply authors if they exist
      if (item.replies?.comments) {
        item.replies.comments.forEach((reply) => {
          const replyAuthor = reply.snippet.authorDisplayName?.trim();
          if (replyAuthor) {
            nameSet.add(replyAuthor);
          }
        });
      }
    });

    const names = Array.from(nameSet);
    console.log("Extracted YouTube names:", names);
    return names;
  }
}
