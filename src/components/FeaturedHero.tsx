import { useEffect, useState } from "react";
import type { CarouselItem } from "./CategoryCarousel";

interface Props {
  items: CarouselItem[];
  /** Milliseconds between automatic advances. Set to 0 to disable autoplay. */
  intervalMs?: number;
  onSelect?: (item: CarouselItem) => void;
}

const VISIBLE = 7;
const SPOTLIGHT_SLOT = 3;
const SMALL_W = 90;
const SMALL_H = 120;
const BIG_W = 220;
const BIG_H = 280;
const GAP = 12;

/** Hero with an auto-advancing thumbnail strip. The card that lands on the
 *  fixed "spotlight" slot blooms in size; the others shrink back. The
 *  hero copy on the left mirrors whichever item currently owns the spotlight. */
export function FeaturedHero({ items, intervalMs = 3800, onSelect }: Props) {
  const [start, setStart] = useState(0);
  const n = items.length;

  useEffect(() => {
    if (n <= 1 || intervalMs <= 0) return;
    const id = setInterval(() => setStart((s) => (s + 1) % n), intervalMs);
    return () => clearInterval(id);
  }, [n, intervalMs]);

  if (n === 0) return null;

  // X position for slot index, accounting for the wider spotlight slot.
  const slotX = (slot: number): number => {
    let x = 0;
    for (let i = 0; i < slot; i++) {
      x += (i === SPOTLIGHT_SLOT ? BIG_W : SMALL_W) + GAP;
    }
    return x;
  };
  const slotY = (slot: number): number =>
    slot === SPOTLIGHT_SLOT ? 0 : (BIG_H - SMALL_H) / 2;

  const totalWidth = slotX(VISIBLE);
  const featuredIdx = (start + SPOTLIGHT_SLOT) % n;
  const featured = items[featuredIdx];

  return (
    <section className="hero-showcase">
      <div className="hero-content">
        <span className="hero-eyebrow">★ Destacado</span>
        <h2 className="hero-title">{featured.title}</h2>
        <p className="hero-subtitle">{featured.subtitle}</p>
        <button
          type="button"
          className="primary hero-cta"
          onClick={() => onSelect?.(featured)}
        >
          Ver oferta
        </button>
      </div>

      <div
        className="hero-strip"
        style={{ width: totalWidth, height: BIG_H }}
        aria-roledescription="carousel"
      >
        {items.map((item, idx) => {
          const slot = (idx - start + n) % n;
          const visible = slot < VISIBLE;
          const spotlight = slot === SPOTLIGHT_SLOT;
          // Items just past the visible window enter from the right; the one
          // that just left (slot === n-1 in modular space) parks off the left
          // so it slides out instead of jumping back to the queue.
          let x: number;
          let y: number;
          if (visible) {
            x = slotX(slot);
            y = slotY(slot);
          } else if (slot === n - 1) {
            x = -SMALL_W - GAP;
            y = (BIG_H - SMALL_H) / 2;
          } else {
            x = totalWidth + GAP;
            y = (BIG_H - SMALL_H) / 2;
          }

          return (
            <button
              key={item.id}
              type="button"
              className={spotlight ? "hero-thumb spotlight" : "hero-thumb"}
              style={{
                width: spotlight ? BIG_W : SMALL_W,
                height: spotlight ? BIG_H : SMALL_H,
                transform: `translate(${x}px, ${y}px)`,
                background: item.background,
                opacity: visible ? 1 : 0,
                pointerEvents: visible ? "auto" : "none",
                zIndex: spotlight ? 10 : 1,
              }}
              onClick={() => {
                if (spotlight) onSelect?.(item);
                else setStart((idx - SPOTLIGHT_SLOT + n) % n);
              }}
              aria-label={item.title}
              tabIndex={visible ? 0 : -1}
            >
              <div className="hero-thumb-overlay">
                {spotlight && (
                  <span className="hero-thumb-eyebrow">{item.subtitle}</span>
                )}
                <span className="hero-thumb-title">{item.title}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="hero-progress" role="tablist" aria-label="Posición">
        {items.map((it, i) => (
          <button
            key={it.id}
            type="button"
            role="tab"
            aria-selected={i === featuredIdx}
            className={
              i === featuredIdx ? "hero-progress-dot active" : "hero-progress-dot"
            }
            onClick={() => setStart((i - SPOTLIGHT_SLOT + n) % n)}
            aria-label={`Ir a ${it.title}`}
          />
        ))}
      </div>
    </section>
  );
}
