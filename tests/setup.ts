/**
 * Test setup. jsdom under Node 26 does not expose a working localStorage
 * without the --localstorage-file flag, so provide a tiny in-memory polyfill
 * for the store round-trip tests.
 */
import { beforeEach } from 'vitest';

class MemoryStorage {
  private store = new Map<string, string>();
  get length(): number {
    return this.store.size;
  }
  clear(): void {
    this.store.clear();
  }
  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }
}

const mem = new MemoryStorage();
Object.defineProperty(globalThis, 'localStorage', {
  value: mem,
  writable: true,
  configurable: true,
});

beforeEach(() => mem.clear());
