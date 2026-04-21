import type { Filters, Platform } from "../types";
import { PLATFORM_LABELS } from "../types";

interface Props {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  count: number;
}

const PLATFORMS: { value: Platform | ""; label: string }[] = [
  { value: "", label: "Todas" },
  { value: "psn", label: "PlayStation" },
  { value: "xbox", label: "Xbox" },
  { value: "nintendo", label: "Nintendo" },
  { value: "steam", label: "Steam" },
];

export function FiltersBar({ filters, setFilters, count }: Props) {
  return (
    <div className="filters">
      <div className="platform-chips" role="tablist">
        {PLATFORMS.map((p) => (
          <button
            key={p.value}
            type="button"
            role="tab"
            aria-selected={filters.platform === p.value}
            className={
              filters.platform === p.value ? "chip active" : "chip"
            }
            onClick={() =>
              setFilters((f) => ({ ...f, platform: p.value as Platform | "" }))
            }
          >
            {p.label}
          </button>
        ))}
      </div>
      <input
        type="search"
        placeholder="Buscar por nombre…"
        value={filters.search}
        onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
      />
      <label>
        Dcto mín %
        <input
          type="number"
          min={0}
          max={100}
          step={5}
          value={filters.minDiscount}
          onChange={(e) =>
            setFilters((f) => ({ ...f, minDiscount: parseInt(e.target.value) || 0 }))
          }
        />
      </label>
      <label className="chk">
        <input
          type="checkbox"
          checked={filters.onlySelected}
          onChange={(e) =>
            setFilters((f) => ({ ...f, onlySelected: e.target.checked }))
          }
        />
        Solo seleccionados
      </label>
      <label className="chk">
        <input
          type="checkbox"
          checked={filters.hidePublished}
          onChange={(e) =>
            setFilters((f) => ({ ...f, hidePublished: e.target.checked }))
          }
        />
        Ocultar publicados
      </label>
      <label className="chk">
        <input
          type="checkbox"
          checked={filters.onlyWithMarket}
          onChange={(e) =>
            setFilters((f) => ({ ...f, onlyWithMarket: e.target.checked }))
          }
        />
        Solo con competencia
      </label>
      <label>
        Orden
        <select
          value={filters.sort}
          onChange={(e) =>
            setFilters((f) => ({ ...f, sort: e.target.value as Filters["sort"] }))
          }
        >
          <option value="discount">Mayor descuento</option>
          <option value="price">Menor precio</option>
          <option value="name">Nombre</option>
          <option value="market">Menor precio mercado</option>
        </select>
      </label>
      <span className="count">{count} juegos</span>
    </div>
  );
}
