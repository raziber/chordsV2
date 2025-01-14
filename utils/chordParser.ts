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

    // Parse all modifier types
    this.parseModifiers(remaining, modifiers);

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

  private static parseModifiers(
    input: string,
    modifiers: ChordModifier[]
  ): void {
    let remaining = input;

    // Compound modifiers (need to check first as they're combinations)
    const compoundMod = COMPOUND_MODIFIERS.find((mod) =>
      remaining.includes(mod)
    );
    if (compoundMod) {
      modifiers.push({ type: "compound", value: compoundMod });
      remaining = remaining.replace(compoundMod, "");
    }

    // Order matters for the rest
    this.checkModifiers(
      remaining,
      "accidental",
      ACCIDENTAL_MODIFIERS,
      modifiers
    );
    this.checkModifiers(remaining, "quality", QUALITY_MODIFIERS, modifiers);
    this.checkModifiers(
      remaining,
      "suspension",
      SUSPENSION_MODIFIERS,
      modifiers
    );
    this.checkModifiers(remaining, "addition", ADDITION_MODIFIERS, modifiers);
    this.checkModifiers(
      remaining,
      "alteration",
      ALTERATION_MODIFIERS,
      modifiers
    );
    this.checkModifiers(remaining, "extension", EXTENSION_MODIFIERS, modifiers);
  }

  private static checkModifiers(
    input: string,
    type: ModifierType,
    possibleMods: readonly string[],
    modifiers: ChordModifier[]
  ): void {
    for (const mod of possibleMods) {
      if (input.includes(mod)) {
        modifiers.push({ type, value: mod });
      }
    }
  }

  static toString(chord: Chord): string {
    const orderPriority: ModifierType[] = [
      "accidental",
      "quality",
      "suspension",
      "extension",
      "addition",
      "alteration",
      "compound",
      "bass",
    ];

    const sortedModifiers = chord.modifiers.sort(
      (a, b) => orderPriority.indexOf(a.type) - orderPriority.indexOf(b.type)
    );

    const mainPart =
      chord.base +
      sortedModifiers
        .filter((m) => m.type !== "bass")
        .map((m) => m.value)
        .join("");

    const bassModifier = sortedModifiers.find((m) => m.type === "bass");
    return bassModifier ? `${mainPart}/${bassModifier.value}` : mainPart;
  }
}
