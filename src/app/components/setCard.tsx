import { StyleSheet, View, Text, TextInput, Pressable } from "react-native";
import { WorkoutSet, useAppContext } from "../context/appContext";
import { useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";

export interface setProps {
  set: WorkoutSet;
  setNumber: number;
  exerciseName: string;
}

export default function SetCard({ set, setNumber, exerciseName }: setProps) {
  const { currentWorkout, setCurrentWorkout } = useAppContext();

  const [weightText, setWeightText] = useState(set?.weight.toString() || "0");
  const [repText, setRepText] = useState(set?.reps.toString() || "0");

  const handleUpdate = (value: string, field: "weight" | "reps") => {
    if (field === "weight") setWeightText(value);
    if (field === "reps") setRepText(value);

    if (!currentWorkout) return;

    const numValue = parseFloat(value) || 0;

    setCurrentWorkout({
      ...currentWorkout,
      exercises: currentWorkout.exercises.map((ex) => {
        if (ex.name !== exerciseName) return ex;

        return {
          ...ex,
          sets: ex.sets?.map((se, index) => {
            if (index !== setNumber - 1) return se;

            return { ...se, [field]: numValue };
          }),
        };
      }),
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.numberCol}>
        <Text style={styles.setNumber}>{setNumber}</Text>
      </View>
      
      <View style={styles.inputCol}>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          onChangeText={(text) => handleUpdate(text, "weight")}
          value={weightText}
          placeholder="0"
          placeholderTextColor="#C7C7CC"
        />
      </View>

      <View style={styles.inputCol}>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          onChangeText={(text) => handleUpdate(text, "reps")}
          value={repText}
          placeholder="0"
          placeholderTextColor="#C7C7CC"
        />
      </View>

      <Pressable
        style={styles.removeButton}
        onPress={() =>
          setCurrentWorkout((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              exercises: prev.exercises.map((exe) => {
                if (exe.name === exerciseName) {
                  return {
                    ...exe,
                    sets: exe.sets?.filter((_, index) => index !== setNumber - 1),
                  };
                }
                return exe;
              }),
            };
          })
        }
      >
        {({ pressed }: { pressed: boolean }) => (
          <MaterialIcons 
            name="close" 
            size={16} 
            color={pressed ? "#FF3B30" : "#8E8E93"} 
          />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    gap: 8,
  },
  numberCol: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  setNumber: {
    fontSize: 14,
    fontWeight: "800",
    color: "black",
  },
  inputCol: {
    flex: 1,
  },
  input: {
    backgroundColor: "#F2F2F7",
    paddingVertical: 10,
    borderRadius: 6,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    color: "black",
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  removeButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});
