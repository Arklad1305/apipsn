interface Props {
  onRefresh: () => void;
  onRefreshCompetitors: () => void;
  onSeed: () => void;
  onClear: () => void;
  onToggleSettings: () => void;
  exportHref: string;
}

export function Toolbar({
  onRefresh,
  onRefreshCompetitors,
  onSeed,
  onClear,
  onToggleSettings,
  exportHref,
}: Props) {
  return (
    <div className="toolbar">
      <button className="primary" onClick={onRefresh}>
        Actualizar ofertas
      </button>
      <button
        onClick={onRefreshCompetitors}
        title="Scrapea tiendas de la competencia y calcula matches"
      >
        Actualizar competencia
      </button>
      <button onClick={onSeed} title="Carga datos de demo para explorar el panel">
        Seed demo
      </button>
      <a className="button" href={exportHref} target="_blank" rel="noopener">
        Exportar CSV
      </a>
      <button onClick={onToggleSettings}>Ajustes</button>
      <button className="danger" onClick={onClear}>
        Vaciar
      </button>
    </div>
  );
}
