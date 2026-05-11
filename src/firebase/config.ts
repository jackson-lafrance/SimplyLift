const firebaseEnv = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const missingFirebaseEnvVars = Object.entries(firebaseEnv)
  .filter(([, value]) => !value)
  .map(([key]) => key);

export const isFirebaseConfigured = missingFirebaseEnvVars.length === 0;

export const firebaseConfigurationError = isFirebaseConfigured
  ? null
  : `Missing Firebase environment variables: ${missingFirebaseEnvVars.join(", ")}`;

export const firebaseWebConfig = isFirebaseConfigured
  ? {
      apiKey: firebaseEnv.apiKey as string,
      authDomain: firebaseEnv.authDomain as string,
      projectId: firebaseEnv.projectId as string,
      storageBucket: firebaseEnv.storageBucket as string,
      messagingSenderId: firebaseEnv.messagingSenderId as string,
      appId: firebaseEnv.appId as string,
    }
  : null;
