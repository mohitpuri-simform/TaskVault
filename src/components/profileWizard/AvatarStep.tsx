import { Camera } from "lucide-react";

type AvatarStepProps = {
  avatar: string | null;
  onOpenCamera: () => void;
};

export function AvatarStep({ avatar, onOpenCamera }: AvatarStepProps) {
  return (
    <div className="profile-page-avatar-section">
      <button
        type="button"
        className="profile-page-avatar-btn"
        onClick={onOpenCamera}
        aria-label="Change profile photo"
        title="Click to change photo"
      >
        {avatar ? (
          <img src={avatar} alt="Profile" className="profile-avatar-image" />
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
  );
}
