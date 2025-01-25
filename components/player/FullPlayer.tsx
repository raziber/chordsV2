import React, { useEffect } from "react";
import {
  StyleSheet,
  View,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import Animated, { SlideInDown, SlideOutDown } from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { usePlayer } from "@/contexts/PlayerContext";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBackHandler } from "@react-native-community/hooks";
import MaskedView from "@react-native-masked-view/masked-view";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export function FullPlayer() {
  const { currentTrack, isExpanded, setIsExpanded } = usePlayer();
  const insets = useSafeAreaInsets();

  useBackHandler(() => {
    if (isExpanded) {
      setIsExpanded(false);
      return true;
    }
    return false;
  });

  if (!isExpanded || !currentTrack) return null;

  const renderContent = () => {
    if (!currentTrack.parsedTab) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      );
    }

    if (!currentTrack.parsedTab.song) {
      return (
        <View style={styles.loadingContainer}>
          <ThemedText>No content available</ThemedText>
        </View>
      );
    }

    return (
      <View style={styles.contentContainer}>
        {currentTrack.parsedTab.song.map((section, sIndex) => (
          <View key={`section-${sIndex}`} style={styles.sectionContainer}>
            <ThemedText style={styles.sectionTitle}>{section.title}</ThemedText>
            {section.lines.map((line, lIndex) => (
              <View key={`line-${sIndex}-${lIndex}`}>
                {line.lyrics && (
                  <ThemedText style={styles.tabText}>{line.lyrics}</ThemedText>
                )}
              </View>
            ))}
          </View>
        ))}
      </View>
    );
  };

  return (
    <Animated.View
      entering={SlideInDown.springify().damping(25).stiffness(200).mass(0.5)}
      exiting={SlideOutDown.duration(150)}
      style={styles.container}
    >
      <LinearGradient colors={["#3B414D", "#272B33"]} style={styles.container}>
        {/* Top Bar */}
        <View style={[styles.topBar, { paddingTop: insets.top }]}>
          <TouchableOpacity
            style={styles.topBarLeft}
            onPress={() => setIsExpanded(false)}
          >
            <Ionicons name="chevron-down" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.topBarCenter}>
            <Ionicons name="musical-note" size={16} color="#FFFFFF" />
            <ThemedText style={styles.songTitle} numberOfLines={1}>
              {currentTrack.song_name}
            </ThemedText>
          </View>
          <TouchableOpacity style={styles.topBarRight}>
            <Ionicons name="ellipsis-vertical" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Scrollable Content with fade masks */}
        <View style={styles.scrollContainer}>
          <MaskedView
            style={{ flex: 1 }}
            maskElement={
              <LinearGradient
                colors={["transparent", "#ffffff", "#ffffff", "transparent"]}
                locations={[0, 0.1, 0.9, 1]}
                style={{ flex: 1 }}
              />
            }
          >
            <ScrollView
              style={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {renderContent()}
            </ScrollView>
          </MaskedView>
        </View>

        {/* Bottom Bar */}
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom }]}>
          <TouchableOpacity style={styles.bottomButton}>
            <Ionicons name="cellular" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomButton}>
            <Ionicons name="play-skip-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomButton}>
            <Ionicons name="search" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomButton}>
            <Ionicons name="play-skip-forward" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomButton}>
            <Ionicons name="list" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
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
  topBar: {
    height: 80,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  topBarLeft: {
    flex: 1,
  },
  topBarCenter: {
    flex: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  topBarRight: {
    flex: 1,
    alignItems: "flex-end",
  },
  songTitle: {
    fontSize: 16,
    maxWidth: 200,
  },
  scrollContainer: {
    flex: 1,
    position: "relative",
    backgroundColor: "transparent",
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  tabText: {
    fontFamily: "monospace",
    fontSize: 14,
    lineHeight: 22,
  },
  bottomBar: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 16,
  },
  bottomButton: {
    flex: 1,
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
  },
  contentContainer: {
    minHeight: SCREEN_HEIGHT - 160, // Account for top and bottom bars
    paddingVertical: 20,
    paddingBottom: SCREEN_HEIGHT / 2, // Add extra half screen of padding at bottom
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#FFFFFF",
  },
});
