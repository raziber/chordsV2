import { SongLine, TabTypes, ChordTypes } from "./types";

export class LineParser {
  private static readonly LINE_PATTERN_TO_TYPE: Record<string, SongLine.Type> =
    {
      // [chords, tabs, lyrics, repeats]
      "111x": SongLine.Type.All, // Has everything except repeats
      "110x": SongLine.Type.ChordsAndTabs, // Has chords and tabs
      "101x": SongLine.Type.ChordsAndLyrics, // Has chords and lyrics
      "100x": SongLine.Type.Chords, // Has only chords
      "011x": SongLine.Type.TabsAndLyrics, // Has tabs and lyrics
      "010x": SongLine.Type.Tabs, // Has only tabs
      "001x": SongLine.Type.Lyrics, // Has only lyrics
      "0001": SongLine.Type.Repeats, // Is a repeat marker
    };

  // Public methods for testing
  static extractChordContent(line: string): ExtractedContent {
    const chords: string[] = [];
    const remainingLine = line.replace(
      /\[ch\](.*?)\[\/ch\]/g,
      (match, chord) => {
        chords.push(chord);
        return "";
      }
    );
    return { content: chords, remainingLine };
  }

  static extractTabContent(line: string): ExtractedContent {
    const tabs: string[] = [];
    const remainingLine = line.replace(
      /^([eEADGB]\|.*?\||[eEADGB]\|[^|\s]*?)(?:\s|$)/,
      (match, tab) => {
        tabs.push(tab);
        return match.slice(tab.length);
      }
    );
    return { content: tabs, remainingLine };
  }

  static extractRepeatContent(line: string): ExtractedContent {
    const repeats: string[] = [];
    const remainingLine = line.replace(
      /(?:^|\s)(\d+[xX]|[xX]\d+)(?:\s|$)/g,
      (match, repeat) => {
        repeats.push(repeat.trim());
        // Return single space only when we're not at the start or end of the line
        const isStart = match.startsWith(" ");
        const isEnd = match.endsWith(" ");
        return isStart && isEnd ? " " : "";
      }
    );
    return { content: repeats, remainingLine: remainingLine.trim() };
  }

  static removeNonAlphaNumeric(line: string): string {
    return line.replace(/[^a-zA-Z0-9\s.,!?'-]/g, "").trim();
  }

  static hasTextContent(cleanedLine: string): boolean {
    return cleanedLine.trim().length > 0;
  }

  static createPatternKey(features: LineFeatures): string {
    return [
      features.hasChords ? "1" : "0",
      features.hasTabs ? "1" : "0",
      features.hasLyrics ? "1" : "0",
      features.isRepeat ? "1" : "x",
    ].join("");
  }

  static determineLineType(
    lineFeatures: LineFeatures
  ): SongLine.Type | undefined {
    const patternKey = this.createPatternKey(lineFeatures);
    return this.LINE_PATTERN_TO_TYPE[patternKey];
  }

  static initializeFeatures(): LineFeatures {
    return {
      hasChords: false,
      hasTabs: false,
      hasLyrics: false,
      isRepeat: false,
    };
  }

  // Main public interface
  static detectLineTypes(input: string): SongLine.Type[] {
    this.validateInput(input);
    const nonEmptyLines = this.removeEmptyLines(input.split("\n"));
    return this.analyzeLines(nonEmptyLines);
  }

  // Private helper methods
  private static validateInput(input: string): void {
    if (!input) throw new Error("Empty line string");
  }

  private static removeEmptyLines(lines: string[]): string[] {
    return lines.filter((line) => line.trim() !== "");
  }

  private static analyzeLines(lines: string[]): SongLine.Type[] {
    return lines.flatMap((line) => {
      const features = this.detectLineFeatures(line);
      return features
        .map((f) => this.determineLineType(f))
        .filter((type): type is SongLine.Type => type !== undefined);
    });
  }

  private static detectLineFeatures(line: string): LineFeatures[] {
    const features = this.initializeFeatures();

    // Process all content at once
    const { remainingLine: afterChords } = this.processChords(line, features);
    const { remainingLine: afterTabs } = this.processTabs(
      afterChords.trim(),
      features
    );
    const { content: repeats, remainingLine: afterRepeats } =
      this.extractRepeatContent(afterTabs.trim());

    // Determine if there's any actual content
    features.hasLyrics = this.checkForLyrics(afterRepeats);
    const hasContent =
      features.hasChords || features.hasTabs || features.hasLyrics;

    // Only consider it a repeat if it's the ONLY thing in the line
    if (!hasContent && repeats.length > 0) {
      features.isRepeat = true;
      features.extractedRepeats = repeats;
    }

    return [features];
  }

  private static processLineWithoutRepeats(
    line: string,
    features: LineFeatures
  ): string {
    // Process chords
    const { remainingLine: afterChords } = this.processChords(line, features);

    // Process tabs
    const { remainingLine: afterTabs } = this.processTabs(
      afterChords.trim(),
      features
    );

    return afterTabs.trim();
  }

  private static processLine(line: string, features: LineFeatures): string {
    // Process chords
    const { remainingLine: afterChords } = this.processChords(line, features);

    // Process tabs
    const { remainingLine: afterTabs } = this.processTabs(
      afterChords.trim(),
      features
    );

    // Process repeats and maintain proper spacing
    const { remainingLine: afterRepeats } = this.processRepeats(
      afterTabs.trim(),
      features
    );

    // Ensure consistent spacing for lyrics detection
    return afterRepeats.trim();
  }

  private static processChords(
    line: string,
    features: LineFeatures
  ): ExtractedContent {
    const extraction = this.extractChordContent(line);
    features.hasChords = extraction.content.length > 0;
    features.extractedChords = extraction.content;
    return extraction;
  }

  private static processTabs(
    line: string,
    features: LineFeatures
  ): ExtractedContent {
    const extraction = this.extractTabContent(line);
    features.hasTabs = extraction.content.length > 0;
    features.extractedTabs = extraction.content;
    return extraction;
  }

  private static processRepeats(
    line: string,
    features: LineFeatures
  ): ExtractedContent {
    const extraction = this.extractRepeatContent(line);
    features.isRepeat = extraction.content.length > 0;
    features.extractedRepeats = extraction.content;
    return extraction;
  }

  private static checkForLyrics(line: string): boolean {
    const cleanedLine = this.removeNonAlphaNumeric(line);
    // Consider a line with just spaces, empty, or only repeat markers as not having lyrics
    return (
      this.hasTextContent(cleanedLine) &&
      !/^(?:\d+[xX]|[xX]\d+)$/.test(cleanedLine.trim())
    );
  }

  private static cleanLine(line: string): string {
    const { remainingLine: withoutChords } = this.extractChordContent(line);
    const { remainingLine: withoutTabs } =
      this.extractTabContent(withoutChords);
    const { remainingLine: withoutRepeats } =
      this.extractRepeatContent(withoutTabs);
    return this.removeNonAlphaNumeric(withoutRepeats);
  }

  private static removeTabs(line: string): string {
    // Remove tab notation (everything after string indicator)
    return line.replace(/^[eEADGB]\|.*$/, "");
  }

  private static removeRepeats(line: string): string {
    // Remove x3, X3, 3x, 3X patterns
    return line.replace(/(?:\d+[xX]|[xX]\d+)/, "");
  }

  // For detecting mixed content (when we need to know if there are lyrics WITH other elements)
  private static hasLyricContent(line: string): boolean {
    return this.hasTextContent(this.cleanLine(line));
  }
}

interface ExtractedContent {
  content: string[];
  remainingLine: string;
}

interface LineFeatures {
  hasChords: boolean;
  hasTabs: boolean;
  hasLyrics: boolean;
  isRepeat: boolean;
  extractedChords?: string[];
  extractedTabs?: string[];
  extractedRepeats?: string[];
}
