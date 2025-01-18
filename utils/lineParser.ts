import { contains } from "cheerio";
import { SongLine, TabTypes, ChordTypes } from "./types";

export class LineParser {
  static parseLine(line: string): SongLine.Line {
    this.validateInput(line);
    const subLines = this.prepareSubLines(line);
    return this.parseProcessedSubLines(subLines);
  }

  private static prepareSubLines(line: string): string[] {
    const nonEmptySubLines = this.removeEmptyLines(line.split("\n"));

    if (this.isLegendBorderLine(nonEmptySubLines[0])) {
      return ["legend-border"];
    }

    return nonEmptySubLines;
  }

  private static parseProcessedSubLines(subLines: string[]): SongLine.Line {
    if (subLines[0] === "legend-border") {
      return { type: SongLine.Type.LegendBorder };
    }

    const [noRepeatsLines, repeats] = this.extractRepeats(subLines);

    if (this.isBarsLine(noRepeatsLines)) {
      return this.parseBarsLine(noRepeatsLines);
    }

    const extractedContent = this.extractContentFromLines(noRepeatsLines);
    const combinedContent = this.combineLines(extractedContent);
    const type = this.determineLineType(combinedContent);

    return {
      type,
      ...combinedContent,
      repeats,
    };
  }

  private static extractContentFromLines(
    lines: string[]
  ): ExtractedLineContent[] {
    return lines.map((line) => {
      const [noTabsLine, tabs] = this.extractTabs(line);
      const [noChordsLine, chords] = this.extractChords(noTabsLine);
      const lyrics = this.extractLyrics(
        this.removeSpecialCharacters(noChordsLine)
      );

      return { lyrics, chords, tabs };
    });
  }

  private static determineSubLinesTypes(lines: string[]): SongLine.Type[] {
    return lines.flatMap((line) => {
      const features = this.detectLineFeatures(line);
      return features
        .map((f) => this.determineLineType(f))
        .filter((type): type is SongLine.Type => type !== undefined);
    });
  }

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

  // Private helper methods
  private static validateInput(input: string): void {
    if (!input) throw new Error("Empty line string");
  }

  private static removeEmptyLines(lines: string[]): string[] {
    return lines.filter((line) => line.trim() !== "");
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

  private static isLegendBorderLine(line: string): boolean {
    if (line.trim() containsOnly "*" chars) return true;
    return false;
  }

  private static extractRepeats(
    lines: string[]
  ): [string[], number | undefined] {
    // should find any x or X followed by a number or proceeded by a number (can be more than a single digit number)
    // will return the input without the repeats and the number of repeats
    return [lines, undefined];
  }

  private static isBarsLine(lines: string[]): boolean {
    // should check if there are only chord tags, vertical bars '|' and brackets '(', ')','[', ']', '{', '}' in the line
    // if that is the case then this is a bars line
    // can use a function called extractChords to get the line without the chords and then check if the line contains only the allowed characters (and spaces are allowed)
    return false;
  }

  private static parseBarsLine(lines: string[]): SongLine.Line {
    // Implementation needed
    return { type: SongLine.Type.Bars };
  }

  private static extractTabs(line: string): [string, any] {
    // should find any combination of a letter (string name) and right after that a vertical bar '|' and then a hypen '-'.
    // that means it is a start of a tab notation for that string.
    // should return the line without the tabs and the tabs found.
    // the tabs themselves should include the string name and the tab information.
    // it will use a function called parse tabs to parse the tab information.
    return [line, undefined];
  }

  private static extractChords(line: string): [string, any] {
    // should find any text between [ch] and [/ch] tags
    // should return the line without the chords and the chords found.
    // the chords themselves should be parsed using a function from the chordParser class.
    // the output of this extractChords function should be string and then a list of chords with positions where the positions are the center of the chord, disregarding the ch tabs (start and end) and rounding down to the nearest integer.
    return [line, undefined];
  }

  private static extractLyrics(line: string): string {
    // Implementation needed
    return line;
  }

  private static removeSpecialCharacters(line: string): string {
    // should remove empty (), [], {}, '', "", do not trim spaces.
    // should return the line without the special characters.
    // should remove nested special characters only if they are closed and empty.
    return line;
  }

  private static combineLines(contents: ExtractedLineContent[]): ExtractedLineContent {
    // should take all lyrics and string them together - have a space between them.
    // should take all chords and add them to a single list (with positions added so that the added positions start where the last chord ended).
    // should take the tabs and combine into a strings type object.
    return {};
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

interface ExtractedLineContent {
  lyrics?: string;
  chords?: any;
  tabs?: any;
}
