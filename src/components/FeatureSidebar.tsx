interface FeatureItem {
  id: string;
  name: string;
  description: string;
  targetId: string;
}

interface FeatureSidebarProps {
  items: FeatureItem[];
  activeItemId: string | null;
  onSelect: (item: FeatureItem) => void;
}

export function FeatureSidebar({
  items,
  activeItemId,
  onSelect,
}: FeatureSidebarProps) {
  return (
    <aside className="feature-sidebar" aria-label="Implemented features">
      <div className="feature-sidebar-head">
        <h2>Implemented Features</h2>
        <p>Click any item to highlight it in the main UI.</p>
      </div>

      <ul className="feature-list">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className={`feature-item${activeItemId === item.id ? " active" : ""}`}
              onClick={() => onSelect(item)}
              aria-label={`Highlight ${item.name}`}
            >
              <span className="feature-name">{item.name}</span>
              <span className="feature-desc">{item.description}</span>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
