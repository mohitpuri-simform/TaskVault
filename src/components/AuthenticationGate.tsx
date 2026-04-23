import { ShieldCheck } from "lucide-react";
import { useEffect } from "react";
import { useWebAuthn } from "../hooks/useWebAuthn";

interface Props {
  onAuthSuccess: () => void;
  onCancel?: () => void;
  title?: string;
  message?: string;
  allowCancel?: boolean;
}

export function AuthenticationGate({
  onAuthSuccess,
  onCancel,
  title = "Verify Identity",
  message =
    "Use your registered credential (Face ID, fingerprint, or security key) to verify your identity.",
  allowCancel = true,
}: Props) {
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
        onClick={allowCancel ? onCancel : undefined}
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
            {title}
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
              <h3 style={{ marginBottom: "0.5rem" }}>Authentication Required</h3>
              <p
                style={{
                  color: "var(--text-secondary, #666)",
                  marginBottom: "1.5rem",
                }}
              >
                {message}
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
              {allowCancel ? (
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
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
