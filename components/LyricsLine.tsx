import React, { useState } from "react";
import { View, StyleSheet, LayoutChangeEvent } from "react-native";
import { ThemedText } from "./ThemedText";
import { ChordBox } from "./ChordBox";

type ChordPosition = {
  chord: string; // Changed from Chord type to string
  position: number;
};

type LyricsLineProps = {
  lyrics: string;
  chords: ChordPosition[];
};

export function LyricsLine({ lyrics, chords }: LyricsLineProps) {
  const [lineWidth, setLineWidth] = useState(0);

  const handleLayout = (event: LayoutChangeEvent) => {
    setLineWidth(event.nativeEvent.layout.width);
  };

  const getXPosition = (position: number): number => {
    if (!lyrics || lineWidth === 0) return 0;

    // Calculate position as a percentage of the line width
    const charCount = lyrics.length;
    const positionPercentage = position / charCount;
    return lineWidth * positionPercentage;
  };

  return (
    <View style={styles.container}>
      <View style={styles.chordsContainer}>
        {chords.map((chordPosition, index) => {
          const x = getXPosition(chordPosition.position);

          return (
            <View
              key={`chord-${index}`}
              style={[
                styles.chordWrapper,
                {
                  transform: [{ translateX: x }],
                },
              ]}
            >
              <ChordBox chord={chordPosition.chord} />
            </View>
          );
        })}
      </View>
      <ThemedText style={styles.lyrics} onLayout={handleLayout}>
        {lyrics}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  chordsContainer: {
    height: 24,
    marginBottom: 4,
  },
  chordWrapper: {
    position: "absolute",
    alignItems: "center",
    transform: [{ translateX: -50 }], // Center the chord box
  },
  lyrics: {
    fontSize: 16,
    lineHeight: 24,
  },
});
