export default class JsonUtils {
  static findJsonObjects(text: string, startIdentifier: string): string[] {
    const results: string[] = [];
    let pos = 0;

    while ((pos = this.findNextStart(text, startIdentifier, pos)) !== -1) {
      const startPos = pos; // Start from the identifier position
      const jsonObject = this.extractJsonObject(text, startPos);
      if (jsonObject) {
        results.push(jsonObject);
        pos += jsonObject.length;
      }
      pos++; // Move past current position
    }

    return results;
  }

  private static findNextStart(
    text: string,
    identifier: string,
    startPos: number
  ): number {
    return text.indexOf(identifier, startPos);
  }

  private static extractJsonObject(
    text: string,
    startPos: number
  ): string | null {
    try {
      let bracketCount = 0;
      let i = startPos;

      // Skip any non-bracket characters (like the comma)
      while (i < text.length && text[i] !== "{") i++;
      if (i >= text.length) return null;

      const jsonStartPos = i; // Start from the opening bracket

      // Now parse the JSON object
      while (i < text.length) {
        if (text[i] === "{") bracketCount++;
        if (text[i] === "}") {
          bracketCount--;
          if (bracketCount === 0) {
            return text.substring(jsonStartPos, i + 1);
          }
        }
        i++;
      }
      return null;
    } catch (error) {
      console.error("JSON extraction error:", error);
      return null;
    }
  }
}
