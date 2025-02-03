import React from "react";
import {
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";
import { useTheme } from "@react-navigation/native";
import { IconSymbol } from "./ui/IconSymbol";
import { SFSymbols6_0 } from "sf-symbols-typescript";
import Animated, {
  SlideInRight,
  SlideOutRight,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";

type MenuItem = {
  icon: SFSymbols6_0;
  label: string;
  onPress: () => void;
};

type OverlayMenuProps = {
  visible: boolean;
  onClose: () => void;
  items?: MenuItem[];
};

export function OverlayMenu({
  visible,
  onClose,
  items = [],
}: OverlayMenuProps) {
  const { colors } = useTheme();

  // Use provided items or fallback to default items if none provided
  const menuItems =
    items.length > 0
      ? items
      : [
          {
            icon: "gearshape.fill" as SFSymbols6_0,
            label: "Settings",
            onPress: () => {},
          },
          {
            icon: "star.fill" as SFSymbols6_0,
            label: "Favorites",
            onPress: () => {},
          },
          {
            icon: "clock.fill" as SFSymbols6_0,
            label: "History",
            onPress: () => {},
          },
        ];

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View
        style={styles.overlay}
        entering={FadeIn.duration(100)}
        exiting={FadeOut.duration(100)}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.overlayContent}>
            <Animated.View
              entering={SlideInRight.duration(100)}
              exiting={SlideOutRight.duration(100)}
              style={[styles.animatedContainer]}
            >
              <ThemedView style={styles.menuContainer}>
                {menuItems.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.menuItem}
                    onPress={item.onPress}
                  >
                    <IconSymbol
                      name={item.icon}
                      size={24}
                      color={colors.text}
                      style={styles.icon}
                    />
                    <ThemedText style={styles.menuText}>
                      {item.label}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </ThemedView>
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  overlayContent: {
    flex: 1,
    alignItems: "flex-end",
  },
  animatedContainer: {
    position: "absolute",
    right: -420, // Start offscreen (width of menu + right margin)
    top: 10,
  },
  menuContainer: {
    width: 200,
    marginRight: 20, // Margin from right edge of screen
    borderRadius: 12,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  icon: {
    marginRight: 12,
  },
  menuText: {
    fontSize: 16,
  },
});
