import { useMemo, useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import {
  loadAvatarPhoto,
  loadProfileLocation,
  loadProfile,
  saveAvatarPhoto,
  saveProfileLocation,
  saveProfile,
} from "../lib/storage";
import { WebcamPanel } from "./WebcamPanel";
import { AvatarStep } from "./profileWizard/AvatarStep";
import { BasicInfoStep } from "./profileWizard/BasicInfoStep";
import { BioLocationStep } from "./profileWizard/BioLocationStep";
import { PasskeyStep } from "./profileWizard/PasskeyStep";
import { PROFILE_WIZARD_STEPS } from "./profileWizard/steps";
import type { PasskeyStatus, ProfileWizardStepId } from "./profileWizard/types";
import { useProfileWizardDraft } from "../hooks/useProfileWizardDraft";

interface Props {
  onClose: () => void;
}

export function ProfilePage({ onClose }: Props) {
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [saved, setSaved] = useState(false);
  const [passkeyStatus, setPasskeyStatus] = useState<PasskeyStatus>({
    credentialId: null,
    webAuthnSupportReason: null,
  });

  const initialLocation = useMemo(() => {
    const profileLocation = loadProfileLocation();
    if (!profileLocation) {
      return { status: "idle" } as const;
    }
    return {
      status: "done" as const,
      lat: profileLocation.lat,
      lng: profileLocation.lng,
    };
  }, []);

  const { draft, hydrated, setDraft, clearDraft } = useProfileWizardDraft({
    initialStepId: PROFILE_WIZARD_STEPS[0].id,
    initialAvatar: loadAvatarPhoto(),
    initialForm: loadProfile(),
    initialLocation,
  });

  const activeStepIndex = PROFILE_WIZARD_STEPS.findIndex(
    (step) => step.id === draft.stepId,
  );
  const resolvedStepIndex = activeStepIndex >= 0 ? activeStepIndex : 0;
  const activeStep = PROFILE_WIZARD_STEPS[resolvedStepIndex];
  const validationMessage = activeStep.validate({
    draft,
    passkey: passkeyStatus,
  });
  const canGoNext = validationMessage === null;
  const isLastStep = resolvedStepIndex === PROFILE_WIZARD_STEPS.length - 1;

  function handleCapture(dataUrl: string) {
    setDraft((prev) => ({
      ...prev,
      avatar: dataUrl,
      updatedAt: Date.now(),
    }));
    setShowCameraModal(false);
    setSaved(false);
  }

  function handleFormFieldChange(
    field: "name" | "email" | "bio",
    value: string,
  ) {
    setDraft((prev) => ({
      ...prev,
      form: {
        ...prev.form,
        [field]: value,
      },
      updatedAt: Date.now(),
    }));
    setSaved(false);
  }

  function goToStep(stepId: ProfileWizardStepId) {
    setDraft((prev) => ({
      ...prev,
      stepId,
      updatedAt: Date.now(),
    }));
  }

  function goNext() {
    if (!canGoNext || isLastStep) {
      return;
    }
    const nextStep = PROFILE_WIZARD_STEPS[resolvedStepIndex + 1];
    goToStep(nextStep.id);
  }

  function goBack() {
    if (resolvedStepIndex === 0) {
      return;
    }
    const previousStep = PROFILE_WIZARD_STEPS[resolvedStepIndex - 1];
    goToStep(previousStep.id);
  }

  async function handleFinish() {
    if (!isLastStep || !canGoNext) {
      return;
    }

    saveProfile(draft.form);
    if (draft.avatar) {
      saveAvatarPhoto(draft.avatar);
    }
    if (draft.location.status === "done") {
      saveProfileLocation({ lat: draft.location.lat, lng: draft.location.lng });
    }

    await clearDraft();
    setSaved(true);
  }

  function fetchLocation() {
    if (!navigator.geolocation) {
      setDraft((prev) => ({
        ...prev,
        location: { status: "error", message: "Geolocation not supported" },
        updatedAt: Date.now(),
      }));
      return;
    }

    setDraft((prev) => ({
      ...prev,
      location: { status: "loading" },
      updatedAt: Date.now(),
    }));

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDraft((prev) => ({
          ...prev,
          location: {
            status: "done",
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          },
          updatedAt: Date.now(),
        }));
        setSaved(false);
      },
      (err) => {
        setDraft((prev) => ({
          ...prev,
          location: { status: "error", message: err.message },
          updatedAt: Date.now(),
        }));
      },
      { timeout: 10000 },
    );
  }

  function renderActiveStep() {
    if (activeStep.id === "avatar") {
      return (
        <AvatarStep
          avatar={draft.avatar}
          onOpenCamera={() => setShowCameraModal(true)}
        />
      );
    }

    if (activeStep.id === "basic") {
      return (
        <BasicInfoStep form={draft.form} onChange={handleFormFieldChange} />
      );
    }

    if (activeStep.id === "about-location") {
      return (
        <BioLocationStep
          form={draft.form}
          location={draft.location}
          onBioChange={(value) => handleFormFieldChange("bio", value)}
          onFetchLocation={fetchLocation}
        />
      );
    }

    return (
      <PasskeyStep
        userEmail={draft.form.email}
        userName={draft.form.name}
        onPasskeyStatusChange={setPasskeyStatus}
        webAuthnSupportReason={passkeyStatus.webAuthnSupportReason}
        passkeyAcknowledgedUnsupported={draft.passkeyAcknowledgedUnsupported}
        onAcknowledgeUnsupported={(checked) => {
          setDraft((prev) => ({
            ...prev,
            passkeyAcknowledgedUnsupported: checked,
            updatedAt: Date.now(),
          }));
        }}
      />
    );
  }

  return (
    <>
      <div className="profile-page-overlay" onClick={onClose} />
      <div
        className="profile-page"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-page-title"
      >
        <div className="profile-page-header">
          <h2 id="profile-page-title" className="profile-page-title">
            Profile Setup Wizard
          </h2>
          <button
            type="button"
            className="capture-modal-close"
            onClick={onClose}
            aria-label="Close profile"
          >
            <X size={20} />
          </button>
        </div>

        <div className="profile-page-body">
          <div className="profile-wizard-progress-wrap">
            <p className="profile-page-avatar-hint">
              Step {resolvedStepIndex + 1} of {PROFILE_WIZARD_STEPS.length}
            </p>
            <div className="profile-wizard-progress" aria-hidden="true">
              {PROFILE_WIZARD_STEPS.map((step, index) => {
                const isActive = step.id === activeStep.id;
                const isDone = index < resolvedStepIndex;
                return (
                  <span
                    key={step.id}
                    className={`profile-wizard-progress-dot${isActive ? " active" : ""}${isDone ? " done" : ""}`}
                    title={step.title}
                  />
                );
              })}
            </div>
          </div>

          <section className="profile-passkey" aria-live="polite">
            <div className="profile-passkey-head">
              <h3 className="profile-passkey-title">{activeStep.title}</h3>
              <span className="profile-field-readonly-badge">Autosaved</span>
            </div>
            <p className="profile-passkey-copy">{activeStep.description}</p>

            {!hydrated ? (
              <p className="profile-page-avatar-hint">Loading saved draft...</p>
            ) : null}

            <div className="profile-page-form">{renderActiveStep()}</div>

            {validationMessage ? (
              <p className="profile-location-error">{validationMessage}</p>
            ) : null}

            {saved ? (
              <p className="profile-passkey-success profile-wizard-saved">
                <CheckCircle2 size={16} />
                Profile setup saved successfully.
              </p>
            ) : null}

            <div className="profile-wizard-footer">
              <button
                type="button"
                className="profile-location-btn"
                onClick={goBack}
                disabled={resolvedStepIndex === 0}
              >
                Back
              </button>

              {!isLastStep ? (
                <button
                  type="button"
                  className="profile-save-btn"
                  onClick={goNext}
                  disabled={!canGoNext}
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  className="profile-save-btn"
                  onClick={() => void handleFinish()}
                  disabled={!canGoNext}
                >
                  Finish
                </button>
              )}
            </div>
          </section>
        </div>
      </div>

      {showCameraModal && (
        <div
          className="modal-overlay"
          style={{ zIndex: 1100 }}
          onClick={() => setShowCameraModal(false)}
        >
          <div
            className="capture-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="pp-capture-title"
          >
            <div className="capture-modal-header">
              <h3 id="pp-capture-title" className="capture-modal-title">
                Capture Profile Photo
              </h3>
              <button
                type="button"
                className="capture-modal-close"
                onClick={() => setShowCameraModal(false)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="capture-modal-body">
              <WebcamPanel onCapture={handleCapture} showCaptureButton />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
