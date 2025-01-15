// Chord related types
export namespace ChordTypes {
  export type Base =
    | "C"
    | "C#"
    | "D"
    | "D#"
    | "Db"
    | "E"
    | "Eb"
    | "F"
    | "F#"
    | "G"
    | "G#"
    | "Gb"
    | "A"
    | "A#"
    | "Ab"
    | "B"
    | "Bb";

  export interface Chord {
    base: Base;
    modifiers: string[];
    bass?: Base;
  }

  export interface Position {
    chord: Chord;
    position: number;
  }

  export interface Bar {
    chords: Chord[];
  }
}

// Tab related types
export namespace TabTypes {
  export interface Position {
    fret: number;
    position: number;
  }

  export interface Strings {
    e?: Position[];
    B?: Position[];
    G?: Position[];
    D?: Position[];
    A?: Position[];
    E?: Position[];
  }
}

// Song line related types
export namespace SongLine {
  export enum Type {
    Lyrics = "lyrics",
    Chords = "chords",
    Bars = "bars",
    Tabs = "tabs",
    ChordsAndLyrics = "chordsAndLyrics",
    TabsAndLyrics = "tabsAndLyrics",
    ChordsAndTabs = "chordsAndTabs",
    All = "all",
  }

  export interface Line {
    type: Type;
    lyrics?: string;
    chords?: ChordTypes.Position[];
    bars?: ChordTypes.Bar[];
    tabs?: TabTypes.Strings;
    hasClosingBar?: boolean;
    repeats?: number;
    comments?: string;
  }
}

// Re-export commonly used types
export type Line = SongLine.Line;
export type LineType = SongLine.Type;
