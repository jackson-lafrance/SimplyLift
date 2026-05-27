import { MaterialIcons } from "@expo/vector-icons";
import { StyleSheet, View, Text, Pressable } from "react-native";
import { Exercise, useAppContext } from "../context/appContext";
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
          if (ex.name === exercise.name) {
            const lastSet = ex.sets && ex.sets.length > 0
              ? ex.sets[ex.sets.length - 1]
              : { weight: 0, reps: 0 };

            return {
              ...ex,
              sets: [...(ex.sets || []), { ...lastSet }],
            };
          }
          return ex;
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
          <Text style={styles.name} numberOfLines={2}>{exercise.name}</Text>
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

          {exercise.sets?.map((item, index) => (
            <SetCard
              key={index}
              setNumber={index + 1}
              set={item}
              exerciseName={exercise.name}
            />
          ))}

          <Pressable style={styles.addSetButton} onPress={handleAddSet}>
            <MaterialIcons name="add" size={18} color="black" />
            <Text style={styles.addSetText}>ADD SET</Text>
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
  name: {
    fontWeight: "900",
    fontSize: 18,
    lineHeight: 20,
    flex: 1,
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
