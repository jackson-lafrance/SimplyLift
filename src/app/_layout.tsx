import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import AppProvider from "./context/appContext";
import AppManager from "./appManager";


export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <AppManager />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
