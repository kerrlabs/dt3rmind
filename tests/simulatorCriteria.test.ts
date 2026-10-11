/**
 * (9) Simulator / packet drift guard — asserts that every criteria id a
 * simulator hard-codes is actually declared as a sub-choice in each packet that
 * uses that simulator (engineering review Finding #9). Without this, a future
 * author who renames or drops a sub-choice would silently desync the simulator
 * from the packet in the FEEDBACK dimension (the exhaustive combination test
 * only cross-checks the PASS set), and the drift would ship unnoticed.
 *
 * Packets are read via the existing filesystem loader so this runs under plain
 * node without the bundler.
 */
import { describe, it, expect } from 'vitest';
import { loadAllPackets } from './loadPackets';
import { REAL_CRITERIA, VAGUE_CRITERIA } from '../src/content/simulators/w4-check';
import { REAL_CRITERIA as W4L4_REAL } from '../src/content/simulators/w4-l4-check';
import { REAL_CRITERIA as W4BOSS_REAL } from '../src/content/simulators/w4-boss-refund';

/**
 * The criteria ids each simulator depends on, keyed by simulatorId. Each entry
 * imports the simulator's OWN exported criteria constants (read-only; this
 * fixer does not edit `src/content/simulators/*`), so the guard tracks the real
 * source rather than a hand-copied list that could drift.
 *
 * If a new simulator is added without exported criteria constants, it is
 * reported as a skipped, uncovered simulator (below) rather than failing the
 * build — its owner should export its criteria and register it here.
 */
const SIMULATOR_CRITERIA: Record<string, readonly string[]> = {
  'w4-check': [...REAL_CRITERIA, ...VAGUE_CRITERIA],
  'w4-l4-check': [...W4L4_REAL],
  'w4-boss-refund': [...W4BOSS_REAL],
};

const packets = loadAllPackets();

describe('simulator criteria ⊆ packet sub-choices', () => {
  const simPackets = packets.filter((p) => p.simulatorId);

  it('there is at least one simulator-backed packet to check', () => {
    expect(simPackets.length).toBeGreaterThan(0);
  });

  it('at least one registered simulator is actually exercised by a packet', () => {
    const covered = simPackets.filter((p) => SIMULATOR_CRITERIA[p.simulatorId!]);
    expect(covered.length).toBeGreaterThan(0);
  });

  for (const p of simPackets) {
    const criteria = SIMULATOR_CRITERIA[p.simulatorId!];
    if (!criteria) {
      // Not owned by this fixer — surface it as a skip, not a failure.
      it.skip(`${p.id} (simulator "${p.simulatorId}") — criteria not registered here (owned elsewhere)`, () => {
        /* intentionally skipped */
      });
      continue;
    }
    it(`${p.id} (simulator "${p.simulatorId}") declares every criteria id it uses`, () => {
      const declared = new Set(p.subChoices.map((s) => s.id));
      const missing = criteria.filter((id) => !declared.has(id));
      expect(missing, `sub-choice ids missing from packet "${p.id}": ${missing.join(', ')}`).toEqual(
        [],
      );
    });
  }
});
