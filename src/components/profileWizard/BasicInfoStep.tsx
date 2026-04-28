import type { ProfileData } from "../../lib/storage";

type BasicInfoStepProps = {
  form: ProfileData;
  onChange: (field: keyof ProfileData, value: string) => void;
};

export function BasicInfoStep({ form, onChange }: BasicInfoStepProps) {
  return (
    <>
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
          onChange={(event) => onChange("name", event.target.value)}
          placeholder="Ada Lovelace"
          maxLength={80}
        />
      </div>

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
          onChange={(event) => onChange("email", event.target.value)}
          placeholder="ada@example.com"
          maxLength={120}
        />
      </div>
    </>
  );
}
