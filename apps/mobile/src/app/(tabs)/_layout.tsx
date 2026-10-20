import { Tabs } from "expo-router";
import { BottomTabBar } from "expo-router/js-tabs";
import { ClipboardList, Dumbbell, House, User } from "lucide-react-native";
import { View } from "react-native";

import { BorderWidth, Colors, Fonts } from "@/constants/theme";
import { ActiveWorkoutBar } from "@/features/active-workout/ActiveWorkoutBar";

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => (
        <View>
          <ActiveWorkoutBar />
          <BottomTabBar {...props} />
        </View>
      )}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.muted,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: BorderWidth.thick,
          height: 72,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: Fonts.monoBold,
          fontSize: 10,
          letterSpacing: 0.6,
          textTransform: "uppercase",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Feed",
          tabBarIcon: ({ color, size }) => <House color={color} size={size} strokeWidth={2.5} />,
        }}
      />
      <Tabs.Screen
        name="exercises"
        options={{
          title: "Exercises",
          tabBarIcon: ({ color, size }) => <Dumbbell color={color} size={size} strokeWidth={2.5} />,
        }}
      />
      <Tabs.Screen
        name="routines"
        options={{
          title: "Workout",
          tabBarIcon: ({ color, size }) => (
            <ClipboardList color={color} size={size} strokeWidth={2.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <User color={color} size={size} strokeWidth={2.5} />,
        }}
      />
    </Tabs>
  );
}
