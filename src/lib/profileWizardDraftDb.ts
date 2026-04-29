import Dexie, { type EntityTable } from "dexie";
import type { ProfileWizardDraft } from "../components/profileWizard/types";

const DB_NAME = "pwa-goal-db";
const DRAFT_KEY = "default";
const STALE_MS = 7 * 24 * 60 * 60 * 1000;

type StoredProfileWizardDraft = ProfileWizardDraft & {
  key: string;
};

const db = new Dexie(DB_NAME) as Dexie & {
  profileWizardDrafts: EntityTable<StoredProfileWizardDraft, "key">;
};

// Dexie store schema: string primary key for single active local draft.
db.version(1).stores({
  profileWizardDrafts: "key, updatedAt",
});

export async function loadProfileWizardDraft(): Promise<ProfileWizardDraft | null> {
  const raw = await db.profileWizardDrafts.get(DRAFT_KEY);
  if (!raw) {
    return null;
  }

  const { key: _, ...draft } = raw;
  if (Date.now() - draft.updatedAt > STALE_MS) {
    await clearProfileWizardDraft();
    return null;
  }

  return draft;
}

export async function saveProfileWizardDraft(draft: ProfileWizardDraft) {
  await db.profileWizardDrafts.put({
    key: DRAFT_KEY,
    ...draft,
  });
}

export async function clearProfileWizardDraft() {
  await db.profileWizardDrafts.delete(DRAFT_KEY);
}
