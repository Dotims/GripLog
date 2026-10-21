import { Tabs } from "expo-router";
import { BottomTabBar } from "expo-router/js-tabs";
import { ClipboardList, Dumbbell, House, User } from "lucide-react-native";
import { View } from "react-native";

import { TabIcon } from "@/components/ui";
import { Colors, Fonts } from "@/constants/theme";
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
        // A short cross-slide between tabs instead of a hard cut.
        animation: "shift",
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.muted,
        tabBarStyle: {
          backgroundColor: Colors.background,
          borderTopColor: Colors.hairline,
          borderTopWidth: 1,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontFamily: Fonts.medium,
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Feed",
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon icon={House} color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="exercises"
        options={{
          title: "Exercises",
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon icon={Dumbbell} color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="routines"
        options={{
          title: "Workout",
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon icon={ClipboardList} color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon icon={User} color={color} size={size} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
