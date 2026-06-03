import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useAppContext } from "./context/appContext";
import type { Exercise, Workout } from "./context/appContext";
import type { WorkoutRoutine, WorkoutSplit } from "./types/workoutRoutine";
import ProfileHeader from "./components/profileHeader";
import { selectionFeedback } from "./utils/feedback";
import {
  getDefaultSetGroupsForMode,
  getPersistedExerciseTrackingMode,
} from "./utils/exerciseSets";

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

const createEmptyWorkout = (): Workout => ({
  name: "New Workout",
  time: 0,
  date: new Date(),
  exercises: [],
});

const getActiveSplitDay = (split: WorkoutSplit | undefined) => {
  if (!split) return undefined;

  const dayId =
    split.currentDayId ?? split.schedule.dayIds[0] ?? split.days[0]?.id;
  return split.days.find((day) => day.id === dayId) ?? split.days[0];
};

export default function Tabs() {
  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const [isStartMenuVisible, setIsStartMenuVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const {
    startWorkout: startWorkoutFromContext,
    setCurrentWorkout,
    exerciseList,
    history,
    workoutRoutines,
    workoutSplits,
    routinesAndSplitsEnabled,
  } = useAppContext();

  useEffect(() => {
    if (routinesAndSplitsEnabled) return;

    setIsStartMenuVisible(false);
    setActiveTab((currentTab) =>
      currentTab === "routines" ? "home" : currentTab,
    );
  }, [routinesAndSplitsEnabled]);

  const activeSplit = useMemo(
    () =>
      routinesAndSplitsEnabled
        ? workoutSplits.find((split) => split.isActive)
        : undefined,
    [routinesAndSplitsEnabled, workoutSplits],
  );

  const activeSplitDay = useMemo(
    () => getActiveSplitDay(activeSplit),
    [activeSplit],
  );

  const activeSplitRoutine = useMemo(() => {
    if (activeSplitDay?.type !== "routine") return undefined;
    return workoutRoutines.find(
      (routine) => routine.id === activeSplitDay.routineId,
    );
  }, [activeSplitDay, workoutRoutines]);

  const findSavedExercise = (name: string) =>
    exerciseList.find((exercise) =>
      exercise.name.toLowerCase() === name.toLowerCase(),
    );

  const findMostRecentExercise = (name: string): Exercise | null => {
    const sortedHistory = [...history].sort(
      (left, right) => right.date.getTime() - left.date.getTime(),
    );

    for (const workout of sortedHistory) {
      const exercise = workout.exercises.find(
        (item) => item.name.toLowerCase() === name.toLowerCase(),
      );
      if (exercise) return exercise;
    }

    return null;
  };

  const buildWorkoutFromRoutine = (
    routine: WorkoutRoutine,
    split?: { splitId?: string; splitDayId?: string },
  ): Workout => ({
    name: routine.name || "New Workout",
    time: 0,
    date: new Date(),
    routineId: routine.id,
    splitId: split?.splitId,
    splitDayId: split?.splitDayId,
    exercises: routine.exercises.map((template) => {
      const savedExercise = findSavedExercise(template.name);
      const mostRecentExercise = findMostRecentExercise(template.name);
      const trackingMode =
        getPersistedExerciseTrackingMode(template) ??
        getPersistedExerciseTrackingMode(savedExercise) ??
        getPersistedExerciseTrackingMode(mostRecentExercise) ??
        "standard";

      return {
        name: template.name,
        trackingMode,
        setGroups: getDefaultSetGroupsForMode(mostRecentExercise, trackingMode),
      };
    }),
  });

  const startWorkout = (workout: Workout) => {
    setIsStartMenuVisible(false);
    setCurrentWorkout(workout);
  };

  const startDefaultWorkout = () => {
    if (!routinesAndSplitsEnabled) {
      startWorkout(createEmptyWorkout());
      return;
    }

    if (activeSplit?.id && activeSplitDay?.id) {
      if (activeSplitRoutine) {
        startWorkout(
          buildWorkoutFromRoutine(activeSplitRoutine, {
            splitId: activeSplit.id,
            splitDayId: activeSplitDay.id,
          }),
        );
        return;
      }

      startWorkout({
        ...createEmptyWorkout(),
        splitId: activeSplit.id,
        splitDayId: activeSplitDay.id,
      });
      return;
    }

    setIsStartMenuVisible(false);
    startWorkoutFromContext();
  };

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

  const startButtonLabel =
    routinesAndSplitsEnabled && activeSplitRoutine
      ? `Start ${activeSplitRoutine.name}`
      : "Start Workout";

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ProfileHeader title={TAB_TITLES[activeTab]} />
      <View style={styles.screenContainer}>{renderScreen()}</View>

      <View style={[styles.shelf, { paddingBottom: insets.bottom + 10 }]}>
        <View style={styles.startButtonRow}>
          <Pressable
            style={({ pressed }) => [
              styles.startButton,
              pressed && styles.startButtonPressed,
            ]}
            onPress={startDefaultWorkout}
          >
            <Text style={styles.startButtonText} numberOfLines={1}>
              {startButtonLabel}
            </Text>
          </Pressable>
          {routinesAndSplitsEnabled && (
            <Pressable
              style={styles.startMenuButton}
              onPress={() => setIsStartMenuVisible(true)}
            >
              <MaterialIcons name="keyboard-arrow-up" size={28} color="white" />
            </Pressable>
          )}
        </View>

        <View style={styles.tabBar}>
          <Pressable
            style={({ pressed }) => [
              styles.tabItem,
              pressed && styles.tabItemPressed,
            ]}
            onPress={() => {
              selectionFeedback();
              setActiveTab("home");
            }}
          >
            <MaterialIcons
              name="home"
              size={28}
              color={activeTab === "home" ? "black" : "#8E8E93"}
            />
            <Text
              style={[
                styles.tabLabel,
                { color: activeTab === "home" ? "black" : "#8E8E93" },
              ]}
            >
              Home
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.tabItem,
              pressed && styles.tabItemPressed,
            ]}
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
            <Text
              style={[
                styles.tabLabel,
                { color: activeTab === "exercises" ? "black" : "#8E8E93" },
              ]}
            >
              Exercises
            </Text>
          </Pressable>

          {routinesAndSplitsEnabled && (
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
          )}

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

      <Modal
        visible={routinesAndSplitsEnabled && isStartMenuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsStartMenuVisible(false)}
      >
        <Pressable
          style={styles.startMenuOverlay}
          onPress={() => setIsStartMenuVisible(false)}
        >
          <Pressable
            style={styles.startMenuCard}
            onPress={(event) => event.stopPropagation()}
          >
            <Text style={styles.startMenuTitle}>Start From</Text>

            <ScrollView style={styles.startMenuList}>
              <Pressable
                style={styles.startMenuItem}
                onPress={() => startWorkout(createEmptyWorkout())}
              >
                <Text style={styles.startMenuItemTitle}>Empty Workout</Text>
              </Pressable>

              {workoutRoutines.map((routine) => (
                <Pressable
                  key={routine.id ?? routine.name}
                  style={styles.startMenuItem}
                  onPress={() => startWorkout(buildWorkoutFromRoutine(routine))}
                >
                  <Text style={styles.startMenuItemTitle}>{routine.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
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
  startButtonRow: {
    flexDirection: "row",
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "black",
    overflow: "hidden",
    backgroundColor: "black",
  },
  startButton: {
    flex: 1,
    backgroundColor: "black",
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  startMenuButton: {
    width: 56,
    alignItems: "center",
    justifyContent: "center",
    borderLeftWidth: 2,
    borderLeftColor: "white",
    backgroundColor: "black",
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
  startMenuOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },
  startMenuCard: {
    margin: 16,
    padding: 16,
    maxHeight: "60%",
    borderWidth: 2,
    borderColor: "black",
    borderRadius: 12,
    backgroundColor: "white",
  },
  startMenuTitle: {
    marginBottom: 12,
    color: "black",
    fontSize: 16,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  startMenuList: {
    maxHeight: 360,
  },
  startMenuItem: {
    padding: 14,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "black",
    borderRadius: 8,
    backgroundColor: "white",
  },
  startMenuItemTitle: {
    color: "black",
    fontSize: 15,
    fontWeight: "900",
  },
});
