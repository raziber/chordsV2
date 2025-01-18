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
    const features = this.convertToFeatures(combinedContent);
    const type = this.determineLineType(features);

    return {
      type: type || SongLine.Type.Lyrics, // Fallback to lyrics if no specific type determined
      ...combinedContent,
      repeats,
    };
  }

  private static convertToFeatures(
    content: ExtractedLineContent
  ): LineFeatures {
    const hasChords = !!content.chords?.length;
    const hasTabs = !!content.tabs && Object.keys(content.tabs).length > 0;
    const hasLyrics = !!content.lyrics?.trim();

    return {
      hasChords,
      hasTabs,
      hasLyrics,
      isRepeat: false,
      extractedChords: content.chords?.map((c) => c.chord.base),
      extractedTabs: content.tabs ? Object.keys(content.tabs) : [],
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

  private static readonly VALID_STRING_NAMES: string[] = [
    "C",
    "C#",
    "Db",
    "D",
    "D#",
    "Eb",
    "E",
    "F",
    "F#",
    "Gb",
    "G",
    "G#",
    "Ab",
    "A",
    "A#",
    "Bb",
    "B",
  ];

  private static readonly TAB_REGEX_PATTERN = `^(${LineParser.VALID_STRING_NAMES.map(
    (s) => s.replace("#", "\\#")
  ).join("|")})\\|([-\\d\\s]+(?:\\||$))`;

  private static readonly TAB_STRING_REGEX = new RegExp(
    LineParser.TAB_REGEX_PATTERN
  );

  static extractTabContent(line: string): ExtractedContent {
    const tabs: string[] = [];
    const remainingLine = line.replace(
      this.TAB_STRING_REGEX,
      (match, stringName, tabContent) => {
        tabs.push(`${stringName}|${tabContent}`);
        return tabContent.startsWith(" ") ? tabContent : "";
      }
    );
    return { content: tabs, remainingLine: remainingLine.trim() };
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
    return line
      .trim()
      .split("")
      .every((char) => char === "*");
  }

  private static extractRepeats(
    lines: string[]
  ): [string[], number | undefined] {
    const repeatRegex = /(?:^|\s)(\d+[xX]|[xX]\d+)(?:\s|$)/;
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(repeatRegex);
      if (match) {
        const fullMatch = match[0];
        const repeat = match[1];
        const repeatNum = parseInt(repeat.replace(/[xX]/, ""));
        const newLines = [...lines];
        const originalLine = newLines[i];
        newLines[i] = lines[i].replace(
          fullMatch,
          fullMatch.startsWith(" ") ? " " : ""
        );
        return [newLines, repeatNum];
      }
    }
    return [lines, undefined];
  }

  private static isBarsLine(lines: string[]): boolean {
    for (const line of lines) {
      const withoutChords = this.extractChordContent(line).remainingLine;
      const cleanedLine = withoutChords.trim();
      if (cleanedLine && !/^[|\s\(\)\[\]\{\}]*$/.test(cleanedLine)) {
        return false;
      }
    }
    return true;
  }

  private static parseBarsLine(lines: string[]): SongLine.Line {
    // Implementation needed
    return { type: SongLine.Type.Bars };
  }

  private static extractTabs(line: string): [string, TabTypes.Strings] {
    // Only proceed if line starts with a valid string indicator followed by |
    if (
      !line.match(
        new RegExp(
          `^(${this.VALID_STRING_NAMES.map((s) => s.replace("#", "\\#")).join(
            "|"
          )})\\|`
        )
      )
    ) {
      return [line, {}];
    }

    const match = line.match(this.TAB_STRING_REGEX);
    if (!match) return [line, {}];

    const [fullMatch, stringName, tabContent] = match;
    if (!tabContent.startsWith(" ")) return [line, {}];

    const positions: TabTypes.Position[] = [];
    let currentPosition = 0;

    const cleanContent = tabContent.replace(/\|$/, "");
    cleanContent.replace(/(\d+)/g, (match, fret) => {
      positions.push({
        fret: parseInt(fret),
        position: currentPosition,
      });
      currentPosition += match.length + 1;
      return match;
    });

    // Don't modify the line if it's not actually a tab line (e.g., just numbers)
    if (positions.length === 0) {
      return [line, {}];
    }

    return [
      line.replace(fullMatch, "").trim(),
      { [stringName]: positions } as TabTypes.Strings,
    ];
  }

  private static extractChords(line: string): [string, ChordTypes.Position[]] {
    const chords: ChordTypes.Position[] = [];
    let lineWithoutChords = line;
    let totalOffset = 0;

    line.replace(/\[ch\](.*?)\[\/ch\]/g, (match, chord, offset) => {
      const realPosition = offset - totalOffset;
      // Split chord into base and modifiers
      const [base, ...modifiers] = this.parseChordParts(chord);
      chords.push({
        chord: { base: base as ChordTypes.Base, modifiers },
        position: realPosition,
      });
      totalOffset += match.length - chord.length;
      lineWithoutChords = lineWithoutChords.replace(
        match,
        " ".repeat(chord.length)
      );
      return "";
    });

    return [lineWithoutChords, chords];
  }

  private static parseChordParts(chord: string): [string, ...string[]] {
    // Basic chord parsing - handle common patterns
    const match = chord.match(/^([A-G][b#]?)(.*)$/);
    if (!match) return [chord, []];
    const [_, base, modifiers] = match;
    if (!modifiers) return [base];
    return [base, modifiers];
  }

  private static extractLyrics(line: string): string {
    // Implementation needed
    return line;
  }

  private static removeSpecialCharacters(line: string): string {
    return line.replace(/\(\)|\[\]|\{\}|''|""|\(\s*\)|\[\s*\]|\{\s*\}/g, "");
  }

  private static combineLines(
    contents: ExtractedLineContent[]
  ): ExtractedLineContent {
    const combined: ExtractedLineContent = {};

    // Combine lyrics with single spaces
    const lyrics = contents
      .map((c) => c.lyrics?.trim())
      .filter((l): l is string => !!l)
      .join(" ");
    if (lyrics) combined.lyrics = lyrics;

    // Combine chords with offset
    let offset = 0;
    const allChords: ChordTypes.Position[] = [];
    contents.forEach((content) => {
      if (content.chords) {
        allChords.push(
          ...content.chords.map((c) => ({
            ...c,
            position: c.position + offset,
          }))
        );
      }
      if (content.lyrics) {
        offset += content.lyrics.length + 1;
      }
    });
    if (allChords.length) combined.chords = allChords;

    // Combine tabs
    const allTabs: TabTypes.Strings = {};
    contents.forEach((content) => {
      if (content.tabs) {
        Object.entries(content.tabs).forEach(([string, positions]) => {
          if (!allTabs[string]) allTabs[string] = [];
          allTabs[string].push(...positions);
        });
      }
    });
    if (Object.keys(allTabs).length) combined.tabs = allTabs;

    return combined;
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
  chords?: ChordTypes.Position[];
  tabs?: TabTypes.Strings;
}
