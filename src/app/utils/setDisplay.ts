import type { Exercise, Set, SetType } from "../context/appContext";
import {
  getExerciseSetGroups,
  type ExerciseSetSlot,
} from "./exerciseSets";

export type SetTypeOption = SetType | "normal";
export type SetSideLabel = "L" | "R";
export type SetSlot = ExerciseSetSlot;

export interface SetDisplayRow {
  rowId: string;
  set: Set;
  groupId: string;
  setSlot: SetSlot;
  displaySetNumber: number;
  sideLabel?: SetSideLabel;
}

export interface SetDisplayGroup {
  groupId: string;
  groupType: "standard" | "leftRight";
  displaySetNumber: number;
  rows: SetDisplayRow[];
}

export const SET_TYPE_COLORS: Record<SetTypeOption, string> = {
  normal: "black",
  warmup: "#FF9500",
  failure: "#FF3B30",
  rir: "#5856D6",
  dropset: "#34C759",
};

export const RIR_COLORS: Record<number, string> = {
  0: "#3D1A78",
  1: "#4B2A91",
  2: "#5856D6",
  3: "#6E6BE8",
  4: "#8B89F0",
  5: "#AAA8F7",
};

export const RIR_OPTIONS = [0, 1, 2, 3, 4, 5];

export const getSetDisplayGroups = (exercise: Exercise): SetDisplayGroup[] =>
  getExerciseSetGroups(exercise).map((setGroup, setGroupIndex) => {
    const displaySetNumber = setGroupIndex + 1;

    if (setGroup.type === "leftRight") {
      return {
        groupId: setGroup.id,
        groupType: "leftRight" as const,
        displaySetNumber,
        rows: [
          {
            rowId: `${setGroup.id}:left`,
            set: setGroup.left,
            groupId: setGroup.id,
            setSlot: "left" as const,
            displaySetNumber,
            sideLabel: "L" as const,
          },
          {
            rowId: `${setGroup.id}:right`,
            set: setGroup.right,
            groupId: setGroup.id,
            setSlot: "right" as const,
            displaySetNumber,
            sideLabel: "R" as const,
          },
        ],
      };
    }

    return {
      groupId: setGroup.id,
      groupType: "standard" as const,
      displaySetNumber,
      rows: [
        {
          rowId: `${setGroup.id}:set`,
          set: setGroup.set,
          groupId: setGroup.id,
          setSlot: "set" as const,
          displaySetNumber,
        },
      ],
    };
  });

export const getSetDisplayRows = (exercise: Exercise): SetDisplayRow[] =>
  getSetDisplayGroups(exercise).flatMap((group) => group.rows);

export const formatSetDisplayLabel = (
  displaySetNumber: number,
  sideLabel?: SetSideLabel,
) => `${displaySetNumber}${sideLabel ?? ""}`;

export const getSetNumberColor = (set: Set) => {
  if (set.type === "rir") {
    return RIR_COLORS[set.rir ?? 0] ?? SET_TYPE_COLORS.rir;
  }

  return SET_TYPE_COLORS[set.type ?? "normal"];
};

export const getSetTypeDetailLabel = (set: Set) => {
  if (set.type === "rir" && typeof set.rir === "number") {
    return set.rir.toString();
  }

  if (set.type === "dropset") return "DROP";

  return undefined;
};
