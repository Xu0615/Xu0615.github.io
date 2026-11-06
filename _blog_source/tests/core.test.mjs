import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderMarkdown } from '../src/markdown.js';
import { validateContent, searchPosts, clone } from '../src/model.js';
import { renderDocument } from '../src/templates.js';
import { buildEntries, GitHubClient } from '../src/publishing.js';
const data=JSON.parse(readFileSync(new URL('../content.json',import.meta.url),'utf8'));

test('Markdown renders formulas, highlighting, tables, references, and diagrams',()=>{
  const result=renderMarkdown('## 中文标题\n\nInline $a^2$ and $b^2$.\n\n$$\nc^2=a^2+b^2\n$$\n\n```python\nprint("hello")\n```\n\n| A | B |\n|---|---|\n|1|2|\n\n```mermaid\nflowchart LR\nA-->B\n```\n\nReference[^1]\n\n[^1]: Source.');
  assert.match(result.html,/class="katex"/);assert.match(result.html,/katex-display/);assert.match(result.html,/hljs-string/);assert.match(result.html,/<table>/);assert.match(result.html,/class="mermaid"/);assert.match(result.html,/footnotes/);assert.equal(result.headings[0].id,'中文标题');
});
test('Untrusted Markdown cannot inject executable HTML or javascript links',()=>{
  const result=renderMarkdown('<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>\n\n[bad](javascript:alert(1))\n\n$\\href{javascript:alert(1)}{click}$');
  assert.doesNotMatch(result.html,/<script>|<img|href="javascript:/i);assert.match(result.html,/&lt;script&gt;/);
});
test('Chinese and English full-text search includes body, category and tags',()=>{
  assert.equal(searchPosts(data,'Chinchilla')[0].id,'data-scaling-notebook');
  assert.equal(searchPosts(data,'证据 相关性')[0].id,'interpretability-notebook');
  assert.equal(searchPosts(data,'PRETRAIN').length,2);
  assert.equal(searchPosts(data,'no-such-query').length,0);
});
test('Validation rejects traversal, duplicate identifiers, and orphan posts',()=>{
  for(const mutate of [d=>d.posts[0].id='../escape',d=>d.posts[1].id=d.posts[0].id,d=>d.posts[0].category='unknown']){const d=clone(data);mutate(d);assert.throws(()=>validateContent(d))}
});
test('Publishing generates complete readable pages and removes deleted article files',()=>{
  const next=clone(data);next.posts.shift();const entries=buildEntries(next,data);
  assert.equal(entries.filter(e=>e.sha===null).length,2);
  const html=entries.find(e=>e.path==='blog/index.html').content;
  assert.match(html,/application\/ld\+json/);assert.match(html,/canonical/);assert.doesNotMatch(html,/从一个 token 开始/);
  const article=entries.find(e=>e.path==='blog/notes/data-scaling-notebook/index.html').content;
  assert.match(article,/Kaplan/);assert.match(article,/footnotes/);assert.match(renderDocument(data,'editor'),/noindex,nofollow/);
});
test('Embedded content cannot break out of JSON script blocks',()=>{
  const d=clone(data);d.posts[0].body='</script><script>alert(1)</script>';
  const doc=renderDocument(d);assert.doesNotMatch(doc,/<script>alert\(1\)/);assert.match(doc,/\\u003c\/script>/);
});
test('Conflict detection aborts before any remote write',async()=>{
  const original=globalThis.fetch,calls=[];
  globalThis.fetch=async(url,opts)=>{calls.push({url,opts});return new Response(JSON.stringify(url.includes('/git/ref/')?{object:{sha:'head'}}:{sha:'remote-changed',content:Buffer.from(JSON.stringify(data)).toString('base64')}),{status:200})};
  try{const client=new GitHubClient('test-only');await assert.rejects(client.publish(data,data,'outdated'),/远端内容已更新/);assert.ok(calls.every(c=>!c.opts.method));}finally{globalThis.fetch=original}
});
test('Publish is atomic and never uses a force update',async()=>{
  const original=globalThis.fetch,calls=[];
  globalThis.fetch=async(url,opts)=>{
    calls.push({url,opts});
    let body={};
    if(url.includes('/git/ref/'))body={object:{sha:'head'}};
    else if(url.includes('/contents/'))body={sha:'content-sha',content:Buffer.from(JSON.stringify(data)).toString('base64')};
    else if(url.endsWith('/git/commits/head'))body={tree:{sha:'base-tree'}};
    else if(url.endsWith('/git/trees'))body={sha:'new-tree',tree:[{path:'blog/content.json',sha:'next-sha'}]};
    else if(url.endsWith('/git/commits'))body={sha:'new-commit'};
    return new Response(JSON.stringify(body),{status:200});
  };
  try{const result=await new GitHubClient('test-only').publish(data,data,'content-sha');assert.equal(result.commit,'new-commit');const updates=calls.filter(c=>c.opts.method==='PATCH');assert.equal(updates.length,1);assert.equal(JSON.parse(updates[0].opts.body).force,false);const treeCall=calls.find(c=>c.url.endsWith('/git/trees'));assert.equal(JSON.parse(treeCall.opts.body).base_tree,'base-tree');}finally{globalThis.fetch=original}
});
