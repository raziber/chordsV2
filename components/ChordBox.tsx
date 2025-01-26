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
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.8)",
    borderRadius: 4,
    padding: 4,
    paddingHorizontal: 6,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    alignSelf: "center",
  },
  text: {
    fontSize: 14,
    fontWeight: "500",
  },
});
