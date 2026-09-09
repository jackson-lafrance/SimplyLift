import {
  ActivityIndicator,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Modal,
  View,
  ScrollView,
  Animated,
  Dimensions,
  TextInput,
} from "react-native";
import WorkoutCard from "./components/workoutCard";
import { useAppContext, Workout } from "./context/appContext";
import { useState, useRef, useEffect, useMemo } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import type { SwipeableMethods } from "react-native-gesture-handler/lib/typescript/components/ReanimatedSwipeable/ReanimatedSwipeableProps";
import SetGroupSummary from "./components/setGroupSummary";
import { selectionFeedback, warningFeedback } from "./utils/feedback";

const { height } = Dimensions.get("window");

function SwipeableWorkoutRow({
  workout,
  onPress,
  onDelete,
}: {
  workout: Workout;
  onPress: () => void;
  onDelete: (workout: Workout) => void;
}) {
  const swipeableRef = useRef<SwipeableMethods | null>(null);

  const requestDelete = () => {
    swipeableRef.current?.close();
    onDelete(workout);
  };

  return (
    <Swipeable
      ref={swipeableRef}
      friction={2}
      rightThreshold={80}
      overshootRight={false}
      enableTrackpadTwoFingerGesture
      onSwipeableOpen={(direction) => {
        if (direction === "left") {
          requestDelete();
        }
      }}
      renderRightActions={() => (
        <View style={styles.swipeDeleteActionContainer}>
          <Pressable
            onPress={requestDelete}
            style={({ pressed }) => [
              styles.swipeDeleteAction,
              pressed && styles.swipeDeleteActionPressed,
            ]}
          >
            <MaterialIcons name="delete-outline" size={24} color="white" />
            <Text style={styles.swipeDeleteText}>Delete</Text>
          </Pressable>
        </View>
      )}
    >
      <Pressable
        onPress={() => {
          selectionFeedback();
          onPress();
        }}
        style={({ pressed }) => [pressed && styles.workoutCardPressed]}
      >
        <WorkoutCard workout={workout} />
      </Pressable>
    </Swipeable>
  );
}

export default function Index() {
  const {
    history,
    deleteWorkoutFromHistory,
    startEditingWorkout,
    updateWorkoutName,
    showAlert,
  } = useAppContext();
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [workoutNameDraft, setWorkoutNameDraft] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  const lastTitlePress = useRef(0);
  const skipNameBlur = useRef(false);
  
  const slideAnim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    if (selectedWorkout) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 14,
      }).start();
    }
  }, [selectedWorkout, slideAnim]);

  const closeModal = () => {
    if (isEditingName) commitWorkoutName();

    Animated.timing(slideAnim, {
      toValue: height,
      duration: 160,
      useNativeDriver: true,
    }).start(() => {
      setSelectedWorkout(null);
      setIsEditingName(false);
      setWorkoutNameDraft("");
      setIsSavingName(false);
      lastTitlePress.current = 0;
    });
  };

  const commitWorkoutName = () => {
    if (!selectedWorkout) return;

    const trimmedName = workoutNameDraft.trim();
    setIsEditingName(false);

    if (!trimmedName) {
      setWorkoutNameDraft(selectedWorkout.name);
      return;
    }

    if (trimmedName === selectedWorkout.name) return;

    const previousWorkout = selectedWorkout;
    const updatedWorkout = { ...previousWorkout, name: trimmedName };
    setSelectedWorkout(updatedWorkout);
    setIsSavingName(true);
    void updateWorkoutName(previousWorkout, trimmedName)
      .then((saved) => {
        if (!saved) setSelectedWorkout(previousWorkout);
      })
      .finally(() => setIsSavingName(false));
  };

  const handleNameSubmit = () => {
    skipNameBlur.current = true;
    commitWorkoutName();
  };

  const handleNameBlur = () => {
    if (skipNameBlur.current) {
      skipNameBlur.current = false;
      return;
    }

    commitWorkoutName();
  };

  const handleTitlePress = () => {
    if (!selectedWorkout || isEditingName) return;

    const now = Date.now();
    if (now - lastTitlePress.current < 350) {
      selectionFeedback();
      setWorkoutNameDraft(selectedWorkout.name);
      setIsEditingName(true);
      lastTitlePress.current = 0;
      return;
    }

    lastTitlePress.current = now;
  };

  const editSelectedWorkout = () => {
    if (!selectedWorkout) return;

    const trimmedDraft = workoutNameDraft.trim();
    const workoutToEdit =
      isEditingName && trimmedDraft
        ? { ...selectedWorkout, name: trimmedDraft }
        : selectedWorkout;

    if (isEditingName && trimmedDraft && trimmedDraft !== selectedWorkout.name) {
      void updateWorkoutName(selectedWorkout, trimmedDraft);
    }

    startEditingWorkout(workoutToEdit);
    closeModal();
  };

  const requestDeleteWorkout = (workout: Workout) => {
    warningFeedback();
    showAlert(
      "Delete Workout",
      "Are you sure you want to delete this workout? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void deleteWorkoutFromHistory(workout);
            if (selectedWorkout?.id === workout.id) {
              setSelectedWorkout(null);
            }
          },
        },
      ],
    );
  };

  const sortedHistory = useMemo(
    () => [...history].sort((a, b) => b.date.getTime() - a.date.getTime()),
    [history],
  );

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const mins = Math.floor((ms % 3600000) / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${String(hours).padStart(2, "0")}:${String(mins).padStart(
      2,
      "0",
    )}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={sortedHistory}
        renderItem={({ item }) => (
          <SwipeableWorkoutRow
            workout={item}
            onPress={() => setSelectedWorkout(item)}
            onDelete={requestDeleteWorkout}
          />
        )}
        keyExtractor={(item, index) => item.id ?? `${item.name}-${index}`}
        contentContainerStyle={styles.listContent}
        removeClippedSubviews
        initialNumToRender={8}
        windowSize={7}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No workouts logged yet.</Text>
          </View>
        }
      />

      <Modal
        visible={!!selectedWorkout}
        transparent={true}
        animationType="none"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={[
              styles.modalContent,
              { transform: [{ translateY: slideAnim }] }
            ]}
          >
            <View style={styles.modalHeader}>
              <View style={styles.titleContainer}>
                {isEditingName ? (
                  <TextInput
                    accessibilityLabel="Workout name"
                    autoFocus
                    autoCapitalize="characters"
                    maxLength={18}
                    returnKeyType="done"
                    style={styles.modalTitleInput}
                    value={workoutNameDraft}
                    onChangeText={setWorkoutNameDraft}
                    onSubmitEditing={handleNameSubmit}
                    onBlur={handleNameBlur}
                  />
                ) : (
                  <Pressable
                    accessibilityHint="Double tap to edit the workout name"
                    onPress={handleTitlePress}
                  >
                    <Text style={styles.modalTitle} numberOfLines={2}>
                      {selectedWorkout?.name || "Untitled Workout"}
                    </Text>
                  </Pressable>
                )}
                <View style={styles.modalSubtitleRow}>
                  <Text style={styles.modalSubtitle}>
                    {selectedWorkout?.date.toLocaleDateString(undefined, {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </Text>
                  {isSavingName && <ActivityIndicator size="small" color="#8E8E93" />}
                </View>
              </View>
              <View style={{ flexDirection: "row"}}>
                <Pressable
                  hitSlop={8}
                  onPress={() => {
                    selectionFeedback();
                    closeModal();
                  }}
                  style={({ pressed }) => [pressed && styles.closeButtonPressed]}
                >
                  <MaterialIcons name="close" size={28} color="black" />
                </Pressable>
              </View>
            </View>

            <View style={styles.statsBar}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>DURATION</Text>
                <Text style={styles.statValue}>
                  {formatTime(selectedWorkout?.time || 0)}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>EXERCISES</Text>
                <Text style={styles.statValue}>
                  {selectedWorkout?.exercises.length}
                </Text>
              </View>
            </View>

            <ScrollView style={styles.exerciseList}>
              {selectedWorkout?.exercises.map((exercise, exIndex) => (
                <View key={exIndex} style={styles.exerciseContainer}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  <SetGroupSummary exercise={exercise} />
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable
                onPress={editSelectedWorkout}
                style={({ pressed }: { pressed: boolean }) => [
                  styles.editButton,
                  pressed && {
                    backgroundColor: "#34C759",
                    borderColor: "#34C759",
                  },
                ]}
              >
                <MaterialIcons name="edit" size={18} color="white" />
                <Text style={styles.doneButtonText}>Edit Workout</Text>
              </Pressable>

              <Pressable
                onPress={closeModal}
                style={({ pressed }: { pressed: boolean }) => [
                  styles.doneButton,
                  pressed && { backgroundColor: "#34C759", borderColor: "#34C759" },
                ]}
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </Pressable>
            </View>
          </Animated.View>
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
    paddingHorizontal: 20,
    paddingBottom: 180,
    paddingTop: 16,
  },
  workoutCardPressed: {
    opacity: 0.72,
  },
  swipeDeleteActionContainer: {
    width: 96,
    marginBottom: 12,
  },
  swipeDeleteAction: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: "#FF3B30",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  swipeDeleteActionPressed: {
    backgroundColor: "#D70015",
  },
  swipeDeleteText: {
    color: "white",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    height: "85%",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderWidth: 2,
    borderBottomWidth: 0,
    borderColor: "black",
    padding: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: -0.5,
  },
  modalTitleInput: {
    fontSize: 16,
    fontWeight: "900",
    textTransform: "uppercase",
    borderBottomWidth: 2,
    borderBottomColor: "black",
    paddingVertical: 2,
  },
  modalSubtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#8E8E93",
    fontWeight: "700",
    textTransform: "uppercase",
  },
  closeButtonPressed: {
    opacity: 0.5,
  },
  statsBar: {
    flexDirection: "row",
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "black",
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    gap: 32,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#8E8E93",
    marginBottom: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "900",
    fontFamily: "ui-monospace",
  },
  exerciseList: {
    flex: 1,
  },
  exerciseContainer: {
    marginBottom: 24,
    paddingLeft: 16,
    borderLeftWidth: 2,
    borderLeftColor: "black",
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 12,
    textTransform: "uppercase",
  },
  modalActions: {
    gap: 10,
    marginTop: 16,
  },
  editButton: {
    backgroundColor: "#5856D6",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    borderWidth: 2,
    borderColor: "#5856D6",
  },
  doneButton: {
    backgroundColor: "black",
    paddingVertical: 18,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "black",
  },
  doneButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  emptyContainer: {
    paddingTop: 100,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#8E8E93",
  },
});
