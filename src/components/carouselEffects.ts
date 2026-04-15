import type { CSSProperties } from "react";

/** Visual styles for the 3D carousel. Each effect is a pure function of the
 *  card's offset from the active index, so we can swap them at runtime. */
export type CarouselEffect = "coverflow" | "cylinder" | "stack";

export const EFFECT_LABELS: Record<CarouselEffect, string> = {
  coverflow: "Coverflow",
  cylinder: "Cilindro",
  stack: "Mazo",
};

export interface EffectConfig {
  /** Outer height of the carousel viewport. */
  height: number;
  /** Width / height of every card, in px. */
  cardWidth: number;
  cardHeight: number;
  /** Perspective applied to the parent. */
  perspective: number;
  /** How many cards away from the active one still render (rest get opacity 0). */
  visibleRadius: number;
  /** When true, cards paint back-to-front by `abs(offset)` descending. Turn off
   *  for stack (we want high-offset cards *behind* the active one). */
  reverseZOrder?: boolean;
}

export const EFFECT_CONFIG: Record<CarouselEffect, EffectConfig> = {
  coverflow: {
    height: 380,
    cardWidth: 260,
    cardHeight: 360,
    perspective: 1400,
    visibleRadius: 3,
    reverseZOrder: true,
  },
  cylinder: {
    height: 420,
    cardWidth: 220,
    cardHeight: 320,
    perspective: 1600,
    visibleRadius: 4,
    reverseZOrder: true,
  },
  stack: {
    height: 400,
    cardWidth: 280,
    cardHeight: 360,
    perspective: 1800,
    visibleRadius: 4,
    reverseZOrder: false,
  },
};

/** Returns the per-card CSS for a given effect and signed offset from the
 *  active card. `offset` is already wrapped to the shortest loop distance. */
export function cardStyle(
  effect: CarouselEffect,
  offset: number
): CSSProperties {
  const abs = Math.abs(offset);

  if (effect === "coverflow") {
    const step = Math.min(abs - 1, 2);
    const brightness = offset === 0 ? 1 : 0.55 - step * 0.1;
    return {
      transform: [
        `translateX(${offset * 190}px)`,
        `translateZ(${-abs * 120}px)`,
        `rotateY(${offset === 0 ? 0 : offset > 0 ? -28 : 28}deg)`,
      ].join(" "),
      filter: `brightness(${brightness})`,
    };
  }

  if (effect === "cylinder") {
    // Cards sit on a vertical cylinder rotating around Y. The center card
    // faces us; side cards curve away so you see their side, not their back.
    const anglePerStep = 28;
    const radius = 500;
    const brightness = offset === 0 ? 1 : Math.max(0.35, 0.85 - abs * 0.18);
    return {
      transform: [
        `rotateY(${offset * anglePerStep}deg)`,
        `translateZ(${radius}px)`,
      ].join(" "),
      filter: `brightness(${brightness})`,
    };
  }

  // stack: past cards slide off to the left; future cards stack *behind* the
  // active one, slightly lifted and smaller so they peek out.
  if (offset < 0) {
    return {
      transform: [
        `translateX(${offset * 60}%)`,
        `translateY(${offset * 4}px)`,
        `rotateZ(${offset * 5}deg)`,
      ].join(" "),
      opacity: 0,
      pointerEvents: "none",
    };
  }
  const scale = Math.max(0.78, 1 - offset * 0.05);
  const lift = offset * -14;
  const depth = offset * -80;
  const brightness = offset === 0 ? 1 : Math.max(0.5, 0.9 - offset * 0.12);
  return {
    transform: [
      `translateY(${lift}px)`,
      `translateZ(${depth}px)`,
      `scale(${scale})`,
    ].join(" "),
    filter: `brightness(${brightness})`,
  };
}
