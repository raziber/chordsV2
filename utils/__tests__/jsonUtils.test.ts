import JsonUtils from "../jsonUtils";

describe("JsonUtils", () => {
  describe("findJsonObjects", () => {
    test("finds single JSON object", () => {
      const text = 'some text,{"id":1,"name":"test"}';
      const results = JsonUtils.findJsonObjects(text, ',{"id"');
      expect(results).toHaveLength(1);
      expect(JSON.parse(results[0])).toEqual({ id: 1, name: "test" });
    });

    test("finds multiple JSON objects", () => {
      const text = 'text,{"id":1},more text,{"id":2}';
      const results = JsonUtils.findJsonObjects(text, ',{"id"');
      expect(results).toHaveLength(2);
      expect(JSON.parse(results[0])).toEqual({ id: 1 });
      expect(JSON.parse(results[1])).toEqual({ id: 2 });
    });

    test("handles nested objects", () => {
      const text = 'prefix,{"id":1,"nested":{"key":"value"}}';
      const results = JsonUtils.findJsonObjects(text, ',{"id"');
      expect(results).toHaveLength(1);
      expect(JSON.parse(results[0])).toEqual({
        id: 1,
        nested: { key: "value" },
      });
    });

    test("returns empty array for no matches", () => {
      const text = "no json objects here";
      const results = JsonUtils.findJsonObjects(text, ',{"id"');
      expect(results).toHaveLength(0);
    });

    test("handles invalid JSON gracefully", () => {
      const text = 'text,{"id":1,invalid}';
      const results = JsonUtils.findJsonObjects(text, ',{"id"');
      expect(results).toHaveLength(0);
    });

    test("handles empty input", () => {
      const results = JsonUtils.findJsonObjects("", ',{"id"');
      expect(results).toHaveLength(0);
    });

    test("matches only with correct identifier", () => {
      const text = 'text,{"id":1}';
      const results = JsonUtils.findJsonObjects(text, ',{"different"');
      expect(results).toHaveLength(0);
    });

    test("handles objects with arrays", () => {
      const text = 'text,{"id":1,"array":[1,2,3]}';
      const results = JsonUtils.findJsonObjects(text, ',{"id"');
      expect(results).toHaveLength(1);
      expect(JSON.parse(results[0])).toEqual({
        id: 1,
        array: [1, 2, 3],
      });
    });

    test("handles prior braces correctly", () => {
      const text = '{earlier object},{"id":1,"name":"test"}';
      const results = JsonUtils.findJsonObjects(text, ',{"id"');
      expect(results).toHaveLength(1);
      expect(JSON.parse(results[0])).toEqual({ id: 1, name: "test" });
    });
  });
});
