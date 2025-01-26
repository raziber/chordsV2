import React, { useState, useRef } from "react";
import { View, StyleSheet, LayoutChangeEvent, Text } from "react-native";
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
  const [segmentWidths, setSegmentWidths] = useState<number[]>([]);
  const [chordWidth, setChordWidth] = useState<number>(0);
  const measurementsComplete = useRef<boolean>(false);

  // Create text segments for measurement
  const segments = chords.reduce<string[]>((acc, chord, i) => {
    const start = i > 0 ? chords[i - 1].position : 0;
    const end = chord.position;
    acc.push(lyrics.substring(start, end));
    if (i === chords.length - 1) {
      // Add remaining text after last chord
      acc.push(lyrics.substring(end));
    }
    return acc;
  }, []);

  // Handle segment measurement
  const onSegmentLayout = (event: LayoutChangeEvent, index: number) => {
    const { width } = event.nativeEvent.layout;
    setSegmentWidths((prev) => {
      const newWidths = [...prev];
      newWidths[index] = width;
      return newWidths;
    });
  };

  // Handle chord width measurement
  const onChordLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setChordWidth(width);
  };

  // Calculate chord position based on measured segments
  const getChordPosition = (chordIndex: number): number => {
    return (
      segmentWidths
        .slice(0, chordIndex + 1)
        .reduce((sum, width) => sum + width, 0) -
      chordWidth / 2
    );
  };

  // Check if all measurements are complete
  const isMeasuringComplete =
    segmentWidths.length === segments.length &&
    chordWidth > 0 &&
    !segmentWidths.includes(0);

  if (!measurementsComplete.current && isMeasuringComplete) {
    measurementsComplete.current = true;
  }

  return (
    <View style={styles.container}>
      {/* Hidden measurement containers */}
      <View style={styles.measureContainer} pointerEvents="none">
        {segments.map((segment, i) => (
          <Text
            key={`measure-${i}`}
            style={styles.lyrics}
            onLayout={(e) => onSegmentLayout(e, i)}
          >
            {segment}
          </Text>
        ))}
        <View onLayout={onChordLayout}>
          <ChordBox chord="X" />
        </View>
      </View>

      {/* Actual visible content */}
      <View style={styles.chordLine}>
        {measurementsComplete.current &&
          chords.map((chord, index) => (
            <View
              key={`chord-${index}`}
              style={[styles.chordWrapper, { left: getChordPosition(index) }]}
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
  measureContainer: {
    position: "absolute",
    opacity: 0,
    flexDirection: "row",
    left: -1000, // Hide off-screen
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
