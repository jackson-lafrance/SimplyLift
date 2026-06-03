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
import ExerciseNamePicker from "./components/exerciseNamePicker";
import RoutineCard from "./components/routineCard";
import SplitCard from "./components/splitCard";
import { useAppContext } from "./context/appContext";
import type {
  WorkoutRoutine,
  WorkoutRoutineExerciseTemplate,
  WorkoutSplit,
  WorkoutSplitDay,
  WorkoutSplitDayType,
  WorkoutSplitDraft,
  WorkoutSplitScheduleType,
  WorkoutRoutineWeekday,
} from "./types/workoutRoutine";

type PlannerTab = "routines" | "splits";
type CreateModalType = "routine" | "split" | null;

const WEEKDAYS: { value: WorkoutRoutineWeekday; label: string }[] = [
  { value: "sunday", label: "Sunday" },
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
];

interface SplitDayDraft {
  id: string;
  type: WorkoutSplitDayType;
  routineId?: string;
  weekdays: WorkoutRoutineWeekday[];
}

const createDraftId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const createEmptySplitDay = (
  weekday?: WorkoutRoutineWeekday,
): SplitDayDraft => ({
  id: createDraftId(),
  type: weekday ? "rest" : "routine",
  weekdays: weekday ? [weekday] : [],
});

const getSplitDayLabel = (
  day: WorkoutSplitDay,
  routines: { id?: string; name: string }[],
) => {
  if (day.type === "rest") return "Rest";
  return (
    routines.find((routine) => routine.id === day.routineId)?.name ??
    "Missing Routine"
  );
};

export default function Routines() {
  const {
    history,
    workoutRoutines,
    workoutSplits,
    createWorkoutRoutine,
    createWorkoutSplit,
    activateWorkoutSplit,
  } = useAppContext();

  const [activeTab, setActiveTab] = useState<PlannerTab>("routines");
  const [createModalType, setCreateModalType] = useState<CreateModalType>(null);
  const [activeSplitModal, setActiveSplitModal] = useState<WorkoutSplit | null>(
    null,
  );

  const [routineName, setRoutineName] = useState("");
  const [routineExerciseName, setRoutineExerciseName] = useState("");
  const [routineExercises, setRoutineExercises] = useState<
    WorkoutRoutineExerciseTemplate[]
  >([]);

  const [splitName, setSplitName] = useState("");
  const [splitScheduleType, setSplitScheduleType] =
    useState<WorkoutSplitScheduleType>("splitOrder");
  const [splitDays, setSplitDays] = useState<SplitDayDraft[]>([
    createEmptySplitDay(),
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

  const sortedWorkoutSplits = useMemo(
    () =>
      [...workoutSplits].sort((left, right) => {
        if (left.isActive && !right.isActive) return -1;
        if (!left.isActive && right.isActive) return 1;
        return (right.updatedAt?.getTime() ?? 0) - (left.updatedAt?.getTime() ?? 0);
      }),
    [workoutSplits],
  );

  const routineCompletionCounts = useMemo(() => {
    const countsByRoutineId = new Map<string, number>();

    history.forEach((workout) => {
      if (!workout.routineId) return;

      countsByRoutineId.set(
        workout.routineId,
        (countsByRoutineId.get(workout.routineId) ?? 0) + 1,
      );
    });

    return countsByRoutineId;
  }, [history]);

  const getRoutineCompletionCount = (routine: WorkoutRoutine) =>
    routine.id ? (routineCompletionCounts.get(routine.id) ?? 0) : 0;

  const resetRoutineForm = () => {
    setRoutineName("");
    setRoutineExerciseName("");
    setRoutineExercises([]);
    setErrorMessage(null);
    setIsSaving(false);
  };

  const resetSplitForm = () => {
    const firstDay = createEmptySplitDay();
    setSplitName("");
    setSplitScheduleType("splitOrder");
    setSplitDays([firstDay]);
    setErrorMessage(null);
    setIsSaving(false);
  };

  const openCreateModal = () => {
    if (activeTab === "routines") {
      resetRoutineForm();
      setCreateModalType("routine");
      return;
    }

    resetSplitForm();
    setCreateModalType("split");
  };

  const closeCreateModal = () => {
    setCreateModalType(null);
    resetRoutineForm();
    resetSplitForm();
  };

  const addRoutineExercise = () => {
    const exerciseName = routineExerciseName.trim().toUpperCase();

    if (!exerciseName) return;

    const alreadyAdded = routineExercises.some(
      (exercise) => exercise.name.toLowerCase() === exerciseName.toLowerCase(),
    );

    if (alreadyAdded) {
      setErrorMessage(`${exerciseName} is already in this routine.`);
      return;
    }

    setRoutineExercises((currentExercises) => [
      ...currentExercises,
      {
        id: createDraftId(),
        name: exerciseName,
      },
    ]);
    setRoutineExerciseName("");
    setErrorMessage(null);
  };

  const removeRoutineExercise = (exerciseId: string) => {
    setRoutineExercises((currentExercises) =>
      currentExercises.filter((exercise) => exercise.id !== exerciseId),
    );
  };

  const saveRoutine = async () => {
    const trimmedName = routineName.trim();
    const pendingExerciseName = routineExerciseName.trim().toUpperCase();
    const hasPendingDuplicate = routineExercises.some(
      (exercise) =>
        exercise.name.toLowerCase() === pendingExerciseName.toLowerCase(),
    );
    const exercises = pendingExerciseName
      ? [
          ...routineExercises,
          ...(hasPendingDuplicate
            ? []
            : [
                {
                  id: createDraftId(),
                  name: pendingExerciseName,
                },
              ]),
        ]
      : routineExercises;

    if (!trimmedName) {
      setErrorMessage("Add a routine name before saving.");
      return;
    }

    if (!exercises.length) {
      setErrorMessage("Add at least one exercise before saving.");
      return;
    }

    setIsSaving(true);

    try {
      const routineId = await createWorkoutRoutine({
        name: trimmedName,
        exercises,
      });

      if (routineId) {
        closeCreateModal();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const updateSplitDay = (
    dayId: string,
    updater: (day: SplitDayDraft) => SplitDayDraft,
  ) => {
    setSplitDays((currentDays) =>
      currentDays.map((day) => (day.id === dayId ? updater(day) : day)),
    );
  };

  const addSplitDay = () => {
    const nextDay = createEmptySplitDay();
    setSplitDays((currentDays) => [...currentDays, nextDay]);
  };

  const handleSplitScheduleTypeChange = (nextType: WorkoutSplitScheduleType) => {
    setSplitScheduleType(nextType);
    setSplitDays((currentDays) => {
      if (nextType === "daysOfWeek") {
        return WEEKDAYS.map(({ value }) => {
          const existingDay = currentDays.find((day) =>
            day.weekdays.includes(value),
          );

          return existingDay ?? createEmptySplitDay(value);
        });
      }

      const splitOrderDays = currentDays.filter(
        (day) => !day.weekdays.length,
      );

      return splitOrderDays.length ? splitOrderDays : [createEmptySplitDay()];
    });
  };

  const removeSplitDay = (dayId: string) => {
    setSplitDays((currentDays) =>
      currentDays.length === 1
        ? currentDays
        : currentDays.filter((day) => day.id !== dayId),
    );
  };

  const selectSplitRestDay = (dayId: string) => {
    updateSplitDay(dayId, (day) => ({
      ...day,
      type: "rest",
      routineId: undefined,
    }));
  };

  const selectSplitRoutineDay = (dayId: string, routineId?: string) => {
    updateSplitDay(dayId, (day) => ({
      ...day,
      type: "routine",
      routineId,
    }));
  };

  const buildSplitDraft = (): WorkoutSplitDraft | null => {
    const trimmedName = splitName.trim();
    const normalizedDays: WorkoutSplitDay[] = splitDays.map((day) => ({
      id: day.id,
      type: day.type,
      routineId: day.type === "routine" ? day.routineId : undefined,
    }));
    const routineDayCount = normalizedDays.filter(
      (day) => day.type === "routine" && day.routineId,
    ).length;

    if (!trimmedName) {
      setErrorMessage("Add a split name before saving.");
      return null;
    }

    if (!workoutRoutines.length) {
      setErrorMessage("Create at least one routine before building a split.");
      return null;
    }

    if (!routineDayCount) {
      setErrorMessage("Add at least one routine day before saving.");
      return null;
    }

    if (
      normalizedDays.some((day) => day.type === "routine" && !day.routineId)
    ) {
      setErrorMessage("Choose a routine for every routine day, or mark it Rest.");
      return null;
    }

    if (
      splitScheduleType === "daysOfWeek" &&
      splitDays.every((day) => !day.weekdays.length)
    ) {
      setErrorMessage("Choose at least one weekday before saving.");
      return null;
    }

    return {
      name: trimmedName,
      isActive: false,
      days: normalizedDays,
      schedule:
        splitScheduleType === "splitOrder"
          ? {
              type: "splitOrder",
              dayIds: normalizedDays.map((day) => day.id),
            }
          : {
              type: "daysOfWeek",
              assignments: splitDays.flatMap((day) =>
                day.weekdays.map((weekday) => ({
                  weekday,
                  dayId: day.id,
                })),
              ),
            },
    };
  };

  const saveSplit = async () => {
    const splitDraft = buildSplitDraft();

    if (!splitDraft) return;

    setIsSaving(true);

    try {
      const splitId = await createWorkoutSplit(splitDraft);

      if (splitId) {
        closeCreateModal();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const activateSplit = async (split: WorkoutSplit, startDayId?: string) => {
    if (!split.id) return;

    await activateWorkoutSplit(split.id, startDayId);
    setActiveSplitModal(null);
  };

  const renderRoutineBuilder = () => (
    <>
      <Text style={styles.label}>Routine Name</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Push, Lower"
        placeholderTextColor="#C6C6C6"
        value={routineName}
        onChangeText={(text) => {
          setErrorMessage(null);
          setRoutineName(text);
        }}
        maxLength={40}
      />

      <View style={styles.daysHeader}>
        <Text style={styles.sectionTitle}>Exercises</Text>
      </View>

      {routineExercises.map((exercise) => (
        <View key={exercise.id} style={styles.exerciseRow}>
          <Text style={styles.exerciseName}>{exercise.name}</Text>
          <Pressable onPress={() => removeRoutineExercise(exercise.id)}>
            <MaterialIcons name="close" size={18} color="#8E8E93" />
          </Pressable>
        </View>
      ))}

      <View style={styles.addExerciseRow}>
        <ExerciseNamePicker
          value={routineExerciseName}
          onChangeText={(name) => {
            setErrorMessage(null);
            setRoutineExerciseName(name);
          }}
          onSelectExercise={(name) => {
            setErrorMessage(null);
            setRoutineExerciseName(name);
          }}
          containerStyle={styles.addExerciseInputContainer}
        />
        <Pressable style={styles.addExerciseButton} onPress={addRoutineExercise}>
          <MaterialIcons name="add" size={22} color="white" />
        </Pressable>
      </View>
    </>
  );

  const renderSplitDayOptions = (day: SplitDayDraft) => (
    <View style={styles.routineChipGrid}>
      <Pressable
        style={[styles.routineChip, day.type === "rest" && styles.routineChipSelected]}
        onPress={() => selectSplitRestDay(day.id)}
      >
        <Text
          style={[
            styles.routineChipText,
            day.type === "rest" && styles.routineChipTextSelected,
          ]}
        >
          Rest
        </Text>
      </Pressable>

      {workoutRoutines.map((routine) => {
        const selected = day.type === "routine" && day.routineId === routine.id;

        return (
          <Pressable
            key={routine.id ?? routine.name}
            style={[styles.routineChip, selected && styles.routineChipSelected]}
            onPress={() => selectSplitRoutineDay(day.id, routine.id)}
          >
            <Text
              style={[
                styles.routineChipText,
                selected && styles.routineChipTextSelected,
              ]}
            >
              {routine.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  const renderSplitBuilder = () => (
    <>
      <Text style={styles.label}>Split Name</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 4 Day Split, ULR, PPL"
        placeholderTextColor="#C6C6C6"
        value={splitName}
        onChangeText={(text) => {
          setErrorMessage(null);
          setSplitName(text);
        }}
        maxLength={40}
      />

      <Text style={styles.label}>Schedule</Text>
      <View style={styles.scheduleToggleRow}>
        <Pressable
          style={[
            styles.scheduleToggle,
            splitScheduleType === "splitOrder" && styles.scheduleToggleActive,
          ]}
          onPress={() => handleSplitScheduleTypeChange("splitOrder")}
        >
          <MaterialIcons name="repeat" size={16} color="black" />
          <Text style={styles.scheduleToggleText}>Split Order</Text>
        </Pressable>

        <Pressable
          style={[
            styles.scheduleToggle,
            splitScheduleType === "daysOfWeek" && styles.scheduleToggleActive,
          ]}
          onPress={() => handleSplitScheduleTypeChange("daysOfWeek")}
        >
          <MaterialIcons name="event" size={16} color="black" />
          <Text style={styles.scheduleToggleText}>Weekdays</Text>
        </Pressable>
      </View>

      <View style={styles.daysHeader}>
        <Text style={styles.sectionTitle}>Split Days</Text>
        {splitScheduleType === "splitOrder" && (
          <Pressable style={styles.smallAddButton} onPress={addSplitDay}>
            <MaterialIcons name="add" size={18} color="black" />
            <Text style={styles.smallAddButtonText}>Add Day</Text>
          </Pressable>
        )}
      </View>

      {splitDays.map((day, index) => {
        const dayLabel =
          splitScheduleType === "daysOfWeek"
            ? WEEKDAYS.find((weekday) => day.weekdays.includes(weekday.value))
                ?.label ?? `Day ${index + 1}`
            : `Day ${index + 1}`;

        return (
          <View key={day.id} style={styles.dayCard}>
            <View style={styles.dayHeader}>
              <View style={styles.dayTitleContainer}>
                <Text style={styles.dayNameText} numberOfLines={1}>
                  {dayLabel}
                </Text>
              </View>

              {splitScheduleType === "splitOrder" && splitDays.length > 1 && (
                <Pressable
                  style={styles.removeDayButton}
                  onPress={() => removeSplitDay(day.id)}
                >
                  <MaterialIcons name="delete-outline" size={22} color="black" />
                </Pressable>
              )}
            </View>

            <View style={styles.dayBody}>{renderSplitDayOptions(day)}</View>
          </View>
        );
      })}
    </>
  );

  return (
    <View style={styles.container}>
      <View style={styles.segmentedControl}>
        <Pressable
          style={[
            styles.segmentButton,
            activeTab === "routines" && styles.segmentButtonActive,
          ]}
          onPress={() => setActiveTab("routines")}
        >
          <Text
            style={[
              styles.segmentButtonText,
              activeTab === "routines" && styles.segmentButtonTextActive,
            ]}
          >
            Routines
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.segmentButton,
            activeTab === "splits" && styles.segmentButtonActive,
          ]}
          onPress={() => setActiveTab("splits")}
        >
          <Text
            style={[
              styles.segmentButtonText,
              activeTab === "splits" && styles.segmentButtonTextActive,
            ]}
          >
            Splits
          </Text>
        </Pressable>
      </View>

      {activeTab === "routines" ? (
        <FlatList
          data={sortedWorkoutRoutines}
          renderItem={({ item }) => (
            <RoutineCard
              routine={item}
              completedCount={getRoutineCompletionCount(item)}
            />
          )}
          keyExtractor={(item, index) => item.id ?? `${item.name}-${index}`}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="fitness-center" size={32} color="#8E8E93" />
              <Text style={styles.emptyTitle}>No routines yet</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={sortedWorkoutSplits}
          renderItem={({ item }) => (
            <SplitCard split={item} onSetActive={setActiveSplitModal} />
          )}
          keyExtractor={(item, index) => item.id ?? `${item.name}-${index}`}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="bookmarks" size={32} color="#8E8E93" />
              <Text style={styles.emptyTitle}>No splits yet</Text>
            </View>
          }
        />
      )}

      <Pressable
        style={({ pressed }) => [
          styles.addButton,
          pressed && styles.addButtonPressed,
        ]}
        onPress={openCreateModal}
      >
        <MaterialIcons name="add" size={30} color="white" />
      </Pressable>

      <Modal
        visible={!!createModalType}
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
                  <Text style={styles.modalTitle}>
                    {createModalType === "routine" ? "Create Routine" : "Create Split"}
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
                {createModalType === "routine"
                  ? renderRoutineBuilder()
                  : renderSplitBuilder()}

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
                  onPress={createModalType === "routine" ? saveRoutine : saveSplit}
                  disabled={isSaving}
                >
                  <Text style={styles.saveButtonText}>
                    {isSaving
                      ? "Saving..."
                      : createModalType === "routine"
                        ? "Save Routine"
                        : "Save Split"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal
        visible={!!activeSplitModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setActiveSplitModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.activeSplitContent}>
            <View style={styles.modalHeaderCompact}>
              <View style={styles.modalTitleContainer}>
                <Text style={styles.modalTitle}>Activate Split</Text>
              </View>
              <Pressable
                onPress={() => setActiveSplitModal(null)}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={28} color="black" />
              </Pressable>
            </View>

            {activeSplitModal?.schedule.type === "splitOrder" ? (
              <View style={styles.activeDayList}>
                {activeSplitModal.days.map((day, index) => (
                  <Pressable
                    key={day.id}
                    style={styles.activeDayOption}
                    onPress={() => activateSplit(activeSplitModal, day.id)}
                  >
                    <Text style={styles.activeDayNumber}>Day {index + 1}</Text>
                    <Text style={styles.activeDayName}>
                      {getSplitDayLabel(day, workoutRoutines)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <View style={styles.activeDayList}>
                <Pressable
                  style={[styles.actionButton, styles.saveButton]}
                  onPress={() => {
                    if (activeSplitModal) void activateSplit(activeSplitModal);
                  }}
                >
                  <Text style={styles.saveButtonText}>Set Active</Text>
                </Pressable>
              </View>
            )}
          </View>
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
  segmentedControl: {
    flexDirection: "row",
    margin: 20,
    marginBottom: 0,
    padding: 4,
    borderWidth: 2,
    borderColor: "black",
    borderRadius: 10,
    backgroundColor: "white",
  },
  segmentButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 7,
  },
  segmentButtonActive: {
    backgroundColor: "black",
  },
  segmentButtonText: {
    color: "black",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  segmentButtonTextActive: {
    color: "white",
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
  emptyText: {
    marginTop: 6,
    color: "#8E8E93",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
    textAlign: "center",
  },
  addButton: {
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
  addButtonPressed: {
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
    height: "92%",
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "black",
    overflow: "hidden",
  },
  activeSplitContent: {
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "black",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: 20,
    borderBottomWidth: 2,
    borderBottomColor: "black",
  },
  modalHeaderCompact: {
    flexDirection: "row",
    alignItems: "center",
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
    lineHeight: 26,
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
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: "#F2F2F7",
  },
  exerciseName: {
    flex: 1,
    color: "black",
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  addExerciseRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 16,
  },
  addExerciseInputContainer: {
    flex: 1,
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
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "black",
    backgroundColor: "black",
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
  helperText: {
    marginBottom: 18,
    color: "#8E8E93",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
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

  dayTitleContainer: {
    flex: 1,
  },
  dayNumber: {
    color: "#8E8E93",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  dayNameText: {
    color: "black",
    fontSize: 16,
    fontWeight: "900",
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

  routineChipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  routineChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: "black",
    borderRadius: 999,
    backgroundColor: "white",
  },
  routineChipSelected: {
    backgroundColor: "black",
  },
  routineChipText: {
    color: "black",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  routineChipTextSelected: {
    color: "white",
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
  activeDayList: {
    padding: 16,
    gap: 10,
  },
  activeDayOption: {
    padding: 14,
    borderWidth: 2,
    borderColor: "black",
    borderRadius: 8,
    backgroundColor: "white",
  },
  activeDayNumber: {
    color: "#8E8E93",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  activeDayName: {
    marginTop: 2,
    color: "black",
    fontSize: 16,
    fontWeight: "900",
  },
});
