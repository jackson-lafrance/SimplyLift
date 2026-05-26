import { FirebaseError } from "firebase/app";
import {
  EmailAuthProvider,
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { firebaseAuth, firebaseConfigError } from "../../lib/firebase";
import { createUserProfile } from "../services/workoutRepository";

interface AuthContextType {
  user: User | null;
  isAuthLoading: boolean;
  configError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  reauthenticateWithPassword: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const requireAuth = () => {
  if (!firebaseAuth) {
    throw new Error(firebaseConfigError ?? "Firebase Auth is not configured.");
  }

  return firebaseAuth;
};

export const getReadableAuthError = (error: unknown) => {
  if (!(error instanceof FirebaseError)) {
    return error instanceof Error ? error.message : "Something went wrong.";
  }

  switch (error.code) {
    case "auth/email-already-in-use":
      return "That email is already signed up. Try signing in instead.";
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Email or password is incorrect.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    case "auth/missing-password":
      return "Enter your password.";
    case "auth/requires-recent-login":
      return "Please sign in again before clearing your data.";
    case "auth/too-many-requests":
      return "Too many attempts. Wait a bit and try again.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    case "auth/operation-not-allowed":
      return "Email/password auth is not enabled for this Firebase project yet.";
    default:
      return error.message;
  }
};

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    if (!firebaseAuth) {
      setIsAuthLoading(false);
      return;
    }

    return onAuthStateChanged(firebaseAuth, (nextUser) => {
      setUser(nextUser);
      setIsAuthLoading(false);
    });
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(requireAuth(), email.trim(), password);
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const credential = await createUserWithEmailAndPassword(
      requireAuth(),
      email.trim(),
      password,
    );

    await createUserProfile(credential.user.uid, credential.user.email);
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(requireAuth());
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(requireAuth(), email.trim());
  }, []);

  const reauthenticateWithPassword = useCallback(async (password: string) => {
    const currentUser = requireAuth().currentUser;

    if (!currentUser?.email) {
      throw new Error("No signed-in email/password user found.");
    }

    const credential = EmailAuthProvider.credential(currentUser.email, password);
    await reauthenticateWithCredential(currentUser, credential);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthLoading,
      configError: firebaseConfigError,
      signIn,
      signUp,
      signOut,
      resetPassword,
      reauthenticateWithPassword,
    }),
    [
      isAuthLoading,
      reauthenticateWithPassword,
      resetPassword,
      signIn,
      signOut,
      signUp,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
