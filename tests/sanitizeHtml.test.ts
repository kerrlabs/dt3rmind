/**
 * (2) Sanitizer tests — the allowlist HTML sanitizer that guards every
 * `dangerouslySetInnerHTML` sink (engineering review Finding #2). Asserts the
 * formatting allowlist is preserved and that an inert XSS payload is neutered,
 * so that when SPEC §8 later routes live/model text through these sinks it
 * cannot execute.
 */
import { describe, it, expect } from 'vitest';
import { sanitizeHtml } from '../src/ui/sanitizeHtml';

describe('sanitizeHtml — allowed formatting survives', () => {
  it('keeps b/i/em/strong/code/mark and <br>', () => {
    expect(sanitizeHtml('<b>Hint 1.</b> run it')).toBe('<b>Hint 1.</b> run it');
    expect(sanitizeHtml('a<br>b')).toBe('a<br>b');
    expect(sanitizeHtml('<em>x</em> <strong>y</strong> <code>z</code> <mark>m</mark> <i>i</i>')).toBe(
      '<em>x</em> <strong>y</strong> <code>z</code> <mark>m</mark> <i>i</i>',
    );
  });

  it('strips ALL attributes from allowed tags', () => {
    expect(sanitizeHtml('<b class="x" onclick="alert(1)">hi</b>')).toBe('<b>hi</b>');
    expect(sanitizeHtml('<mark style="background:red" data-x="1">m</mark>')).toBe('<mark>m</mark>');
    expect(sanitizeHtml('<br class="y"/>')).toBe('<br>');
  });
});

describe('sanitizeHtml — XSS payloads are inert', () => {
  it('neutralizes <img onerror> (keeps no tag, no handler)', () => {
    const out = sanitizeHtml('<img src=x onerror="alert(document.cookie)">');
    expect(out).not.toContain('<img');
    expect(out).not.toContain('onerror');
    // The dropped tag leaves no executable content.
    expect(out).not.toMatch(/<[a-z]/i);
  });

  it('drops <script> and discards its contents entirely', () => {
    const out = sanitizeHtml('before<script>alert("xss")</script>after');
    expect(out).toBe('beforeafter');
    expect(out).not.toContain('alert');
    expect(out).not.toContain('script');
  });

  it('drops anchors and their href (no clickable injection)', () => {
    const out = sanitizeHtml('<a href="javascript:alert(1)">click</a>');
    expect(out).toBe('click');
    expect(out).not.toContain('href');
    expect(out).not.toContain('javascript');
  });

  it('escapes stray angle brackets so they render as text, not markup', () => {
    const out = sanitizeHtml('5 < 10 and 10 > 5 & true');
    expect(out).toBe('5 &lt; 10 and 10 &gt; 5 &amp; true');
  });

  it('strips event handlers smuggled on an allowed tag', () => {
    const out = sanitizeHtml('<b onmouseover="steal()">hover</b>');
    expect(out).toBe('<b>hover</b>');
    expect(out).not.toContain('onmouseover');
  });

  it('is a no-op on empty / plain text', () => {
    expect(sanitizeHtml('')).toBe('');
    expect(sanitizeHtml('just plain text')).toBe('just plain text');
  });
});
