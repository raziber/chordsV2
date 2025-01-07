import he from "he";

export default class HtmlUtils {
  static decode(html: string): string {
    if (!html) return "";
    return he.decode(html);
  }

  static stripTags(html: string): string {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, "");
  }
}
