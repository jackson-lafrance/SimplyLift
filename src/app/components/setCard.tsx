import { StyleSheet, View, Text } from "react-native";
import { Set } from "../context/appContext";

export interface setProps {
  set: Set;
}

export default function SetCard({ set }: setProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.name}>{set.weight} lbs</Text>
      <Text style={styles.name}>{set.reps}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    fontWeight: 700,
    fontSize: 20,
  },
});
