import { REDUCED, rnd } from './env.js';

export function ripple(e) {
  const el = e.currentTarget, r = el.getBoundingClientRect(), s = Math.max(r.width, r.height) * 2, n = document.createElement("span");
  n.className = "ripple"; n.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`;
  n.addEventListener("animationend", () => n.remove()); el.appendChild(n);
  if (REDUCED) return;
  for (let i = 0; i < 7; i++) {
    const p = document.createElement("span"), a = rnd(-3.1, 0), d = rnd(18, 42);
    p.className = "sp"; p.style.cssText = `left:${e.clientX}px;top:${e.clientY}px;--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d + 14}px`;
    p.addEventListener("animationend", () => p.remove()); document.body.appendChild(p);
  }
}
