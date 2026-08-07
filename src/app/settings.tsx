import { Text, View, StyleSheet, Switch } from "react-native";
import { useAppContext } from "./context/appContext";
import { selectionFeedback } from "./utils/feedback";

export default function Settings() {
  const { allowUnilateralExercises, setAllowUnilateralExercises } =
    useAppContext();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.settingCard}>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingTitle}>Unilateral Exercises</Text>
          </View>
          <Switch
            value={allowUnilateralExercises}
            onValueChange={(value) => {
              selectionFeedback();
              setAllowUnilateralExercises(value);
            }}
            trackColor={{ false: "#D1D1D6", true: "#34C759" }}
            thumbColor="white"
            ios_backgroundColor="#D1D1D6"
          />
        </View>

        <Text style={styles.version}>SimplyLift v1.1.8</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  content: {
    padding: 20,
  },
  settingCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    borderWidth: 2,
    borderColor: "black",
    borderRadius: 8,
    padding: 16,
    backgroundColor: "white",
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "black",
    textTransform: "uppercase",
  },
  version: {
    color: "#D1D1D6",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 40,
  },
});
