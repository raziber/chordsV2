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
});
