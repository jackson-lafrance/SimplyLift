import { StyleSheet, Text, View } from "react-native";
import { missingFirebaseEnvVars } from "@/firebase/config";

export default function FirebaseSetupScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Firebase Setup Required</Text>
        <Text style={styles.body}>
          Add your Firebase web app credentials to a local .env file before the
          auth and Firestore flow can run.
        </Text>
        <Text style={styles.label}>Missing Variables</Text>
        {missingFirebaseEnvVars.map((key) => (
          <Text key={key} style={styles.codeLine}>
            EXPO_PUBLIC_FIREBASE_{key.replace(/([A-Z])/g, "_$1").toUpperCase()}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "white",
  },
  card: {
    width: "100%",
    maxWidth: 500,
    borderWidth: 2,
    borderColor: "black",
    borderRadius: 12,
    padding: 24,
    backgroundColor: "white",
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    textTransform: "uppercase",
    color: "black",
    marginBottom: 12,
  },
  body: {
    fontSize: 15,
    fontWeight: "600",
    color: "#3A3A3C",
    marginBottom: 20,
  },
  label: {
    fontSize: 10,
    fontWeight: "900",
    color: "#8E8E93",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  codeLine: {
    fontSize: 13,
    fontWeight: "800",
    color: "black",
    marginBottom: 6,
  },
});
