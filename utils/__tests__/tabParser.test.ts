import { TabParser } from "../tabParser";
import { SongTypes, SongLine } from "@/types/types";

// Mock fetch globally
global.fetch = jest.fn();

describe("TabParser", () => {
  let parser: TabParser;
  const mockHtml = `
    {"tab":{"id":123,"content":"
    [Pre-Intro]
    Some pre-intro content
    [Intro]
    Em   C   D
    e|-----------------|
    B|-----0----------|
    G|-----0----------|
    D|-----0----------|
    A|-----------------|
    E|-----------------|

    [Verse 1]
    Em             C
    Here come the lyrics
    D              G
    More lyrics here
    ","revision_id":456,"strummings":[]}`;

  beforeEach(() => {
    parser = new TabParser();
    (global.fetch as jest.Mock).mockClear();
  });

  describe("parseTab", () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockImplementation(() =>
        Promise.resolve({
          text: () => Promise.resolve(mockHtml),
        })
      );
    });

    it("should handle network errors", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));
      const result = await parser.parseTab("https://example.com/tab");
      expect(result).toBeNull();
    });
  });

  describe("getData", () => {
    it("should fetch and decode HTML", async () => {
      (global.fetch as jest.Mock).mockImplementation(() =>
        Promise.resolve({
          text: () => Promise.resolve("&lt;div&gt;test&lt;/div&gt;"),
        })
      );

      const result = await parser.getData("https://example.com/tab");
      expect(result).toBe("<div>test</div>");
    });

    it("should handle fetch errors and return null", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));
      const result = await parser.getData("https://example.com/tab");
      expect(result).toBeNull();
    });
  });

  describe("parsePreIntro", () => {
    it("should parse pre-intro content", () => {
      const preIntro = "[Pre-Intro]\nSome pre-intro content";
      const result = parser.parsePreIntro(preIntro);
      expect(result).toBe("[Pre-Intro]\nSome pre-intro content");
    });

    it("should handle empty pre-intro", () => {
      const result = parser.parsePreIntro("");
      expect(result).toBe("");
    });
  });

  describe("splitToSections", () => {
    it("should split song into sections", () => {
      const songContent = `
        [Verse 1]\n
        Content 1\n
        [Chorus]\n
        Content 2
      `;

      const sections = parser.splitToSections(songContent);
      expect(sections).toHaveLength(2);
      sections.forEach((section) => {
        expect(section).toHaveProperty("title");
        expect(section).toHaveProperty("lines");
      });
    });

    it("should handle empty content", () => {
      const sections = parser.splitToSections("");
      expect(sections).toHaveLength(1);
      expect(sections[0]).toMatchObject({
        title: "No Song...",
        lines: "",
      });
    });

    it("should not treat [ch] and [tab] tags as section titles", () => {
      const songContent =
        "[Verse 1]\nif i add this[ch]Em[/ch] [ch]C[/ch] [ch]D[/ch]\nSome lyrics\n[tab]|-3-2-1-|[/tab]\n[Chorus]\nMore content";

      console.log("\n=== Test Input ===");
      console.log("Content:", songContent);

      const sections = parser.splitToSections(songContent);
      console.log("\n=== Raw Sections ===");
      console.dir(sections, { depth: null });

      expect(sections).toHaveLength(2);
      expect(sections[0].title).toBe("Verse 1");
      expect(sections[1].title).toBe("Chorus");

      // Verify the special tags are preserved in the lines
      expect(sections[0].lines).toContain("[ch]Em[/ch] [ch]C[/ch] [ch]D[/ch]");
      expect(sections[0].lines).toContain("[tab]|-3-2-1-|[/tab]");
    });
  });

  describe("parseSection", () => {
    it("should parse section with mixed content", () => {
      const section = {
        title: "Verse 1",
        lines: "Em C D\nSome lyrics\n|-3-|",
      };

      const result = parser.parseSection(section);
      expect(result).toMatchObject({
        title: "Verse 1",
        lines: expect.any(Array),
      });
      expect(result.lines.length).toBeGreaterThan(0);
    });
  });

  describe("splitToLines", () => {
    it("should split section content into lines", () => {
      const content =
        "Line 1\nLine 2\nLine 3 [tab] line4 \n line4[/tab]\n\n\n[tab]line5[/tab]";
      const lines = parser.splitToLines(content);
      expect(lines).toHaveLength(5);
      expect(lines).toEqual([
        "Line 1",
        "Line 2",
        "Line 3",
        " line4 \n line4",
        "line5",
      ]);
    });

    it("should handle empty content", () => {
      const lines = parser.splitToLines("");
      expect(lines).toHaveLength(0);
    });

    it("should properly detect and preserve tab content", () => {
      const tabContent = `
        Em C D
        [tab]
        e|---0---3---|
        B|-----5-----|
        G|---0-------|
        D|---0-------|
        A|-----------|
        E|-----------|
        [/tab]
        Am F C
      `;

      const lines = parser.splitToLines(tabContent);

      // Verify tab content is preserved as one unit
      const tabLine = lines.find((line) => line.includes("e|---0---3---"));
      expect(tabLine).toBeDefined();
      expect(tabLine).toContain("e|---0---3---");
      expect(tabLine).toContain("B|-----5-----");
      expect(tabLine).toContain("G|---0-------");

      // Verify non-tab content is split normally
      expect(lines).toContain("Em C D");
      expect(lines).toContain("Am F C");
    });
  });

  describe("splitByIntro", () => {
    it("should handle case-insensitive intro markers", () => {
      const tests = [
        "[intro]some content",
        "[Intro]some content",
        "[INTRO]some content",
        "[  intro  ]some content",
        "[ Intro ]some content",
      ];

      tests.forEach((test) => {
        const [pre, post] = parser.splitByIntro(test);
        expect(pre).toBe("");
        expect(post).toContain("some content");
      });
    });

    it("should split content correctly with pre-intro", () => {
      const content = "pre-intro content\n[Intro]intro content";
      const [pre, post] = parser.splitByIntro(content);
      expect(pre).toBe("pre-intro content\n");
      expect(post).toBe("[Intro]intro content");
    });

    it("should return empty pre-intro when no intro marker", () => {
      const content = "some content without intro";
      const [pre, post] = parser.splitByIntro(content);
      expect(pre).toBe("");
      expect(post).toBe(content);
    });
  });
});
