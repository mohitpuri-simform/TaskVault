type TopBarProps = {
  highlighted: boolean;
  online: boolean;
  networkQuality: string;
  syncing: boolean;
  queueLength: number;
  onEnableNotifications: () => void;
  onOpenProfile: () => void;
};

export function TopBar({
  highlighted,
  online,
  networkQuality,
  syncing,
  queueLength,
  onEnableNotifications,
  onOpenProfile,
}: TopBarProps) {
  return (
    <header
      id="feature-network"
      className={`topbar ${highlighted ? "feature-highlight" : ""}`}
    >
      <h1>PWA Todo Studio</h1>
      <div className="status-row">
        <span className={`status-dot ${online ? "online" : "offline"}`}>
          {online ? "Online" : "Offline"}
        </span>
        <span
          className={`network-quality-dot network-quality-${networkQuality}`}
        >
          Net {networkQuality === "avg" ? "Avg" : networkQuality}
        </span>
        <span>{syncing ? "Syncing..." : `${queueLength} queued`}</span>
        <button type="button" onClick={onEnableNotifications}>
          Enable Notifications
        </button>
        <button
          type="button"
          className="topbar-profile-btn"
          onClick={onOpenProfile}
          aria-label="Open profile"
        >
          My Profile
        </button>
      </div>
    </header>
  );
}
