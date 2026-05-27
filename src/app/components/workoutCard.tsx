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
        <Text style={styles.name} numberOfLines={2}>
          {workout.name || "Untitled Workout"}
        </Text>
        <Text style={styles.date}>{workout.date.toLocaleDateString()}</Text>
      </View>
      
      <View style={styles.bottomRow}>
        <View style={styles.stat}>
          <MaterialIcons name="timer" size={14} color="#000" />
          <Text style={styles.statText}>{formatDuration(workout.time || 0)}</Text>
        </View>
        <View style={styles.stat}>
          <MaterialIcons name="fitness-center" size={14} color="#000" />
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
    height: 104,
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "black",
    backgroundColor: "white",
  },
  topRow: {
    height: 38,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  name: {
    fontWeight: "900",
    fontSize: 16,
    lineHeight: 18,
    flex: 1,
    marginRight: 12,
  },
  date: {
    color: "#8E8E93",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
});
