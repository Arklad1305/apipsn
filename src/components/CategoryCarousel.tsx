import { useState, type CSSProperties } from "react";

export interface CarouselItem {
  id: string;
  title: string;
  subtitle: string;
  /** CSS background (gradient or url(...)). */
  background: string;
}

interface Props {
  items: CarouselItem[];
  onSelect?: (item: CarouselItem) => void;
  heading?: string;
}

/** 3D coverflow carousel. The centered card stands upright and bright,
 *  side cards rotate back on Y and dim so only the center draws the eye. */
export function CategoryCarousel({ items, onSelect, heading }: Props) {
  const [active, setActive] = useState(Math.floor(items.length / 2));
  const n = items.length;
  const prev = () => setActive((i) => (i - 1 + n) % n);
  const next = () => setActive((i) => (i + 1) % n);

  return (
    <section className="coverflow-wrap">
      {heading && <h3 className="coverflow-heading">{heading}</h3>}
      <div className="coverflow" role="region" aria-label={heading || "carrusel"}>
        <button
          type="button"
          className="coverflow-nav coverflow-prev"
          onClick={prev}
          aria-label="Anterior"
        >
          ‹
        </button>

        <div className="coverflow-track">
          {items.map((it, i) => {
            // Shortest signed distance from the active card, so looping feels
            // natural near the edges.
            let offset = i - active;
            if (offset > n / 2) offset -= n;
            if (offset < -n / 2) offset += n;
            const abs = Math.abs(offset);

            const style: CSSProperties = {
              transform: [
                `translateX(${offset * 190}px)`,
                `translateZ(${-abs * 120}px)`,
                `rotateY(${offset === 0 ? 0 : offset > 0 ? -28 : 28}deg)`,
              ].join(" "),
              zIndex: n - abs,
              opacity: abs > 3 ? 0 : 1,
              filter: offset === 0 ? "brightness(1)" : `brightness(${0.55 - Math.min(abs - 1, 2) * 0.1})`,
              pointerEvents: abs > 3 ? "none" : "auto",
              background: it.background,
            };

            return (
              <button
                key={it.id}
                type="button"
                className={offset === 0 ? "coverflow-card active" : "coverflow-card"}
                style={style}
                onClick={() => (offset === 0 ? onSelect?.(it) : setActive(i))}
                aria-label={it.title}
                tabIndex={abs > 1 ? -1 : 0}
              >
                <div className="coverflow-overlay">
                  <div className="coverflow-caption">
                    <div className="coverflow-subtitle">{it.subtitle}</div>
                    <div className="coverflow-title">{it.title}</div>
                  </div>
                  <span className="coverflow-cta">Ver más</span>
                </div>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="coverflow-nav coverflow-next"
          onClick={next}
          aria-label="Siguiente"
        >
          ›
        </button>
      </div>

      <div className="coverflow-dots" role="tablist">
        {items.map((it, i) => (
          <button
            key={it.id}
            type="button"
            role="tab"
            aria-selected={i === active}
            className={i === active ? "coverflow-dot active" : "coverflow-dot"}
            onClick={() => setActive(i)}
            aria-label={`Ir a ${it.title}`}
          />
        ))}
      </div>
    </section>
  );
}
