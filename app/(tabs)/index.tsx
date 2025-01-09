import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import React from "react";
import { StyleSheet, Button, View } from "react-native";
import Cache from "@/utils/cacheUtils";
import Search, { SEARCH_PAGE_LIMIT } from "@/utils/searchParser";

export default function SearchScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Search</ThemedText>
      <View style={styles.buttonsContainer}>
        <Button title="Run Search" onPress={() => handleSearch()} />
        <View style={styles.buttonSpacer} />
        <Button title="Clear Cache" onPress={() => Cache.clear()} />
      </View>
    </ThemedView>
  );
}

async function handleSearch() {
  const search = new Search();
  const query = "perfect";
  const cacheKey = `search_${query}`;

  // Try to get from cache first
  const cachedData = await Cache.get(cacheKey);
  if (cachedData) {
    console.log("Using cached search results");
    return cachedData;
  }

  // If not in cache, fetch all pages
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
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonsContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  buttonSpacer: {
    height: 10,
  },
});
