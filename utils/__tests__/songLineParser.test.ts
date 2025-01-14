import { songLineParser } from "../songLineParser";
import { SongLine, ChordTypes } from "../types";

describe("SongLineParser", () => {
  describe("Basic Line Types", () => {
    test("should discard blank lines", () => {
      const result = songLineParser("    ");
      expect(result).toBeNull();
    });

    test("should parse lyrics only line", () => {
      const result = songLineParser("  Hello there my friend  ");
      expect(result?.type).toBe(SongLine.Type.Lyrics);
      expect(result?.lyrics).toBe("Hello there my friend");
    });

    test("should parse chords only line", () => {
      const result = songLineParser("[ch]Am[/ch] [ch]C[/ch] [ch]G7[/ch]");
      expect(result?.type).toBe(SongLine.Type.Chords);
      expect(result?.chords).toEqual([
        {
          base: "A" as ChordTypes.Base,
          modifiers: [{ type: "quality", value: "m" }],
        },
        {
          base: "C" as ChordTypes.Base,
          modifiers: [],
        },
        {
          base: "G" as ChordTypes.Base,
          modifiers: [{ type: "extension", value: "7" }],
        },
      ]);
    });

    test("should parse bars line", () => {
      const result = songLineParser("|[ch]Cmaj7[/ch]|[ch]F[/ch]|");
      expect(result?.type).toBe(SongLine.Type.Bars);
      expect(result?.bars).toEqual([
        {
          chords: [
            {
              base: "C" as ChordTypes.Base,
              modifiers: [{ type: "compound", value: "maj7" }],
            },
          ],
        },
        {
          chords: [
            {
              base: "F" as ChordTypes.Base,
              modifiers: [],
            },
          ],
        },
      ]);
      expect(result?.hasClosingBar).toBe(true);
    });
  });

  describe("Tab Lines", () => {
    test("should parse tab line", () => {
      const tabInput = `e|-8---3--------
B|-----5--------
G|----------5---
D|--------------
A|--------------
E|--------------`;
      const result = songLineParser(tabInput);
      expect(result?.type).toBe(SongLine.Type.Tabs);
      expect(result?.tabs?.e).toEqual([
        { fret: 8, position: 1 },
        { fret: 3, position: 5 },
      ]);
      expect(result?.tabs?.B).toEqual([{ fret: 5, position: 5 }]);
      expect(result?.tabs?.G).toEqual([{ fret: 5, position: 10 }]);
      expect(result?.tabs?.D).toEqual([]);
      expect(result?.tabs?.A).toEqual([]);
      expect(result?.tabs?.E).toEqual([]);
    });
  });

  describe("Mixed Lines", () => {
    test("should parse chords with lyrics in between", () => {
      const input = "[ch]Am[/ch] [ch]C[/ch] Hello [ch]G[/ch] there";
      const result = songLineParser(input);
      expect(result?.type).toBe(SongLine.Type.ChordsAndLyrics);
      expect(result?.lyrics).toBe("  Hello there");
      expect(result?.chords).toEqual([
        {
          chord: {
            base: "A" as ChordTypes.Base,
            modifiers: [{ type: "quality", value: "m" }],
          },
          position: 1,
        },
        {
          chord: {
            base: "C" as ChordTypes.Base,
            modifiers: [],
          },
          position: 3,
        },
        {
          chord: {
            base: "G" as ChordTypes.Base,
            modifiers: [],
          },
          position: 11,
        },
      ]);
    });

    test("should parse tabs with lyrics", () => {
      const input = "e|-3---| Sing this part";
      const result = songLineParser(input);
      expect(result?.type).toBe(SongLine.Type.TabsAndLyrics);
      expect(result?.lyrics).toBe("Sing this part");
      expect(result?.tabs?.e).toEqual([{ fret: 3, position: 1 }]);
    });

    test("should parse tabs with chords", () => {
      const input = `[ch]Am[/ch]     [ch]C[/ch]
e|---0---0---0---3---|
B|---1---1---0---0---|
G|---2---2---0---0---|
D|-------------------|
A|-------------------|
E|-------------------`;
      const result = songLineParser(input);
      expect(result?.type).toBe(SongLine.Type.ChordsAndTabs);
      expect(result?.chords).toEqual([
        {
          chord: {
            base: "A" as ChordTypes.Base,
            modifiers: [{ type: "quality", value: "m" }],
          },
          position: 1,
        },
        {
          chord: {
            base: "C" as ChordTypes.Base,
            modifiers: [],
          },
          position: 7,
        },
      ]);
      expect(result?.tabs).toEqual({
        e: [
          { fret: 0, position: 3 },
          { fret: 0, position: 7 },
          { fret: 0, position: 11 },
          { fret: 3, position: 15 },
        ],
        B: [
          { fret: 1, position: 3 },
          { fret: 1, position: 7 },
          { fret: 0, position: 11 },
          { fret: 0, position: 15 },
        ],
        G: [
          { fret: 2, position: 3 },
          { fret: 2, position: 7 },
          { fret: 0, position: 11 },
          { fret: 0, position: 15 },
        ],
        D: [],
        A: [],
        E: [],
      });
    });

    test("should parse tabs with lyrics and chords", () => {
      const input = `  And I play this part slowly\n  [ch]Am[/ch]          [ch]C[/ch]
e|---0---0---|
B|---1---1---|
G|-----------|
D|-----------|
A|-----------|
E|-----------|
`;
      const result = songLineParser(input);
      expect(result?.type).toBe(SongLine.Type.All);
      expect(result?.lyrics).toBe("  And I play this part slowly");
      expect(result?.chords).toEqual([
        {
          chord: {
            base: "A" as ChordTypes.Base,
            modifiers: [{ type: "quality", value: "m" }],
          },
          position: 3,
        },
        {
          chord: {
            base: "C" as ChordTypes.Base,
            modifiers: [],
          },
          position: 14,
        },
      ]);
      expect(result?.tabs).toEqual({
        e: [
          { fret: 0, position: 3 },
          { fret: 0, position: 7 },
          { fret: 3, position: 18 },
        ],
        B: [
          { fret: 1, position: 3 },
          { fret: 1, position: 7 },
          { fret: 5, position: 18 },
        ],
        G: [],
        D: [],
        A: [],
        E: [],
      });
    });
  });

  describe("Complex Chord Parsing", () => {
    test("should parse slash chords", () => {
      const input = "[ch]G/B[/ch] [ch]Am/C[/ch]";
      const result = songLineParser(input);
      expect(result?.chords).toEqual([
        {
          base: "G" as ChordTypes.Base,
          modifiers: [{ type: "bass", value: "B" }],
          bass: "B" as ChordTypes.Base,
        },
        {
          base: "A" as ChordTypes.Base,
          modifiers: [
            { type: "quality", value: "m" },
            { type: "bass", value: "C" },
          ],
          bass: "C" as ChordTypes.Base,
        },
      ]);
    });

    test("should parse long chords", () => {
      const input =
        "     [ch]G/B[/ch]       [ch]Bm7b5[/ch]\nAnd this is a lyrics line with chords";
      const result = songLineParser(input);
      expect(result?.chords).toEqual([
        {
          chord: {
            base: "G" as ChordTypes.Base,
            modifiers: [{ type: "bass", value: "B" }],
            bass: "B" as ChordTypes.Base,
          },
          position: 6,
        },
        {
          chord: {
            base: "B" as ChordTypes.Base,
            modifiers: [{ type: "compound", value: "m7b5" }],
          },
          position: 17,
        },
      ]);
    });

    test("should parse extended chords", () => {
      const input = "[ch]Cmaj9[/ch] [ch]Dm7b5[/ch]";
      const result = songLineParser(input);
      expect(result?.chords).toEqual([
        {
          base: "C" as ChordTypes.Base,
          modifiers: [{ type: "compound", value: "maj9" }],
        },
        {
          base: "D" as ChordTypes.Base,
          modifiers: [{ type: "compound", value: "m7b5" }],
        },
      ]);
    });
  });

  describe("Modifiers and Comments", () => {
    test("should detect repeat modifier", () => {
      const input = "[ch]Am[/ch] [ch]C[/ch] x3";
      const result = songLineParser(input);
      expect(result?.repeats).toBe(3);
    });

    test("should handle line comments", () => {
      const input = "[ch]Am[/ch] [ch]C[/ch] // slowly";
      const result = songLineParser(input);
      expect(result?.comments).toBe("slowly");
    });
  });

  describe("Chord Positioning", () => {
    test("should parse chords with positions and lyrics", () => {
      const input =
        "          [ch]Cm[/ch]                                [ch]G7[/ch]\n      here are some lyrics to this song";
      const result = songLineParser(input);

      expect(result?.type).toBe(SongLine.Type.ChordsAndLyrics);
      expect(result?.lyrics).toBe("      here are some lyrics to this song");
      expect(result?.chords).toEqual([
        {
          chord: {
            base: "C" as ChordTypes.Base,
            modifiers: [{ type: "quality", value: "m" }],
          },
          position: 11,
        },
        {
          chord: {
            base: "G" as ChordTypes.Base,
            modifiers: [{ type: "extension", value: "7" }],
          },
          position: 45,
        },
      ]);
    });

    test("should handle chords before lyrics start", () => {
      const input = "[ch]Am[/ch]     [ch]C[/ch]\nsome lyrics";
      const result = songLineParser(input);

      expect(result?.chords).toEqual([
        {
          chord: {
            base: "A" as ChordTypes.Base,
            modifiers: [{ type: "quality", value: "m" }],
          },
          position: 1,
        },
        {
          chord: {
            base: "C" as ChordTypes.Base,
            modifiers: [],
          },
          position: 7,
        },
      ]);
    });

    test("should maintain chord positions with UTF-8 characters", () => {
      const input = "    [ch]Am[/ch]         [ch]C[/ch]\nÉtude in ārt";
      const result = songLineParser(input);

      expect(result?.lyrics).toBe("Étude in ārt");
      expect(
        result?.chords?.map((c: { position: number }) => c.position)
      ).toEqual([5, 15]);
    });
  });

  describe("Error Cases", () => {
    test("should handle incorrect chord format", () => {
      const input = "[ch]H7[/ch]"; // H is not a valid note
      expect(() => songLineParser(input)).toThrow(
        "Invalid chord: must start with A-G"
      );
    });

    test("should handle malformed chord tags", () => {
      const input = "[ch]Am[ch] [ch]C[/ch]";
      expect(() => songLineParser(input)).toThrow("Malformed chord tags");
    });
  });
});
