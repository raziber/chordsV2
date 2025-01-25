import LineParser from "../lineParser";
import { SongLine } from "../../types/types";

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
          lyrics: " first  second",
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

      it("should preserve whitespace between chords", () => {
        const input =
          "          [ch]G[/ch]        [ch]Em[/ch]\nI found a love for me";
        const result = LineParser.parseLine(input);

        expect(result.type).toBe(SongLine.Type.ChordsAndLyrics);
        expect(result.lyrics).toBe("I found a love for me");
        expect(result.chords).toEqual([
          {
            chord: { base: "G", bass: undefined, modifiers: [] },
            position: 10.5,
          },
          {
            chord: { base: "E", bass: undefined, modifiers: ["m"] },
            position: 20,
          },
        ]);
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
          {
            input:
              "   | [ch]Am[/ch] | [ch]C[/ch] |\nE|---0---|\nA|----2--|\nD|-1--0--|",
            expected: { type: SongLine.Type.ChordsAndTabs },
          },
          {
            input: "[ch]Am[/ch] | [ch]C[/ch] |\nE|---0---|     and that's it",
            expected: { type: SongLine.Type.All },
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

      it("should combine tabs from multiple lines", () => {
        const input =
          "E|---0---|\nA|----2--|\nD|---0---|\nG|----2s8|\nB|-1p0---|\ne|-3--2--|";
        const result = LineParser.parseLine(input);
        expect(result.tabs).toMatchObject({
          E: [{ fret: 0, position: 3 }],
          A: [{ fret: 2, position: 4 }],
          D: [{ fret: 0, position: 3 }],
          G: [
            { fret: 2, position: 4 },
            { fret: "s", position: 5 },
            { fret: 8, position: 6 },
          ],
          B: [
            { fret: 1, position: 1 },
            { fret: "p", position: 2 },
            { fret: 0, position: 3 },
          ],
          e: [
            { fret: 3, position: 1 },
            { fret: 2, position: 4 },
          ],
        });
      });
    });

    describe("parseBarsLine", () => {
      it("should parse a single bar with no chords", () => {
        const input = "|";
        const result = LineParser.parseLine(input);
        expect(result.type).toBe(SongLine.Type.Bars);
        expect(result.bars).toEqual([]);
      });

      it("should parse multiple bars with chords", () => {
        const input = "|[ch]Am[/ch] | [ch]C[/ch] | [ch]G[/ch] |";
        const result = LineParser.parseLine(input);
        expect(result.type).toBe(SongLine.Type.Bars);
        expect(result.bars).toHaveLength(3);
        expect(result.bars).toEqual([
          { chords: [{ base: "A", modifiers: ["m"] }] },
          { chords: [{ base: "C", modifiers: [] }] },
          { chords: [{ base: "G", modifiers: [] }] },
        ]);
      });

      it("should parse bars with no closing line", () => {
        const input = "|[ch]Am[/ch] | [ch]C[/ch] | [ch]G[/ch] ";
        const result = LineParser.parseLine(input);
        expect(result.type).toBe(SongLine.Type.Bars);
        expect(result.bars).toHaveLength(3);
        expect(result.bars).toEqual([
          { chords: [{ base: "A", modifiers: ["m"] }] },
          { chords: [{ base: "C", modifiers: [] }] },
          { chords: [{ base: "G", modifiers: [] }] },
        ]);
      });

      it("should handle extra whitespace or missing bars", () => {
        const input = "   | [ch]A[/ch] |    |";
        const result = LineParser.parseLine(input);
        expect(result.type).toBe(SongLine.Type.Bars);
        expect(result.bars).toHaveLength(1);
      });
    });
  });

  describe("parseBarsLine Direct Tests", () => {
    it("should parse a single bar with no chords", () => {
      const lines = ["|"];
      const result = LineParser.parseBarsLine(lines);
      expect(result.type).toBe(SongLine.Type.Bars);
      expect(result.bars).toEqual([]);
    });

    it("should parse multiple bars with chords", () => {
      const lines = ["|[ch]Am[/ch] | [ch]C[/ch] | [ch]G[/ch] |"];
      const result = LineParser.parseBarsLine(lines);
      expect(result.type).toBe(SongLine.Type.Bars);
      expect(result.bars).toHaveLength(3);
      expect(result.bars).toEqual([
        { chords: [{ base: "A", modifiers: ["m"] }] },
        { chords: [{ base: "C", modifiers: [] }] },
        { chords: [{ base: "G", modifiers: [] }] },
      ]);
    });

    it("should handle extra whitespace or missing bars", () => {
      const lines = ["   | [ch]A[/ch] |    |"];
      const result = LineParser.parseBarsLine(lines);
      expect(result.type).toBe(SongLine.Type.Bars);
      expect(result.bars).toHaveLength(1);
    });
  });

  describe("Core Extraction Methods", () => {
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
        expect(result.remainingLine).toBe("Some lyrics");
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

    describe("extractTabs", () => {
      it("should return the original line and empty tab object when provided an invalid string name", () => {
        const input = "wrong|---0---|";
        const result = LineParser.extractTabs(input);
        expect(result).toEqual([input, { "": [] }]);
      });

      it("should parse a valid tab line for a recognized string name", () => {
        const input = "E|---0---2---|";
        const [remaining, tabs] = LineParser.extractTabs(input);

        expect(remaining).toBe("");
        expect(tabs).toHaveProperty("E");
        expect(tabs["E"]).toEqual([
          { fret: 0, position: 3 },
          { fret: 2, position: 7 },
        ]);
      });

      it("should skip lines that only contain numbers without a valid string name", () => {
        const input = "1 2 3 4";
        const result = LineParser.extractTabs(input);
        expect(result).toEqual([input, { "": [] }]);
      });
    });
  });

  describe("parseFrets", () => {
    it("should return empty array when input is blank", () => {
      const result = LineParser.parseFrets("");
      expect(result).toEqual([]);
    });

    it("should parse numeric frets correctly", () => {
      const result = LineParser.parseFrets("0-2-5");
      expect(result).toEqual([
        { fret: 0, position: 0 },
        { fret: 2, position: 2 },
        { fret: 5, position: 4 },
      ]);
    });

    it("should parse special char for dead note, grace note, ghost note", () => {
      const result = LineParser.parseFrets("xg(n)p");
      expect(result).toEqual([
        { fret: "x", position: 0 },
        { fret: "g", position: 1 },
        { fret: "(n)", position: 2 },
        { fret: "p", position: 5 },
      ]);
    });

    it("should ignore dashes and only track special chars or numbers", () => {
      const result = LineParser.parseFrets("-x--5-g");
      expect(result).toEqual([
        { fret: "x", position: 1 },
        { fret: 5, position: 4 },
        { fret: "g", position: 6 },
      ]);
    });
  });

  describe("findTab", () => {
    it("should return empty triple if the line has no match", () => {
      const result = LineParser.findTab("badLine123");
      expect(result).toEqual(["", "", "badLine123"]);
    });

    it("should return matched string name, frets, and clipped line", () => {
      const input = "E|---3--| Hello";
      const result = LineParser.findTab(input);
      expect(result).toEqual(["E", "---3--", " Hello"]);
    });

    it("should remove trailing pipe from the rawFretsDetails", () => {
      const input = "A|----5--| more stuff";
      const result = LineParser.findTab(input);
      expect(result).toEqual(["A", "----5--", " more stuff"]);
    });

    it("should find tabs even after lyrics", () => {
      const input = " more stuff A|----5--|";
      const result = LineParser.findTab(input);
      expect(result).toEqual(["A", "----5--", " more stuff "]);
    });
  });
});
