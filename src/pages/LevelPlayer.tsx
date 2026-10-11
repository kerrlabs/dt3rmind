/**
 * LevelPlayer — the generic rewrite-the-ask loop UI driving any packet:
 * just-ask -> rewrite -> run -> resolve -> feedback -> stars/XP -> compare +
 * try-it. Phase-1 is the just-ask demo; phase-2 is the rewrite. Pass records
 * progress (first-pass XP, best stars, moves collected, tricks busted).
 */
import { useEffect, useMemo, useRef, useState, type JSX } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPacket } from '../content/packets';
import {
  resolveOutcome,
  computeStars,
  computeXp,
  emptyPicks,
  type Resolved,
} from '../engine/engine';
import type { Picks } from '../content/schema';
import { recordPass, rankForXp } from '../store/progress';
import { useApp } from '../app/AppContext';
import { ResultRenderer } from '../ui/renderers';
import { CheckIcon, CrossIcon, moveText, criteriaText, promptText } from '../ui/shared';
import { sanitizeHtml } from '../ui/sanitizeHtml';

export function LevelPlayer(): JSX.Element {
  const { id = '' } = useParams();
  const packet = getPacket(id);
  const app = useApp();

  const [phase, setPhase] = useState<1 | 2>(1);
  const [picks, setPicks] = useState<Picks>(() => (packet ? emptyPicks(packet) : { moves: {}, subChoices: {} }));
  const [attempts, setAttempts] = useState(0);
  const [hints, setHints] = useState(0);
  const [resolved, setResolved] = useState<Resolved | null>(null);
  const [done, setDone] = useState(false);
  const [stars, setStars] = useState(0);
  const [shake, setShake] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyMsg, setCopyMsg] = useState('');

  // A11y focus targets: move focus to the result on run, and to the compare
  // panel heading on pass, so keyboard/SR users get a reliable cue the outcome
  // changed (engineering review Finding #5).
  const checkRef = useRef<HTMLDivElement>(null);
  const compareHeadingRef = useRef<HTMLHeadingElement>(null);
  // Bumped on every run so the focus effect fires even on repeated fails.
  const [runTick, setRunTick] = useState(0);

  // After a run: pass -> focus the compare heading; non-pass/phase-1 -> focus
  // the check bar (an assertive live region). Scroll is gated on reduced motion.
  useEffect(() => {
    if (runTick === 0) return;
    const smooth: ScrollBehavior = app.reducedMotion ? 'auto' : 'smooth';
    if (done && compareHeadingRef.current) {
      compareHeadingRef.current.focus();
      // scrollIntoView is absent under jsdom; guard so focus still works there.
      if (typeof compareHeadingRef.current.scrollIntoView === 'function') {
        compareHeadingRef.current.scrollIntoView({ behavior: smooth, block: 'nearest' });
      }
    } else if (checkRef.current) {
      checkRef.current.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runTick]);

  const crit = useMemo(() => (packet ? criteriaText(packet, picks) : ''), [packet, picks]);

  if (!packet) {
    return (
      <div className="wrap">
        <p>Level “{id}” not found. <Link to="/">Back to the map</Link></p>
      </div>
    );
  }

  const skin = app.skin;

  function toggleMove(mid: string): void {
    if (done) return;
    setPicks((p) => ({ ...p, moves: { ...p.moves, [mid]: !p.moves[mid] } }));
  }
  function toggleSub(sid: string): void {
    if (done) return;
    setPicks((p) => ({ ...p, subChoices: { ...p.subChoices, [sid]: !p.subChoices[sid] } }));
  }

  // Shake is a motion cue; skip it entirely under reduced motion (the CSS
  // override also neutralizes it, but gating the JS avoids the class churn).
  function triggerShake(): void {
    if (app.reducedMotion) return;
    setShake(true);
    window.setTimeout(() => setShake(false), 500);
  }

  function run(): void {
    if (done || !packet) return;
    const effPicks: Picks = phase === 1 ? emptyPicks(packet) : picks;
    const r = resolveOutcome(packet, effPicks);
    const nextAttempts = phase === 2 ? attempts + 1 : attempts;
    setAttempts(nextAttempts);
    setResolved(r);
    setRunTick((t) => t + 1);

    if (phase === 1) {
      setPhase(2);
      triggerShake();
      return;
    }

    if (!r.isPass) {
      triggerShake();
      return;
    }

    // pass
    const s = computeStars(packet, picks, { attempts: nextAttempts, hints }, true);
    setStars(s);
    setDone(true);
    const xp = computeXp(packet, { seenFailing: true });
    app.setProgress(recordPass(app.progress, packet, s, xp));
  }

  function revealHint(): void {
    if (hints >= 3) return;
    setHints((h) => h + 1);
  }

  const hintTexts = [packet.hints.nudge, packet.hints.gap, packet.hints.moves];
  const rank = rankForXp(app.progress.xp);
  const beltPct =
    rank.nextMinXp !== null
      ? Math.round(((app.progress.xp - rank.minXp) / (rank.nextMinXp - rank.minXp)) * 100)
      : 100;

  const checkPass = resolved?.isPass ?? null;
  const showFormula = Boolean(packet.stars.showMove && picks.moves[packet.stars.showMove]);

  const realMovesCollected = packet.moves
    .filter((m) => m.kind === 'real' && picks.moves[m.id])
    .map((m) => m.label);

  // Star ceiling is packet-derived: a level with no show-move and no bonus
  // third-star condition is ★★-max by design (W1 L1), so SR users must hear
  // "of 2", not "of 3" (Finding #11).
  const starMax = packet.stars.showMove === null && packet.stars.thirdStar === null ? 2 : 3;

  // Total chips added to the ask (real moves + trick moves), shown as the
  // "Add to your ask" counter. Named to avoid a confusing `|| 'pick any'`
  // short-circuit that mislabeled trick-only selections (Finding #8).
  const addedCount =
    realMovesCollected.length +
    packet.moves.filter((m) => m.kind === 'trick' && picks.moves[m.id]).length;

  return (
    <div className="wrap">
      <header className="top">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="badge" aria-hidden="true">{packet.world}</div>
          <div>
            <div className="kicker">{packet.kicker}</div>
            <h1>{packet.title}</h1>
          </div>
        </div>
        <div className="meta">
          <div className="xp">Rank: <b>{rank.name}</b> · <b>{app.progress.xp}</b> XP</div>
          <div className="belt" aria-label={`Belt progress ${beltPct}%`}>
            <span className="track"><span className="fill" style={{ width: `${beltPct}%` }} /></span>
          </div>
          <div className="stars" aria-label={`${stars} of ${starMax} stars`}>
            {Array.from({ length: starMax }, (_, i) => <span key={i} className={i < stars ? 'on' : ''}>★</span>)}
          </div>
          <div className="tg" role="group" aria-label="Skin and theme">
            <button aria-pressed={skin === 'plain'} onClick={() => app.setSkin('plain')}>{packet.world === 2 ? 'Spreadsheet' : 'Plain'}</button>
            <button aria-pressed={skin === 'tech'} onClick={() => app.setSkin('tech')}>Technical</button>
            <button onClick={() => app.setTheme(app.theme === 'dark' ? 'light' : 'dark')}>{app.theme === 'dark' ? 'Light' : 'Dark'}</button>
          </div>
          <Link className="btn ghost" to="/">Map</Link>
        </div>
      </header>

      <div className="steps" aria-hidden="true">
        <span className={'step ' + (phase > 1 ? 'done' : 'on')}>1 · Just ask</span>
        <span className={'step ' + (phase === 2 && !done ? 'on' : done ? 'done' : '')}>2 · Rewrite the ask</span>
        <span className={'step ' + (done ? 'on' : '')}>3 · Take it to your AI</span>
      </div>

      <div className={'row' + (packet.renderer === 'item-grid' ? ' wide' : '')}>
        {/* LEFT: job + prompt + chips */}
        <section className="panel" aria-labelledby="jobH">
          <div className="ph"><span id="jobH">The job</span><span>{packet.job.preview.more ?? ''}</span></div>
          <div className="ask" dangerouslySetInnerHTML={{ __html: sanitizeHtml(packet.job.text) }} />
          {packet.job.preview.columns ? (
            <>
              <table>
                <thead><tr>{packet.job.preview.columns.map((c) => <th key={c}>{c}</th>)}</tr></thead>
                <tbody>
                  {(packet.job.preview.rows ?? []).map((row, i) => (
                    <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : packet.job.preview.text ? (
            <p className="more" style={{ fontStyle: 'italic' }}>{packet.job.preview.text}</p>
          ) : null}

          <div className="you">What you type</div>
          <div className="prompt" aria-live="polite">
            {packet.basePrompt}
            {phase >= 2
              ? packet.moves.map((m) =>
                  picks.moves[m.id] ? (
                    <span key={m.id} className={m.kind === 'real' ? 'add' : 'decoy'}> {moveText(m, skin, crit)}</span>
                  ) : null,
                )
              : null}
          </div>

          {phase >= 2 ? (
            <div>
              <div className="ph" style={{ marginTop: 14 }}>
                <span>Add to your ask</span>
                <span>{addedCount > 0 ? `${addedCount} added` : 'pick any'}</span>
              </div>
              <div className="moves">
                {packet.moves.map((m) => (
                  <button key={m.id} className="move" aria-pressed={Boolean(picks.moves[m.id])} onClick={() => toggleMove(m.id)}>
                    {m.label}
                  </button>
                ))}
              </div>
              {packet.subChoices.length && picks.moves['check'] ? (
                <div className="crit">
                  <div className="lbl">{packet.subChoiceGroup}</div>
                  <div className="moves" style={{ marginTop: 0 }}>
                    {packet.subChoices.map((s) => (
                      <button key={s.id} className="move" aria-pressed={Boolean(picks.subChoices[s.id])} onClick={() => toggleSub(s.id)}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="actions">
            <button className="btn primary" onClick={run} disabled={done}>
              {phase === 1 ? (packet.renderer === 'numeric-scatter' ? 'Ask the AI 5 times' : 'Run it') : 'Run my rewrite'}
            </button>
            {phase >= 2 ? (
              <button className="btn ghost" onClick={revealHint} disabled={hints >= 3}>
                {hints < 3 ? `Hint (${hints + 1} of 3)` : 'No more hints'}
              </button>
            ) : null}
          </div>
          {hints > 0 ? <div className="hint" aria-live="polite" dangerouslySetInnerHTML={{ __html: sanitizeHtml(`<b>Hint ${hints}.</b> ${hintTexts[hints - 1]}`) }} /> : null}
        </section>

        {/* RIGHT: what comes back */}
        <section className="panel" aria-labelledby="outH">
          <div className="ph"><span id="outH">What comes back</span></div>
          {resolved ? (
            <>
              <ResultRenderer renderer={packet.renderer} resolved={resolved} skin={skin} showFormula={showFormula} />
              <div
                ref={checkRef}
                tabIndex={-1}
                role="status"
                aria-live="assertive"
                aria-label={checkPass === null ? 'Run to see the check' : checkPass ? 'Result: passed' : 'Result: failed'}
                className={'check' + (checkPass === null ? '' : checkPass ? ' pass' : ' fail') + (shake ? ' shake' : '')}>
                {checkPass === null ? 'Run to see the check' : checkPass ? <><CheckIcon />PASSED</> : <><CrossIcon />FAILED</>}
              </div>
              <div className={'fb ' + (resolved.isPass ? 'good' : phase === 1 ? 'bad' : feedbackTone(resolved))} role="status" aria-live="polite"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(resolved.feedback) }} />
              <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>{resolved.lesson}</p>
            </>
          ) : (
            <p className="more">Ask the AI to see what comes back.</p>
          )}
        </section>
      </div>

      {done && resolved ? (
        <section className="compare" style={{ marginTop: 16 }} aria-labelledby="cmpH">
          <div className="ph"><h2 id="cmpH" ref={compareHeadingRef} tabIndex={-1} style={{ font: 'inherit', margin: 0 }}>What you do differently</h2></div>
          <div className="cols">
            <div className="colA"><h3>Just prompting</h3><div className="q">“{packet.naivePrompt}”</div>
              <p style={{ fontSize: 13, marginTop: 8 }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(packet.whatYouDoDifferently.naive) }} /></div>
            <div className="colB"><h3>Your rewrite</h3><div className="q">“{promptText(packet, picks, skin)}”</div>
              <p style={{ fontSize: 13, marginTop: 8 }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(packet.whatYouDoDifferently.rewrite) }} /></div>
          </div>

          {packet.isBoss ? (
            <div className="rankup">
              <div className="crest"><svg viewBox="0 0 24 24"><path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z" /><path d="M9 12l2 2 4-4" /></svg></div>
              <div><div className="kicker">Rank up</div><div style={{ fontSize: 18, fontWeight: 900 }}>You’re a {rankForXp(app.progress.xp).name}</div>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>+{packet.xp.level} level · +{packet.xp.seenFailing} seen failing · +{packet.xp.boss} keystone · {stars} of {starMax} stars</div></div>
            </div>
          ) : null}

          <div className="ph" style={{ marginTop: 14 }}><span>Moves collected</span></div>
          <div className="collected">
            {realMovesCollected.map((label) => <span key={label} className="chip">{label}</span>)}
          </div>

          <div className="tryit">
            <div className="kicker">Try it in your AI</div>
            <pre>{skin === 'tech' && packet.tryIt.template.tech ? packet.tryIt.template.tech : packet.tryIt.template.plain}</pre>
            <div className="actions" style={{ marginTop: 4 }}>
              <button className="btn ghost" onClick={() => copyTemplate(packet, skin, setCopied, setCopyMsg)}>{copied ? 'Copied' : 'Copy the pattern'}</button>
            </div>
            {copyMsg ? <p className="more" role="status" aria-live="polite" style={{ marginTop: 6 }}>{copyMsg}</p> : null}
            <ul>{packet.tryIt.notes.map((n, i) => <li key={i} dangerouslySetInnerHTML={{ __html: sanitizeHtml(n) }} />)}</ul>
          </div>
        </section>
      ) : null}
    </div>
  );
}

/** Pick a feedback tone for a non-pass phase-2 result. */
function feedbackTone(r: Resolved): string {
  const warnKinds = ['formula_only', 'notRun'];
  return warnKinds.includes(r.rule.id) ? 'warn' : 'bad';
}

function copyTemplate(
  packet: ReturnType<typeof getPacket> & object,
  skin: 'plain' | 'tech',
  setCopied: (v: boolean) => void,
  setCopyMsg: (v: string) => void,
): void {
  const t = skin === 'tech' && packet.tryIt.template.tech ? packet.tryIt.template.tech : packet.tryIt.template.plain;

  const onOk = (): void => {
    setCopied(true);
    setCopyMsg('Copied to your clipboard.');
  };
  const onFail = (): void => {
    setCopied(false);
    setCopyMsg('Couldn’t copy automatically — the text is selected, press Ctrl/Cmd+C.');
  };

  // Preferred path: async Clipboard API (secure contexts only).
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(t).then(onOk, () => execCommandFallback(t, onOk, onFail));
    return;
  }
  // Fallback for insecure contexts / older browsers.
  execCommandFallback(t, onOk, onFail);
}

/**
 * Clipboard fallback: drop the text into an offscreen textarea, select it, and
 * try `document.execCommand('copy')`. If that is unavailable or fails, leave the
 * text selected and tell the user to copy manually (Finding #7).
 */
function execCommandFallback(text: string, onOk: () => void, onFail: () => void): void {
  if (typeof document === 'undefined') {
    onFail();
    return;
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.top = '-1000px';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try {
    const ok = typeof document.execCommand === 'function' && document.execCommand('copy');
    if (ok) onOk();
    else onFail();
  } catch {
    onFail();
  } finally {
    document.body.removeChild(ta);
  }
}

/**
 * Route element: remount the player per level id so no state from the previous
 * level (picks, last outcome, renderer payload) carries into the next one.
 * Without the key, switching levels in one tab crashed the result renderer.
 */
export function KeyedLevelPlayer(): JSX.Element {
  const { id = '' } = useParams();
  return <LevelPlayer key={id} />;
}
