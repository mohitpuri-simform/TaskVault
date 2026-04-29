export const FEATURE_ITEMS = [
  {
    id: "install-pwa",
    name: "Install PWA",
    description: "Install prompt modal for adding this web app to your device.",
    targetId: "feature-install",
  },
  {
    id: "network-quality",
    name: "Adaptive Network Quality",
    description:
      "Live Net Good/Avg/Poor quality badge from connection signals.",
    targetId: "feature-network",
  },
  {
    id: "profile-avatar",
    name: "Webcam + Capture Profile Photo",
    description:
      "Tap avatar to open webcam modal and store captured profile photo.",
    targetId: "feature-profile",
  },
  {
    id: "profile-wizard",
    name: "Multi-Step Profile Wizard",
    description:
      "Guided profile setup with modular, reorderable step definitions.",
    targetId: "feature-profile",
  },
  {
    id: "profile-draft-dexie",
    name: "Dexie Draft Autosave + Resume",
    description:
      "Autosaves wizard progress in IndexedDB via Dexie and resumes on reopen.",
    targetId: "feature-profile",
  },
  {
    id: "passkey-gated-finish",
    name: "Passkey-Gated Setup Completion",
    description:
      "Final wizard step validates passkey setup or explicit unsupported fallback.",
    targetId: "feature-profile",
  },
  {
    id: "offline-sync",
    name: "Offline-First Sync Queue",
    description: "Queues CRUD actions offline and syncs back when online.",
    targetId: "feature-sync",
  },
  {
    id: "todo-stats",
    name: "Cached Todo Stats",
    description: "Summary panel backed by local cache and background refetch.",
    targetId: "feature-stats",
  },
  {
    id: "webcam-pip",
    name: "Webcam Picture-in-Picture",
    description: "Start webcam and pop it out into Picture-in-Picture mode.",
    targetId: "feature-webcam",
  },
] as const;

export const INACTIVITY_LOCK_MS = 60_000;
