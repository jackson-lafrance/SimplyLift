import { NativeTabs } from "expo-router/unstable-native-tabs";
import {
  DynamicColorIOS,
  Pressable,
  StyleSheet,
  View,
  Text,
} from "react-native";

export default function Tabs() {
  return (
    <View style={{
      flex: 1
    }}>
      <Pressable>
        <Text>Hello</Text>
      </Pressable>
      <NativeTabs
        labelStyle={{
          color: DynamicColorIOS({
            dark: "red",
            light: "black",
          }),
        }}
        tintColor={DynamicColorIOS({
          dark: "white",
          light: "red",
        })}
        minimizeBehavior="automatic"
      >
        <NativeTabs.Trigger name="index" role="search">
          <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf={{ default: "house", selected: "house.fill" }}
            md="home"
          />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="exercises" role="search">
          <NativeTabs.Trigger.Label>Exercises</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf={{ default: "dumbbell", selected: "dumbbell.fill" }}
            md="home"
          />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="settings">
          <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf={{ default: "gearshape", selected: "gearshape.fill" }}
            md="home"
          />
        </NativeTabs.Trigger>
      </NativeTabs>
    </View>
  );
}
