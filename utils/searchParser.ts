import HtmlUtils from "./htmlUtils";

export interface SearchResult {
  title: string;
  artist: string;
  url: string;
  rating: number;
  type: string;
  song: string;
}

interface FieldDefinition {
  pattern: RegExp;
  transform?: (value: string) => string | number;
}

export default class Search {
  private readonly fieldDefinitions: Record<
    keyof SearchResult,
    FieldDefinition
  > = {
    title: {
      pattern: /<span class="song-name[^>]*>([^<]+)<\/span>/,
    },
    artist: {
      pattern: /<span class="artist-name[^>]*>([^<]+)<\/span>/,
    },
    url: {
      pattern: /<a class="song result-link" href="([^"]+)"/,
    },
    rating: {
      pattern: /<span class="rating[^>]*>([^<]+)<\/span>/,
      transform: parseFloat,
    },
    type: {
      pattern: /<span class="type[^>]*>([^<]+)<\/span>/,
    },
    song: {
      pattern: /<span class="song[^>]*>([^<]+)<\/span>/,
    },
  };

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
    const resultsRaw = this.findRawResults(html);
    return resultsRaw.map((raw) => this.extractFields(raw));
  }

  private findRawResults(html: string): string[] {
    const results: string[] = [];
    let pos = 0;

    while ((pos = this.findNextResultStart(html, pos)) !== -1) {
      const jsonObject = this.extractJsonObject(html, pos + 1);
      if (jsonObject) {
        results.push(jsonObject);
        pos += jsonObject.length;
      }
      pos++; // Move past current position
    }

    return results;
  }

  private findNextResultStart(html: string, startPos: number): number {
    return html.indexOf(',{"id"', startPos);
  }

  private extractJsonObject(html: string, startPos: number): string | null {
    let bracketCount = 0;
    let i = startPos;

    for (; i < html.length; i++) {
      if (this.isOpenBracket(html[i])) bracketCount++;
      if (this.isCloseBracket(html[i])) {
        bracketCount--;
        if (this.isJsonComplete(bracketCount)) {
          return html.substring(startPos, i + 1);
        }
      }
    }
    return null;
  }

  private isOpenBracket(char: string): boolean {
    return char === "{";
  }

  private isCloseBracket(char: string): boolean {
    return char === "}";
  }

  private isJsonComplete(bracketCount: number): boolean {
    return bracketCount === 0;
  }

  private extractFields(raw: string): SearchResult {
    const result = {} as SearchResult;

    for (const [field, definition] of Object.entries(this.fieldDefinitions)) {
      const matches = this.regexSearch(raw, definition.pattern);
      const value = matches[0] || "";
      const transformedValue = definition.transform
        ? definition.transform(value)
        : value;
      (result as any)[field] = transformedValue;
    }

    return result;
  }

  private regexSearch(text: string, regex: RegExp): string[] {
    const results: string[] = [];
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      results.push(match[1]);
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
}
