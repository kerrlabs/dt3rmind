/**
 * REVIEW-ONLY UI render tests (added by the code-review agent, under tests/review/).
 *
 * @testing-library is NOT installed (package.json has no @testing-library/*),
 * and the review brief forbids `npm install`. These tests therefore use ONLY
 * already-installed deps: react, react-dom/client, and the jsdom environment
 * vitest already runs. They drive the real LevelPlayer through the full
 * rewrite-the-ask loop (just-ask -> add moves -> run) via native DOM events and
 * assert on rendered text, the compare panel, and the try-it card.
 *
 * This is a lightweight substitute for @testing-library; if that dep is added
 * later these should be rewritten with it.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from '../../src/app/AppContext';
import { LevelPlayer } from '../../src/pages/LevelPlayer';

// React 18 act() environment flag.
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function renderLevel(id: string): void {
  act(() => {
    root.render(
      <AppProvider>
        <MemoryRouter initialEntries={[`/level/${id}`]}>
          <Routes>
            <Route path="/level/:id" element={<LevelPlayer />} />
          </Routes>
        </MemoryRouter>
      </AppProvider>,
    );
  });
}

/** Find a <button> by its (trimmed) visible text. */
function button(label: string): HTMLButtonElement {
  const btns = Array.from(container.querySelectorAll('button')) as HTMLButtonElement[];
  const hit = btns.find((b) => (b.textContent ?? '').trim() === label);
  if (!hit) {
    throw new Error(
      `button "${label}" not found. present: ${btns.map((b) => `"${(b.textContent ?? '').trim()}"`).join(', ')}`,
    );
  }
  return hit;
}

function click(el: HTMLElement): void {
  act(() => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));
}

function text(): string {
  return container.textContent ?? '';
}

describe('LevelPlayer render · w2-l3 (numeric-scatter)', () => {
  beforeEach(() => renderLevel('w2-l3'));

  it('renders the job and the just-ask action, no pass yet', () => {
    expect(text()).toContain('Ask for the tool, not the answer');
    expect(text()).toContain('West region revenue');
    // phase 1 action label for numeric-scatter
    expect(() => button('Ask the AI 5 times')).not.toThrow();
    expect(text()).not.toContain('PASSED');
  });

  it('just-ask -> add tool+run -> run my rewrite -> pass, spreadsheet did the math', () => {
    click(button('Ask the AI 5 times')); // phase 1 demo (scatter fail)
    expect(text()).toContain('Who did the math: the AI (guessing)');

    click(button('Ask for a formula, not the number'));
    click(button('Make it run the formula'));
    click(button('Run my rewrite'));

    expect(text()).toContain('PASSED');
    expect(text()).toContain('Who did the math: the spreadsheet');
    // compare panel + try-it card appear on pass
    expect(text()).toContain('What you do differently');
    expect(text()).toContain('Try it in your AI');
    expect(() => button('Copy the pattern')).not.toThrow();
    // moves collected deck shows the real moves
    expect(text()).toContain('Moves collected');
  });

  it('tool WITHOUT run does not pass (still a guess)', () => {
    click(button('Ask the AI 5 times'));
    click(button('Ask for a formula, not the number'));
    click(button('Run my rewrite'));
    expect(text()).toContain('FAILED');
    expect(text()).not.toContain('What you do differently');
  });
});

describe('LevelPlayer render · w4-l4 (item-grid simulator)', () => {
  beforeEach(() => renderLevel('w4-l4'));

  it('just-ask shows 4-of-8 broken naive outcome', () => {
    click(button('Run it')); // phase 1 demo
    expect(text()).toContain('of 8');
    expect(text()).not.toContain('PASSED');
  });

  it('check+run+3 rules but NO prove => false green, not a pass', () => {
    click(button('Run it'));
    click(button('Ask for a checker first'));
    // sub-choices appear once "check" is on
    click(button('a greeting'));
    click(button("the customer's name"));
    click(button('a next step'));
    click(button('Run the checker on every draft'));
    click(button('Run my rewrite'));
    // simulator decides this is a FALSE GREEN: checker claims 8/8 but not a real pass
    expect(text()).toContain('FAILED');
    expect(text()).not.toContain('What you do differently');
  });

  it('check+prove+run+3 rules => real pass, compare + try-it render', () => {
    click(button('Run it'));
    click(button('Ask for a checker first'));
    click(button('a greeting'));
    click(button("the customer's name"));
    click(button('a next step'));
    click(button('Make it prove the checker can fail'));
    click(button('Run the checker on every draft'));
    click(button('Run my rewrite'));
    expect(text()).toContain('PASSED');
    expect(text()).toContain('What you do differently');
    expect(text()).toContain('Try it in your AI');
  });
});
