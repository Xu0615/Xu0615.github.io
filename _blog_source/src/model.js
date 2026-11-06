export const BASE = '/blog/';
export const ORIGIN = 'https://xu0615.github.io';
export const REPO = 'Xu0615/Xu0615.github.io';
export const BRANCH = 'main';
export const CONTENT_PATH = 'blog/content.json';
export const postURL = post => `${BASE}notes/${encodeURIComponent(post.id)}/`;
export const clone = value => JSON.parse(JSON.stringify(value));
export const validID = id => /^[a-z0-9][a-z0-9-]{0,79}$/.test(id);
export function validateContent(data) {
  if (data.version !== 1 || !Array.isArray(data.categories) || !Array.isArray(data.posts)) throw new Error('文档格式不正确。');
  const catIDs = new Set();
  for (const cat of data.categories) {
    if (!validID(cat.id) || catIDs.has(cat.id) || !String(cat.name).trim()) throw new Error('栏目名称或 ID 无效。');
    catIDs.add(cat.id);
  }
  const postIDs = new Set();
  for (const post of data.posts) {
    if (!validID(post.id) || postIDs.has(post.id)) throw new Error('文章 ID 无效或重复。');
    if (!catIDs.has(post.category)) throw new Error('文章必须属于一个现有栏目。');
    if (!post.title?.trim() || !post.body?.trim()) throw new Error('文章需要标题和正文。');
    if (!Array.isArray(post.tags) || !['zh-CN','en'].includes(post.lang)) throw new Error('文章元数据无效。');
    if (post.issue && (!Number.isSafeInteger(post.issue) || post.issue < 1)) throw new Error('评论编号无效。');
    postIDs.add(post.id);
  }
  return data;
}
export function relatedPosts(data, post) {
  return data.posts.filter(p => p.id !== post.id).map(p => ({post:p, score:(p.category === post.category ? 2 : 0) + p.tags.filter(t => post.tags.includes(t)).length})).sort((a,b) => b.score - a.score).slice(0,3).map(x=>x.post);
}
export function searchPosts(data, query) {
  const terms = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!terms.length) return data.posts;
  return data.posts.map(p => {
    const category = data.categories.find(c => c.id === p.category);
    const title = p.title.toLocaleLowerCase(), tags = p.tags.join(' ').toLocaleLowerCase();
    const haystack = `${title} ${tags} ${p.summary} ${p.body} ${category?.name} ${category?.zh}`.toLocaleLowerCase();
    return {post:p, score:terms.every(term => haystack.includes(term)) ? terms.reduce((sum,term)=>sum + (title.includes(term)?5:tags.includes(term)?3:1),0) : 0};
  }).filter(x=>x.score).sort((a,b)=>b.score-a.score).map(x=>x.post);
}
