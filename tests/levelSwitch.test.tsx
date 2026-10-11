/**
 * Regression: switching from one level to another in the same tab used to
 * crash ("Cannot read properties of undefined (reading 'filter')") because the
 * player kept the previous level's outcome. The route must remount per id.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { AppProvider } from '../src/app/AppContext';
import { KeyedLevelPlayer } from '../src/pages/LevelPlayer';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let container: HTMLDivElement | null = null;
let go: (to: string) => void = () => {};

function Nav(): null {
  go = useNavigate();
  return null;
}

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
});

function clickButton(label: string): void {
  const b = Array.from(container!.querySelectorAll('button')).find(
    (x) => (x.textContent ?? '').trim() === label,
  );
  if (!b) throw new Error(`button "${label}" not found`);
  act(() => b.click());
}

describe('level switching', () => {
  it('renders the next level after a run on the previous one', async () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => {
      root!.render(
        <AppProvider>
          <MemoryRouter initialEntries={['/level/w2-l3']}>
            <Nav />
            <Routes>
              <Route path="/level/:id" element={<KeyedLevelPlayer />} />
            </Routes>
          </MemoryRouter>
        </AppProvider>,
      );
    });
    clickButton('Ask the AI 5 times');
    await act(async () => {
      await new Promise((r) => setTimeout(r, 3000));
    });
    act(() => go('/level/w4-l4'));
    const h1 = container.querySelector('h1');
    expect(h1?.textContent).toBe('Ask for the check first');
  }, 10000);
});
