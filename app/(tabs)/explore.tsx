import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import Cache from "@/utils/cacheUtils";
import { useTheme } from "@react-navigation/native";

export default function ExploreScreen() {
  const { colors } = useTheme();
  const [isClearing, setIsClearing] = React.useState(false);

  const handleClearCache = async () => {
    setIsClearing(true);
    await Cache.clear();
    setIsClearing(false);
  };

  return (
    <ThemedView style={styles.container}>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.card }]}
        onPress={handleClearCache}
        disabled={isClearing}
      >
        <ThemedText style={styles.buttonText}>Clear Cache</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    minWidth: 200,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
