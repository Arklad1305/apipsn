interface Props {
  onRefresh: () => void;
  onRefreshCompetitors: () => void;
  onClear: () => void;
  exportHref: string;
  variant: "offers" | "watchlist" | "settings";
}

/** Contextual action bar. The primary "refresh" action sits on the offers tab;
 *  on watchlist we only expose refresh + export; on settings we hide it
 *  entirely because the save buttons live inside the page. */
export function Toolbar({
  onRefresh,
  onRefreshCompetitors,
  onClear,
  exportHref,
  variant,
}: Props) {
  if (variant === "settings") return null;
  return (
    <div className="toolbar">
      <button className="primary" onClick={onRefresh}>
        Actualizar ofertas
      </button>
      {variant === "offers" && (
        <button
          onClick={onRefreshCompetitors}
          title="Scrapea tiendas de la competencia y calcula matches"
        >
          Actualizar competencia
        </button>
      )}
      <a className="button" href={exportHref} target="_blank" rel="noopener">
        Exportar CSV
      </a>
      {variant === "offers" && (
        <button className="danger" onClick={onClear} title="Desactivar todos los juegos">
          Vaciar
        </button>
      )}
    </div>
  );
}
