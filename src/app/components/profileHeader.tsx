import {
  ActivityIndicator,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useState, useRef, useEffect } from "react";
import AuthForm from "./authForm";
import { getReadableAuthError, useAuth } from "../context/authContext";
import { useAppContext } from "../context/appContext";
import { selectionFeedback, warningFeedback } from "../utils/feedback";

const { height } = Dimensions.get("window");

interface ProfileHeaderProps {
  title: string;
}

export default function ProfileHeader({ title }: ProfileHeaderProps) {
  const { user, signOut, reauthenticateWithPassword } = useAuth();
  const { clearSignedInWorkoutData, clearLoggedOutWorkoutData } = useAppContext();
  const [visible, setVisible] = useState(false);
  const [isClearSyncedPromptVisible, setIsClearSyncedPromptVisible] =
    useState(false);
  const [password, setPassword] = useState("");
  const [clearMessage, setClearMessage] = useState<string | null>(null);
  const [clearError, setClearError] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [isConfirmingLocalClear, setIsConfirmingLocalClear] = useState(false);
  const slideAnim = useRef(new Animated.Value(height)).current;
  const clearPromptAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 14,
      }).start();
    }
  }, [visible, slideAnim]);

  useEffect(() => {
    Animated.timing(clearPromptAnim, {
      toValue: isClearSyncedPromptVisible ? 1 : 0,
      duration: 160,
      useNativeDriver: false,
    }).start();
  }, [clearPromptAnim, isClearSyncedPromptVisible]);

  const resetClearState = () => {
    setPassword("");
    setClearMessage(null);
    setClearError(null);
    setIsClearing(false);
    setIsConfirmingLocalClear(false);
    setIsClearSyncedPromptVisible(false);
  };

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 160,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
      resetClearState();
    });
  };

  const openClearSyncedPrompt = () => {
    setPassword("");
    setClearError(null);
    setClearMessage(null);
    setIsClearSyncedPromptVisible(true);
  };

  const closeClearSyncedPrompt = () => {
    if (isClearing) {
      return;
    }

    setIsClearSyncedPromptVisible(false);
    setPassword("");
    setClearError(null);
  };

  const handleClearSignedInData = async () => {
    warningFeedback();
    setClearError(null);
    setClearMessage(null);

    if (!password) {
      setClearError("Enter your password to clear synced data.");
      return;
    }

    setIsClearing(true);

    try {
      await reauthenticateWithPassword(password);
      await clearSignedInWorkoutData();
      setPassword("");
      setIsClearSyncedPromptVisible(false);
      setClearMessage("Your synced workout data was cleared.");
    } catch (error) {
      setClearError(getReadableAuthError(error));
    } finally {
      setIsClearing(false);
    }
  };

  const handleClearLoggedOutData = async () => {
    warningFeedback();
    setClearError(null);
    setClearMessage(null);

    if (!isConfirmingLocalClear) {
      setIsConfirmingLocalClear(true);
      return;
    }

    setIsClearing(true);

    try {
      await clearLoggedOutWorkoutData();
      setIsConfirmingLocalClear(false);
      setClearMessage("Local workout history and exercises were cleared.");
    } catch (error) {
      setClearError(getReadableAuthError(error));
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <View style={styles.shelf}>
      <Text style={styles.title}>{title}</Text>
      <Pressable
        style={({ pressed }) => [
          styles.profileItem,
          pressed && styles.profileItemPressed,
        ]}
        onPress={() => {
          selectionFeedback();
          setVisible(true);
        }}
      >
        <MaterialIcons name="person" size={28} color="black" />
        <Text style={styles.profileLabel}>Profile</Text>
      </Pressable>

      <Modal
        visible={visible}
        transparent={true}
        animationType="none"
        onRequestClose={handleClose}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Animated.View
            style={[
              styles.modalContent,
              { transform: [{ translateY: slideAnim }] },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{user ? "Profile" : "Account"}</Text>
              <Pressable
                hitSlop={8}
                onPress={() => {
                  selectionFeedback();
                  handleClose();
                }}
                style={({ pressed }) => [pressed && styles.closeButtonPressed]}
              >
                <MaterialIcons name="close" size={28} color="black" />
              </Pressable>
            </View>

            <ScrollView
              style={styles.scrollContent}
              contentContainerStyle={styles.scrollContentContainer}
              keyboardShouldPersistTaps="handled"
            >
              {user ? (
                <>
                  <View style={styles.profileContent}>
                    <Text style={styles.emailLabel}>Signed in as</Text>
                    <Text style={styles.emailText}>{user.email ?? "Unknown user"}</Text>
                    <Text style={styles.popoverText}>SimplyLift v1.1.8</Text>
                  </View>

                  <View style={styles.dangerSection}>
                    <Text style={styles.sectionTitle}>Clear Synced Data</Text>

                    {clearMessage && <Text style={styles.messageText}>{clearMessage}</Text>}

                    <Pressable
                      onPress={openClearSyncedPrompt}
                      disabled={isClearing || isClearSyncedPromptVisible}
                      style={({ pressed }) => [
                        styles.dangerButton,
                        pressed && styles.dangerButtonPressed,
                        (isClearing || isClearSyncedPromptVisible) &&
                          styles.disabledButton,
                      ]}
                    >
                      <Text style={styles.dangerButtonText}>Clear Synced Data</Text>
                    </Pressable>

                    <Animated.View
                      pointerEvents={isClearSyncedPromptVisible ? "auto" : "none"}
                      style={[
                        styles.inlinePrompt,
                        {
                          maxHeight: clearPromptAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 260],
                          }),
                          marginTop: clearPromptAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 12],
                          }),
                          opacity: clearPromptAnim,
                          transform: [
                            {
                              translateY: clearPromptAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [-8, 0],
                              }),
                            },
                          ],
                        },
                      ]}
                    >
                      {clearError && <Text style={styles.errorText}>{clearError}</Text>}

                      <TextInput
                        style={styles.input}
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Password"
                        secureTextEntry
                        textContentType="password"
                      />

                      <View style={styles.promptActions}>
                        <Pressable
                          onPress={closeClearSyncedPrompt}
                          disabled={isClearing}
                          style={({ pressed }) => [
                            styles.secondaryButton,
                            pressed && styles.secondaryButtonPressed,
                            isClearing && styles.disabledButton,
                          ]}
                        >
                          <Text style={styles.secondaryButtonText}>Cancel</Text>
                        </Pressable>

                        <Pressable
                          onPress={handleClearSignedInData}
                          disabled={isClearing}
                          style={({ pressed }) => [
                            styles.dangerButton,
                            styles.promptDangerButton,
                            pressed && styles.dangerButtonPressed,
                            isClearing && styles.disabledButton,
                          ]}
                        >
                          {isClearing ? (
                            <ActivityIndicator color="white" />
                          ) : (
                            <Text style={styles.dangerButtonText}>Clear</Text>
                          )}
                        </Pressable>
                      </View>
                    </Animated.View>
                  </View>
                </>
              ) : (
                <>
                  <AuthForm onAuthenticated={handleClose} />

                  <View style={styles.dangerSection}>
                    <Text style={styles.sectionTitle}>Clear Local Data</Text>

                    {clearError && <Text style={styles.errorText}>{clearError}</Text>}
                    {clearMessage && <Text style={styles.messageText}>{clearMessage}</Text>}

                    <Pressable
                      onPress={handleClearLoggedOutData}
                      disabled={isClearing}
                      style={({ pressed }) => [
                        styles.dangerButton,
                        pressed && styles.dangerButtonPressed,
                        isClearing && styles.disabledButton,
                      ]}
                    >
                      {isClearing ? (
                        <ActivityIndicator color="white" />
                      ) : (
                        <Text style={styles.dangerButtonText}>
                          {isConfirmingLocalClear
                            ? "Tap Again To Confirm"
                            : "Clear Local Data"}
                        </Text>
                      )}
                    </Pressable>
                  </View>
                </>
              )}
            </ScrollView>

            {user && (
              <Pressable
                onPress={() => {
                  void signOut();
                  handleClose();
                }}
                style={({ pressed }) => [
                  styles.signOutButton,
                  pressed && { backgroundColor: "#FF3B30", borderColor: "#FF3B30" },
                ]}
              >
                <Text style={styles.signOutButtonText}>Sign Out</Text>
              </Pressable>
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  shelf: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    height: 80,
    backgroundColor: "white",
    borderBottomWidth: 2,
    borderBottomColor: "black",
    width: "100%",
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -1,
    textTransform: "uppercase",
  },
  profileItem: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 60,
  },
  profileItemPressed: {
    opacity: 0.7,
  },
  profileLabel: {
    fontSize: 10,
    fontWeight: "800",
    marginTop: 2,
    textTransform: "uppercase",
    color: "black",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    height: "85%",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderWidth: 2,
    borderBottomWidth: 0,
    borderColor: "black",
    padding: 24,
  },
  inlinePrompt: {
    overflow: "hidden",
  },
  closeButtonPressed: {
    opacity: 0.5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 32,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: -0.5,
  },

  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 20,
  },
  profileContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 28,
  },
  emailLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: "#8E8E93",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  emailText: {
    fontSize: 18,
    fontWeight: "900",
    color: "black",
    marginBottom: 24,
  },
  popoverText: {
    fontSize: 18,
    fontWeight: "900",
    color: "black",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  dangerSection: {
    borderWidth: 2,
    borderColor: "#FF3B30",
    borderRadius: 8,
    padding: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    textTransform: "uppercase",
    color: "black",
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 13,
    fontWeight: "700",
    color: "#8E8E93",
    marginBottom: 16,
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
  dangerButton: {
    backgroundColor: "black",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "black",
  },
  dangerButtonPressed: {
    backgroundColor: "#FF3B30",
    borderColor: "#FF3B30",
  },
  dangerButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  promptActions: {
    flexDirection: "row",
    gap: 12,
  },
  promptDangerButton: {
    flex: 1,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "white",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "black",
  },
  secondaryButtonPressed: {
    backgroundColor: "#EFEFF4",
  },
  secondaryButtonText: {
    color: "black",
    fontSize: 14,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  disabledButton: {
    opacity: 0.6,
  },
  signOutButton: {
    backgroundColor: "white",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "black",
    marginTop: 20,
  },
  signOutButtonText: {
    color: "black",
    fontSize: 16,
    fontWeight: "900",
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
