import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import React, { useState } from "react";
import { StyleSheet, Button, View, TextInput } from "react-native";
import Cache from "@/utils/cacheUtils";
import Search, { SEARCH_PAGE_LIMIT } from "@/utils/searchParser";
import { useTheme } from "@react-navigation/native";
import { SearchResult } from "@/types/search";
import { SearchResultItem } from "@/components/SearchResultItem";
import { ActivityIndicator, FlatList } from "react-native";

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { colors } = useTheme();

  const onSearch = async (query: string) => {
    setIsLoading(true);
    const data = await handleSearch(query);
    const sortedData: SearchResult[] = (data || []).sort(
      (a: SearchResult, b: SearchResult) => b.votes - a.votes
    );
    setResults(sortedData);
    setIsLoading(false);
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.searchContainer}>
        <ThemedText type="title" style={styles.title}>
          Search
        </ThemedText>
        <View style={styles.searchRow}>
          <TextInput
            style={[
              styles.searchInput,
              {
                borderColor: colors.border,
                color: colors.text,
                backgroundColor: colors.card,
              },
            ]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => onSearch(searchQuery)}
            placeholder="Enter search term..."
            placeholderTextColor={colors.text + "80"} // 50% opacity
            returnKeyType="search"
          />
          <Button title="Search" onPress={() => onSearch(searchQuery)} />
        </View>
        <Button title="Clear Cache" onPress={() => Cache.clear()} />
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : (
        <FlatList
          data={results}
          renderItem={({ item }) => <SearchResultItem result={item} />}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.resultsList}
        />
      )}
    </ThemedView>
  );
}

// Export for testing
export async function handleSearch(query: string) {
  query = query.trim();
  if (!query) return;

  const search = new Search();
  const cacheKey = `search_${query}`;

  try {
    // Try to get from cache first
    const cachedData = await Cache.get(cacheKey);
    if (cachedData) {
      console.log("Using cached search results");
      return cachedData;
    }

    // If not in cache, fetch all pages
    console.log("Fetching search results...");
    const baseUrl = `https://www.ultimate-guitar.com/search.php?value=${encodeURIComponent(
      query
    )}&`;
    const data = await search.searchMultiplePages(baseUrl, SEARCH_PAGE_LIMIT);

    // Cache the results
    if (data.length > 0) {
      await Cache.save(cacheKey, data);
    }

    console.log(
      `Found ${data.length} unique results across ${SEARCH_PAGE_LIMIT} pages`
    );
    return data;
  } catch (error) {
    console.error("Search error:", error);
    return [];
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: 20,
    paddingTop: 60, // Added padding for camera
    gap: 10,
  },
  title: {
    marginBottom: 10,
    textAlign: "center",
  },
  searchRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
  },
  resultsList: {
    padding: 10,
  },
});
