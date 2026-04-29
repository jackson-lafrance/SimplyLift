import { StyleSheet, View, Text, Pressable, Modal, Animated, Dimensions } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useState, useRef, useEffect } from "react";

const { height } = Dimensions.get("window");

interface ProfileHeaderProps {
  title: string;
}

export default function ProfileHeader({ title }: ProfileHeaderProps) {
  const [visible, setVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 60,
        friction: 12,
      }).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
    });
  };

  return (
    <View style={styles.shelf}>
      <Text style={styles.title}>{title}</Text>
      <Pressable 
        style={({ pressed }) => [
          styles.profileItem,
          pressed && styles.profileItemPressed
        ]} 
        onPress={() => setVisible(true)}
      >
        <MaterialIcons name="person" size={28} color="black" />
        <Text style={styles.profileLabel}>Profile</Text>
      </Pressable>

      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleClose}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={[
              styles.modalContent,
              { transform: [{ translateY: slideAnim }] }
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Profile</Text>
              <Pressable onPress={handleClose}>
                <MaterialIcons name="close" size={28} color="black" />
              </Pressable>
            </View>

            <View style={styles.profileContent}>
              <Text style={styles.popoverText}>SimplyLift v1.0.0</Text>
            </View>

            <Pressable
              onPress={handleClose}
              style={({ pressed }) => [
                styles.doneButton,
                pressed && { backgroundColor: "#34C759", borderColor: "#34C759" }
              ]}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </Pressable>
          </Animated.View>
        </View>
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
  profileContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  popoverText: {
    fontSize: 18,
    fontWeight: "900",
    color: "black",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  doneButton: {
    backgroundColor: "black",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "black",
    marginTop: 20,
  },
  doneButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "900",
    textTransform: "uppercase",
  },
});
