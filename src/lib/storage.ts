import type { QueueAction } from "../types";

const QUEUE_KEY = "pwa-queue";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadQueue() {
  return safeParse<QueueAction[]>(localStorage.getItem(QUEUE_KEY), []);
}

export function saveQueue(queue: QueueAction[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

const AVATAR_KEY = "pwa-avatar-photo";

export function loadAvatarPhoto(): string | null {
  return localStorage.getItem(AVATAR_KEY);
}

export function saveAvatarPhoto(dataUrl: string) {
  localStorage.setItem(AVATAR_KEY, dataUrl);
}

export function clearAvatarPhoto() {
  localStorage.removeItem(AVATAR_KEY);
}

const PROFILE_KEY = "pwa-profile";
const PASSKEY_CREDENTIAL_ID_KEY = "pwa-passkey-credential-id";
const PASSKEY_LAST_AUTH_AT_KEY = "pwa-passkey-last-auth-at";

export interface ProfileData {
  name: string;
  bio: string;
  email: string;
}

export function loadProfile(): ProfileData {
  return safeParse<ProfileData>(localStorage.getItem(PROFILE_KEY), {
    name: "",
    bio: "",
    email: "",
  });
}

export function saveProfile(data: ProfileData) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(data));
}

export function loadPasskeyCredentialId(): string | null {
  return localStorage.getItem(PASSKEY_CREDENTIAL_ID_KEY);
}

export function savePasskeyCredentialId(credentialId: string) {
  localStorage.setItem(PASSKEY_CREDENTIAL_ID_KEY, credentialId);
}

export function clearPasskeyCredentialId() {
  localStorage.removeItem(PASSKEY_CREDENTIAL_ID_KEY);
}

export function loadPasskeyLastAuthAt(): number | null {
  const raw = localStorage.getItem(PASSKEY_LAST_AUTH_AT_KEY);
  if (!raw) return null;

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export function savePasskeyLastAuthAt(timestamp: number) {
  localStorage.setItem(PASSKEY_LAST_AUTH_AT_KEY, String(timestamp));
}
