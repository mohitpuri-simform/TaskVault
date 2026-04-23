import { ShieldCheck } from "lucide-react";
import { useEffect } from "react";
import { useWebAuthn } from "../hooks/useWebAuthn";

interface Props {
  onAuthSuccess: () => void;
  onCancel: () => void;
}

export function AuthenticationGate({ onAuthSuccess, onCancel }: Props) {
  const {
    authenticating,
    credentialId,
    authState,
    webAuthnSupportReason,
    authenticateCredential,
  } = useWebAuthn();

  // Monitor auth state for success
  useEffect(() => {
    if (authState.status === "success") {
      // Delay slightly to ensure state is settled
      const timer = setTimeout(onAuthSuccess, 500);
      return () => clearTimeout(timer);
    }
  }, [authState.status, onAuthSuccess]);

  const handleAuthenticate = async () => {
    await authenticateCredential();
  };

  // If no credential is registered, skip authentication (shouldn't reach here but safety check)
  if (!credentialId) {
    onAuthSuccess();
    return null;
  }

  return (
    <>
      <div
        className="profile-page-overlay"
        onClick={onCancel}
        style={{ zIndex: 1000 }}
      />
      <div
        className="profile-page"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-gate-title"
        style={{ zIndex: 1001 }}
      >
        <div className="profile-page-header">
          <h2 id="auth-gate-title" className="profile-page-title">
            Verify Identity
          </h2>
        </div>

        <div className="profile-page-body">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "2rem",
              minHeight: "300px",
              textAlign: "center",
            }}
          >
            <ShieldCheck
              size={48}
              style={{ color: "var(--primary-color, #20463f)" }}
            />
            <div>
              <h3 style={{ marginBottom: "0.5rem" }}>
                Profile Requires Authentication
              </h3>
              <p
                style={{
                  color: "var(--text-secondary, #666)",
                  marginBottom: "1.5rem",
                }}
              >
                Use your registered credential (Face ID, fingerprint, or
                security key) to verify your identity and access your profile.
              </p>
            </div>

            {webAuthnSupportReason && (
              <p className="profile-location-error">{webAuthnSupportReason}</p>
            )}

            {authState.status === "error" && (
              <p className="profile-location-error">{authState.message}</p>
            )}

            <div style={{ display: "flex", gap: "1rem" }}>
              <button
                type="button"
                className="profile-location-btn"
                onClick={handleAuthenticate}
                disabled={authenticating || Boolean(webAuthnSupportReason)}
                style={{ flex: 1 }}
              >
                <ShieldCheck size={15} />
                {authenticating ? "Verifying…" : "Verify Identity"}
              </button>
              <button
                type="button"
                className="profile-location-btn"
                onClick={onCancel}
                style={{
                  flex: 1,
                  backgroundColor: "transparent",
                  border: "1px solid var(--border-color, #ddd)",
                  color: "var(--text-color, #333)",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
