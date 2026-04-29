import { Text, View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Settings() {
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text style={styles.title}>Settings</Text>
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
  title: {
    fontSize: 42,
    fontWeight: "900",
    paddingHorizontal: 20,
    paddingVertical: 10,
    letterSpacing: -1,
  },
  content: {
    padding: 20,
    alignItems: "center",
  },
  version: {
    color: "#8E8E93",
    fontSize: 14,
    fontWeight: "600",
  },
});
