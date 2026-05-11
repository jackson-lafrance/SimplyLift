import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { auth, getRequiredAuth } from "@/firebase/auth";
import {
  firebaseConfigurationError,
  isFirebaseConfigured,
} from "@/firebase/config";
import {
  listExerciseList,
  upsertExerciseListEntries,
} from "@/services/exerciseListService";
import { upsertUserProfile } from "@/services/userProfileService";
import {
  deleteWorkout as deleteWorkoutDocument,
  listWorkouts,
  saveWorkout,
} from "@/services/workoutService";
import type {
  Exercise,
  ExerciseListItem,
  UserProfile,
  Workout,
} from "@/types/domain";
import CustomAlert, { type AlertButton } from "../components/customAlert";

const LEGACY_CURRENT_WORKOUT_KEY = "currentWorkout";

type AuthStatus = "checking" | "signedOut" | "signedIn";

interface AppContextType {
  currentWorkout: Workout | null;
  setCurrentWorkout: Dispatch<SetStateAction<Workout | null>>;
  exerciseList: ExerciseListItem[];
  history: Workout[];
  authUser: User | null;
  userProfile: UserProfile | null;
  authStatus: AuthStatus;
  isBootstrapping: boolean;
  isAuthBusy: boolean;
  isFirebaseConfigured: boolean;
  firebaseConfigurationError: string | null;
  showAlert: (title: string, message?: string, buttons?: AlertButton[]) => void;
  startWorkout: () => void;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<boolean>;
  finishCurrentWorkout: () => Promise<boolean>;
  deleteWorkout: (workoutId: string) => Promise<boolean>;
}

export type {
  Exercise,
  ExerciseListItem,
  UserProfile,
  Workout,
  WorkoutSet,
} from "@/types/domain";

export const AppContext = createContext<AppContextType | null>(null);

function getCurrentWorkoutStorageKey(uid: string): string {
  return `currentWorkout:${uid}`;
}

function deserializeWorkout(rawWorkout: string | null): Workout | null {
  if (!rawWorkout) {
    return null;
  }

  const parsedWorkout = JSON.parse(rawWorkout) as Workout;
  return {
    ...parsedWorkout,
    source: parsedWorkout.source === "terminal" ? "terminal" : "mobile",
    date: new Date(parsedWorkout.date),
  };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Try again.";
}

export default function AppProvider({ children }: { children: ReactNode }) {
  const [currentWorkout, setCurrentWorkout] = useState<Workout | null>(null);
  const [exerciseList, setExerciseList] = useState<ExerciseListItem[]>([]);
  const [history, setHistory] = useState<Workout[]>([]);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>("checking");
  const [isRemoteLoading, setIsRemoteLoading] = useState(false);
  const [isAuthBusy, setIsAuthBusy] = useState(false);
  const [draftStorageKey, setDraftStorageKey] = useState<string | null>(null);
  const [hasLoadedDraft, setHasLoadedDraft] = useState(false);

  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message?: string;
    buttons?: AlertButton[];
  }>({
    visible: false,
    title: "",
  });

  const showAlert = (title: string, message?: string, buttons?: AlertButton[]) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      buttons,
    });
  };

  const hideAlert = () => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  };

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setAuthStatus("signedOut");
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      if (!nextUser) {
        setAuthUser(null);
        setUserProfile(null);
        setHistory([]);
        setExerciseList([]);
        setDraftStorageKey(null);
        setHasLoadedDraft(false);
        setCurrentWorkout(null);
        setIsRemoteLoading(false);
        setAuthStatus("signedOut");
        return;
      }

      setAuthUser(nextUser);
      setAuthStatus("signedIn");
      setIsRemoteLoading(true);

      try {
        const [profile, remoteWorkouts, remoteExercises] = await Promise.all([
          upsertUserProfile(nextUser),
          listWorkouts(nextUser.uid),
          listExerciseList(nextUser.uid),
        ]);

        setUserProfile(profile);
        setHistory(remoteWorkouts);
        setExerciseList(remoteExercises);
      } catch (error) {
        setUserProfile(null);
        setHistory([]);
        setExerciseList([]);
        showAlert("Could Not Load Account", getErrorMessage(error));
      } finally {
        setIsRemoteLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    let cancelled = false;
    const authUid = authUser?.uid;

    const loadDraftWorkout = async () => {
      if (authStatus !== "signedIn" || !authUid) {
        return;
      }

      const storageKey = getCurrentWorkoutStorageKey(authUid);
      setDraftStorageKey(storageKey);
      setHasLoadedDraft(false);

      try {
        const storedWorkout = await AsyncStorage.getItem(storageKey);
        let draftToHydrate = storedWorkout;

        if (!draftToHydrate) {
          draftToHydrate = await AsyncStorage.getItem(LEGACY_CURRENT_WORKOUT_KEY);
          if (draftToHydrate) {
            await AsyncStorage.removeItem(LEGACY_CURRENT_WORKOUT_KEY);
          }
        }

        if (!cancelled) {
          setCurrentWorkout(deserializeWorkout(draftToHydrate));
        }
      } catch (error) {
        if (!cancelled) {
          setCurrentWorkout(null);
          showAlert("Could Not Restore Draft", getErrorMessage(error));
        }
      } finally {
        if (!cancelled) {
          setHasLoadedDraft(true);
        }
      }
    };

    loadDraftWorkout();

    return () => {
      cancelled = true;
    };
  }, [authStatus, authUser]);

  useEffect(() => {
    if (!draftStorageKey || !hasLoadedDraft) {
      return;
    }

    if (!currentWorkout) {
      AsyncStorage.removeItem(draftStorageKey);
      return;
    }

    AsyncStorage.setItem(draftStorageKey, JSON.stringify(currentWorkout));
  }, [currentWorkout, draftStorageKey, hasLoadedDraft]);

  const startWorkout = () => {
    setCurrentWorkout({
      name: "New Workout",
      time: 0,
      date: new Date(),
      exercises: [],
      source: "mobile",
    });
  };

  const login = async (email: string, password: string) => {
    if (!isFirebaseConfigured) {
      showAlert("Firebase Not Configured", firebaseConfigurationError ?? undefined);
      return false;
    }

    if (!email || !password) {
      showAlert("Missing Credentials", "Enter your email and password.");
      return false;
    }

    setIsAuthBusy(true);

    try {
      await signInWithEmailAndPassword(getRequiredAuth(), email, password);
      return true;
    } catch (error) {
      showAlert("Sign In Failed", getErrorMessage(error));
      return false;
    } finally {
      setIsAuthBusy(false);
    }
  };

  const register = async (email: string, password: string) => {
    if (!isFirebaseConfigured) {
      showAlert("Firebase Not Configured", firebaseConfigurationError ?? undefined);
      return false;
    }

    if (!email || !password) {
      showAlert("Missing Credentials", "Enter your email and password.");
      return false;
    }

    if (password.length < 6) {
      showAlert(
        "Password Too Short",
        "Firebase email/password auth requires at least 6 characters.",
      );
      return false;
    }

    setIsAuthBusy(true);

    try {
      await createUserWithEmailAndPassword(getRequiredAuth(), email, password);
      return true;
    } catch (error) {
      showAlert("Sign Up Failed", getErrorMessage(error));
      return false;
    } finally {
      setIsAuthBusy(false);
    }
  };

  const logout = async () => {
    if (!isFirebaseConfigured) {
      return false;
    }

    setIsAuthBusy(true);

    try {
      await signOut(getRequiredAuth());
      return true;
    } catch (error) {
      showAlert("Sign Out Failed", getErrorMessage(error));
      return false;
    } finally {
      setIsAuthBusy(false);
    }
  };

  const finishCurrentWorkout = async () => {
    if (!authUser) {
      showAlert("Sign In Required", "Sign in before saving workout history.");
      return false;
    }

    if (!currentWorkout) {
      return false;
    }

    const cleanedExercises: Exercise[] = currentWorkout.exercises
      .map((exercise) => ({
        ...exercise,
        name: exercise.name.trim(),
        sets: (exercise.sets ?? []).map((set) => ({
          reps: Number(set.reps ?? 0),
          weight: Number(set.weight ?? 0),
        })),
      }))
      .filter((exercise) => exercise.name.length > 0);

    if (cleanedExercises.length === 0) {
      showAlert(
        "Add An Exercise",
        "Finish only after at least one exercise has been added.",
      );
      return false;
    }

    const completedWorkout: Workout = {
      ...currentWorkout,
      name: currentWorkout.name.trim() || "Untitled Workout",
      exercises: cleanedExercises,
      time: Math.max(Date.now() - currentWorkout.date.getTime(), 0),
      source: "mobile",
    };

    try {
      const nextExerciseList = await upsertExerciseListEntries(
        authUser.uid,
        cleanedExercises,
      );
      const savedWorkout = await saveWorkout(
        authUser.uid,
        completedWorkout,
        nextExerciseList,
      );

      setExerciseList(nextExerciseList);
      setHistory((prev) =>
        [savedWorkout, ...prev].sort((a, b) => b.date.getTime() - a.date.getTime()),
      );
      setCurrentWorkout(null);
      return true;
    } catch (error) {
      showAlert("Could Not Save Workout", getErrorMessage(error));
      return false;
    }
  };

  const deleteWorkout = async (workoutId: string) => {
    if (!authUser) {
      showAlert("Sign In Required", "Sign in before deleting workout history.");
      return false;
    }

    try {
      await deleteWorkoutDocument(authUser.uid, workoutId);
      setHistory((prev) => prev.filter((workout) => workout.id !== workoutId));
      return true;
    } catch (error) {
      showAlert("Could Not Delete Workout", getErrorMessage(error));
      return false;
    }
  };

  const isBootstrapping = useMemo(
    () =>
      authStatus === "checking" ||
      (authStatus === "signedIn" && (!hasLoadedDraft || isRemoteLoading)),
    [authStatus, hasLoadedDraft, isRemoteLoading],
  );

  return (
    <AppContext.Provider
      value={{
        currentWorkout,
        setCurrentWorkout,
        exerciseList,
        history,
        authUser,
        userProfile,
        authStatus,
        isBootstrapping,
        isAuthBusy,
        isFirebaseConfigured,
        firebaseConfigurationError,
        showAlert,
        startWorkout,
        login,
        register,
        logout,
        finishCurrentWorkout,
        deleteWorkout,
      }}
    >
      {children}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={hideAlert}
      />
    </AppContext.Provider>
  );
}

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("Context must be used within AppProvider.");
  }

  return ctx;
};
