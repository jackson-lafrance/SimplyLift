import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { initializeApp, getApp, getApps } from "firebase/app";
import {
  browserLocalPersistence,
  getAuth,
  initializeAuth,
  type Auth,
  type Persistence,
} from "firebase/auth";
import {
  firebaseConfigurationError,
  firebaseWebConfig,
  isFirebaseConfigured,
} from "./config";

type ReactNativeAuthModule = {
  getReactNativePersistence: (storage: typeof AsyncStorage) => Persistence;
};

const reactNativeAuthModule: ReactNativeAuthModule | null =
  Platform.OS === "web"
    ? null
    : // eslint-disable-next-line @typescript-eslint/no-require-imports
      (require("@firebase/auth/dist/rn/index.js") as ReactNativeAuthModule);

export const firebaseApp = isFirebaseConfigured
  ? getApps().length > 0
    ? getApp()
    : initializeApp(firebaseWebConfig!)
  : null;

let firebaseAuth: Auth | null = null;

if (firebaseApp) {
  try {
    firebaseAuth = initializeAuth(firebaseApp, {
      persistence:
        Platform.OS === "web"
          ? browserLocalPersistence
          : reactNativeAuthModule!.getReactNativePersistence(AsyncStorage),
    });
  } catch {
    firebaseAuth = getAuth(firebaseApp);
  }
}

export const auth = firebaseAuth;

export function getRequiredAuth(): Auth {
  if (!auth) {
    throw new Error(firebaseConfigurationError ?? "Firebase Auth is not configured.");
  }

  return auth;
}
