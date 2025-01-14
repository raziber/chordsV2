import AsyncStorage from "@react-native-async-storage/async-storage";
import Cache from "../cacheUtils";

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  getAllKeys: jest.fn(),
  multiRemove: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

describe("Cache", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("get", () => {
    it("should return cached data when available", async () => {
      const mockData = { test: "data" };
      const mockCached = JSON.stringify({
        timestamp: Date.now(),
        data: mockData,
      });

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(mockCached);

      const result = await Cache.get("test-key", { prefix: "" });
      expect(result).toEqual(mockData);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith("test-key");
    });

    it("should return null when no cache exists", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await Cache.get("non-existent");
      expect(result).toBeNull();
    });

    it("should handle invalid JSON", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue("invalid-json");

      const result = await Cache.get("test-key");
      expect(result).toBeNull();
    });

    it("should respect custom cache duration", async () => {
      const mockData = { test: "data" };
      const timestamp = Date.now() - 2 * 60 * 60 * 1000; // 2 hours ago
      const mockCached = JSON.stringify({
        timestamp,
        data: mockData,
      });

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(mockCached);

      // Should return null with 1 hour duration
      const result1 = await Cache.get("test-key", { duration: 60 * 60 * 1000 });
      expect(result1).toBeNull();

      // Should return data with 3 hour duration
      const result2 = await Cache.get("test-key", {
        duration: 3 * 60 * 60 * 1000,
      });
      expect(result2).toEqual(mockData);
    });

    it("should use cache prefix", async () => {
      const mockData = { test: "data" };
      const mockCached = JSON.stringify({
        timestamp: Date.now(),
        data: mockData,
      });

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(mockCached);

      await Cache.get("test-key", { prefix: "custom:" });
      expect(AsyncStorage.getItem).toHaveBeenCalledWith("custom:test-key");
    });

    it("should validate version", async () => {
      const mockData = { test: "data" };
      const mockCached = JSON.stringify({
        timestamp: Date.now(),
        data: mockData,
        version: "1.0",
      });

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(mockCached);

      const result1 = await Cache.get("test-key", { version: "1.0" });
      expect(result1).toEqual(mockData);

      const result2 = await Cache.get("test-key", { version: "2.0" });
      expect(result2).toBeNull();
    });

    it("should use validator function", async () => {
      const mockData = { test: "data" };
      const mockCached = JSON.stringify({
        timestamp: Date.now(),
        data: mockData,
      });

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(mockCached);

      const result1 = await Cache.get("test-key", {
        validator: (data) => data.test === "data",
      });
      expect(result1).toEqual(mockData);

      const result2 = await Cache.get("test-key", {
        validator: (data) => data.test === "wrong",
      });
      expect(result2).toBeNull();
    });

    it("should use default prefix when no prefix option provided", async () => {
      const mockData = { test: "data" };
      const mockCached = JSON.stringify({
        timestamp: Date.now(),
        data: mockData,
      });

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(mockCached);

      await Cache.get("test-key");
      expect(AsyncStorage.getItem).toHaveBeenCalledWith("app_cache:test-key");
    });
  });

  describe("save", () => {
    it("should save data with timestamp", async () => {
      const mockData = { test: "data" };
      const now = Date.now();
      jest.spyOn(Date, "now").mockImplementation(() => now);

      await Cache.save("test-key", mockData, { prefix: "" });

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        "test-key",
        JSON.stringify({
          timestamp: now,
          data: mockData,
        })
      );
    });

    it("should handle save errors gracefully", async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(
        new Error("Save failed")
      );

      const consoleError = jest.spyOn(console, "error").mockImplementation();
      await Cache.save("test-key", {});

      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    });

    it("should save with version", async () => {
      const mockData = { test: "data" };
      const now = Date.now();
      jest.spyOn(Date, "now").mockImplementation(() => now);

      await Cache.save("test-key", mockData, { version: "1.0" });

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        "app_cache:test-key",
        JSON.stringify({
          timestamp: now,
          data: mockData,
          version: "1.0",
        })
      );
    });

    it("should use custom prefix when saving", async () => {
      const mockData = { test: "data" };
      await Cache.save("test-key", mockData, { prefix: "custom:" });

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        "custom:test-key",
        expect.any(String)
      );
    });
  });

  describe("clear", () => {
    it("should clear all cached items", async () => {
      const mockKeys = ["key1", "key2"];
      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue(mockKeys);

      await Cache.clear();

      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith(mockKeys);
    });

    it("should handle clear errors gracefully", async () => {
      (AsyncStorage.getAllKeys as jest.Mock).mockRejectedValue(
        new Error("Clear failed")
      );

      const consoleError = jest.spyOn(console, "error").mockImplementation();
      await Cache.clear();

      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    });
  });

  describe("removeExpired", () => {
    it("should remove expired items", async () => {
      const now = Date.now();
      const mockKeys = ["app_cache:key1", "app_cache:key2"];
      const mockItems = {
        "app_cache:key1": JSON.stringify({
          timestamp: now - 25 * 60 * 60 * 1000,
          data: "expired",
        }),
        "app_cache:key2": JSON.stringify({ timestamp: now, data: "valid" }),
      };

      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue(mockKeys);
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) =>
        Promise.resolve(mockItems[key as keyof typeof mockItems])
      );

      await Cache.removeExpired();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith("app_cache:key1");
      expect(AsyncStorage.removeItem).not.toHaveBeenCalledWith(
        "app_cache:key2"
      );
    });

    it("should only remove items with matching prefix", async () => {
      const now = Date.now();
      const mockKeys = ["prefix1:key1", "prefix2:key1"] as const;
      type MockKeys = (typeof mockKeys)[number];

      const mockItems: Record<MockKeys, string> = {
        "prefix1:key1": JSON.stringify({
          timestamp: now - 25 * 60 * 60 * 1000,
          data: "expired",
        }),
        "prefix2:key1": JSON.stringify({
          timestamp: now - 25 * 60 * 60 * 1000,
          data: "expired",
        }),
      };

      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue(mockKeys);
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key: MockKeys) =>
        Promise.resolve(mockItems[key])
      );

      await Cache.removeExpired({ prefix: "prefix1:" });

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith("prefix1:key1");
      expect(AsyncStorage.removeItem).not.toHaveBeenCalledWith("prefix2:key1");
    });
  });

  describe("fetchUrl", () => {
    it("should return cached data if available", async () => {
      const mockData = { test: "data" };
      const mockCached = JSON.stringify({
        timestamp: Date.now(),
        data: mockData,
      });

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(mockCached);

      const result = await Cache.fetchUrl("http://test.com", (data) =>
        JSON.parse(data)
      );
      expect(result).toEqual(mockData);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should fetch and cache new data if no cache exists", async () => {
      const mockData = { test: "data" };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      (global.fetch as jest.Mock).mockResolvedValue({
        text: () => Promise.resolve(JSON.stringify(mockData)),
      });

      const result = await Cache.fetchUrl("http://test.com", (data) =>
        JSON.parse(data)
      );

      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith("http://test.com");
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it("should handle fetch errors gracefully", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Fetch failed"));

      const result = await Cache.fetchUrl("http://test.com", (data) =>
        JSON.parse(data)
      );
      expect(result).toBeNull();
    });

    it("should handle parser errors gracefully", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      (global.fetch as jest.Mock).mockResolvedValue({
        text: () => Promise.resolve("invalid-json"),
      });

      const result = await Cache.fetchUrl("http://test.com", (data) =>
        JSON.parse(data)
      );
      expect(result).toBeNull();
    });

    it("should respect cache options when fetching", async () => {
      const mockData = { test: "data" };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      (global.fetch as jest.Mock).mockResolvedValue({
        text: () => Promise.resolve(JSON.stringify(mockData)),
      });

      await Cache.fetchUrl("http://test.com", (data) => JSON.parse(data), {
        prefix: "api:",
        version: "1.0",
      });

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        "api:http://test.com",
        expect.stringContaining('"version":"1.0"')
      );
    });
  });
});
