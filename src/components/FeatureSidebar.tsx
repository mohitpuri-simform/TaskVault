import { FEATURE_ITEMS } from "../lib/constants";

interface FeatureSidebarProps {
  activeItemId: string | null;
  onSelect: (item: (typeof FEATURE_ITEMS)[number]) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function FeatureSidebar({
  activeItemId,
  onSelect,
  isOpen,
  onClose,
}: FeatureSidebarProps) {
  return (
    <>
      <div
        className={`feature-sidebar-backdrop${isOpen ? " open" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        id="feature-sidebar-panel"
        className={`feature-sidebar${isOpen ? " open" : ""}`}
        aria-label="Implemented features"
      >
        <div className="feature-sidebar-head">
          <h2>Implemented Features</h2>
          <button
            type="button"
            className="feature-sidebar-close"
            onClick={onClose}
            aria-label="Close features sidebar"
          >
            Close
          </button>
          <p>Click any item to highlight it in the main UI.</p>
        </div>

        <ul className="feature-list">
          {FEATURE_ITEMS.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={`feature-item${activeItemId === item.id ? " active" : ""}`}
                onClick={() => {
                  onSelect(item);
                  onClose();
                }}
                aria-label={`Highlight ${item.name}`}
              >
                <span className="feature-name">{item.name}</span>
                <span className="feature-desc">{item.description}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>
    </>
  );
}
