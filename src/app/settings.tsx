import { Text, View, StyleSheet, Switch } from "react-native";
import { useAppContext } from "./context/appContext";

export default function Settings() {
  const { allowUnilateralExercises, setAllowUnilateralExercises } =
    useAppContext();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.settingCard}>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingTitle}>Unilateral Exercises</Text>
            <Text style={styles.settingDescription}>
              Show the option to mark newly added exercises as unilateral.
              Existing unilateral exercises stay unchanged.
            </Text>
          </View>
          <Switch
            value={allowUnilateralExercises}
            onValueChange={setAllowUnilateralExercises}
            trackColor={{ false: "#D1D1D6", true: "#34C759" }}
            thumbColor="white"
            ios_backgroundColor="#D1D1D6"
          />
        </View>

        <Text style={styles.version}>SimplyLift v1.0.0</Text>
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
    marginBottom: 6,
  },
  settingDescription: {
    fontSize: 12,
    fontWeight: "700",
    color: "#8E8E93",
    lineHeight: 16,
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
