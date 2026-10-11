/** Small shared UI helpers used across the player and renderers. */
import type { JSX } from 'react';
import type { LevelPacket, Move, Picks } from '../content/schema';
import type { Skin } from '../app/AppContext';

export function CheckIcon(): JSX.Element {
  return (
    <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="var(--ok)" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
      <path d="M5 12l4 4 10-10" />
    </svg>
  );
}
export function CrossIcon(): JSX.Element {
  return (
    <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

/** Pick the skinned text for a move; falls back to plain if tech is null. */
export function moveText(m: Move, skin: Skin, criteriaText: string): string {
  const raw = skin === 'tech' && m.text.tech !== null ? m.text.tech : m.text.plain;
  return raw.replace('{criteria}', criteriaText);
}

/** Human-readable list of selected real+vague criteria for the {criteria} slot. */
export function criteriaText(packet: LevelPacket, picks: Picks): string {
  const labels = packet.subChoices
    .filter((s) => picks.subChoices[s.id])
    .map((s) => s.label);
  if (labels.length === 0) return '[pick what it tests]';
  if (labels.length === 1) return labels[0]!;
  return labels.slice(0, -1).join(', ') + ' or ' + labels[labels.length - 1];
}

/** The full prompt string the learner would paste. */
export function promptText(packet: LevelPacket, picks: Picks, skin: Skin): string {
  const crit = criteriaText(packet, picks);
  let t = packet.basePrompt;
  for (const m of packet.moves) {
    if (picks.moves[m.id]) t += ' ' + moveText(m, skin, crit);
  }
  return t;
}

/** Who-did-the-math label text. */
export function doerLabel(doer: string): string {
  switch (doer) {
    case 'spreadsheet':
      return 'Who did the math: the spreadsheet';
    case 'tool':
      return 'Who did the work: the tool';
    case 'checker':
      return 'Who did the checking: the checker';
    case 'source':
      return 'Where it came from: the source';
    default:
      return 'Who did the math: the AI (guessing)';
  }
}
