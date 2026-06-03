import { StyleSheet, Text, View } from "react-native";
import type { WorkoutRoutine } from "../types/workoutRoutine";

export interface RoutineCardProps {
  routine: WorkoutRoutine;
  completedCount: number;
}

const pluralize = (count: number, singular: string, plural = `${singular}s`) =>
  `${count} ${count === 1 ? singular : plural}`;

const formatCompletedCount = (count: number) =>
  count === 1 ? "1 time done" : `${count} times done`;

export default function RoutineCard({
  routine,
  completedCount,
}: RoutineCardProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.name} numberOfLines={1}>
        {routine.name || "Untitled Routine"}
      </Text>

      <Text style={styles.details} numberOfLines={1}>
        {pluralize(routine.exercises.length, "exercise")} ·{" "}
        {formatCompletedCount(completedCount)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#D1D1D6",
    backgroundColor: "white",
  },
  name: {
    fontWeight: "900",
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 4,
  },
  details: {
    color: "#636366",
    fontSize: 13,
    fontWeight: "700",
  },
});
