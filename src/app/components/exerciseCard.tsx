import { MaterialIcons } from "@expo/vector-icons";
import { StyleSheet, View, Text, Pressable } from "react-native";
import { useAppContext } from "../context/appContext";
import type { Exercise, Set } from "../context/appContext";
import { getSetDisplayRows } from "../utils/setDisplay";
import SetCard from "./setCard";
import { useState } from "react";

export interface ExerciseCardProps {
  exercise: Exercise;
}

export default function ExerciseCard({ exercise }: ExerciseCardProps) {
  const [dropdowned, setDropdowned] = useState(false);
  const { setCurrentWorkout, showAlert } = useAppContext();

  const handleAddSet = () => {
    setCurrentWorkout((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        exercises: prev.exercises.map((ex) => {
          if (ex.name !== exercise.name) return ex;

          const sets = ex.sets ?? [];
          const fallbackSet: Set = { weight: 0, reps: 0 };

          if (ex.isUnilateral) {
            const lastPairStartIndex = Math.max(
              0,
              sets.length - (sets.length % 2 === 0 ? 2 : 1),
            );
            const lastLeftSet = sets[lastPairStartIndex] ?? fallbackSet;
            const lastRightSet = sets[lastPairStartIndex + 1] ?? lastLeftSet;

            return {
              ...ex,
              sets: [
                ...sets,
                { ...lastLeftSet },
                { ...lastRightSet },
              ],
            };
          }

          const lastSet = sets[sets.length - 1] ?? fallbackSet;

          return {
            ...ex,
            sets: [...sets, { ...lastSet }],
          };
        }),
      };
    });
  };

  const handleRemoveExercise = () => {
    showAlert(
      "Remove Exercise",
      `Remove ${exercise.name} from this workout?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            setCurrentWorkout((prev) => {
              if (!prev) return prev;

              return {
                ...prev,
                exercises: prev.exercises.filter(
                  (ex) => ex.name !== exercise.name,
                ),
              };
            });
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, dropdowned && styles.closedContainer]}>
      <View style={styles.header}>
        <Pressable
          style={styles.headerToggle}
          onPress={() => setDropdowned((prev) => !prev)}
        >
          <View style={styles.nameContainer}>
            <Text style={styles.name} numberOfLines={2}>{exercise.name}</Text>
            {exercise.isUnilateral && (
              <Text style={styles.unilateralBadge}>Unilateral</Text>
            )}
          </View>
          <MaterialIcons
            name={dropdowned ? "keyboard-arrow-down" : "keyboard-arrow-up"}
            size={24}
            color="black"
          />
        </Pressable>

        <Pressable
          style={styles.removeExerciseButton}
          onPress={handleRemoveExercise}
        >
          {({ pressed }: { pressed: boolean }) => (
            <MaterialIcons
              name="delete-outline"
              size={22}
              color={pressed ? "#FF3B30" : "black"}
            />
          )}
        </Pressable>
      </View>

      {!dropdowned && (
        <View style={styles.setsContainer}>
          <View style={styles.setsHeader}>
            <Text style={styles.setsHeaderLabel}>SET</Text>
            <Text style={styles.setsHeaderLabel}>LBS</Text>
            <Text style={styles.setsHeaderLabel}>REPS</Text>
            <View style={{ width: 32 }} />
          </View>

          {getSetDisplayRows(exercise).map(
            ({ set, setIndex, displaySetNumber, sideLabel }) => (
              <SetCard
                key={setIndex}
                set={set}
                setIndex={setIndex}
                displaySetNumber={displaySetNumber}
                sideLabel={sideLabel}
                exerciseName={exercise.name}
                isUnilateral={exercise.isUnilateral}
              />
            ),
          )}

          <Pressable style={styles.addSetButton} onPress={handleAddSet}>
            <MaterialIcons name="add" size={18} color="black" />
            <Text style={styles.addSetText}>
              {exercise.isUnilateral ? "ADD L/R SET" : "ADD SET"}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    width: "90%",
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "black",
    marginBottom: 12,
    alignSelf: "center",
  },
  closedContainer: {
    height: 76,
  },
  header: {
    height: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  headerToggle: {
    flex: 1,
    height: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  removeExerciseButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  nameContainer: {
    flex: 1,
  },
  name: {
    fontWeight: "900",
    fontSize: 18,
    lineHeight: 20,
  },
  unilateralBadge: {
    marginTop: 2,
    fontSize: 9,
    fontWeight: "900",
    color: "#5856D6",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  setsContainer: {
    marginTop: 16,
    gap: 8,
  },
  setsHeader: {
    flexDirection: "row",
    paddingHorizontal: 4,
    marginBottom: 4,
    gap: 8,
  },
  setsHeaderLabel: {
    flex: 1,
    fontSize: 10,
    fontWeight: "800",
    color: "#8E8E93",
    textAlign: "center",
    textTransform: "uppercase",
  },
  addSetButton: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "black",
    borderStyle: "dashed",
    gap: 4,
  },
  addSetText: {
    fontSize: 12,
    fontWeight: "900",
    color: "black",
    textTransform: "uppercase",
  },
});
