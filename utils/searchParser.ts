import HtmlUtils from "./htmlUtils";

export interface SearchResult {
  title: string;
  artist: string;
  url: string;
  rating: number;
  type: string;
  song: string;
}

export default class Search {
  parseSearchResults(htmlText: string): SearchResult[] {
    try {
      const cleanHtml = HtmlUtils.decode(htmlText);
      const results = this.extractResults(cleanHtml);
      this.printResults(results);
      return results;
    } catch (error) {
      console.error("Search parsing error:", error);
      return [];
    }
  }

  private extractResults(html: string): SearchResult[] {
    const results: SearchResult[] = [];
    const data = this.findRelevantData(html);
    for (let i = 0; i < data.length; i += 6) {
      results.push({
        title: data[i],
        artist: data[i + 1],
        rating: parseFloat(data[i + 2]),
        type: data[i + 3],
        url: data[i + 4],
        song: data[i + 5],
      });
    }
    return results;
  }

  private printResults(results: SearchResult[]): void {
    results.forEach((result) => {
      console.log(
        `Title: ${result.title}\nArtist: ${result.artist}\nRating: ${result.rating}\nType: ${result.type}\nURL: ${result.url}\nSong: ${result.song}\n`
      );
    });
  }

  private findRelevantData(html: string): string[] {
    // implement
    return [];
  }
}
