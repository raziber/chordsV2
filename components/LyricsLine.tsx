import React from "react";
import { View, StyleSheet } from "react-native";
import { ThemedText } from "./ThemedText";
import { ChordBox } from "./ChordBox";

type Props = {
  lyrics: string;
  chords: Array<{
    chord: string;
    position: number;
  }>;
};

export function LyricsLine({ lyrics, chords }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.chordLine}>
        {chords.map((chord, index) => (
          <View
            key={`chord-${index}`}
            style={[
              styles.chordWrapper,
              { left: chord.position * 8 }, // Multiple by character width
            ]}
          >
            <ChordBox chord={chord.chord} />
          </View>
        ))}
      </View>
      <ThemedText style={styles.lyrics}>{lyrics}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  chordLine: {
    height: 24,
    marginBottom: 4,
    position: "relative",
  },
  chordWrapper: {
    position: "absolute",
    top: 0,
  },
  lyrics: {
    fontSize: 14,
    lineHeight: 20,
  },
});
