export default class JsonUtils {
  static findJsonObjects(text: string, startIdentifier: string): string[] {
    const results: string[] = [];
    let pos = 0;

    while ((pos = this.findNextStart(text, startIdentifier, pos)) !== -1) {
      const startPos = pos;
      const jsonObject = this.extractJsonObject(text, startPos);
      if (jsonObject) {
        try {
          // Validate JSON before adding to results
          JSON.parse(jsonObject);
          results.push(jsonObject);
          pos += jsonObject.length;
        } catch (e) {
          // Skip invalid JSON
          pos++;
        }
      } else {
        pos++;
      }
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
      let i = startPos;

      // Skip any non-bracket characters until we find our opening brace
      while (i < text.length && text[i] !== "{") i++;
      if (i >= text.length) return null;

      const jsonStartPos = i;
      let bracketCount = 0;

      // Now parse the JSON object
      while (i < text.length) {
        const char = text[i];
        if (char === "{") bracketCount++;
        else if (char === "}") {
          bracketCount--;
          if (bracketCount === 0) {
            const extracted = text.substring(jsonStartPos, i + 1);
            // Validate the extracted string is actually JSON
            try {
              JSON.parse(extracted);
              return extracted;
            } catch {
              return null;
            }
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
