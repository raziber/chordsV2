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
export namespace TabsTypes {
  export type StringName =
    | "C"
    | "C#"
    | "Db"
    | "D"
    | "D#"
    | "Eb"
    | "E"
    | "F"
    | "F#"
    | "Gb"
    | "G"
    | "G#"
    | "Ab"
    | "A"
    | "A#"
    | "Bb"
    | "B";

  export interface Strings {
    [key: string]: Position[]; // Allow any valid string name as key
  }

  export interface Position {
    fret: number | TabSpecialChar;
    position: number;
  }

  export enum TabSpecialChar {
    DeadNote = "x",
    GraceNote = "g",
    GhostNote = "(n)",
    HammerOn = "h",
    PullOff = "p",
    Release = "r",
    AccentedNote = ">",
    Tapping = "t",
    Bend = "b",
    BendRelease = "br",
    PreBend = "pb",
    PreBendRelease = "pbr",
    SlideUp = "/",
    SlideDown = "\\",
    Vibrato = "~",
    Slap = "s",
    Pop = "P",
    PalmMute = "PM",
    Trill = "TR",
    TremoloPicking = "N",
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
    Repeats = "repeats",
    LegendBorder = "legendBorder",
  }

  export interface Line {
    type: Type;
    lyrics?: string;
    chords?: ChordTypes.Position[];
    bars?: ChordTypes.Bar[];
    tabs?: TabsTypes.Strings;
    hasClosingBar?: boolean;
    repeats?: number;
    comments?: string;
  }
}

export namespace SongTypes {
  export interface Metadata {
    title: string;
    artist: string;
    album: string;
    year: string;
  }

  export interface Section {
    title: string;
    lines: SongLine.Line[];
  }

  export interface Song {
    metadata: Metadata;
    preIntro: string;
    song: Section[];
  }
}

// Re-export commonly used types
export type Line = SongLine.Line;
export type LineType = SongLine.Type;
