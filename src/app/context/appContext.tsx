import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CustomAlert, { AlertButton } from "../components/customAlert";

export interface Set {
  reps: number;
  weight: number;
}

export interface Exercise {
  name: string;
  sets?: Set[]
}

export interface Workout {
  name: string;
  time: number;
  date: Date;
  exercises: Exercise[];
}

interface AppContextType {
  currentWorkout: Workout | null;
  setCurrentWorkout: Dispatch<SetStateAction<Workout | null>>;
  exerciseList: Exercise[];
  setExerciseList: Dispatch<SetStateAction<Exercise[]>>;
  history: Workout[];
  setHistory: Dispatch<SetStateAction<Workout[]>>;
  showAlert: (title: string, message?: string, buttons?: AlertButton[]) => void;
}

export const AppContext = createContext<AppContextType | null>(null);

export default function AppProvider({ children }: { children: ReactNode }) {
  const [currentWorkout, setCurrentWorkout] = useState<Workout | null>(null);
  const [exerciseList, setExerciseList] = useState<Exercise[]>([]);
  const [history, setHistory] = useState<Workout[]>([]);
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);

  // Alert state
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
    const loadWorkoutData = async () => {
      const w = await AsyncStorage.getItem("currentWorkout");
      const e = await AsyncStorage.getItem("exercises");
      const p = await AsyncStorage.getItem("pastWorkouts");

      const parsedWorkout = w ? JSON.parse(w) : null;
      setCurrentWorkout(
        parsedWorkout
          ? { ...parsedWorkout, date: new Date(parsedWorkout.date) }
          : null,
      );
      const parsedHistory = p ? JSON.parse(p) : [];
      setHistory(
        parsedHistory.map((workout: any) => ({
          ...workout,
          date: new Date(workout.date),
        })),
      );
      setExerciseList(e ? (JSON.parse(e) as Exercise[]) : []);

      setHasLoadedStorage(true);
    };

    loadWorkoutData();
  }, []);

  useEffect(() => {
    if (!hasLoadedStorage) return;
    AsyncStorage.setItem("pastWorkouts", JSON.stringify(history));
  }, [history, hasLoadedStorage]);

  useEffect(() => {
    if (!hasLoadedStorage) return;
    AsyncStorage.setItem("exercises", JSON.stringify(exerciseList));
  }, [exerciseList, hasLoadedStorage]);

  useEffect(() => {
    if (!hasLoadedStorage) return;
    AsyncStorage.setItem("currentWorkout", JSON.stringify(currentWorkout));
  }, [currentWorkout, hasLoadedStorage]);

  return (
    <AppContext.Provider
      value={{
        currentWorkout,
        setCurrentWorkout,
        exerciseList,
        setExerciseList,
        history,
        setHistory,
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
