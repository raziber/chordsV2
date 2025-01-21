/**
 * LineParser - Parses song lines ([tab] tags) into structured data
 *
 * Main responsibilities:
 * - Identifies line types (chords, tabs, lyrics, etc.)
 * - Parses special elements (repeats, bars, legends)
 * - Validates input structure
 *
 * Processing flow:
 * 1. Input validation
 * 2. Line splitting and empty line removal
 * 3. Special case detection (legend borders)
 * 4. Repeat extraction
 * 5. Content type analysis
 * 6. Specific content parsing (bars, chords, tabs)
 *
 * Output: SongLine.Line objects containing:
 * - Line type (chord, tab, lyric, etc.)
 * - Parsed content
 * - Repeat information
 * - Special formatting
 *
 * @example
 * const parser = new LineParser();
 * const result = parser.parseLine("[ch]Em[/ch]   [ch]G[/ch]   [ch]D[/ch]\/ Here are the lyrics");
 * // Returns: { type: SongLine.Type.Chord, content: [...chords] }
 */

import { SongLine, TabsTypes, ChordTypes } from "../types/types";
import { ChordParser } from "./chordParser";

export default class LineParser {
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
    const features = this.convertToFeatures(combinedContent, repeats);
    const type = this.determineLineType(features);

    return {
      type: type || SongLine.Type.Lyrics, // Fallback to lyrics if no specific type determined
      ...combinedContent,
      repeats,
    };
  }

  private static convertToFeatures(
    content: ExtractedLineContent,
    repeats?: number
  ): LineFeatures {
    const cleanedLyrics = content.lyrics
      ? this.removeNonAlphaNumeric(content.lyrics)
      : "";
    const hasChords = !!content.chords && content.chords.length > 0;
    const hasTabs =
      !!content.tabs &&
      Object.values(content.tabs).some((positions) => positions.length > 0);
    const hasLyrics = cleanedLyrics.length > 0;
    const isRepeat =
      repeats !== undefined && !hasChords && !hasTabs && !hasLyrics;

    return {
      hasChords,
      hasTabs,
      hasLyrics,
      isRepeat,
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
    "e",
  ];

  private static readonly TAB_REGEX_PATTERN = `(${LineParser.VALID_STRING_NAMES.map(
    (s) => s.replace("#", "\\#")
  ).join("|")})\\|([\\dpxh/s-]+\\|?)`;

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
      const withoutChords = this.extractChords(line)[0];
      const cleanedLine = withoutChords.trim();
      if (cleanedLine && !/^[|\s\(\)\[\]\{\}]*$/.test(cleanedLine)) {
        return false;
      }
    }
    return true;
  }

  static parseBarsLine(lines: string[]): SongLine.Line {
    const joined = lines.join(" ");
    let barStrings = joined.split("|").map((b) => b.trim());

    // Remove leading empty bars
    while (barStrings.length && !barStrings[0]) {
      barStrings.shift();
    }
    // Remove trailing empty bars
    while (barStrings.length && !barStrings[barStrings.length - 1]) {
      barStrings.pop();
    }

    const bars = barStrings.map((segment) => {
      const [_, chordPositions] = this.extractChords(segment);
      const chords = chordPositions.map((pos) => pos.chord);
      return { chords };
    });
    return { type: SongLine.Type.Bars, bars };
  }

  static extractTabs(line: string): [string, TabsTypes.Strings] {
    const [stringName, rawFretsDetails, lineWithoutTabs] = this.findTab(line);
    const frets = this.parseFrets(rawFretsDetails);

    return [lineWithoutTabs, { [stringName]: frets }];
  }

  static parseFrets(rawFretsDetails: string): TabsTypes.Position[] {
    const frets: TabsTypes.Position[] = [];
    let totalOffset = 0;
    const specialChars = Object.values(TabsTypes.TabSpecialChar).sort(
      (a, b) => b.length - a.length
    );

    for (let i = 0; i < rawFretsDetails.length; i++) {
      const char = rawFretsDetails[i];
      if (char === "-") {
        continue;
      }
      // Handle multi-digit numeric frets
      if (/\d/.test(char)) {
        let numericFret = char;
        while (
          i + 1 < rawFretsDetails.length &&
          /\d/.test(rawFretsDetails[i + 1])
        ) {
          numericFret += rawFretsDetails[++i];
        }
        frets.push({
          fret: parseInt(numericFret, 10),
          position: i - totalOffset,
        });
        continue;
      }
      // Check for multi-character special tabs first
      let matched = false;
      for (const sc of specialChars) {
        if (rawFretsDetails.substr(i, sc.length) === sc) {
          frets.push({
            fret: sc as TabsTypes.TabSpecialChar,
            position: i - totalOffset,
          });
          i += sc.length - 1;
          matched = true;
          break;
        }
      }
      if (!matched) {
        // If no multi-character match, just continue
      }
    }
    return frets;
  }

  static findTab(line: string): [string, string, string] {
    const match = line.match(this.TAB_STRING_REGEX);
    if (!match) return ["", "", line.trim()]; // Trim if no match is found

    if (match.length < 3) return ["", "", line.trim()]; // Ensure safe destructuring

    const stringName = match[1];
    const rawFretsDetails = match[2].replace(/\|$/, ""); // Remove trailing '|'
    const lineWithoutTabs = line.replace(match[0], "").trim(); // Remove match & trim

    return [stringName, rawFretsDetails, lineWithoutTabs];
  }

  private static extractChords(line: string): [string, ChordTypes.Position[]] {
    const chords: ChordTypes.Position[] = [];
    let lineWithoutChords = line;
    let totalOffset = 0;
    line.replace(/\[ch\](.*?)\[\/ch\]/g, (match, chord, index) => {
      const position = Math.floor(index + chord.length / 2 + totalOffset);
      totalOffset += chord.length;
      chords.push({ chord: ChordParser.parseChord(chord), position });
      lineWithoutChords = lineWithoutChords.replace(
        match,
        "".repeat(match.length)
      );
      return match;
    });

    // Preserve the original spacing
    return [lineWithoutChords, chords];
  }

  private static extractLyrics(line: string): string {
    // Don't trim - preserve spaces
    return line;
  }

  private static removeSpecialCharacters(line: string): string {
    return line.replace(/\(\)|\[\]|\{\}|''|""|\(\s*\)|\[\s*\]|\{\s*\}/g, "");
  }

  private static combineLines(
    contents: ExtractedLineContent[]
  ): ExtractedLineContent {
    const combined: ExtractedLineContent = {};

    contents.forEach((content) => {
      if (content.lyrics) {
        if (!combined.lyrics || combined.lyrics.length === 0) {
          combined.lyrics = content.lyrics.trimEnd();
        } else {
          combined.lyrics =
            combined.lyrics.trimEnd() + " " + content.lyrics.trimEnd();
        }
      }
      if (content.chords) {
        if (!combined.chords) combined.chords = [];
        content.chords.forEach((chord) => {
          combined.chords!.push({
            chord: chord.chord,
            position: Math.max(
              (combined.lyrics || "").length + chord.position,
              combined.chords?.[combined.chords.length - 1]?.position || 0
            ),
          });
        });
      }
      if (content.tabs) {
        if (!combined.tabs) combined.tabs = {};
        Object.keys(content.tabs).forEach((stringName) => {
          if (!(combined.tabs as TabsTypes.Strings)[stringName])
            (combined.tabs as TabsTypes.Strings)[stringName] = [];
          (content.tabs as TabsTypes.Strings)[stringName].forEach(
            (position) => {
              (combined.tabs as TabsTypes.Strings)[stringName].push({
                fret: position.fret,
                position: (combined.lyrics || "").length + position.position,
              });
            }
          );
        });
      }
    });

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
  tabs?: TabsTypes.Strings;
}
