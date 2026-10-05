export const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
export const LOW = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4;
export const CAP = LOW ? 0.5 : 1; // particle cap by device speed
export const rnd = (a, b) => a + Math.random() * (b - a);

