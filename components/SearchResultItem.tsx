import React from "react";
import { View, Image, StyleSheet, Pressable } from "react-native";
import { useTheme } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "./ThemedText";
import { RawSearchResult } from "@/utils/searchParser";

interface Props {
  result: RawSearchResult;
}

export function SearchResultItem({ result }: Props) {
  const { colors } = useTheme();

  return (
    <Pressable style={[styles.container, { backgroundColor: colors.card }]}>
      <Image
        source={{
          uri:
            result.album_cover?.web_album_cover?.small ||
            "https://placeholder.com/150",
        }}
        style={styles.image}
      />
      <View style={styles.info}>
        <ThemedText type="title" style={styles.songName} numberOfLines={1}>
          {result.song_name}
        </ThemedText>
        <ThemedText style={styles.artistName} numberOfLines={1}>
          {result.artist_name}
        </ThemedText>
        <View style={styles.stats}>
          <Ionicons name="star" size={12} color={colors.text} />
          <ThemedText style={styles.votes}>{result.votes}</ThemedText>
        </View>
      </View>
      <Ionicons
        name="chevron-forward"
        size={20}
        color={colors.text}
        style={styles.arrow}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  info: {
    flex: 1,
    marginLeft: 12,
    gap: 4,
  },
  songName: {
    fontSize: 16,
    fontWeight: "600",
  },
  artistName: {
    fontSize: 14,
    opacity: 0.7,
  },
  stats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  votes: {
    fontSize: 12,
    opacity: 0.6,
  },
  arrow: {
    opacity: 0.3,
    marginLeft: 8,
  },
});
