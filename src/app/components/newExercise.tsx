import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Modal,
  Animated,
  Dimensions,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useAppContext } from "../context/appContext";
import type {
  Exercise,
  ExerciseSetGroup,
  ExerciseTrackingMode,
} from "../context/appContext";
import { useState, useRef, useEffect } from "react";
import ExerciseNamePicker from "./exerciseNamePicker";
import {
  impactFeedback,
  selectionFeedback,
  warningFeedback,
} from "../utils/feedback";
import {
  convertSetGroupsForTrackingMode,
  createEmptySetGroup,
  getDefaultSetGroupsForMode,
  getPersistedExerciseTrackingMode,
} from "../utils/exerciseSets";

const { height } = Dimensions.get("window");

interface NewExerciseParams {
  close: () => void;
}

export default function NewExercise({ close }: NewExerciseParams) {
  const {
    setCurrentWorkout,
    currentWorkout,
    exerciseList,
    history,
    allowUnilateralExercises,
  } = useAppContext();

  const [exerciseName, setExerciseName] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [trackingMode, setTrackingMode] =
    useState<ExerciseTrackingMode>("standard");
  const [defaultSetGroups, setDefaultSetGroups] = useState<
    ExerciseSetGroup[]
  >([createEmptySetGroup("standard")]);

  const slideAnim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 14,
    }).start();
  }, [slideAnim]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 160,
      useNativeDriver: true,
    }).start(() => {
      close();
    });
  };

  const findSavedExercise = (name: string) =>
    exerciseList.find((e) => e.name.toLowerCase() === name.toLowerCase());

  const findMostRecentExercise = (name: string): Exercise | null => {
    const sortedHistory = [...history].sort(
      (a, b) => b.date.getTime() - a.date.getTime(),
    );

    for (const workout of sortedHistory) {
      const exercise = workout.exercises.find(
        (e) => e.name.toLowerCase() === name.toLowerCase(),
      );
      if (exercise) return exercise;
    }

    return null;
  };

  const getExerciseModePreference = (name: string) => {
    const savedExercise = findSavedExercise(name);
    const mostRecentExercise = findMostRecentExercise(name);

    return (
      getPersistedExerciseTrackingMode(savedExercise) ??
      getPersistedExerciseTrackingMode(mostRecentExercise) ??
      "standard"
    );
  };

  const applyExerciseDefaults = (name: string) => {
    const nextTrackingMode = getExerciseModePreference(name);

    setTrackingMode(nextTrackingMode);
    setDefaultSetGroups(
      getDefaultSetGroupsForMode(
        findMostRecentExercise(name),
        nextTrackingMode,
      ),
    );
  };

  const handleExerciseNameChange = (name: string) => {
    setErrorMessage(null);
    setExerciseName(name);

    const exactMatch = findSavedExercise(name);
    if (exactMatch) applyExerciseDefaults(exactMatch.name);
  };

  const handleSelectExercise = (name: string) => {
    setErrorMessage(null);
    setExerciseName(name);
    applyExerciseDefaults(name);
  };

  const handleTrackingModeChange = (nextTrackingMode: ExerciseTrackingMode) => {
    setTrackingMode(nextTrackingMode);
    setDefaultSetGroups((setGroups) => {
      const convertedSetGroups = convertSetGroupsForTrackingMode(
        setGroups,
        nextTrackingMode,
      );

      return convertedSetGroups.length
        ? convertedSetGroups
        : [createEmptySetGroup(nextTrackingMode)];
    });
  };

  const getSubmittedSetGroups = (
    submittedTrackingMode: ExerciseTrackingMode,
  ) => {
    const convertedSetGroups = convertSetGroupsForTrackingMode(
      defaultSetGroups,
      submittedTrackingMode,
    );

    return convertedSetGroups.length
      ? convertedSetGroups
      : [createEmptySetGroup(submittedTrackingMode)];
  };

  const isLeftRightTracking = trackingMode === "leftRight";

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={true}
      onRequestClose={handleClose}
    >
      <View style={styles.backgrounder}>
        <Animated.View
          style={[
            styles.modalContent,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <ExerciseNamePicker
            value={exerciseName}
            onChangeText={handleExerciseNameChange}
            onSelectExercise={handleSelectExercise}
          />

          {allowUnilateralExercises && (
            <Pressable
              style={[
                styles.unilateralOption,
                isLeftRightTracking && styles.unilateralOptionSelected,
              ]}
              onPress={() => {
                selectionFeedback();
                handleTrackingModeChange(
                  isLeftRightTracking ? "standard" : "leftRight",
                );
              }}
            >
              <View
                style={[
                  styles.unilateralCheckbox,
                  isLeftRightTracking && styles.unilateralCheckboxSelected,
                ]}
              >
                {isLeftRightTracking && (
                  <MaterialIcons name="check" size={16} color="white" />
                )}
              </View>
              <View style={styles.unilateralTextContainer}>
                <Text style={styles.unilateralTitle}>
                  Track left and right separately
                </Text>
              </View>
            </Pressable>
          )}

          {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

          <View style={styles.buttonContainer}>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.cancelButton,
                pressed && styles.cancelButtonPressed,
              ]}
              onPress={handleClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>

            <Pressable
              style={({ pressed }: { pressed: boolean }) => [
                styles.button,
                styles.submitButton,
                pressed && {
                  backgroundColor: "#34C759",
                  borderColor: "#34C759",
                },
              ]}
              onPress={() => {
                const trimmedExerciseName = exerciseName.trim().toUpperCase();

                if (!trimmedExerciseName) {
                  warningFeedback();
                  setErrorMessage("Enter an exercise name first.");
                  return;
                }

                impactFeedback();

                const submittedTrackingMode = allowUnilateralExercises
                  ? trackingMode
                  : getExerciseModePreference(trimmedExerciseName);
                const submittedSetGroups = getSubmittedSetGroups(
                  submittedTrackingMode,
                );

                const exists = currentWorkout?.exercises.some(
                  (e) =>
                    e.name.trim().toLowerCase() ===
                    trimmedExerciseName.toLowerCase(),
                );

                if (exists) {
                  setErrorMessage(
                    "This exercise is already in this workout. Use the add set button on the existing exercise.",
                  );
                  return;
                }

                setCurrentWorkout((prev) =>
                  prev
                    ? {
                        ...prev,
                        exercises: [
                          ...prev.exercises,
                          {
                            name: trimmedExerciseName,
                            trackingMode: submittedTrackingMode,
                            setGroups: submittedSetGroups,
                          },
                        ],
                      }
                    : prev,
                );
                handleClose();
              }}
            >
              <Text style={styles.submitButtonText}>Add Exercise</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backgrounder: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    backgroundColor: "white",
    padding: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "black",
  },
  unilateralOption: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "black",
    backgroundColor: "white",
  },
  unilateralOptionSelected: {
    borderColor: "#5856D6",
    backgroundColor: "#F2F1FF",
  },
  unilateralCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "black",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
  },
  unilateralCheckboxSelected: {
    borderColor: "#5856D6",
    backgroundColor: "#5856D6",
  },
  unilateralTextContainer: {
    flex: 1,
  },
  unilateralTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: "black",
    textTransform: "uppercase",
  },
  errorText: {
    marginTop: 12,
    color: "#FF3B30",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 24,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 110,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "black",
  },
  cancelButton: {
    backgroundColor: "white",
  },
  cancelButtonPressed: {
    backgroundColor: "#F2F2F7",
  },
  cancelButtonText: {
    color: "black",
    fontWeight: "900",
    textTransform: "uppercase",
  },
  submitButton: {
    backgroundColor: "black",
  },
  submitButtonText: {
    color: "white",
    fontWeight: "900",
    textTransform: "uppercase",
  },
});
