/**
 * Tiny, dependency-free allowlist HTML sanitizer for packet-authored rich text.
 *
 * Why this exists (engineering review Finding #2): seven surfaces render author
 * strings via `dangerouslySetInnerHTML` (feedback, lesson-adjacent copy, job
 * text, hints, "what you do differently", try-it notes, simulator log lines).
 * Today those strings are author-controlled, so there is no XSS. But SPEC §8
 * routes a free-text ask against a live model at W5/bosses/capstone, and §4
 * renders model output — the moment live/model/learner text reaches any of
 * these sinks it becomes stored/reflected XSS. Routing every sink through this
 * sanitizer closes that door before Phase 2 wires live output in.
 *
 * Policy (intentionally minimal — formatting only, never structure or links):
 *  - Allowed tags: b, i, em, strong, br, code, mark. Nothing else.
 *  - ALL attributes are stripped (no href, no on*, no style, no src).
 *  - Disallowed tags are dropped but their text content is kept (escaped).
 *  - <script>/<style> contents are discarded entirely (not surfaced as text).
 *
 * The implementation never relies on the DOM so it is identical under jsdom,
 * node, and the browser, and cannot itself be used as an injection vector.
 */

const ALLOWED_TAGS = new Set(['b', 'i', 'em', 'strong', 'br', 'code', 'mark']);

/** Tags whose entire contents must be discarded, not emitted as text. */
const DROP_CONTENT_TAGS = new Set(['script', 'style']);

/** Escape the five HTML-significant characters in a text run. */
function escapeText(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Sanitize an author/untrusted HTML string to the formatting-only allowlist.
 * Returns a string safe to pass to `dangerouslySetInnerHTML`.
 */
export function sanitizeHtml(input: string): string {
  if (!input) return '';

  // Walk the string, matching tags; everything between tags is escaped text.
  const tagRe = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*?(\/?)>/g;
  let out = '';
  let lastIndex = 0;
  // When inside a drop-content element (<script>/<style>), suppress text until
  // the matching close tag.
  let suppressUntil: string | null = null;

  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(input)) !== null) {
    const [full, rawName, selfClose] = m;
    const name = rawName!.toLowerCase();
    const isClose = full.startsWith('</');
    const between = input.slice(lastIndex, m.index);

    if (suppressUntil) {
      // Discard text inside a dropped element; only re-enable on its close tag.
      if (isClose && name === suppressUntil) suppressUntil = null;
      lastIndex = tagRe.lastIndex;
      continue;
    }

    out += escapeText(between);

    if (DROP_CONTENT_TAGS.has(name)) {
      if (!isClose && selfClose !== '/') suppressUntil = name;
      // Emit nothing for the tag itself.
    } else if (ALLOWED_TAGS.has(name)) {
      // Re-emit the tag with ALL attributes stripped. <br> is void.
      if (name === 'br') out += '<br>';
      else if (isClose) out += `</${name}>`;
      else out += `<${name}>`;
    }
    // Any other tag: drop the tag, keep (already-escaped) surrounding text.

    lastIndex = tagRe.lastIndex;
  }

  if (!suppressUntil) out += escapeText(input.slice(lastIndex));
  return out;
}
