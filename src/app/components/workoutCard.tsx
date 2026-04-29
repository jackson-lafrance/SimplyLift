import { StyleSheet, View, Text } from "react-native";
import { Workout } from "../context/appContext";
import { MaterialIcons } from "@expo/vector-icons";

export interface WorkoutCardProps {
  workout: Workout;
}

export default function WorkoutCard({ workout }: WorkoutCardProps) {
  const formatDuration = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      return `${hours}h ${remainingMins}m`;
    }
    return `${mins}m`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.name} numberOfLines={1}>
          {workout.name || "Untitled Workout"}
        </Text>
        <Text style={styles.date}>{workout.date.toLocaleDateString()}</Text>
      </View>
      
      <View style={styles.bottomRow}>
        <View style={styles.stat}>
          <MaterialIcons name="timer" size={14} color="#666" />
          <Text style={styles.statText}>{formatDuration(workout.time || 0)}</Text>
        </View>
        <View style={styles.dot} />
        <View style={styles.stat}>
          <MaterialIcons name="fitness-center" size={14} color="#666" />
          <Text style={styles.statText}>
            {workout.exercises.length} Exercises
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    marginBottom: 8,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "black",
    backgroundColor: "white",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  name: {
    fontWeight: "800",
    fontSize: 16,
    flex: 1,
    marginRight: 8,
  },
  date: {
    color: "#8E8E93",
    fontSize: 12,
    fontWeight: "600",
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    color: "#666",
    fontSize: 12,
    fontWeight: "600",
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#C7C7CC",
  },
});
