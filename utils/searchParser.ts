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
      console.log(
        `Title: ${result.song_name}\nArtist: ${result.artist_name}\nRating: ${result.rating}\nType: ${result.type}\nURL: ${result.tab_url}\n`
      );
    });
  }
}
