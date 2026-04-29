import {
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Modal,
  View,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import WorkoutCard from "./components/workoutCard";
import { useAppContext, Workout } from "./context/appContext";
import { useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";

export default function Index() {
  const { history } = useAppContext();
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);

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
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <Text style={styles.title}>SimplyLift</Text>
      
      <FlatList
        data={[...history].sort((a, b) => b.date.getTime() - a.date.getTime())}
        renderItem={({ item }) => (
          <Pressable onPress={() => setSelectedWorkout(item)}>
            <WorkoutCard workout={item} />
          </Pressable>
        )}
        keyExtractor={(item, index) => `${item.name}-${index}`}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No workouts logged yet.</Text>
          </View>
        }
      />

      <Modal
        visible={!!selectedWorkout}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedWorkout(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{selectedWorkout?.name}</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedWorkout?.date.toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </Text>
              </View>
              <Pressable onPress={() => setSelectedWorkout(null)}>
                <MaterialIcons name="close" size={28} color="black" />
              </Pressable>
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
                  <View style={styles.setsGrid}>
                    {exercise.sets?.map((set, setIndex) => (
                      <View key={setIndex} style={styles.setRow}>
                        <Text style={styles.setNumber}>{setIndex + 1}</Text>
                        <Text style={styles.setDetails}>
                          {set.weight} lbs × {set.reps} reps
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>

            <Pressable
              onPress={() => setSelectedWorkout(null)}
              style={styles.doneButton}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </Pressable>
          </View>
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
  title: {
    fontSize: 42,
    fontWeight: "900",
    paddingHorizontal: 20,
    paddingVertical: 10,
    letterSpacing: -1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 200,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    height: "85%",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: "800",
  },
  modalSubtitle: {
    fontSize: 16,
    color: "#8E8E93",
    fontWeight: "500",
  },
  statsBar: {
    flexDirection: "row",
    backgroundColor: "#F2F2F7",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    gap: 32,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#8E8E93",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 17,
    fontWeight: "700",
  },
  exerciseList: {
    flex: 1,
  },
  exerciseContainer: {
    marginBottom: 24,
    borderLeftWidth: 3,
    borderLeftColor: "black",
    paddingLeft: 16,
  },
  exerciseName: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
  },
  setsGrid: {
    gap: 8,
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  setNumber: {
    width: 20,
    fontSize: 14,
    fontWeight: "700",
    color: "#8E8E93",
  },
  setDetails: {
    fontSize: 16,
    fontWeight: "600",
  },
  doneButton: {
    backgroundColor: "black",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 16,
  },
  doneButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
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
