import {
  StyleSheet,
  Pressable,
  Text,
  View,
  TextInput,
  Alert,
  FlatList,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppContext } from "../context/appContext";
import { useEffect, useState } from "react";
import ExerciseCard from "./exerciseCard";
import NewExercise from "./newExercise";

export default function ActiveWorkout() {
  const { currentWorkout, setCurrentWorkout, setHistory, setExerciseList } =
    useAppContext();
  const insets = useSafeAreaInsets();

  const [visible, setVisible] = useState(false);
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

  if (!currentWorkout) return null;

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        marginTop: insets.top,
        marginBottom: insets.bottom,
      }}
    >
      {visible && <NewExercise close={() => setVisible(false)} />}
      <TextInput
        maxLength={20}
        style={styles.title}
        onChangeText={(text) =>
          setCurrentWorkout((prev) => (prev ? { ...prev, name: text } : prev))
        }
        value={currentWorkout.name}
      />
      <Text style={styles.timer}>
        {String(Math.floor(time / 3600000)).padStart(2, "0")}:
        {String(Math.floor((time % 3600000) / 60000)).padStart(2, "0")}:
        {String(Math.floor((time % 60000) / 1000)).padStart(2, "0")}
      </Text>
      <FlatList
        data={currentWorkout.exercises}
        renderItem={({ item }) => (
          <View style={{ width: "100%", alignItems: "center", margin: 10 }}>
            <ExerciseCard exercise={item} />
          </View>
        )}
        style={{ width: "100%" }}
        contentContainerStyle={{ paddingBottom: 150 }}
      />

      <View
        style={{
          position: "absolute",
          bottom: insets.bottom + 10,
          alignItems: "center",
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          zIndex: 10,
          width: "90%",
          gap: 10,
        }}
      >
        <Pressable
          onPress={() => {
            Alert.alert("Cancel Workout", "Are you sure you want to quit?", [
              {
                text: "Keep Going",
                onPress: () => "",
                style: "cancel",
              },
              {
                text: "Cancel Workout",
                onPress: () => setCurrentWorkout(null),
                style: "destructive",
              },
            ]);
          }}
          style={[styles.smallButton, { backgroundColor: "white" }]}
        >
          <MaterialIcons name="close" size={24} color="black" />
        </Pressable>
        <Pressable
          style={styles.bigButton}
          onPress={() => {
            setVisible(true);
          }}
        >
          <Text style={styles.buttonText}>Add Exercise</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            Alert.alert("Submit Workout", "Are you finished your workout?", [
              {
                text: "Keep Going",
                onPress: () => "",
                style: "cancel",
              },
              {
                text: "Submit Workout",
                onPress: () => {
                  setHistory((prev) => [
                    ...prev,
                    {
                      ...currentWorkout,
                      time:
                        new Date().getTime() - currentWorkout.date.getTime(),
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
          style={[styles.smallButton, { backgroundColor: "black" }]}
        >
          <MaterialIcons name="check" size={24} color="white" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: -0.5,
  },
  timer: {
    fontFamily: "ui-monospace",
    fontSize: 32,
    fontWeight: "800",
    padding: 10,
    color: "black",
  },
  smallButton: {
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "black",
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "900",
    color: "white",
    textTransform: "uppercase",
  },
  bigButton: {
    flex: 1,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "black",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "black",
  },
});
