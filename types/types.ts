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
    // must have
    id: number;
    song_id: number;
    song_name: string;
    artist_id: number;
    artist_name: string;
    votes: number;
    type: string;
    tab_url: string;

    // optional
    part?: string;
    version?: number;
    difficulty?: string;
    rating?: number;
    date?: string;
    status?: string;
    preset_id?: number;
    tab_access_type?: string;
    tp_version?: number;
    tonality_name?: string;
    version_description?: string;
    verified?: number;
    recording?: {
      is_acoustic?: number;
      tonality_name?: string;
      performance?: any | null;
      recording_artists?: any[];
      video_urls?: any | null;
    };
    album_cover?: {
      has_album_cover?: boolean;
      web_album_cover?: {
        small?: string;
      };
    };
    artist_cover?: {
      has_artist_cover?: boolean;
      web_artist_cover?: {
        small?: string;
      };
    };
    artist_url?: string;
    date_update?: string;
    user_id?: number;
    user_iq?: number;
    username?: string;
    type_name?: string;
    best_pro_tab_url?: string;
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
