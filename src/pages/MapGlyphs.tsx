/**
 * Decorative SVG glyphs for the Circuit map: the seven world tool icons, a
 * check glyph (passed), and a lock glyph (locked). All are aria-hidden; the SR
 * label on the parent <a> carries the meaning. `stroke="currentColor"` so each
 * glyph inherits the node's state colour from CSS.
 */
import type { JSX } from 'react';
import type { ToolKey } from '../content/worlds';

const S = 26;

export function ToolIcon({ tool }: { tool: ToolKey }): JSX.Element {
  const common = { width: S, height: S, 'aria-hidden': true, fill: 'none', stroke: 'currentColor', strokeWidth: 2.2 } as const;
  switch (tool) {
    case 'form':
      return (
        <svg {...common}>
          <rect x="4" y="4" width="18" height="18" rx="3" />
          <path d="M8 13h10" />
        </svg>
      );
    case 'calculator':
      return (
        <svg {...common} viewBox="0 0 24 26" width={S} height={S}>
          <rect x="3" y="2" width="18" height="22" rx="2" />
          <rect x="6" y="5" width="12" height="4" fill="currentColor" stroke="none" />
          <circle cx="8" cy="14" r="1.3" fill="currentColor" stroke="none" />
          <circle cx="16" cy="14" r="1.3" fill="currentColor" stroke="none" />
          <circle cx="8" cy="19" r="1.3" fill="currentColor" stroke="none" />
          <circle cx="16" cy="19" r="1.3" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'magnifier':
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="6.5" />
          <path d="M16 16l5 5" strokeWidth="2.6" />
        </svg>
      );
    case 'shield':
      return (
        <svg {...common}>
          <path d="M13 2 L22 5 L22 13 C22 18 18 21 13 23 C8 21 4 18 4 13 L4 5 Z" />
          <path d="M9 13l3 3 5-6" />
        </svg>
      );
    case 'wrench':
      return (
        <svg {...common}>
          <path d="M16 4a4.5 4.5 0 00-5.6 5.6l-6.4 6.4 3 3 6.4-6.4A4.5 4.5 0 0019 7l-3.2 3.2-2.9-2.9z" />
        </svg>
      );
    case 'fix':
      return (
        <svg {...common}>
          <path d="M4 18l9-9" />
          <path d="M11 5l6 6" />
          <path d="M14 3l5 5-2.3 2.3-5-5z" />
          <path d="M3 17l2.5 2.5" />
        </svg>
      );
    case 'dial':
      return (
        <svg {...common}>
          <path d="M4 18a9 9 0 1118 0" />
          <path d="M13 17l6-5" strokeWidth="2.4" />
          <circle cx="13" cy="18" r="1.8" fill="currentColor" stroke="none" />
        </svg>
      );
  }
}

export function CheckGlyph(): JSX.Element {
  return (
    <span className="glyph" aria-hidden="true">
      <svg width="12" height="12" fill="none" stroke="var(--ok)" strokeWidth={2.2}>
        <path d="M2 6l3 3 5-6" />
      </svg>
    </span>
  );
}

export function LockGlyph(): JSX.Element {
  return (
    <svg width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <rect x="5" y="9" width="10" height="7" rx="1.5" />
      <path d="M7 9V7a3 3 0 016 0v2" />
    </svg>
  );
}
