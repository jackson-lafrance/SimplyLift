import { MaterialIcons } from "@expo/vector-icons";
import {
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
} from "react-native";
import { useAppContext } from "../context/appContext";
import type { Exercise } from "../context/appContext";
import { getSetDisplayRows } from "../utils/setDisplay";
import {
  addSetGroupToExercise,
  getExerciseTrackingMode,
} from "../utils/exerciseSets";
import SetCard from "./setCard";
import { memo, useEffect, useState } from "react";
import { impactFeedback, selectionFeedback, warningFeedback } from "../utils/feedback";

export interface ExerciseCardProps {
  exercise: Exercise;
}

function ExerciseCard({ exercise }: ExerciseCardProps) {
  const [dropdowned, setDropdowned] = useState(false);
  const { setCurrentWorkout, showAlert } = useAppContext();

  useEffect(() => {
    if (
      Platform.OS === "android" &&
      UIManager.setLayoutAnimationEnabledExperimental
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const toggleDropdown = () => {
    selectionFeedback();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDropdowned((prev) => !prev);
  };

  const handleAddSet = () => {
    impactFeedback();
    setCurrentWorkout((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        exercises: prev.exercises.map((ex) => {
          if (ex.name !== exercise.name) return ex;

          return addSetGroupToExercise(ex);
        }),
      };
    });
  };

  const handleRemoveExercise = () => {
    warningFeedback();
    showAlert(
      "Remove Exercise",
      `Remove ${exercise.name} from this workout?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            setCurrentWorkout((prev) => {
              if (!prev) return prev;

              return {
                ...prev,
                exercises: prev.exercises.filter(
                  (ex) => ex.name !== exercise.name,
                ),
              };
            });
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, dropdowned && styles.closedContainer]}>
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [
            styles.headerToggle,
            pressed && styles.headerTogglePressed,
          ]}
          onPress={toggleDropdown}
        >
          <View style={styles.nameContainer}>
            <Text style={styles.name} numberOfLines={2}>{exercise.name}</Text>
            {getExerciseTrackingMode(exercise) === "leftRight" && (
              <Text style={styles.unilateralBadge}>Left / Right</Text>
            )}
          </View>
          <MaterialIcons
            name={dropdowned ? "keyboard-arrow-down" : "keyboard-arrow-up"}
            size={24}
            color="black"
          />
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.removeExerciseButton,
            pressed && styles.removeExerciseButtonPressed,
          ]}
          onPress={handleRemoveExercise}
        >
          {({ pressed }: { pressed: boolean }) => (
            <MaterialIcons
              name="delete-outline"
              size={22}
              color={pressed ? "#FF3B30" : "black"}
            />
          )}
        </Pressable>
      </View>

      {!dropdowned && (
        <View style={styles.setsContainer}>
          <View style={styles.setsHeader}>
            <Text style={styles.setsHeaderLabel}>SET</Text>
            <Text style={styles.setsHeaderLabel}>LBS</Text>
            <Text style={styles.setsHeaderLabel}>REPS</Text>
            <View style={{ width: 32 }} />
          </View>

          {getSetDisplayRows(exercise).map(
            ({ rowId, set, groupId, setSlot, displaySetNumber, sideLabel }) => (
              <SetCard
                key={rowId}
                set={set}
                groupId={groupId}
                setSlot={setSlot}
                displaySetNumber={displaySetNumber}
                sideLabel={sideLabel}
                exerciseName={exercise.name}
              />
            ),
          )}

          <Pressable
            style={({ pressed }) => [
              styles.addSetButton,
              pressed && styles.addSetButtonPressed,
            ]}
            onPress={handleAddSet}
          >
            <MaterialIcons name="add" size={18} color="black" />
            <Text style={styles.addSetText}>
              ADD SET
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

export default memo(ExerciseCard);

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    width: "90%",
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "black",
    marginBottom: 12,
    alignSelf: "center",
  },
  closedContainer: {
    height: 76,
  },
  header: {
    height: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  headerToggle: {
    flex: 1,
    height: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTogglePressed: {
    opacity: 0.65,
  },
  removeExerciseButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  removeExerciseButtonPressed: {
    backgroundColor: "#FFE5E5",
    borderRadius: 6,
  },
  nameContainer: {
    flex: 1,
  },
  name: {
    fontWeight: "900",
    fontSize: 18,
    lineHeight: 20,
  },
  unilateralBadge: {
    marginTop: 2,
    fontSize: 9,
    fontWeight: "900",
    color: "#5856D6",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  setsContainer: {
    marginTop: 16,
    gap: 8,
  },
  setsHeader: {
    flexDirection: "row",
    paddingHorizontal: 4,
    marginBottom: 4,
    gap: 8,
  },
  setsHeaderLabel: {
    flex: 1,
    fontSize: 10,
    fontWeight: "800",
    color: "#8E8E93",
    textAlign: "center",
    textTransform: "uppercase",
  },
  addSetButton: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "black",
    borderStyle: "dashed",
    gap: 4,
  },
  addSetButtonPressed: {
    backgroundColor: "#F2F2F7",
  },
  addSetText: {
    fontSize: 12,
    fontWeight: "900",
    color: "black",
    textTransform: "uppercase",
  },
});
