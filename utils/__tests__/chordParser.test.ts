import { ChordParser } from "../chordParser";
import { ChordTypes } from "../types";

describe("ChordParser", () => {
  describe("Basic Chord Parsing", () => {
    test("should parse single letter chords", () => {
      const result = ChordParser.parseChord("C");
      expect(result).toEqual({
        base: "C",
        modifiers: [],
        bass: undefined,
      });
    });

    test("should parse sharp and flat notes", () => {
      expect(ChordParser.parseChord("C#")).toEqual({
        base: "C#",
        modifiers: [],
        bass: undefined,
      });

      expect(ChordParser.parseChord("Bb")).toEqual({
        base: "Bb",
        modifiers: [],
        bass: undefined,
      });
    });
  });

  describe("Modifier Parsing", () => {
    test("should parse single modifiers", () => {
      expect(ChordParser.parseChord("Am")).toEqual({
        base: "A",
        modifiers: ["m"],
        bass: undefined,
      });

      expect(ChordParser.parseChord("Cmaj7")).toEqual({
        base: "C",
        modifiers: ["maj7"],
        bass: undefined,
      });
    });

    test("should parse multiple modifiers in correct order", () => {
      expect(ChordParser.parseChord("Cm7b5")).toEqual({
        base: "C",
        modifiers: ["m", "7", "b5"],
        bass: undefined,
      });

      expect(ChordParser.parseChord("Cmaj7#11")).toEqual({
        base: "C",
        modifiers: ["maj7", "#11"],
        bass: undefined,
      });
    });

    test("should handle overlapping modifiers correctly", () => {
      expect(ChordParser.parseChord("Cmadd9")).toEqual({
        base: "C",
        modifiers: ["m", "add9"],
        bass: undefined,
      });
    });
  });

  describe("Bass Note Handling", () => {
    test("should parse basic slash chords", () => {
      expect(ChordParser.parseChord("C/G")).toEqual({
        base: "C",
        modifiers: [],
        bass: "G",
      });
    });

    test("should parse complex chords with bass notes", () => {
      expect(ChordParser.parseChord("Cmaj7/B")).toEqual({
        base: "C",
        modifiers: ["maj7"],
        bass: "B",
      });
    });

    test("should handle accidentals in bass notes", () => {
      expect(ChordParser.parseChord("Am7/F#")).toEqual({
        base: "A",
        modifiers: ["m", "7"],
        bass: "F#",
      });
    });
  });

  describe("Error Cases", () => {
    test("should reject empty input", () => {
      expect(() => ChordParser.parseChord("")).toThrow("Empty chord string");
    });

    test("should reject invalid root notes", () => {
      expect(() => ChordParser.parseChord("H7")).toThrow(
        "Invalid chord: must start with A-G"
      );
    });

    test("should reject invalid modifiers", () => {
      expect(() => ChordParser.parseChord("Cxyz")).toThrow("Invalid modifier");
    });

    test("should reject invalid bass notes", () => {
      expect(() => ChordParser.parseChord("C/H")).toThrow("Invalid bass note");
    });
  });

  describe("Complex Cases", () => {
    test("should parse complex jazz chords", () => {
      const cases = [
        [
          "Cmaj7#11",
          { base: "C", modifiers: ["maj7", "#11"], bass: undefined },
        ],
        ["Dm7b5/Ab", { base: "D", modifiers: ["m", "7", "b5"], bass: "Ab" }],
        ["G13b9", { base: "G", modifiers: ["13", "b9"], bass: undefined }],
      ];

      cases.forEach(([input, expected]) => {
        expect(ChordParser.parseChord(input as string)).toEqual(expected);
      });
    });
  });

  describe("validateNotEmpty", () => {
    test("should throw on empty string", () => {
      expect(() => ChordParser.validateNotEmpty("")).toThrow(
        "Empty chord string"
      );
    });

    test("should throw on undefined", () => {
      expect(() => ChordParser.validateNotEmpty(undefined as any)).toThrow(
        "Empty chord string"
      );
    });

    test("should not throw on valid input", () => {
      expect(() => ChordParser.validateNotEmpty("C")).not.toThrow();
    });
  });

  describe("validateFirstChar", () => {
    test("should throw on invalid first character", () => {
      expect(() => ChordParser.validateFirstChar("H")).toThrow(
        "Invalid chord: must start with A-G"
      );
      expect(() => ChordParser.validateFirstChar("x")).toThrow(
        "Invalid chord: must start with A-G"
      );
    });

    test("should not throw on valid first character", () => {
      ["A", "B", "C", "D", "E", "F", "G"].forEach((note) => {
        expect(() => ChordParser.validateFirstChar(note)).not.toThrow();
      });
    });
  });

  describe("getBase", () => {
    test("should extract base note", () => {
      expect(ChordParser.getBase("C")).toEqual(["C", ""]);
      expect(ChordParser.getBase("Am7")).toEqual(["A", "m7"]);
      expect(ChordParser.getBase("F#m7b5")).toEqual(["F#", "m7b5"]);
      expect(ChordParser.getBase("F#m7b5/Gb")).toEqual(["F#", "m7b5/Gb"]);
    });

    test("should handle accidentals", () => {
      expect(ChordParser.getBase("C#maj7")).toEqual(["C#", "maj7"]);
      expect(ChordParser.getBase("Bbm")).toEqual(["Bb", "m"]);
    });

    test("should throw on invalid base", () => {
      expect(() => ChordParser.getBase("xyz")).toThrow(
        "Invalid chord: no base found"
      );
    });
  });

  describe("getBassNote", () => {
    test("should extract bass note and remaining modifiers", () => {
      expect(ChordParser.getBassNote("maj7/G")).toEqual(["G", "maj7"]);
      expect(ChordParser.getBassNote("m7b5/F#")).toEqual(["F#", "m7b5"]);
    });

    test("should handle no bass note", () => {
      expect(ChordParser.getBassNote("maj7")).toEqual([undefined, "maj7"]);
      expect(ChordParser.getBassNote("m7b5")).toEqual([undefined, "m7b5"]);
    });

    test("should handle invalid bass notes", () => {
      expect(() => ChordParser.getBassNote("maj7/H")).toThrow(
        "Invalid bass note"
      );
      expect(() => ChordParser.getBassNote("maj7/")).toThrow(
        "Invalid bass note"
      );
    });
  });

  describe("getModifiers", () => {
    test("should find modifiers in correct order", () => {
      expect(ChordParser.getModifiers("m7b5")).toEqual(["m", "7", "b5"]);
      expect(ChordParser.getModifiers("maj7#11")).toEqual(["maj7", "#11"]);
    });

    test("should handle empty modifiers", () => {
      expect(ChordParser.getModifiers("")).toEqual([]);
      expect(ChordParser.getModifiers(undefined)).toEqual([]);
    });

    test("should throw on invalid modifiers", () => {
      expect(() => ChordParser.getModifiers("xyz")).toThrow(
        "Invalid modifier sequence"
      );
    });

    test("should handle overlapping modifier possibilities", () => {
      expect(ChordParser.getModifiers("maj7b5")).toEqual(["maj7", "b5"]);
      expect(ChordParser.getModifiers("madd9")).toEqual(["m", "add9"]);
    });
  });

  describe("findModifiersWithPositions", () => {
    test("should find positions correctly", () => {
      const result = ChordParser["findModifiersWithPositions"](
        "m7b5",
        ChordParser.sortModifiersByLength()
      );
      expect(result).toEqual([
        { value: "b5", index: 2 },
        { value: "m", index: 0 },
        { value: "7", index: 1 },
      ]);
    });

    test("should handle spaces between modifiers", () => {
      const result = ChordParser["findModifiersWithPositions"](
        "m 7 b5",
        ChordParser.sortModifiersByLength()
      );
      expect(result).toEqual([
        { value: "b5", index: 4 },
        { value: "m", index: 0 },
        { value: "7", index: 2 },
      ]);
    });
  });

  describe("sortModifiersByLength", () => {
    test("should sort modifiers from longest to shortest", () => {
      const sorted = ChordParser.sortModifiersByLength();
      expect(sorted[0].length).toBeGreaterThanOrEqual(
        sorted[sorted.length - 1].length
      );
      // Verify a few specific cases
      expect(sorted.indexOf("maj7")).toBeLessThan(sorted.indexOf("7"));
      expect(sorted.indexOf("add9")).toBeLessThan(sorted.indexOf("9"));
    });
  });
});
