import { ChordTypes } from "./types";
import { MODIFIERS } from "./chordModifiers";

export class ChordParser {
  static parseChord(input: string): ChordTypes.Chord {
    // Validate input format
    if (!input) throw new Error("Empty chord string");
    if (!/^[A-G]/.test(input))
      throw new Error("Invalid chord: must start with A-G");

    // Handle slash chords first
    const [chordPart, bassPart] = input.split("/");

    const baseMatch = chordPart.match(/^[A-G]/);
    const base = baseMatch![0] as ChordTypes.Base;
    let remaining = chordPart.slice(1);
    const modifiers: ChordTypes.Modifier[] = [];

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

      // Check quality modifiers first (since we have longer alternatives like 'min')
      for (const mod of QUALITY_MODIFIERS) {
        if (remaining.startsWith(mod)) {
          modifiers.push({ type: "quality", value: mod });
          remaining = remaining.slice(mod.length);
          found = true;
          break;
        }
      }
      if (found) continue;

      // Check extensions
      for (const mod of EXTENSION_MODIFIERS) {
        if (remaining.startsWith(mod)) {
          modifiers.push({ type: "extension", value: mod });
          remaining = remaining.slice(mod.length);
          found = true;
          break;
        }
      }
      if (found) continue;

      // Then check alterations
      for (const mod of ALTERATION_MODIFIERS) {
        if (remaining.startsWith(mod)) {
          // Special handling for combined extension+alteration
          if (mod.startsWith("7") || mod.startsWith("13")) {
            modifiers.push({
              type: "extension",
              value: mod.startsWith("7") ? "7" : "13",
            });
            modifiers.push({
              type: "alteration",
              value: mod.slice(mod.startsWith("7") ? 1 : 2),
            });
          } else {
            modifiers.push({ type: "alteration", value: mod });
          }
          remaining = remaining.slice(mod.length);
          found = true;
          break;
        }
      }
      if (found) continue;

      // Then check compounds
      for (const mod of COMPOUND_MODIFIERS) {
        if (remaining.startsWith(mod)) {
          modifiers.push({ type: "compound", value: mod });
          remaining = remaining.slice(mod.length);
          found = true;
          break;
        }
      }
      if (found) continue;

      // Check remaining modifier types
      const remainingModifiers = [
        { type: "accidental", mods: ACCIDENTAL_MODIFIERS },
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
    const bass = bassPart ? (bassPart.charAt(0) as ChordTypes.Base) : undefined;
    if (bass) {
      if (!/^[A-G][#b]?$/.test(bassPart)) {
        throw new Error("Invalid bass note");
      }
      modifiers.push({ type: "bass", value: bassPart });
    }

    return { base, modifiers, bass };
  }

  private static validateModifierCombinations(
    modifiers: ChordTypes.Modifier[]
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

  static toString(chord: ChordTypes.Chord): string {
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

// Re-export types for backward compatibility
export type Chord = ChordTypes.Chord;
export type ChordBase = ChordTypes.Base;
export type ChordModifier = ChordTypes.Modifier;
export type ModifierType = ChordTypes.ModifierType;
