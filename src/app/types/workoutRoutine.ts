import type { SetType } from "../context/appContext";

export const WORKOUT_ROUTINE_WEEKDAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

export type WorkoutRoutineWeekday =
  (typeof WORKOUT_ROUTINE_WEEKDAYS)[number];

export type WorkoutRoutineScheduleType = "splitOrder" | "daysOfWeek";
export type WorkoutRoutineDayType = "workout" | "rest";

export interface WorkoutRoutineSetTarget {
  id: string;
  type?: SetType;
  targetReps?: number;
  minReps?: number;
  maxReps?: number;
  targetWeight?: number;
  rir?: number;
  notes?: string;
}

export interface WorkoutRoutineExerciseTemplate {
  id: string;
  name: string;
  isUnilateral?: boolean;
  notes?: string;
  targetSets: WorkoutRoutineSetTarget[];
}

export interface WorkoutRoutineDayTemplate {
  id: string;
  name: string;
  type: WorkoutRoutineDayType;
  notes?: string;
  exercises: WorkoutRoutineExerciseTemplate[];
}

export interface WorkoutRoutineSplitOrderSchedule {
  type: "splitOrder";
  splitDayIds: string[];
  startDate?: string;
}

export interface WorkoutRoutineWeekdayAssignment {
  weekday: WorkoutRoutineWeekday;
  dayId: string;
}

export interface WorkoutRoutineDaysOfWeekSchedule {
  type: "daysOfWeek";
  assignments: WorkoutRoutineWeekdayAssignment[];
}

export type WorkoutRoutineSchedule =
  | WorkoutRoutineSplitOrderSchedule
  | WorkoutRoutineDaysOfWeekSchedule;

export interface WorkoutRoutine {
  id?: string;
  name: string;
  description?: string;
  isActive: boolean;
  schedule: WorkoutRoutineSchedule;
  days: WorkoutRoutineDayTemplate[];
  createdAt?: Date;
  updatedAt?: Date;
}

export type WorkoutRoutineDraft = Omit<
  WorkoutRoutine,
  "id" | "createdAt" | "updatedAt"
>;

export type WorkoutRoutineUpdate = Partial<WorkoutRoutineDraft>;
