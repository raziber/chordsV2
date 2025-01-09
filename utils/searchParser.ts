import HtmlUtils from "./htmlUtils";
import JsonUtils from "./jsonUtils";

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
  parseSearchResults(htmlText: string): RawSearchResult[] {
    try {
      const cleanHtml = HtmlUtils.decode(htmlText);
      const results = this.extractResults(cleanHtml);
      this.logResults(results);
      return results;
    } catch (error) {
      console.error("Search parsing error:", error);
      return [];
    }
  }

  private extractResults(html: string): RawSearchResult[] {
    const jsonStrings = JsonUtils.findJsonObjects(html, ',{"id"');
    return jsonStrings
      .map((jsonStr) => {
        try {
          return JSON.parse(jsonStr);
        } catch (e) {
          console.error("Failed to parse JSON:", e);
          return null;
        }
      })
      .filter((result): result is RawSearchResult => result !== null);
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
