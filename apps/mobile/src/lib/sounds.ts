import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";

const SOURCES = {
  tick: require("../../assets/sounds/tick.wav"),
  rest: require("../../assets/sounds/rest.wav"),
  complete: require("../../assets/sounds/complete.wav"),
  record: require("../../assets/sounds/record.wav"),
} as const;

export type SoundName = keyof typeof SOURCES;

const VOLUME: Record<SoundName, number> = { tick: 0.35, rest: 0.8, complete: 0.7, record: 0.75 };

let enabled = true;
let ready = false;
const players = new Map<SoundName, AudioPlayer>();

/** Mirrors the preference, so sounds can play from stores and timers outside React. */
export function setSoundsEnabled(value: boolean): void {
  enabled = value;
}

function player(name: SoundName): AudioPlayer {
  let existing = players.get(name);
  if (!existing) {
    existing = createAudioPlayer(SOURCES[name]);
    existing.volume = VOLUME[name];
    players.set(name, existing);
  }
  return existing;
}

/** Short UI sounds: they mix with your music and stay quiet when the phone is on silent. */
export function playSound(name: SoundName): void {
  if (!enabled) return;
  try {
    if (!ready) {
      ready = true;
      setAudioModeAsync({ playsInSilentMode: false, interruptionMode: "mixWithOthers" }).catch(
        () => {},
      );
    }
    const sound = player(name);
    sound.seekTo(0).catch(() => {});
    sound.play();
  } catch {
    // A missing audio device must never break logging a set.
  }
}
