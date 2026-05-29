import type { Exercise, Set, SetType } from "../context/appContext";

export type SetTypeOption = SetType | "normal";
export type SetSideLabel = "L" | "R";

export interface SetDisplayRow {
  set: Set;
  setIndex: number;
  displaySetNumber: number;
  sideLabel?: SetSideLabel;
}

export const SET_TYPE_COLORS: Record<SetTypeOption, string> = {
  normal: "black",
  warmup: "#FF9500",
  failure: "#FF3B30",
  rir: "#5856D6",
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

export const getSetDisplayRows = (exercise: Exercise): SetDisplayRow[] =>
  (exercise.sets ?? []).map((set, setIndex) => ({
    set,
    setIndex,
    displaySetNumber: exercise.isUnilateral
      ? Math.floor(setIndex / 2) + 1
      : setIndex + 1,
    sideLabel: exercise.isUnilateral
      ? setIndex % 2 === 0
        ? "L"
        : "R"
      : undefined,
  }));

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
