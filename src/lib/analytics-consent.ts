import type { AnalyticsConsent } from "./analytics";

type StoredConsent = Exclude<AnalyticsConsent, null>;

export function createAnalyticsConsentRuntime(options: {
  initialChoice: AnalyticsConsent;
  persist: (choice: StoredConsent) => boolean;
  onAllow: () => void;
  onDecline: () => void;
  onReload: () => void;
}) {
  let started = false;

  const choose = (choice: StoredConsent) => {
    const wasStarted = started;
    const persisted = options.persist(choice);
    if (choice === "allowed" && !started) {
      started = true;
      options.onAllow();
    }
    if (choice === "declined") {
      options.onDecline();
      if (wasStarted && persisted) options.onReload();
    }
    return { persisted };
  };

  const applyInitialChoice = () => {
    if (options.initialChoice === "allowed") {
      started = true;
      options.onAllow();
    } else if (options.initialChoice === "declined") {
      options.onDecline();
    }
  };

  return { applyInitialChoice, choose };
}
