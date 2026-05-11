import { Text, View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ProfileHeader from "./components/profileHeader";
import { useAppContext } from "./context/appContext";

export default function Settings() {
  const { authUser, userProfile } = useAppContext();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ProfileHeader title="Settings" />
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{authUser?.email ?? "Unknown"}</Text>

          <Text style={styles.label}>Units</Text>
          <Text style={styles.value}>{userProfile?.units ?? "lbs"}</Text>
        </View>

        <Text style={styles.version}>SimplyLift v1.0.0</Text>
      </View>
    </SafeAreaView>
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
  card: {
    borderWidth: 2,
    borderColor: "black",
    borderRadius: 8,
    padding: 16,
    backgroundColor: "white",
  },
  label: {
    fontSize: 10,
    fontWeight: "900",
    color: "#8E8E93",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  value: {
    fontSize: 16,
    fontWeight: "800",
    color: "black",
    marginBottom: 16,
  },
  version: {
    color: "#D1D1D6",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 40,
  },
});
