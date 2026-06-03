import { useMemo } from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from "react-native";
import { useAppContext } from "../context/appContext";

interface ExerciseNamePickerProps {
  value: string;
  onChangeText: (name: string) => void;
  onSelectExercise?: (name: string) => void;
  label?: string;
  placeholder?: string;
  maxLength?: number;
  containerStyle?: StyleProp<ViewStyle>;
}

const formatExerciseName = (name: string) => name.toUpperCase();

export default function ExerciseNamePicker({
  value,
  onChangeText,
  onSelectExercise,
  placeholder = "e.g. BENCH PRESS",
  maxLength = 30,
  containerStyle,
}: ExerciseNamePickerProps) {
  const { exerciseList } = useAppContext();
  const formattedValue = formatExerciseName(value);

  const suggestions = useMemo(() => {
    const query = formattedValue.trim();
    if (!query) return [];

    return exerciseList
      .filter((exercise) => {
        const exerciseName = formatExerciseName(exercise.name);

        return exerciseName.includes(query) && exerciseName !== query;
      })
      .slice(0, 5);
  }, [exerciseList, formattedValue]);

  const selectExercise = (name: string) => {
    const formattedName = formatExerciseName(name.trim());

    if (onSelectExercise) {
      onSelectExercise(formattedName);
      return;
    }

    onChangeText(formattedName);
  };

  return (
    <View style={containerStyle}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#c6c6c6"
        autoCapitalize="characters"
        autoComplete="off"
        autoCorrect={false}
        spellCheck={false}
        textContentType="none"
        maxLength={maxLength}
        onChangeText={(text) => onChangeText(formatExerciseName(text))}
        value={formattedValue}
      />

      {suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          {suggestions.map((item, index) => (
            <Pressable
              key={`${item.name}-${index}`}
              style={styles.suggestionItem}
              onPress={() => selectExercise(item.name)}
            >
              <Text style={styles.suggestionText}>{item.name}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 10,
    fontWeight: "900",
    color: "#8E8E93",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  input: {
    height: 48,
    fontSize: 18,
    fontWeight: "800",
    borderWidth: 2,
    borderColor: "black",
    borderRadius: 8,
    paddingVertical: 0,
    paddingHorizontal: 16,
    color: "#000",
    backgroundColor: "white",
    textAlignVertical: "center",
  },
  suggestionsContainer: {
    backgroundColor: "white",
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 2,
    borderColor: "black",
    overflow: "hidden",
  },
  suggestionItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },
  suggestionText: {
    fontSize: 14,
    color: "black",
    fontWeight: "800",
    textTransform: "uppercase",
  },
});
