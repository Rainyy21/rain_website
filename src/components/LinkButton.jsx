import { useEffect, useRef } from 'react';
import { REDUCED, rnd } from '../lib/env.js';
import { ripple } from '../lib/effects.js';
import { trackClick } from '../tracker.js';

export default function LinkButton({ item, featured }) {
  const fog = useRef(null);
  const dirty = useRef(0);
  const deco = useRef(null);
  if (!deco.current) {
    deco.current = {
      beads: [rnd(12, 40), rnd(55, 88)].map((l, i) => ({ l, d: rnd(0, 6) + i })),
      drips: [rnd(10, 40), rnd(55, 90)].map((l, i) => ({ l, d: rnd(0, 5) + i * 2 })),
    };
  }

  const paint = (a) => {
    const c = fog.current;
    if (!c) return;
    const x = c.getContext('2d');
    x.globalCompositeOperation = 'source-over';
    x.fillStyle = `rgba(175,200,228,${a})`;
    x.fillRect(0, 0, c.width, c.height);
  };

  useEffect(() => {
    const c = fog.current;
    if (!c) return;
    const r = c.parentNode.getBoundingClientRect();
    c.width = r.width;
    c.height = r.height;
    paint(1);
    const t = setInterval(() => { if (dirty.current > 0) { dirty.current--; paint(0.1); } }, 250);
    return () => clearInterval(t);
  }, []);

  const wipe = (e) => {
    const c = fog.current;
    if (!c) return;
    const r = c.getBoundingClientRect();
    const x = c.getContext('2d');
    x.globalCompositeOperation = 'destination-out';
    x.beginPath();
    x.arc(e.clientX - r.left, e.clientY - r.top, 24, 0, 6.3);
    x.fill();
    dirty.current = 25;
  };

  const onClick = () => {
    if (navigator.vibrate) navigator.vibrate(10);
    trackClick(item.id);
  };

  const external = item.href.startsWith('http');
  return (
    <div className="wrap">
      <a
        className={'btn' + (featured ? ' feat' : '')}
        href={item.href}
        onPointerDown={(e) => { ripple(e); wipe(e); }}
        onPointerMove={wipe}
        onClick={onClick}
        target={external ? '_blank' : undefined}
        rel="noopener"
        aria-label={item.label + (item.sub ? ', ' + item.sub : '')}
      >
        {!REDUCED && <canvas className="fog" ref={fog} aria-hidden="true" />}
        {!REDUCED && deco.current.beads.map((b, i) => (
          <span key={i} className="bead" style={{ left: b.l + '%', animationDelay: -b.d + 's' }} />
        ))}
        <span className="ico" aria-hidden="true">
          {item.icon.startsWith('/') ? (
            <img src={item.icon} alt="" className="ico-svg" />
          ) : (
            item.icon
          )}
        </span>
        <span>
          {item.label}
          {item.sub && <span className="sub">{item.sub}</span>}
        </span>
      </a>
      {!REDUCED && deco.current.drips.map((d, i) => (
        <span key={i} className="drip" style={{ left: d.l + '%', animationDelay: -d.d + 's' }} />
      ))}
    </div>
  );
}
