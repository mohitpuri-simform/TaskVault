import { useEffect, useRef, useState } from "react";
import type { ProfileData } from "../lib/storage";
import {
  clearProfileWizardDraft,
  loadProfileWizardDraft,
  saveProfileWizardDraft,
} from "../lib/profileWizardDraftDb";
import type {
  LocationState,
  ProfileWizardDraft,
  ProfileWizardStepId,
} from "../components/profileWizard/types";

type UseProfileWizardDraftInput = {
  initialStepId: ProfileWizardStepId;
  initialAvatar: string | null;
  initialForm: ProfileData;
  initialLocation: LocationState;
};

type UseProfileWizardDraftResult = {
  draft: ProfileWizardDraft;
  hydrated: boolean;
  setDraft: React.Dispatch<React.SetStateAction<ProfileWizardDraft>>;
  clearDraft: () => Promise<void>;
};

function buildInitialDraft({
  initialStepId,
  initialAvatar,
  initialForm,
  initialLocation,
}: UseProfileWizardDraftInput): ProfileWizardDraft {
  return {
    stepId: initialStepId,
    avatar: initialAvatar,
    form: initialForm,
    location: initialLocation,
    passkeyAcknowledgedUnsupported: false,
    updatedAt: Date.now(),
  };
}

export function useProfileWizardDraft(
  input: UseProfileWizardDraftInput,
): UseProfileWizardDraftResult {
  const [draft, setDraft] = useState<ProfileWizardDraft>(() =>
    buildInitialDraft(input),
  );
  const [hydrated, setHydrated] = useState(false);
  const saveTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    void loadProfileWizardDraft()
      .then((loadedDraft) => {
        if (!isMounted) return;
        if (loadedDraft) {
          setDraft(loadedDraft);
        }
      })
      .finally(() => {
        if (isMounted) setHydrated(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(() => {
      void saveProfileWizardDraft({ ...draft, updatedAt: Date.now() });
    }, 250);

    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [draft, hydrated]);

  async function clearDraft() {
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    await clearProfileWizardDraft();
  }

  return {
    draft,
    hydrated,
    setDraft,
    clearDraft,
  };
}
