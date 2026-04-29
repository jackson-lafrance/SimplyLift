import { StyleSheet, View, Text, TextInput, Pressable } from "react-native";
import { Set, useAppContext } from "../context/appContext";
import { useState } from "react";

export interface setProps {
  set: Set;
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
    <View style={styles.header}>
      <View style={{ display: "flex", flexDirection: "row", gap: 5 }}>
        <Text style={styles.name}>{setNumber}</Text>
        <TextInput
          style={styles.name}
          keyboardType="numeric"
          onChangeText={(text) => {
            handleUpdate(text, "weight");
          }}
          value={weightText}
        />
      </View>
      <TextInput
        style={styles.name}
        keyboardType="numeric"
        onChangeText={(text) => {
          handleUpdate(text, "reps");
        }}
        value={repText}
      />
      <Pressable
        onPress={() =>
          setCurrentWorkout((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              exercises: prev.exercises.map((exe) => {
                if (exe.name === exerciseName) {
                  return {
                    ...exe,
                    sets: exe.sets
                      ? exe.sets.filter((_, index) => index !== setNumber - 1)
                      : exe.sets,
                  };
                }
                return exe;
              }),
            };
          })
        }
      >
        <Text>-</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    fontWeight: 700,
    fontSize: 20,
  },
});
