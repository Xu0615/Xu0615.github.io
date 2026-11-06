import { renderDocument, sitemap } from './templates.js';
import { REPO, BRANCH, CONTENT_PATH, validateContent } from './model.js';

export class GitHubClient {
  #token;
  constructor(token){this.#token=token;}
  clear(){this.#token='';}
  async request(path, options={}){
    const response=await fetch(`https://api.github.com${path}`,{...options,headers:{Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',Authorization:`Bearer ${this.#token}`,...(options.body?{'Content-Type':'application/json'}:{}),...options.headers}});
    if(!response.ok){
      if(response.status===409||response.status===422)throw new Error('GitHub 上的内容发生变化，或提交未被接受。请先同步最新内容；本机草稿仍然保留。');
      if(response.status===401)throw new Error('GitHub 凭证无效或已过期，请重新连接。');
      if(response.status===403)throw new Error('GitHub 拒绝了操作：请检查 Contents / Issues 写入权限及 API 调用额度。');
      if(response.status===404)throw new Error('无法访问目标仓库。请确认凭证已授权 Xu0615.github.io。');
      throw new Error(`GitHub 请求失败（${response.status}），请稍后重试。`);
    }
    return response.status===204?null:response.json();
  }
  async connect(){
    const user=await this.request('/user');
    if(user.login.toLowerCase()!=='xu0615')throw new Error('只有 Xu0615 可以发布到这本手记。');
    const repo=await this.request(`/repos/${REPO}`);
    if(!repo.permissions?.push)throw new Error('当前凭证没有此仓库的写入权限。');
    return user;
  }
  async readContent(ref=BRANCH){
    const file=await this.request(`/repos/${REPO}/contents/${CONTENT_PATH}?ref=${encodeURIComponent(ref)}`);
    const bytes=Uint8Array.from(atob(file.content.replace(/\s/g,'')),c=>c.charCodeAt(0));
    return {data:validateContent(JSON.parse(new TextDecoder().decode(bytes))),sha:file.sha};
  }
  async createDiscussion(post){
    const title=`[blog] ${post.id} · ${post.title}`;
    const found=await this.request(`/search/issues?q=${encodeURIComponent(`repo:${REPO} is:issue in:title "[blog] ${post.id}"`)}`);
    const existing=found.items?.find(item=>item.title.startsWith(`[blog] ${post.id} ·`));
    if(existing)return existing.number;
    const issue=await this.request(`/repos/${REPO}/issues`,{method:'POST',body:JSON.stringify({title,body:`这篇手记的公开讨论区。欢迎交流问题、补充资料与更正。\n\n文章：https://xu0615.github.io/blog/notes/${post.id}/\n\nComments posted here are displayed below the article.`})});
    return issue.number;
  }
  async publish(data, previous, expectedContentSha, assets=[],progress=()=>{}){
    validateContent(data);
    progress('检查远端版本…');
    const ref=await this.request(`/repos/${REPO}/git/ref/heads/${BRANCH}`);
    const head=ref.object.sha;
    const remote=await this.readContent(head);
    if(remote.sha!==expectedContentSha)throw new Error('远端内容已更新。请点击“同步 GitHub”读取最新版本后再发布。本机草稿不会被覆盖。');
    const commit=await this.request(`/repos/${REPO}/git/commits/${head}`);
    progress('生成文章与目录…');
    const entries=buildEntries(data,previous);
    for(const asset of assets){
      const blob=await this.request(`/repos/${REPO}/git/blobs`,{method:'POST',body:JSON.stringify({content:asset.base64,encoding:'base64'})});
      entries.push({path:asset.path,mode:'100644',type:'blob',sha:blob.sha});
    }
    progress('提交到 GitHub…');
    const tree=await this.request(`/repos/${REPO}/git/trees`,{method:'POST',body:JSON.stringify({base_tree:commit.tree.sha,tree:entries})});
    const created=await this.request(`/repos/${REPO}/git/commits`,{method:'POST',body:JSON.stringify({message:'blog: publish notebook updates',tree:tree.sha,parents:[head]})});
    // A concurrent push rejects this non-fast-forward update. Never force-push.
    await this.request(`/repos/${REPO}/git/refs/heads/${BRANCH}`,{method:'PATCH',body:JSON.stringify({sha:created.sha,force:false})});
    return {commit:created.sha,contentSha:tree.tree?.find(x=>x.path===CONTENT_PATH)?.sha || (await this.readContent(created.sha)).sha};
  }
}
export function buildEntries(data,previous){
  const files=new Map([
    [CONTENT_PATH,JSON.stringify(data,null,2)+'\n'],
    ['blog/index.html',renderDocument(data)],
    ['blog/editor/index.html',renderDocument(data,'editor')],
    ['blog/sitemap.xml',sitemap(data)]
  ]);
  for(const p of data.posts){files.set(`blog/notes/${p.id}/index.html`,renderDocument(data,'article',p));files.set(`blog/notes/${p.id}/index.md`,p.body);}
  const entries=[...files].map(([path,content])=>({path,content,mode:'100644',type:'blob'}));
  for(const p of previous.posts.filter(p=>!data.posts.some(n=>n.id===p.id))){
    for(const filename of ['index.html','index.md'])entries.push({path:`blog/notes/${p.id}/${filename}`,mode:'100644',type:'blob',sha:null});
  }
  return entries;
}
