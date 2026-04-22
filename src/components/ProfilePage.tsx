import { useState } from "react";
import {
  Camera,
  Fingerprint,
  MapPin,
  Save,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  clearPasskeyCredentialId,
  loadAvatarPhoto,
  loadPasskeyCredentialId,
  loadPasskeyLastAuthAt,
  loadProfile,
  saveAvatarPhoto,
  savePasskeyCredentialId,
  savePasskeyLastAuthAt,
  saveProfile,
  type ProfileData,
} from "../lib/storage";
import { WebcamPanel } from "./WebcamPanel";

interface Props {
  onClose: () => void;
}

type LocationState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; lat: number; lng: number }
  | { status: "error"; message: string };

type AuthState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

function toBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(value: string): ArrayBuffer {
  const padding = (4 - (value.length % 4)) % 4;
  const base64 = (value + "=".repeat(padding))
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer.slice(0) as ArrayBuffer;
}

function randomBytes(length: number): ArrayBuffer {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes.buffer.slice(0) as ArrayBuffer;
}

function getWebAuthnSupportReason(): string | null {
  if (!window.isSecureContext) {
    return "WebAuthn requires a secure context (HTTPS or localhost).";
  }

  if (typeof window.PublicKeyCredential === "undefined") {
    return "This browser does not support the Web Authentication API.";
  }

  if (!navigator.credentials) {
    return "Credential Management API is unavailable in this browser.";
  }

  return null;
}

export function ProfilePage({ onClose }: Props) {
  const [avatar, setAvatar] = useState<string | null>(() => loadAvatarPhoto());
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [form, setForm] = useState<ProfileData>(() => loadProfile());
  const [location, setLocation] = useState<LocationState>({ status: "idle" });
  const [saved, setSaved] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const [credentialId, setCredentialId] = useState<string | null>(() =>
    loadPasskeyCredentialId(),
  );
  const [lastAuthenticatedAt, setLastAuthenticatedAt] = useState<number | null>(
    () => loadPasskeyLastAuthAt(),
  );
  const [authState, setAuthState] = useState<AuthState>({ status: "idle" });

  function handleCapture(dataUrl: string) {
    saveAvatarPhoto(dataUrl);
    setAvatar(dataUrl);
    setShowCameraModal(false);
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setSaved(false);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    saveProfile(form);
    setSaved(true);
  }

  function fetchLocation() {
    if (!navigator.geolocation) {
      setLocation({ status: "error", message: "Geolocation not supported" });
      return;
    }
    setLocation({ status: "loading" });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          status: "done",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => {
        setLocation({ status: "error", message: err.message });
      },
      { timeout: 10000 },
    );
  }

  const addressValue =
    location.status === "done"
      ? `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`
      : "";

  const webAuthnSupportReason = getWebAuthnSupportReason();

  async function registerCredential() {
    if (webAuthnSupportReason) {
      setAuthState({ status: "error", message: webAuthnSupportReason });
      return;
    }

    setRegistering(true);
    setAuthState({ status: "idle" });

    try {
      const rpId = window.location.hostname;
      const userId = randomBytes(16);
      const challenge = randomBytes(32);

      const publicKey: PublicKeyCredentialCreationOptions = {
        rp: {
          name: "PWA Todo Studio",
          id: rpId,
        },
        user: {
          id: userId,
          name: form.email || "local-user@pwa.local",
          displayName: form.name || "PWA User",
        },
        challenge,
        pubKeyCredParams: [
          { type: "public-key", alg: -7 },
          { type: "public-key", alg: -257 },
        ],
        timeout: 60000,
        attestation: "none",
        authenticatorSelection: {
          residentKey: "preferred",
          userVerification: "preferred",
        },
        excludeCredentials: credentialId
          ? [{ id: fromBase64Url(credentialId), type: "public-key" }]
          : [],
      };

      const created = (await navigator.credentials.create({
        publicKey,
      })) as PublicKeyCredential | null;

      if (!created) {
        setAuthState({
          status: "error",
          message: "No credential was created.",
        });
        return;
      }

      const encodedCredentialId = toBase64Url(created.rawId);
      setCredentialId(encodedCredentialId);
      savePasskeyCredentialId(encodedCredentialId);
      setAuthState({
        status: "success",
        message:
          "Credential registered. You can now authenticate using Face ID, fingerprint, or a security key.",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to register passkey.";
      setAuthState({ status: "error", message });
    } finally {
      setRegistering(false);
    }
  }

  async function authenticateCredential() {
    if (webAuthnSupportReason) {
      setAuthState({ status: "error", message: webAuthnSupportReason });
      return;
    }

    if (!credentialId) {
      setAuthState({
        status: "error",
        message: "No registered credential found. Register one first.",
      });
      return;
    }

    setAuthenticating(true);
    setAuthState({ status: "idle" });

    try {
      const publicKey: PublicKeyCredentialRequestOptions = {
        challenge: randomBytes(32),
        rpId: window.location.hostname,
        allowCredentials: [
          {
            id: fromBase64Url(credentialId),
            type: "public-key",
          },
        ],
        userVerification: "preferred",
        timeout: 60000,
      };

      const assertion = (await navigator.credentials.get({
        publicKey,
      })) as PublicKeyCredential | null;

      if (!assertion) {
        setAuthState({ status: "error", message: "Authentication failed." });
        return;
      }

      const now = Date.now();
      setLastAuthenticatedAt(now);
      savePasskeyLastAuthAt(now);
      setAuthState({
        status: "success",
        message: "Authentication successful using your registered credential.",
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to authenticate with passkey.";
      setAuthState({ status: "error", message });
    } finally {
      setAuthenticating(false);
    }
  }

  function resetCredential() {
    clearPasskeyCredentialId();
    setCredentialId(null);
    setLastAuthenticatedAt(null);
    setAuthState({ status: "idle" });
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
        {/* Header */}
        <div className="profile-page-header">
          <h2 id="profile-page-title" className="profile-page-title">
            My Profile
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

        {/* Body */}
        <div className="profile-page-body">
          {/* Avatar section */}
          <div className="profile-page-avatar-section">
            <button
              type="button"
              className="profile-page-avatar-btn"
              onClick={() => setShowCameraModal(true)}
              aria-label="Change profile photo"
              title="Click to change photo"
            >
              {avatar ? (
                <img
                  src={avatar}
                  alt="Profile"
                  className="profile-avatar-image"
                />
              ) : (
                <div className="profile-avatar-placeholder">
                  <svg
                    width="36"
                    height="36"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    aria-hidden="true"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
              )}
              <div className="profile-page-avatar-badge">
                <Camera size={14} />
              </div>
            </button>
            <p className="profile-page-avatar-hint">
              Click to update photo via webcam
            </p>
          </div>

          {/* Form */}
          <form className="profile-page-form" onSubmit={handleSave} noValidate>
            {/* Name */}
            <div className="profile-field">
              <label htmlFor="profile-name" className="profile-field-label">
                Full Name
              </label>
              <input
                id="profile-name"
                name="name"
                type="text"
                className="profile-field-input"
                value={form.name}
                onChange={handleChange}
                placeholder="Ada Lovelace"
                maxLength={80}
              />
            </div>

            {/* Email */}
            <div className="profile-field">
              <label htmlFor="profile-email" className="profile-field-label">
                Email
              </label>
              <input
                id="profile-email"
                name="email"
                type="email"
                className="profile-field-input"
                value={form.email}
                onChange={handleChange}
                placeholder="ada@example.com"
                maxLength={120}
              />
            </div>

            {/* Bio */}
            <div className="profile-field">
              <label htmlFor="profile-bio" className="profile-field-label">
                Bio
              </label>
              <textarea
                id="profile-bio"
                name="bio"
                className="profile-field-input profile-field-textarea"
                value={form.bio}
                onChange={handleChange}
                placeholder="A short intro about yourself…"
                maxLength={300}
                rows={3}
              />
            </div>

            {/* Address (read-only, fetched from Geolocation) */}
            <div className="profile-field">
              <label className="profile-field-label">
                Location&nbsp;
                <span className="profile-field-readonly-badge">read-only</span>
              </label>
              <div className="profile-location-row">
                <input
                  type="text"
                  className="profile-field-input profile-field-readonly"
                  value={addressValue}
                  readOnly
                  placeholder="Hit 'Fetch' to get your coordinates"
                  aria-label="Location coordinates"
                />
                <button
                  type="button"
                  className="profile-location-btn"
                  onClick={fetchLocation}
                  disabled={location.status === "loading"}
                  aria-busy={location.status === "loading"}
                >
                  <MapPin size={15} />
                  {location.status === "loading" ? "Fetching…" : "Fetch"}
                </button>
              </div>
              {location.status === "error" && (
                <p className="profile-location-error">{location.message}</p>
              )}
              {location.status === "done" && (
                <p className="profile-location-note">
                  Lat {location.lat.toFixed(6)} · Lng {location.lng.toFixed(6)}
                </p>
              )}
            </div>

            {/* Save */}
            <button type="submit" className="profile-save-btn">
              <Save size={16} />
              {saved ? "Saved!" : "Save Profile"}
            </button>

            {/* WebAuthn */}
            <section className="profile-passkey" aria-live="polite">
              <div className="profile-passkey-head">
                <h3 className="profile-passkey-title">
                  Passkey Authentication
                </h3>
                <span className="profile-field-readonly-badge">WebAuthn</span>
              </div>
              <p className="profile-passkey-copy">
                Register a credential to authenticate with Face ID, your
                fingerprint reader, or a USB security key.
              </p>
              <p className="profile-passkey-note">
                Best practice: in production, challenges and verification must
                be done on your server using expected origin and RP ID.
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
                    authenticating ||
                    !credentialId ||
                    Boolean(webAuthnSupportReason)
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
                <p className="profile-location-error">
                  {webAuthnSupportReason}
                </p>
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
                  Last authenticated:{" "}
                  {new Date(lastAuthenticatedAt).toLocaleString()}
                </p>
              ) : null}

              {authState.status === "success" ? (
                <p className="profile-passkey-success">{authState.message}</p>
              ) : null}

              {authState.status === "error" ? (
                <p className="profile-location-error">{authState.message}</p>
              ) : null}
            </section>
          </form>
        </div>
      </div>

      {/* Camera modal */}
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
