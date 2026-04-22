import { useState } from "react";
import { X } from "lucide-react";
import { loadAvatarPhoto, saveAvatarPhoto } from "../lib/storage";
import { WebcamPanel } from "./WebcamPanel";

export function ProfileAvatar() {
  const [avatar, setAvatar] = useState<string | null>(() => loadAvatarPhoto());
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [greeting] = useState(() => {
    const hour = new Date().getHours();
    if (hour >= 12 && hour < 18) return "Good afternoon";
    if (hour >= 18) return "Good evening";
    return "Good morning";
  });

  const handleCapture = (dataUrl: string) => {
    saveAvatarPhoto(dataUrl);
    setAvatar(dataUrl);
    setShowCameraModal(false);
  };

  const handleAvatarClick = () => {
    setShowCameraModal(true);
  };

  return (
    <>
      <div className="profile-banner">
        <div className="profile-greeting">
          <h2 className="profile-greeting-text">{greeting}</h2>
          <p className="profile-greeting-subtitle">Ready to get things done?</p>
        </div>
        <button
          type="button"
          className="profile-avatar-button"
          onClick={handleAvatarClick}
          aria-label="Click to capture profile photo"
          title="Click to change photo"
        >
          {avatar ? (
            <img src={avatar} alt="Profile" className="profile-avatar-image" />
          ) : (
            <div className="profile-avatar-placeholder">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
          )}
        </button>
      </div>

      {showCameraModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowCameraModal(false)}
        >
          <div
            className="capture-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="capture-modal-title"
          >
            <div className="capture-modal-header">
              <h3 id="capture-modal-title" className="capture-modal-title">
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
              <WebcamPanel onCapture={handleCapture} showCaptureButton={true} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
