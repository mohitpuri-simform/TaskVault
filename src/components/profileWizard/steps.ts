import type { ProfileWizardStepDefinition, ProfileWizardStepId } from "./types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const STEP_DEFINITIONS: Record<
  ProfileWizardStepId,
  ProfileWizardStepDefinition
> = {
  avatar: {
    id: "avatar",
    title: "Avatar",
    description: "Capture your profile photo.",
    validate: ({ draft }) =>
      draft.avatar ? null : "Capture a profile photo to continue.",
  },
  basic: {
    id: "basic",
    title: "Basic Info",
    description: "Enter your name and email.",
    validate: ({ draft }) => {
      if (!draft.form.name.trim()) return "Name is required.";
      if (!draft.form.email.trim()) return "Email is required.";
      if (!EMAIL_REGEX.test(draft.form.email.trim())) {
        return "Enter a valid email address.";
      }
      return null;
    },
  },
  "about-location": {
    id: "about-location",
    title: "Bio & Location",
    description: "Tell us about yourself and fetch your location.",
    validate: ({ draft }) => {
      if (!draft.form.bio.trim()) return "Bio is required.";
      if (draft.location.status !== "done") {
        return "Fetch location to continue.";
      }
      return null;
    },
  },
  passkey: {
    id: "passkey",
    title: "Passkey",
    description: "Set up a passkey for app unlock.",
    validate: ({ draft, passkey }) => {
      if (passkey.credentialId) return null;
      if (
        passkey.webAuthnSupportReason &&
        draft.passkeyAcknowledgedUnsupported
      ) {
        return null;
      }
      if (passkey.webAuthnSupportReason) {
        return "Acknowledge the unsupported passkey state to finish.";
      }
      return "Register a passkey to finish setup.";
    },
  },
};

// Reorder this array to change step flow without touching rendering logic.
export const PROFILE_WIZARD_STEP_ORDER: ProfileWizardStepId[] = [
  "avatar",
  "basic",
  "about-location",
  "passkey",
];

export const PROFILE_WIZARD_STEPS = PROFILE_WIZARD_STEP_ORDER.map(
  (id) => STEP_DEFINITIONS[id],
);
