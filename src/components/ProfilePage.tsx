import { useState } from "react";
import { Camera, MapPin, Save, X } from "lucide-react";
import {
  loadAvatarPhoto,
  loadProfile,
  saveAvatarPhoto,
  saveProfile,
  type ProfileData,
} from "../lib/storage";
import { WebcamPanel } from "./WebcamPanel";
import { PasskeyPanel } from "./PasskeyPanel";

interface Props {
  onClose: () => void;
}

type LocationState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; lat: number; lng: number }
  | { status: "error"; message: string };

export function ProfilePage({ onClose }: Props) {
  const [avatar, setAvatar] = useState<string | null>(() => loadAvatarPhoto());
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [form, setForm] = useState<ProfileData>(() => loadProfile());
  const [location, setLocation] = useState<LocationState>({ status: "idle" });
  const [saved, setSaved] = useState(false);

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

            {/* WebAuthn / Passkey Authentication */}
            <PasskeyPanel userEmail={form.email} userName={form.name} />
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
