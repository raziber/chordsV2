import React from "react";
import { View, StyleSheet } from "react-native";
import { ThemedText } from "./ThemedText";
import { ChordBox } from "./ChordBox";

type Props = {
  chords: string[];
  showBarLines?: boolean;
};

export function BarsLine({ chords, showBarLines = true }: Props) {
  console.log("BarsLine received chords:", chords);

  return (
    <View style={styles.container}>
      {chords.map((chord, index) => {
        console.log("Rendering chord:", chord);
        return (
          <View key={`chord-${index}`} style={styles.chordContainer}>
            <ChordBox chord={chord} removeAbsolute />
            {showBarLines && index < chords.length - 1 && (
              <ThemedText style={styles.barLine}>|</ThemedText>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 40,
    paddingVertical: 8,
  },
  chordContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 4,
  },
  chordWrapper: {
    minWidth: 30,
  },
  barLine: {
    fontSize: 24,
    marginHorizontal: 8,
    fontWeight: "300",
    color: "#FFFFFF",
  },
});
