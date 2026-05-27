import type { Set, SetType } from "../context/appContext";

export type SetTypeOption = SetType | "normal";

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

export const getSetNumberColor = (set: Set) => {
  if (set.type === "rir") {
    return RIR_COLORS[set.rir ?? 0] ?? SET_TYPE_COLORS.rir;
  }

  return SET_TYPE_COLORS[set.type ?? "normal"];
};
