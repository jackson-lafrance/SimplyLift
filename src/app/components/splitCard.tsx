import { Pressable, StyleSheet, Text, View } from "react-native";
import type { WorkoutSplit } from "../types/workoutRoutine";

export interface SplitCardProps {
  split: WorkoutSplit;
  onSetActive: (split: WorkoutSplit) => void;
}

const pluralize = (count: number, singular: string, plural = `${singular}s`) =>
  `${count} ${count === 1 ? singular : plural}`;

const getScheduleLabel = (split: WorkoutSplit) =>
  `${pluralize(split.days.length, "day")} split`;

export default function SplitCard({ split, onSetActive }: SplitCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.textContent}>
        <Text style={styles.name} numberOfLines={1}>
          {split.name || "Untitled Split"}
        </Text>

        <Text style={styles.details} numberOfLines={1}>
          {split.isActive ? "Active" : "Inactive"} · {getScheduleLabel(split)}
        </Text>
      </View>

      <Pressable
        style={styles.activateButton}
        onPress={() => onSetActive(split)}
      >
        <Text style={styles.activateButtonText}>
          {split.isActive ? "Change Start" : "Start"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#D1D1D6",
    backgroundColor: "white",
  },
  textContent: {
    flex: 1,
    minWidth: 0,
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
  activateButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "black",
  },
  activateButtonText: {
    color: "white",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
});
