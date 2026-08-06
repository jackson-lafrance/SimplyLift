import * as Haptics from "expo-haptics";

/**
 * Haptics are deliberately best-effort: they are unavailable on some devices
 * (and on web), but a failed feedback call should never interrupt a workout.
 */
const runFeedback = (feedback: () => Promise<void>) => {
  void feedback().catch(() => undefined);
};

export const selectionFeedback = () => {
  runFeedback(() => Haptics.selectionAsync());
};

export const impactFeedback = () => {
  runFeedback(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
};

export const successFeedback = () => {
  runFeedback(() =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  );
};

export const warningFeedback = () => {
  runFeedback(() =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  );
};
