import { useState, useMemo } from "react";
import {
  Text,
  View,
  StyleSheet,
  FlatList,
  Pressable,
  Modal,
} from "react-native";
import { useAppContext, Exercise } from "./context/appContext";
import { MaterialIcons } from "@expo/vector-icons";

export default function Exercises() {
  const { exerciseList, history } = useAppContext();

  // Track which exercise is clicked to decide visibility
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null,
  );

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
    <View style={styles.container}>
      <FlatList
        data={exerciseList}
        keyExtractor={(item) => item.name}
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
            <MaterialIcons name="chevron-right" size={24} color="#C7C7CC" />
          </Pressable>
        )}
      />

      <Modal
        visible={!!selectedExercise}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedExercise(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedExercise?.name}</Text>
              <Pressable
                onPress={() => setSelectedExercise(null)}
                style={styles.closeIconButton}
              >
                <MaterialIcons name="close" size={24} color="#8E8E93" />
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
              onPress={() => setSelectedExercise(null)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  listContent: {
    paddingVertical: 12,
  },
  listItem: {
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 1,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#C7C7CC",
  },
  listItemPressed: {
    backgroundColor: "#E5E5EA",
  },
  listItemTextContainer: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  exerciseSubtext: {
    fontSize: 13,
    color: "#8E8E93",
    marginTop: 2,
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
  },
  closeIconButton: {
    padding: 4,
  },
  historyList: {
    paddingBottom: 20,
  },
  historyCard: {
    backgroundColor: "#F9F9FB",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "black",
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#D1D1D6",
    paddingBottom: 8,
  },
  dateText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
  workoutNameText: {
    fontSize: 14,
    color: "#8E8E93",
  },
  setsContainer: {
    gap: 8,
  },
  setRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  setNumberText: {
    fontSize: 14,
    color: "#8E8E93",
    fontWeight: "500",
  },
  setDetailsText: {
    fontSize: 15,
    color: "#000",
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  emptyText: {
    marginTop: 12,
    color: "#8E8E93",
    fontSize: 16,
  },
  closeButton: {
    marginTop: 16,
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "600",
  },
});
