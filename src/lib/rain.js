import { useEffect } from 'react';
import { CAP, rnd } from './env.js';

export function useRain(canvasRef, on, levelRef) {
  useEffect(() => {
    const c = canvasRef.current, ctx = c.getContext("2d");
    let w, H, raf = 0, run = false;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => { w = innerWidth; H = innerHeight; c.width = w * dpr; c.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    resize();
    const mk = (near) => ({ x: rnd(0, w + 80), y: rnd(-H, H), v: near ? rnd(5, 8) : rnd(12, 20), l: near ? rnd(10, 18) : rnd(12, 30), a: near ? .5 : rnd(.12, .35) });
    const far = Array.from({ length: 300 }, () => mk(false)), near = Array.from({ length: 36 }, () => mk(true));
    const glass = Array.from({ length: 9 }, () => ({ x: rnd(0, w), y: rnd(0, H), r: rnd(2, 4.5), v: 0, wait: rnd(0, 200), t: [] }));
    const draw = () => {
      const L = levelRef.current, nf = Math.round((40 + 260 * L) * CAP), nn = Math.round((4 + 32 * L) * CAP), wind = .08 + .25 * L, sp = .8 + .6 * L;
      ctx.clearRect(0, 0, w, H); ctx.lineCap = "round";
      for (let i = 0; i < nf; i++) {
        const s = far[i]; s.y += s.v * sp; s.x -= s.v * sp * wind;
        if (s.y > H + 30 || s.x < -40) { s.y = rnd(-60, -5); s.x = rnd(0, w + 80); }
        ctx.strokeStyle = `rgba(175,210,245,${s.a})`; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x + s.l * wind, s.y - s.l); ctx.stroke();
      }
      for (let i = 0; i < nn; i++) {
        const s = near[i]; s.y += s.v * sp; s.x -= s.v * sp * wind * .6;
        if (s.y > H + 30 || s.x < -40) { s.y = rnd(-60, -5); s.x = rnd(0, w + 80); }
        ctx.fillStyle = "rgba(190,225,255,.25)"; ctx.beginPath(); ctx.ellipse(s.x, s.y, 1.6, s.l / 2, .12, 0, 6.3); ctx.fill();
      }
      for (const g of glass) {
        if (g.wait > 0) g.wait--; else {
          g.v = Math.min(g.v + .02, 1.6) * (Math.random() < .03 ? .2 : 1); g.y += g.v; g.x += rnd(-.12, .12);
          g.t.push([g.x, g.y]); if (g.t.length > 28) g.t.shift();
          if (g.y > H + 10) { g.y = rnd(-40, H * .4); g.x = rnd(0, w); g.v = 0; g.t = []; g.wait = rnd(40, 260); }
        }
        if (g.t.length > 1) { ctx.strokeStyle = "rgba(170,210,255,.10)"; ctx.lineWidth = g.r * .6; ctx.beginPath(); g.t.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); }
        const gr = ctx.createRadialGradient(g.x - g.r * .3, g.y - g.r * .3, 0, g.x, g.y, g.r);
        gr.addColorStop(0, "rgba(230,245,255,.55)"); gr.addColorStop(1, "rgba(120,170,220,.12)");
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(g.x, g.y, g.r, 0, 6.3); ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    const start = () => { if (!run && on && !document.hidden) { run = true; raf = requestAnimationFrame(draw); } };
    const stop = () => { run = false; cancelAnimationFrame(raf); };
    const vis = () => (document.hidden ? stop() : start());
    ctx.clearRect(0, 0, w, H); start();
    document.addEventListener("visibilitychange", vis); addEventListener("resize", resize);
    return () => { stop(); document.removeEventListener("visibilitychange", vis); removeEventListener("resize", resize); ctx.clearRect(0, 0, w, H); };
  }, [on]);
}
