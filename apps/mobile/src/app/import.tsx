import { HevyImportError, parseHevyCsv } from "@griplog/core";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import { useRouter } from "expo-router";
import { CheckCircle2, FileUp, X } from "lucide-react-native";
import { useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import {
  AppText,
  Button,
  Card,
  IconButton,
  Screen,
  ScreenHeader,
  SectionLabel,
  Stat,
} from "@/components/ui";
import { Colors, Spacing } from "@/constants/theme";
import { useDatabase } from "@/db/DatabaseProvider";
import {
  planHevyImport,
  runHevyImport,
  type HevyImportPlan,
  type HevyImportResult,
} from "@/features/import/hevy-import";

type Step =
  | { kind: "pick" }
  | { kind: "review"; plan: HevyImportPlan; fileName: string }
  | { kind: "importing" }
  | { kind: "done"; result: HevyImportResult }
  | { kind: "error"; message: string };

async function readPickedFile(asset: DocumentPicker.DocumentPickerAsset): Promise<string> {
  if (Platform.OS === "web" && asset.file) return asset.file.text();
  return new File(asset.uri).text();
}

export default function ImportScreen() {
  const router = useRouter();
  const db = useDatabase();
  const [step, setStep] = useState<Step>({ kind: "pick" });

  const pick = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["text/csv", "text/comma-separated-values", "text/plain", "application/vnd.ms-excel"],
      // On Android read the content:// URI directly: the picker's cache copy lands in
      // a folder Expo Go is not allowed to read.
      copyToCacheDirectory: Platform.OS !== "android",
    });
    const asset = result.canceled ? null : result.assets[0];
    if (!asset) return;
    try {
      const workouts = parseHevyCsv(await readPickedFile(asset));
      if (workouts.length === 0) throw new HevyImportError("The file has no workouts in it.");
      setStep({ kind: "review", plan: planHevyImport(db, workouts), fileName: asset.name });
    } catch (error) {
      setStep({ kind: "error", message: error instanceof Error ? error.message : String(error) });
    }
  };

  const run = (plan: HevyImportPlan) => {
    setStep({ kind: "importing" });
    // Give the spinner a frame to appear before the synchronous transaction blocks the JS thread.
    setTimeout(() => {
      try {
        setStep({ kind: "done", result: runHevyImport(db, plan) });
      } catch (error) {
        setStep({ kind: "error", message: error instanceof Error ? error.message : String(error) });
      }
    }, 50);
  };

  return (
    <Screen scroll>
      <ScreenHeader
        eyebrow="Import"
        title="From Hevy"
        right={<IconButton icon={X} label="Close" onPress={() => router.back()} />}
      />

      {step.kind === "pick" || step.kind === "error" ? (
        <>
          <Card style={styles.card}>
            <AppText variant="heading">Bring your history over</AppText>
            <AppText color={Colors.muted}>
              In Hevy open Profile, Settings, Export &amp; Import Data, then Export Workouts. Pick
              the CSV file here. Workouts you imported before are skipped, so running it again is
              safe.
            </AppText>
          </Card>
          {step.kind === "error" ? (
            <Card style={[styles.card, styles.error]}>
              <AppText variant="label" color={Colors.error}>
                Could not read the file
              </AppText>
              <AppText>{step.message}</AppText>
            </Card>
          ) : null}
          <Button
            label="Choose CSV file"
            icon={FileUp}
            size="lg"
            onPress={pick}
            testID="choose-csv"
          />
        </>
      ) : null}

      {step.kind === "review" ? (
        <Animated.View entering={FadeIn} style={styles.stack}>
          <AppText variant="label" color={Colors.muted}>
            {step.fileName}
          </AppText>
          <Card style={styles.stats}>
            <Stat label="Workouts" value={String(step.plan.workouts.length)} />
            <Stat label="Sets" value={String(step.plan.setCount)} />
            <Stat label="Already in" value={String(step.plan.duplicates)} />
          </Card>
          {step.plan.skippedSets > 0 ? (
            <AppText color={Colors.muted}>
              {step.plan.skippedSets} {step.plan.skippedSets === 1 ? "set has" : "sets have"}{" "}
              impossible values (over 2 000 kg or 1 000 reps) and will be left out.
            </AppText>
          ) : null}

          <SectionLabel>{`Exercises · ${step.plan.matches.length}`}</SectionLabel>
          <Card style={styles.card}>
            {step.plan.matches.map((match) => (
              <View key={match.title} style={styles.match}>
                <AppText style={styles.flex} numberOfLines={1}>
                  {match.title}
                </AppText>
                <AppText variant="label" color={match.exerciseId ? Colors.success : Colors.accent}>
                  {match.exerciseId ? "matched" : "new custom"}
                </AppText>
              </View>
            ))}
          </Card>

          <Button
            label={`Import ${step.plan.workouts.length} workouts`}
            size="lg"
            disabled={step.plan.workouts.length === 0}
            onPress={() => run(step.plan)}
            testID="run-import"
          />
          <Button
            label="Pick another file"
            variant="ghost"
            onPress={() => setStep({ kind: "pick" })}
          />
        </Animated.View>
      ) : null}

      {step.kind === "importing" ? (
        <Button label="Importing" loading onPress={() => {}} size="lg" />
      ) : null}

      {step.kind === "done" ? (
        <Animated.View entering={FadeIn} style={styles.stack}>
          <Card tone="raised" style={[styles.card, styles.done]}>
            <CheckCircle2 color={Colors.success} size={32} strokeWidth={2} />
            <AppText variant="title">Imported</AppText>
            <AppText>
              {step.result.workouts} workouts and {step.result.sets} sets
              {step.result.createdExercises > 0
                ? `, plus ${step.result.createdExercises} custom exercises for names the catalogue does not have.`
                : "."}
            </AppText>
          </Card>
          <Button label="See my workouts" size="lg" onPress={() => router.dismissTo("/")} />
        </Animated.View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: Spacing.lg,
  },
  card: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  error: {
    borderColor: Colors.error,
  },
  stats: {
    flexDirection: "row",
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  match: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  flex: {
    flex: 1,
  },
  done: {
    alignItems: "flex-start",
  },
});
