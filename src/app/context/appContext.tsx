import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
  Dispatch,
  SetStateAction,
  useMemo,
  useRef,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CustomAlert, { AlertButton } from "../components/customAlert";
import { useAuth } from "./authContext";
import {
  activateWorkoutSplit as activateFirestoreWorkoutSplit,
  clearFirestoreWorkoutData,
  createWorkoutRoutine as createFirestoreWorkoutRoutine,
  createWorkoutSplit as createFirestoreWorkoutSplit,
  deactivateWorkoutSplits as deactivateFirestoreWorkoutSplits,
  deleteWorkout,
  deleteWorkoutRoutine as deleteFirestoreWorkoutRoutine,
  deleteWorkoutSplit as deleteFirestoreWorkoutSplit,
  importLegacyLocalData,
  normalizeExerciseName,
  saveCompletedWorkout,
  updateCompletedWorkout,
  updateWorkoutRoutine as updateFirestoreWorkoutRoutine,
  updateWorkoutSplit as updateFirestoreWorkoutSplit,
  upsertExercises,
  watchExercises,
  watchWorkoutRoutines,
  watchWorkoutSplits,
  watchWorkouts,
} from "../services/workoutRepository";
import {
  cloneWorkout,
  isSameWorkout,
  replaceWorkout,
} from "../utils/workoutEditing";
import { filterExercisesWithWorkoutHistory } from "../utils/exerciseVisibility";
import {
  impactFeedback,
  selectionFeedback,
  successFeedback,
  warningFeedback,
} from "../utils/feedback";
import type {
  ExerciseTrackingMode,
  WorkoutRoutine,
  WorkoutRoutineDraft,
  WorkoutRoutineExerciseTemplate,
  WorkoutRoutineUpdate,
  WorkoutSplit,
  WorkoutSplitDraft,
  WorkoutSplitUpdate,
} from "../types/workoutRoutine";
import {
  getPersistedExerciseTrackingMode,
  migrateExerciseSummary,
  migrateWorkoutToSetGroups,
} from "../utils/exerciseSets";

export type { ExerciseTrackingMode } from "../types/workoutRoutine";

const CURRENT_WORKOUT_KEY = "currentWorkout";
const EDITING_WORKOUT_KEY = "editingWorkout";
const EXERCISES_KEY = "exercises";
const PAST_WORKOUTS_KEY = "pastWorkouts";
const WORKOUT_ROUTINES_KEY = "workoutRoutines";
const WORKOUT_SPLITS_KEY = "workoutSplits";
const ALLOW_UNILATERAL_EXERCISES_KEY = "allowUnilateralExercises";
const ROUTINES_AND_SPLITS_ENABLED_KEY = "routinesAndSplitsEnabled";
const currentWorkoutKey = (uid: string) => `currentWorkout:${uid}`;
const editingWorkoutKey = (uid: string) => `editingWorkout:${uid}`;

export type SetType = "warmup" | "failure" | "rir";

export interface Set {
  reps: number;
  weight: number;
  type?: SetType;
  rir?: number;
}

export type ExerciseSetGroup =
  | {
      id: string;
      type: "standard";
      set: Set;
    }
  | {
      id: string;
      type: "leftRight";
      left: Set;
      right: Set;
    };

export interface Exercise {
  name: string;
  trackingMode?: ExerciseTrackingMode;
  setGroups?: ExerciseSetGroup[];
  /** Legacy storage field. New writes should use setGroups. */
  sets?: Set[];
  /** Legacy storage field. New writes should use trackingMode. */
  isUnilateral?: boolean;
}

export interface Workout {
  id?: string;
  name: string;
  time: number;
  date: Date;
  exercises: Exercise[];
  routineId?: string;
  splitId?: string;
  splitDayId?: string;
}

interface AppContextType {
  currentWorkout: Workout | null;
  isAppLoading: boolean;
  setCurrentWorkout: Dispatch<SetStateAction<Workout | null>>;
  getCurrentWorkout: () => Workout | null;
  registerPendingSetFlush: (flush: () => void) => () => void;
  flushPendingSetUpdates: () => void;
  exerciseList: Exercise[];
  history: Workout[];
  workoutRoutines: WorkoutRoutine[];
  workoutSplits: WorkoutSplit[];
  allowUnilateralExercises: boolean;
  setAllowUnilateralExercises: Dispatch<SetStateAction<boolean>>;
  isEditingWorkout: boolean;
  startWorkout: () => void;
  startEditingWorkout: (workout: Workout) => void;
  cancelWorkoutEdit: () => void;
  routinesAndSplitsEnabled: boolean;
  setRoutinesAndSplitsEnabled: Dispatch<SetStateAction<boolean>>;
  createWorkoutRoutine: (routine: WorkoutRoutineDraft) => Promise<string | null>;
  updateWorkoutRoutine: (
    routineId: string,
    routine: WorkoutRoutineUpdate,
  ) => Promise<void>;
  deleteWorkoutRoutine: (routineId: string) => Promise<void>;
  createWorkoutSplit: (split: WorkoutSplitDraft) => Promise<string | null>;
  updateWorkoutSplit: (
    splitId: string,
    split: WorkoutSplitUpdate,
  ) => Promise<void>;
  deleteWorkoutSplit: (splitId: string) => Promise<void>;
  activateWorkoutSplit: (
    splitId: string,
    currentDayId?: string,
  ) => Promise<void>;
  deactivateWorkoutSplit: () => Promise<void>;
  finishWorkout: (workout: Workout) => Promise<void>;
  saveEditedWorkout: (workout: Workout) => Promise<void>;
  updateWorkoutName: (workout: Workout, name: string) => Promise<boolean>;
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

    return migrateWorkoutToSetGroups({
      ...parsedWorkout,
      date: new Date(parsedWorkout.date),
    });
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
    ).map((workout) =>
      migrateWorkoutToSetGroups({
        ...workout,
        date: new Date(workout.date),
      }),
    );
  } catch {
    return [];
  }
};

const parseStoredExercises = (rawExercises: string | null): Exercise[] => {
  if (!rawExercises) return [];

  try {
    return (JSON.parse(rawExercises) as Exercise[]).map(
      migrateExerciseSummary,
    );
  } catch {
    return [];
  }
};

type StoredWorkoutRoutine = Partial<WorkoutRoutine> & {
  days?: {
    exercises?: WorkoutRoutineExerciseTemplate[];
  }[];
  createdAt?: string | number;
  updatedAt?: string | number;
};

type StoredWorkoutSplit = Omit<
  WorkoutSplit,
  "schedule" | "createdAt" | "updatedAt"
> & {
  schedule?: Partial<WorkoutSplit["schedule"]>;
  createdAt?: string | number;
  updatedAt?: string | number;
};

const normalizeRoutineExerciseTemplate = (
  exercise: WorkoutRoutineExerciseTemplate,
): WorkoutRoutineExerciseTemplate => ({
  id: exercise.id,
  name: exercise.name,
  trackingMode:
    exercise.trackingMode ?? getPersistedExerciseTrackingMode(exercise),
  notes: exercise.notes,
});

const normalizeStoredRoutineExercises = (
  routine: StoredWorkoutRoutine,
): WorkoutRoutineExerciseTemplate[] => {
  if (Array.isArray(routine.exercises)) {
    return routine.exercises.map(normalizeRoutineExerciseTemplate);
  }

  return (
    routine.days?.flatMap((day) =>
      (day.exercises ?? []).map(normalizeRoutineExerciseTemplate),
    ) ?? []
  );
};

const parseStoredWorkoutRoutines = (
  rawWorkoutRoutines: string | null,
): WorkoutRoutine[] => {
  if (!rawWorkoutRoutines) return [];

  try {
    return (JSON.parse(rawWorkoutRoutines) as StoredWorkoutRoutine[]).map(
      (routine) => ({
        id: routine.id,
        name: routine.name ?? "Untitled Routine",
        exercises: normalizeStoredRoutineExercises(routine),
        createdAt: routine.createdAt ? new Date(routine.createdAt) : undefined,
        updatedAt: routine.updatedAt ? new Date(routine.updatedAt) : undefined,
      }),
    );
  } catch {
    return [];
  }
};

const normalizeStoredSplitSchedule = (
  split: StoredWorkoutSplit,
): WorkoutSplit["schedule"] => ({
  type: "splitOrder",
  dayIds: split.schedule?.dayIds?.length
    ? split.schedule.dayIds
    : split.days.map((day) => day.id),
});

const parseStoredWorkoutSplits = (
  rawWorkoutSplits: string | null,
): WorkoutSplit[] => {
  if (!rawWorkoutSplits) return [];

  try {
    return (JSON.parse(rawWorkoutSplits) as StoredWorkoutSplit[]).map(
      (split) => ({
        ...split,
        schedule: normalizeStoredSplitSchedule(split),
        createdAt: split.createdAt ? new Date(split.createdAt) : undefined,
        updatedAt: split.updatedAt ? new Date(split.updatedAt) : undefined,
      }),
    );
  } catch {
    return [];
  }
};

const createLocalId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const getNextSplitDayId = (split: WorkoutSplit, currentDayId: string) => {
  const dayIds = split.schedule.dayIds.length
    ? split.schedule.dayIds
    : split.days.map((day) => day.id);

  if (!dayIds.length) return undefined;

  const currentIndex = dayIds.indexOf(currentDayId);
  const safeCurrentIndex = currentIndex === -1 ? 0 : currentIndex;
  return dayIds[(safeCurrentIndex + 1) % dayIds.length];
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
        trackingMode: getPersistedExerciseTrackingMode(exercise),
      });
  });

  workoutExercises.forEach((exercise) => {
    const normalizedName = normalizeExerciseName(exercise.name);
    if (!normalizedName) return;

    const savedExercise = exercisesByName.get(normalizedName);

    exercisesByName.set(normalizedName, {
      name: savedExercise?.name ?? exercise.name.trim(),
      trackingMode:
        getPersistedExerciseTrackingMode(exercise) ??
        getPersistedExerciseTrackingMode(savedExercise),
    });
  });

  return Array.from(exercisesByName.values());
};

export default function AppProvider({ children }: { children: ReactNode }) {
  const { user, isAuthLoading } = useAuth();
  const [currentWorkout, setCurrentWorkoutState] =
    useState<Workout | null>(null);
  const currentWorkoutRef = useRef<Workout | null>(null);
  currentWorkoutRef.current = currentWorkout;

  const setCurrentWorkout: Dispatch<SetStateAction<Workout | null>> =
    useCallback(
      (nextWorkout) => {
        const nextValue =
          typeof nextWorkout === "function"
            ? nextWorkout(currentWorkoutRef.current)
            : nextWorkout;

        currentWorkoutRef.current = nextValue;
        setCurrentWorkoutState(nextValue);
      },
      [],
    );
  const getCurrentWorkout = useCallback(
    () => currentWorkoutRef.current,
    [],
  );
  const pendingSetFlushes = useRef(new Set<() => void>());
  const registerPendingSetFlush = useCallback((flush: () => void) => {
    pendingSetFlushes.current.add(flush);
    return () => pendingSetFlushes.current.delete(flush);
  }, []);
  const flushPendingSetUpdates = useCallback(() => {
    pendingSetFlushes.current.forEach((flush) => flush());
  }, []);

  const [isEditingWorkout, setIsEditingWorkout] = useState(false);
  const [exerciseList, setExerciseList] = useState<Exercise[]>([]);
  const [history, setHistory] = useState<Workout[]>([]);
  const [workoutRoutines, setWorkoutRoutines] = useState<WorkoutRoutine[]>([]);
  const [workoutSplits, setWorkoutSplits] = useState<WorkoutSplit[]>([]);
  const [allowUnilateralExercises, setAllowUnilateralExercises] =
    useState(true);
  const availableExerciseList = useMemo(
    () => filterExercisesWithWorkoutHistory(exerciseList, history),
    [exerciseList, history],
  );
  const [routinesAndSplitsEnabled, setRoutinesAndSplitsEnabled] =
    useState(true);
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);
  const [hasLoadedSettings, setHasLoadedSettings] = useState(false);
  const isAppLoading = isAuthLoading || !hasLoadedStorage;

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

    const loadSettings = async () => {
      try {
        const [
          [, storedAllowUnilateralExercises],
          [, storedRoutinesAndSplitsEnabled],
        ] = await AsyncStorage.multiGet([
          ALLOW_UNILATERAL_EXERCISES_KEY,
          ROUTINES_AND_SPLITS_ENABLED_KEY,
        ]);

        if (!isMounted) return;

        setAllowUnilateralExercises(
          storedAllowUnilateralExercises === "false" ? false : true,
        );
        setRoutinesAndSplitsEnabled(
          storedRoutinesAndSplitsEnabled === "false" ? false : true,
        );
      } catch (error) {
        console.error(error);
      } finally {
        if (isMounted) setHasLoadedSettings(true);
      }
    };

    void loadSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedSettings) return;

    void AsyncStorage.setItem(
      ALLOW_UNILATERAL_EXERCISES_KEY,
      JSON.stringify(allowUnilateralExercises),
    );
  }, [allowUnilateralExercises, hasLoadedSettings]);

  useEffect(() => {
    if (!hasLoadedSettings) return;

    void AsyncStorage.setItem(
      ROUTINES_AND_SPLITS_ENABLED_KEY,
      JSON.stringify(routinesAndSplitsEnabled),
    );
  }, [hasLoadedSettings, routinesAndSplitsEnabled]);

  useEffect(() => {
    let isMounted = true;

    const loadWorkoutData = async () => {
      if (isAuthLoading) return;

      setHasLoadedStorage(false);

      if (!user) {
        const [
          [, storedWorkout],
          [, storedEditingWorkout],
          [, storedExercises],
          [, storedWorkouts],
          [, storedWorkoutRoutines],
          [, storedWorkoutSplits],
        ] = await AsyncStorage.multiGet([
          CURRENT_WORKOUT_KEY,
          EDITING_WORKOUT_KEY,
          EXERCISES_KEY,
          PAST_WORKOUTS_KEY,
          WORKOUT_ROUTINES_KEY,
          WORKOUT_SPLITS_KEY,
        ]);

        if (!isMounted) return;

        const parsedWorkout = parseStoredWorkout(storedWorkout);
        setCurrentWorkout(parsedWorkout);
        setIsEditingWorkout(storedEditingWorkout === "true" && !!parsedWorkout);
        setExerciseList(parseStoredExercises(storedExercises));
        setHistory(parseStoredWorkouts(storedWorkouts));
        setWorkoutRoutines(parseStoredWorkoutRoutines(storedWorkoutRoutines));
        setWorkoutSplits(parseStoredWorkoutSplits(storedWorkoutSplits));
        setHasLoadedStorage(true);
        return;
      }

      const [[, storedWorkout], [, storedEditingWorkout]] =
        await AsyncStorage.multiGet([
          currentWorkoutKey(user.uid),
          editingWorkoutKey(user.uid),
        ]);

      if (!isMounted) return;

      const parsedWorkout = parseStoredWorkout(storedWorkout);
      setCurrentWorkout(parsedWorkout);
      setIsEditingWorkout(storedEditingWorkout === "true" && !!parsedWorkout);
      setExerciseList([]);
      setHistory([]);
      setWorkoutRoutines([]);
      setWorkoutSplits([]);
      setHasLoadedStorage(true);
    };

    void loadWorkoutData();

    return () => {
      isMounted = false;
    };
  }, [isAuthLoading, setCurrentWorkout, user]);

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

    return watchWorkoutRoutines(user.uid, setWorkoutRoutines, (error) => {
      console.error(error);
      showAlert("Routine Sync Error", "Could not load your routines.");
    });
  }, [showAlert, user]);

  useEffect(() => {
    if (!user) return;

    return watchWorkoutSplits(user.uid, setWorkoutSplits, (error) => {
      console.error(error);
      showAlert("Split Sync Error", "Could not load your workout splits.");
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
      const editingStorageKey = user
        ? editingWorkoutKey(user.uid)
        : EDITING_WORKOUT_KEY;

      if (!currentWorkout) {
        await AsyncStorage.multiRemove([storageKey, editingStorageKey]);
        return;
      }

      await AsyncStorage.multiSet([
        [storageKey, JSON.stringify(currentWorkout)],
        [editingStorageKey, JSON.stringify(isEditingWorkout)],
      ]);
    };

    void persistCurrentWorkout();
  }, [
    currentWorkout,
    hasLoadedStorage,
    isAuthLoading,
    isEditingWorkout,
    user,
  ]);

  useEffect(() => {
    if (!hasLoadedStorage || isAuthLoading || user) return;

    void AsyncStorage.setItem(PAST_WORKOUTS_KEY, JSON.stringify(history));
  }, [hasLoadedStorage, history, isAuthLoading, user]);

  useEffect(() => {
    if (!hasLoadedStorage || isAuthLoading || user) return;

    void AsyncStorage.setItem(EXERCISES_KEY, JSON.stringify(exerciseList));
  }, [exerciseList, hasLoadedStorage, isAuthLoading, user]);

  const startWorkout = useCallback(() => {
    impactFeedback();
    setIsEditingWorkout(false);
    setCurrentWorkout({
      name: "New Workout",
      time: 0,
      date: new Date(),
      exercises: [],
    });
  }, [setCurrentWorkout]);

  const startEditingWorkout = useCallback((workout: Workout) => {
    selectionFeedback();
    setIsEditingWorkout(true);
    setCurrentWorkout(cloneWorkout(workout));
  }, [setCurrentWorkout]);

  const cancelWorkoutEdit = useCallback(() => {
    setIsEditingWorkout(false);
    setCurrentWorkout(null);
  }, [setCurrentWorkout]);

  useEffect(() => {
    if (!hasLoadedStorage || isAuthLoading || user) return;

    void AsyncStorage.setItem(
      WORKOUT_ROUTINES_KEY,
      JSON.stringify(workoutRoutines),
    );
  }, [hasLoadedStorage, isAuthLoading, user, workoutRoutines]);

  useEffect(() => {
    if (!hasLoadedStorage || isAuthLoading || user) return;

    void AsyncStorage.setItem(WORKOUT_SPLITS_KEY, JSON.stringify(workoutSplits));
  }, [hasLoadedStorage, isAuthLoading, user, workoutSplits]);

  const createWorkoutRoutine = useCallback(
    async (routine: WorkoutRoutineDraft) => {
      const normalizedRoutine = {
        ...routine,
        exercises: routine.exercises.map(normalizeRoutineExerciseTemplate),
      };

      if (!user) {
        const now = new Date();
        const routineId = createLocalId("routine");

        setWorkoutRoutines((prev) => [
          {
            ...normalizedRoutine,
            id: routineId,
            createdAt: now,
            updatedAt: now,
          },
          ...prev,
        ]);

        return routineId;
      }

      try {
        return await createFirestoreWorkoutRoutine(user.uid, normalizedRoutine);
      } catch (error) {
        console.error(error);
        showAlert("Save Failed", "Could not save this routine.");
        return null;
      }
    },
    [showAlert, user],
  );

  const updateWorkoutRoutine = useCallback(
    async (routineId: string, routine: WorkoutRoutineUpdate) => {
      const normalizedRoutine = routine.exercises
        ? {
            ...routine,
            exercises: routine.exercises.map(normalizeRoutineExerciseTemplate),
          }
        : routine;

      if (!user) {
        setWorkoutRoutines((prev) =>
          prev.map((existingRoutine) =>
            existingRoutine.id === routineId
              ? {
                  ...existingRoutine,
                  ...normalizedRoutine,
                  id: routineId,
                  updatedAt: new Date(),
                }
              : existingRoutine,
          ),
        );
        return;
      }

      try {
        await updateFirestoreWorkoutRoutine(
          user.uid,
          routineId,
          normalizedRoutine,
        );
      } catch (error) {
        console.error(error);
        showAlert("Save Failed", "Could not update this routine.");
      }
    },
    [showAlert, user],
  );

  const deleteWorkoutRoutine = useCallback(
    async (routineId: string) => {
      if (!user) {
        setWorkoutRoutines((prev) =>
          prev.filter((routine) => routine.id !== routineId),
        );
        setWorkoutSplits((prev) =>
          prev.map((split) => ({
            ...split,
            days: split.days.map((day) =>
              day.routineId === routineId
                ? { ...day, type: "rest", routineId: undefined }
                : day,
            ),
          })),
        );
        return;
      }

      try {
        await deleteFirestoreWorkoutRoutine(user.uid, routineId);
      } catch (error) {
        console.error(error);
        showAlert("Delete Failed", "Could not delete this routine.");
      }
    },
    [showAlert, user],
  );

  const createWorkoutSplit = useCallback(
    async (split: WorkoutSplitDraft) => {
      if (!user) {
        const now = new Date();
        const splitId = createLocalId("split");

        setWorkoutSplits((prev) => [
          {
            ...split,
            id: splitId,
            createdAt: now,
            updatedAt: now,
          },
          ...prev.map((existingSplit) =>
            split.isActive ? { ...existingSplit, isActive: false } : existingSplit,
          ),
        ]);

        return splitId;
      }

      try {
        return await createFirestoreWorkoutSplit(user.uid, split);
      } catch (error) {
        console.error(error);
        showAlert("Save Failed", "Could not save this split.");
        return null;
      }
    },
    [showAlert, user],
  );

  const updateWorkoutSplit = useCallback(
    async (splitId: string, split: WorkoutSplitUpdate) => {
      if (!user) {
        setWorkoutSplits((prev) =>
          prev.map((existingSplit) =>
            existingSplit.id === splitId
              ? {
                  ...existingSplit,
                  ...split,
                  id: splitId,
                  updatedAt: new Date(),
                }
              : existingSplit,
          ),
        );
        return;
      }

      try {
        await updateFirestoreWorkoutSplit(user.uid, splitId, split);
      } catch (error) {
        console.error(error);
        showAlert("Save Failed", "Could not update this split.");
      }
    },
    [showAlert, user],
  );

  const deleteWorkoutSplit = useCallback(
    async (splitId: string) => {
      if (!user) {
        setWorkoutSplits((prev) => prev.filter((split) => split.id !== splitId));
        return;
      }

      try {
        await deleteFirestoreWorkoutSplit(user.uid, splitId);
      } catch (error) {
        console.error(error);
        showAlert("Delete Failed", "Could not delete this split.");
      }
    },
    [showAlert, user],
  );

  const activateWorkoutSplit = useCallback(
    async (splitId: string, currentDayId?: string) => {
      if (!user) {
        setWorkoutSplits((prev) =>
          prev.map((split) => ({
            ...split,
            isActive: split.id === splitId,
            currentDayId: split.id === splitId ? currentDayId : undefined,
            updatedAt: split.id === splitId ? new Date() : split.updatedAt,
          })),
        );
        return;
      }

      try {
        await activateFirestoreWorkoutSplit(user.uid, splitId, currentDayId);
      } catch (error) {
        console.error(error);
        showAlert("Activation Failed", "Could not activate this split.");
      }
    },
    [showAlert, user],
  );

  const deactivateWorkoutSplit = useCallback(async () => {
    if (!user) {
      setWorkoutSplits((prev) =>
        prev.map((split) => ({
          ...split,
          isActive: false,
          currentDayId: undefined,
          updatedAt: split.isActive ? new Date() : split.updatedAt,
        })),
      );
      return;
    }

    try {
      await deactivateFirestoreWorkoutSplits(user.uid);
    } catch (error) {
      console.error(error);
      showAlert("Deactivation Failed", "Could not disable your active split.");
    }
  }, [showAlert, user]);

  const advanceSplitAfterWorkout = useCallback(
    async (workout: Workout) => {
      if (!workout.splitId || !workout.splitDayId) return;

      const split = workoutSplits.find((item) => item.id === workout.splitId);
      if (!split) return;

      const nextDayId = getNextSplitDayId(split, workout.splitDayId);
      if (!nextDayId) return;

      if (!user) {
        setWorkoutSplits((prev) =>
          prev.map((item) =>
            item.id === split.id
              ? { ...item, currentDayId: nextDayId, updatedAt: new Date() }
              : item,
          ),
        );
        return;
      }

      await updateFirestoreWorkoutSplit(user.uid, workout.splitId, {
        currentDayId: nextDayId,
      });
    },
    [user, workoutSplits],
  );

  const finishWorkout = useCallback(
    async (workout: Workout) => {
      const normalizedWorkout = migrateWorkoutToSetGroups(workout);

      if (!user) {
        setHistory((prev) => [...prev, normalizedWorkout]);
        setExerciseList((prev) =>
          mergeExerciseList(prev, normalizedWorkout.exercises),
        );
        setIsEditingWorkout(false);
        await advanceSplitAfterWorkout(normalizedWorkout);
        setCurrentWorkout(null);
        successFeedback();
        return;
      }

      try {
        await saveCompletedWorkout(user.uid, normalizedWorkout);
        await upsertExercises(user.uid, normalizedWorkout.exercises);
        setIsEditingWorkout(false);
        setCurrentWorkout(null);
        successFeedback();
      } catch (error) {
        console.error(error);
        warningFeedback();
        showAlert("Save Failed", "Could not save this workout to Firestore.");
        return;
      }

      try {
        await advanceSplitAfterWorkout(normalizedWorkout);
      } catch (error) {
        console.error(error);
        showAlert(
          "Split Update Failed",
          "Workout saved, but your active split did not advance.",
        );
      }

      setCurrentWorkout(null);
    },
    [advanceSplitAfterWorkout, setCurrentWorkout, showAlert, user],
  );

  const saveEditedWorkout = useCallback(
    async (workout: Workout) => {
      if (!user) {
        setHistory((prev) => replaceWorkout(prev, workout, workout));
        setExerciseList((prev) => mergeExerciseList(prev, workout.exercises));
        setIsEditingWorkout(false);
        setCurrentWorkout(null);
        successFeedback();
        return;
      }

      try {
        await updateCompletedWorkout(user.uid, workout);
        await upsertExercises(user.uid, workout.exercises);
        setHistory((prev) => replaceWorkout(prev, workout, workout));
        setIsEditingWorkout(false);
        setCurrentWorkout(null);
        successFeedback();
      } catch (error) {
        console.error(error);
        warningFeedback();
        showAlert("Save Failed", "Could not save these workout changes.");
      }
    },
    [setCurrentWorkout, showAlert, user],
  );

  const updateWorkoutName = useCallback(
    async (workout: Workout, name: string) => {
      const trimmedName = name.trim();
      if (!trimmedName) return false;

      const updatedWorkout = { ...workout, name: trimmedName };

      if (!user) {
        setHistory((prev) => replaceWorkout(prev, workout, updatedWorkout));
        return true;
      }

      try {
        await updateCompletedWorkout(user.uid, updatedWorkout);
        setHistory((prev) => replaceWorkout(prev, workout, updatedWorkout));
        return true;
      } catch (error) {
        console.error(error);
        showAlert("Save Failed", "Could not update this workout's name.");
        return false;
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
        warningFeedback();
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
      await AsyncStorage.multiRemove([
        currentWorkoutKey(user.uid),
        editingWorkoutKey(user.uid),
      ]);
      setIsEditingWorkout(false);
      setCurrentWorkout(null);
      setHistory([]);
      setExerciseList([]);
      setWorkoutRoutines([]);
      setWorkoutSplits([]);
    } catch (error) {
      console.error(error);
      showAlert("Clear Failed", "Could not clear your synced workout data.");
      throw error;
    }
  }, [setCurrentWorkout, showAlert, user]);

  const clearLoggedOutWorkoutData = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove([
        PAST_WORKOUTS_KEY,
        EXERCISES_KEY,
        WORKOUT_ROUTINES_KEY,
        WORKOUT_SPLITS_KEY,
      ]);
      setHistory([]);
      setExerciseList([]);
      setIsEditingWorkout(false);
      setWorkoutRoutines([]);
      setWorkoutSplits([]);
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
        isAppLoading,
        setCurrentWorkout,
        getCurrentWorkout,
        registerPendingSetFlush,
        flushPendingSetUpdates,
        isEditingWorkout,
        startWorkout,
        startEditingWorkout,
        cancelWorkoutEdit,
        exerciseList: availableExerciseList,
        history,
        workoutRoutines,
        workoutSplits,
        allowUnilateralExercises,
        setAllowUnilateralExercises,
        routinesAndSplitsEnabled,
        setRoutinesAndSplitsEnabled,
        createWorkoutRoutine,
        updateWorkoutRoutine,
        deleteWorkoutRoutine,
        createWorkoutSplit,
        updateWorkoutSplit,
        deleteWorkoutSplit,
        activateWorkoutSplit,
        deactivateWorkoutSplit,
        finishWorkout,
        saveEditedWorkout,
        updateWorkoutName,
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
