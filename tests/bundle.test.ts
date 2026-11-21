/**
 * Requirement 9.8: every level packet in content/levels/ is bundled into the
 * built JS. Requires a prior `npm run build`; fails (does not skip) without dist/.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const LEVELS_DIR = join(root, 'content', 'levels');
const ASSETS_DIR = join(root, 'dist', 'assets');

describe('built bundle', () => {
  it('contains every level identifier from content/levels/', () => {
    expect(
      existsSync(ASSETS_DIR),
      'dist/assets not found; run `npm run build` first',
    ).toBe(true);
    const files = readdirSync(LEVELS_DIR).filter((f) => f.endsWith('.json'));
    expect(files).toHaveLength(31);
    const bundle = readdirSync(ASSETS_DIR)
      .filter((f) => f.endsWith('.js'))
      .map((f) => readFileSync(join(ASSETS_DIR, f), 'utf8'))
      .join('\n');
    expect(bundle.length).toBeGreaterThan(0);
    const missing = files
      .map((f) => {
        const { id } = JSON.parse(readFileSync(join(LEVELS_DIR, f), 'utf8'));
        return id as string;
      })
      .filter((id) => !bundle.includes(`"${id}"`));
    expect(missing).toEqual([]);
  });
});
