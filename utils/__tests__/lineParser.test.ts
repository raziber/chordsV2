import { LineParser } from "../lineParser";
import { SongLine } from "../types";

describe("LineParser", () => {
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

      it("should handle invalid chord tags", () => {
        const input = "[ch]Am[/ch] [ch]Invalid";
        const result = LineParser.extractChordContent(input);
        expect(result.content).toEqual(["Am"]);
        expect(result.remainingLine).toBe(" [ch]Invalid");
      });
    });

    describe("extractTabContent", () => {
      it("should extract tab line", () => {
        const input = "e|---0---2---|";
        const result = LineParser.extractTabContent(input);
        expect(result.content).toEqual(["e|---0---2---|"]);
        expect(result.remainingLine).toBe("");
      });

      it("should handle all string indicators", () => {
        ["e", "E", "A", "D", "G", "B"].forEach((string) => {
          const input = `${string}|---0---|`;
          const result = LineParser.extractTabContent(input);
          expect(result.content).toEqual([`${string}|---0---|`]);
        });
      });

      it("should not extract invalid tab lines", () => {
        const input = "x|---0---|";
        const result = LineParser.extractTabContent(input);
        expect(result.content).toEqual([]);
        expect(result.remainingLine).toBe(input);
      });

      it("should extract tab ending with closing |", () => {
        const input = "e|---0---2---|   Some text after";
        const result = LineParser.extractTabContent(input);
        expect(result.content).toEqual(["e|---0---2---|"]);
        expect(result.remainingLine).toBe("   Some text after");
      });

      it("should extract tab ending at first space when no closing |", () => {
        const input = "e|---0---2--- Some text after";
        const result = LineParser.extractTabContent(input);
        expect(result.content).toEqual(["e|---0---2---"]);
        expect(result.remainingLine).toBe(" Some text after");
      });

      it("should extract full line when no closing | or space", () => {
        const input = "e|---0---2---";
        const result = LineParser.extractTabContent(input);
        expect(result.content).toEqual(["e|---0---2---"]);
        expect(result.remainingLine).toBe("");
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

  describe("Text Processing Methods", () => {
    describe("removeNonAlphaNumeric", () => {
      it("should keep allowed characters", () => {
        const input = "Hello, world! How's it going?";
        const result = LineParser.removeNonAlphaNumeric(input);
        expect(result).toBe("Hello, world! How's it going?");
      });

      it("should remove special characters", () => {
        const input = "Hello@#$%^&*()world";
        const result = LineParser.removeNonAlphaNumeric(input);
        expect(result).toBe("Helloworld");
      });
    });

    describe("hasTextContent", () => {
      it("should return true for valid text", () => {
        expect(LineParser.hasTextContent("Hello")).toBe(true);
        expect(LineParser.hasTextContent("  Hello  ")).toBe(true);
      });

      it("should return false for empty or whitespace", () => {
        expect(LineParser.hasTextContent("")).toBe(false);
        expect(LineParser.hasTextContent("   ")).toBe(false);
      });
    });
  });

  describe("Pattern Generation", () => {
    describe("createPatternKey", () => {
      it("should create pattern for all features", () => {
        const features = {
          hasChords: true,
          hasTabs: true,
          hasLyrics: true,
          isRepeat: false,
        };
        expect(LineParser.createPatternKey(features)).toBe("111x");
      });

      it("should create pattern for single feature", () => {
        const features = {
          hasChords: true,
          hasTabs: false,
          hasLyrics: false,
          isRepeat: false,
        };
        expect(LineParser.createPatternKey(features)).toBe("100x");
      });

      it("should handle repeat marker", () => {
        const features = {
          hasChords: false,
          hasTabs: false,
          hasLyrics: false,
          isRepeat: true,
        };
        expect(LineParser.createPatternKey(features)).toBe("0001");
      });
    });

    describe("determineLineType", () => {
      it("should determine type for each valid pattern", () => {
        const tests = [
          {
            pattern: {
              hasChords: true,
              hasTabs: true,
              hasLyrics: true,
              isRepeat: false,
            },
            expected: SongLine.Type.All,
          },
          {
            pattern: {
              hasChords: true,
              hasTabs: false,
              hasLyrics: true,
              isRepeat: false,
            },
            expected: SongLine.Type.ChordsAndLyrics,
          },
          // ...add tests for each valid pattern
        ];

        tests.forEach(({ pattern, expected }) => {
          expect(LineParser.determineLineType(pattern)).toBe(expected);
        });
      });

      it("should return undefined for invalid patterns", () => {
        const invalidPattern = {
          hasChords: true,
          hasTabs: true,
          hasLyrics: true,
          isRepeat: true,
        };
        expect(LineParser.determineLineType(invalidPattern)).toBeUndefined();
      });
    });
  });

  describe("Integration Tests", () => {
    describe("detectLineTypes", () => {
      describe("input validation", () => {
        it("should throw error for empty input", () => {
          expect(() => LineParser.detectLineTypes("")).toThrow(
            "Empty line string"
          );
        });

        it("should handle single empty line", () => {
          expect(LineParser.detectLineTypes(" \n ")).toEqual([]);
        });
      });

      describe("single line type detection", () => {
        it("should detect chord line", () => {
          const input = "[ch]Am[/ch] [ch]C[/ch] [ch]F[/ch]";
          expect(LineParser.detectLineTypes(input)).toEqual([
            SongLine.Type.Chords,
          ]);
        });

        it("should detect tab line", () => {
          const input = "e|-----------------|";
          expect(LineParser.detectLineTypes(input)).toEqual([
            SongLine.Type.Tabs,
          ]);
        });

        it("should detect lyrics line", () => {
          const input = "Hello world";
          expect(LineParser.detectLineTypes(input)).toEqual([
            SongLine.Type.Lyrics,
          ]);
        });

        it("should detect repeat marker", () => {
          const input = "x3";
          expect(LineParser.detectLineTypes(input)).toEqual([
            SongLine.Type.Repeats,
          ]);
        });
      });

      describe("mixed content detection", () => {
        it("should detect chords with lyrics", () => {
          const input = "[ch]Am[/ch] Hello [ch]C[/ch] World";
          expect(LineParser.detectLineTypes(input)).toEqual([
            SongLine.Type.ChordsAndLyrics,
          ]);
        });

        it("should detect chords with tabs", () => {
          const input = "[ch]Am[/ch] e|-----------------|";
          expect(LineParser.detectLineTypes(input)).toEqual([
            SongLine.Type.ChordsAndTabs,
          ]);
        });

        it("should detect tabs with lyrics", () => {
          const input = "e|------------------| Hello";
          expect(LineParser.detectLineTypes(input)).toEqual([
            SongLine.Type.TabsAndLyrics,
          ]);
        });

        it("should detect all content types except repeats", () => {
          const input = "[ch]Am[/ch] e|------------------| Hello";
          expect(LineParser.detectLineTypes(input)).toEqual([
            SongLine.Type.All,
          ]);
        });
      });

      describe("multiple line detection", () => {
        it("should handle multiple different line types", () => {
          const input = `[ch]Am[/ch] [ch]C[/ch]
e|------------------|
Hello world
x3`;
          expect(LineParser.detectLineTypes(input)).toEqual([
            SongLine.Type.Chords,
            SongLine.Type.Tabs,
            SongLine.Type.Lyrics,
            SongLine.Type.Repeats,
          ]);
        });

        it("should handle mixed content across multiple lines", () => {
          const input = `[ch]Am[/ch] Hello
e|------------------| World`;
          expect(LineParser.detectLineTypes(input)).toEqual([
            SongLine.Type.ChordsAndLyrics,
            SongLine.Type.TabsAndLyrics,
          ]);
        });
      });

      describe("edge cases", () => {
        it("should handle multiple spaces between content", () => {
          const input = "[ch]Am[/ch]     Hello     [ch]C[/ch]     World";
          expect(LineParser.detectLineTypes(input)).toEqual([
            SongLine.Type.ChordsAndLyrics,
          ]);
        });

        it("should handle different string indicators for tabs", () => {
          const tests = ["e", "E", "A", "D", "G", "B"];
          tests.forEach((string) => {
            const input = `${string}|------------------|`;
            expect(LineParser.detectLineTypes(input)).toEqual([
              SongLine.Type.Tabs,
            ]);
          });
        });

        it("should handle different repeat formats", () => {
          const tests = ["x3", "X3", "3x", "3X"];
          tests.forEach((repeat) => {
            expect(LineParser.detectLineTypes(repeat)).toEqual([
              SongLine.Type.Repeats,
            ]);
          });
        });

        it("should handle special characters in lyrics", () => {
          const input = "Hello, world! How's it going?";
          expect(LineParser.detectLineTypes(input)).toEqual([
            SongLine.Type.Lyrics,
          ]);
        });

        it("should ignore empty lines between content", () => {
          const input = `[ch]Am[/ch]

e|------------------|

Hello world`;
          expect(LineParser.detectLineTypes(input)).toEqual([
            SongLine.Type.Chords,
            SongLine.Type.Tabs,
            SongLine.Type.Lyrics,
          ]);
        });
      });

      describe("content extraction", () => {
        it("should extract chords correctly", () => {
          const input = "[ch]Am[/ch] [ch]C[/ch] [ch]F[/ch] Hello";
          expect(LineParser.detectLineTypes(input)).toEqual([
            SongLine.Type.ChordsAndLyrics,
          ]);
        });

        it("should extract tabs correctly", () => {
          const input = "e|---0---2---3---| Hello";
          expect(LineParser.detectLineTypes(input)).toEqual([
            SongLine.Type.TabsAndLyrics,
          ]);
        });

        it("should extract repeats correctly", () => {
          const input = "Play this part 3x";
          expect(LineParser.detectLineTypes(input)).toEqual([
            SongLine.Type.Lyrics,
          ]);
        });

        it("should preserve lyrics after removing other elements", () => {
          const input = "[ch]Am[/ch] Hello [ch]C[/ch] World x3";
          expect(LineParser.detectLineTypes(input)).toEqual([
            SongLine.Type.ChordsAndLyrics,
          ]);
        });
      });
    });
  });
});
