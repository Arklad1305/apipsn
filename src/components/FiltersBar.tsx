import type { Filters } from "../types";

interface Props {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  count: number;
}

export function FiltersBar({ filters, setFilters, count }: Props) {
  return (
    <div className="filters">
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
        </select>
      </label>
      <span className="count">{count} juegos</span>
    </div>
  );
}
