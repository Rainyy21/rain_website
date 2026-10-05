import { useEffect, useRef, useState } from 'react';
import data from '../links.json';
import { REDUCED, rnd } from './lib/env.js';
import { useRain } from './lib/rain.js';
import { trackVisit } from './tracker.js';
import Mascot from './components/Mascot.jsx';
import LinkButton from './components/LinkButton.jsx';

const LEVEL = 0.5; // fixed rain intensity

export default function App() {
  const { profile, featured, links } = data;
  // const taglines = profile.taglines;
  const [rain, setRain] = useState(!REDUCED);
  const [flash, setFlash] = useState(0);
  // const [tg, setTg] = useState(0);
  const canvasRef = useRef(null);
  const levelRef = useRef(LEVEL);

  useRain(canvasRef, rain, levelRef);

  useEffect(() => { trackVisit(); }, []);
  // useEffect(() => { const t = setInterval(() => setTg((n) => n + 1), 4500); return () => clearInterval(t); }, []);

  useEffect(() => {
    if (!rain || REDUCED) return;
    let t;
    const next = () => {
      t = setTimeout(() => { if (!document.hidden) setFlash((n) => n + 1); next(); }, (22 - 16 * LEVEL) * 1000 * rnd(0.5, 1.5));
    };
    next();
    return () => clearTimeout(t);
  }, [rain]);

  return (
    <div>
      <canvas className="rain" ref={canvasRef} aria-hidden="true" />
      <div key={flash} className={'flash' + (flash ? ' on' : '')} aria-hidden="true" />
      <main>
        <Mascot />
        <h1>{profile.handle}</h1>
        {/* <p className="tag" key={tg % taglines.length}>{taglines[tg % taglines.length]}</p> */}
        <nav className="links" aria-label="Links">
          {/* <LinkButton item={featured} featured /> */}
          {links.map((l) => <LinkButton key={l.id} item={l} />)}
        </nav>
        <footer>
          <button className="tog" aria-pressed={rain} onClick={() => setRain(!rain)}>{rain ? 'Rain on' : 'Rain off'}</button>
        </footer>
      </main>
    </div>
  );
}
