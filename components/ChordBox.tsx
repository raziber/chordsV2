import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { ThemedText } from "./ThemedText";

type ChordBoxProps = {
  chord: string;
  onPress?: () => void;
};

export function ChordBox({ chord, onPress }: ChordBoxProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <ThemedText style={styles.text}>{chord}</ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.8)",
    borderRadius: 4,
    padding: 3,
    paddingHorizontal: 6,
    minHeight: 22, // Ensure minimum height based on text size
    minWidth: 20, // Ensure minimum width
    justifyContent: "center", // Center text vertically
    alignItems: "center", // Center text horizontally
    // ensure box is defined by its bottom center in the parent
    position: "absolute",
    bottom: 0,
    left: "50%",
    transform: [{ translateX: "-50%" }], // Center box horizontally
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center", // Ensure text is centered
  },
});
