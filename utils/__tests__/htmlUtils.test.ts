import HtmlUtils from "../htmlUtils";

describe("HtmlUtils", () => {
  describe("decode", () => {
    it("should decode HTML entities", () => {
      const input = "&amp; &lt;script&gt; &quot;test&quot; &copy;";
      const expected = '& <script> "test" ©';
      expect(HtmlUtils.decode(input)).toBe(expected);
    });

    it("should handle empty string", () => {
      expect(HtmlUtils.decode("")).toBe("");
    });

    it("should handle null or undefined", () => {
      expect(HtmlUtils.decode(undefined as unknown as string)).toBe("");
      expect(HtmlUtils.decode(null as unknown as string)).toBe("");
    });

    it("should handle string without entities", () => {
      const input = "Hello World";
      expect(HtmlUtils.decode(input)).toBe(input);
    });
  });

  describe("stripTags", () => {
    it("should remove HTML tags", () => {
      const input = "<div>Hello <b>World</b></div>";
      const expected = "Hello World";
      expect(HtmlUtils.stripTags(input)).toBe(expected);
    });

    it("should handle empty string", () => {
      expect(HtmlUtils.stripTags("")).toBe("");
    });

    it("should handle null or undefined", () => {
      expect(HtmlUtils.stripTags(undefined as unknown as string)).toBe("");
      expect(HtmlUtils.stripTags(null as unknown as string)).toBe("");
    });

    it("should handle string without tags", () => {
      const input = "Hello World";
      expect(HtmlUtils.stripTags(input)).toBe(input);
    });

    it("should handle complex HTML", () => {
      const input = '<div class="test"><p>Hello</p><span>World</span></div>';
      const expected = "HelloWorld";
      expect(HtmlUtils.stripTags(input)).toBe(expected);
    });
  });

  describe("simplifyNewlines", () => {
    it("should convert \\r\\n to \\n", () => {
      const input = "Hello\\r\\nWorld";
      const expected = "Hello\nWorld";
      expect(HtmlUtils.simplifyNewlines(input)).toBe(expected);
    });

    it("should convert \\r to \\n", () => {
      const input = "Hello\\rWorld";
      const expected = "Hello\nWorld";
      expect(HtmlUtils.simplifyNewlines(input)).toBe(expected);
    });

    it("should handle mixed line endings in complex text", () => {
      const input =
        "[Intro]\\r\\n[ch]G[/ch]\\r\\n\\r\\n[Verse 1]\\r\\n[tab]          [ch]G[/ch]        [ch]Em[/ch]\\r\\nI found a love for me";
      const expected =
        "[Intro]\n[ch]G[/ch]\n\n[Verse 1]\n[tab]          [ch]G[/ch]        [ch]Em[/ch]\nI found a love for me";
      expect(HtmlUtils.simplifyNewlines(input)).toBe(expected);
    });

    it("should handle mixed line endings", () => {
      const input = "Hello\\r\\nWorld\\rTest\\nFinal";
      const expected = "Hello\nWorld\nTest\nFinal";
      expect(HtmlUtils.simplifyNewlines(input)).toBe(expected);
    });

    it("should handle empty string", () => {
      expect(HtmlUtils.simplifyNewlines("")).toBe("");
    });

    it("should handle null or undefined", () => {
      expect(HtmlUtils.simplifyNewlines(undefined as unknown as string)).toBe(
        ""
      );
      expect(HtmlUtils.simplifyNewlines(null as unknown as string)).toBe("");
    });

    it("should handle string without line endings", () => {
      const input = "Hello World";
      expect(HtmlUtils.simplifyNewlines(input)).toBe(input);
    });

    it("should handle multiple consecutive line endings", () => {
      const input = "Hello\\r\\r\\rWorld";
      const expected = "Hello\n\n\nWorld";
      expect(HtmlUtils.simplifyNewlines(input)).toBe(expected);
    });
  });
});
