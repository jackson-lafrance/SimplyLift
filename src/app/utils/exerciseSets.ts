import type {
  Exercise,
  ExerciseSetGroup,
  ExerciseTrackingMode,
  Set,
} from "../context/appContext";

export type ExerciseSetSlot = "set" | "left" | "right";

const EMPTY_SET: Set = { reps: 0, weight: 0 };

export const cloneSet = (set: Partial<Set> | null | undefined): Set => {
  const clonedSet: Set = {
    reps: typeof set?.reps === "number" ? set.reps : 0,
    weight: typeof set?.weight === "number" ? set.weight : 0,
  };

  if (set?.type) clonedSet.type = set.type;
  if (typeof set?.rir === "number") clonedSet.rir = set.rir;

  return clonedSet;
};

const createSetGroupId = () =>
  `set-group-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const createEmptySetGroup = (
  trackingMode: ExerciseTrackingMode,
): ExerciseSetGroup =>
  trackingMode === "leftRight"
    ? {
        id: createSetGroupId(),
        type: "leftRight",
        left: cloneSet(EMPTY_SET),
        right: cloneSet(EMPTY_SET),
      }
    : {
        id: createSetGroupId(),
        type: "standard",
        set: cloneSet(EMPTY_SET),
      };

export const getPersistedExerciseTrackingMode = (
  exercise:
    | Pick<Exercise, "trackingMode" | "isUnilateral" | "setGroups">
    | null
    | undefined,
): ExerciseTrackingMode | undefined => {
  if (!exercise) return undefined;
  if (exercise.trackingMode === "leftRight") return "leftRight";
  if (exercise.trackingMode === "standard") return "standard";

  if (typeof exercise.isUnilateral === "boolean") {
    return exercise.isUnilateral ? "leftRight" : "standard";
  }

  if (
    exercise.setGroups?.some(
      (group) =>
        group.type === "leftRight" || "left" in group || "right" in group,
    )
  ) {
    return "leftRight";
  }

  return undefined;
};

export const getExerciseTrackingMode = (
  exercise:
    | Pick<Exercise, "trackingMode" | "isUnilateral" | "setGroups">
    | null
    | undefined,
): ExerciseTrackingMode =>
  getPersistedExerciseTrackingMode(exercise) ?? "standard";

type StoredExerciseSetGroup = Partial<ExerciseSetGroup> & {
  id?: string;
  type?: string;
  set?: Partial<Set>;
  left?: Partial<Set>;
  right?: Partial<Set>;
};

const getGroupId = (group: StoredExerciseSetGroup) =>
  group.id || createSetGroupId();

const normalizeStoredSetGroup = (
  group: StoredExerciseSetGroup,
): ExerciseSetGroup => {
  if (group.type === "leftRight" || group.left || group.right) {
    const fallbackSet = cloneSet(group.left ?? group.right ?? group.set);

    return {
      id: getGroupId(group),
      type: "leftRight",
      left: cloneSet(group.left ?? fallbackSet),
      right: cloneSet(group.right ?? fallbackSet),
    };
  }

  return {
    id: getGroupId(group),
    type: "standard",
    set: cloneSet(group.set ?? group.left ?? group.right),
  };
};

const createLegacySetGroups = (
  sets: Set[] | undefined,
  trackingMode: ExerciseTrackingMode,
): ExerciseSetGroup[] => {
  if (!sets?.length) return [];

  if (trackingMode === "leftRight") {
    const setGroups: ExerciseSetGroup[] = [];

    for (let setIndex = 0; setIndex < sets.length; setIndex += 2) {
      const leftSet = sets[setIndex];
      const rightSet = sets[setIndex + 1] ?? leftSet;

      setGroups.push({
        id: createSetGroupId(),
        type: "leftRight",
        left: cloneSet(leftSet),
        right: cloneSet(rightSet),
      });
    }

    return setGroups;
  }

  return sets.map((set) => ({
    id: createSetGroupId(),
    type: "standard",
    set: cloneSet(set),
  }));
};

const cloneSetGroupAsMode = (
  group: ExerciseSetGroup,
  trackingMode: ExerciseTrackingMode,
  preserveId: boolean,
): ExerciseSetGroup => {
  const id = preserveId ? group.id : createSetGroupId();

  if (trackingMode === "leftRight") {
    if (group.type === "leftRight") {
      return {
        id,
        type: "leftRight",
        left: cloneSet(group.left),
        right: cloneSet(group.right),
      };
    }

    const set = cloneSet(group.set);

    return {
      id,
      type: "leftRight",
      left: cloneSet(set),
      right: cloneSet(set),
    };
  }

  if (group.type === "standard") {
    return {
      id,
      type: "standard",
      set: cloneSet(group.set),
    };
  }

  return {
    id,
    type: "standard",
    set: cloneSet(group.left),
  };
};

export const convertSetGroupsForTrackingMode = (
  setGroups: ExerciseSetGroup[],
  trackingMode: ExerciseTrackingMode,
  options: { preserveIds?: boolean } = {},
): ExerciseSetGroup[] =>
  setGroups.map((group) =>
    cloneSetGroupAsMode(group, trackingMode, options.preserveIds ?? false),
  );

export const getExerciseSetGroups = (
  exercise: Exercise,
  options: { ensureAtLeastOne?: boolean } = {},
): ExerciseSetGroup[] => {
  const trackingMode = getExerciseTrackingMode(exercise);
  const existingSetGroups = exercise.setGroups?.length
    ? exercise.setGroups.map((group) =>
        normalizeStoredSetGroup(group as StoredExerciseSetGroup),
      )
    : createLegacySetGroups(exercise.sets, trackingMode);

  const setGroups = convertSetGroupsForTrackingMode(
    existingSetGroups,
    trackingMode,
    {
      preserveIds: true,
    },
  );

  if (setGroups.length || !options.ensureAtLeastOne) return setGroups;

  return [createEmptySetGroup(trackingMode)];
};

export const getDefaultSetGroupsForMode = (
  sourceExercise: Exercise | null | undefined,
  trackingMode: ExerciseTrackingMode,
): ExerciseSetGroup[] => {
  const sourceSetGroups = sourceExercise
    ? getExerciseSetGroups(sourceExercise)
    : [];
  const convertedSetGroups = convertSetGroupsForTrackingMode(
    sourceSetGroups,
    trackingMode,
  );

  return convertedSetGroups.length
    ? convertedSetGroups
    : [createEmptySetGroup(trackingMode)];
};

export const migrateExerciseSummary = (exercise: Exercise): Exercise => {
  const {
    sets: _legacySets,
    setGroups: _setGroups,
    isUnilateral: _legacyIsUnilateral,
    ...rest
  } = exercise;
  const trackingMode = getPersistedExerciseTrackingMode(exercise);

  return trackingMode
    ? {
        ...rest,
        trackingMode,
      }
    : rest;
};

export const migrateExerciseToSetGroups = (exercise: Exercise): Exercise => {
  const { sets: _legacySets, isUnilateral: _legacyIsUnilateral, ...rest } =
    exercise;
  const trackingMode = getExerciseTrackingMode(exercise);

  return {
    ...rest,
    trackingMode,
    setGroups: getExerciseSetGroups(exercise),
  };
};

export const migrateWorkoutToSetGroups = <T extends { exercises: Exercise[] }>(
  workout: T,
): T => ({
  ...workout,
  exercises: workout.exercises.map(migrateExerciseToSetGroups),
});

const withNormalizedSetGroups = (
  exercise: Exercise,
  nextSetGroups: ExerciseSetGroup[],
): Exercise => {
  const { sets: _legacySets, isUnilateral: _legacyIsUnilateral, ...rest } =
    exercise;

  return {
    ...rest,
    trackingMode: getExerciseTrackingMode(exercise),
    setGroups: nextSetGroups,
  };
};

export const addSetGroupToExercise = (exercise: Exercise): Exercise => {
  const trackingMode = getExerciseTrackingMode(exercise);
  const setGroups = getExerciseSetGroups(exercise);
  const lastSetGroup =
    setGroups[setGroups.length - 1] ?? createEmptySetGroup(trackingMode);

  return withNormalizedSetGroups(exercise, [
    ...setGroups,
    cloneSetGroupAsMode(lastSetGroup, trackingMode, false),
  ]);
};

export const removeSetGroupFromExercise = (
  exercise: Exercise,
  setGroupId: string,
): Exercise =>
  withNormalizedSetGroups(
    exercise,
    getExerciseSetGroups(exercise).filter((group) => group.id !== setGroupId),
  );

export const updateExerciseSetInGroup = (
  exercise: Exercise,
  setGroupId: string,
  setSlot: ExerciseSetSlot,
  updateSet: (set: Set) => Set,
): Exercise =>
  withNormalizedSetGroups(
    exercise,
    getExerciseSetGroups(exercise).map((group) => {
      if (group.id !== setGroupId) return group;

      if (group.type === "standard") {
        return {
          ...group,
          set: setSlot === "set" ? updateSet(group.set) : group.set,
        };
      }

      if (setSlot === "left") {
        return {
          ...group,
          left: updateSet(group.left),
        };
      }

      if (setSlot === "right") {
        return {
          ...group,
          right: updateSet(group.right),
        };
      }

      return group;
    }),
  );
