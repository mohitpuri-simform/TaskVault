import { PasskeyPanel } from "../PasskeyPanel";

type PasskeyStepProps = {
  userEmail: string;
  userName: string;
  onPasskeyStatusChange: (payload: {
    credentialId: string | null;
    webAuthnSupportReason: string | null;
  }) => void;
  webAuthnSupportReason: string | null;
  passkeyAcknowledgedUnsupported: boolean;
  onAcknowledgeUnsupported: (checked: boolean) => void;
};

export function PasskeyStep({
  userEmail,
  userName,
  onPasskeyStatusChange,
  webAuthnSupportReason,
  passkeyAcknowledgedUnsupported,
  onAcknowledgeUnsupported,
}: PasskeyStepProps) {
  return (
    <div className="profile-wizard-passkey-step">
      <PasskeyPanel
        userEmail={userEmail}
        userName={userName}
        onStatusChange={onPasskeyStatusChange}
      />

      {webAuthnSupportReason ? (
        <label className="profile-wizard-checkbox">
          <input
            type="checkbox"
            checked={passkeyAcknowledgedUnsupported}
            onChange={(event) => onAcknowledgeUnsupported(event.target.checked)}
          />
          I understand this device/browser cannot register a passkey right now.
        </label>
      ) : null}
    </div>
  );
}
