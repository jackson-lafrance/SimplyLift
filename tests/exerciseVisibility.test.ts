import assert from "node:assert/strict";
import test from "node:test";
import { filterExercisesWithWorkoutHistory } from "../src/app/utils/exerciseVisibility.ts";

test("filters saved exercises to names present in remaining workouts", () => {
  const exercises = [
    { name: "Bench Press", isUnilateral: false },
    { name: "Unused Exercise", isUnilateral: false },
    { name: "Squat", isUnilateral: false },
  ];
  const workouts = [
    { exercises: [{ name: "bench press" }] },
    { exercises: [{ name: "  SQUAT  " }] },
  ];

  assert.deepEqual(filterExercisesWithWorkoutHistory(exercises, workouts), [
    exercises[0],
    exercises[2],
  ]);
});

test("removes an exercise after its last workout is deleted", () => {
  const exercises = [{ name: "Bench Press" }, { name: "Deadlift" }];

  assert.deepEqual(
    filterExercisesWithWorkoutHistory(exercises, [
      { exercises: [{ name: "Bench Press" }] },
    ]),
    [exercises[0]],
  );
  assert.deepEqual(filterExercisesWithWorkoutHistory(exercises, []), []);
});
