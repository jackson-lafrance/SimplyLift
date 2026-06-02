import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useAppContext } from "./context/appContext";
import ProfileHeader from "./components/profileHeader";
import { selectionFeedback } from "./utils/feedback";

// Screens
import Index from "./index";
import Exercises from "./exercises";
import Settings from "./settings";
import Routines from "./routines";

type TabKey = "home" | "exercises" | "settings" | "routines";

const TAB_TITLES: Record<TabKey, string> = {
  home: "SimplyLift",
  exercises: "Exercises",
  settings: "Settings",
  routines: "Routines",
};

export default function Tabs() {
  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const insets = useSafeAreaInsets();
  const { startWorkout } = useAppContext();

  const renderScreen = () => {
    switch (activeTab) {
      case "home":
        return <Index />;
      case "exercises":
        return <Exercises />;
      case "routines":
        return <Routines />;
      case "settings":
        return <Settings />;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ProfileHeader title={TAB_TITLES[activeTab]} />
      <View style={styles.screenContainer}>{renderScreen()}</View>

      <View style={[styles.shelf, { paddingBottom: insets.bottom + 10 }]}>
        <Pressable
          style={({ pressed }) => [
            styles.startButton,
            pressed && styles.startButtonPressed,
          ]}
          onPress={startWorkout}
        >
          <Text style={styles.startButtonText}>Start Workout</Text>
        </Pressable>

        <View style={styles.tabBar}>
          <Pressable
            style={({ pressed }) => [styles.tabItem, pressed && styles.tabItemPressed]}
            onPress={() => {
              selectionFeedback();
              setActiveTab("home");
            }}
          >
            <MaterialIcons 
              name={activeTab === "home" ? "home" : "home"} 
              size={28} 
              color={activeTab === "home" ? "black" : "#8E8E93"} 
            />
            <Text style={[styles.tabLabel, { color: activeTab === "home" ? "black" : "#8E8E93" }]}>Home</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.tabItem, pressed && styles.tabItemPressed]}
            onPress={() => {
              selectionFeedback();
              setActiveTab("exercises");
            }}
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
            onPress={() => {
              selectionFeedback();
              setActiveTab("routines");
            }}
          >
            <MaterialIcons
              name="bookmarks"
              size={28}
              color={activeTab === "routines" ? "black" : "#8E8E93"}
            />
            <Text
              style={[
                styles.tabLabel,
                { color: activeTab === "routines" ? "black" : "#8E8E93" },
              ]}
            >
              Routines
            </Text>
          </Pressable>

          <Pressable
            style={styles.tabItem}
            onPress={() => {
              selectionFeedback();
              setActiveTab("settings");
            }}
          >
            <MaterialIcons
              name="settings"
              size={28}
              color={activeTab === "settings" ? "black" : "#8E8E93"}
            />
            <Text
              style={[
                styles.tabLabel,
                { color: activeTab === "settings" ? "black" : "#8E8E93" },
              ]}
            >
              Settings
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
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
  startButtonPressed: {
    backgroundColor: "#34C759",
    borderColor: "#34C759",
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
  tabItemPressed: {
    backgroundColor: "#F2F2F7",
    borderRadius: 8,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "800",
    marginTop: 4,
    textTransform: "uppercase",
  },
});
