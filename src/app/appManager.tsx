import { View } from "react-native";
import { useAppContext } from "./context/appContext";
import Tabs from "./tabs";
import ActiveWorkout from "./components/activeWorkout";

export default function AppManager() {
  const { currentWorkout } = useAppContext();

  if (!currentWorkout) {
    return (
      <View style={{ flex: 1 }}>
        <Tabs />
      </View>
    );
  }

  return <ActiveWorkout />;
}
