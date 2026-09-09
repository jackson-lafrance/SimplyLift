import { StyleSheet, Text, View } from "react-native";
import type { Exercise, Set } from "../context/appContext";
import {
  formatSetDisplayLabel,
  getSetDisplayGroups,
  getSetNumberColor,
  getSetTypeDetailLabel,
  type SetDisplayRow,
} from "../utils/setDisplay";

interface SetGroupSummaryProps {
  exercise: Exercise;
}

const formatRowLabel = (row: SetDisplayRow) =>
  row.sideLabel ?? formatSetDisplayLabel(row.displaySetNumber, row.sideLabel);

function SummaryRow({ row }: { row: SetDisplayRow }) {
  const set: Set = row.set;

  const setTypeDetailLabel = getSetTypeDetailLabel(set);

  return (
    <View style={styles.setRow}>
      <View style={styles.setNumberContainer}>
        <Text
          style={[styles.setNumber, { color: getSetNumberColor(set) }]}
        >
          {formatRowLabel(row)}
        </Text>
        {setTypeDetailLabel && (
          <Text
            style={[
              styles.setTypeDetailLabel,
              { color: getSetNumberColor(set) },
            ]}
          >
            {setTypeDetailLabel}
          </Text>
        )}
      </View>
      <Text style={styles.setDetails}>
        {set.weight} lbs × {set.reps} reps
      </Text>
    </View>
  );
}

export default function SetGroupSummary({ exercise }: SetGroupSummaryProps) {
  return (
    <View style={styles.container}>
      {getSetDisplayGroups(exercise).map((group) => {
        if (group.groupType === "leftRight") {
          return (
            <View key={group.groupId} style={styles.leftRightGroup}>
              <Text style={styles.leftRightTitle}>
                Set {group.displaySetNumber}
              </Text>
              {group.rows.map((row) => (
                <SummaryRow key={row.rowId} row={row} />
              ))}
            </View>
          );
        }

        return (
          <View key={group.groupId} style={styles.standardGroup}>
            {group.rows.map((row) => (
              <SummaryRow key={row.rowId} row={row} />
            ))}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  standardGroup: {
    gap: 4,
  },
  leftRightGroup: {
    gap: 4,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 8,
    padding: 8,
    backgroundColor: "#FBFBFD",
  },
  leftRightTitle: {
    fontSize: 10,
    fontWeight: "900",
    color: "#5856D6",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  setNumberContainer: {
    minWidth: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  setNumber: {
    fontSize: 12,
    fontWeight: "800",
    color: "#8E8E93",
    textAlign: "center",
    lineHeight: 14,
  },
  setTypeDetailLabel: {
    marginTop: 2,
    width: "100%",
    fontSize: 8,
    fontWeight: "900",
    textAlign: "center",
    lineHeight: 10,
    color: "#5856D6",
  },
  setDetails: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
  },
});
