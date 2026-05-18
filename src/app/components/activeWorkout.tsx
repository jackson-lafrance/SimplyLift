import {
  StyleSheet,
  Pressable,
  Text,
  View,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppContext } from "../context/appContext";
import { useEffect, useState } from "react";
import ExerciseCard from "./exerciseCard";
import NewExercise from "./newExercise";

export default function ActiveWorkout() {
  const { currentWorkout, setCurrentWorkout, setHistory, setExerciseList, showAlert } =
    useAppContext();
  const insets = useSafeAreaInsets();

  const [visible, setVisible] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [time, setTime] = useState(
    new Date().getTime() -
      (!currentWorkout ? new Date().getTime() : currentWorkout.date.getTime()),
  );

  useEffect(() => {
    if (currentWorkout) {
      const interval = setInterval(() => {
        setTime(new Date().getTime() - currentWorkout.date.getTime());
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [currentWorkout]);

  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", () => {
      setIsKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  if (!currentWorkout) return null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {visible && <NewExercise close={() => setVisible(false)} />}

      {/* Top Shelf */}
      <View style={[styles.topShelf, { paddingTop: insets.top + 12 }]}>
        <View style={styles.topShelfContent}>
          <TextInput
            maxLength={20}
            style={styles.title}
            onChangeText={(text) =>
              setCurrentWorkout((prev) => (prev ? { ...prev, name: text } : prev))
            }
            value={currentWorkout.name}
          />
          <View style={styles.timerContainer}>
            <MaterialIcons name="timer" size={16} color="black" />
            <Text style={styles.timer}>
              {String(Math.floor(time / 3600000)).padStart(2, "0")}:
              {String(Math.floor((time % 3600000) / 60000)).padStart(2, "0")}:
              {String(Math.floor((time % 60000) / 1000)).padStart(2, "0")}
            </Text>
          </View>
        </View>
      </View>

      <FlatList
        data={currentWorkout.exercises}
        renderItem={({ item }) => (
          <View style={styles.exerciseWrapper}>
            <ExerciseCard exercise={item} />
          </View>
        )}
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          isKeyboardVisible && styles.listContentKeyboardVisible,
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
      />

      {/* Bottom Shelf */}
      {!isKeyboardVisible && (
        <View style={[styles.bottomShelf, { paddingBottom: insets.bottom + 10 }]}>
          <View style={styles.bottomShelfContent}>
            <Pressable
              onPress={() => {
                showAlert("Cancel Workout", "Are you sure you want to quit?", [
                  {
                    text: "Keep Going",
                    style: "default",
                  },
                  {
                    text: "Cancel Workout",
                    onPress: () => setCurrentWorkout(null),
                    style: "cancel",
                  },
                ]);
              }}
              style={styles.shelfButton}
            >
              {({ pressed }: { pressed: boolean }) => (
                <>
                  <MaterialIcons
                    name="close"
                    size={24}
                    color={pressed ? "#FF3B30" : "black"}
                  />
                  <Text style={[styles.shelfButtonLabel, pressed && { color: "#FF3B30" }]}>Quit</Text>
                </>
              )}
            </Pressable>

            <Pressable
              style={styles.mainActionButton}
              onPress={() => setVisible(true)}
            >
              <Text style={styles.mainActionButtonText}>Add Exercise</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                showAlert("Submit Workout", "Are you finished your workout?", [
                  {
                    text: "Keep Going",
                    style: "cancel",
                  },
                  {
                    text: "Submit Workout",
                    onPress: () => {
                      setHistory((prev) => [
                        ...prev,
                        {
                          ...currentWorkout,
                          time: new Date().getTime() - currentWorkout.date.getTime(),
                        },
                      ]);

                      setExerciseList((prev) => {
                        const newExercises = currentWorkout.exercises.filter(
                          (workoutExercise) =>
                            !prev.some(
                              (ex) =>
                                ex.name.toLowerCase() ===
                                workoutExercise.name.toLowerCase(),
                            ),
                        );
                        const uniqueNew = newExercises.map((ex) => ({
                          name: ex.name,
                        }));
                        return [...prev, ...uniqueNew];
                      });
                      setCurrentWorkout(null);
                    },
                    style: "destructive",
                  },
                ]);
              }}
              style={styles.shelfButton}
            >
              {({ pressed }: { pressed: boolean }) => (
                <>
                  <MaterialIcons
                    name="check"
                    size={24}
                    color={pressed ? "#34C759" : "black"}
                  />
                  <Text style={[styles.shelfButtonLabel, pressed && { color: "#34C759" }]}>Finish</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  topShelf: {
    backgroundColor: "white",
    borderBottomWidth: 2,
    borderBottomColor: "black",
  },
  topShelfContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    height: 80,
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    textTransform: "uppercase",
    flex: 1,
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timer: {
    fontFamily: "ui-monospace",
    fontSize: 16,
    fontWeight: "800",
    color: "black",
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 20,
    paddingBottom: 180,
  },
  listContentKeyboardVisible: {
    paddingBottom: 40,
  },
  exerciseWrapper: {
    width: "100%",
    alignItems: "center",
  },
  bottomShelf: {
    backgroundColor: "white",
    borderTopWidth: 2,
    borderTopColor: "black",
    paddingTop: 16,
    paddingHorizontal: 16,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  bottomShelfContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    height: 60,
  },
  shelfButton: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 60,
  },
  shelfButtonLabel: {
    fontSize: 10,
    fontWeight: "800",
    marginTop: 4,
    textTransform: "uppercase",
    color: "black",
  },
  mainActionButton: {
    flex: 1,
    backgroundColor: "black",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "black",
  },
  mainActionButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
