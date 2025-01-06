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
  console.log("Search button pressed");
  const url = buildSearchUrl("perfect");
  const data = await getSearchData(url);
  console.log(data ? "Search completed" : "Search failed");
  return data;
}

function buildSearchUrl(query: string): string {
  return `https://www.ultimate-guitar.com/search.php?page=1&search_type=title&value=${encodeURIComponent(
    query
  )}`;
}

async function getSearchData(url: string): Promise<string | null> {
  const cachedData = await getCachedData(url);
  if (cachedData) return cachedData;
  return await getFreshData(url);
}

async function getCachedData(url: string): Promise<string | null> {
  const cachedData = await Cache.get(url);
  if (cachedData) {
    console.log("Using cached data");
    return cachedData;
  }
  return null;
}

async function getFreshData(url: string): Promise<string | null> {
  console.log("Fetching fresh data");
  const response = await fetchUrlData(url);
  if (response) {
    await Cache.save(url, response);
    return response;
  }
  return null;
}

async function fetchUrlData(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    return await response.text();
  } catch (error) {
    console.log("Error:", error);
    return null;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
