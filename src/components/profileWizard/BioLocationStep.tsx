import { MapPin } from "lucide-react";
import type { ProfileData } from "../../lib/storage";
import type { LocationState } from "./types";

type BioLocationStepProps = {
  form: ProfileData;
  location: LocationState;
  onBioChange: (value: string) => void;
  onFetchLocation: () => void;
};

export function BioLocationStep({
  form,
  location,
  onBioChange,
  onFetchLocation,
}: BioLocationStepProps) {
  const addressValue =
    location.status === "done"
      ? `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`
      : "";

  return (
    <>
      <div className="profile-field">
        <label htmlFor="profile-bio" className="profile-field-label">
          Bio
        </label>
        <textarea
          id="profile-bio"
          name="bio"
          className="profile-field-input profile-field-textarea"
          value={form.bio}
          onChange={(event) => onBioChange(event.target.value)}
          placeholder="A short intro about yourself..."
          maxLength={300}
          rows={3}
        />
      </div>

      <div className="profile-field">
        <label className="profile-field-label">
          Location
          <span className="profile-field-readonly-badge">required</span>
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
            onClick={onFetchLocation}
            disabled={location.status === "loading"}
            aria-busy={location.status === "loading"}
          >
            <MapPin size={15} />
            {location.status === "loading" ? "Fetching..." : "Fetch"}
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
    </>
  );
}
