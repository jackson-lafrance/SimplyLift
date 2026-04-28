import { Text, View, StyleSheet, FlatList } from "react-native";
import { useAppContext } from "./context/appContext";

export default function Exercises() {
  const { exerciseList } = useAppContext();
  return (
    <View style={styles.container}>
      <FlatList
        data={exerciseList}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => <Text>{item.name}</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
});
