import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useAppContext } from "./context/appContext";
import { useAuth } from "./context/authContext";
import Tabs from "./tabs";
import ActiveWorkout from "./components/activeWorkout";

export default function AppManager() {
  const { currentWorkout, isAppLoading } = useAppContext();
  const { isAuthLoading } = useAuth();

  if (isAuthLoading || isAppLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="black" />
        <Text style={styles.loadingText}>Loading workouts</Text>
      </View>
    );
  }

  if (!currentWorkout) {
    return (
      <View style={{ flex: 1 }}>
        <Tabs />
      </View>
    );
  }

  return <ActiveWorkout />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
  },
  loadingText: {
    marginTop: 12,
    color: "#8E8E93",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
});
