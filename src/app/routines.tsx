import { MaterialIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import RoutineCard from "./components/routineCard";
import { useAppContext } from "./context/appContext";
import type {
  WorkoutRoutineDayType,
  WorkoutRoutineDraft,
  WorkoutRoutineScheduleType,
  WorkoutRoutineWeekday,
} from "./types/workoutRoutine";

const WEEKDAYS: { value: WorkoutRoutineWeekday; label: string }[] = [
  { value: "sunday", label: "Sun" },
  { value: "monday", label: "Mon" },
  { value: "tuesday", label: "Tue" },
  { value: "wednesday", label: "Wed" },
  { value: "thursday", label: "Thu" },
  { value: "friday", label: "Fri" },
  { value: "saturday", label: "Sat" },
];

interface RoutineExerciseDraft {
  id: string;
  name: string;
}

interface RoutineDayDraft {
  id: string;
  name: string;
  type: WorkoutRoutineDayType;
  exercises: RoutineExerciseDraft[];
  exerciseName: string;
  weekdays: WorkoutRoutineWeekday[];
}

const createDraftId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const createEmptyDay = (dayNumber: number): RoutineDayDraft => ({
  id: createDraftId(),
  name: `Day ${dayNumber}`,
  type: "workout",
  exercises: [],
  exerciseName: "",
  weekdays: [],
});

export default function Routines() {
  const { workoutRoutines, createWorkoutRoutine } = useAppContext();
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [routineName, setRoutineName] = useState("");
  const [routineDescription, setRoutineDescription] = useState("");
  const [scheduleType, setScheduleType] =
    useState<WorkoutRoutineScheduleType>("splitOrder");
  const [days, setDays] = useState<RoutineDayDraft[]>([createEmptyDay(1)]);
  const [expandedDayIds, setExpandedDayIds] = useState<string[]>([
    days[0].id,
  ]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const sortedWorkoutRoutines = useMemo(
    () =>
      [...workoutRoutines].sort(
        (left, right) =>
          (right.updatedAt?.getTime() ?? 0) - (left.updatedAt?.getTime() ?? 0),
      ),
    [workoutRoutines],
  );

  const resetCreateForm = () => {
    const firstDay = createEmptyDay(1);
    setRoutineName("");
    setRoutineDescription("");
    setScheduleType("splitOrder");
    setDays([firstDay]);
    setExpandedDayIds([firstDay.id]);
    setErrorMessage(null);
    setIsSaving(false);
  };

  const openCreateModal = () => {
    resetCreateForm();
    setIsCreateModalVisible(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalVisible(false);
    resetCreateForm();
  };

  const updateDay = (
    dayId: string,
    updater: (day: RoutineDayDraft) => RoutineDayDraft,
  ) => {
    setDays((currentDays) =>
      currentDays.map((day) => (day.id === dayId ? updater(day) : day)),
    );
  };

  const toggleDayExpanded = (dayId: string) => {
    setExpandedDayIds((currentIds) =>
      currentIds.includes(dayId)
        ? currentIds.filter((id) => id !== dayId)
        : [...currentIds, dayId],
    );
  };

  const addDay = () => {
    const nextDay = createEmptyDay(days.length + 1);
    setDays((currentDays) => [...currentDays, nextDay]);
    setExpandedDayIds((currentIds) => [...currentIds, nextDay.id]);
  };

  const removeDay = (dayId: string) => {
    setDays((currentDays) =>
      currentDays.length === 1
        ? currentDays
        : currentDays.filter((day) => day.id !== dayId),
    );
    setExpandedDayIds((currentIds) =>
      currentIds.filter((id) => id !== dayId),
    );
  };

  const toggleDayType = (dayId: string) => {
    setDays((currentDays) =>
      currentDays.map((day, index) => {
        if (day.id !== dayId) return day;

        const nextType = day.type === "workout" ? "rest" : "workout";

        return {
          ...day,
          name:
            nextType === "rest"
              ? "Rest"
              : day.name.trim().toLowerCase() === "rest"
                ? `Day ${index + 1}`
                : day.name,
          type: nextType,
          exercises: nextType === "rest" ? [] : day.exercises,
          exerciseName: "",
        };
      }),
    );
  };

  const toggleWeekday = (
    dayId: string,
    weekday: WorkoutRoutineWeekday,
  ) => {
    setDays((currentDays) => {
      const currentDay = currentDays.find((day) => day.id === dayId);
      const isSelectedOnCurrentDay =
        currentDay?.weekdays.includes(weekday) ?? false;

      return currentDays.map((day) => {
        if (day.id === dayId) {
          return {
            ...day,
            weekdays: isSelectedOnCurrentDay
              ? day.weekdays.filter((item) => item !== weekday)
              : [...day.weekdays, weekday],
          };
        }

        if (!isSelectedOnCurrentDay) {
          return {
            ...day,
            weekdays: day.weekdays.filter((item) => item !== weekday),
          };
        }

        return day;
      });
    });
  };

  const addExerciseToDay = (dayId: string) => {
    updateDay(dayId, (day) => {
      const exerciseName = day.exerciseName.trim();

      if (!exerciseName) return day;

      const alreadyAdded = day.exercises.some(
        (exercise) => exercise.name.toLowerCase() === exerciseName.toLowerCase(),
      );

      if (alreadyAdded) {
        setErrorMessage(`${exerciseName} is already on ${day.name}.`);
        return day;
      }

      setErrorMessage(null);

      return {
        ...day,
        exerciseName: "",
        exercises: [
          ...day.exercises,
          {
            id: createDraftId(),
            name: exerciseName,
          },
        ],
      };
    });
  };

  const removeExerciseFromDay = (dayId: string, exerciseId: string) => {
    updateDay(dayId, (day) => ({
      ...day,
      exercises: day.exercises.filter((exercise) => exercise.id !== exerciseId),
    }));
  };

  const buildRoutineDraft = (): WorkoutRoutineDraft | null => {
    const trimmedName = routineName.trim();
    const trimmedDescription = routineDescription.trim();
    const normalizedDays = days.map((day, index) => {
      const savedExercises = day.exercises.filter((exercise) =>
        exercise.name.trim(),
      );
      const pendingExerciseName = day.exerciseName.trim();
      const shouldIncludePendingExercise =
        day.type === "workout" &&
        pendingExerciseName &&
        !savedExercises.some(
          (exercise) =>
            exercise.name.trim().toLowerCase() ===
            pendingExerciseName.toLowerCase(),
        );

      return {
        ...day,
        name: day.type === "rest" ? "Rest" : day.name.trim() || `Day ${index + 1}`,
        exercises: shouldIncludePendingExercise
          ? [
              ...savedExercises,
              {
                id: createDraftId(),
                name: pendingExerciseName,
              },
            ]
          : savedExercises,
      };
    });
    const workoutDays = normalizedDays.filter((day) => day.type === "workout");
    const exerciseCount = workoutDays.reduce(
      (total, day) => total + day.exercises.length,
      0,
    );

    if (!trimmedName) {
      setErrorMessage("Add a routine name before saving.");
      return null;
    }

    if (!workoutDays.length) {
      setErrorMessage("Add at least one workout day before saving.");
      return null;
    }

    if (!exerciseCount) {
      setErrorMessage("Add at least one exercise before saving.");
      return null;
    }

    if (
      scheduleType === "daysOfWeek" &&
      normalizedDays.every((day) => !day.weekdays.length)
    ) {
      setErrorMessage("Choose at least one weekday before saving.");
      return null;
    }

    const routineDays = normalizedDays.map((day) => ({
      id: day.id,
      name: day.name,
      type: day.type,
      exercises:
        day.type === "workout"
          ? day.exercises.map((exercise) => ({
              id: exercise.id,
              name: exercise.name.trim(),
              targetSets: [],
            }))
          : [],
    }));

    return {
      name: trimmedName,
      description: trimmedDescription || undefined,
      isActive: true,
      days: routineDays,
      schedule:
        scheduleType === "splitOrder"
          ? {
              type: "splitOrder",
              splitDayIds: routineDays.map((day) => day.id),
            }
          : {
              type: "daysOfWeek",
              assignments: normalizedDays.flatMap((day) =>
                day.weekdays.map((weekday) => ({
                  weekday,
                  dayId: day.id,
                })),
              ),
            },
    };
  };

  const saveRoutine = async () => {
    const routineDraft = buildRoutineDraft();

    if (!routineDraft) return;

    setIsSaving(true);

    try {
      const routineId = await createWorkoutRoutine(routineDraft);

      if (routineId) {
        closeCreateModal();
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={sortedWorkoutRoutines}
        renderItem={({ item }) => <RoutineCard routine={item} />}
        keyExtractor={(item, index) => item.id ?? `${item.name}-${index}`}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="bookmarks" size={32} color="#8E8E93" />
            <Text style={styles.emptyTitle}>No routines yet</Text>
          </View>
        }
      />

      <Pressable
        style={({ pressed }) => [
          styles.addRoutineButton,
          pressed && styles.addRoutineButtonPressed,
        ]}
        onPress={openCreateModal}
      >
        <MaterialIcons name="add" size={30} color="white" />
      </Pressable>

      <Modal
        visible={isCreateModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeCreateModal}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.keyboardAvoidingView}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleContainer}>
                  <Text style={styles.modalTitle}>Create Routine</Text>
                  <Text style={styles.modalSubtitle}>
                    Add days and exercises. Sets will autofill when you start a workout.
                  </Text>
                </View>
                <Pressable onPress={closeCreateModal} style={styles.closeButton}>
                  <MaterialIcons name="close" size={28} color="black" />
                </Pressable>
              </View>

              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.formContent}
              >
                <Text style={styles.label}>Routine Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Upper Lower Rest"
                  placeholderTextColor="#C6C6C6"
                  value={routineName}
                  onChangeText={(text) => {
                    setErrorMessage(null);
                    setRoutineName(text);
                  }}
                  maxLength={40}
                />

                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.descriptionInput]}
                  placeholder="Optional notes"
                  placeholderTextColor="#C6C6C6"
                  value={routineDescription}
                  onChangeText={setRoutineDescription}
                  maxLength={80}
                />

                <Text style={styles.label}>Schedule</Text>
                <View style={styles.scheduleToggleRow}>
                  <Pressable
                    style={[
                      styles.scheduleToggle,
                      scheduleType === "splitOrder" && styles.scheduleToggleActive,
                    ]}
                    onPress={() => setScheduleType("splitOrder")}
                  >
                    <MaterialIcons name="repeat" size={16} color="black" />
                    <Text style={styles.scheduleToggleText}>Split Order</Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.scheduleToggle,
                      scheduleType === "daysOfWeek" &&
                        styles.scheduleToggleActive,
                    ]}
                    onPress={() => setScheduleType("daysOfWeek")}
                  >
                    <MaterialIcons name="event" size={16} color="black" />
                    <Text style={styles.scheduleToggleText}>Weekdays</Text>
                  </Pressable>
                </View>

                <View style={styles.daysHeader}>
                  <Text style={styles.sectionTitle}>Routine Days</Text>
                  <Pressable style={styles.smallAddButton} onPress={addDay}>
                    <MaterialIcons name="add" size={18} color="black" />
                    <Text style={styles.smallAddButtonText}>Add Day</Text>
                  </Pressable>
                </View>

                {days.map((day, index) => {
                  const isExpanded = expandedDayIds.includes(day.id);

                  return (
                    <View key={day.id} style={styles.dayCard}>
                      <View style={styles.dayHeader}>
                        <Pressable
                          style={styles.dayDropdownButton}
                          onPress={() => toggleDayExpanded(day.id)}
                        >
                          <MaterialIcons
                            name={
                              isExpanded
                                ? "keyboard-arrow-up"
                                : "keyboard-arrow-down"
                            }
                            size={26}
                            color="black"
                          />
                        </Pressable>

                        <View style={styles.dayTitleContainer}>
                          <Text style={styles.dayNumber}>Day {index + 1}</Text>
                          <TextInput
                            style={[
                              styles.dayNameInput,
                              day.type === "rest" && styles.restDayNameInput,
                            ]}
                            value={day.type === "rest" ? "Rest" : day.name}
                            editable={day.type === "workout"}
                            onChangeText={(text) =>
                              updateDay(day.id, (currentDay) => ({
                                ...currentDay,
                                name: text,
                              }))
                            }
                            placeholder="Day name"
                            placeholderTextColor="#C6C6C6"
                            maxLength={30}
                          />
                        </View>

                        <Pressable
                          style={[
                            styles.dayTypeBadge,
                            day.type === "rest" && styles.restDayBadge,
                          ]}
                          onPress={() => toggleDayType(day.id)}
                        >
                          <Text
                            style={[
                              styles.dayTypeBadgeText,
                              day.type === "rest" && styles.restDayBadgeText,
                            ]}
                          >
                            {day.type === "workout" ? "Workout" : "Rest"}
                          </Text>
                        </Pressable>

                        {days.length > 1 && (
                          <Pressable
                            style={styles.removeDayButton}
                            onPress={() => removeDay(day.id)}
                          >
                            <MaterialIcons
                              name="delete-outline"
                              size={22}
                              color="black"
                            />
                          </Pressable>
                        )}
                      </View>

                      {isExpanded && (
                        <View style={styles.dayBody}>
                          {scheduleType === "daysOfWeek" && (
                            <View style={styles.weekdaySection}>
                              <Text style={styles.inlineLabel}>Weekdays</Text>
                              <View style={styles.weekdayRow}>
                                {WEEKDAYS.map((weekday) => {
                                  const selected = day.weekdays.includes(
                                    weekday.value,
                                  );

                                  return (
                                    <Pressable
                                      key={weekday.value}
                                      style={[
                                        styles.weekdayChip,
                                        selected && styles.weekdayChipSelected,
                                      ]}
                                      onPress={() =>
                                        toggleWeekday(day.id, weekday.value)
                                      }
                                    >
                                      <Text
                                        style={[
                                          styles.weekdayChipText,
                                          selected &&
                                            styles.weekdayChipTextSelected,
                                        ]}
                                      >
                                        {weekday.label}
                                      </Text>
                                    </Pressable>
                                  );
                                })}
                              </View>
                            </View>
                          )}

                          {day.type === "rest" ? (
                            <View style={styles.restDayMessage}>
                              <MaterialIcons name="hotel" size={18} color="#8E8E93" />
                              <Text style={styles.restDayMessageText}>
                                Rest days do not need exercises.
                              </Text>
                            </View>
                          ) : (
                            <View>
                              <Text style={styles.inlineLabel}>Exercises</Text>

                              {day.exercises.map((exercise) => (
                                <View key={exercise.id} style={styles.exerciseRow}>
                                  <View style={styles.exerciseNameContainer}>
                                    <Text style={styles.exerciseName}>
                                      {exercise.name}
                                    </Text>
                                  </View>
                                  <Pressable
                                    onPress={() =>
                                      removeExerciseFromDay(day.id, exercise.id)
                                    }
                                  >
                                    <MaterialIcons
                                      name="close"
                                      size={18}
                                      color="#8E8E93"
                                    />
                                  </Pressable>
                                </View>
                              ))}

                              <View style={styles.addExerciseRow}>
                                <TextInput
                                  style={styles.exerciseInput}
                                  placeholder="Add exercise"
                                  placeholderTextColor="#C6C6C6"
                                  value={day.exerciseName}
                                  onChangeText={(text) =>
                                    updateDay(day.id, (currentDay) => ({
                                      ...currentDay,
                                      exerciseName: text,
                                    }))
                                  }
                                  onSubmitEditing={() => addExerciseToDay(day.id)}
                                  returnKeyType="done"
                                />
                                <Pressable
                                  style={styles.addExerciseButton}
                                  onPress={() => addExerciseToDay(day.id)}
                                >
                                  <MaterialIcons name="add" size={22} color="white" />
                                </Pressable>
                              </View>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })}

                {errorMessage && (
                  <Text style={styles.errorText}>{errorMessage}</Text>
                )}
              </ScrollView>

              <View style={styles.modalActions}>
                <Pressable
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={closeCreateModal}
                  disabled={isSaving}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.actionButton,
                    styles.saveButton,
                    pressed && styles.saveButtonPressed,
                    isSaving && styles.saveButtonDisabled,
                  ]}
                  onPress={saveRoutine}
                  disabled={isSaving}
                >
                  <Text style={styles.saveButtonText}>
                    {isSaving ? "Saving..." : "Save Routine"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    borderWidth: 2,
    borderColor: "black",
    borderRadius: 8,
    borderStyle: "dashed",
    backgroundColor: "white",
  },
  emptyTitle: {
    marginTop: 12,
    color: "black",
    fontSize: 16,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  addRoutineButton: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "black",
    backgroundColor: "black",
    alignItems: "center",
    justifyContent: "center",
  },
  addRoutineButtonPressed: {
    backgroundColor: "#34C759",
    borderColor: "#34C759",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    padding: 16,
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: "center",
  },
  modalContent: {
    maxHeight: "92%",
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "black",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    padding: 20,
    borderBottomWidth: 2,
    borderBottomColor: "black",
  },
  modalTitleContainer: {
    flex: 1,
  },
  modalTitle: {
    color: "black",
    fontSize: 22,
    fontWeight: "900",
  },
  modalSubtitle: {
    marginTop: 4,
    color: "#8E8E93",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  formContent: {
    padding: 20,
    paddingBottom: 28,
  },
  label: {
    marginBottom: 6,
    color: "#8E8E93",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  input: {
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "black",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "black",
    fontSize: 16,
    fontWeight: "800",
    backgroundColor: "white",
  },
  descriptionInput: {
    fontSize: 14,
    fontWeight: "700",
  },
  scheduleToggleRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  scheduleToggle: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: "black",
    borderRadius: 8,
    backgroundColor: "white",
  },
  scheduleToggleActive: {
    backgroundColor: "#F2F2F7",
  },
  scheduleToggleText: {
    color: "black",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  daysHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 10,
  },
  sectionTitle: {
    color: "black",
    fontSize: 16,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  smallAddButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: "black",
    borderRadius: 8,
    backgroundColor: "white",
  },
  smallAddButtonText: {
    color: "black",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  dayCard: {
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "black",
    borderRadius: 8,
    backgroundColor: "white",
    overflow: "hidden",
  },
  dayHeader: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
  },
  dayDropdownButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  dayTitleContainer: {
    flex: 1,
  },
  dayNumber: {
    color: "#8E8E93",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  dayNameInput: {
    color: "black",
    fontSize: 16,
    fontWeight: "900",
    padding: 0,
  },
  restDayNameInput: {
    color: "#8E8E93",
  },
  dayTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "#34C759",
    borderRadius: 999,
    backgroundColor: "#EAF8EE",
  },
  restDayBadge: {
    borderColor: "#8E8E93",
    backgroundColor: "#F2F2F7",
  },
  dayTypeBadgeText: {
    color: "#1F8F3A",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  restDayBadgeText: {
    color: "#8E8E93",
  },
  removeDayButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  dayBody: {
    padding: 12,
    borderTopWidth: 2,
    borderTopColor: "black",
    backgroundColor: "#F8F8FA",
  },
  weekdaySection: {
    marginBottom: 14,
  },
  inlineLabel: {
    marginBottom: 8,
    color: "#8E8E93",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  weekdayRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  weekdayChip: {
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderWidth: 2,
    borderColor: "black",
    borderRadius: 999,
    backgroundColor: "white",
  },
  weekdayChipSelected: {
    backgroundColor: "black",
  },
  weekdayChipText: {
    color: "black",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  weekdayChipTextSelected: {
    color: "white",
  },
  restDayMessage: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "white",
  },
  restDayMessageText: {
    color: "#8E8E93",
    fontSize: 12,
    fontWeight: "800",
  },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: "white",
  },
  exerciseNameContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  exerciseName: {
    color: "black",
    fontSize: 13,
    fontWeight: "900",
  },
  addExerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  exerciseInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: "black",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "black",
    fontSize: 14,
    fontWeight: "800",
    backgroundColor: "white",
  },
  addExerciseButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "black",
    backgroundColor: "black",
  },
  errorText: {
    marginTop: 4,
    color: "#FF3B30",
    fontSize: 12,
    fontWeight: "800",
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    padding: 16,
    borderTopWidth: 2,
    borderTopColor: "black",
    backgroundColor: "white",
  },
  actionButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 2,
  },
  cancelButton: {
    borderColor: "black",
    backgroundColor: "white",
  },
  cancelButtonText: {
    color: "black",
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  saveButton: {
    borderColor: "black",
    backgroundColor: "black",
  },
  saveButtonPressed: {
    borderColor: "#34C759",
    backgroundColor: "#34C759",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "white",
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
  },
});
