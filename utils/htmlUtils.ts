import he from "he";

export default class HtmlUtils {
  static decode(html: string): string {
    if (!html) return "";
    return he.decode(html);
  }

  static simplifyNewlines(html: string): string {
    if (!html) return "";
    return html.replace(/\r/g, "\n");
  }

  static stripTags(html: string): string {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, "");
  }

  static findTextBetween(start: string, end: string, text: string): string[] {
    const startIndex = text.indexOf(start);
    if (startIndex === -1) {
      return [""];
    }

    const endIndex = text.indexOf(end, startIndex + start.length);
    if (endIndex === -1) {
      return [""];
    }

    return [text.substring(startIndex + start.length, endIndex)];
  }
}
