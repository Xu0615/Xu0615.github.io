import { renderDocument, sitemap } from './templates.js';
import { REPO, BRANCH, CONTENT_PATH, validateContent } from './model.js';

export class GitHubError extends Error {
  constructor(message,{status=0,code='REQUEST_FAILED',endpoint='',retryAt=null}={}){
    super(message);this.name='GitHubError';this.status=status;this.code=code;this.endpoint=endpoint;this.retryAt=retryAt;
  }
}
export async function githubError(response,path){
  const details=await response.json().catch(()=>({}));
  const message=String(details.message||'');
  const common={status:response.status,endpoint:path.split('?')[0]};
  if(response.status===401)return new GitHubError('GitHub 凭证已失效或被撤销。请连接新的凭证；草稿会保留。',{...common,code:'AUTH_EXPIRED'});
  if(response.status===429||response.headers.get('x-ratelimit-remaining')==='0'||/rate limit|abuse detection/i.test(message)){
    const retryAfter=Number(response.headers.get('retry-after'));
    const reset=Number(response.headers.get('x-ratelimit-reset'));
    const retryAt=retryAfter?Date.now()+retryAfter*1000:reset?reset*1000:Date.now()+60000;
    return new GitHubError(`GitHub 暂时限制请求频率。请在 ${new Date(retryAt).toLocaleTimeString('zh-CN')} 后重试，已保存的连接无需更换。`,{...common,code:'RATE_LIMITED',retryAt});
  }
  if(response.status===403){
    if(/\/issues|\/search\/issues/.test(path))return new GitHubError('评论区需要 Issues: Read and write 权限。文章可以继续发布，评论区可在补齐权限后重试。',{...common,code:'ISSUES_PERMISSION'});
    if(/git\/|\/contents\//.test(path))return new GitHubError('此凭证没有博客仓库的内容写入权限。请在 Repository access 选择 Xu0615.github.io，并把 Contents 设为 Read and write。仅创建 token 或只授予公开仓库读取权限无法发布。',{...common,code:'CONTENTS_PERMISSION'});
    return new GitHubError('此凭证没有获准访问博客仓库。请确认 Resource owner 为 Xu0615，Repository access 已选择 Xu0615.github.io，并已保存权限设置。',{...common,code:'REPOSITORY_PERMISSION'});
  }
  if(response.status===404)return new GitHubError('凭证无法访问博客仓库。请在 Repository access → Only select repositories 中选择 Xu0615.github.io。',{...common,code:'REPOSITORY_PERMISSION'});
  if(response.status===410&&path.includes('/issues'))return new GitHubError('仓库的 Issues 已关闭；文章仍可发布。开启 Issues 后可重新连接评论区。',{...common,code:'ISSUES_DISABLED'});
  if(response.status===409||(response.status===422&&/fast forward|reference update|not a fast forward/i.test(message)))return new GitHubError('GitHub 上出现了新的提交，请同步后再发布。本机草稿已保留。',{...common,code:'CONFLICT'});
  if(response.status===422)return new GitHubError('GitHub 未接受提交的数据，请检查文章设置或分支保护规则。草稿已保留。',{...common,code:'VALIDATION'});
  return new GitHubError(`GitHub 服务请求失败（${response.status}），请稍后重试。`,common);
}

export class GitHubClient {
  #token;
  constructor(token){this.#token=token;}
  clear(){this.#token='';}
  async request(path, options={}){
    let response;
    try{response=await fetch(`https://api.github.com${path}`,{...options,signal:options.signal||AbortSignal.timeout(30000),headers:{Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',Authorization:`Bearer ${this.#token}`,...(options.body?{'Content-Type':'application/json'}:{}),...options.headers}})}
    catch{throw new GitHubError('暂时无法连接 GitHub，请检查网络后重试。已保存的连接和草稿都会保留。',{code:'NETWORK',endpoint:path.split('?')[0]})}
    if(!response.ok)throw await githubError(response,path);
    return response.status===204?null:response.json();
  }
  async connect({probeWrite=true}={}){
    const user=await this.request('/user');
    if(user.login.toLowerCase()!=='xu0615')throw new GitHubError('只有 Xu0615 可以发布到这本手记。',{code:'WRONG_ACCOUNT'});
    const repo=await this.request(`/repos/${REPO}`);
    if(repo.permissions?.push===false)throw new GitHubError('当前账户没有博客仓库的写入权限。',{code:'REPOSITORY_PERMISSION'});
    // repo.permissions describes the account, not the token's scope. Probe an
    // unattached Git blob to verify actual write access without editing a branch.
    if(probeWrite)await this.request(`/repos/${REPO}/git/blobs`,{method:'POST',body:JSON.stringify({content:'xuwang publishing access check v1\n',encoding:'utf-8'})});
    return user;
  }
  async readContent(ref=BRANCH){
    const file=await this.request(`/repos/${REPO}/contents/${CONTENT_PATH}?ref=${encodeURIComponent(ref)}`);
    const encoded=file.content||(await this.request(`/repos/${REPO}/git/blobs/${file.sha}`)).content;
    const bytes=Uint8Array.from(atob(encoded.replace(/\s/g,'')),c=>c.charCodeAt(0));
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
  async prepareDiscussion(post){
    if(post.issue)return {issue:post.issue,warning:null};
    try{return {issue:await this.createDiscussion(post),warning:null}}
    catch(error){
      if(['ISSUES_PERMISSION','ISSUES_DISABLED','REPOSITORY_PERMISSION','NETWORK'].includes(error.code))return {issue:null,warning:error.message};
      throw error;
    }
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
    try{await this.request(`/repos/${REPO}/git/refs/heads/${BRANCH}`,{method:'PATCH',body:JSON.stringify({sha:created.sha,force:false})})}
    catch(error){
      if(error.code!=='NETWORK')throw error;
      // The server may have accepted the commit before the connection was lost.
      const latest=await this.request(`/repos/${REPO}/git/ref/heads/${BRANCH}`);
      if(latest.object.sha!==created.sha)throw error;
    }
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
