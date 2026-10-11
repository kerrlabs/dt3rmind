/**
 * Pluggable result renderers. Each reads its own slice of a rule's `output`
 * (or a simulator's output) and draws the "What comes back" panel. Every
 * renderer surfaces "Who did the/produced this" (SPEC §4, V7).
 */
import type { JSX } from 'react';
import type { RendererType } from '../content/schema';
import type { Resolved } from '../engine/engine';
import { CheckIcon, CrossIcon, doerLabel } from './shared';
import { sanitizeHtml } from './sanitizeHtml';

const TRUTH_EPS = 0.005;

function fmt(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* ---------- numeric-scatter (Level 2) ---------- */
interface ScatterOut {
  truth: number;
  values: number[];
  formulas?: { plain: string[]; tech: string[] };
  showNote?: string;
}
function NumericScatter({ r, skin, showFormula }: { r: Resolved; skin: 'plain' | 'tech'; showFormula: boolean }): JSX.Element {
  const o = r.output as unknown as ScatterOut;
  const X0 = 150000, X1 = 460000, W = 540, L = 30;
  const x = (v: number): number => L + ((v - X0) / (X1 - X0)) * W;
  const distinct = new Set(o.values.map((v) => Math.round(v * 100))).size;
  const correct = o.values.filter((v) => Math.abs(v - o.truth) < TRUTH_EPS).length;
  const formulas = o.formulas ? (skin === 'tech' ? o.formulas.tech : o.formulas.plain) : null;

  return (
    <div>
      <div className="scatter">
        <svg className="sc" viewBox="0 0 600 110" role="img" aria-label="Answers from each run plotted against the true answer">
          <line className="axis" x1="30" y1="80" x2="570" y2="80" />
          {[150000, 250000, 350000, 450000].map((t) => (
            <text key={t} className="tick" x={x(t)} y="98" textAnchor="middle">{t / 1000}K</text>
          ))}
          <line className="truth" x1={x(o.truth)} y1="8" x2={x(o.truth)} y2="80" />
          <text className="truthlbl" x={x(o.truth) + 5} y="16">true answer {fmt(o.truth)}</text>
          {o.values.map((v, i) => {
            const ok = Math.abs(v - o.truth) < TRUTH_EPS;
            const cx = x(v), cy = ok ? 62 : 34 + ((i * 13) % 34);
            return ok ? (
              <rect key={i} x={cx - 6} y={cy - 6} width="12" height="12" rx="2" fill="var(--ok)" />
            ) : (
              <circle key={i} cx={cx} cy={cy} r="6" fill="var(--danger)" />
            );
          })}
        </svg>
        <div className="stat">
          <span>Different answers: <b>{distinct}</b></span>
          <span>Correct: <b>{correct} of {o.values.length}</b></span>
          <span className="who">{doerLabel(r.doer)}</span>
        </div>
      </div>
      <div className="runs">
        {o.values.map((v, i) => {
          const ok = Math.abs(v - o.truth) < TRUTH_EPS;
          const f = formulas ? formulas[i % formulas.length] : null;
          return (
            <div key={i} className={'run ' + (ok ? 'ok' : 'bad')}>
              <span className="n">#{i + 1}</span>
              {ok ? <CheckIcon /> : <CrossIcon />}
              <div>
                {r.rule.isPass ? (
                  <>
                    {showFormula && f ? <><code>{f}</code><br /></> : <span className="who">(ran a formula it didn’t show you)</span>}
                    {showFormula && f ? null : <br />}
                    Result from running it: <b style={{ color: 'var(--ok)' }}>{fmt(v)}</b>
                  </>
                ) : f ? (
                  <><code>{f}</code><br />“Applying this, the total is about <b style={{ color: 'var(--danger)' }}>{fmt(v)}</b>.”</>
                ) : (
                  <>“West region revenue in Q3 was <b style={{ color: 'var(--danger)' }}>{fmt(v)}</b>.”</>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {r.rule.isPass && showFormula && o.showNote ? (
        <p style={{ fontSize: 13, marginTop: 8 }}>{o.showNote}</p>
      ) : null}
    </div>
  );
}

/* ---------- item-grid (World 4) ---------- */
interface Customer { name: string; topic: string; step: string; fake?: string }
interface SimDraft { greet: boolean; name: boolean; step: boolean; fakeStep?: boolean; revised: boolean; verdict: boolean | null }
interface GridOut { customers: Customer[]; drafts: SimDraft[]; log: string[]; actualGood?: number }

function draftLines(c: Customer, d: SimDraft): JSX.Element[] {
  const out: JSX.Element[] = [];
  if (d.greet) out.push(<span key="g">{(d.name ? 'Hi ' + c.name : 'Hi there') + ','}</span>);
  const topicLine = !d.greet && d.name ? `${c.name}, ${c.topic.charAt(0).toLowerCase()}${c.topic.slice(1)}` : c.topic;
  out.push(<span key="t">{topicLine}</span>);
  if (d.step) out.push(<span key="s">{c.step}</span>);
  else if (d.fakeStep && c.fake) out.push(<mark key="f">{c.fake}</mark>);
  out.push(<span key="sig">Acme Support</span>);
  return out;
}

function ItemGrid({ r }: { r: Resolved }): JSX.Element {
  const o = r.output as unknown as GridOut;
  const good = o.actualGood ?? o.drafts.filter((d) => d.greet && d.name && d.step).length;
  return (
    <div>
      <div className="summary">
        <div className="sbox"><div className="k">Actually right</div>
          <div className="v" style={{ color: good === 8 ? 'var(--ok)' : 'var(--danger)' }}>{good} of 8</div></div>
        <div className="sbox"><div className="k">What the AI told you</div>
          <div className="v" style={{ fontSize: 15 }}>{r.claim}</div></div>
      </div>
      {o.log && o.log.length ? (
        <div className="log"><b>What the AI did:</b><br />
          {o.log.map((line, i) => <span key={i} dangerouslySetInnerHTML={{ __html: sanitizeHtml(line) }} />)}
        </div>
      ) : null}
      <div className="drafts">
        {o.customers.map((c, i) => {
          const d = o.drafts[i]!;
          const g = d.greet && d.name && d.step;
          return (
            <div key={c.name} className={'d ' + (g ? 'good' : 'bad')}>
              <div className="to"><span>To: {c.name}</span>{d.revised ? <span className="rev">REWRITTEN</span> : null}</div>
              <div className="body">{draftLines(c, d).map((el, j) => <div key={j}>{el}</div>)}</div>
              <div className="marks">
                <span className="mk">{d.greet ? <CheckIcon /> : <CrossIcon />}greeting</span>
                <span className="mk">{d.name ? <CheckIcon /> : <CrossIcon />}name</span>
                <span className="mk">{d.step ? <CheckIcon /> : <CrossIcon />}next step</span>
                {d.verdict === null ? <span className="ck n">not checked</span>
                  : d.verdict ? <span className="ck p">checker: pass</span>
                  : <span className="ck f">checker: fail</span>}
              </div>
            </div>
          );
        })}
      </div>
      <p className="who" style={{ marginTop: 8 }}>{doerLabel(r.doer)}</p>
    </div>
  );
}

/* ---------- text-answer (World 1) ---------- */
interface Field { key: string; value: string; numeric?: boolean }
interface TextOut { answer?: string; highlights?: string[]; fields?: Field[]; source: string }
function highlight(text: string, marks: string[] = []): JSX.Element[] {
  if (!marks.length) return [<span key="0">{text}</span>];
  const parts: JSX.Element[] = [];
  let rest = text, key = 0;
  for (const m of marks) {
    const idx = rest.indexOf(m);
    if (idx === -1) continue;
    if (idx > 0) parts.push(<span key={key++}>{rest.slice(0, idx)}</span>);
    parts.push(<mark key={key++}>{m}</mark>);
    rest = rest.slice(idx + m.length);
  }
  if (rest) parts.push(<span key={key++}>{rest}</span>);
  return parts;
}
function TextAnswer({ r }: { r: Resolved }): JSX.Element {
  const o = r.output as unknown as TextOut;
  return (
    <div>
      <div className="answer-card">
        {o.fields ? (
          o.fields.map((f) => (
            <div key={f.key} className="field">
              <span className="fk">{f.key}</span>
              <span className={f.numeric === false ? 'num-bad' : f.numeric ? 'num-ok' : ''}>{f.value}</span>
            </div>
          ))
        ) : (
          <p>{highlight(o.answer ?? '', o.highlights)}</p>
        )}
        <span className="source-chip">from: {o.source}</span>
      </div>
      <p className="who" style={{ marginTop: 8 }}>{doerLabel(r.doer)}</p>
    </div>
  );
}

/* ---------- table ---------- */
interface TableRow { cells: string[]; pass: boolean }
interface TableOut { columns: string[]; rows: TableRow[]; source?: string }
function TableResult({ r }: { r: Resolved }): JSX.Element {
  const o = r.output as unknown as TableOut;
  return (
    <div>
      <table>
        <thead><tr>{o.columns.map((c) => <th key={c}>{c}</th>)}<th>verdict</th></tr></thead>
        <tbody>
          {o.rows.map((row, i) => (
            <tr key={i}>
              {row.cells.map((c, j) => <td key={j}>{c}</td>)}
              <td>{row.pass ? <CheckIcon /> : <CrossIcon />}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="who" style={{ marginTop: 8 }}>{doerLabel(r.doer)}</p>
    </div>
  );
}

export function ResultRenderer(props: {
  renderer: RendererType;
  resolved: Resolved;
  skin: 'plain' | 'tech';
  showFormula: boolean;
}): JSX.Element {
  const { renderer, resolved, skin, showFormula } = props;
  switch (renderer) {
    case 'numeric-scatter':
      return <NumericScatter r={resolved} skin={skin} showFormula={showFormula} />;
    case 'item-grid':
      return <ItemGrid r={resolved} />;
    case 'text-answer':
      return <TextAnswer r={resolved} />;
    case 'table':
      return <TableResult r={resolved} />;
    default:
      return <p>Unknown renderer: {renderer}</p>;
  }
}
