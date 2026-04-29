import {
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Modal,
  View,
  ScrollView,
  Animated,
  Dimensions,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import WorkoutCard from "./components/workoutCard";
import { useAppContext, Workout } from "./context/appContext";
import { useState, useRef, useEffect } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import ProfileHeader from "./components/profileHeader";

const { height } = Dimensions.get("window");

export default function Index() {
  const { history, setHistory } = useAppContext();
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  
  const slideAnim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    if (selectedWorkout) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 60,
        friction: 12,
      }).start();
    }
  }, [selectedWorkout]);

  const closeModal = () => {
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setSelectedWorkout(null);
    });
  };

  const deleteWorkout = () => {
    Alert.alert(
      "Delete Workout",
      "Are you sure you want to delete this workout? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Animated.timing(slideAnim, {
              toValue: height,
              duration: 200,
              useNativeDriver: true,
            }).start(() => {
              setHistory((prev) =>
                prev.filter(
                  (w) =>
                    w.date.getTime() !== selectedWorkout?.date.getTime() ||
                    w.name !== selectedWorkout?.name,
                ),
              );
              setSelectedWorkout(null);
            });
          },
        },
      ],
    );
  };

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
      <ProfileHeader title="SimplyLift" />
      
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
              <View style={{ flexDirection: "row", gap: 16 }}>
                <Pressable onPress={deleteWorkout}>
                  {({ hovered }: { hovered: boolean }) => (
                    <MaterialIcons 
                      name="delete-outline" 
                      size={28} 
                      color={hovered ? "#FF3B30" : "black"} 
                    />
                  )}
                </Pressable>
                <Pressable onPress={closeModal}>
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
              onPress={closeModal}
              style={({ hovered }: { hovered: boolean }) => [
                styles.doneButton,
                hovered && { backgroundColor: "#34C759", borderColor: "#34C759" }
              ]}
            >
              <Text style={styles.doneButtonText}>Done</Text>
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
    paddingHorizontal: 20,
    paddingBottom: 180,
    paddingTop: 16,
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
  modalTitle: {
    fontSize: 32,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: -0.5,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#8E8E93",
    fontWeight: "700",
    textTransform: "uppercase",
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
  setsGrid: {
    gap: 6,
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  setNumber: {
    width: 15,
    fontSize: 12,
    fontWeight: "800",
    color: "#8E8E93",
  },
  setDetails: {
    fontSize: 15,
    fontWeight: "700",
  },
  doneButton: {
    backgroundColor: "black",
    paddingVertical: 18,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
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
