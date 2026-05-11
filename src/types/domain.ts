export type WeightUnit = "lbs" | "kg";
export type WorkoutSource = "mobile" | "terminal";

export interface WorkoutSet {
  reps: number;
  weight: number;
}

export interface Exercise {
  exerciseId?: string | null;
  name: string;
  normalizedName?: string;
  sets?: WorkoutSet[];
}

export interface ExerciseListItem {
  id: string;
  name: string;
  normalizedName: string;
  isArchived: boolean;
}

export interface Workout {
  id?: string;
  name: string;
  time: number;
  date: Date;
  exercises: Exercise[];
  source: WorkoutSource;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  units: WeightUnit;
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt: Date;
}
