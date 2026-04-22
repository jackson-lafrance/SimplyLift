import { StyleSheet, View, Text } from "react-native";
import { Workout } from "../context/appContext";

export interface WorkoutCardProps {
  workout: Workout;
}

export default function WorkoutCard({ workout }: WorkoutCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.name}>{workout.name}</Text>
        <Text style={styles.date}>{workout.date.toLocaleDateString()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    marginBottom: 5,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "red",
    backgroundColor: "pink",
  },
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
  date: {
    opacity: 0.6,
    fontSize: 12,
  },
});
