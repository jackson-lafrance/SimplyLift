import AsyncStorage from "@react-native-async-storage/async-storage";
import { FirebaseApp, FirebaseOptions, getApp, getApps, initializeApp } from "firebase/app";
import {
  Firestore,
  getFirestore,
  initializeFirestore,
} from "firebase/firestore";
import {
  Auth,
  Persistence,
  getAuth,
  initializeAuth,
} from "firebase/auth";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const requiredConfigKeys = [
  "apiKey",
  "authDomain",
  "projectId",
  "storageBucket",
  "messagingSenderId",
  "appId",
] as const;

const missingConfigKeys = requiredConfigKeys.filter((key) => !firebaseConfig[key]);

export const firebaseConfigError = missingConfigKeys.length
  ? `Missing Firebase environment values: ${missingConfigKeys.join(", ")}`
  : null;

const createFirebaseApp = (): FirebaseApp | null => {
  if (firebaseConfigError) return null;
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
};

const reactNativeAsyncStoragePersistence = class {
  static type = "LOCAL" as const;
  readonly type = "LOCAL" as const;

  async _isAvailable() {
    try {
      await AsyncStorage.setItem("firebase:persistence:available", "1");
      await AsyncStorage.removeItem("firebase:persistence:available");
      return true;
    } catch {
      return false;
    }
  }

  _set(key: string, value: unknown) {
    return AsyncStorage.setItem(key, JSON.stringify(value));
  }

  async _get<T>(key: string): Promise<T | null> {
    const json = await AsyncStorage.getItem(key);
    return json ? (JSON.parse(json) as T) : null;
  }

  _remove(key: string) {
    return AsyncStorage.removeItem(key);
  }

  _addListener() {
    return;
  }

  _removeListener() {
    return;
  }
} as unknown as Persistence;

const createFirebaseAuth = (app: FirebaseApp | null): Auth | null => {
  if (!app) return null;

  try {
    return initializeAuth(app, {
      persistence: reactNativeAsyncStoragePersistence,
    });
  } catch {
    return getAuth(app);
  }
};

const createFirestore = (app: FirebaseApp | null): Firestore | null => {
  if (!app) return null;

  try {
    return initializeFirestore(app, {
      experimentalForceLongPolling: true,
    });
  } catch {
    return getFirestore(app);
  }
};

export const firebaseApp = createFirebaseApp();
export const firebaseAuth = createFirebaseAuth(firebaseApp);
export const firestore = createFirestore(firebaseApp);
