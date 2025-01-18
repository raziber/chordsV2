import { LineParser } from "../lineParser";
import { SongLine } from "../types";

describe("LineParser", () => {
  describe("Main Function Chain", () => {
    describe("parseLine", () => {
      it("should throw error for empty input", () => {
        expect(() => LineParser.parseLine("")).toThrow("Empty line string");
      });

      it("should detect legend border", () => {
        expect(LineParser.parseLine("****")).toEqual({
          type: SongLine.Type.LegendBorder,
        });
      });

      it("should parse single line with chords and lyrics", () => {
        const input = "[ch]Am[/ch] Hello [ch]C[/ch] World";
        const result = LineParser.parseLine(input);
        expect(result.type).toBe(SongLine.Type.ChordsAndLyrics);
        expect(result.lyrics).toBe(" Hello  World");
        expect(result.chords).toHaveLength(2);
      });

      it("should handle multiple lines", () => {
        const input = "[ch]Am[/ch]\nHello\nx3";
        const result = LineParser.parseLine(input);
        expect(result).toMatchObject({
          type: SongLine.Type.ChordsAndLyrics,
          chords: [{ chord: { base: "A", modifiers: ["m"] }, position: 1 }],
          lyrics: "Hello",
          repeats: 3,
        });
      });
    });

    describe("Line Preparation", () => {
      // it("should remove empty lines", () => {
      //   const input = "   [ch]G7[/ch]  \n\n  \nlyrics";
      //   const result = LineParser.parseLine(input);
      //   expect(result.lyrics).toBe("line2");
      //   expect(result.chords).toBe({{ base: "G", modifiers: ["7"] }, position: 4});
      // });

      it("should detect legend border", () => {
        expect(LineParser.parseLine("****")).toEqual({
          type: SongLine.Type.LegendBorder,
        });
        expect(LineParser.parseLine("***\ntext")).toEqual({
          type: SongLine.Type.LegendBorder,
        });
      });
    });

    describe("Content Processing", () => {
      it("should extract repeats from any line", () => {
        const tests = [
          { input: "content x3", expected: 3 },
          { input: "first line\nsecond line x2", expected: 2 },
          { input: "no repeats", expected: undefined },
        ];

        tests.forEach(({ input, expected }) => {
          const result = LineParser.parseLine(input);
          expect(result.repeats).toBe(expected);
        });
      });

      it("should identify bars lines", () => {
        const input = "[ch]Am[/ch] | [ch]C[/ch] | [ch]F[/ch] |";
        const result = LineParser.parseLine(input);
        expect(result.type).toBe(SongLine.Type.Bars);
      });

      it("should extract and combine content from multiple lines", () => {
        const input = "[ch]Am[/ch] first\n[ch]C[/ch] second";
        const result = LineParser.parseLine(input);
        expect(result).toMatchObject({
          type: SongLine.Type.ChordsAndLyrics,
          lyrics: " first second",
          chords: expect.arrayContaining([
            expect.objectContaining({
              chord: expect.objectContaining({ base: "A", modifiers: ["m"] }),
            }),
            expect.objectContaining({
              chord: expect.objectContaining({ base: "C" }),
            }),
          ]),
        });
      });
    });

    describe("Special Cases", () => {
      it("should handle mixed content types", () => {
        const tests = [
          {
            input: "[ch]Am[/ch] E|---0---| lyrics",
            expected: { type: SongLine.Type.All },
          },
          {
            input: "E|---0---| lyrics x2",
            expected: { type: SongLine.Type.TabsAndLyrics, repeats: 2 },
          },
          {
            input: "[ch]Am[/ch] | [ch]C[/ch] |\nE|---0---|",
            expected: { type: SongLine.Type.ChordsAndTabs },
          },
        ];

        tests.forEach(({ input, expected }) => {
          const result = LineParser.parseLine(input);
          expect(result.type).toBe(expected.type);
          if ("repeats" in expected) {
            expect(result.repeats).toBe(expected.repeats);
          }
        });
      });

      it("should combine tabs from multiple lines", () => {
        const input = "E|---0---|\nA|----2--|";
        const result = LineParser.parseLine(input);
        expect(result.tabs).toMatchObject({
          E: [{ fret: 0, position: 3 }],
          A: [{ fret: 2, position: 4 }],
        });
      });
    });
  });

  describe("Core Extraction Methods", () => {
    describe("extractChordContent", () => {
      it("should extract single chord", () => {
        const input = "[ch]Am[/ch]";
        const result = LineParser.extractChordContent(input);
        expect(result.content).toEqual(["Am"]);
        expect(result.remainingLine).toBe("");
      });

      it("should extract multiple chords", () => {
        const input = "[ch]Am[/ch] [ch]C[/ch] [ch]F[/ch]";
        const result = LineParser.extractChordContent(input);
        expect(result.content).toEqual(["Am", "C", "F"]);
        expect(result.remainingLine).toBe("  ");
      });

      it("should preserve non-chord content", () => {
        const input = "[ch]Am[/ch] Hello [ch]C[/ch] World";
        const result = LineParser.extractChordContent(input);
        expect(result.content).toEqual(["Am", "C"]);
        expect(result.remainingLine).toBe(" Hello  World");
      });
    });

    describe("extractTabContent", () => {
      it("should extract tab line with standard string names", () => {
        const input = "E|---0---2---|";
        const result = LineParser.extractTabContent(input);
        expect(result.content).toEqual(["E|---0---2---|"]);
        expect(result.remainingLine).toBe("");
      });

      it("should handle all possible string names", () => {
        const tests = [
          "C",
          "C#",
          "Db",
          "D",
          "D#",
          "Eb",
          "E",
          "F",
          "F#",
          "Gb",
          "G",
          "G#",
          "Ab",
          "A",
          "A#",
          "Bb",
          "B",
        ];

        tests.forEach((string) => {
          const input = `${string}|---0---|`;
          const result = LineParser.extractTabContent(input);
          expect(result.content).toEqual([`${string}|---0---|`]);
        });
      });

      it("should handle tab content after string name", () => {
        const input = "C#|---0---2---| Some lyrics";
        const result = LineParser.extractTabContent(input);
        expect(result.content).toEqual(["C#|---0---2---|"]);
        expect(result.remainingLine).toBe(" Some lyrics");
      });
    });

    describe("extractRepeatContent", () => {
      it("should extract repeat markers", () => {
        const tests = [
          { input: "x3", expected: ["x3"], remaining: "" },
          { input: "3x", expected: ["3x"], remaining: "" },
          { input: "X3", expected: ["X3"], remaining: "" },
          { input: "3X", expected: ["3X"], remaining: "" },
        ];

        tests.forEach(({ input, expected, remaining }) => {
          const result = LineParser.extractRepeatContent(input);
          expect(result.content).toEqual(expected);
          expect(result.remainingLine).toBe(remaining);
        });
      });

      it("should extract repeat marker from text", () => {
        const input = "Play this part x3 and continue";
        const result = LineParser.extractRepeatContent(input);
        expect(result.content).toEqual(["x3"]);
        expect(result.remainingLine).toBe("Play this part and continue");
      });
    });
  });
});
