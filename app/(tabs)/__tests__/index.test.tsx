import { handleSearch } from "../index";
import Cache from "@/utils/cacheUtils";
import Search from "@/utils/searchParser";

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

// Mock the dependencies
jest.mock("@/utils/cacheUtils");
jest.mock("@/utils/searchParser");

describe("handleSearch", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it("should return early if query is empty", async () => {
    const result = await handleSearch("");
    expect(result).toBeUndefined();
    expect(Cache.get).not.toHaveBeenCalled();
  });

  it("should return cached data if available", async () => {
    const mockCachedData = [{ id: 1, title: "Test Song" }];
    (Cache.get as jest.Mock).mockResolvedValue(mockCachedData);

    const result = await handleSearch("test query");

    expect(result).toBe(mockCachedData);
    expect(Cache.get).toHaveBeenCalledWith("search_test query");
    expect(Search.prototype.searchMultiplePages).not.toHaveBeenCalled();
  });

  it("should fetch and cache new data if not in cache", async () => {
    const mockSearchResults = [{ id: 2, title: "New Song" }];
    (Cache.get as jest.Mock).mockResolvedValue(null);
    (Search.prototype.searchMultiplePages as jest.Mock).mockResolvedValue(
      mockSearchResults
    );

    const result = await handleSearch("new query");

    expect(result).toBe(mockSearchResults);
    expect(Cache.get).toHaveBeenCalledWith("search_new query");
    expect(Search.prototype.searchMultiplePages).toHaveBeenCalledWith(
      "https://www.ultimate-guitar.com/search.php?value=new%20query&",
      expect.any(Number)
    );
    expect(Cache.save).toHaveBeenCalledWith(
      "search_new query",
      mockSearchResults
    );
  });

  it("should not cache empty results", async () => {
    (Cache.get as jest.Mock).mockResolvedValue(null);
    (Search.prototype.searchMultiplePages as jest.Mock).mockResolvedValue([]);

    const result = await handleSearch("no results");

    expect(result).toEqual([]);
    expect(Cache.save).not.toHaveBeenCalled();
  });

  it("should handle cache errors gracefully", async () => {
    (Cache.get as jest.Mock).mockRejectedValue(new Error("Cache error"));
    (Search.prototype.searchMultiplePages as jest.Mock).mockResolvedValue([]);

    const result = await handleSearch("error test");
    expect(result).toEqual([]);
  });

  it("should handle search errors gracefully", async () => {
    (Cache.get as jest.Mock).mockResolvedValue(null);
    (Search.prototype.searchMultiplePages as jest.Mock).mockRejectedValue(
      new Error("Search failed")
    );

    const result = await handleSearch("error test");
    expect(result).toEqual([]);
  });
});
