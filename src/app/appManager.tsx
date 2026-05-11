import { View } from "react-native";
import { useAppContext } from "./context/appContext";
import Tabs from "./tabs";
import ActiveWorkout from "./components/activeWorkout";
import AuthScreen from "./components/authScreen";
import FirebaseSetupScreen from "./components/firebaseSetupScreen";
import LoadingScreen from "./components/loadingScreen";

export default function AppManager() {
  const {
    authStatus,
    currentWorkout,
    isBootstrapping,
    isFirebaseConfigured,
  } = useAppContext();

  if (!isFirebaseConfigured) {
    return <FirebaseSetupScreen />;
  }

  if (isBootstrapping) {
    return <LoadingScreen />;
  }

  if (authStatus !== "signedIn") {
    return <AuthScreen />;
  }

  if (!currentWorkout) {
    return (
      <View style={{ flex: 1 }}>
        <Tabs />
      </View>
    );
  }

  return <ActiveWorkout />;
}
