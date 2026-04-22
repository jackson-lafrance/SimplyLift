import { Text, StyleSheet, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import WorkoutCard from "./components/workoutCard";
import { useAppContext } from "./context/appContext";

export default function Index() {
  const { history } = useAppContext();
  const testHistory = [
    {
      name: "String",
      time: 1200,
      date: new Date(),
      exercises: [],
    },
    {
      name: "Water",
      time: 1200,
      date: new Date(),
      exercises: [],
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <Text style={styles.title}>SimplyLift</Text>
      <FlatList
        data={testHistory}
        renderItem={({ item }) => <WorkoutCard workout={item} />}
        keyExtractor={(item) => `${item.name} - ${String(item.date)}`}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  title: {
    fontSize: 50,
    fontWeight: 900,
    paddingBottom: 20,
  },
});
