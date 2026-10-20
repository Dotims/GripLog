import {
  Archivo_500Medium,
  Archivo_700Bold,
  Archivo_800ExtraBold,
  Archivo_900Black,
  useFonts,
} from "@expo-google-fonts/archivo";
import { JetBrainsMono_500Medium, JetBrainsMono_700Bold } from "@expo-google-fonts/jetbrains-mono";
import { DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { Colors, Fonts } from "@/constants/theme";
import { DatabaseProvider } from "@/db/DatabaseProvider";
import { useActiveWorkout } from "@/features/active-workout/use-active-workout";
import { PreferencesProvider } from "@/features/profile/PreferencesProvider";

SplashScreen.preventAutoHideAsync().catch(() => {});

const GripLogTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.accent,
    background: Colors.background,
    card: Colors.background,
    text: Colors.text,
    border: Colors.border,
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
  headerTitleStyle: { fontFamily: Fonts.heading },
} as const;

function RootStack() {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
    // Restore a workout that was running when the app was closed.
    useActiveWorkout.persist.rehydrate();
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
      <Stack.Screen name="routines/edit" options={{ presentation: "modal" }} />
      <Stack.Screen name="settings" options={{ ...detailHeader, headerTitle: "Settings" }} />
      <Stack.Screen name="import" options={{ presentation: "modal" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Archivo_500Medium,
    Archivo_700Bold,
    Archivo_800ExtraBold,
    Archivo_900Black,
    JetBrainsMono_500Medium,
    JetBrainsMono_700Bold,
  });

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <DatabaseProvider>
        <PreferencesProvider>
          <ThemeProvider value={GripLogTheme}>
            <StatusBar style="dark" />
            <RootStack />
          </ThemeProvider>
        </PreferencesProvider>
      </DatabaseProvider>
    </GestureHandlerRootView>
  );
}
