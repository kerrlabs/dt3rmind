/**
 * Simulator registry. Levels whose outcome logic cannot be expressed as pure
 * declarative rule tables (W4: sub-choice interactions + the "false green"
 * step-bug) reference a simulator by id from their packet (`simulatorId`).
 *
 * A simulator receives the packet, the learner's picks, and the rule the engine
 * already matched (for feedback/lesson), and returns the authoritative pass
 * verdict plus the renderer payload. See docs/AUTHORING.md "Simulator hooks".
 */
import type { LevelPacket, OutcomeRule, Picks, Doer } from '../schema';
import { w4CheckSimulator } from './w4-check';

export interface SimulatorResult {
  isPass: boolean;
  output: Record<string, unknown>;
  claim?: string;
  doer?: Doer;
}

export type Simulator = (
  packet: LevelPacket,
  picks: Picks,
  matchedRule: OutcomeRule,
) => SimulatorResult;

/**
 * Auto-discovered simulators: any file `src/content/simulators/<id>.ts` that
 * exports `simulator: Simulator` is registered under `<id>` (the filename stem).
 * No edit to this file is needed to add one, so parallel authors never collide.
 */
const DISCOVERED = import.meta.glob<{ simulator?: Simulator }>(
  ['./*.ts', '!./index.ts'],
  { eager: true },
);

const REGISTRY: Record<string, Simulator> = { 'w4-check': w4CheckSimulator };
for (const [path, mod] of Object.entries(DISCOVERED)) {
  const id = path.replace(/^\.\//, '').replace(/\.ts$/, '');
  if (mod.simulator) REGISTRY[id] = mod.simulator;
}

export function getSimulator(id: string): Simulator {
  const sim = REGISTRY[id];
  if (!sim) {
    throw new Error(
      `Unknown simulatorId "${id}". Add src/content/simulators/${id}.ts exporting \`simulator\`.`,
    );
  }
  return sim;
}

export function registeredSimulatorIds(): string[] {
  return Object.keys(REGISTRY);
}
