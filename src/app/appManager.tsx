import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppContext } from "./context/appContext";
import Tabs from "./tabs";
import ActiveWorkout from "./components/activeWorkout";

export default function AppManager() {
  const { currentWorkout, setCurrentWorkout } = useAppContext();
  const insets = useSafeAreaInsets();

  if (!currentWorkout) {
    return (
      <View style={{ flex: 1 }}>
        <Tabs />
        <Pressable
          style={{
            position: "absolute",
            bottom: insets.bottom + 55,
            alignSelf: "center",
            zIndex: 10,
          }}
          onPress={() =>
            setCurrentWorkout({
              name: "New Workout",
              time: 0,
              date: new Date(),
              exercises: [],
            })
          }
        >
          <Text
            style={{
              padding: 20,
              backgroundColor: "#24A0ED",
              borderRadius: 10,
              fontSize: 16,
              fontWeight: "600",
              color: "white",
            }}
          >
            Start Workout
          </Text>
        </Pressable>
      </View>
    );
  }

  return <ActiveWorkout />;
}
