import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CustomAlert, { AlertButton } from "../components/customAlert";
import { useAuth } from "./authContext";
import {
  clearFirestoreWorkoutData,
  deleteWorkout,
  importLegacyLocalData,
  normalizeExerciseName,
  saveCompletedWorkout,
  upsertExercises,
  watchExercises,
  watchWorkouts,
} from "../services/workoutRepository";

const CURRENT_WORKOUT_KEY = "currentWorkout";
const EXERCISES_KEY = "exercises";
const PAST_WORKOUTS_KEY = "pastWorkouts";
const currentWorkoutKey = (uid: string) => `currentWorkout:${uid}`;

export type SetType = "warmup" | "failure" | "rir";

export interface Set {
  reps: number;
  weight: number;
  type?: SetType;
  rir?: number;
}

export interface Exercise {
  name: string;
  sets?: Set[];
  isUnilateral?: boolean;
}

export interface Workout {
  id?: string;
  name: string;
  time: number;
  date: Date;
  exercises: Exercise[];
}

interface AppContextType {
  currentWorkout: Workout | null;
  setCurrentWorkout: Dispatch<SetStateAction<Workout | null>>;
  exerciseList: Exercise[];
  history: Workout[];
  finishWorkout: (workout: Workout) => Promise<void>;
  deleteWorkoutFromHistory: (workout: Workout) => Promise<void>;
  clearSignedInWorkoutData: () => Promise<void>;
  clearLoggedOutWorkoutData: () => Promise<void>;
  showAlert: (title: string, message?: string, buttons?: AlertButton[]) => void;
}

export const AppContext = createContext<AppContextType | null>(null);

const parseStoredWorkout = (rawWorkout: string | null): Workout | null => {
  if (!rawWorkout) return null;

  try {
    const parsedWorkout = JSON.parse(rawWorkout) as Omit<Workout, "date"> & {
      date: string | number;
    };

    return {
      ...parsedWorkout,
      date: new Date(parsedWorkout.date),
    };
  } catch {
    return null;
  }
};

const parseStoredWorkouts = (rawWorkouts: string | null): Workout[] => {
  if (!rawWorkouts) return [];

  try {
    return (
      JSON.parse(rawWorkouts) as (Omit<Workout, "date"> & {
        date: string | number;
      })[]
    ).map((workout) => ({
      ...workout,
      date: new Date(workout.date),
    }));
  } catch {
    return [];
  }
};

const parseStoredExercises = (rawExercises: string | null): Exercise[] => {
  if (!rawExercises) return [];

  try {
    return JSON.parse(rawExercises) as Exercise[];
  } catch {
    return [];
  }
};

const isSameWorkout = (left: Workout, right: Workout) => {
  if (left.id && right.id) return left.id === right.id;

  return (
    left.name === right.name && left.date.getTime() === right.date.getTime()
  );
};

const mergeExerciseList = (
  currentExercises: Exercise[],
  workoutExercises: Exercise[],
) => {
  const exercisesByName = new Map<string, Exercise>();

  currentExercises.forEach((exercise) => {
    const normalizedName = normalizeExerciseName(exercise.name);
    if (normalizedName)
      exercisesByName.set(normalizedName, {
        name: exercise.name,
        isUnilateral: exercise.isUnilateral,
      });
  });

  workoutExercises.forEach((exercise) => {
    const normalizedName = normalizeExerciseName(exercise.name);
    if (!normalizedName) return;

    const savedExercise = exercisesByName.get(normalizedName);

    exercisesByName.set(normalizedName, {
      name: savedExercise?.name ?? exercise.name.trim(),
      isUnilateral: exercise.isUnilateral ?? savedExercise?.isUnilateral,
    });
  });

  return Array.from(exercisesByName.values());
};

export default function AppProvider({ children }: { children: ReactNode }) {
  const { user, isAuthLoading } = useAuth();
  const [currentWorkout, setCurrentWorkout] = useState<Workout | null>(null);
  const [exerciseList, setExerciseList] = useState<Exercise[]>([]);
  const [history, setHistory] = useState<Workout[]>([]);
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);

  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message?: string;
    buttons?: AlertButton[];
  }>({
    visible: false,
    title: "",
  });

  const showAlert = useCallback(
    (title: string, message?: string, buttons?: AlertButton[]) => {
      setAlertConfig({
        visible: true,
        title,
        message,
        buttons,
      });
    },
    [],
  );

  const hideAlert = useCallback(() => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadWorkoutData = async () => {
      if (isAuthLoading) return;

      setHasLoadedStorage(false);

      if (!user) {
        const [[, storedWorkout], [, storedExercises], [, storedWorkouts]] =
          await AsyncStorage.multiGet([
            CURRENT_WORKOUT_KEY,
            EXERCISES_KEY,
            PAST_WORKOUTS_KEY,
          ]);

        if (!isMounted) return;

        setCurrentWorkout(parseStoredWorkout(storedWorkout));
        setExerciseList(parseStoredExercises(storedExercises));
        setHistory(parseStoredWorkouts(storedWorkouts));
        setHasLoadedStorage(true);
        return;
      }

      const storedWorkout = await AsyncStorage.getItem(
        currentWorkoutKey(user.uid),
      );

      if (!isMounted) return;

      setCurrentWorkout(parseStoredWorkout(storedWorkout));
      setExerciseList([]);
      setHistory([]);
      setHasLoadedStorage(true);
    };

    void loadWorkoutData();

    return () => {
      isMounted = false;
    };
  }, [isAuthLoading, user]);

  useEffect(() => {
    if (!user) return;

    return watchWorkouts(user.uid, setHistory, (error) => {
      console.error(error);
      showAlert("Workout Sync Error", "Could not load your workouts.");
    });
  }, [showAlert, user]);

  useEffect(() => {
    if (!user) return;

    return watchExercises(user.uid, setExerciseList, (error) => {
      console.error(error);
      showAlert("Exercise Sync Error", "Could not load your exercises.");
    });
  }, [showAlert, user]);

  useEffect(() => {
    if (!user) return;

    const migrateLegacyData = async () => {
      try {
        const result = await importLegacyLocalData(user.uid);

        if (
          !result.skipped &&
          (result.importedWorkouts || result.importedExercises)
        ) {
          console.log(
            `Imported ${result.importedWorkouts} workout(s) and ${result.importedExercises} saved exercise(s).`,
          );
        }
      } catch (error) {
        console.error(error);
        showAlert(
          "Local Import Failed",
          "Your old local workouts are still on this device.",
        );
      }
    };

    void migrateLegacyData();
  }, [showAlert, user]);

  useEffect(() => {
    if (!hasLoadedStorage || isAuthLoading) return;

    const persistCurrentWorkout = async () => {
      const storageKey = user
        ? currentWorkoutKey(user.uid)
        : CURRENT_WORKOUT_KEY;

      if (!currentWorkout) {
        await AsyncStorage.removeItem(storageKey);
        return;
      }

      await AsyncStorage.setItem(storageKey, JSON.stringify(currentWorkout));
    };

    void persistCurrentWorkout();
  }, [currentWorkout, hasLoadedStorage, isAuthLoading, user]);

  useEffect(() => {
    if (!hasLoadedStorage || isAuthLoading || user) return;

    void AsyncStorage.setItem(PAST_WORKOUTS_KEY, JSON.stringify(history));
  }, [hasLoadedStorage, history, isAuthLoading, user]);

  useEffect(() => {
    if (!hasLoadedStorage || isAuthLoading || user) return;

    void AsyncStorage.setItem(EXERCISES_KEY, JSON.stringify(exerciseList));
  }, [exerciseList, hasLoadedStorage, isAuthLoading, user]);

  const finishWorkout = useCallback(
    async (workout: Workout) => {
      if (!user) {
        setHistory((prev) => [...prev, workout]);
        setExerciseList((prev) => mergeExerciseList(prev, workout.exercises));
        setCurrentWorkout(null);
        return;
      }

      try {
        await saveCompletedWorkout(user.uid, workout);
        await upsertExercises(user.uid, workout.exercises);
        setCurrentWorkout(null);
      } catch (error) {
        console.error(error);
        showAlert("Save Failed", "Could not save this workout to Firestore.");
      }
    },
    [showAlert, user],
  );

  const deleteWorkoutFromHistory = useCallback(
    async (workout: Workout) => {
      if (!user) {
        setHistory((prev) =>
          prev.filter((item) => !isSameWorkout(item, workout)),
        );
        return;
      }

      if (!workout.id) {
        showAlert(
          "Delete Failed",
          "This workout does not have a Firestore id yet.",
        );
        return;
      }

      try {
        await deleteWorkout(user.uid, workout.id);
      } catch (error) {
        console.error(error);
        showAlert(
          "Delete Failed",
          "Could not delete this workout from Firestore.",
        );
      }
    },
    [showAlert, user],
  );

  const clearSignedInWorkoutData = useCallback(async () => {
    if (!user) return;

    try {
      await clearFirestoreWorkoutData(user.uid);
      await AsyncStorage.removeItem(currentWorkoutKey(user.uid));
      setCurrentWorkout(null);
      setHistory([]);
      setExerciseList([]);
    } catch (error) {
      console.error(error);
      showAlert("Clear Failed", "Could not clear your synced workout data.");
      throw error;
    }
  }, [showAlert, user]);

  const clearLoggedOutWorkoutData = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove([PAST_WORKOUTS_KEY, EXERCISES_KEY]);
      setHistory([]);
      setExerciseList([]);
    } catch (error) {
      console.error(error);
      showAlert("Clear Failed", "Could not clear local workout data.");
      throw error;
    }
  }, [showAlert]);

  return (
    <AppContext.Provider
      value={{
        currentWorkout,
        setCurrentWorkout,
        exerciseList,
        history,
        finishWorkout,
        deleteWorkoutFromHistory,
        clearSignedInWorkoutData,
        clearLoggedOutWorkoutData,
        showAlert,
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
  if (!ctx) throw new Error("Context must be used within context guy");
  return ctx;
};
