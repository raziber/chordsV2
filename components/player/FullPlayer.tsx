import React from "react";
import { StyleSheet, View, Dimensions, Image, Pressable } from "react-native";
import Animated, {
  SharedValue,
  withSpring,
  withTiming,
  useAnimatedStyle,
  Layout,
  SlideInDown,
  SlideOutDown,
} from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { usePlayer } from "@/contexts/PlayerContext";
import { useTheme } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBackHandler } from "@react-native-community/hooks";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export function FullPlayer() {
  const { currentTrack, isExpanded, setIsExpanded } = usePlayer();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  useBackHandler(() => {
    if (isExpanded) {
      setIsExpanded(false);
      return true;
    }
    return false;
  });

  if (!isExpanded || !currentTrack) return null;

  return (
    <Animated.View
      entering={SlideInDown.springify().damping(25).stiffness(200).mass(0.5)}
      exiting={SlideOutDown.duration(150)}
      style={[styles.container, { backgroundColor: colors.card }]}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerContent}>
          <Pressable
            onPress={() => setIsExpanded(false)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={({ pressed }) => [
              styles.backButton,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Ionicons name="chevron-down" size={32} color={colors.text} />
          </Pressable>
        </View>
      </View>

      <View style={styles.content}>
        <Image
          source={{ uri: currentTrack.album_cover?.web_album_cover?.small }}
          style={styles.albumArt}
        />
        <View style={styles.info}>
          <ThemedText type="title" style={styles.title}>
            {currentTrack.song_name}
          </ThemedText>
          <ThemedText type="subtitle" style={styles.artist}>
            {currentTrack.artist_name}
          </ThemedText>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
  },
  header: {
    width: "100%",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "center",
    position: "relative",
    height: 44,
  },
  backButton: {
    position: "absolute",
    left: 0,
    padding: 8,
  },
  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  albumArt: {
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_WIDTH * 0.7,
    borderRadius: 8,
    marginVertical: 32,
  },
  info: {
    width: "100%",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 24,
    textAlign: "center",
  },
  artist: {
    opacity: 0.7,
    textAlign: "center",
  },
});
