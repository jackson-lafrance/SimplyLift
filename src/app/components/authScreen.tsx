import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAppContext } from "../context/appContext";

export default function AuthScreen() {
  const { login, register, isAuthBusy } = useAppContext();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = async () => {
    const trimmedEmail = email.trim();

    if (mode === "signin") {
      const success = await login(trimmedEmail, password);
      if (success) {
        setPassword("");
      }
      return;
    }

    const success = await register(trimmedEmail, password);
    if (success) {
      setPassword("");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <View style={styles.card}>
        <Text style={styles.title}>SimplyLift</Text>
        <Text style={styles.subtitle}>
          Sign in to sync workout history and your exercise library.
        </Text>

        <View style={styles.modeRow}>
          <Pressable
            onPress={() => setMode("signin")}
            style={[styles.modeButton, mode === "signin" && styles.modeButtonActive]}
          >
            <Text
              style={[styles.modeButtonText, mode === "signin" && styles.modeButtonTextActive]}
            >
              Sign In
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setMode("signup")}
            style={[styles.modeButton, mode === "signup" && styles.modeButtonActive]}
          >
            <Text
              style={[styles.modeButtonText, mode === "signup" && styles.modeButtonTextActive]}
            >
              Sign Up
            </Text>
          </Pressable>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor="#8E8E93"
            style={styles.input}
            value={email}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setPassword}
            placeholder="At least 6 characters"
            placeholderTextColor="#8E8E93"
            secureTextEntry
            style={styles.input}
            value={password}
          />
        </View>

        <Pressable
          disabled={isAuthBusy}
          onPress={submit}
          style={({ pressed }) => [
            styles.submitButton,
            pressed && !isAuthBusy && styles.submitButtonPressed,
            isAuthBusy && styles.submitButtonDisabled,
          ]}
        >
          {isAuthBusy ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>
              {mode === "signin" ? "Sign In" : "Create Account"}
            </Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "black",
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: -1,
    color: "black",
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 24,
    color: "#3A3A3C",
    fontSize: 15,
    fontWeight: "600",
  },
  modeRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  modeButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: "black",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "white",
  },
  modeButtonActive: {
    backgroundColor: "black",
  },
  modeButtonText: {
    color: "black",
    fontWeight: "900",
    textTransform: "uppercase",
  },
  modeButtonTextActive: {
    color: "white",
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 10,
    fontWeight: "900",
    color: "#8E8E93",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  input: {
    borderWidth: 2,
    borderColor: "black",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "white",
    fontSize: 16,
    fontWeight: "700",
    color: "black",
  },
  submitButton: {
    marginTop: 8,
    borderWidth: 2,
    borderColor: "black",
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    backgroundColor: "black",
  },
  submitButtonPressed: {
    backgroundColor: "#34C759",
    borderColor: "#34C759",
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
