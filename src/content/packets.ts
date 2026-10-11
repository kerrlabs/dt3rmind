/**
 * Loads every level packet from content/levels/*.json via import.meta.glob so
 * wave-2 authors only have to drop a JSON file in — no registry edits.
 */
import type { LevelPacket } from './schema';

// Eagerly import all packets at build time. Vite inlines these.
const modules = import.meta.glob<LevelPacket>('../../content/levels/*.json', {
  eager: true,
  import: 'default',
});

function loadPackets(): LevelPacket[] {
  const packets = Object.values(modules);
  packets.sort((a, b) =>
    a.world !== b.world ? a.world - b.world : a.order - b.order,
  );
  return packets;
}

export const PACKETS: LevelPacket[] = loadPackets();

export const PACKETS_BY_ID: Record<string, LevelPacket> = Object.fromEntries(
  PACKETS.map((p) => [p.id, p]),
);

export function getPacket(id: string): LevelPacket | undefined {
  return PACKETS_BY_ID[id];
}
