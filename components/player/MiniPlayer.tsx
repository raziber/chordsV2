import React from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
  Image,
  Platform,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { usePlayer } from "@/contexts/PlayerContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@react-navigation/native";

export function MiniPlayer() {
  const { currentTrack, setIsExpanded } = usePlayer();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  if (!currentTrack) return null;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          bottom: insets.bottom + 66,
          backgroundColor: colors.card,
        },
      ]}
      onPress={() => setIsExpanded(true)}
      activeOpacity={0.9}
    >
      <Image
        source={{ uri: currentTrack.album_cover?.web_album_cover?.small }}
        style={styles.image}
      />
      <View style={styles.content}>
        <ThemedText numberOfLines={1} style={styles.title}>
          {currentTrack.song_name}
        </ThemedText>
        <ThemedText numberOfLines={1} style={styles.artist}>
          {currentTrack.artist_name}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  image: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginLeft: 10,
  },
  content: {
    flex: 1,
    marginLeft: 12,
    marginRight: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  artist: {
    fontSize: 14,
    opacity: 0.8,
  },
});
