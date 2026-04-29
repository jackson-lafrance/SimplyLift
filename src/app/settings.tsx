import { Text, View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ProfileHeader from "./components/profileHeader";

export default function Settings() {
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ProfileHeader title="Settings" />
      <View style={styles.content}>
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
  version: {
    color: "#D1D1D6",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 40,
  },
});
