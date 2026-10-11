/** Settings: theme, skin (plain/technical), reduced motion. */
import type { JSX } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../app/AppContext';

export function Settings(): JSX.Element {
  const app = useApp();
  return (
    <div className="wrap">
      <header className="top">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="badge" aria-hidden="true">⚙</div>
          <div>
            <div className="kicker">Dt3rmind</div>
            <h1>Settings</h1>
          </div>
        </div>
        <Link className="btn ghost" to="/">Map</Link>
      </header>

      <section className="world" style={{ marginTop: 16 }}>
        <div className="ph"><span>Theme</span></div>
        <div className="tg" role="group" aria-label="Theme">
          <button aria-pressed={app.theme === 'dark'} onClick={() => app.setTheme('dark')}>Dark</button>
          <button aria-pressed={app.theme === 'light'} onClick={() => app.setTheme('light')}>Light</button>
        </div>
      </section>

      <section className="world" style={{ marginTop: 14 }}>
        <div className="ph"><span>Skin</span></div>
        <div className="theme" style={{ marginBottom: 8 }}>Plain English for everyday tools; Technical shows code.</div>
        <div className="tg" role="group" aria-label="Skin">
          <button aria-pressed={app.skin === 'plain'} onClick={() => app.setSkin('plain')}>Plain</button>
          <button aria-pressed={app.skin === 'tech'} onClick={() => app.setSkin('tech')}>Technical</button>
        </div>
      </section>

      <section className="world" style={{ marginTop: 14 }}>
        <div className="ph"><span>Motion</span></div>
        <label style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 14 }}>
          <input
            type="checkbox"
            checked={app.reducedMotion}
            onChange={(e) => app.setReducedMotion(e.target.checked)}
          />
          Reduce motion (also honors your system setting)
        </label>
      </section>
    </div>
  );
}
