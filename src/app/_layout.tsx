import { SafeAreaProvider } from "react-native-safe-area-context";
import AppProvider from "./context/appContext";
import AppManager from "./appManager";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <AppManager />
      </AppProvider>
    </SafeAreaProvider>
  );
}
