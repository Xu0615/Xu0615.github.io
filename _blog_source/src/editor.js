import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine, drawSelection } from '@codemirror/view';
import { defaultKeymap, history as editorHistory, historyKeymap, indentWithTab } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { renderMarkdown, escapeHTML as e, readingTime } from './markdown.js';
import { clone, postURL, validID, validateContent, REPO } from './model.js';
import { GitHubClient } from './publishing.js';

const STORE='xuwang-desk-v1';
const today=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const newID=()=>`note-${Date.now().toString(36)}`;
const guide=`## 从这里开始写作

这是一份**本机草稿**。你可以修改标题、栏目和正文，点击右上角「发布文章」后才会公开。

### 代码

\`\`\`python
def hello():
    print("Hello, xuwang!")
\`\`\`

### 数学公式

行内公式：$a^2+b^2=c^2$。

$$
\\mathcal{L} = -\\frac{1}{T}\\sum_{t=1}^{T}\\log p_\\theta(x_t\\mid x_{<t})
$$

### 表格

| 问题 | 观察 | 下一步 |
| --- | --- | --- |
| 我想理解什么？ | 目前知道什么？ | 如何验证？ |

### 流程图

\`\`\`mermaid
flowchart LR
  A[提出问题] --> B[阅读与实验]
  B --> C[记录观察]
  C --> D[修正理解]
  D --> A
\`\`\`

### 引用与任务

给结论补上参考文献。[^ref]

- [x] 写下问题
- [ ] 添加证据

[^ref]: 作者，年份。[文献标题](https://arxiv.org/)。

> 图片可以通过上方的「图片」按钮上传，发布时会一起保存到 GitHub。
`;

async function assetDB(){return new Promise((resolve,reject)=>{const req=indexedDB.open('xuwang-assets',1);req.onupgradeneeded=()=>req.result.createObjectStore('assets',{keyPath:'path'});req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
async function readAssets(){const db=await assetDB();return new Promise((resolve,reject)=>{const tx=db.transaction('assets','readonly'),req=tx.objectStore('assets').getAll();req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);tx.oncomplete=()=>db.close()})}
async function storeAsset(asset){const db=await assetDB();return new Promise((resolve,reject)=>{const tx=db.transaction('assets','readwrite');tx.objectStore('assets').put(asset);tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>reject(tx.error)})}
async function removeAssets(paths){const db=await assetDB();return new Promise((resolve,reject)=>{const tx=db.transaction('assets','readwrite');paths.forEach(p=>tx.objectStore('assets').delete(p));tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>reject(tx.error)})}

export async function startEditor(initialData,enhanceMarkdown){
  let published=clone(initialData),categories=clone(initialData.categories),drafts={},current=null,client=null,contentSha=null,loading=false,publishing=false,assets=[],previewTimer,saveTimer,toastTimer,view;
  const $=s=>document.querySelector(s);
  const dialog=$('#editor-dialog'),status=$('#save-status'),preview=$('#markdown-preview');
  const toast=message=>{const el=$('#toast');el.textContent=message;el.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.hidden=true,6000)};
  const download=(filename,content,type='text/plain')=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([content],{type}));a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
  const closeDialog=()=>dialog.close();
  function showDialog(title,body,actions=''){
    dialog.innerHTML=`<div class="dialog-heading"><h2>${e(title)}</h2><button class="dialog-close" aria-label="关闭">Esc</button></div>${body}<div class="dialog-actions">${actions}</div>`;
    dialog.querySelector('.dialog-close').onclick=closeDialog;
    if(!dialog.open)dialog.showModal();
  }
  function persist(){
    try{localStorage.setItem(STORE,JSON.stringify({drafts,categories,currentID:current?.id,baseCategories:published.categories}));status.textContent='草稿已保存到本机 · '+new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'});}
    catch{status.textContent='本机存储不可用，请先导出 Markdown 保存。';toast('浏览器无法保存草稿，请立即导出 Markdown。')}
  }
  let restoredID;
  try{
    const saved=JSON.parse(localStorage.getItem(STORE)||'null');
    if(saved){drafts=saved.drafts||{};restoredID=saved.currentID;if(JSON.stringify(saved.baseCategories)===JSON.stringify(published.categories))categories=saved.categories||categories;}
  }catch{toast('本机草稿读取失败，已打开公开版本。')}
  try{assets=await readAssets()}catch{toast('图片草稿存储不可用；文字仍可正常编辑。')}

  function allItems(){return [...published.posts.map(p=>drafts[p.id]||p),...Object.values(drafts).filter(d=>!published.posts.some(p=>p.id===d.id))]}
  function renderTree(){
    $('#editor-tree').innerHTML=categories.map(c=>`<details open><summary>${e(c.name)}</summary>${allItems().filter(p=>p.category===c.id).map(p=>`<button data-post="${e(p.id)}" class="${current?.id===p.id?'active':''}">${e(p.title||'未命名笔记')}${drafts[p.id]?' <span class="draft-indicator">· 草稿</span>':''}</button>`).join('')}</details>`).join('');
    $('#editor-tree').querySelectorAll('button').forEach(b=>b.onclick=()=>{openPost(b.dataset.post);$('.editor-shell').classList.remove('mobile-tree')});
    const select=$('#post-category');const value=current?.category;select.innerHTML=categories.map(c=>`<option value="${e(c.id)}">${e(c.name)}</option>`).join('');if(value)select.value=value;
  }
  function renderPreview(){
    if(!current)return;
    const rendered=renderMarkdown(current.body);
    preview.innerHTML=rendered.html||'<p class="muted">文字会在这里慢慢成形。<br>Your thoughts will take shape here.</p>';
    preview.querySelectorAll('img').forEach(img=>{const path=img.getAttribute('src')?.replace(/^\//,'');const asset=assets.find(a=>a.path===path);if(asset)img.src=`data:${asset.type};base64,${asset.base64}`});
    // Preview navigation must never take the writer away from an unsaved draft.
    preview.querySelectorAll('a').forEach(a=>{const href=a.getAttribute('href');if(href&&!href.startsWith('#')){a.href=new URL(href,location.origin+postURL(current)).href;a.target='_blank';a.rel='noopener'}});
    enhanceMarkdown(preview);
    $('#word-count').textContent=`${current.body.length.toLocaleString()} 字符 · ${readingTime(current.body)} min`;
  }
  function changeDraft(){
    if(loading||!current)return;
    current.title=$('#post-title').value;
    current.summary=$('#post-summary').value;
    current.category=$('#post-category').value;
    current.lang=$('#post-language').value;
    current.tags=$('#post-tags').value.split(/[,，]/).map(s=>s.trim()).filter(Boolean);
    current.date=$('#post-date').value||today();
    current.issue=Number($('#post-issue').value)||null;
    current.body=view.state.doc.toString();
    drafts[current.id]=clone(current);
    status.textContent='正在保存草稿…';
    clearTimeout(saveTimer);saveTimer=setTimeout(()=>{persist();renderTree()},400);
    clearTimeout(previewTimer);previewTimer=setTimeout(renderPreview,230);
  }
  view=new EditorView({state:EditorState.create({doc:'',extensions:[lineNumbers(),editorHistory(),drawSelection(),highlightActiveLine(),markdown(),syntaxHighlighting(defaultHighlightStyle),EditorView.lineWrapping,keymap.of([...defaultKeymap,...historyKeymap,indentWithTab,{key:'Mod-s',run:()=>{changeDraft();persist();toast('草稿已保存到当前浏览器');return true}}]),EditorView.updateListener.of(update=>{if(update.docChanged)changeDraft()})]}),parent:$('#code-editor')});
  function openPost(id){
    if(current&&!loading){clearTimeout(saveTimer);persist()}
    const post=drafts[id]||published.posts.find(p=>p.id===id);if(!post)return;
    loading=true;current=clone(post);
    $('#post-title').value=current.title;$('#post-summary').value=current.summary||'';$('#post-language').value=current.lang||'zh-CN';$('#post-tags').value=current.tags.join(', ');$('#post-slug').value=current.id;$('#post-slug').disabled=published.posts.some(p=>p.id===current.id);$('#post-date').value=current.date;$('#post-issue').value=current.issue||'';
    renderTree();
    view.dispatch({changes:{from:0,to:view.state.doc.length,insert:current.body}});
    loading=false;renderPreview();
    status.textContent=drafts[id]?'已恢复本机草稿 · 尚未发布':'公开版本 · 修改会保存为本机草稿';
    history.replaceState(null,'',`/blog/editor/?post=${encodeURIComponent(id)}`);
  }
  function createDraft(body=''){
    if(!categories.length){toast('请先新建一个栏目');manageCategories();return}
    const id=newID();drafts[id]={id,category:categories[0].id,title:'',subtitle:'',summary:'',tags:[],lang:'zh-CN',date:today(),updated:today(),issue:null,body};openPost(id);persist();$('#post-title').focus();
  }
  $('#new-post').onclick=()=>createDraft();
  $('#help-toggle').onclick=()=>{
    showDialog('Markdown 写作指南',`<p>标题用 <code>##</code>；粗体用 <code>**文字**</code>；行内公式用 <code>$...$</code>，独立公式用 <code>$$</code>。使用 <code>mermaid</code> 代码块绘制流程图，使用 <code>[^ref]</code> 添加脚注参考文献。</p><p>支持代码高亮、复制、表格、任务列表、图片上传、撤销重做。左侧目录用于切换文章，草稿只保存在本机，点击发布后才会公开。</p><p>快捷键：⌘ / Ctrl + S 保存草稿；⌘ / Ctrl + Z 撤销。手机端可用“切换预览”按钮。</p>`,`<button class="solid-button" id="create-guide">打开示例草稿</button>`);
    $('#create-guide').onclick=()=>{closeDialog();createDraft(guide);$('#post-title').value='Markdown 写作示例';changeDraft()};
  };
  ['#post-title','#post-summary','#post-language','#post-tags','#post-category','#post-date','#post-issue'].forEach(s=>$(s).addEventListener('input',changeDraft));
  $('#post-slug').addEventListener('change',()=>{
    const id=$('#post-slug').value.trim();
    if(!validID(id)||allItems().some(p=>p.id===id&&p.id!==current.id)){toast('网址 ID 仅允许小写字母、数字和连字符，且不能重复。');$('#post-slug').value=current.id;return}
    if(id===current.id)return;
    delete drafts[current.id];current.id=id;drafts[id]=clone(current);persist();renderTree();
  });
  $('#more-settings').onclick=()=>$('#extra-settings').hidden=!$('#extra-settings').hidden;
  $('#mobile-pane').onclick=()=>$('.split-editor').classList.toggle('show-preview');
  $('.editor-topbar').addEventListener('click',ev=>{if(ev.target===$('.editor-topbar'))$('.editor-shell').classList.toggle('mobile-tree')});
  let scrollLock=false;
  const sync=(from,to)=>{if(scrollLock||!$('#sync-scroll').checked)return;scrollLock=true;const max=from.scrollHeight-from.clientHeight;to.scrollTop=max>0?from.scrollTop/max*(to.scrollHeight-to.clientHeight):0;requestAnimationFrame(()=>scrollLock=false)};
  view.scrollDOM.addEventListener('scroll',()=>sync(view.scrollDOM,preview));preview.addEventListener('scroll',()=>sync(preview,view.scrollDOM));
  const insertions={heading:['\n## ','\n'],bold:['**','**'],italic:['*','*'],link:['[','](https://example.com)'],code:['\n```python\n','\n```\n'],math:['\n$$\n','\n$$\n'],table:['\n| 列一 | 列二 |\n| --- | --- |\n| 内容 | 内容 |\n',''],diagram:['\n```mermaid\nflowchart LR\n  A[问题] --> B[观察]\n  B --> C[理解]\n```\n',''],footnote:['[^ref]\n\n[^ref]: 作者，年份。[标题](https://example.com)\n','']};
  function insertText(before,after=''){
    const selection=view.state.selection.main;const selected=view.state.sliceDoc(selection.from,selection.to);
    view.dispatch({changes:{from:selection.from,to:selection.to,insert:before+selected+after},selection:{anchor:selection.from+before.length,head:selection.from+before.length+selected.length}});view.focus();
  }
  document.querySelectorAll('[data-insert]').forEach(b=>b.onclick=()=>insertText(...insertions[b.dataset.insert]));
  $('#upload-image').onclick=()=>$('#image-file').click();
  $('#image-file').onchange=async()=>{
    const file=$('#image-file').files[0];if(!file)return;
    if(!['image/png','image/jpeg','image/webp','image/gif'].includes(file.type)){toast('请使用 PNG、JPEG、WebP 或 GIF 图片。');return}
    if(file.size>5*1024*1024){toast('单张图片请控制在 5 MB 以内。');return}
    const ext={'image/png':'png','image/jpeg':'jpg','image/webp':'webp','image/gif':'gif'}[file.type];
    const path=`blog/uploads/${crypto.randomUUID()}.${ext}`;
    const base64=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.onerror=reject;reader.readAsDataURL(file)});
    const asset={path,type:file.type,base64};
    try{await storeAsset(asset);assets.push(asset);insertText(`\n![${file.name.replace(/[\[\]\r\n]/g,'')}](/${path})\n`);toast('图片已保存到本机，发布文章时上传。')}catch{toast('无法保存图片草稿，请检查浏览器存储空间。')}
    $('#image-file').value='';
  };
  $('#export-md').onclick=()=>download(`${current.id}.md`,current.body,'text/markdown');
  $('#export-backup').onclick=()=>download(`xuwang-backup-${today()}.json`,JSON.stringify({published,categories,drafts,assets},null,2),'application/json');

  async function syncRemote(){
    const remote=await client.readContent();
    if(JSON.stringify(categories)===JSON.stringify(published.categories))categories=clone(remote.data.categories);
    published=remote.data;contentSha=remote.sha;
    // Preserve local drafts. Published articles with no local changes refresh from GitHub.
    if(current&&!drafts[current.id]&&published.posts.some(p=>p.id===current.id))openPost(current.id);
    renderTree();return remote;
  }
  function connectDialog(){
    if(client){
      showDialog('GitHub 已连接',`<p>当前账户：Xu0615。内容保存在 <strong>${REPO}</strong>。</p><p>凭证仅保存在此页面的内存中，不写入草稿或仓库。刷新或关闭页面后，需要重新连接。</p><p>同步会读取远端最新内容，并保留本机草稿。</p>`,`<button class="quiet-button" id="disconnect">断开连接</button><button class="solid-button" id="sync-remote">同步 GitHub</button>`);
      $('#disconnect').onclick=()=>{client.clear();client=null;contentSha=null;$('#connection-status').textContent='未连接 · 可在本机写作';$('#connect-github').textContent='连接 GitHub ↗';closeDialog()};
      $('#sync-remote').onclick=async()=>{try{await syncRemote();closeDialog();toast('已同步最新公开内容，本机草稿已保留。')}catch(err){toast(err.message)}};
      return;
    }
    showDialog('连接你的 GitHub',`<p>写作与预览无需登录。发布时，使用只授权这个仓库的 GitHub 凭证。</p><ol><li>在 <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">GitHub 创建 Fine-grained token ↗</a>。</li><li>Repository access 选择 <strong>Only select repositories → Xu0615.github.io</strong>。</li><li>Repository permissions 设置 <strong>Contents: Read and write</strong> 与 <strong>Issues: Read and write</strong>。Issues 用来建立文章评论区。</li></ol><label for="github-token">GitHub token</label><input id="github-token" class="token-field" type="password" autocomplete="off" spellcheck="false" placeholder="github_pat_…"><p>凭证只留在当前页面内存中。请直接在此处输入，不要发送到聊天或写入文章。</p><p id="connect-error" class="connection-error" role="alert"></p>`,`<button class="solid-button" id="confirm-connect">连接账户</button>`);
    $('#confirm-connect').onclick=async()=>{
      const button=$('#confirm-connect'),token=$('#github-token').value.trim();
      if(!token){$('#connect-error').textContent='请输入凭证。';return}
      button.disabled=true;button.textContent='正在验证…';
      const candidate=new GitHubClient(token);$('#github-token').value='';
      try{await candidate.connect();client=candidate;await syncRemote();$('#connection-status').textContent='已连接 Xu0615 · 凭证仅本次有效';$('#connect-github').textContent='同步 GitHub / 账户 ↗';closeDialog();toast('GitHub 已连接。现在可以发布文章。')}
      catch(err){candidate.clear();client=null;contentSha=null;$('#connect-error').textContent=err.message;button.disabled=false;button.textContent='重新连接'}
    };
  }
  $('#connect-github').onclick=connectDialog;
  async function publish(kind='post',targetData=null){
    if(publishing)return;
    if(!client){connectDialog();return}
    changeDraft();clearTimeout(saveTimer);persist();
    let next=targetData||clone(published);next.categories=clone(categories);next.updated=today();next.revision=crypto.randomUUID();
    if(kind==='post'){
      const post=clone(current);post.title=post.title.trim();post.updated=today();
      const index=next.posts.findIndex(p=>p.id===post.id);if(index<0)next.posts.unshift(post);else next.posts[index]=post;
    }
    try{validateContent(next)}catch(err){toast(err.message);return}
    const setProgress=text=>{$('#publish-status').textContent=text;status.textContent=text};
    publishing=true;$('#publish-post').disabled=true;$('.editor-shell').inert=true;
    try{
      const check=await client.readContent();if(check.sha!==contentSha)throw new Error('远端内容已更新。请通过左下角“同步 GitHub”先同步；本机草稿将保留。');
      if(kind==='post'){
        const post=next.posts.find(p=>p.id===current.id);
        if(!post.issue){setProgress('建立文章评论区…');post.issue=await client.createDiscussion(post);current.issue=post.issue;$('#post-issue').value=post.issue;drafts[current.id]=clone(current);persist();}
      }
      const usedAssets=assets.filter(a=>next.posts.some(p=>p.body.includes('/'+a.path)));
      const result=await client.publish(next,published,contentSha,usedAssets,setProgress);
      contentSha=result.contentSha;published=clone(next);
      if(kind==='post'){delete drafts[current.id];current=clone(next.posts.find(p=>p.id===current.id));}
      try{await removeAssets(usedAssets.map(a=>a.path))}catch{toast('文章已提交；本机图片缓存将在下次清理。')}
      assets=assets.filter(a=>!usedAssets.some(u=>u.path===a.path));
      persist();renderTree();setProgress('已提交到 GitHub，正在等待网站更新…');
      const publicURL=kind==='post'?postURL(current):'/blog/';
      toast('提交成功。GitHub Pages 更新通常需要约 1–2 分钟。');
      void waitForDeployment(next.revision,publicURL,result.commit);
    }catch(err){setProgress('未发布 · 草稿已保留');toast(err.message)}
    finally{publishing=false;$('#publish-post').disabled=false;$('.editor-shell').inert=false;}
  }
  async function waitForDeployment(revision,url,commit){
    for(let i=0;i<30;i++){
      await new Promise(r=>setTimeout(r,4000));
      try{const response=await fetch(`/blog/content.json?v=${encodeURIComponent(revision)}`,{cache:'no-store'});if(response.ok&&(await response.json()).revision===revision){$('#publish-status').innerHTML=`网站已更新 · <a href="${url}" target="_blank" rel="noopener">查看文章 ↗</a>`;status.textContent='发布成功 · 网站已更新';toast('网站已更新，可以分享链接了。');return}}catch{}
    }
    $('#publish-status').innerHTML=`内容已提交，部署仍在进行 · <a href="https://github.com/${REPO}/actions" target="_blank" rel="noopener">查看部署 ↗</a>`;
  }
  $('#publish-post').onclick=()=>publish();

  function manageCategories(){
    let edited=clone(categories);
    const render=()=>{
      showDialog('整理你的目录',`<p>栏目可以改名、排序、新增。删除栏目之前，请先移动或删除其中的文章。点击“保存到本机”后，可继续写作；点击“发布栏目”则更新公开目录。</p><div id="category-list">${edited.map((c,i)=>`<div class="category-edit" data-index="${i}"><label>栏目名称<input data-field="name" value="${e(c.name)}"></label><label>中文名称<input data-field="zh" value="${e(c.zh||'')}"></label><div><button class="category-up" data-index="${i}" aria-label="上移栏目">↑</button> <button class="category-down" data-index="${i}" aria-label="下移栏目">↓</button></div><label class="description-label">栏目简介<input data-field="description" value="${e(c.description||'')}"></label><button class="category-delete" data-index="${i}">删除</button></div>`).join('')}</div><button id="add-category" class="text-link">＋ 新建栏目</button>`,`<button id="save-categories" class="quiet-button">保存到本机</button><button id="publish-categories" class="solid-button">发布栏目 ↗</button>`);
      $('#category-list').addEventListener('input',ev=>{const row=ev.target.closest('[data-index]');if(row&&ev.target.dataset.field)edited[Number(row.dataset.index)][ev.target.dataset.field]=ev.target.value});
      dialog.querySelectorAll('.category-delete').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.index),cat=edited[i];if(allItems().some(p=>p.category===cat.id)){toast('栏目中还有文章，请先移动或删除文章。');return}edited.splice(i,1);render()});
      for(const [selector,offset] of [['.category-up',-1],['.category-down',1]])dialog.querySelectorAll(selector).forEach(b=>b.onclick=()=>{const i=Number(b.dataset.index),j=i+offset;if(j<0||j>=edited.length)return;[edited[i],edited[j]]=[edited[j],edited[i]];render()});
      $('#add-category').onclick=()=>{edited.push({id:'topic-'+Date.now().toString(36),name:'新栏目',zh:'',description:'',en:''});render()};
      const save=()=>{if(edited.some(c=>!c.name.trim())){toast('请给每个栏目填写名称。');return false}categories=clone(edited);persist();renderTree();return true};
      $('#save-categories').onclick=()=>{if(save()){closeDialog();toast('目录已保存在本机，发布后对读者生效。')}};
      $('#publish-categories').onclick=()=>{if(save()){closeDialog();publish('categories')}};
    };render();
  }
  $('#manage-categories').onclick=manageCategories;
  $('#delete-post').onclick=()=>{
    const id=current.id,isPublished=published.posts.some(p=>p.id===id);
    showDialog('删除这篇文章？',`<p>将删除「${e(current.title||'未命名笔记')}」。${isPublished?'公开页面会从网站移除，GitHub 历史仍保留。评论讨论保留在 GitHub。':'这是一篇本机草稿，删除后无法通过网站恢复。'}</p>`,`<button class="quiet-button" id="cancel-delete">取消</button><button class="solid-button" id="confirm-delete">确认删除</button>`);
    $('#cancel-delete').onclick=closeDialog;
    $('#confirm-delete').onclick=async()=>{
      if(isPublished&&!client){closeDialog();connectDialog();return}
      closeDialog();
      if(isPublished){const next=clone(published);next.posts=next.posts.filter(p=>p.id!==id);await publish('delete',next);if(published.posts.some(p=>p.id===id))return;}
      delete drafts[id];current=null;persist();const remaining=allItems();if(remaining.length)openPost(remaining[0].id);else createDraft();renderTree();toast('文章已删除。');
    };
  };
  const requested=new URLSearchParams(location.search).get('post');
  const selected=[requested,restoredID,published.posts[0]?.id].find(id=>id&&(drafts[id]||published.posts.some(p=>p.id===id)));
  if(selected)openPost(selected);else createDraft();
  window.addEventListener('pagehide',()=>{clearTimeout(saveTimer);persist();client?.clear()});
  window.addEventListener('beforeunload',ev=>{if(publishing){ev.preventDefault();ev.returnValue='发布正在进行。'}});
}
