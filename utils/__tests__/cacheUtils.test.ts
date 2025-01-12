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

      const result = await Cache.get("test-key");
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
  });

  describe("save", () => {
    it("should save data with timestamp", async () => {
      const mockData = { test: "data" };
      const now = Date.now();
      jest.spyOn(Date, "now").mockImplementation(() => now);

      await Cache.save("test-key", mockData);

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
      const mockKeys = ["key1", "key2"];
      const mockItems = {
        key1: JSON.stringify({
          timestamp: now - 25 * 60 * 60 * 1000,
          data: "expired",
        }),
        key2: JSON.stringify({ timestamp: now, data: "valid" }),
      };

      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue(mockKeys);
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) =>
        Promise.resolve(mockItems[key as keyof typeof mockItems])
      );

      await Cache.removeExpired();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith("key1");
      expect(AsyncStorage.removeItem).not.toHaveBeenCalledWith("key2");
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
  });
});
