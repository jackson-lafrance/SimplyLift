import {
  cloneWorkout,
  formatWorkoutDuration,
  isSameWorkout,
  parseWorkoutDuration,
  replaceWorkout,
} from "../src/app/utils/workoutEditing";
import type { Workout } from "../src/app/context/appContext";

const createWorkout = (overrides: Partial<Workout> = {}): Workout => ({
  id: "workout-1",
  name: "Leg Day",
  time: 3_723_000,
  date: new Date("2026-08-06T12:00:00.000Z"),
  exercises: [
    {
      name: "Squat",
      isUnilateral: false,
      sets: [{ weight: 135, reps: 5, type: "warmup" }],
    },
  ],
  ...overrides,
});

describe("workout editing helpers", () => {
  it("round-trips editable workout durations", () => {
    expect(formatWorkoutDuration(3_723_000)).toBe("01:02:03");
    expect(parseWorkoutDuration("01:02:03")).toBe(3_723_000);
    expect(parseWorkoutDuration("00:00:00")).toBe(0);
  });

  it("rejects malformed or out-of-range durations", () => {
    expect(parseWorkoutDuration("1:60:00")).toBeNull();
    expect(parseWorkoutDuration("01:02")).toBeNull();
    expect(parseWorkoutDuration("01:aa:03")).toBeNull();
  });

  it("clones workout exercises before editing", () => {
    const workout = createWorkout();
    const clone = cloneWorkout(workout);

    clone.exercises[0].name = "Front Squat";
    clone.exercises[0].sets![0].reps = 8;

    expect(workout.exercises[0].name).toBe("Squat");
    expect(workout.exercises[0].sets![0].reps).toBe(5);
  });

  it("replaces the edited workout without changing other history", () => {
    const original = createWorkout();
    const updated = cloneWorkout(original);
    updated.name = "Updated Leg Day";
    updated.time = 900_000;
    updated.exercises[0].sets![0].reps = 8;
    updated.exercises[0].sets![0].type = "rir";
    updated.exercises[0].sets![0].rir = 2;
    const other = createWorkout({ id: "workout-2", name: "Push Day" });

    expect(isSameWorkout(original, updated)).toBe(true);
    expect(replaceWorkout([original, other], original, updated)).toEqual([
      updated,
      other,
    ]);
  });
});
