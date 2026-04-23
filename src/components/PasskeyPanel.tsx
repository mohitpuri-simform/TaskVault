import { Fingerprint, ShieldCheck } from "lucide-react";
import { useWebAuthn } from "../hooks/useWebAuthn";

interface Props {
  userEmail?: string;
  userName?: string;
}

export function PasskeyPanel({ userEmail, userName }: Props) {
  const {
    registering,
    authenticating,
    credentialId,
    lastAuthenticatedAt,
    authState,
    webAuthnSupportReason,
    registerCredential,
    authenticateCredential,
    resetCredential,
  } = useWebAuthn(userEmail, userName);

  return (
    <section className="profile-passkey" aria-live="polite">
      <div className="profile-passkey-head">
        <h3 className="profile-passkey-title">Passkey Authentication</h3>
        <span className="profile-field-readonly-badge">WebAuthn</span>
      </div>
      <p className="profile-passkey-copy">
        Register a credential to authenticate with Face ID, your fingerprint
        reader, or a USB security key.
      </p>
      <p className="profile-passkey-note">
        Best practice: in production, challenges and verification must be done
        on your server using expected origin and RP ID.
      </p>
      <div className="profile-passkey-actions">
        <button
          type="button"
          className="profile-location-btn"
          onClick={() => void registerCredential()}
          disabled={registering || Boolean(webAuthnSupportReason)}
        >
          <Fingerprint size={15} />
          {registering ? "Registering…" : "Register Credential"}
        </button>
        <button
          type="button"
          className="profile-location-btn"
          onClick={() => void authenticateCredential()}
          disabled={
            authenticating || !credentialId || Boolean(webAuthnSupportReason)
          }
        >
          <ShieldCheck size={15} />
          {authenticating ? "Authenticating…" : "Authenticate"}
        </button>
        <button
          type="button"
          className="profile-location-btn"
          onClick={resetCredential}
          disabled={!credentialId}
        >
          Reset
        </button>
      </div>

      {webAuthnSupportReason ? (
        <p className="profile-location-error">{webAuthnSupportReason}</p>
      ) : null}

      {credentialId ? (
        <p className="profile-location-note">
          Registered credential: {credentialId.slice(0, 16)}…
        </p>
      ) : (
        <p className="profile-page-avatar-hint">
          No credential registered yet.
        </p>
      )}

      {lastAuthenticatedAt ? (
        <p className="profile-page-avatar-hint">
          Last authenticated: {new Date(lastAuthenticatedAt).toLocaleString()}
        </p>
      ) : null}

      {authState.status === "success" ? (
        <p className="profile-passkey-success">{authState.message}</p>
      ) : null}

      {authState.status === "error" ? (
        <p className="profile-location-error">{authState.message}</p>
      ) : null}
    </section>
  );
}
