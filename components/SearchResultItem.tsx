import React from "react";
import { View, Image, StyleSheet } from "react-native";
import { ThemedText } from "./ThemedText";
import { RawSearchResult } from "@/utils/searchParser";

interface Props {
  result: RawSearchResult;
}

export function SearchResultItem({ result }: Props) {
  return (
    <View style={styles.container}>
      <Image
        source={{
          uri:
            result.album_cover?.web_album_cover?.small ||
            "https://placeholder.com/150",
        }}
        style={styles.image}
      />
      <View style={styles.info}>
        <ThemedText type="title" style={styles.songName}>
          {result.song_name}
        </ThemedText>
        <ThemedText>{result.artist_name}</ThemedText>
        <ThemedText style={styles.votes}>{result.votes} votes</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 5,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  songName: {
    fontSize: 16,
  },
  votes: {
    fontSize: 12,
    opacity: 0.7,
  },
});
