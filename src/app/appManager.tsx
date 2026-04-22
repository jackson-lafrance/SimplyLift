import { Text, View } from "react-native";
import { useAppContext } from "./context/appContext";
import Tabs from "./tabs";

export default function AppManager() {
  const { currentWorkout } = useAppContext();
  if (!currentWorkout) return <Tabs />;
  return (
    <View>
      <Text>{currentWorkout.name}</Text>
      <Text>{currentWorkout.time}</Text>
    </View>
  );
}
