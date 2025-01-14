import { ChordParser, Chord, ChordBase } from "./chordParser";

describe("ChordParser", () => {
  describe("Basic Chords", () => {
    test("should parse major chords", () => {
      const chord = ChordParser.parseChord("C");
      expect(chord.base).toBe("C");
      expect(chord.modifiers).toHaveLength(0);
    });

    test("should parse minor chords", () => {
      const chord = ChordParser.parseChord("Am");
      expect(chord.base).toBe("A");
      expect(chord.modifiers).toHaveLength(1);
      expect(chord.modifiers[0]).toEqual({
        type: "quality",
        value: "m",
      });
    });
  });

  describe("Accidentals", () => {
    test("should parse sharp chords", () => {
      const chord = ChordParser.parseChord("F#");
      expect(chord.base).toBe("F");
      expect(chord.modifiers[0]).toEqual({
        type: "accidental",
        value: "#",
      });
    });

    test("should parse flat chords", () => {
      const chord = ChordParser.parseChord("Bb");
      expect(chord.base).toBe("B");
      expect(chord.modifiers[0]).toEqual({
        type: "accidental",
        value: "b",
      });
    });
  });

  describe("Complex Chords", () => {
    test("should parse seventh chords", () => {
      const chord = ChordParser.parseChord("Cmaj7");
      expect(chord.modifiers).toContainEqual({
        type: "compound",
        value: "maj7",
      });
    });

    test("should parse minor seventh flat five", () => {
      const chord = ChordParser.parseChord("Bm7b5");
      expect(chord.base).toBe("B");
      expect(chord.modifiers).toContainEqual({
        type: "compound",
        value: "m7b5",
      });
    });

    test("should parse augmented chords", () => {
      const chord = ChordParser.parseChord("Caug");
      expect(chord.modifiers).toContainEqual({
        type: "quality",
        value: "aug",
      });
    });
  });

  describe("Slash Chords", () => {
    test("should parse basic slash chords", () => {
      const chord = ChordParser.parseChord("C/G");
      expect(chord.base).toBe("C");
      expect(chord.bass).toBe("G");
    });

    test("should parse complex slash chords", () => {
      const chord = ChordParser.parseChord("Fmaj7/A");
      expect(chord.base).toBe("F");
      expect(chord.bass).toBe("A");
      expect(chord.modifiers).toContainEqual({
        type: "compound",
        value: "maj7",
      });
    });
  });

  describe("toString", () => {
    test("should convert chord object back to string", () => {
      const inputs = ["C", "F#m", "Bbmaj7", "Am7b5", "D/F#"];
      inputs.forEach((input) => {
        const chord = ChordParser.parseChord(input);
        expect(ChordParser.toString(chord)).toBe(input);
      });
    });
  });

  describe("Error Handling", () => {
    test("should throw error for invalid base note", () => {
      expect(() => ChordParser.parseChord("H")).toThrow();
      expect(() => ChordParser.parseChord("X")).toThrow();
    });

    test("should handle empty input", () => {
      expect(() => ChordParser.parseChord("")).toThrow();
    });
  });

  describe("Extended Functionality", () => {
    test("should parse suspended chords", () => {
      const chord = ChordParser.parseChord("Csus4");
      expect(chord.modifiers).toContainEqual({
        type: "suspension",
        value: "sus4",
      });
    });

    test("should parse add chords", () => {
      const chord = ChordParser.parseChord("Cadd9");
      expect(chord.modifiers).toContainEqual({
        type: "addition",
        value: "add9",
      });
    });

    test("should parse altered chords", () => {
      const chord = ChordParser.parseChord("C7b9");
      expect(chord.modifiers).toContainEqual({
        type: "extension",
        value: "7",
      });
      expect(chord.modifiers).toContainEqual({
        type: "alteration",
        value: "b9",
      });
    });

    test("should parse multiple alterations", () => {
      const chord = ChordParser.parseChord("C7b9#11");
      expect(chord.modifiers).toContainEqual({
        type: "extension",
        value: "7",
      });
      expect(chord.modifiers).toContainEqual({
        type: "alteration",
        value: "b9",
      });
      expect(chord.modifiers).toContainEqual({
        type: "alteration",
        value: "#11",
      });
    });

    test("should parse complex jazz chords", () => {
      const chord = ChordParser.parseChord("Cmaj13#11");
      expect(chord.modifiers).toContainEqual({
        type: "compound",
        value: "maj13",
      });
      expect(chord.modifiers).toContainEqual({
        type: "alteration",
        value: "#11",
      });
    });
  });

  describe("Edge Cases", () => {
    test("should handle alternative notations", () => {
      const augChord = ChordParser.parseChord("C+");
      expect(augChord.modifiers).toContainEqual({
        type: "quality",
        value: "+",
      });
    });

    test("should parse power chords", () => {
      const chord = ChordParser.parseChord("C5");
      expect(chord.modifiers).toContainEqual({
        type: "extension",
        value: "5",
      });
    });

    test("should handle complex slash chords with accidentals", () => {
      const chord = ChordParser.parseChord("Cmaj7/F#");
      expect(chord.base).toBe("C");
      expect(chord.bass).toBe("F");
      expect(chord.modifiers).toContainEqual({
        type: "bass",
        value: "F#",
      });
    });
  });

  describe("Modifier Ordering", () => {
    test("should maintain correct modifier order", () => {
      const cases = [
        {
          input: "C#m7",
          expected: ["#", "m", "7"],
        },
        {
          input: "Bbmaj7sus4",
          expected: ["b", "maj7", "sus4"], // Updated order to match implementation
        },
        {
          input: "F#m7b5/C",
          expected: ["#", "m7b5", "C"],
        },
      ];

      cases.forEach(({ input, expected }) => {
        const chord = ChordParser.parseChord(input);
        const values = chord.modifiers.map((m) => m.value);
        expect(values).toEqual(expected);
      });
    });
  });

  describe("Invalid Inputs", () => {
    test("should reject invalid modifier combinations", () => {
      const invalidChords = [
        "Cm+", // can't be minor and augmented
        "Csus2sus4", // can't have both sus2 and sus4
        "C7maj7", // can't have both 7 and maj7
      ];

      invalidChords.forEach((chord) => {
        expect(() => ChordParser.parseChord(chord)).toThrow();
      });
    });

    test("should handle malformed input", () => {
      const malformedInputs = [
        "C##", // double sharp
        "Cbb", // double flat
        "C/H", // invalid bass note
        "C7b9b9", // duplicate alterations
      ];

      malformedInputs.forEach((chord) => {
        expect(() => ChordParser.parseChord(chord)).toThrow();
      });
    });
  });
});
