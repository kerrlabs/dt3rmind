/**
 * Filesystem packet loader for tests (node side). The app loads packets via
 * Vite's import.meta.glob; tests read the same JSON files directly so they run
 * under plain node without the bundler.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { LevelPacket } from '../src/content/schema';

const here = dirname(fileURLToPath(import.meta.url));
const LEVELS_DIR = join(here, '..', 'content', 'levels');

export function loadAllPackets(): LevelPacket[] {
  const files = readdirSync(LEVELS_DIR).filter((f) => f.endsWith('.json'));
  const packets = files.map((f) => {
    const raw = readFileSync(join(LEVELS_DIR, f), 'utf8');
    const packet = JSON.parse(raw) as LevelPacket;
    return { file: f, packet };
  });
  // Sanity: filename stem must equal packet id.
  for (const { file, packet } of packets) {
    const stem = file.replace(/\.json$/, '');
    if (stem !== packet.id) {
      throw new Error(`Packet file "${file}" has id "${packet.id}" (must match stem).`);
    }
  }
  return packets
    .map((p) => p.packet)
    .sort((a, b) => (a.world !== b.world ? a.world - b.world : a.order - b.order));
}
