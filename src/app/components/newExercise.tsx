import {
  StyleSheet,
  View,
  Text,
  Pressable,
  TextInput,
  Alert,
} from "react-native";
import { useAppContext, Set } from "../context/appContext";
import { useState, useMemo } from "react";

interface NewExerciseParams {
  close: () => void;
}

export default function NewExercise({ close }: NewExerciseParams) {
  const { setCurrentWorkout, currentWorkout, exerciseList, history } =
    useAppContext();

  const [exerciseName, setExerciseName] = useState<string>("");
  const [defaultSet, setDefaultSet] = useState<Set>({ reps: 0, weight: 0 });

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

  const findMostRecentSet = (name: string) => {
    const sortedHistory = [...history].sort(
      (a, b) => b.date.getTime() - a.date.getTime(),
    );

    for (const workout of sortedHistory) {
      const exercise = workout.exercises.find(
        (e) => e.name.toLowerCase() === name.toLowerCase(),
      );
      if (exercise && exercise.sets && exercise.sets.length > 0) {
        return { ...exercise.sets[exercise.sets.length - 1] };
      }
    }
    return { reps: 0, weight: 0 };
  };

  const handleSelectExercise = (name: string) => {
    setExerciseName(name);
    const recentSet = findMostRecentSet(name);
    setDefaultSet(recentSet);
  };

  return (
    <View style={styles.backgrounder}>
      <View style={styles.modalContent}>
        <Text style={styles.label}>Exercise Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Bench Press"
          onChangeText={(text) => {
            setExerciseName(text);
            const exactMatch = exerciseList.find(
              (e) => e.name.toLowerCase() === text.toLowerCase(),
            );
            if (exactMatch) setDefaultSet(findMostRecentSet(exactMatch.name));
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
            onPress={close}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>

          <Pressable
            style={[styles.button, styles.submitButton]}
            onPress={() => {
              if (!exerciseName.trim()) return;

              const exists = currentWorkout?.exercises.some(
                (e) => e.name.toLowerCase() === exerciseName.toLowerCase(),
              );

              if (exists) {
                Alert.alert(
                  "Exercise Already Added",
                  "You have already added this exercise to your workout. Add more sets directly to the existing card instead.",
                );
                return;
              }

              setCurrentWorkout((prev) =>
                prev
                  ? {
                      ...prev,
                      exercises: [
                        ...prev.exercises,
                        { name: exerciseName, sets: [defaultSet] },
                      ],
                    }
                  : prev,
              );
              close();
            }}
          >
            <Text style={styles.submitButtonText}>Add Exercise</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backgrounder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    zIndex: 1000,
  },
  modalContent: {
    width: "100%",
    backgroundColor: "white",
    padding: 24,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#8E8E93",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  input: {
    fontSize: 20,
    fontWeight: "600",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
    paddingVertical: 12,
    color: "#000",
  },
  suggestionsContainer: {
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    marginTop: 8,
    overflow: "hidden",
  },
  suggestionItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  suggestionText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "500",
  },
  infoBox: {
    marginTop: 20,
    padding: 12,
    backgroundColor: "#F2F2F7",
    borderRadius: 10,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    minWidth: 110,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#F2F2F7",
  },
  cancelButtonText: {
    color: "#8E8E93",
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: "#007AFF",
  },
  submitButtonText: {
    color: "white",
    fontWeight: "600",
  },
});
