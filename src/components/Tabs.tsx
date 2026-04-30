interface Tab<T extends string> {
  id: T;
  label: string;
  hint?: string;
}

interface Props<T extends string> {
  tabs: Tab<T>[];
  active: T;
  onChange: (id: T) => void;
}

export function Tabs<T extends string>({ tabs, active, onChange }: Props<T>) {
  return (
    <nav className="tabs" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          type="button"
          aria-selected={active === t.id}
          className={active === t.id ? "tab active" : "tab"}
          onClick={() => onChange(t.id)}
          title={t.hint}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}
