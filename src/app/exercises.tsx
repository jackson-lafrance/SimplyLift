import { Text, View, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

interface Exercise {
  name: string;
  weight?: number[];
  reps?: number[];
}

type Workout = {
  name: string;
  time: number;
  exercises: Exercise[];
};

export default function Index() {
  const [currentWorkout, setCurrentWorkout] = useState<Workout | null>(null);
  const [exerciseList, setExerciseList] = useState<Exercise[]>([]);
  const [history, setHistory] = useState<Workout[]>([]);

  useEffect(() => {
    const loadWorkoutData = async () => {
      const w = await AsyncStorage.getItem("currentWorkout");
      const e = await AsyncStorage.getItem("exercises");
      const p = await AsyncStorage.getItem("pastWorkouts");

      setCurrentWorkout(w ? (JSON.parse(w) as Workout) : null);
      setExerciseList(e ? (JSON.parse(e) as Exercise[]) : []);
      setHistory(p ? (JSON.parse(p) as Workout[]) : []);
    };

    loadWorkoutData();
  }, []);
  return (
    <View style={styles.container}>
      <Text></Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
