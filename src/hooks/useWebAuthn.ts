import { useState } from "react";
import {
  clearPasskeyCredentialId,
  loadPasskeyCredentialId,
  loadPasskeyLastAuthAt,
  savePasskeyCredentialId,
  savePasskeyLastAuthAt,
} from "../lib/storage";

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

export function useWebAuthn(userEmail?: string, userName?: string) {
  const [registering, setRegistering] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const [credentialId, setCredentialId] = useState<string | null>(() =>
    loadPasskeyCredentialId(),
  );
  const [lastAuthenticatedAt, setLastAuthenticatedAt] = useState<number | null>(
    () => loadPasskeyLastAuthAt(),
  );
  const [authState, setAuthState] = useState<AuthState>({ status: "idle" });

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
          name: userEmail || "local-user@pwa.local",
          displayName: userName || "PWA User",
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

  return {
    registering,
    authenticating,
    credentialId,
    lastAuthenticatedAt,
    authState,
    webAuthnSupportReason,
    registerCredential,
    authenticateCredential,
    resetCredential,
  };
}
