import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarInactiveTintColor: Colors[colorScheme ?? "dark"].tabIconInactive,
        tabBarActiveTintColor: Colors[colorScheme ?? "dark"].tabIconActive,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 11,
          paddingTop: 4,
        },
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: "absolute",
            zIndex: 1,
            // Use a transparent background on iOS to show the blur effect
          },
          default: {
            backgroundColor: Colors[colorScheme ?? "dark"].backgroundOverlay,
            paddingHorizontal: 20,
            paddingTop: 5,
            height: 90,
            borderTopWidth: 0,
            zIndex: 1,
          },
        }),
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: "Search",
          tabBarIcon: ({ color }) => (
            <IconSymbol
              size={28}
              name="magnifyingglass.circle.fill"
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="paperplane.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
