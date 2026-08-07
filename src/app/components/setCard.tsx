import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
} from "react-native";
import { useAppContext } from "../context/appContext";
import type { Set } from "../context/appContext";
import { useCallback, useEffect, useRef, useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import {
  formatSetDisplayLabel,
  getSetNumberColor,
  RIR_COLORS,
  RIR_OPTIONS,
  SET_TYPE_COLORS,
  type SetSideLabel,
  type SetTypeOption,
} from "../utils/setDisplay";
import {
  impactFeedback,
  selectionFeedback,
  warningFeedback,
} from "../utils/feedback";

export interface setProps {
  set: Set;
  setIndex: number;
  displaySetNumber: number;
  sideLabel?: SetSideLabel;
  exerciseName: string;
  isUnilateral?: boolean;
}

export default function SetCard({
  set,
  setIndex,
  displaySetNumber,
  sideLabel,
  exerciseName,
  isUnilateral = false,
}: setProps) {
  const {
    setCurrentWorkout,
    registerPendingSetFlush,
  } = useAppContext();

  const [oldWeightText, setOldWeightText] = useState("0");
  const [oldRepText, setOldRepText] = useState("0");
  const [weightText, setWeightText] = useState(set?.weight.toString() || "0");
  const [repText, setRepText] = useState(set?.reps.toString() || "0");

  const [isTypePickerVisible, setIsTypePickerVisible] = useState(false);
  const [focusedField, setFocusedField] = useState<"weight" | "reps" | null>(
    null,
  );
  const pendingUpdate = useRef<{
    value: string;
    field: "weight" | "reps";
  } | null>(null);
  const pendingUpdateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applyUpdate = useCallback((value: string, field: "weight" | "reps") => {
    const numValue = parseFloat(value) || 0;

    setCurrentWorkout((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        exercises: prev.exercises.map((ex) => {
          if (ex.name !== exerciseName) return ex;

          return {
            ...ex,
            sets: ex.sets?.map((se, index) => {
              if (index !== setIndex) return se;

              return { ...se, [field]: numValue };
            }),
          };
        }),
      };
    });
  }, [exerciseName, setCurrentWorkout, setIndex]);

  const flushPendingUpdate = useCallback(() => {
    if (pendingUpdateTimer.current) {
      clearTimeout(pendingUpdateTimer.current);
      pendingUpdateTimer.current = null;
    }

    const update = pendingUpdate.current;
    pendingUpdate.current = null;

    if (update) applyUpdate(update.value, update.field);
  }, [applyUpdate]);

  const commitUpdate = (value: string, field: "weight" | "reps") => {
    if (pendingUpdateTimer.current) {
      clearTimeout(pendingUpdateTimer.current);
      pendingUpdateTimer.current = null;
    }
    pendingUpdate.current = null;
    applyUpdate(value, field);
  };

  useEffect(() => {
    const unregister = registerPendingSetFlush(flushPendingUpdate);

    return () => {
      unregister();
      flushPendingUpdate();
    };
  }, [flushPendingUpdate, registerPendingSetFlush]);

  const handleInputFocus = (field: "weight" | "reps") => {
    impactFeedback();
    setFocusedField(field);
    if (field === "weight") {
      setOldWeightText(set?.weight.toString() || "0");
      setWeightText("");
    }

    if (field === "reps") {
      setOldRepText(set?.reps.toString() || "0");
      setRepText("");
    }
  };

  const handleInputBlur = (field: "weight" | "reps") => {
    setFocusedField(null);

    const value = field === "weight" ? weightText : repText;
    const fallback = field === "weight" ? oldWeightText : oldRepText;
    const nextValue = value === "" ? fallback : value;

    if (value === "") {
      if (field === "weight") setWeightText(fallback);
      if (field === "reps") setRepText(fallback);
    }

    commitUpdate(nextValue, field);
  };

  const handleUpdate = (value: string, field: "weight" | "reps") => {
    if (field === "weight") setWeightText(value);
    if (field === "reps") setRepText(value);

    pendingUpdate.current = { value, field };
    if (pendingUpdateTimer.current) {
      clearTimeout(pendingUpdateTimer.current);
    }
    pendingUpdateTimer.current = setTimeout(flushPendingUpdate, 100);
  };

  const handleTypeUpdate = (type: SetTypeOption, rir?: number) => {
    selectionFeedback();
    setCurrentWorkout((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        exercises: prev.exercises.map((ex) => {
          if (ex.name !== exerciseName) return ex;

          return {
            ...ex,
            sets: ex.sets?.map((se, index) => {
              if (index !== setIndex) return se;

              const { type: _oldType, rir: _oldRir, ...baseSet } = se;

              if (type === "normal") {
                return baseSet;
              }

              if (type === "rir") {
                return {
                  ...baseSet,
                  type: "rir",
                  rir: rir ?? 0,
                };
              }

              return {
                ...baseSet,
                type,
              };
            }),
          };
        }),
      };
    });

    setIsTypePickerVisible(false);
  };

  const setLabel = formatSetDisplayLabel(displaySetNumber, sideLabel);

  return (
    <View style={styles.container}>
      <View style={styles.numberCol}>
        <Pressable
          style={({ pressed }) => [
            styles.setNumberButton,
            pressed && styles.setNumberButtonPressed,
          ]}
          onPress={() => {
            impactFeedback();
            setIsTypePickerVisible(true);
          }}
        >
          <Text style={[styles.setNumber, { color: getSetNumberColor(set) }]}>{setLabel}</Text>

          {set.type === "rir" && typeof set.rir === "number" && (
            <Text style={[styles.rirLabel, { color: getSetNumberColor(set) }]}>{set.rir}</Text>
          )}
        </Pressable>
      </View>
      <View style={styles.inputCol}>
        <TextInput
          style={[styles.input, focusedField === "weight" && styles.inputFocused]}
          keyboardType="numeric"
          onFocus={() => handleInputFocus("weight")}
          onBlur={() => handleInputBlur("weight")}
          onChangeText={(text) => handleUpdate(text, "weight")}
          value={weightText}
          placeholder={oldWeightText}
          placeholderTextColor="#C7C7CC"
        />
      </View>

      <View style={styles.inputCol}>
        <TextInput
          style={[styles.input, focusedField === "reps" && styles.inputFocused]}
          keyboardType="numeric"
          onFocus={() => handleInputFocus("reps")}
          onBlur={() => handleInputBlur("reps")}
          onChangeText={(text) => handleUpdate(text, "reps")}
          value={repText}
          placeholder={oldRepText}
          placeholderTextColor="#C7C7CC"
        />
      </View>

      <Pressable
        style={styles.removeButton}
        onPress={() => {
          warningFeedback();
          setCurrentWorkout((prev) => {
            if (!prev) return prev;

            const firstPairIndex = setIndex - (setIndex % 2);
            const indexesToRemove = isUnilateral
              ? [firstPairIndex, firstPairIndex + 1]
              : [setIndex];

            return {
              ...prev,
              exercises: prev.exercises.map((exe) => {
                if (exe.name === exerciseName) {
                  return {
                    ...exe,
                    sets: exe.sets?.filter(
                      (_, index) => !indexesToRemove.includes(index),
                    ),
                  };
                }
                return exe;
              }),
            };
          });
        }}
      >
        {({ pressed }: { pressed: boolean }) => (
          <MaterialIcons
            name="close"
            size={16}
            color={pressed ? "#FF3B30" : "#8E8E93"}
          />
        )}
      </Pressable>
      <Modal
        transparent
        visible={isTypePickerVisible}
        animationType="fade"
        onRequestClose={() => setIsTypePickerVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setIsTypePickerVisible(false)}
        >
          <View style={styles.typePickerCard}>
            <Text style={styles.typePickerTitle}>Set Type</Text>

            <Pressable
              style={styles.typeOption}
              onPress={() => handleTypeUpdate("normal")}
            >
              <Text
                style={[
                  styles.typeOptionText,
                  { color: SET_TYPE_COLORS.normal },
                ]}
              >
                Normal
              </Text>
            </Pressable>

            <Pressable
              style={styles.typeOption}
              onPress={() => handleTypeUpdate("warmup")}
            >
              <Text
                style={[
                  styles.typeOptionText,
                  { color: SET_TYPE_COLORS.warmup },
                ]}
              >
                Warmup
              </Text>
            </Pressable>

            <Pressable
              style={styles.typeOption}
              onPress={() => handleTypeUpdate("failure")}
            >
              <Text
                style={[
                  styles.typeOptionText,
                  { color: SET_TYPE_COLORS.failure },
                ]}
              >
                Failure
              </Text>
            </Pressable>

            <Text style={styles.rirPickerTitle}>RIR</Text>

            <View style={styles.rirOptions}>
              {RIR_OPTIONS.map((rir) => (
                <Pressable
                  key={rir}
                  style={[styles.rirOption, { borderColor: RIR_COLORS[rir] }]}
                  onPress={() => handleTypeUpdate("rir", rir)}
                >
                  <Text style={[styles.rirOptionText, { color: RIR_COLORS[rir] }]}>{rir}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    gap: 8,
  },
  numberCol: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  setNumberButton: {
    minWidth: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  setNumberButtonPressed: {
    backgroundColor: "#F2F2F7",
    borderRadius: 6,
  },
  setNumber: {
    fontSize: 14,
    fontWeight: "800",
    color: "black",
    textAlign: "center",
    lineHeight: 16,
  },
  rirLabel: {
    marginTop: 2,
    width: "100%",
    fontSize: 8,
    fontWeight: "900",
    textAlign: "center",
    lineHeight: 10,
    color: "#5856D6",
  },
  inputCol: {
    flex: 1,
  },
  input: {
    backgroundColor: "#F2F2F7",
    paddingVertical: 10,
    borderRadius: 6,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    color: "black",
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  inputFocused: {
    borderColor: "black",
    backgroundColor: "white",
  },
  removeButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  typePickerCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "black",
    padding: 20,
  },
  typePickerTitle: {
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 12,
    textTransform: "uppercase",
    color: "black",
  },
  typeOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  typeOptionText: {
    fontSize: 16,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  rirPickerTitle: {
    marginTop: 16,
    marginBottom: 8,
    fontSize: 12,
    fontWeight: "900",
    color: "#8E8E93",
    textTransform: "uppercase",
  },
  rirOptions: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  rirOption: {
    width: 42,
    height: 42,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#5856D6",
    alignItems: "center",
    justifyContent: "center",
  },
  rirOptionText: {
    color: "#5856D6",
    fontWeight: "900",
  },
});
