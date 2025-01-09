import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import React from "react";
import { StyleSheet, Button, View } from "react-native";
import Cache from "@/utils/cacheUtils";
import Search from "@/utils/searchParser";

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
  const url = buildSearchUrl("perfect");
  const data = await Cache.fetchUrl(
    url,
    search.parseSearchResults.bind(search)
  );
  console.log(data ? data : "Search failed");
  return data;
}

function buildSearchUrl(query: string): string {
  return `https://www.ultimate-guitar.com/search.php?page=1&search_type=title&value=${encodeURIComponent(
    query
  )}`;
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
