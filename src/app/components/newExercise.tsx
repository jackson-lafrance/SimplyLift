import { StyleSheet, View, Text, TextInput } from "react-native";
import { useAppContext } from "../context/appContext";

export default function newExercise() {
  const { currentWorkout, setCurrentWorkout, exerciseList } = useAppContext();

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
          value={set.weight === 0 ? "" : set.weight.toString()}
        />
      </View>
      <TextInput
        style={styles.name}
        keyboardType="numeric"
        onChangeText={(text) => {
          handleUpdate(text, "reps");
        }}
        value={set.reps === 0 ? "" : set.reps.toString()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 15,
  },
  name: {
    fontWeight: 700,
    fontSize: 20,
  },
});
