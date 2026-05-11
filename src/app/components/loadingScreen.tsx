import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({
  message = "Loading your training data…",
}: LoadingScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>SimplyLift</Text>
      <ActivityIndicator size="large" color="black" />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: -1,
    color: "black",
  },
  message: {
    fontSize: 14,
    fontWeight: "700",
    color: "#8E8E93",
    textTransform: "uppercase",
    textAlign: "center",
  },
});
