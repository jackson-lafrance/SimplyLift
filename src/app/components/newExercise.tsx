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
import { useAppContext, Set } from "../context/appContext";
import { useState, useMemo, useRef, useEffect } from "react";

const { height } = Dimensions.get("window");

interface NewExerciseParams {
  close: () => void;
}

export default function NewExercise({ close }: NewExerciseParams) {
  const { setCurrentWorkout, currentWorkout, exerciseList, history, showAlert } =
    useAppContext();

  const [exerciseName, setExerciseName] = useState<string>("");
  const [defaultSet, setDefaultSet] = useState<Set[]>([{ reps: 0, weight: 0 }]);

  const slideAnim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 60,
      friction: 12,
    }).start();
  }, []);

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

  const findMostRecentSets = (name: string) => {
    const sortedHistory = [...history].sort(
      (a, b) => b.date.getTime() - a.date.getTime(),
    );

    for (const workout of sortedHistory) {
      const exercise = workout.exercises.find(
        (e) => e.name.toLowerCase() === name.toLowerCase(),
      );
      if (exercise && exercise.sets && exercise.sets.length > 0) {
        return exercise.sets;
      }
    }
    return [{ reps: 0, weight: 0 }];
  };

  const handleSelectExercise = (name: string) => {
    setExerciseName(name);
    const recentSet = findMostRecentSets(name);
    setDefaultSet(recentSet);
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
            onChangeText={(text) => {
              setExerciseName(text);
              const exactMatch = exerciseList.find(
                (e) => e.name.toLowerCase() === text.toLowerCase(),
              );
              if (exactMatch) setDefaultSet(findMostRecentSets(exactMatch.name));
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
                if (!exerciseName.trim()) return;

                const exists = currentWorkout?.exercises.some(
                  (e) => e.name.toLowerCase() === exerciseName.toLowerCase(),
                );

                if (exists) {
                  showAlert("Exercise Already Added", "Use the add set button!");
                  return;
                }

                setCurrentWorkout((prev) =>
                  prev
                    ? {
                        ...prev,
                        exercises: [
                          ...prev.exercises,
                          { name: exerciseName, sets: defaultSet },
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
    textTransform: "uppercase",
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
