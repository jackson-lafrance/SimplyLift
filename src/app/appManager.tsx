import { StyleSheet, Pressable, Text, View, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppContext } from "./context/appContext";
import Tabs from "./tabs";
import { useEffect, useState } from "react";

export default function AppManager() {
  const { currentWorkout, setCurrentWorkout } = useAppContext();
  const insets = useSafeAreaInsets();
  const [time, setTime] = useState(
    new Date().getTime() -
      (!currentWorkout ? new Date().getTime() : currentWorkout.date.getTime()),
  );

  useEffect(() => {
    if (currentWorkout) {
      const interval = setInterval(() => {
        setTime(new Date().getTime() - currentWorkout.date.getTime());
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [currentWorkout]);
  if (!currentWorkout)
    return (
      <View
        style={{
          flex: 1,
        }}
      >
        <Tabs />
        <Pressable
          style={{
            position: "absolute",
            bottom: insets.bottom + 55,
            alignSelf: "center",
            zIndex: 10,
          }}
          onPress={() =>
            setCurrentWorkout({
              name: "New Workout",
              time: 0,
              date: new Date(),
              exercises: [],
            })
          }
        >
          <Text
            style={{
              padding: 20,
              backgroundColor: "lightblue",
              borderRadius: 10,
              borderWidth: 2,
              fontSize: 16,
              fontWeight: 600,
              color: "blue",
              borderColor: "blue",
            }}
          >
            Start Workout
          </Text>
        </Pressable>
      </View>
    );

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "flex-start",
        marginTop: insets.top,
        marginBottom: insets.bottom,
      }}
    >
      <TextInput
        maxLength={20}
        style={styles.title}
        onChangeText={(text) =>
          setCurrentWorkout({
            ...currentWorkout,
            name: text,
          })
        }
        value={currentWorkout.name}
      />
      <Text style={styles.timer}>
        {String(Math.floor(time / 3600000)).padStart(2, "0")}:
        {String(Math.floor((time % 3600000) / 60000)).padStart(2, "0")}:
        {String(Math.floor((time % 60000) / 1000)).padStart(2, "0")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: 600,
  },
  timer: {
    fontFamily: "ui-monospace",
    fontSize: 16,
  },
});
