import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import React, { useState } from "react";
import { StyleSheet, View, TextInput, Animated, Pressable } from "react-native";
import Cache from "@/utils/cacheUtils";
import Search, { SEARCH_PAGE_LIMIT } from "@/utils/searchParser";
import { useTheme } from "@react-navigation/native";
import { RawSearchResult } from "@/utils/searchParser";
import { SearchResultItem } from "@/components/SearchResultItem";
import { ActivityIndicator, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<RawSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { colors } = useTheme();
  const searchAnim = new Animated.Value(0);

  const animateSearch = () => {
    Animated.spring(searchAnim, {
      toValue: isLoading ? 1 : 0,
      useNativeDriver: true,
    }).start();
  };

  const onSearch = async (query: string) => {
    setIsLoading(true);
    animateSearch();
    const data = await handleSearch(query);
    const sortedData = (data || []).sort(
      (a: RawSearchResult, b: RawSearchResult) => b.votes - a.votes
    );
    setResults(sortedData);
    setIsLoading(false);
    animateSearch();
  };

  return (
    <ThemedView style={styles.container}>
      <Animated.View
        style={[
          styles.searchContainer,
          {
            transform: [
              {
                scale: searchAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0.98],
                }),
              },
            ],
          },
        ]}
      >
        <View
          style={[
            styles.searchInputContainer,
            { backgroundColor: colors.card },
          ]}
        >
          <Ionicons
            name="search"
            size={20}
            color={colors.text}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => onSearch(searchQuery)}
            placeholder="Search for songs..."
            placeholderTextColor={colors.text + "80"}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")}>
              <Ionicons
                name="close-circle"
                size={20}
                color={colors.text}
                style={styles.clearIcon}
              />
            </Pressable>
          )}
        </View>
      </Animated.View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={results}
          renderItem={({ item }) => <SearchResultItem result={item} />}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.resultsList}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
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
    padding: 16,
    paddingTop: 60,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 10,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
  },
  searchIcon: {
    opacity: 0.7,
  },
  clearIcon: {
    opacity: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  resultsList: {
    padding: 16,
  },
  separator: {
    height: 1,
    backgroundColor: "rgba(127, 127, 127, 0.2)",
    marginVertical: 8,
  },
});
