/**
 * WorldMap — 7 worlds + Workshop seam + capstone, locked/unlocked, stars per
 * level, rank + XP belt, and the moves-collected deck (incl. busted tricks).
 * Only worlds with authored packets show playable levels; the rest are
 * previews so wave-2 authors can see where their content lands.
 */
import type { JSX } from 'react';
import { Link } from 'react-router-dom';
import { PACKETS } from '../content/packets';
import { WORLDS, SEAM_AFTER_WORLD, SEAM_TEXT, CAPSTONE_TEXT } from '../content/worlds';
import { useApp } from '../app/AppContext';
import { isLevelUnlocked, rankForXp } from '../store/progress';

export function WorldMap(): JSX.Element {
  const app = useApp();
  const rank = rankForXp(app.progress.xp);
  const beltPct =
    rank.nextMinXp !== null
      ? Math.round(((app.progress.xp - rank.minXp) / (rank.nextMinXp - rank.minXp)) * 100)
      : 100;

  const byWorld = new Map<number, typeof PACKETS>();
  for (const p of PACKETS) {
    const list = byWorld.get(p.world) ?? [];
    list.push(p);
    byWorld.set(p.world, list);
  }

  return (
    <div className="wrap">
      <header className="top">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="badge" aria-hidden="true">D3</div>
          <div>
            <div className="kicker">Dt3rmind</div>
            <h1>Make AI prove its work</h1>
          </div>
        </div>
        <div className="meta">
          <div className="xp">Rank: <b>{rank.name}</b> · <b>{app.progress.xp}</b> XP</div>
          <div className="belt" aria-label={`Belt progress ${beltPct}%`}>
            <span>{rank.nextMinXp !== null ? `${app.progress.xp}/${rank.nextMinXp}` : 'max'}</span>
            <span className="track"><span className="fill" style={{ width: `${beltPct}%` }} /></span>
          </div>
          <Link className="btn ghost" to="/settings">Settings</Link>
        </div>
      </header>

      {/* Move deck */}
      <section className="world" style={{ marginTop: 16 }}>
        <div className="ph"><span>Your move deck</span></div>
        <div className="deck">
          {app.progress.moves.length === 0 ? <span className="more">No moves yet — clear a level to collect your first.</span> : null}
          {app.progress.moves.map((m) => <span key={m} className="chip">{m}</span>)}
          {app.progress.bustedTricks.map((t) => <span key={t} className="chip busted">Busted: {t}</span>)}
        </div>
      </section>

      <div className="map-worlds">
        {WORLDS.map((w) => {
          const levels = (byWorld.get(w.world) ?? []).slice().sort((a, b) => a.order - b.order);
          const hasContent = levels.length > 0;
          return (
            <div key={w.world}>
              <div className={'world' + (hasContent ? '' : ' locked')}>
                <h2>World {w.world} · {w.theme}</h2>
                <div className="theme">Moves {w.moves}{w.rank ? ` · rank on mastery: ${w.rank}` : ''}</div>
                {hasContent ? (
                  <div className="levels">
                    {levels.map((p) => {
                      const unlocked = isLevelUnlocked(p, PACKETS, app.progress);
                      const s = app.progress.stars[p.id] ?? 0;
                      const starMax = p.stars.showMove === null && p.stars.thirdStar === null ? 2 : 3;
                      return (
                        <Link
                          key={p.id}
                          className="lvl"
                          to={`/level/${p.id}`}
                          aria-disabled={!unlocked}
                          tabIndex={unlocked ? 0 : -1}
                        >
                          <div className="lt">{p.title}</div>
                          <div className="lk">
                            Level {p.order}
                            {p.isBoss ? ' · boss' : p.isKeystone ? ' · keystone' : ''}
                            {' · '}
                            <span className="stars" style={{ fontSize: 13 }} aria-label={`${s} of ${starMax} stars`}>
                              {Array.from({ length: starMax }, (_, i) => <span key={i} className={i < s ? 'on' : ''}>★</span>)}
                            </span>
                            {!unlocked ? <span className="locktag"> · locked</span> : ''}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="theme" style={{ marginTop: 8 }}>Content coming in wave 2.</div>
                )}
              </div>
              {w.world === SEAM_AFTER_WORLD ? <div className="seam" style={{ marginTop: 14 }}>{SEAM_TEXT}</div> : null}
            </div>
          );
        })}
        <div className="seam">{CAPSTONE_TEXT}</div>
      </div>
    </div>
  );
}
