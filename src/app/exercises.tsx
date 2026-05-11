import { useState, useMemo, useRef, useEffect } from "react";
import {
  Text,
  View,
  StyleSheet,
  FlatList,
  Pressable,
  Modal,
  Animated,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppContext, ExerciseListItem } from "./context/appContext";
import { MaterialIcons } from "@expo/vector-icons";
import ProfileHeader from "./components/profileHeader";

const { height } = Dimensions.get("window");

export default function Exercises() {
  const { exerciseList, history } = useAppContext();

  // Track which exercise is clicked to decide visibility
  const [selectedExercise, setSelectedExercise] = useState<ExerciseListItem | null>(
    null,
  );

  const slideAnim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    if (selectedExercise) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 60,
        friction: 12,
      }).start();
    }
  }, [selectedExercise, slideAnim]);

  const closeModal = () => {
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setSelectedExercise(null);
    });
  };

  // Filter history for the selected exercise
  const exerciseHistory = useMemo(() => {
    if (!selectedExercise) return [];
    return history
      .map((workout) => {
        const entry = workout.exercises.find(
          (e) => e.name.toLowerCase() === selectedExercise.name.toLowerCase(),
        );
        return entry
          ? { date: workout.date, sets: entry.sets, workoutName: workout.name }
          : null;
      })
      .filter((e) => e !== null)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [history, selectedExercise]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ProfileHeader title="Exercises" />
      <FlatList
        data={exerciseList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [
              styles.listItem,
              pressed && styles.listItemPressed,
            ]}
            onPress={() => setSelectedExercise(item)}
          >
            <View style={styles.listItemTextContainer}>
              <Text style={styles.exerciseName}>{item.name}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#000" />
          </Pressable>
        )}
      />

      {/* Popover Modal */}
      <Modal
        visible={!!selectedExercise}
        transparent={true}
        animationType="fade"
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
              <Text style={styles.modalTitle}>{selectedExercise?.name}</Text>
              <Pressable
                onPress={closeModal}
                style={styles.closeIconButton}
              >
                <MaterialIcons name="close" size={24} color="black" />
              </Pressable>
            </View>

            <FlatList
              data={exerciseHistory}
              keyExtractor={(_, index) => index.toString()}
              contentContainerStyle={styles.historyList}
              renderItem={({ item }) => (
                <View style={styles.historyCard}>
                  <View style={styles.historyHeader}>
                    <Text style={styles.dateText}>
                      {item.date.toLocaleDateString(undefined, {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </Text>
                    <Text style={styles.workoutNameText}>
                      {item.workoutName}
                    </Text>
                  </View>
                  <View style={styles.setsContainer}>
                    {item.sets?.map((set, i) => (
                      <View key={i} style={styles.setRow}>
                        <Text style={styles.setNumberText}>Set {i + 1}</Text>
                        <Text style={styles.setDetailsText}>
                          {set.weight} lbs × {set.reps} reps
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <MaterialIcons
                    name="history-toggle-off"
                    size={48}
                    color="#D1D1D6"
                  />
                  <Text style={styles.emptyText}>No history recorded yet.</Text>
                </View>
              }
            />

            <Pressable
              onPress={closeModal}
              style={({ pressed }: { pressed: boolean }) => [
                styles.closeButton,
                pressed && { backgroundColor: "#34C759", borderColor: "#34C759" }
              ]}
            >
              <Text style={styles.closeButtonText}>Done</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  listContent: {
    paddingVertical: 16,
  },
  listItem: {
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 8,
    marginHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "black",
  },
  listItemPressed: {
    backgroundColor: "#F2F2F7",
  },
  listItemTextContainer: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#000",
    textTransform: "uppercase",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    width: "100%",
    height: "80%",
    backgroundColor: "white",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderWidth: 2,
    borderBottomWidth: 0,
    borderColor: "black",
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#000",
    textTransform: "uppercase",
  },
  closeIconButton: {
    padding: 4,
  },
  historyList: {
    paddingBottom: 20,
  },
  historyCard: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "black",
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    paddingBottom: 8,
  },
  dateText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#000",
    textTransform: "uppercase",
  },
  workoutNameText: {
    fontSize: 12,
    color: "#8E8E93",
    fontWeight: "700",
    textTransform: "uppercase",
  },
  setsContainer: {
    gap: 6,
  },
  setRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  setNumberText: {
    fontSize: 12,
    color: "#8E8E93",
    fontWeight: "800",
  },
  setDetailsText: {
    fontSize: 14,
    color: "#000",
    fontWeight: "700",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  emptyText: {
    marginTop: 12,
    color: "#8E8E93",
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  closeButton: {
    marginTop: 16,
    backgroundColor: "black",
    paddingVertical: 18,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "black",
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
