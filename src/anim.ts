import { gsap } from "gsap";

/** Stagger fade/slide-in for a list of row elements. Cheap, no-op if empty. */
export function animateRowsIn(rows: Element[]): void {
  if (!rows.length) return;
  gsap.fromTo(
    rows,
    { opacity: 0, y: 6 },
    {
      opacity: 1,
      y: 0,
      duration: 0.28,
      ease: "power2.out",
      stagger: { amount: 0.18, from: "start" },
      overwrite: "auto",
    }
  );
}

/** Pop-in for floating panels (popovers, tooltips). */
export function animatePopIn(el: Element): void {
  gsap.fromTo(
    el,
    { opacity: 0, y: -4, scale: 0.97 },
    {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.16,
      ease: "power3.out",
      overwrite: "auto",
    }
  );
}

/** Slide-down for status banners at the top of the app. */
export function animateSlideIn(el: Element): void {
  gsap.fromTo(
    el,
    { opacity: 0, y: -6 },
    {
      opacity: 1,
      y: 0,
      duration: 0.22,
      ease: "power2.out",
      overwrite: "auto",
    }
  );
}
