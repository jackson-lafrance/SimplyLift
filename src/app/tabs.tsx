import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useAppContext } from "./context/appContext";

// Screens
import Index from "./index";
import Exercises from "./exercises";
import Settings from "./settings";

export default function Tabs() {
  const [activeTab, setActiveTab] = useState<"home" | "exercises" | "settings">("home");
  const insets = useSafeAreaInsets();
  const { setCurrentWorkout } = useAppContext();

  const renderScreen = () => {
    switch (activeTab) {
      case "home":
        return <Index />;
      case "exercises":
        return <Exercises />;
      case "settings":
        return <Settings />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Active Screen */}
      <View style={styles.screenContainer}>{renderScreen()}</View>

      {/* Unified Bottom Shelf */}
      <View style={[styles.shelf, { paddingBottom: insets.bottom + 10 }]}>
        {/* Start Workout Button */}
        <Pressable
          style={styles.startButton}
          onPress={() =>
            setCurrentWorkout({
              name: "New Workout",
              time: 0,
              date: new Date(),
              exercises: [],
            })
          }
        >
          <Text style={styles.startButtonText}>Start Workout</Text>
        </Pressable>

        {/* Tab Icons */}
        <View style={styles.tabBar}>
          <Pressable 
            style={styles.tabItem} 
            onPress={() => setActiveTab("home")}
          >
            <MaterialIcons 
              name={activeTab === "home" ? "home" : "home"} 
              size={28} 
              color={activeTab === "home" ? "black" : "#8E8E93"} 
            />
            <Text style={[styles.tabLabel, { color: activeTab === "home" ? "black" : "#8E8E93" }]}>Home</Text>
          </Pressable>

          <Pressable 
            style={styles.tabItem} 
            onPress={() => setActiveTab("exercises")}
          >
            <MaterialIcons 
              name="fitness-center" 
              size={28} 
              color={activeTab === "exercises" ? "black" : "#8E8E93"} 
            />
            <Text style={[styles.tabLabel, { color: activeTab === "exercises" ? "black" : "#8E8E93" }]}>Exercises</Text>
          </Pressable>

          <Pressable 
            style={styles.tabItem} 
            onPress={() => setActiveTab("settings")}
          >
            <MaterialIcons 
              name="settings" 
              size={28} 
              color={activeTab === "settings" ? "black" : "#8E8E93"} 
            />
            <Text style={[styles.tabLabel, { color: activeTab === "settings" ? "black" : "#8E8E93" }]}>Settings</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  screenContainer: {
    flex: 1,
  },
  shelf: {
    backgroundColor: "white",
    borderTopWidth: 2,
    borderTopColor: "black",
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  startButton: {
    backgroundColor: "black",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "black",
  },
  startButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: 60,
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "800",
    marginTop: 4,
    textTransform: "uppercase",
  },
});
