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
        <View style={styles.titleRow}>
          <ThemedText type="title" style={styles.songName} numberOfLines={1}>
            {result.song_name}
          </ThemedText>
          <View style={styles.stats}>
            <Ionicons name="star" size={10} color={colors.text} />
            <ThemedText style={styles.votes}>{result.votes}</ThemedText>
          </View>
        </View>
        <ThemedText style={styles.artistName} numberOfLines={1}>
          {result.artist_name}
        </ThemedText>
      </View>
      <Ionicons
        name="chevron-forward"
        size={16}
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
    padding: 8,
    borderRadius: 8,
    gap: 8,
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 6,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  songName: {
    fontSize: 20,
    fontWeight: "600",
    flex: 1,
  },
  artistName: {
    fontSize: 12,
    opacity: 0.7,
  },
  stats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  votes: {
    fontSize: 10,
    opacity: 0.6,
  },
  arrow: {
    opacity: 0.3,
  },
});
