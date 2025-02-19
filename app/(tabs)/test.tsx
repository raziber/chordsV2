import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { ThemedView } from "@/components/ThemedView";
import { LyricsLine } from "@/components/LyricsLine";
import { testSong } from "@/data/testLyrics";
import { ThemedText } from "@/components/ThemedText";

export default function TestScreen() {
  // Add error boundary in case data is not loaded
  if (!testSong || !testSong.metadata) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Loading test data...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scroll}>
        <ThemedText style={styles.title}>{testSong.metadata.title}</ThemedText>
        <ThemedText style={styles.artist}>
          {testSong.metadata.artist}
        </ThemedText>

        {testSong.song.map((section, sIndex) => (
          <ThemedView key={sIndex} style={styles.section}>
            <ThemedText style={styles.sectionTitle}>{section.title}</ThemedText>
            {section.lines.map((line, lIndex) => (
              <LyricsLine
                key={lIndex}
                lyrics={line.lyrics}
                chords={[...line.chords]}
              />
            ))}
          </ThemedView>
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 40,
    marginBottom: 4,
  },
  artist: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },
});
