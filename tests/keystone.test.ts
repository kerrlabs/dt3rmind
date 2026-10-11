import { describe, it, expect } from 'vitest';
import { loadAllPackets } from './loadPackets';
import { emptyProgress, recordPass, isLevelUnlocked } from '../src/store/progress';

const packets = loadAllPackets();
const get = (id: string) => packets.find((p) => p.id === id)!;

describe('keystone vs boss', () => {
  it('the W4 keystone is not a boss, and passing it does not unlock World 5', () => {
    const keystone = get('w4-l4');
    const w5 = get('w5-l1');
    expect(keystone.isBoss).toBe(false);
    expect(keystone.isKeystone).toBe(true);
    const afterKeystone = recordPass(emptyProgress(), keystone, 3, 85);
    expect(isLevelUnlocked(w5, packets, afterKeystone)).toBe(false);
    const afterBoss = recordPass(afterKeystone, get('w4-boss'), 2, 70);
    expect(isLevelUnlocked(w5, packets, afterBoss)).toBe(true);
  });

  it('the W4 boss is playable without passing the keystone first', () => {
    // Within an unlocked world every level and the boss are open (SPEC §5/§6).
    let prog = emptyProgress();
    for (const b of ['w1-boss', 'w2-boss', 'w3-boss']) prog = recordPass(prog, get(b), 2, 70);
    expect(isLevelUnlocked(get('w4-boss'), packets, prog)).toBe(true);
  });
});
