import { SongLine, TabTypes, ChordTypes } from "./types";
import { ChordParser } from "./chordParser";

export function songLineParser(input: string): SongLine.Line | null {
  if (input.trim() === "") return null;

  const lines = input.split("\n");
  const result: SongLine.Line = { type: SongLine.Type.Lyrics };

  // Parse comments and repeats
  const commentMatch = input.match(/\/\/\s*(.+)$/);
  if (commentMatch) {
    result.comments = commentMatch[1].trim();
    input = input.replace(/\/\/.*$/, "");
  }

  const repeatMatch = input.match(/x(\d+)/i);
  if (repeatMatch) {
    result.repeats = parseInt(repeatMatch[1]);
    input = input.replace(/x\d+/i, "");
  }

  // Validate chord tags
  const openTags = (input.match(/\[ch\]/g) || []).length;
  const closeTags = (input.match(/\[\/ch\]/g) || []).length;
  if (openTags !== closeTags) {
    throw new Error("Malformed chord tags");
  }

  // Check for tabs
  const tabLines = lines.filter((l) => l.match(/^[eEADGB]\|/));
  if (tabLines.length > 0) {
    result.tabs = parseTabLines(tabLines);
    result.type = SongLine.Type.Tabs;
  }

  // Check for lyrics (do this before chords to help with type detection)
  const lyricsLine = lines.find(
    (l) => !l.match(/^[eEADGB]\|/) && !l.includes("[ch]") && l.trim()
  );
  if (lyricsLine) {
    result.lyrics = lyricsLine;
  }

  // Check for chords
  const chordMatches = [...input.matchAll(/\[ch\](.*?)\[\/ch\]/g)];
  if (chordMatches.length > 0) {
    const chordsResult = parseChordLine(input, lines);
    if (chordsResult.positions) {
      result.chords = chordsResult.positions;
    } else if (chordsResult.bars) {
      result.bars = chordsResult.bars;
      result.hasClosingBar = chordsResult.hasClosingBar;
    }
    result.type = chordsResult.type;
  }

  // Update type based on content
  if (result.lyrics) {
    if (result.chords && result.tabs) {
      result.type = SongLine.Type.All;
    } else if (result.chords) {
      result.type = SongLine.Type.ChordsAndLyrics;
    } else if (result.tabs) {
      result.type = SongLine.Type.TabsAndLyrics;
    } else {
      result.type = SongLine.Type.Lyrics;
      result.lyrics = result.lyrics.trim();
    }
  } else if (result.chords && result.tabs) {
    result.type = SongLine.Type.ChordsAndTabs;
  }

  return result;
}

function parseTabLines(tabLines: string[]): TabTypes.Strings {
  const result: TabTypes.Strings = {};
  const stringNames = ["e", "B", "G", "D", "A", "E"];

  tabLines.forEach((line) => {
    const string = line[0].toLowerCase();
    if (!stringNames.includes(string)) return;

    const positions: TabTypes.Position[] = [];
    const frets = line.slice(2).split("");
    let currentPos = 0;

    for (let i = 0; i < frets.length; i++) {
      if (frets[i] !== "-" && frets[i] !== "|") {
        if (frets[i] === "x") {
          positions.push({ fret: -1, position: currentPos });
        } else {
          let fretNum = "";
          while (frets[i] && /[0-9]/.test(frets[i])) {
            fretNum += frets[i];
            i++;
          }
          if (fretNum) {
            positions.push({ fret: parseInt(fretNum), position: currentPos });
          }
        }
      }
      currentPos++;
    }

    result[string as keyof TabTypes.Strings] = positions;
  });

  return result;
}

function parseChordLine(
  input: string,
  lines: string[]
): {
  positions?: ChordTypes.Position[];
  bars?: ChordTypes.Bar[];
  hasClosingBar?: boolean;
  type: SongLine.Type;
} {
  if (input.startsWith("|")) {
    const bars: ChordTypes.Bar[] = [];
    const barMatches = input.split("|").filter(Boolean);
    barMatches.forEach((barContent) => {
      const chordMatches = [...barContent.matchAll(/\[ch\](.*?)\[\/ch\]/g)];
      if (chordMatches.length) {
        bars.push({
          chords: chordMatches.map((m) => ChordParser.parseChord(m[1])),
        });
      }
    });
    return {
      bars,
      hasClosingBar: input.endsWith("|"),
      type: SongLine.Type.Bars,
    };
  }

  const chordMatches = [...input.matchAll(/\[ch\](.*?)\[\/ch\]/g)];
  const chordLine = lines.find((l) => l.includes("[ch]")) || "";
  const lyricsLine = lines.find((l) => !l.includes("[ch]") && l.trim());

  const calculatePosition = (match: RegExpMatchArray): number => {
    const startIndex = chordLine.indexOf(match[0]);
    const chordText = match[1];
    // Count only to start of actual chord text
    const textBeforeChord = chordLine
      .substring(0, startIndex)
      .replace(/\[ch\]|\[\/ch\]/g, "");
    return textBeforeChord.length;
  };

  if (!lyricsLine) {
    return {
      type: SongLine.Type.Chords,
      positions: chordMatches.map((match) => ({
        chord: ChordParser.parseChord(match[1]),
        position: calculatePosition(match),
      })),
    };
  }

  return {
    positions: chordMatches.map((match) => ({
      chord: ChordParser.parseChord(match[1]),
      position: calculatePosition(match),
    })),
    type: SongLine.Type.ChordsAndLyrics,
  };
}
ld parse chords with positions