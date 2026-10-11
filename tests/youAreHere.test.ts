import { describe, it, expect } from 'vitest';
import { loadAllPackets } from './loadPackets';
import { useLevelState } from '../src/pages/mapState';
import { emptyProgress, recordPass } from '../src/store/progress';

const packets = loadAllPackets();
const get = (id: string) => packets.find((p) => p.id === id)!;

function hereCount(world: number, progress = emptyProgress()) {
  const { levels, boss } = useLevelState(packets, progress, world);
  const nodes = [...levels, ...(boss ? [boss] : [])];
  return { nodes, here: nodes.filter((n) => n.state === 'current') };
}

describe('you are here', () => {
  it('marks exactly one node in a fresh world, and the rest playable ones are open', () => {
    const { nodes, here } = hereCount(1);
    expect(here).toHaveLength(1);
    expect(here[0]!.id).toBe('w1-l1');
    expect(nodes.filter((n) => n.state === 'open').length).toBeGreaterThan(0);
  });

  it('moves to the next unpassed level, then to the boss once all levels are passed', () => {
    let prog = recordPass(emptyProgress(), get('w1-l1'), 2, 20);
    expect(hereCount(1, prog).here.map((n) => n.id)).toEqual(['w1-l2']);
    prog = recordPass(recordPass(prog, get('w1-l2'), 2, 20), get('w1-l3'), 2, 20);
    expect(hereCount(1, prog).here.map((n) => n.id)).toEqual(['w1-boss']);
  });
});
