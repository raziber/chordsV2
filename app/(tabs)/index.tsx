import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import React from "react";
import { StyleSheet, Button } from "react-native";
import Cache from "@/utils/cacheUtils";

export default function SearchScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Search</ThemedText>
      <Button title="Run Search" onPress={() => handleSearch()} />
    </ThemedView>
  );
}

async function handleSearch() {
  const url = buildSearchUrl("perfect");
  const data = await Cache.fetchUrl(url, parseSearchResults);
  console.log(data ? "Search completed" : "Search failed");
  return data;
}

function buildSearchUrl(query: string): string {
  return `https://www.ultimate-guitar.com/search.php?page=1&search_type=title&value=${encodeURIComponent(
    query
  )}`;
}

function parseSearchResults(htmlText: string): any {
  // Add your parsing logic here
  return htmlText; // For now, just returning the raw text
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
