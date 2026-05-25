import React from "react";
import {
  Modal,
  StyleSheet,
  Text,
  View,
  Pressable,
} from "react-native";

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  onClose: () => void;
}

export default function CustomAlert({
  visible,
  title,
  message,
  buttons,
  onClose,
}: CustomAlertProps) {
  if (!visible) return null;

  const defaultButtons: AlertButton[] = buttons && buttons.length > 0
    ? buttons
    : [{ text: "OK", onPress: onClose }];

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.alertCard}>
          <Text style={styles.title}>{title}</Text>
          {message && <Text style={styles.message}>{message}</Text>}

          <View style={styles.buttonContainer}>
            {defaultButtons.map((btn, index) => {
              const isDestructive = btn.style === "destructive";
              const isCancel = btn.style === "cancel";

              return (
                <Pressable
                  key={index}
                  onPress={() => {
                    if (btn.onPress) btn.onPress();
                    onClose();
                  }}
                  style={({ pressed }) => [
                    styles.button,
                    isCancel ? styles.cancelButton : styles.defaultButton,
                    pressed && isCancel && { backgroundColor: "#FF3B30", borderColor: "#FF3B30" },
                    pressed && isDestructive && { backgroundColor: "#FF3B30", borderColor: "#FF3B30" },
                    pressed && !isCancel && !isDestructive && { backgroundColor: "#34C759", borderColor: "#34C759" },
                  ]}
                >
                  {({ pressed }) => (
                    <Text style={[
                      styles.buttonText,
                      isCancel ? (pressed ? styles.activeButtonText : styles.cancelButtonText) : styles.activeButtonText
                    ]}>
                      {btn.text}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  alertCard: {
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "black",
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    textTransform: "uppercase",
    marginBottom: 8,
    color: "black",
  },
  message: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3A3A3C",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  defaultButton: {
    backgroundColor: "black",
    borderColor: "black",
  },
  cancelButton: {
    backgroundColor: "white",
    borderColor: "black",
  },
  buttonText: {
    fontWeight: "900",
    textTransform: "uppercase",
    fontSize: 12,
    textAlign: "center",
  },
  activeButtonText: {
    color: "white",
  },
  cancelButtonText: {
    color: "black",
  },
});
