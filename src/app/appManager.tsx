import {
  StyleSheet,
  Pressable,
  Text,
  View,
  TextInput,
  Alert,
  FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppContext } from "./context/appContext";
import Tabs from "./tabs";
import { useEffect, useState } from "react";
import ExerciseCard from "./components/exerciseCard";

export default function AppManager() {
  const { currentWorkout, setCurrentWorkout, setHistory } = useAppContext();
  const insets = useSafeAreaInsets();
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
  if (!currentWorkout)
    return (
      <View
        style={{
          flex: 1,
        }}
      >
        <Tabs />
        <Pressable
          style={{
            position: "absolute",
            bottom: insets.bottom + 55,
            alignSelf: "center",
            zIndex: 10,
          }}
          onPress={() =>
            setCurrentWorkout({
              name: "New Workout",
              time: 0,
              date: new Date(),
              exercises: [],
            })
          }
        >
          <Text
            style={{
              padding: 20,
              backgroundColor: "#24A0ED",
              borderRadius: 10,
              fontSize: 16,
              fontWeight: 600,
              color: "white",
            }}
          >
            Start Workout
          </Text>
        </Pressable>
      </View>
    );

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
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      <View
        style={{
          position: "absolute",
          bottom: insets.bottom - 20,
          alignItems: "center",
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          zIndex: 10,
          width: "90%",
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
          style={[styles.smallButton, { backgroundColor: "red" }]}
        >
          <Text style={styles.buttonText}>Quit</Text>
        </Pressable>
        <Pressable
          style={styles.bigButton}
          onPress={() => {
            setCurrentWorkout((prev) =>
              prev
                ? {
                    ...prev,
                    exercises: [
                      ...prev.exercises,
                      { name: "jit", sets: [{ reps: 10, weight: 10 }] },
                    ],
                  }
                : prev,
            );
            console.log(currentWorkout);
          }}
        >
          <Text style={styles.buttonText}>Log Exercise</Text>
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
                        new Date().getMilliseconds() -
                        currentWorkout.date.getMilliseconds(),
                    },
                  ]);
                  setCurrentWorkout(null);
                },
                style: "destructive",
              },
            ]);
          }}
          style={[styles.smallButton, { backgroundColor: "#32cd32" }]}
        >
          <Text style={styles.buttonText}>Submit</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 36,
    fontWeight: 600,
  },
  timer: {
    fontFamily: "ui-monospace",
    fontSize: 24,
    padding: 5,
  },
  smallButton: {
    width: 75,
    height: 75,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 700,
    color: "white",
  },
  bigButton: {
    width: 200,
    height: 75,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#24A0ED",
    borderRadius: 15,
  },
});
