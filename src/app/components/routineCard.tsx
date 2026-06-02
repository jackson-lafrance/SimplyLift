import { MaterialIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import type {
  WorkoutRoutine,
  WorkoutRoutineDayTemplate,
  WorkoutRoutineWeekday,
} from "../types/workoutRoutine";

export interface RoutineCardProps {
  routine: WorkoutRoutine;
}

const WEEKDAY_LABELS: Record<WorkoutRoutineWeekday, string> = {
  sunday: "Sun",
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
};

const WEEKDAY_ORDER: WorkoutRoutineWeekday[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const getDayName = (
  daysById: Map<string, WorkoutRoutineDayTemplate>,
  dayId: string,
) => daysById.get(dayId)?.name ?? "Unknown Day";

const formatScheduleSummary = (routine: WorkoutRoutine) => {
  const daysById = new Map(routine.days.map((day) => [day.id, day]));

  if (routine.schedule.type === "splitOrder") {
    if (!routine.schedule.splitDayIds.length) return "Custom split order";

    return routine.schedule.splitDayIds
      .map((dayId) => getDayName(daysById, dayId))
      .join(" → ");
  }

  if (!routine.schedule.assignments.length) return "Specific weekdays";

  return [...routine.schedule.assignments]
    .sort(
      (left, right) =>
        WEEKDAY_ORDER.indexOf(left.weekday) - WEEKDAY_ORDER.indexOf(right.weekday),
    )
    .map(
      (assignment) =>
        `${WEEKDAY_LABELS[assignment.weekday]}: ${getDayName(daysById, assignment.dayId)}`,
    )
    .join(" · ");
};

const getScheduleLabel = (routine: WorkoutRoutine) =>
  routine.schedule.type === "splitOrder" ? "Split Order" : "Days of Week";

const pluralize = (count: number, singular: string, plural = `${singular}s`) =>
  `${count} ${count === 1 ? singular : plural}`;

export default function RoutineCard({ routine }: RoutineCardProps) {
  const workoutDayCount = routine.days.filter((day) => day.type === "workout").length;
  const restDayCount = routine.days.filter((day) => day.type === "rest").length;
  const exerciseCount = routine.days.reduce(
    (total, day) => total + day.exercises.length,
    0,
  );

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.titleContainer}>
          <Text style={styles.name} numberOfLines={2}>
            {routine.name || "Untitled Routine"}
          </Text>
          {!!routine.description && (
            <Text style={styles.description} numberOfLines={1}>
              {routine.description}
            </Text>
          )}
        </View>

        <View
          style={[
            styles.statusBadge,
            routine.isActive ? styles.activeBadge : styles.inactiveBadge,
          ]}
        >
          <Text
            style={[
              styles.statusText,
              routine.isActive ? styles.activeText : styles.inactiveText,
            ]}
          >
            {routine.isActive ? "Active" : "Inactive"}
          </Text>
        </View>
      </View>

      <View style={styles.scheduleRow}>
        <MaterialIcons
          name={routine.schedule.type === "splitOrder" ? "repeat" : "event"}
          size={14}
          color="black"
        />
        <Text style={styles.scheduleType}>{getScheduleLabel(routine)}</Text>
        <Text style={styles.scheduleSummary} numberOfLines={1}>
          {formatScheduleSummary(routine)}
        </Text>
      </View>

      <View style={styles.bottomRow}>
        <View style={styles.stat}>
          <MaterialIcons name="view-list" size={14} color="black" />
          <Text style={styles.statText}>{pluralize(workoutDayCount, "Day")}</Text>
        </View>

        <View style={styles.stat}>
          <MaterialIcons name="fitness-center" size={14} color="black" />
          <Text style={styles.statText}>{pluralize(exerciseCount, "Exercise")}</Text>
        </View>

        {restDayCount > 0 && (
          <View style={styles.stat}>
            <MaterialIcons name="hotel" size={14} color="black" />
            <Text style={styles.statText}>{pluralize(restDayCount, "Rest Day")}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "black",
    backgroundColor: "white",
  },
  topRow: {
    minHeight: 42,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
  },
  name: {
    fontWeight: "900",
    fontSize: 16,
    lineHeight: 18,
  },
  description: {
    marginTop: 4,
    color: "#8E8E93",
    fontSize: 12,
    fontWeight: "700",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  activeBadge: {
    borderColor: "#34C759",
    backgroundColor: "#EAF8EE",
  },
  inactiveBadge: {
    borderColor: "#8E8E93",
    backgroundColor: "#F2F2F7",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  activeText: {
    color: "#1F8F3A",
  },
  inactiveText: {
    color: "#8E8E93",
  },
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "#F2F2F7",
    marginBottom: 12,
  },
  scheduleType: {
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  scheduleSummary: {
    flex: 1,
    color: "#3C3C43",
    fontSize: 12,
    fontWeight: "700",
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
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
