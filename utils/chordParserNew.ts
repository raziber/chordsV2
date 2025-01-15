import { ChordTypes } from "./types";
import { MODIFIERS } from "./chordModifiers";

export class ChordParser {
  static parseChord(input: string): ChordTypes.Chord {
    this.validateNotEmpty(input);
    this.validateFirstChar(input);
    const [base, rawModifiersWithBass] = this.getBase(input);
    const [bass, rawModifiers] = this.getBassNote(rawModifiersWithBass);
    const modifiers = this.getModifiers(rawModifiers);

    return { base, modifiers, bass };
  }

  static validateNotEmpty(input: string): void {
    if (!input) throw new Error("Empty chord string");
  }

  static validateFirstChar(input: string): void {
    if (!/^[A-G]/.test(input))
      throw new Error("Invalid chord: must start with A-G");
  }

  static getBase(input: string): [ChordTypes.Base, string] {
    const baseMatch = input.match(/^[A-G][#b]?/);
    if (!baseMatch) throw new Error("Invalid chord: no base found");
    const base = baseMatch[0] as ChordTypes.Base;
    const rawModifiers = input.slice(baseMatch[0].length);
    return [base, rawModifiers];
  }

  static sortModifiersByLength(): string[] {
    return [...MODIFIERS].sort((a, b) => b.length - a.length);
  }

  static getModifiers(rawModifiers: string | undefined): string[] {
    if (!rawModifiers) return [];
    const found: Array<{ value: string; index: number }> = [];
    let remaining = rawModifiers;

    const sortedModifiers = this.sortModifiersByLength();

    // First pass: find all modifiers and their positions
    while (remaining.length > 0) {
      let foundInPass = false;

      for (const mod of sortedModifiers) {
        const index = remaining.indexOf(mod);
        if (index !== -1) {
          found.push({ value: mod, index });
          // Mask out the found modifier with spaces
          remaining =
            remaining.slice(0, index) +
            " ".repeat(mod.length) +
            remaining.slice(index + mod.length);
          foundInPass = true;
          break;
        }
      }

      if (!foundInPass) {
        const firstRemaining = remaining.trim()[0];
        if (firstRemaining) {
          throw new Error(`Invalid modifier character: ${firstRemaining}`);
        }
        break;
      }
    }

    // Return modifiers in their original order
    return found.sort((a, b) => a.index - b.index).map((m) => m.value);
  }

  private static getBassNote(
    rawModifiers: string
  ): [ChordTypes.Base | undefined, string | undefined] {
    if (!rawModifiers.includes("/")) return [undefined, rawModifiers];

    const [beforeBass, bassPart] = rawModifiers.split("/");
    if (!bassPart) return [undefined, beforeBass];

    const bassMatch = bassPart.match(/^[A-G][#b]?/);
    if (!bassMatch) {
      throw new Error("Invalid bass note");
    }

    return [bassMatch[0] as ChordTypes.Base, beforeBass];
  }
}
