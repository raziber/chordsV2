import Search, { RawSearchResult } from "../searchParser";

// Mock fetch globally
global.fetch = jest.fn();

// Silence console.error during tests
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});
afterAll(() => {
  console.error = originalError;
});

describe("Search", () => {
  let search: Search;
  const mockSearchResult: RawSearchResult = {
    id: 1,
    song_id: 123,
    song_name: "Test Song",
    artist_id: 456,
    artist_name: "Test Artist",
    type: "Chords",
    part: "main",
    version: 1,
    votes: 100,
    difficulty: "intermediate",
    rating: 4.5,
    date: "2023-01-01",
    status: "approved",
    preset_id: 1,
    tab_access_type: "public",
    tp_version: 1,
    tonality_name: "C",
    version_description: "Test version",
    verified: 1,
    recording: {
      is_acoustic: 0,
      tonality_name: "C",
      performance: null,
      recording_artists: [],
    },
    album_cover: {
      has_album_cover: true,
      web_album_cover: {
        small: "test-album.jpg",
      },
    },
    artist_cover: {
      has_artist_cover: true,
      web_artist_cover: {
        small: "test-artist.jpg",
      },
    },
    artist_url: "test-artist-url",
    tab_url: "test-tab-url",
  };

  beforeEach(() => {
    search = new Search();
    jest.clearAllMocks();
  });

  describe("searchMultiplePages", () => {
    it("should fetch and combine results from multiple pages", async () => {
      const mockHtml = `
        <html>
          <body>
            some content
            ,{"id":1,"song_id":123,"song_name":"Test Song","artist_id":456,"artist_name":"Test Artist","type":"Chords","part":"main","version":1,"votes":100,"difficulty":"intermediate","rating":4.5,"date":"2023-01-01","status":"approved","preset_id":1,"tab_access_type":"public","tp_version":1,"tonality_name":"C","version_description":"Test version","verified":1,"recording":{"is_acoustic":0,"tonality_name":"C","performance":null,"recording_artists":[]},"album_cover":{"has_album_cover":true,"web_album_cover":{"small":"test-album.jpg"}},"artist_cover":{"has_artist_cover":true,"web_artist_cover":{"small":"test-artist.jpg"}},"artist_url":"test-artist-url","tab_url":"test-tab-url"}
          </body>
        </html>
      `;

      (global.fetch as jest.Mock).mockImplementation(() =>
        Promise.resolve({
          text: () => Promise.resolve(mockHtml),
        })
      );

      const results = await search.searchMultiplePages("http://test.com/", 2);

      expect(results).toHaveLength(1);
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenCalledWith(
        "http://test.com/page=1&search_type=title&"
      );
      expect(global.fetch).toHaveBeenCalledWith(
        "http://test.com/page=2&search_type=title&"
      );
    });

    it("should handle fetch errors gracefully", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

      const results = await search.searchMultiplePages("http://test.com/", 1);
      expect(results).toHaveLength(0);
    });
  });

  describe("parseSearchResults", () => {
    it("should parse valid HTML with search results", () => {
      const mockHtml = `
        <html>
          <body>
            some content
            ,{"id":1,"song_id":123,"song_name":"Test Song","artist_id":456,"artist_name":"Test Artist","type":"Chords","part":"main","version":1,"votes":100,"difficulty":"intermediate","rating":4.5,"date":"2023-01-01","status":"approved","preset_id":1,"tab_access_type":"public","tp_version":1,"tonality_name":"C","version_description":"Test version","verified":1,"recording":{"is_acoustic":0,"tonality_name":"C","performance":null,"recording_artists":[]},"album_cover":{"has_album_cover":true,"web_album_cover":{"small":"test-album.jpg"}},"artist_cover":{"has_artist_cover":true,"web_artist_cover":{"small":"test-artist.jpg"}},"artist_url":"test-artist-url","tab_url":"test-tab-url"}
          </body>
        </html>
      `;
      const results = search.parseSearchResults(mockHtml);

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual(mockSearchResult);
    });

    it("should handle HTML with no results", () => {
      const results = search.parseSearchResults("<div>No results found</div>");
      expect(results).toHaveLength(0);
    });

    it("should handle malformed HTML", () => {
      const results = search.parseSearchResults("<div>Malformed {json</div>");
      expect(results).toHaveLength(0);
    });
  });

  describe("filterResultsWithMostVotes", () => {
    it("should keep only the highest voted version of each song", () => {
      const results = [
        { ...mockSearchResult, song_id: 1, votes: 100 },
        { ...mockSearchResult, song_id: 1, votes: 50 },
        { ...mockSearchResult, song_id: 2, votes: 75 },
      ];

      const filtered = search.filterResultsWithMostVotes(results);

      expect(filtered).toHaveLength(2);
      expect(filtered.find((r) => r.song_id === 1)?.votes).toBe(100);
      expect(filtered.find((r) => r.song_id === 2)?.votes).toBe(75);
    });

    it("should handle empty results array", () => {
      const filtered = search.filterResultsWithMostVotes([]);
      expect(filtered).toHaveLength(0);
    });

    it("should handle results with same vote counts", () => {
      const results = [
        { ...mockSearchResult, song_id: 1, votes: 100 },
        { ...mockSearchResult, song_id: 1, votes: 100 },
      ];

      const filtered = search.filterResultsWithMostVotes(results);
      expect(filtered).toHaveLength(1);
    });
  });

  // Test error cases
  describe("error handling", () => {
    it("should handle network errors in searchMultiplePages", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

      const results = await search.searchMultiplePages("http://test.com/", 1);
      expect(results).toHaveLength(0);
    });

    it("should handle malformed JSON in search results", () => {
      const malformedHtml = ',{"id":1, malformed json}';
      const results = search.parseSearchResults(malformedHtml);
      expect(results).toHaveLength(0);
    });

    it("should handle undefined or null inputs", () => {
      // @ts-ignore - Testing invalid input
      expect(search.parseSearchResults(undefined)).toHaveLength(0);
      // @ts-ignore - Testing invalid input
      expect(search.parseSearchResults(null)).toHaveLength(0);
    });
  });
});
