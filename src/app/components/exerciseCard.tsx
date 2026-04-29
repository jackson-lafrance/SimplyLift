import { MaterialIcons } from "@expo/vector-icons";
import { StyleSheet, View, Text, FlatList, Pressable } from "react-native";
import { Exercise, useAppContext } from "../context/appContext";
import SetCard from "./setCard";
import { useState } from "react";

export interface ExerciseCardProps {
  exercise: Exercise;
}

export default function ExerciseCard({ exercise }: ExerciseCardProps) {
  const [dropdowned, setDropdowned] = useState(false);
  const { setCurrentWorkout } = useAppContext();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.name}>{exercise.name}</Text>
        <Pressable
          style={styles.toggleButton}
          onPress={() => setDropdowned((prev) => !prev)}
        >
          <MaterialIcons
            name={dropdowned ? "keyboard-arrow-down" : "keyboard-arrow-up"}
            size={28}
            color="#111"
          />
        </Pressable>
      </View>
      {!dropdowned && (
        <>
          <View style={{ width: "100%" }}>
            {exercise.sets?.map((item, index) => (
              <SetCard
                key={index}
                setNumber={index + 1}
                set={item}
                exerciseName={exercise.name}
              />
            ))}
          </View>
          <Pressable
            onPress={() => {
              setCurrentWorkout((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  exercises: prev.exercises.map((exe) => {
                    if (exe.name === exercise.name) {
                      const lastSet =
                        exe.sets && exe.sets.length > 0
                          ? exe.sets[exe.sets.length - 1]
                          : { weight: 0, reps: 0 };

                      return {
                        ...exe,
                        sets: [...(exe.sets || []), { ...lastSet }],
                      };
                    }
                    return exe
                  }),
                };
              });
            }}
          >
            <Text>Add Set</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "90%",
    padding: 10,
    borderRadius: 10,
    borderColor: "black",
    borderWidth: 2,
    alignSelf: "center",
    flex: 1,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    flexDirection: "row",
    width: "100%",
    alignItems: "center",
    marginBottom: 4,
  },
  name: {
    fontWeight: 600,
    fontSize: 20,
  },
  toggleButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "#f2f2f2",
  },
});
