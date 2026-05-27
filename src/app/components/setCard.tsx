import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
} from "react-native";
import { Set, useAppContext } from "../context/appContext";
import { useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import {
  getSetNumberColor,
  RIR_COLORS,
  RIR_OPTIONS,
  SET_TYPE_COLORS,
  SetTypeOption,
} from "../utils/setDisplay";

export interface setProps {
  set: Set;
  setNumber: number;
  exerciseName: string;
}

export default function SetCard({ set, setNumber, exerciseName }: setProps) {
  const { currentWorkout, setCurrentWorkout } = useAppContext();

  const [oldWeightText, setOldWeightText] = useState("0");
  const [oldRepText, setOldRepText] = useState("0");
  const [weightText, setWeightText] = useState(set?.weight.toString() || "0");
  const [repText, setRepText] = useState(set?.reps.toString() || "0");

  const [isTypePickerVisible, setIsTypePickerVisible] = useState(false);

  const handleInputFocus = (field: "weight" | "reps") => {
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
    if (field === "weight" && weightText === "") {
      handleUpdate(oldWeightText, "weight");
    }

    if (field === "reps" && repText === "") {
      handleUpdate(oldRepText, "reps");
    }
  };

  const handleUpdate = (value: string, field: "weight" | "reps") => {
    if (field === "weight") setWeightText(value);
    if (field === "reps") setRepText(value);

    if (!currentWorkout) return;

    const numValue = parseFloat(value) || 0;

    setCurrentWorkout({
      ...currentWorkout,
      exercises: currentWorkout.exercises.map((ex) => {
        if (ex.name !== exerciseName) return ex;

        return {
          ...ex,
          sets: ex.sets?.map((se, index) => {
            if (index !== setNumber - 1) return se;

            return { ...se, [field]: numValue };
          }),
        };
      }),
    });
  };

  const handleTypeUpdate = (type: SetTypeOption, rir?: number) => {
    setCurrentWorkout((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        exercises: prev.exercises.map((ex) => {
          if (ex.name !== exerciseName) return ex;

          return {
            ...ex,
            sets: ex.sets?.map((se, index) => {
              if (index !== setNumber - 1) return se;

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

  return (
    <View style={styles.container}>
      <View style={styles.numberCol}>
        <Pressable
          style={styles.setNumberButton}
          onPress={() => setIsTypePickerVisible(true)}
        >
          <Text style={[styles.setNumber, { color: getSetNumberColor(set) }]}>{setNumber}</Text>

          {set.type === "rir" && typeof set.rir === "number" && (
            <Text style={[styles.rirLabel, { color: getSetNumberColor(set) }]}>{set.rir}</Text>
          )}
        </Pressable>
      </View>
      <View style={styles.inputCol}>
        <TextInput
          style={styles.input}
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
          style={styles.input}
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
        onPress={() =>
          setCurrentWorkout((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              exercises: prev.exercises.map((exe) => {
                if (exe.name === exerciseName) {
                  return {
                    ...exe,
                    sets: exe.sets?.filter(
                      (_, index) => index !== setNumber - 1,
                    ),
                  };
                }
                return exe;
              }),
            };
          })
        }
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
