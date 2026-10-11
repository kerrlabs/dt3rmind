/**
 * CircuitMap — the two-tier "Circuit Hybrid" navigation that replaces the
 * stacked WorldMap. Two views on one board:
 *   - World view  (#/)          : world nodes + Workshop seam gate + capstone,
 *                                 one climbing data line.
 *   - Level view  (#/world/:n)  : that world's levels as branches converging on
 *                                 the boss gate, exit leaving upward.
 *
 * Everything is DERIVED from packets + progress (see mapState.ts); nothing is
 * hard-coded per level. The top bar, moves deck, rank/XP belt and settings link
 * are kept from the previous map. The SVG lines are decorative (aria-hidden);
 * the DOM is an ordered list of links in play order with full SR labels.
 */
import { useEffect, useRef, type JSX, type RefObject } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PACKETS } from '../content/packets';
import {
  WORLDS,
  SEAM_AFTER_WORLD,
  SEAM_SHORT,
  SEAM_SUB,
  CAPSTONE_RANK,
} from '../content/worlds';
import { useApp } from '../app/AppContext';
import { rankForXp } from '../store/progress';
import {
  useWorldState,
  useLevelState,
  authoredWorldNumbers,
  type WorldNode,
  type LevelNode,
  type NodeState,
} from './mapState';
import {
  VBW,
  VBH,
  worldLayout,
  levelLayout,
  pathThrough,
  branchPaths,
  exitPath,
  toPct,
  type Pt,
} from './mapGeometry';
import { ToolIcon, CheckGlyph, LockGlyph } from './MapGlyphs';

/* ------------------------------------------------------------------ */
/* Shared chrome: top bar + moves deck + legend                        */
/* ------------------------------------------------------------------ */

function TopBar(): JSX.Element {
  const app = useApp();
  const rank = rankForXp(app.progress.xp);
  const beltPct =
    rank.nextMinXp !== null
      ? Math.round(((app.progress.xp - rank.minXp) / (rank.nextMinXp - rank.minXp)) * 100)
      : 100;
  return (
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
  );
}

function MovesDeck(): JSX.Element {
  const app = useApp();
  return (
    <section className="world" style={{ marginTop: 16 }}>
      <div className="ph"><span>Your move deck</span></div>
      <div className="deck">
        {app.progress.moves.length === 0 ? (
          <span className="more">No moves yet — clear a level to collect your first.</span>
        ) : null}
        {app.progress.moves.map((m) => <span key={m} className="chip">{m}</span>)}
        {app.progress.bustedTricks.map((t) => <span key={t} className="chip busted">Busted: {t}</span>)}
      </div>
    </section>
  );
}

function Legend(): JSX.Element {
  return (
    <section className="legend" aria-label="Legend">
      <span className="li"><span className="sw sw-passed" aria-hidden="true" /> <b>Passed</b> (line glows)</span>
      <span className="li"><span className="sw sw-current" aria-hidden="true" /> <b>Current</b></span>
      <span className="li"><span className="sw sw-locked" aria-hidden="true" /> <b>Locked</b> (line dim)</span>
      <span className="li"><span className="sw sw-boss" aria-hidden="true" /> <b>Boss gate</b></span>
      <span className="li"><span className="sw sw-keystone" aria-hidden="true" /> <b>Keystone</b></span>
      <span className="li"><span className="sw sw-capstone" aria-hidden="true" /> <b>Capstone</b></span>
      <span className="li">★ = stars · Enter opens a world · Esc returns</span>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* World view                                                          */
/* ------------------------------------------------------------------ */

function worldSrLabel(w: WorldNode): string {
  const toolBit = w.tool ? ` Tool: ${w.tool}.` : '';
  const rankBit = w.rank ? ` Rank at completion: ${w.rank}.` : '';
  if (w.state === 'passed') {
    return `World ${w.world}, ${w.name}.${toolBit} Complete: ${w.passedLevels} of ${w.totalLevels} levels passed and boss passed.${w.rank ? ` Rank earned: ${w.rank}.` : ''} ${w.stars} stars. Press Enter to open.`;
  }
  if (w.state === 'current') {
    const here = w.currentLevelTitle ? ` Current level: ${w.currentLevelTitle}. You are here.` : '';
    const bossBit = w.bossState === 'passed' ? 'boss passed' : 'boss locked';
    return `World ${w.world}, ${w.name}.${toolBit} In progress: ${w.passedLevels} of ${w.totalLevels} levels passed, ${bossBit}.${here} Press Enter to open.`;
  }
  return `World ${w.world}, ${w.name}.${toolBit} Locked.${rankBit}`;
}

function SeamGate({ pt }: { pt: Pt }): JSX.Element {
  const pct = toPct(pt);
  return (
    <li className="seam-gate" style={{ left: pct.left, top: pct.top }} aria-hidden="true">
      <span className="seam-sw" />
      <span className="seam-txt"><b>{SEAM_SHORT}</b>{SEAM_SUB}</span>
    </li>
  );
}

function CapstoneItem({
  pt,
  state,
  title,
  rank,
}: {
  pt: Pt;
  state: NodeState;
  title: string;
  rank: string;
}): JSX.Element {
  const pct = toPct(pt);
  const where =
    state === 'locked' ? 'Locked until the World 7 boss is passed.' : state === 'passed' ? 'Complete.' : 'Unlocked.';
  return (
    <li>
      <a
        className={`node capstone ${state}`}
        href="#/"
        aria-disabled={state === 'locked' ? true : undefined}
        aria-label={`Capstone terminal: ${title}. An unseen cross-domain job. ${where} Earns ${rank}.`}
        style={{ left: pct.left, top: pct.top }}
        onClick={(e) => e.preventDefault()}
      >
        <span className="wname" aria-hidden="true">Capstone · terminal</span>
        <span className="tile" aria-hidden="true">
          <svg width="28" height="18" fill="none" stroke="currentColor" strokeWidth={2}>
            <rect x="2" y="3" width="24" height="12" rx="6" />
            <circle cx="9" cy="9" r="1.4" fill="currentColor" stroke="none" />
            <circle cx="14" cy="9" r="1.4" fill="currentColor" stroke="none" />
            <circle cx="19" cy="9" r="1.4" fill="currentColor" stroke="none" />
          </svg>
          {state === 'passed' ? <CheckGlyph /> : null}
        </span>
        <span className="sub cap-sub" aria-hidden="true">{title}</span>
        <span className="starline" aria-hidden="true">
          {state === 'locked' ? 'Locked' : state === 'passed' ? 'Complete' : 'Unlocked'} · {rank}
        </span>
      </a>
    </li>
  );
}

function WorldView({
  onOpen,
  firstNodeRef,
}: {
  onOpen: (world: number) => void;
  firstNodeRef: RefObject<HTMLLIElement>;
}): JSX.Element {
  const app = useApp();
  const { worlds, capstone } = useWorldState(PACKETS, app.progress, WORLDS, CAPSTONE_RANK);
  const { slots } = worldLayout(worlds.length, SEAM_AFTER_WORLD);

  // Lit backbone: walk slots bottom→top while each world is passed; the glow
  // stops at the last passed node. The current world's amber ring provides the
  // "pulses into current" cue without extending the lit path past it.
  const litPoints: Pt[] = [];
  for (const slot of slots) {
    if (slot.kind === 'world') {
      const wn = worlds.find((x) => x.world === slot.world);
      litPoints.push(slot.pt);
      if (!wn || wn.state !== 'passed') break;
    } else if (slot.kind === 'seam') {
      const prev = worlds.find((x) => x.world === SEAM_AFTER_WORLD);
      if (!prev || prev.state !== 'passed') break;
      litPoints.push(slot.pt);
    } else {
      litPoints.push(slot.pt);
    }
  }

  const dim = pathThrough(slots.map((s) => s.pt));
  const lit = litPoints.length >= 2 ? pathThrough(litPoints) : '';
  const reduce = app.reducedMotion;

  // Find the index of the current world's slot so we can attach the focus ref.
  const currentWorld = worlds.find((w) => w.isCurrent)?.world ?? worlds[0]?.world;

  return (
    <div className="view active" role="group" aria-label="World view">
      <svg className="circuit" viewBox={`0 0 ${VBW} ${VBH}`} preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="glowW" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="var(--ok)" />
            <stop offset="1" stopColor="var(--sky)" />
          </linearGradient>
        </defs>
        <path d={dim} fill="none" stroke="var(--border)" strokeWidth={7} strokeLinecap="round" strokeDasharray="2 11" opacity={0.85} />
        {lit ? (
          <>
            <path d={lit} fill="none" stroke="var(--ok)" strokeWidth={14} strokeLinecap="round" opacity={0.16} />
            <path d={lit} fill="none" stroke="url(#glowW)" strokeWidth={7} strokeLinecap="round" className={reduce ? '' : 'flow'} />
          </>
        ) : null}
      </svg>

      <ol className="nodes" aria-label="Worlds, in order from first to last">
        {slots.map((slot) => {
          if (slot.kind === 'world') {
            const wn = worlds.find((x) => x.world === slot.world)!;
            const isFocusTarget = wn.world === currentWorld;
            return (
              <li key={`w${slot.world}`} ref={isFocusTarget ? firstNodeRef : undefined} className="node-li">
                <WorldNodeItemInner w={wn} pt={slot.pt} onOpen={onOpen} />
              </li>
            );
          }
          if (slot.kind === 'seam') return <SeamGate key="seam" pt={slot.pt} />;
          return (
            <CapstoneItem key="cap" pt={slot.pt} state={capstone.state} title={capstone.title} rank={capstone.rank} />
          );
        })}
      </ol>
    </div>
  );
}

/** The inner <a> of a world node, factored so the <li> can carry the focus ref. */
function WorldNodeItemInner({
  w,
  pt,
  onOpen,
}: {
  w: WorldNode;
  pt: Pt;
  onOpen: (world: number) => void;
}): JSX.Element {
  const pct = toPct(pt);
  const cls = `node world-node ${w.state}` + (w.meta.toolKey === 'shield' ? ' keystone' : '');
  return (
    <a
      className={cls}
      href={`#/world/${w.world}`}
      aria-current={w.isCurrent ? 'step' : undefined}
      aria-disabled={w.state === 'locked' ? true : undefined}
      aria-label={worldSrLabel(w)}
      style={{ left: pct.left, top: pct.top }}
      onClick={(e) => {
        e.preventDefault();
        onOpen(w.world);
      }}
    >
      {w.isCurrent ? <span className="yah" aria-hidden="true">You are here</span> : null}
      <span className="wname" aria-hidden="true">World {w.world} · {w.name}</span>
      <span className="tile" aria-hidden="true">
        <ToolIcon tool={w.meta.toolKey} />
        {w.state === 'passed' ? <CheckGlyph /> : null}
      </span>
      <span className="sub" aria-hidden="true">{w.tool}</span>
      <span className="starline" aria-hidden="true">
        {w.state === 'locked'
          ? 'Locked'
          : w.state === 'passed'
            ? `${'★'.repeat(Math.min(w.stars, 9))} complete`
            : `${w.passedLevels}/${w.totalLevels} levels, ${w.bossState === 'passed' ? 'boss passed' : 'boss locked'}`}
      </span>
      {w.rank && w.state !== 'locked' ? <span className="rankpill" aria-hidden="true">Rank: {w.rank}</span> : null}
    </a>
  );
}

/* ------------------------------------------------------------------ */
/* Level view                                                          */
/* ------------------------------------------------------------------ */

function levelSrLabel(world: number, L: LevelNode): string {
  const kind = L.isBoss ? 'boss gate' : `level ${L.order}`;
  const ks = L.isKeystone ? ', keystone' : '';
  let state: string;
  if (L.state === 'passed') state = `passed, ${L.stars} of ${L.starMax} stars`;
  else if (L.state === 'current') state = 'current level, you are here, not yet passed';
  else if (L.state === 'open') state = 'open, not yet passed';
  else state = 'locked';
  const open = L.state === 'locked' ? '' : ' Press Enter to play.';
  return `World ${world}, ${kind}, ${L.title}${ks}, ${state}.${open}`;
}

function LevelNodeItem({
  world,
  L,
  pt,
  kindClass,
  go,
  innerRef,
}: {
  world: number;
  L: LevelNode;
  pt: Pt;
  kindClass: string;
  go: (id: string) => void;
  innerRef: RefObject<HTMLAnchorElement> | null;
}): JSX.Element {
  const pct = toPct(pt);
  const cls = `node ${kindClass} ${L.state}` + (L.isKeystone ? ' keystone' : '');
  const tileText = L.isBoss ? 'B' : `${world}.${L.order}`;
  return (
    <li>
      <a
        ref={innerRef ?? undefined}
        className={cls}
        href={`#/level/${L.id}`}
        aria-current={L.state === 'current' ? 'step' : undefined}
        aria-disabled={L.state === 'locked' ? true : undefined}
        aria-label={levelSrLabel(world, L)}
        style={{ left: pct.left, top: pct.top }}
        onClick={(e) => {
          e.preventDefault();
          if (L.state !== 'locked') go(L.id);
        }}
      >
        {L.state === 'current' ? <span className="yah" aria-hidden="true">You are here</span> : null}
        {L.isBoss ? (
          <span className="sub" aria-hidden="true">Boss gate</span>
        ) : L.isKeystone ? (
          <span className="sub" aria-hidden="true">Keystone</span>
        ) : null}
        <span className="tile" aria-hidden="true">
          {L.state === 'locked' ? <LockGlyph /> : tileText}
          {L.state === 'passed' ? <CheckGlyph /> : null}
        </span>
        <span className="label" aria-hidden="true">{L.title}</span>
        <span className="starline" aria-hidden="true">
          {L.state === 'locked'
            ? 'Locked'
            : L.state === 'current' || L.state === 'open'
              ? 'Not played yet'
              : Array.from({ length: L.starMax }, (_, i) => (
                  <span key={i} className={i < L.stars ? 'on' : ''}>★</span>
                ))}
        </span>
      </a>
    </li>
  );
}

function LevelView({
  world,
  firstNodeRef,
}: {
  world: number;
  firstNodeRef: RefObject<HTMLAnchorElement>;
}): JSX.Element {
  const app = useApp();
  const navigate = useNavigate();
  const { levels, boss } = useLevelState(PACKETS, app.progress, world);
  const layout = levelLayout(levels.length);
  const reduce = app.reducedMotion;
  const go = (id: string): void => navigate(`/level/${id}`);
  const bossPassed = boss?.state === 'passed';
  const worldCount = authoredWorldNumbers(PACKETS).length;

  // First actionable node = first unlocked level, else the boss, else level 0.
  const firstActionableIndex = levels.findIndex((l) => l.state !== 'locked');

  return (
    <div className="view active" role="group" aria-label="Level view">
      <svg className="circuit" viewBox={`0 0 ${VBW} ${VBH}`} preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="glowL" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="var(--ok)" />
            <stop offset="1" stopColor="var(--sky)" />
          </linearGradient>
        </defs>
        {levels.map((L, i) => {
          const { into, out } = branchPaths(layout, i);
          const lit = L.state === 'passed';
          return (
            <g key={L.id}>
              <path d={into} fill="none" stroke="var(--border)" strokeWidth={6} strokeLinecap="round" strokeDasharray="2 11" opacity={0.8} />
              <path d={out} fill="none" stroke="var(--border)" strokeWidth={6} strokeLinecap="round" strokeDasharray="2 11" opacity={0.5} />
              {lit ? (
                <>
                  <path d={into} fill="none" stroke="var(--ok)" strokeWidth={12} strokeLinecap="round" opacity={0.16} />
                  <path d={into} fill="none" stroke="url(#glowL)" strokeWidth={6} strokeLinecap="round" className={reduce ? '' : 'flow'} />
                  <path d={out} fill="none" stroke="url(#glowL)" strokeWidth={5} strokeLinecap="round" className={reduce ? '' : 'flow'} opacity={0.7} />
                </>
              ) : null}
            </g>
          );
        })}
        <path d={exitPath(layout)} fill="none" stroke="var(--border)" strokeWidth={6} strokeLinecap="round" strokeDasharray="2 11" opacity={0.6} />
        {bossPassed ? (
          <path d={exitPath(layout)} fill="none" stroke="url(#glowL)" strokeWidth={6} strokeLinecap="round" className={reduce ? '' : 'flow'} />
        ) : null}
      </svg>

      <ol className="nodes" aria-label="Levels in this world, in order">
        <li className="railtag in" style={{ ...toPct(layout.entry) }} aria-hidden="true">
          Enter from {world > 1 ? `World ${world - 1}` : 'start'}
        </li>

        {levels.map((L, i) => (
          <LevelNodeItem
            key={L.id}
            world={world}
            L={L}
            pt={layout.branches[i]!}
            kindClass="level"
            go={go}
            innerRef={i === firstActionableIndex ? firstNodeRef : null}
          />
        ))}

        {boss ? (
          <LevelNodeItem
            world={world}
            L={boss}
            pt={layout.boss}
            kindClass="boss"
            go={go}
            innerRef={firstActionableIndex === -1 && boss.state !== 'locked' ? firstNodeRef : null}
          />
        ) : null}

        <li className="railtag" style={{ ...toPct(layout.exit) }} aria-hidden="true">
          Boss opens {world < worldCount ? `World ${world + 1}` : 'Capstone'}
        </li>
      </ol>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page: owns view + routing + breadcrumb + keyboard                   */
/* ------------------------------------------------------------------ */

export function CircuitMap(): JSX.Element {
  const navigate = useNavigate();
  const params = useParams();
  const worldParam = params.n ? parseInt(params.n, 10) : null;
  const worldNumbers = authoredWorldNumbers(PACKETS);
  const inLevelView = worldParam !== null && worldNumbers.includes(worldParam);

  const levelFocusRef = useRef<HTMLAnchorElement>(null);
  const worldFocusRef = useRef<HTMLLIElement>(null);

  const openWorld = (world: number): void => navigate(`/world/${world}`);
  const backToWorlds = (): void => navigate('/');

  // Escape returns to worlds.
  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape' && inLevelView) {
        e.preventDefault();
        navigate('/');
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [inLevelView, navigate]);

  // Move focus into the opened level view's first actionable node; on return,
  // focus the current world node.
  useEffect(() => {
    if (inLevelView) {
      levelFocusRef.current?.focus();
    } else {
      const el = worldFocusRef.current?.querySelector('a');
      el?.focus();
    }
  }, [inLevelView, worldParam]);

  const worldName = inLevelView ? WORLDS.find((w) => w.world === worldParam)?.theme ?? '' : '';
  const idx = inLevelView ? worldNumbers.indexOf(worldParam!) : -1;
  const prevWorld = idx > 0 ? worldNumbers[idx - 1]! : null;
  const nextWorld = idx >= 0 && idx < worldNumbers.length - 1 ? worldNumbers[idx + 1]! : null;

  return (
    <div className="wrap wrap-map">
      <TopBar />
      <MovesDeck />

      <div className="bar2">
        <nav className="crumb" aria-label="Breadcrumb">
          {inLevelView ? (
            <>
              <a href="#/" onClick={(e) => { e.preventDefault(); backToWorlds(); }}>Worlds</a>
              <span className="sep" aria-hidden="true">›</span>
              <b className="here">World {worldParam} · {worldName}</b>
            </>
          ) : (
            <b className="here">Worlds</b>
          )}
        </nav>
        {inLevelView ? (
          <div className="nav-ctl">
            <button className="btn" disabled={prevWorld === null} onClick={() => prevWorld && openWorld(prevWorld)}>← Prev world</button>
            <button className="btn" disabled={nextWorld === null} onClick={() => nextWorld && openWorld(nextWorld)}>Next world →</button>
            <button className="btn primary" onClick={backToWorlds}>↑ Back to worlds (Esc)</button>
          </div>
        ) : null}
      </div>

      <Legend />

      <section className="board">
        {inLevelView ? (
          <LevelView key={worldParam} world={worldParam!} firstNodeRef={levelFocusRef} />
        ) : (
          <WorldView onOpen={openWorld} firstNodeRef={worldFocusRef} />
        )}
      </section>
    </div>
  );
}
