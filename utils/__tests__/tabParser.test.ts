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

    it("should parse a complete tab", async () => {
      const result = await parser.parseTab("https://example.com/tab");
      expect(result).toBeTruthy();
      expect(result?.metadata).toBeDefined();
      expect(result?.preIntro).toBeDefined();
      expect(result?.song).toBeInstanceOf(Array);
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

  describe("splitToParts", () => {
    it("should split HTML into four parts", () => {
      const [preMeta, preIntro, song, postMeta] = parser.splitToParts(mockHtml);
      expect(preMeta).toBeDefined();
      expect(preIntro).toBeDefined();
      expect(song).toBeDefined();
      expect(postMeta).toBeDefined();
    });

    it("should handle missing sections", () => {
      const emptyHtml = '{"tab":{"content":""}}';
      const [preMeta, preIntro, song, postMeta] =
        parser.splitToParts(emptyHtml);
      expect(preMeta).toBe("");
      expect(preIntro).toBe("");
      expect(song).toBe("");
      expect(postMeta).toBe("");
    });
  });

  describe("parseParts", () => {
    it("should create a complete song object", () => {
      const parts: [string, string, string, string] = [
        '{"metadata":{"title":"Test Song"}}',
        "[Pre-Intro]\nTest pre-intro",
        "[Verse]\nTest verse",
        '{"additional":"data"}',
      ];

      const result = parser.parseParts(parts);
      expect(result).toMatchObject({
        metadata: expect.any(Object),
        preIntro: expect.any(String),
        song: expect.any(Array),
      });
    });
  });

  describe("parseMetadata", () => {
    it("should extract metadata from parts", () => {
      const preMeta = '{"title":"Test Song","artist":"Test Artist"}';
      const postMeta = '{"album":"Test Album","year":"2023"}';

      const result = parser.parseMetadata(preMeta, postMeta);
      expect(result).toMatchObject({
        title: expect.any(String),
        artist: expect.any(String),
        album: expect.any(String),
        year: expect.any(String),
      });
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

  describe("parseSong", () => {
    it("should parse song sections", () => {
      const songContent = `
        [Verse 1]
        Em C D
        Some lyrics
        [Chorus]
        Am F C
        More lyrics
      `;

      const result = parser.parseSong(songContent);
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty("title");
      expect(result[0]).toHaveProperty("lines");
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
});
