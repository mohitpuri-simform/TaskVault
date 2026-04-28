import type { ProfileData } from "../../lib/storage";

export type ProfileWizardStepId =
  | "avatar"
  | "basic"
  | "about-location"
  | "passkey";

export type LocationState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; lat: number; lng: number }
  | { status: "error"; message: string };

export type PasskeyStatus = {
  credentialId: string | null;
  webAuthnSupportReason: string | null;
};

export type ProfileWizardDraft = {
  stepId: ProfileWizardStepId;
  avatar: string | null;
  form: ProfileData;
  location: LocationState;
  passkeyAcknowledgedUnsupported: boolean;
  updatedAt: number;
};

export type ProfileWizardContext = {
  draft: ProfileWizardDraft;
  passkey: PasskeyStatus;
};

export type ProfileWizardStepDefinition = {
  id: ProfileWizardStepId;
  title: string;
  description: string;
  validate: (context: ProfileWizardContext) => string | null;
};
