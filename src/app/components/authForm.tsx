import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { getReadableAuthError, useAuth } from "../context/authContext";
import { impactFeedback, selectionFeedback } from "../utils/feedback";

type AuthMode = "signIn" | "signUp" | "reset";

interface AuthFormProps {
  onAuthenticated?: () => void;
}

export default function AuthForm({ onAuthenticated }: AuthFormProps) {
  const { configError, signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState<AuthMode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isResetMode = mode === "reset";
  const isSignUpMode = mode === "signUp";

  const title = isResetMode
    ? "Reset Password"
    : isSignUpMode
      ? "Create Account"
      : "Sign In";

  const submitLabel = isResetMode
    ? "Send Reset Email"
    : isSignUpMode
      ? "Sign Up"
      : "Sign In";

  const handleSubmit = async () => {
    impactFeedback();
    setError(null);
    setMessage(null);

    if (!email.trim()) {
      setError("Enter your email address.");
      return;
    }

    if (!isResetMode && !password) {
      setError("Enter your password.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isResetMode) {
        await resetPassword(email);
        setMessage("Password reset email sent.");
        setMode("signIn");
      } else if (isSignUpMode) {
        await signUp(email, password);
        onAuthenticated?.();
      } else {
        await signIn(email, password);
        onAuthenticated?.();
      }
    } catch (submitError) {
      setError(getReadableAuthError(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>
        Sign in to sync workouts. You can keep using SimplyLift locally without an account.
      </Text>

      {error && <Text style={styles.errorText}>{error}</Text>}
      {message && <Text style={styles.messageText}>{message}</Text>}

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        textContentType="emailAddress"
      />

      {!isResetMode && (
        <>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry
            textContentType={isSignUpMode ? "newPassword" : "password"}
          />
        </>
      )}

      <Pressable
        style={({ pressed }) => [
          styles.submitButton,
          pressed && styles.submitButtonPressed,
          isSubmitting && styles.disabledButton,
        ]}
        disabled={isSubmitting || !!configError}
        onPress={handleSubmit}
      >
        {isSubmitting ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.submitButtonText}>{submitLabel}</Text>
        )}
      </Pressable>

      <View style={styles.linkRow}>
        {!isResetMode && (
          <Pressable
            onPress={() => {
              selectionFeedback();
              setMode(isSignUpMode ? "signIn" : "signUp");
            }}
          >
            <Text style={styles.linkText}>
              {isSignUpMode ? "Have an account? Sign in" : "Need an account? Sign up"}
            </Text>
          </Pressable>
        )}

        <Pressable
          onPress={() => {
            selectionFeedback();
            setMode(isResetMode ? "signIn" : "reset");
          }}
        >
          <Text style={styles.linkText}>
            {isResetMode ? "Back to sign in" : "Forgot password?"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  subtitle: {
    color: "#8E8E93",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 24,
  },
  label: {
    fontSize: 10,
    fontWeight: "900",
    color: "#8E8E93",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  input: {
    fontSize: 16,
    fontWeight: "700",
    borderWidth: 2,
    borderColor: "black",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: "black",
    backgroundColor: "white",
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: "black",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "black",
    marginTop: 8,
  },
  submitButtonPressed: {
    backgroundColor: "#34C759",
    borderColor: "#34C759",
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  linkRow: {
    gap: 12,
    marginTop: 20,
    alignItems: "center",
  },
  linkText: {
    color: "black",
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  errorText: {
    backgroundColor: "#FFE5E5",
    color: "#FF3B30",
    borderColor: "#FF3B30",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontWeight: "700",
  },
  messageText: {
    backgroundColor: "#E9FBEF",
    color: "#1C7C3A",
    borderColor: "#34C759",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontWeight: "700",
  },
});
