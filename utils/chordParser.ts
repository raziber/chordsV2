export type ChordBase = "C" | "D" | "E" | "F" | "G" | "A" | "B";

export interface ChordModifier {
  type: ModifierType;
  value: string;
}

export type ModifierType =
  | "accidental" // #, b
  | "quality" // m, aug, dim, +
  | "extension" // 7, 9, 11, 13
  | "compound" // maj7, m7b5, etc
  | "addition" // add9, add11
  | "suspension" // sus2, sus4
  | "alteration" // b5, #5, b9, #9
  | "bass"; // /G, /F#, etc

export interface Chord {
  base: ChordBase;
  modifiers: ChordModifier[];
  bass?: ChordBase; // For slash chords
}

const COMPOUND_MODIFIERS = [
  "maj7",
  "maj9",
  "maj11",
  "maj13",
  "m7b5",
  "dim7",
  "7b5",
  "7#5",
  "mmaj7",
  "6/9",
] as const;

const QUALITY_MODIFIERS = ["m", "aug", "dim", "+"] as const;
const ACCIDENTAL_MODIFIERS = ["#", "b"] as const;
const EXTENSION_MODIFIERS = ["5", "6", "7", "9", "11", "13"] as const;
const SUSPENSION_MODIFIERS = ["sus2", "sus4"] as const;
const ADDITION_MODIFIERS = ["add9", "add11", "add13"] as const;
const ALTERATION_MODIFIERS = ["b5", "#5", "b9", "#9", "b11", "#11"] as const;

// Add validation constants
const INVALID_COMBINATIONS = [
  { modifiers: ["m", "+"], message: "Can't be minor and augmented" },
  { modifiers: ["sus2", "sus4"], message: "Can't have both sus2 and sus4" },
  { modifiers: ["7", "maj7"], message: "Can't have both 7 and maj7" },
] as const;

export class ChordParser {
  static parseChord(input: string): Chord {
    // Validate input format
    if (!input) throw new Error("Empty chord string");
    if (!/^[A-G]/.test(input))
      throw new Error("Invalid chord: must start with A-G");

    // Handle slash chords first
    const [chordPart, bassPart] = input.split("/");

    const baseMatch = chordPart.match(/^[A-G]/);
    const base = baseMatch![0] as ChordBase;
    let remaining = chordPart.slice(1);
    const modifiers: ChordModifier[] = [];

    // Validate no double accidentals
    if (
      (remaining.match(/#/g) || []).length > 1 ||
      (remaining.match(/b/g) || []).length > 1
    ) {
      throw new Error("Invalid chord: multiple accidentals");
    }

    // Parse modifiers sequentially
    while (remaining.length > 0) {
      let found = false;

      // Check compound modifiers first as they're the longest
      for (const mod of COMPOUND_MODIFIERS) {
        if (remaining.startsWith(mod)) {
          modifiers.push({ type: "compound", value: mod });
          remaining = remaining.slice(mod.length);
          found = true;
          break;
        }
      }
      if (found) continue;

      // Check alterations before individual accidentals and extensions
      for (const mod of ALTERATION_MODIFIERS) {
        if (remaining.startsWith(mod)) {
          modifiers.push({ type: "alteration", value: mod });
          remaining = remaining.slice(mod.length);
          found = true;
          break;
        }
      }
      if (found) continue;

      // Check remaining modifier types
      const remainingModifiers = [
        { type: "accidental", mods: ACCIDENTAL_MODIFIERS },
        { type: "quality", mods: QUALITY_MODIFIERS },
        { type: "extension", mods: EXTENSION_MODIFIERS },
        { type: "suspension", mods: SUSPENSION_MODIFIERS },
        { type: "addition", mods: ADDITION_MODIFIERS },
      ] as const;

      for (const { type, mods } of remainingModifiers) {
        for (const mod of mods) {
          if (remaining.startsWith(mod)) {
            modifiers.push({ type, value: mod });
            remaining = remaining.slice(mod.length);
            found = true;
            break;
          }
        }
        if (found) break;
      }

      if (!found) {
        throw new Error(`Invalid modifier sequence: ${remaining}`);
      }
    }

    // Validate modifier combinations
    this.validateModifierCombinations(modifiers);

    // Handle slash chord bass note
    const bass = bassPart ? (bassPart.charAt(0) as ChordBase) : undefined;
    if (bass) {
      if (!/^[A-G][#b]?$/.test(bassPart)) {
        throw new Error("Invalid bass note");
      }
      modifiers.push({ type: "bass", value: bassPart });
    }

    return { base, modifiers, bass };
  }

  private static validateModifierCombinations(
    modifiers: ChordModifier[]
  ): void {
    const values = modifiers.map((m) => m.value);

    for (const invalid of INVALID_COMBINATIONS) {
      if (invalid.modifiers.every((mod) => values.includes(mod))) {
        throw new Error(invalid.message);
      }
    }

    // Check for duplicate alterations
    const alterations = modifiers.filter((m) => m.type === "alteration");
    const uniqueAlterations = new Set(alterations.map((a) => a.value));
    if (alterations.length !== uniqueAlterations.size) {
      throw new Error("Duplicate alterations not allowed");
    }
  }

  static toString(chord: Chord): string {
    const mainPart =
      chord.base +
      chord.modifiers
        .filter((m) => m.type !== "bass")
        .map((m) => m.value)
        .join("");

    const bassModifier = chord.modifiers.find((m) => m.type === "bass");
    return bassModifier ? `${mainPart}/${bassModifier.value}` : mainPart;
  }
}
