import {
  Onest_400Regular,
  Onest_500Medium,
  Onest_600SemiBold,
  Onest_700Bold,
  useFonts,
} from "@expo-google-fonts/onest";
import { DarkTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { Colors, Fonts } from "@/constants/theme";
import { DatabaseProvider } from "@/db/DatabaseProvider";
import { startRestNotifications } from "@/features/active-workout/rest-notification";
import { useActiveWorkout } from "@/features/active-workout/use-active-workout";
import { SessionProvider } from "@/features/account/SessionProvider";
import { PreferencesProvider } from "@/features/profile/PreferencesProvider";
import { AutoSync } from "@/features/sync/AutoSync";
import { queryClient } from "@/lib/query-client";

SplashScreen.preventAutoHideAsync().catch(() => {});

const GripLogTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.accent,
    background: Colors.background,
    card: Colors.background,
    text: Colors.text,
    border: Colors.hairline,
    notification: Colors.accent,
  },
};

const detailHeader = {
  headerShown: true,
  headerTitle: "",
  headerShadowVisible: false,
  headerStyle: { backgroundColor: Colors.background },
  headerTintColor: Colors.text,
  headerBackButtonDisplayMode: "minimal",
  headerTitleStyle: { fontFamily: Fonts.semibold },
} as const;

function RootStack() {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
    // Restore a workout that was running when the app was closed.
    useActiveWorkout.persist.rehydrate();
    return startRestNotifications();
  }, []);

  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="workout/active"
        options={{ presentation: "fullScreenModal", gestureEnabled: false }}
      />
      <Stack.Screen name="workout/pick-exercise" options={{ presentation: "modal" }} />
      <Stack.Screen
        name="workout/summary"
        options={{ presentation: "fullScreenModal", gestureEnabled: false }}
      />
      <Stack.Screen name="exercises/[id]" options={detailHeader} />
      <Stack.Screen name="exercises/new" options={{ presentation: "modal" }} />
      <Stack.Screen name="workouts/[id]" options={detailHeader} />
      <Stack.Screen name="routines/[id]" options={detailHeader} />
      <Stack.Screen
        name="routines/edit"
        // No swipe-to-dismiss: edits only leave through Save or Cancel.
        options={{ presentation: "modal", gestureEnabled: false }}
      />
      <Stack.Screen name="settings" options={{ ...detailHeader, headerTitle: "Settings" }} />
      <Stack.Screen name="import" options={{ presentation: "modal" }} />
      <Stack.Screen name="account" options={{ ...detailHeader, headerTitle: "Account" }} />
      <Stack.Screen name="people" options={{ ...detailHeader, headerTitle: "Find people" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Onest_400Regular,
    Onest_500Medium,
    Onest_600SemiBold,
    Onest_700Bold,
  });

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.background }}>
      <QueryClientProvider client={queryClient}>
        <DatabaseProvider>
          <SessionProvider>
            <PreferencesProvider>
              <ThemeProvider value={GripLogTheme}>
                <StatusBar style="light" />
                <AutoSync />
                <RootStack />
              </ThemeProvider>
            </PreferencesProvider>
          </SessionProvider>
        </DatabaseProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
