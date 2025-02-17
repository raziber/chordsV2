import HtmlUtils from "./htmlUtils";
import JsonUtils from "./jsonUtils";

export const SEARCH_PAGE_LIMIT = 3;

export interface RawSearchResult {
  id: number;
  song_id: number;
  song_name: string;
  artist_id: number;
  artist_name: string;
  type: string;
  part: string;
  version: number;
  votes: number;
  difficulty: string;
  rating: number;
  date: string;
  status: string;
  preset_id: number;
  tab_access_type: string;
  tp_version: number;
  tonality_name: string;
  version_description: string;
  verified: number;
  recording: {
    is_acoustic: number;
    tonality_name: string;
    performance: null | any;
    recording_artists: any[];
  };
  album_cover: {
    has_album_cover: boolean;
    web_album_cover: {
      small: string;
    };
  };
  artist_cover: {
    has_artist_cover: boolean;
    web_artist_cover: {
      small: string;
    };
  };
  artist_url: string;
  tab_url: string;
}

export default class Search {
  async searchMultiplePages(
    baseUrl: string,
    pages: number
  ): Promise<RawSearchResult[]> {
    const allResults: RawSearchResult[] = [];

    try {
      for (let page = 1; page <= pages; page++) {
        const pageUrl = `${baseUrl}page=${page}&search_type=title&`;
        const response = await fetch(pageUrl);
        const html = await response.text();
        const results = this.parseSearchResults(html);
        allResults.push(...results);
      }
    } catch (error) {
      console.error("Search failed:", error);
      return [];
    }

    return this.filterResultsWithMostVotes(allResults);
  }

  parseSearchResults(htmlText: string): RawSearchResult[] {
    if (!htmlText) return [];

    try {
      // Only decode HTML once
      const cleanHtml = HtmlUtils.decode(htmlText);
      const simplifiedHtml = HtmlUtils.simplifyNewlines(cleanHtml);
      return this.extractResults(simplifiedHtml);
    } catch (error) {
      console.error("Search parsing error:", error);
      return [];
    }
  }

  filterResultsWithMostVotes(results: RawSearchResult[]): RawSearchResult[] {
    // Group by song_id and keep track of processing
    const songMap = new Map<number, RawSearchResult>();

    results.forEach((result) => {
      const existing = songMap.get(result.song_id);
      if (!existing || existing.votes < result.votes) {
        songMap.set(result.song_id, result);
      }
    });

    return Array.from(songMap.values());
  }

  private extractResults(html: string): RawSearchResult[] {
    try {
      const jsonStrings = JsonUtils.findJsonObjects(html, ',{"id"');
      const results = jsonStrings
        .map((jsonStr) => {
          try {
            const parsed = JSON.parse(jsonStr);
            // Validate required fields
            if (
              parsed &&
              typeof parsed === "object" &&
              "id" in parsed &&
              "song_id" in parsed &&
              "song_name" in parsed
            ) {
              return parsed as RawSearchResult;
            }
            return null;
          } catch (e) {
            return null;
          }
        })
        .filter((result): result is RawSearchResult => result !== null);

      return results;
    } catch (error) {
      return [];
    }
  }

  private logResults(results: RawSearchResult[]): void {
    results.forEach((result) => {
      console.log(`
      Result:
      ID: ${result.id}
      Song ID: ${result.song_id}
      Title: ${result.song_name}
      Artist ID: ${result.artist_id}
      Artist: ${result.artist_name}
      Type: ${result.type}
      Part: ${result.part}
      Version: ${result.version}
      Votes: ${result.votes}
      Difficulty: ${result.difficulty}
      Rating: ${result.rating}
      Date: ${result.date}
      Status: ${result.status}
      Preset ID: ${result.preset_id}
      Access Type: ${result.tab_access_type}
      TP Version: ${result.tp_version}
      Tonality: ${result.tonality_name}
      Description: ${result.version_description}
      Verified: ${result.verified}
      Recording: ${JSON.stringify(result.recording, null, 2)}
      Album Cover: ${result.album_cover?.web_album_cover?.small || "None"}
      Artist Cover: ${result.artist_cover?.web_artist_cover?.small || "None"}
      Artist URL: ${result.artist_url}
      Tab URL: ${result.tab_url}
      ----------------------------------------
      `);
    });
  }
}
