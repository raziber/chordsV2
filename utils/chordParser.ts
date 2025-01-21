import { ChordTypes } from "@/types/types";
import { MODIFIERS } from "./chordModifiers";

export class ChordParser {
  static parseChord(input: string): ChordTypes.Chord {
    this.validateNotEmpty(input);
    this.validateFirstChar(input);
    const [base, rawModifiersWithBass] = this.getBase(input);
    const [bass, rawModifiers] = this.getBassNote(rawModifiersWithBass);
    const modifiers = this.getModifiers(rawModifiers);

    return { base, modifiers, bass } as ChordTypes.Chord;
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
    if (!rawModifiers?.trim()) return [];

    const sortedModifiers = this.sortModifiersByLength();
    const found = this.findModifiersWithPositions(
      rawModifiers,
      sortedModifiers
    );

    this.checkForRemainingCharacters(found, rawModifiers);

    return this.sortByPosition(found);
  }

  static checkForRemainingCharacters(
    found: Array<{ value: string; index: number }>,
    rawModifiers: string
  ): void {
    if (!found.length && rawModifiers.trim()) {
      throw new Error(`Invalid modifier sequence: ${rawModifiers.trim()}`);
    }
  }

  private static findModifiersWithPositions(
    input: string,
    modifiers: string[]
  ): Array<{ value: string; index: number }> {
    const found: Array<{ value: string; index: number }> = [];
    let remaining = input;

    while (remaining.trim()) {
      const nextModifier = this.findNextModifier(remaining, modifiers);
      if (!nextModifier) break;

      const { modifier, index } = nextModifier;
      found.push({ value: modifier, index });
      remaining = this.maskFoundModifier(remaining, modifier, index);
    }

    return found;
  }

  private static findNextModifier(
    input: string,
    modifiers: string[]
  ): { modifier: string; index: number } | null {
    for (const mod of modifiers) {
      const index = input.indexOf(mod);
      if (index !== -1) {
        return { modifier: mod, index };
      }
    }
    return null;
  }

  private static maskFoundModifier(
    input: string,
    modifier: string,
    index: number
  ): string {
    return (
      input.slice(0, index) +
      " ".repeat(modifier.length) +
      input.slice(index + modifier.length)
    );
  }

  private static sortByPosition(
    found: Array<{ value: string; index: number }>
  ): string[] {
    return found.sort((a, b) => a.index - b.index).map((m) => m.value);
  }

  static getBassNote(
    rawModifiers: string
  ): [ChordTypes.Base | undefined, string | undefined] {
    if (!rawModifiers.includes("/")) return [undefined, rawModifiers];

    const [beforeBass, bassPart] = rawModifiers.split("/");
    // Check for empty or missing bass part
    if (!bassPart?.trim()) {
      throw new Error("Invalid bass note");
    }

    const bassMatch = bassPart.match(/^[A-G][#b]?/);
    if (!bassMatch) {
      throw new Error("Invalid bass note");
    }

    return [bassMatch[0] as ChordTypes.Base, beforeBass];
  }
}
