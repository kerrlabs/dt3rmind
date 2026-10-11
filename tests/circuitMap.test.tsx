/**
 * CircuitMap tests. Two layers:
 *   1. Pure derivation (mapState) against the real packets + crafted progress,
 *      including the keystone/boss unlock pins (passing w4-l4 does NOT open
 *      World 5; passing w4-boss does).
 *   2. Rendered views via the project's createRoot harness: the world view
 *      renders 7 world items + the capstone in order with correct SR labels for
 *      the sample progress; the world route renders that world's levels + boss;
 *      Escape returns to #/.
 *
 * No @testing-library (not installed) — only react, react-dom/client, the
 * HashRouter the app ships with, and jsdom.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from '../src/app/AppContext';
import { CircuitMap } from '../src/pages/CircuitMap';
import { KeyedLevelPlayer } from '../src/pages/LevelPlayer';
import { PACKETS } from '../src/content/packets';
import { WORLDS, CAPSTONE_RANK } from '../src/content/worlds';
import { STORAGE_KEY, emptyProgress, recordPass, type Progress } from '../src/store/progress';
import { useWorldState, useLevelState, authoredWorldNumbers } from '../src/pages/mapState';
import { isLevelUnlocked } from '../src/store/progress';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const get = (id: string) => PACKETS.find((p) => p.id === id)!;

/** The spec's sample progress: W1 complete, W2 l1+l2 passed (l3 current). */
function sampleProgress(): Progress {
  let p = emptyProgress();
  for (const id of ['w1-l1', 'w1-l2', 'w1-l3', 'w1-boss']) p = recordPass(p, get(id), 3, 40);
  for (const id of ['w2-l1', 'w2-l2']) p = recordPass(p, get(id), 2, 30);
  return p;
}

/* ---------------- pure derivation ---------------- */

describe('mapState — world rollups from sample progress', () => {
  const prog = sampleProgress();
  const { worlds, capstone } = useWorldState(PACKETS, prog, WORLDS, CAPSTONE_RANK);

  it('derives one node per authored world, in order', () => {
    expect(worlds.map((w) => w.world)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('W1 is passed, W2 is current, W3+ are locked', () => {
    const byW = Object.fromEntries(worlds.map((w) => [w.world, w.state]));
    expect(byW[1]).toBe('passed');
    expect(byW[2]).toBe('current');
    expect(byW[3]).toBe('locked');
    expect(byW[7]).toBe('locked');
  });

  it('W2 reports 2 of 4 levels passed and boss locked, and is the current world', () => {
    const w2 = worlds.find((w) => w.world === 2)!;
    expect(w2.passedLevels).toBe(2);
    expect(w2.totalLevels).toBe(4);
    expect(w2.bossState).toBe('current'); // playable but not passed
    expect(w2.bossPassed).toBe(false);
    expect(w2.isCurrent).toBe(true);
    expect(w2.currentLevelTitle).toBe('Ask for the tool, not the answer');
  });

  it('capstone exists and is locked until the W7 boss', () => {
    expect(capstone.exists).toBe(true);
    expect(capstone.state).toBe('locked');
    expect(capstone.rank).toBe(CAPSTONE_RANK);
  });
});

describe('mapState — keystone vs boss unlock pins', () => {
  it('passing the W4 keystone (w4-l4) does NOT open World 5', () => {
    // Progress up through the W3 boss so World 4 is unlocked.
    let p = emptyProgress();
    for (const id of ['w1-boss', 'w2-boss', 'w3-boss']) p = recordPass(p, get(id), 2, 70);
    p = recordPass(p, get('w4-l4'), 3, 85); // keystone
    const { worlds } = useWorldState(PACKETS, p, WORLDS, CAPSTONE_RANK);
    expect(worlds.find((w) => w.world === 5)!.state).toBe('locked');
    expect(isLevelUnlocked(get('w5-l1'), PACKETS, p)).toBe(false);
  });

  it('passing the W4 boss DOES open World 5', () => {
    let p = emptyProgress();
    for (const id of ['w1-boss', 'w2-boss', 'w3-boss', 'w4-boss']) p = recordPass(p, get(id), 2, 70);
    const { worlds } = useWorldState(PACKETS, p, WORLDS, CAPSTONE_RANK);
    expect(worlds.find((w) => w.world === 5)!.state).toBe('current');
    expect(isLevelUnlocked(get('w5-l1'), PACKETS, p)).toBe(true);
  });
});

describe('mapState — level nodes for a world', () => {
  it('World 2 yields 4 practice levels in order plus the boss', () => {
    const { levels, boss } = useLevelState(PACKETS, sampleProgress(), 2);
    expect(levels.map((l) => l.order)).toEqual([1, 2, 3, 4]);
    expect(levels[0]!.state).toBe('passed');
    expect(levels[2]!.state).toBe('current'); // l3
    expect(boss?.isBoss).toBe(true);
    expect(boss?.title).toContain('Triage');
  });

  it('authoredWorldNumbers returns 1..7', () => {
    expect(authoredWorldNumbers(PACKETS)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
});

/* ---------------- rendered views ---------------- */

let container: HTMLDivElement;
let root: Root;

function render(route: string): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleProgress()));
  window.location.hash = route;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(
      <AppProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<CircuitMap />} />
            <Route path="/world/:n" element={<CircuitMap />} />
            <Route path="/level/:id" element={<KeyedLevelPlayer />} />
          </Routes>
        </HashRouter>
      </AppProvider>,
    );
  });
}

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  window.location.hash = '';
});

function worldLinks(): HTMLAnchorElement[] {
  return Array.from(container.querySelectorAll('a.world-node')) as HTMLAnchorElement[];
}

describe('CircuitMap — world view render', () => {
  beforeEach(() => render('#/'));

  it('renders 7 world items plus the capstone, in play order', () => {
    const links = worldLinks();
    expect(links.length).toBe(7);
    links.forEach((a, i) => {
      expect(a.getAttribute('aria-label')).toContain(`World ${i + 1},`);
    });
    const cap = container.querySelector('a.capstone');
    expect(cap).toBeTruthy();
    expect(cap!.getAttribute('aria-label')).toContain('Capstone terminal');
  });

  it('W2 node carries the sample SR label (2 of 4, boss locked, you are here)', () => {
    const w2 = worldLinks()[1]!;
    const label = w2.getAttribute('aria-label') ?? '';
    expect(label).toContain('World 2, Spot the Guess');
    expect(label).toContain('2 of 4 levels passed, boss locked');
    expect(label).toContain('You are here');
    expect(w2.getAttribute('aria-current')).toBe('step');
  });

  it('locked worlds are aria-disabled, W1 is not', () => {
    const links = worldLinks();
    expect(links[0]!.getAttribute('aria-disabled')).toBeNull(); // W1 passed
    expect(links[2]!.getAttribute('aria-disabled')).toBe('true'); // W3 locked
  });

  it('the DOM node list is an ordered list', () => {
    const ol = container.querySelector('ol.nodes');
    expect(ol?.tagName).toBe('OL');
  });

  it('node labels have no underline link styling leaking into text (class, not <u>)', () => {
    // SR label lives on <a>; visible label is a span.label with no <u>/<ins>.
    const labelSpan = container.querySelector('a.world-node .wname');
    expect(labelSpan).toBeTruthy();
    expect(container.querySelector('a.world-node u')).toBeNull();
  });
});

describe('CircuitMap — level view render', () => {
  beforeEach(() => render('#/world/2'));

  it('renders World 2 level nodes and the boss', () => {
    const levelTiles = Array.from(container.querySelectorAll('a.node.level')) as HTMLElement[];
    expect(levelTiles.length).toBe(4);
    const boss = container.querySelector('a.node.boss');
    expect(boss).toBeTruthy();
    expect(boss!.getAttribute('aria-label')).toContain('boss gate');
  });

  it('level 3 is current (you are here) with aria-current step', () => {
    const l3 = Array.from(container.querySelectorAll('a.node.level')).find((a) =>
      (a.getAttribute('aria-label') ?? '').includes('level 3'),
    ) as HTMLElement;
    expect(l3).toBeTruthy();
    expect(l3.getAttribute('aria-current')).toBe('step');
    expect(l3.getAttribute('aria-label')).toContain('you are here');
  });

  it('breadcrumb shows the world and a back-to-worlds control', () => {
    expect(container.textContent).toContain('World 2 · Spot the Guess');
    const back = Array.from(container.querySelectorAll('button')).find((b) =>
      (b.textContent ?? '').includes('Back to worlds'),
    );
    expect(back).toBeTruthy();
  });

  it('Escape returns to the world view (#/)', () => {
    expect(container.querySelector('a.node.level')).toBeTruthy();
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    // after Escape, the route is #/ and the world nodes render again
    expect(worldLinks().length).toBe(7);
    expect(container.querySelector('a.node.level')).toBeNull();
  });
});
