import { StyleSheet, View, Text, Pressable, Alert } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface ProfileHeaderProps {
  title: string;
}

export default function ProfileHeader({ title }: ProfileHeaderProps) {
  const handleProfilePress = () => {
    Alert.alert("Account", "Profile and sync features coming soon.");
  };

  return (
    <View style={styles.shelf}>
      <Text style={styles.title}>{title}</Text>
      <Pressable 
        style={({ pressed }) => [
          styles.profileItem,
          pressed && styles.profileItemPressed
        ]} 
        onPress={handleProfilePress}
      >
        <MaterialIcons name="person-outline" size={28} color="black" />
        <Text style={styles.profileLabel}>Profile</Text>
      </Pressable>
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
});
