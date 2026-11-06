import MarkdownIt from 'markdown-it';
import footnote from 'markdown-it-footnote';
import taskLists from 'markdown-it-task-lists';
import katex from 'katex';
import hljs from 'highlight.js/lib/common';
import { renderSAELesson } from './sae-lesson.js';

export const escapeHTML = (s = '') => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const math = (s, displayMode) => katex.renderToString(s, { displayMode, throwOnError: false, trust: false, strict: 'ignore', maxExpand: 500 });
export const md = new MarkdownIt({
  html: false, linkify: true, typographer: true,
  highlight(str, lang) {
    const code = lang && hljs.getLanguage(lang) ? hljs.highlight(str, {language: lang, ignoreIllegals: true}).value : escapeHTML(str);
    return `<pre class="code-block"><span class="code-label">${escapeHTML(lang || 'text')}</span><button class="copy-code" type="button" aria-label="复制代码">Copy</button><code class="hljs">${code}</code></pre>`;
  }
}).use(footnote).use(taskLists);

md.inline.ruler.after('escape', 'math_inline', (state, silent) => {
  const start = state.pos;
  if (state.src[start] !== '$' || state.src[start + 1] === '$' || /\s/.test(state.src[start + 1] || ' ')) return false;
  let end = start + 1;
  while ((end = state.src.indexOf('$', end)) !== -1) {
    if (state.src[end - 1] !== '\\') break;
    end++;
  }
  if (end < 0 || /\s/.test(state.src[end - 1]) || /\d/.test(state.src[end + 1] || '')) return false;
  if (!silent) { const token = state.push('math_inline', 'math', 0); token.content = state.src.slice(start + 1, end); }
  state.pos = end + 1; return true;
});
md.block.ruler.before('fence', 'math_block', (state, startLine, endLine, silent) => {
  const first = state.src.slice(state.bMarks[startLine] + state.tShift[startLine], state.eMarks[startLine]).trim();
  if (!first.startsWith('$$')) return false;
  let text = first.slice(2), next = startLine + 1;
  if (text.endsWith('$$')) text = text.slice(0, -2);
  else {
    let closed = false;
    for (; next < endLine; next++) {
      const line = state.src.slice(state.bMarks[next], state.eMarks[next]);
      if (line.trimEnd().endsWith('$$')) { text += '\n' + line.trimEnd().slice(0, -2); next++; closed = true; break; }
      text += '\n' + line;
    }
    if (!closed) return false;
  }
  if (!silent) { const token = state.push('math_block', 'math', 0); token.content = text; token.map = [startLine, next]; }
  state.line = next; return true;
});
md.renderer.rules.math_inline = tokens => math(tokens[0].content, false);
md.renderer.rules.math_inline = (tokens, idx) => math(tokens[idx].content, false);
md.renderer.rules.math_block = (tokens, idx) => `<div class="math-block">${math(tokens[idx].content, true)}</div>`;
const originalFence = md.renderer.rules.fence;
md.renderer.rules.fence = (tokens, idx, opts, env, self) => {
  if (tokens[idx].info.trim() === 'mllm-sae') {
    const diagram = renderSAELesson(tokens[idx].content.trim());
    if (diagram) return diagram;
  }
  if (tokens[idx].info.trim() === 'mermaid') return `<div class="diagram"><pre class="mermaid">${escapeHTML(tokens[idx].content)}</pre></div>`;
  return originalFence(tokens, idx, opts, env, self);
};
md.core.ruler.push('heading_ids', state => {
  const ids = new Map();
  state.env.headings = [];
  state.tokens.forEach((token, i) => {
    if (token.type !== 'heading_open') return;
    const title = state.tokens[i + 1].children?.filter(t => t.type === 'text' || t.type === 'code_inline').map(t => t.content).join('') || state.tokens[i + 1].content;
    const base = title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'section';
    const count = ids.get(base) || 0; ids.set(base, count + 1);
    const id = count ? `${base}-${count + 1}` : base;
    token.attrSet('id', id);
    state.env.headings.push({id, title, level: Number(token.tag.slice(1))});
  });
});
export function renderMarkdown(source) { const env = {}; return { html: md.render(source || '', env), headings: env.headings || [] }; }
export function plainText(source) { return String(source).replace(/```[\s\S]*?```/g, ' ').replace(/[#*`>\[\]()_$]/g, ' ').replace(/\s+/g, ' ').trim(); }
export function readingTime(source) { return Math.max(1, Math.ceil((source.match(/[\u3400-\u9fff]/g)?.length || 0) / 400 + (source.match(/[a-zA-Z]+/g)?.length || 0) / 220)); }
