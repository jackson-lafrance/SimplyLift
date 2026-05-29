import {
  StyleSheet,
  View,
  Text,
  Pressable,
  TextInput,
  Modal,
  Animated,
  Dimensions,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useAppContext } from "../context/appContext";
import type { Exercise, Set } from "../context/appContext";
import { useState, useMemo, useRef, useEffect } from "react";

const { height } = Dimensions.get("window");

interface NewExerciseParams {
  close: () => void;
}

const EMPTY_SET: Set = { reps: 0, weight: 0 };

const cloneSet = (set: Set): Set => ({ ...set });

const getDefaultSetsForMode = (
  sets: Set[] | undefined,
  isUnilateral: boolean,
) => {
  const defaultSets = sets?.length ? sets.map(cloneSet) : [cloneSet(EMPTY_SET)];

  if (!isUnilateral || defaultSets.length % 2 === 0) {
    return defaultSets;
  }

  return [...defaultSets, cloneSet(defaultSets[defaultSets.length - 1])];
};

export default function NewExercise({ close }: NewExerciseParams) {
  const { setCurrentWorkout, currentWorkout, exerciseList, history } =
    useAppContext();

  const [exerciseName, setExerciseName] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUnilateral, setIsUnilateral] = useState(false);
  const [defaultSet, setDefaultSet] = useState<Set[]>([
    cloneSet(EMPTY_SET),
  ]);

  const slideAnim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 60,
      friction: 12,
    }).start();
  }, [slideAnim]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      close();
    });
  };

  const suggestions = useMemo(() => {
    if (!exerciseName.trim()) return [];
    return exerciseList
      .filter(
        (ex) =>
          ex.name.toLowerCase().includes(exerciseName.toLowerCase()) &&
          ex.name.toLowerCase() !== exerciseName.toLowerCase(),
      )
      .slice(0, 5);
  }, [exerciseName, exerciseList]);

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

  const findMostRecentSets = (name: string) => {
    const exercise = findMostRecentExercise(name);

    if (exercise?.sets && exercise.sets.length > 0) {
      return exercise.sets;
    }

    return [cloneSet(EMPTY_SET)];
  };

  const getExerciseUnilateralMode = (name: string) => {
    const savedExercise = findSavedExercise(name);

    if (typeof savedExercise?.isUnilateral === "boolean") {
      return savedExercise.isUnilateral;
    }

    return findMostRecentExercise(name)?.isUnilateral ?? false;
  };

  const applyExerciseDefaults = (name: string) => {
    const nextIsUnilateral = getExerciseUnilateralMode(name);

    setIsUnilateral(nextIsUnilateral);
    setDefaultSet(
      getDefaultSetsForMode(findMostRecentSets(name), nextIsUnilateral),
    );
  };

  const handleSelectExercise = (name: string) => {
    setErrorMessage(null);
    setExerciseName(name);
    applyExerciseDefaults(name);
  };

  const handleUnilateralChange = (nextIsUnilateral: boolean) => {
    setIsUnilateral(nextIsUnilateral);
    setDefaultSet((sets) => {
      if (!nextIsUnilateral && isUnilateral) {
        const bilateralSets = sets.filter((_, index) => index % 2 === 0);
        return bilateralSets.length ? bilateralSets : [cloneSet(EMPTY_SET)];
      }

      return getDefaultSetsForMode(sets, nextIsUnilateral);
    });
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={true}
      onRequestClose={handleClose}
    >
      <View style={styles.backgrounder}>
        <Animated.View 
          style={[
            styles.modalContent,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          <Text style={styles.label}>Exercise Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Bench Press"
            placeholderTextColor="#c6c6c6" 
            autoCapitalize="characters"
            maxLength={30}
            onChangeText={(text) => {
              setErrorMessage(null);
              setExerciseName(text);
              const exactMatch = findSavedExercise(text);
              if (exactMatch) applyExerciseDefaults(exactMatch.name);
            }}
            value={exerciseName}
          />

          {suggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              {suggestions.map((item, index) => (
                <Pressable
                  key={index}
                  style={styles.suggestionItem}
                  onPress={() => handleSelectExercise(item.name)}
                >
                  <Text style={styles.suggestionText}>{item.name}</Text>
                </Pressable>
              ))}
            </View>
          )}

          <Pressable
            style={[
              styles.unilateralOption,
              isUnilateral && styles.unilateralOptionSelected,
            ]}
            onPress={() => handleUnilateralChange(!isUnilateral)}
          >
            <View
              style={[
                styles.unilateralCheckbox,
                isUnilateral && styles.unilateralCheckboxSelected,
              ]}
            >
              {isUnilateral && (
                <MaterialIcons name="check" size={16} color="white" />
              )}
            </View>
            <View style={styles.unilateralTextContainer}>
              <Text style={styles.unilateralTitle}>Unilateral exercise</Text>
            </View>
          </Pressable>

          {errorMessage && (
            <Text style={styles.errorText}>{errorMessage}</Text>
          )}

          <View style={styles.buttonContainer}>
            <Pressable
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>

            <Pressable
              style={({ pressed }: { pressed: boolean }) => [
                styles.button, 
                styles.submitButton,
                pressed && { backgroundColor: "#34C759", borderColor: "#34C759" }
              ]}
              onPress={() => {
                const trimmedExerciseName = exerciseName.trim();

                if (!trimmedExerciseName) return;

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
                            sets: getDefaultSetsForMode(
                              defaultSet,
                              isUnilateral,
                            ),
                            isUnilateral,
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
  label: {
    fontSize: 10,
    fontWeight: "900",
    color: "#8E8E93",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  input: {
    fontSize: 18,
    fontWeight: "800",
    borderWidth: 2,
    borderColor: "black",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: "#000",
    backgroundColor: "white",
  },
  suggestionsContainer: {
    backgroundColor: "white",
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 2,
    borderColor: "black",
    overflow: "hidden",
  },
  suggestionItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },
  suggestionText: {
    fontSize: 14,
    color: "black",
    fontWeight: "800",
    textTransform: "uppercase",
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
