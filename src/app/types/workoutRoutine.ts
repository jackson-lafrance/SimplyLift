export type WorkoutSplitDayType = "routine" | "rest";

export interface WorkoutRoutineExerciseTemplate {
  id: string;
  name: string;
  isUnilateral?: boolean;
  notes?: string;
}

export interface WorkoutRoutine {
  id?: string;
  name: string;
  exercises: WorkoutRoutineExerciseTemplate[];
  createdAt?: Date;
  updatedAt?: Date;
}

export type WorkoutRoutineDraft = Omit<
  WorkoutRoutine,
  "id" | "createdAt" | "updatedAt"
>;

export type WorkoutRoutineUpdate = Partial<WorkoutRoutineDraft>;

export interface WorkoutSplitDay {
  id: string;
  type: WorkoutSplitDayType;
  routineId?: string;
}

export interface WorkoutSplitOrderSchedule {
  type: "splitOrder";
  dayIds: string[];
}

export type WorkoutSplitSchedule = WorkoutSplitOrderSchedule;

export interface WorkoutSplit {
  id?: string;
  name: string;
  isActive: boolean;
  currentDayId?: string;
  schedule: WorkoutSplitSchedule;
  days: WorkoutSplitDay[];
  createdAt?: Date;
  updatedAt?: Date;
}

export type WorkoutSplitDraft = Omit<
  WorkoutSplit,
  "id" | "createdAt" | "updatedAt"
>;

export type WorkoutSplitUpdate = Partial<WorkoutSplitDraft>;
