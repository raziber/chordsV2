import React, { useEffect, useState } from "react";
import { ChordTypes } from "@/types/types";
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
import { LyricsLine } from "@/components/LyricsLine";
import { useRouter } from "expo-router";
import { BarsLine } from "@/components/BarsLine";
import { OverlayMenu } from "@/components/OverlayMenu";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const extractChordText = (chord: ChordTypes.Chord): string => {
  if (!chord) return "";

  let chordText = chord.base;
  if (chord.modifiers?.length > 0) {
    chordText += chord.modifiers.join("");
  }
  if (chord.bass) {
    chordText += `/${chord.bass}`;
  }
  return chordText;
};

const MetadataSection = ({ meta }: { meta: any }) => {
  if (!meta) return null;

  const items = [];

  if (meta.capo) {
    items.push(
      <View key="capo" style={styles.metadataItem}>
        <Ionicons name="git-network-outline" size={16} color="#FFFFFF" />
        <ThemedText style={styles.metadataText}>Capo: {meta.capo}</ThemedText>
      </View>
    );
  }

  if (meta.tonality) {
    items.push(
      <View key="key" style={styles.metadataItem}>
        <Ionicons name="musical-notes-outline" size={16} color="#FFFFFF" />
        <ThemedText style={styles.metadataText}>
          Key: {meta.tonality}
        </ThemedText>
      </View>
    );
  }

  // Only show tuning if it's not standard
  if (meta.tuning?.value && meta.tuning.name?.toLowerCase() !== "standard") {
    items.push(
      <View key="tuning" style={styles.metadataItem}>
        <Ionicons name="settings-outline" size={16} color="#FFFFFF" />
        <ThemedText style={styles.metadataText}>
          Tuning: {meta.tuning.value}
        </ThemedText>
      </View>
    );
  }

  if (items.length === 0) return null;

  return <View style={styles.metadataContainer}>{items}</View>;
};

export function FullPlayer() {
  const [menuVisible, setMenuVisible] = useState(false);
  const {
    currentTrack,
    isExpanded,
    setIsExpanded,
    scrollPosition,
    setScrollPosition,
  } = usePlayer();
  const insets = useSafeAreaInsets();
  const scrollViewRef = React.useRef<ScrollView>(null);
  const router = useRouter();

  // Restore scroll position when expanding
  useEffect(() => {
    if (isExpanded && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: scrollPosition, animated: false });
    }
  }, [isExpanded]);

  useBackHandler(() => {
    if (isExpanded) {
      setIsExpanded(false);
      return true;
    }
    return false;
  });

  if (!isExpanded || !currentTrack) return null;

  const handleSearchPress = () => {
    setIsExpanded(false);
    // Add timestamp to force params to be treated as new
    router.push({
      pathname: "/(tabs)",
      params: {
        clearAndFocus: "true",
        timestamp: Date.now().toString(),
      },
    });
  };

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
        <MetadataSection meta={currentTrack.parsedTab.metadata} />
        {currentTrack.parsedTab.song.map((section, sIndex) => {
          return (
            <View key={`section-${sIndex}`} style={styles.sectionContainer}>
              <ThemedText style={styles.sectionTitle}>
                {section.title}
              </ThemedText>
              {section.lines.map((line, lIndex) => {
                // Handle bars line type
                if (line.type === "bars" && line.bars) {
                  const chordsArray = line.bars.flatMap((bar) =>
                    bar.chords.map((chord) => extractChordText(chord))
                  );

                  return (
                    <View key={`line-${sIndex}-${lIndex}`}>
                      <BarsLine chords={chordsArray} />
                    </View>
                  );
                }

                // Handle regular lyrics line
                return (
                  <View key={`line-${sIndex}-${lIndex}`}>
                    <LyricsLine
                      lyrics={line.lyrics || ""}
                      chords={
                        line.chords?.map((c) => ({
                          chord: extractChordText(c.chord),
                          position: c.position,
                        })) || []
                      }
                    />
                  </View>
                );
              })}
            </View>
          );
        })}
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
            <Ionicons name="musical-note" size={16} color="#00FF00" />
            <ThemedText style={styles.songTitle} numberOfLines={1}>
              {currentTrack.song_name}
            </ThemedText>
          </View>
          <TouchableOpacity
            style={styles.topBarRight}
            onPress={() => setMenuVisible(true)}
          >
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
                locations={[0, 0.1, 0.85, 1]} // [topStart, topEnd, bottomEnd, bottomStart]
                style={{ flex: 1 }}
              />
            }
          >
            <ScrollView
              ref={scrollViewRef}
              style={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              onScroll={(e) => {
                setScrollPosition(e.nativeEvent.contentOffset.y);
              }}
              scrollEventThrottle={16}
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
          <TouchableOpacity
            style={styles.bottomButton}
            onPress={handleSearchPress}
          >
            <Ionicons name="search" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomButton}>
            <Ionicons name="play-skip-forward" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomButton}>
            <Ionicons name="list" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <OverlayMenu
          visible={menuVisible}
          onClose={() => setMenuVisible(false)}
          items={[
            {
              icon: "open-outline",
              label: "Open in UG",
              onPress: () => console.log("Open in UG"),
            },
            {
              icon: "documents-outline",
              label: "Versions",
              onPress: () => console.log("Versions"),
            },
            {
              icon: "star-outline",
              label: "Add to Favorites",
              onPress: () => console.log("Add to Favorites"),
            },
            {
              icon: "share-outline",
              label: "Share",
              onPress: () => console.log("Share"),
            },
            {
              icon: "list-outline",
              label: "Add to Playlist",
              onPress: () => console.log("Add to Playlist"),
            },
            {
              icon: "add-circle-outline",
              label: "Add to Queue",
              onPress: () => console.log("Add to Queue"),
            },
            {
              icon: "musical-notes-outline",
              label: "Open in Spotify",
              onPress: () => console.log("Open in Spotify"),
            },
          ]}
        />
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
    height: 90,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 16,
  },
  bottomButton: {
    flex: 1,
    alignItems: "center",
    marginBottom: 10,
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
  metadataContainer: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 8,
    gap: 8,
  },
  metadataItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metadataText: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.9,
  },
});
