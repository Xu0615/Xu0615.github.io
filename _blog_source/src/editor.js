import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine, drawSelection } from '@codemirror/view';
import { defaultKeymap, history as editorHistory, historyKeymap, indentWithTab } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { renderMarkdown, escapeHTML as e, readingTime } from './markdown.js';
import { clone, postURL, validID, validateContent, REPO, folderPath, byOrder } from './model.js';
import { GitHubClient } from './publishing.js';
import { DeviceAuthVault, DeviceConnection } from './device-auth.js';

const STORE='xuwang-desk-v1';
const today=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const newID=()=>`note-${Date.now().toString(36)}-${crypto.randomUUID().slice(0,6)}`;
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

### 多模态 SAE 交互图

本博客内置了 Lesson 1 的三种交互图。代码块语言写 \`mllm-sae\`，内容填 \`flow\`、\`training\` 或 \`dictionary\`。它们分别演示模型与 hook、训练流程、共享字典；数值为教学模拟，不执行模型推理。

\`\`\`mllm-sae
flow
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

import {createWorkspace,workingPosts,workingPost,saveDraft,draftHasRemoteChanges,subtreeIDs,destination,addFolder,moveNode,undoMove,duplicatePost,deleteNode,restoreTrash,buildPublication,acceptPublication,structureChanges} from './workspace.js';
export async function startEditor(initialData,enhanceMarkdown){
  const editorRoot=document.querySelector('.editor-shell');
  if(editorRoot.dataset.editorStarted==='true')return;
  editorRoot.dataset.editorStarted='true';
  let published=clone(initialData),state,currentID=null,mode='read',client=null,contentSha=null,loading=false,publishing=false,assets=[],previewTimer,saveTimer,toastTimer,view,undoSnapshot=null,dragged=null,importTarget=null;
  const connection=new DeviceConnection(new DeviceAuthVault(),token=>new GitHubClient(token));
  let restoreTask=null,latestDeployment=null;
  const $=s=>document.querySelector(s),dialog=$('#editor-dialog'),status=$('#save-status'),preview=$('#markdown-preview'),menu=$('#desk-context-menu');
  const editorStates=new Map();
  const allItems=()=>workingPosts(state,published),current=()=>workingPost(state,published,currentID);
  const toast=message=>{const el=$('#toast');el.textContent=message;el.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.hidden=true,6000)};
  const download=(filename,content,type='text/plain')=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([content],{type}));a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
  const closeDialog=()=>dialog.close();
  function showDialog(title,body,actions=''){
    hideMenu();dialog.innerHTML=`<div class="dialog-heading"><h2>${e(title)}</h2><button class="dialog-close" aria-label="关闭">Esc</button></div>${body}<div class="dialog-actions">${actions}</div>`;
    dialog.querySelector('.dialog-close').onclick=closeDialog;if(!dialog.open)dialog.showModal();
  }
  function persist(){
    clearTimeout(saveTimer);
    try{localStorage.setItem(STORE,JSON.stringify(state));status.textContent='已保存到本机 · '+new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'});return true}
    catch{status.textContent='本机存储已满或不可用，请立即导出备份。';toast('浏览器无法保存，请导出全部内容备份。');return false}
  }
  let saved={};
  try{saved=JSON.parse(localStorage.getItem(STORE)||'null')||{}}catch{toast('本机草稿读取失败，已打开公开版本。')}
  state=createWorkspace(published,saved);
  try{assets=await readAssets()}catch{toast('图片草稿存储不可用；文字仍可正常编辑。')}
  const titleOf=p=>p?.title||'未命名文档';
  const folderLabel=id=>folderPath(state.folders,id).map(f=>f.name).join(' / ');
  const categoryName=id=>state.categories.find(c=>c.id===id)?.name||'';
  function selectedLocation(){
    if(state.selected?.kind==='folder'){const f=state.folders.find(f=>f.id===state.selected.id);if(f)return {category:f.category,folder:f.id}}
    if(state.selected?.kind==='category')return {category:state.selected.id,folder:null};
    const p=current();return p?{category:p.category,folder:p.folder||null}:{category:state.categories[0]?.id,folder:null};
  }
  function expandLocation(category,folder){state.collapsed=state.collapsed.filter(key=>key!==`category:${category}`&&!folderPath(state.folders,folder).some(f=>key===`folder:${f.id}`));}
  function markStructure(){
    const changes=structureChanges(state,published);$('#structure-pending').hidden=!changes.pending&&!undoSnapshot;
    $('#structure-count').textContent=changes.pending?`目录待发布${changes.moved?' · '+changes.moved+' 篇移动':''}${changes.deleted?' · '+changes.deleted+' 篇移除':''}`:'目录已保存到本机';
    $('#publish-structure').disabled=!changes.pending;$('#undo-move').hidden=!undoSnapshot;$('#trash-count').textContent=state.trash.length;
  }
  function nodeRow(kind,id,label,depth=0){
    const selected=state.selected?.kind===kind&&state.selected.id===id,branch=kind!=='post',closed=state.collapsed.includes(`${kind}:${id}`);
    return `<div class="tree-row ${selected?'selected':''}" data-kind="${kind}" data-id="${e(id)}" style="--depth:${depth}" ${branch&&kind==='category'?'':`draggable="true"`}>
      ${branch?`<button class="tree-toggle" data-action="toggle" aria-label="${closed?'展开':'折叠'} ${e(label)}" aria-expanded="${!closed}">${closed?'›':'⌄'}</button>`:'<span class="doc-symbol" aria-hidden="true">·</span>'}
      <button class="tree-label" data-action="open" title="${e(label)}" ${selected?'aria-current="page"':''}>${kind==='folder'?'<span class="folder-symbol">▱</span> ':''}${e(label)}${kind==='post'&&state.drafts[id]?'<i class="draft-dot" title="本机草稿">•</i>':''}${kind==='post'&&state.favorites.includes(id)?'<span class="favorite-star">☆</span>':''}</button>
      ${branch?'<button class="tree-add" data-action="new" aria-label="新建 Markdown 或文件夹" title="新建 Markdown 或文件夹">＋</button>':''}<button class="tree-more" data-action="menu" aria-label="更多操作" title="更多操作">···</button>
    </div>`;
  }
  function renderTree(){
    const posts=allItems(),query=$('#desk-search').value.trim().toLocaleLowerCase();
    if(query){
      const terms=query.split(/\s+/),matches=posts.filter(p=>terms.every(t=>`${p.title} ${p.body} ${p.summary||''} ${p.tags.join(' ')} ${categoryName(p.category)} ${folderLabel(p.folder)}`.toLocaleLowerCase().includes(t)));
      const folders=state.folders.filter(f=>terms.every(t=>f.name.toLocaleLowerCase().includes(t)));
      $('#editor-tree').innerHTML=`<p class="tree-search-count">${matches.length} 篇文档 · ${folders.length} 个文件夹</p>`+folders.map(f=>nodeRow('folder',f.id,f.name)).join('')+matches.map(p=>nodeRow('post',p.id,titleOf(p))).join('');
    }else{
      const branch=(category,parent,depth)=>state.folders.filter(f=>f.category===category&&(f.parent||null)===parent).sort(byOrder).map(f=>nodeRow('folder',f.id,f.name,depth)+(state.collapsed.includes(`folder:${f.id}`)?'':branch(category,f.id,depth+1))).join('')+posts.filter(p=>p.category===category&&(p.folder||null)===parent).sort(byOrder).map(p=>nodeRow('post',p.id,titleOf(p),depth)).join('');
      $('#editor-tree').innerHTML=state.categories.map(c=>nodeRow('category',c.id,c.name)+(state.collapsed.includes(`category:${c.id}`)?'':branch(c.id,null,1))).join('');
    }
    markStructure();
  }
  function renderBreadcrumb(){
    const loc=selectedLocation(),sel=state.selected;
    $('#desk-breadcrumb').innerHTML=sel?.kind==='trash'?'回收站':sel?.kind==='favorites'?'我的收藏':`<button data-kind="category" data-id="${e(loc.category||'')}">${e(categoryName(loc.category))}</button>${folderPath(state.folders,loc.folder).map(f=>`<span>/</span><button data-kind="folder" data-id="${e(f.id)}">${e(f.name)}</button>`).join('')}${currentID?`<span>/</span><span class="breadcrumb-current">${e(titleOf(current()))}</span>`:''}`;
  }
  function renderReaderHeading(){
    const p=current();if(!p)return;
    $('#reader-heading').innerHTML=`<div class="reader-kicker"><span class="eyebrow">${e(categoryName(p.category))} / FIELD NOTES</span><span class="document-badge ${state.drafts[p.id]?'local':''}">${state.drafts[p.id]?'本机草稿 · 未发布':'已发布'}</span></div><h1>${e(titleOf(p))}</h1>${p.summary?`<p>${e(p.summary)}</p>`:''}<div class="reader-meta"><span>xuwang</span><span>${e(p.date)}</span>${p.tags.map(t=>`<span class="reader-tag">${e(t)}</span>`).join('')}</div>`;
    $('#draft-conflict').hidden=!draftHasRemoteChanges(state,published,p.id);
  }
  function renderPreview(){
    const p=current();if(!p)return;
    const rendered=renderMarkdown(p.body);preview.lang=p.lang;
    preview.innerHTML=rendered.html||'<p class="muted">文字会在这里慢慢成形。<br>Your thoughts will take shape here.</p>';
    preview.querySelectorAll('img').forEach(img=>{const path=img.getAttribute('src')?.replace(/^\//,'');const asset=assets.find(a=>a.path===path);if(asset)img.src=`data:${asset.type};base64,${asset.base64}`});
    preview.querySelectorAll('a').forEach(a=>{const href=a.getAttribute('href');if(href&&!href.startsWith('#')){a.href=new URL(href,location.origin+postURL(p)).href;a.target='_blank';a.rel='noopener'}});
    enhanceMarkdown(preview);$('#word-count').textContent=`${p.body.length.toLocaleString()} 字符 · ${readingTime(p.body)} min`;
    renderReaderHeading();
  }
  function fillLocationFields(){
    const p=current();if(!p)return;
    $('#post-category').innerHTML=state.categories.map(c=>`<option value="${e(c.id)}">${e(c.name)}</option>`).join('');$('#post-category').value=p.category;
    $('#post-folder').innerHTML='<option value="">栏目根目录</option>'+state.folders.filter(f=>f.category===p.category).map(f=>`<option value="${e(f.id)}">${e(folderLabel(f.id))}</option>`).join('');$('#post-folder').value=p.folder||'';
  }
  function fillFields(){
    const p=current();if(!p)return;
    $('#post-title').value=p.title;$('#post-summary').value=p.summary||'';$('#post-language').value=p.lang||'zh-CN';$('#post-tags').value=p.tags.join(', ');$('#post-slug').value=p.id;$('#post-slug').disabled=published.posts.some(x=>x.id===p.id);$('#post-date').value=p.date;$('#post-issue').value=p.issue||'';fillLocationFields();
  }
  function changeDraft(){
    if(loading||!currentID||mode!=='edit')return;
    const p=current();if(!p)return;
    Object.assign(p,{title:$('#post-title').value,summary:$('#post-summary').value,lang:$('#post-language').value,tags:$('#post-tags').value.split(/[,，]/).map(s=>s.trim()).filter(Boolean),date:$('#post-date').value||today(),issue:Number($('#post-issue').value)||null,body:view.state.doc.toString()});
    saveDraft(state,published,p);editorStates.set(p.id,view.state);status.textContent='正在保存草稿…';
    clearTimeout(saveTimer);saveTimer=setTimeout(()=>{persist();renderTree();renderBreadcrumb()},400);
    clearTimeout(previewTimer);previewTimer=setTimeout(renderPreview,230);
  }
  const makeEditorState=doc=>EditorState.create({doc,extensions:[lineNumbers(),editorHistory(),drawSelection(),highlightActiveLine(),markdown(),syntaxHighlighting(defaultHighlightStyle),EditorView.lineWrapping,keymap.of([...defaultKeymap,...historyKeymap,indentWithTab,{key:'Mod-s',run:()=>{changeDraft();persist();toast('草稿已保存到当前浏览器');return true}}]),EditorView.updateListener.of(update=>{if(update.docChanged)changeDraft()})]});
  view=new EditorView({state:makeEditorState(''),parent:$('#code-editor')});
  function setMode(next){
    if(!currentID)return;clearTimeout(previewTimer);mode=next;editorRoot.dataset.mode=mode;
    document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===mode)));
    $('#preview-label').textContent=mode==='edit'?'LIVE PREVIEW / 实时预览':mode==='preview'?'PREVIEW / 全文预览':'READING / 阅读';
    $('.split-editor').classList.remove('show-preview');renderPreview();
    if(mode==='edit')requestAnimationFrame(()=>view.requestMeasure());
    history.replaceState(null,'',`/blog/editor/?post=${encodeURIComponent(currentID)}${mode==='edit'?'&mode=edit':''}`);
  }
  function openPost(id,nextMode='read'){
    const p=workingPost(state,published,id);if(!p)return;
    clearTimeout(previewTimer);if(currentID)editorStates.set(currentID,view.state);
    loading=true;currentID=id;state.selected={kind:'post',id};expandLocation(p.category,p.folder);
    $('#collection-view').hidden=true;$('#document-view').hidden=false;$('.document-actions').hidden=false;fillFields();
    const cached=editorStates.get(id);view.setState(cached?.doc.toString()===p.body?cached:makeEditorState(p.body));
    loading=false;setMode(nextMode);renderTree();renderBreadcrumb();persist();
    preview.scrollTop=0;$('#document-view').scrollTop=0;editorRoot.classList.remove('mobile-tree');
  }
  function openCollection(kind,id=null){
    if(currentID)editorStates.set(currentID,view.state);currentID=null;clearTimeout(previewTimer);
    state.selected={kind,id};$('#collection-view').hidden=false;$('#document-view').hidden=true;$('.document-actions').hidden=true;
    editorRoot.dataset.mode='collection';renderCollection();renderTree();renderBreadcrumb();persist();editorRoot.classList.remove('mobile-tree');
    history.replaceState(null,'','/blog/editor/');
  }
  function articleRow(p){return `<div class="collection-post" data-kind="post" data-id="${e(p.id)}" draggable="true"><span class="collection-doc-icon">▤</span><button data-action="open"><strong>${e(titleOf(p))}</strong><span>${e([folderLabel(p.folder),p.summary].filter(Boolean).join(' · ')||'还没有摘要')}</span></button><span class="collection-date">${e(p.updated||p.date)}${state.drafts[p.id]?'<i>本机草稿</i>':''}</span><button data-action="menu" class="collection-more" aria-label="更多操作">···</button></div>`}
  function renderCollection(){
    const sel=state.selected;if(!sel||sel.kind==='post')return;
    if(sel.kind==='trash'){
      $('#collection-view').innerHTML=`<div class="collection-intro"><p class="eyebrow">A PLACE TO RETURN TO</p><h1>回收站</h1><p>误删的文档与文件夹都在这里。公开文章会在发布目录后移除，恢复的正文作为本机草稿保留。</p></div><div class="trash-list">${state.trash.map(t=>`<div class="trash-item"><div><strong>${e(t.name||'未命名文档')}</strong><p>${t.posts.length} 篇文档 · ${t.folders.length} 个文件夹 · ${e(t.deletedAt)}</p></div><button class="quiet-button" data-restore="${e(t.key)}">恢复</button></div>`).join('')||'<div class="collection-empty">回收站是空的。每一页都还在。</div>'}</div>`;
      return;
    }
    const loc=selectedLocation(),folder=state.folders.find(f=>f.id===loc.folder),fav=sel.kind==='favorites';
    const ids=loc.folder?subtreeIDs(state.folders,loc.folder):null;
    const posts=allItems().filter(p=>fav?state.favorites.includes(p.id):p.category===loc.category&&(!ids||ids.has(p.folder))).sort(byOrder);
    const folders=fav?[]:state.folders.filter(f=>f.category===loc.category&&(f.parent||null)===(loc.folder||null)).sort(byOrder);
    $('#collection-view').innerHTML=`<div class="collection-intro"><p class="eyebrow">${fav?'CLOSE AT HAND / 我的收藏':folder?'A CHAPTER WITHIN / 文件夹':'THE NOTEBOOKS / 研究手记'}</p><div class="collection-title-row"><h1>${e(fav?'值得常翻的几页':folder?.name||categoryName(loc.category)||'我的目录')}</h1>${fav?'':'<button class="quiet-button" data-collection-new>＋ 新建</button>'}</div><p>${e(fav?'收藏保存在当前设备。':folder?'把相关的观察放在一起，让思路慢慢长出来。':state.categories.find(c=>c.id===loc.category)?.description||'从一页空白，开始新的理解。')}</p><span class="collection-count">${posts.length} 篇文档${folders.length?' · '+folders.length+' 个文件夹':''}</span></div>${folders.length?`<div class="folder-grid">${folders.map(f=>`<div class="folder-card" data-kind="folder" data-id="${e(f.id)}" draggable="true"><button data-action="open"><span>▱</span><strong>${e(f.name)}</strong><small>${allItems().filter(p=>subtreeIDs(state.folders,f.id).has(p.folder)).length} 篇文档</small></button><button data-action="menu" aria-label="文件夹更多操作">···</button></div>`).join('')}</div>`:''}<div class="collection-list-heading"><span>文档${folders.length?' · 包含子文件夹':''}</span><span>最近更新</span></div><div class="collection-posts">${posts.map(articleRow).join('')||`<div class="collection-empty"><span>✳</span><p>${fav?'还没有收藏。通过文档的更多操作，留下常读的几页。':'这一页还留着空白。点击「＋ 新建」，写下第一个问题。'}</p></div>`}</div>`;
  }
  function refreshWorkspace(){renderTree();renderBreadcrumb();if(currentID){fillLocationFields();renderReaderHeading()}else renderCollection();persist()}
  function createDraft(body='',target=selectedLocation(),title='未命名文档'){
    if(!state.categories.length){toast('请先新建一个栏目');manageCategories();return}
    const loc=destination(state,target.category||state.categories[0].id,target.folder),id=newID();
    saveDraft(state,published,{id,...loc,title,subtitle:'',summary:'',tags:[],lang:'zh-CN',date:today(),updated:today(),issue:null,order:Date.now(),body});
    undoSnapshot=null;$('#desk-search').value='';openPost(id,'edit');$('#post-title').focus();$('#post-title').select();return id;
  }
  function newFolder(target){
    showDialog('新建文件夹',`<p>${e(categoryName(target.category))}${target.folder?' / '+e(folderLabel(target.folder)):''}</p><label for="folder-name">文件夹名称</label><input id="folder-name" maxlength="120" placeholder="例如：论文阅读、实验记录">`,`<button id="confirm-folder" class="solid-button">创建文件夹</button>`);
    const submit=()=>{try{const f=addFolder(state,{id:'folder-'+crypto.randomUUID().slice(0,12),name:$('#folder-name').value,...{category:target.category,parent:target.folder}});undoSnapshot=null;expandLocation(f.category,f.id);closeDialog();openCollection('folder',f.id);toast('文件夹已创建，点击发布目录后同步。')}catch(err){toast(err.message)}};
    $('#confirm-folder').onclick=submit;$('#folder-name').onkeydown=ev=>{if(ev.key==='Enter')submit()};$('#folder-name').focus();
  }
  function hideMenu(){menu.hidden=true;menu.innerHTML=''}
  function showMenu(items,anchor){
    menu.innerHTML=items.map((item,i)=>item.separator?'<hr role="separator">':`<button role="menuitem" data-menu-index="${i}" ${item.danger?'class="menu-danger"':''}>${e(item.label)}${item.hint?`<kbd>${e(item.hint)}</kbd>`:''}</button>`).join('');menu.hidden=false;
    const box=anchor?.currentTarget?.getBoundingClientRect?.()||anchor?.target?.getBoundingClientRect?.(),x=anchor?.clientX??box?.left??innerWidth/2,y=anchor?.clientY??box?.bottom??100;
    menu.style.left=Math.max(8,Math.min(x,innerWidth-menu.offsetWidth-8))+'px';menu.style.top=Math.max(8,Math.min(y,innerHeight-menu.offsetHeight-8))+'px';
    menu.querySelectorAll('[data-menu-index]').forEach(b=>b.onclick=()=>{const item=items[Number(b.dataset.menuIndex)];hideMenu();Promise.resolve().then(item.run).catch(err=>toast(err.message))});menu.querySelector('button')?.focus();
  }
  function newMenu(target,event){showMenu([{label:'Markdown 文档',hint:'.md',run:()=>createDraft('',target)},{label:'文件夹',run:()=>newFolder(target)},{separator:true},{label:'导入 Markdown…',run:()=>{importTarget=target;$('#markdown-import').click()}}],event)}
  async function copyText(text,label){try{await navigator.clipboard.writeText(text);toast(label)}catch{showDialog('复制内容',`<textarea id="copy-fallback" rows="8" readonly>${e(text)}</textarea>`);$('#copy-fallback').select()}}
  function renameNode(kind,id){
    const item=kind==='post'?workingPost(state,published,id):state.folders.find(f=>f.id===id);if(!item)return;
    showDialog(kind==='post'?'重命名文档':'重命名文件夹',`<label for="rename-input">名称</label><input id="rename-input" value="${e(kind==='post'?item.title:item.name)}" maxlength="180">`,`<button id="confirm-rename" class="solid-button">保存名称</button>`);
    const submit=()=>{const name=$('#rename-input').value.trim();if(!name){toast('名称不能为空。');return}if(kind==='post'){item.title=name;saveDraft(state,published,item);if(id===currentID)$('#post-title').value=name}else{item.name=name;undoSnapshot=null}closeDialog();refreshWorkspace();toast('已重命名，发布后对读者生效。')};
    $('#confirm-rename').onclick=submit;$('#rename-input').onkeydown=ev=>{if(ev.key==='Enter')submit()};$('#rename-input').select();
  }
  function moveItem(kind,id,target,options={}){
    undoSnapshot=moveNode(state,published,kind,id,target.category,target.folder,options);expandLocation(target.category,target.folder);refreshWorkspace();toast('已移动并保存在本机。发布目录后对读者生效，可撤销。');
  }
  function moveDialog(kind,id){
    const blocked=kind==='folder'?subtreeIDs(state.folders,id):new Set(),item=kind==='post'?workingPost(state,published,id):state.folders.find(f=>f.id===id);
    const destinations=[];for(const c of state.categories){destinations.push({category:c.id,folder:null,label:c.name});for(const f of state.folders.filter(f=>f.category===c.id&&!blocked.has(f.id)))destinations.push({category:c.id,folder:f.id,label:c.name+' / '+folderLabel(f.id)})}
    showDialog('移动到…',`<p>移动「${e(kind==='post'?titleOf(item):item.name)}」。文章链接与评论保持不变。</p><label for="move-target">目标位置</label><select id="move-target">${destinations.map((d,i)=>`<option value="${i}" ${d.category===item.category&&d.folder===(kind==='post'?item.folder||null:item.parent||null)?'selected':''}>${e(d.label)}</option>`).join('')}</select>`,`<button id="confirm-move" class="solid-button">移动到这里</button>`);
    $('#confirm-move').onclick=()=>{try{moveItem(kind,id,destinations[Number($('#move-target').value)]);closeDialog()}catch(err){toast(err.message)}};
  }
  function deleteDialog(kind,id){
    const item=kind==='post'?workingPost(state,published,id):state.folders.find(f=>f.id===id);if(!item)return;
    const ids=kind==='folder'?subtreeIDs(state.folders,id):new Set(),count=kind==='post'?1:allItems().filter(p=>ids.has(p.folder)).length;
    showDialog('移入回收站？',`<p>「${e(kind==='post'?titleOf(item):item.name)}」${kind==='folder'?`及其 ${count} 篇文档、${ids.size-1} 个子文件夹`:''}将移入本机回收站，可随时恢复。公开页面在发布目录后才会移除；GitHub 评论保留。</p>`,`<button id="cancel-delete" class="quiet-button">取消</button><button id="confirm-delete" class="danger-button">移入回收站</button>`);
    $('#cancel-delete').onclick=closeDialog;$('#confirm-delete').onclick=()=>{const removed=deleteNode(state,published,kind,id,crypto.randomUUID(),today());undoSnapshot=null;removed.posts.forEach(p=>editorStates.delete(p.id));closeDialog();if(removed.posts.some(p=>p.id===currentID)||state.selected?.kind==='folder'&&ids.has(state.selected.id))openCollection('category',item.category);else refreshWorkspace();toast('已移入回收站，仍可恢复。')};
  }
  function nodeMenu(kind,id,event){
    if(kind==='category'){const target={category:id,folder:null};showMenu([{label:'新建 Markdown 文档',run:()=>createDraft('',target)},{label:'新建文件夹',run:()=>newFolder(target)},{separator:true},{label:'管理栏目 / 重命名',run:manageCategories}],event);return}
    if(kind==='folder'){const f=state.folders.find(f=>f.id===id);showMenu([{label:'打开文件夹',run:()=>openCollection('folder',id)},{label:'新建 Markdown 文档',run:()=>createDraft('',{category:f.category,folder:id})},{label:'新建子文件夹',run:()=>newFolder({category:f.category,folder:id})},{separator:true},{label:'重命名',run:()=>renameNode(kind,id)},{label:'移动到…',run:()=>moveDialog(kind,id)},{separator:true},{label:'移入回收站',danger:true,run:()=>deleteDialog(kind,id)}],event);return}
    const p=workingPost(state,published,id);if(!p)return;
    const isPublic=published.posts.some(x=>x.id===id);
    const items=[{label:'阅读文档',run:()=>openPost(id)},{label:'编辑文档',hint:'⌘ E',run:()=>openPost(id,'edit')},{separator:true},{label:'重命名',hint:'F2',run:()=>renameNode(kind,id)},{label:'复制文档',run:()=>{const copy=duplicatePost(state,published,id,newID(),today());undoSnapshot=null;openPost(copy.id,'edit');toast('副本已保存为新草稿，使用独立链接与评论。')}},{label:'移动到…',run:()=>moveDialog(kind,id)},{label:state.favorites.includes(id)?'取消收藏':'加入收藏',run:()=>{state.favorites=state.favorites.includes(id)?state.favorites.filter(x=>x!==id):[...state.favorites,id];refreshWorkspace()}},{separator:true},{label:'复制 Markdown',run:()=>copyText(p.body,'Markdown 已复制')},{label:'导出 .md',run:()=>download(`${p.id}.md`,p.body,'text/markdown')}];
    if(isPublic)items.push({label:'复制公开链接',run:()=>copyText(location.origin+postURL(p),'文章链接已复制')},{label:'打开公开版本 ↗',run:()=>window.open(postURL(p),'_blank','noopener')});
    if(isPublic&&state.drafts[id])items.push({label:'放弃本机修改…',run:()=>{showDialog('恢复公开版本？','<p>仅放弃此文档的本机正文与标题修改，目录位置保持不变。建议先导出 Markdown。</p>','<button id="discard-draft" class="danger-button">放弃本机修改</button>');$('#discard-draft').onclick=()=>{delete state.drafts[id];delete state.draftBases[id];editorStates.delete(id);closeDialog();openPost(id)}}});
    items.push({separator:true},{label:'移入回收站',danger:true,run:()=>deleteDialog(kind,id)});showMenu(items,event);
  }
  function handleNodeClick(event){
    const row=event.target.closest('[data-kind][data-id]'),action=event.target.closest('[data-action]')?.dataset.action;if(!row||!action)return;
    const {kind,id}=row.dataset;
    if(action==='open'){kind==='post'?openPost(id):openCollection(kind,id)}
    if(action==='toggle'){const key=`${kind}:${id}`;state.collapsed=state.collapsed.includes(key)?state.collapsed.filter(x=>x!==key):[...state.collapsed,key];renderTree();persist()}
    if(action==='menu')nodeMenu(kind,id,event);
    if(action==='new'){const f=state.folders.find(f=>f.id===id);newMenu({category:kind==='category'?id:f.category,folder:kind==='folder'?id:null},event)}
  }
  for(const container of [$('#editor-tree'),$('#collection-view')]){
    container.addEventListener('click',handleNodeClick);
    container.addEventListener('contextmenu',event=>{const row=event.target.closest('[data-kind][data-id]');if(row){event.preventDefault();nodeMenu(row.dataset.kind,row.dataset.id,event)}});
    container.addEventListener('dragstart',event=>event.preventDefault());
    container.addEventListener('pointerdown',event=>{
      const row=event.target.closest('[draggable="true"]');
      if(event.button!==0||event.pointerType==='touch'||!row||event.target.closest('[data-action="menu"],[data-action="new"],[data-action="toggle"]'))return;
      pointerDrag={row,kind:row.dataset.kind,id:row.dataset.id,x:event.clientX,y:event.clientY};
    });
  }
  let pointerDrag=null,suppressClick=false;
  function clearDropMarks(){document.querySelectorAll('.drop-inside,.drop-before,.drop-after').forEach(el=>el.classList.remove('drop-inside','drop-before','drop-after'))}
  function dropTarget(event){
    const row=document.elementFromPoint(event.clientX,event.clientY)?.closest('#editor-tree [data-kind][data-id],#collection-view [data-kind][data-id]');
    if(!row||!dragged||row.dataset.kind===dragged.kind&&row.dataset.id===dragged.id||row.dataset.kind==='post'&&dragged.kind==='folder')return null;
    const {kind,id}=row.dataset;let target,options={};
    if(kind==='category')target={category:id,folder:null};
    if(kind==='folder'){const f=state.folders.find(f=>f.id===id);if(f)target={category:f.category,folder:id}}
    if(kind==='post'){const p=workingPost(state,published,id);if(p){target={category:p.category,folder:p.folder||null};options={relativeTo:id,after:event.clientY>row.getBoundingClientRect().top+row.offsetHeight/2}}}
    return target?{row,kind,target,options}:null;
  }
  function finishDrag(){pointerDrag=null;dragged=null;clearDropMarks();editorRoot.classList.remove('is-dragging');document.querySelectorAll('.dragging').forEach(el=>el.classList.remove('dragging'))}
  document.addEventListener('pointermove',event=>{
    if(!pointerDrag)return;
    if(!dragged){if(Math.hypot(event.clientX-pointerDrag.x,event.clientY-pointerDrag.y)<6)return;dragged={kind:pointerDrag.kind,id:pointerDrag.id};pointerDrag.row.classList.add('dragging');editorRoot.classList.add('is-dragging');hideMenu()}
    event.preventDefault();clearDropMarks();const target=dropTarget(event);
    if(target)target.row.classList.add(target.kind==='post'?(target.options.after?'drop-after':'drop-before'):'drop-inside');
    const tree=$('#editor-tree'),box=tree.getBoundingClientRect();
    if(event.clientX>=box.left&&event.clientX<=box.right){if(event.clientY<box.top+28)tree.scrollTop-=12;else if(event.clientY>box.bottom-28)tree.scrollTop+=12}
  },{passive:false});
  document.addEventListener('pointerup',event=>{
    if(dragged){suppressClick=true;setTimeout(()=>suppressClick=false,80);const dest=dropTarget(event);try{if(dest)moveItem(dragged.kind,dragged.id,dest.target,dest.options)}catch(err){toast(err.message)}}finishDrag();
  });
  document.addEventListener('click',event=>{if(suppressClick){event.preventDefault();event.stopPropagation()}},true);
  document.addEventListener('pointercancel',finishDrag);window.addEventListener('blur',finishDrag);
  document.addEventListener('keydown',event=>{if(event.key==='Escape')finishDrag()});
  $('#collection-view').addEventListener('click',event=>{const restore=event.target.closest('[data-restore]');if(restore){try{const item=restoreTrash(state,published,restore.dataset.restore);undoSnapshot=null;refreshWorkspace();toast(`已恢复「${item.name}」。正文作为本机草稿保留。`)}catch(err){toast(err.message)}}if(event.target.closest('[data-collection-new]'))newMenu(selectedLocation(),event)});
  $('#desk-breadcrumb').onclick=event=>{const b=event.target.closest('[data-kind]');if(b)openCollection(b.dataset.kind,b.dataset.id)};
  $('#new-post').onclick=event=>newMenu(selectedLocation(),event);$('#document-menu').onclick=event=>nodeMenu('post',currentID,event);
  document.addEventListener('pointerdown',event=>{if(!menu.contains(event.target))hideMenu()});
  menu.addEventListener('keydown',event=>{const buttons=[...menu.querySelectorAll('button')],index=buttons.indexOf(document.activeElement);if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();buttons[(index+(event.key==='ArrowDown'?1:buttons.length-1))%buttons.length]?.focus()}if(event.key==='Escape')hideMenu()});
  $('#desk-search').addEventListener('input',renderTree);
  $('#collapse-tree').onclick=()=>{const keys=[...state.categories.map(c=>'category:'+c.id),...state.folders.map(f=>'folder:'+f.id)];state.collapsed=keys.every(k=>state.collapsed.includes(k))?[]:keys;renderTree();persist()};
  $('#show-trash').onclick=()=>openCollection('trash');$('#show-favorites').onclick=()=>openCollection('favorites');
  $('#undo-move').onclick=()=>{if(undoSnapshot){undoMove(state,undoSnapshot);undoSnapshot=null;refreshWorkspace();toast('已撤销上一次移动。')}};
  $('#toggle-tree').onclick=()=>editorRoot.classList.toggle(innerWidth<=720?'mobile-tree':'tree-hidden');
  document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>setMode(b.dataset.view));
  ['#post-title','#post-summary','#post-language','#post-tags','#post-date','#post-issue'].forEach(s=>$(s).addEventListener('input',changeDraft));
  $('#post-category').onchange=()=>moveItem('post',currentID,{category:$('#post-category').value,folder:null});
  $('#post-folder').onchange=()=>moveItem('post',currentID,{category:current().category,folder:$('#post-folder').value||null});
  $('#post-slug').onchange=()=>{
    const id=$('#post-slug').value.trim(),p=current();if(published.posts.some(x=>x.id===p.id)){fillFields();return}
    if(!validID(id)||allItems().some(x=>x.id===id&&x.id!==p.id)||state.trash.some(t=>t.posts.some(x=>x.id===id))){toast('网址 ID 需为不重复的小写字母、数字和连字符。');$('#post-slug').value=p.id;return}if(id===p.id)return;
    const old=p.id;p.id=id;delete state.drafts[old];delete state.draftBases[old];if(state.placements[old]){state.placements[id]=state.placements[old];delete state.placements[old]}state.favorites=state.favorites.map(x=>x===old?id:x);saveDraft(state,published,p);editorStates.set(id,view.state);editorStates.delete(old);currentID=null;undoSnapshot=null;openPost(id,'edit');
  };
  $('#more-settings').onclick=()=>$('#extra-settings').hidden=!$('#extra-settings').hidden;
  $('#mobile-pane').onclick=()=>$('.split-editor').classList.toggle('show-preview');
  $('#delete-post').onclick=()=>deleteDialog('post',currentID);
  let scrollLock=false;
  const sync=(from,to)=>{if(scrollLock||mode!=='edit'||!$('#sync-scroll').checked)return;scrollLock=true;const max=from.scrollHeight-from.clientHeight;to.scrollTop=max>0?from.scrollTop/max*(to.scrollHeight-to.clientHeight):0;requestAnimationFrame(()=>scrollLock=false)};
  view.scrollDOM.addEventListener('scroll',()=>sync(view.scrollDOM,preview));preview.addEventListener('scroll',()=>sync(preview,view.scrollDOM));
  const insertions={heading:['\n## ','\n'],bold:['**','**'],italic:['*','*'],link:['[','](https://example.com)'],code:['\n```python\n','\n```\n'],math:['\n$$\n','\n$$\n'],table:['\n| 列一 | 列二 |\n| --- | --- |\n| 内容 | 内容 |\n',''],diagram:['\n```mermaid\nflowchart LR\n  A[问题] --> B[观察]\n  B --> C[理解]\n```\n',''],footnote:['[^ref]\n\n[^ref]: 作者，年份。[标题](https://example.com)\n','']};
  function insertText(before,after=''){const selection=view.state.selection.main,selected=view.state.sliceDoc(selection.from,selection.to);view.dispatch({changes:{from:selection.from,to:selection.to,insert:before+selected+after},selection:{anchor:selection.from+before.length,head:selection.from+before.length+selected.length}});view.focus()}
  document.querySelectorAll('[data-insert]').forEach(b=>b.onclick=()=>insertText(...insertions[b.dataset.insert]));
  $('#upload-image').onclick=()=>$('#image-file').click();
  $('#image-file').onchange=async()=>{
    const file=$('#image-file').files[0];if(!file)return;
    if(!['image/png','image/jpeg','image/webp','image/gif'].includes(file.type)){toast('请使用 PNG、JPEG、WebP 或 GIF 图片。');return}if(file.size>5*1024*1024){toast('单张图片请控制在 5 MB 以内。');return}
    const ext={'image/png':'png','image/jpeg':'jpg','image/webp':'webp','image/gif':'gif'}[file.type],path=`blog/uploads/${crypto.randomUUID()}.${ext}`,postID=currentID;
    try{const base64=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.onerror=reject;reader.readAsDataURL(file)}),asset={path,type:file.type,base64};await storeAsset(asset);assets.push(asset);if(currentID===postID&&mode==='edit')insertText(`\n![${file.name.replace(/[\[\]\r\n]/g,'')}](/${path})\n`);else toast('图片已保存，可通过上传按钮再次插入。')}catch{toast('无法保存图片草稿，请检查浏览器存储空间。')}$('#image-file').value='';
  };
  $('#markdown-import').onchange=async()=>{const target=importTarget||selectedLocation(),files=[...$('#markdown-import').files];let imported=0;for(const file of files){if(file.size>3*1024*1024){toast(`${file.name} 超过 3 MB，请拆分后导入。`);continue}const body=await file.text(),title=body.match(/^#\s+(.+)$/m)?.[1]||file.name.replace(/\.(md|markdown)$/i,'');createDraft(body,target,title);imported++}$('#markdown-import').value='';if(imported)toast(`已导入 ${imported} 篇 Markdown，保存在本机草稿中。`)};
  $('#export-backup').onclick=()=>download(`xuwang-backup-${today()}.json`,JSON.stringify({format:'xuwang-workspace-v2',published,workspace:state,assets},null,2),'application/json');
  $('#help-toggle').onclick=()=>{
    showDialog('让写作顺手一点',`<p>点击栏目或文件夹查看其中的文档；旁边的 <strong>＋</strong> 可新建 Markdown、文件夹或导入文件。右键文档或点击 <strong>···</strong>，可复制、重命名、移动、收藏和导出。</p><p>拖动文档到其他栏目或文件夹即可移动，拖到文档上下边缘可以排序。目录变更先存本机，点击「发布目录」同步。回收站支持恢复，文章链接和评论不受移动影响。</p><p>文档默认显示编译结果。「编辑」打开 Markdown 与实时预览，「预览」展开完整页面。技术内容支持代码、公式、图片、表格、Mermaid、脚注和 Lesson 1 交互图。</p><p><kbd>⌘ / Ctrl S</kbd> 保存 · <kbd>⌘ / Ctrl Enter</kbd> 发布 · <kbd>⌘ / Ctrl E</kbd> 编辑 / 预览 · <kbd>F2</kbd> 重命名 · <kbd>/</kbd> 搜索 · <kbd>⌘ / Ctrl Z</kbd> 撤销输入。</p><p>本机草稿、收藏和回收站仅保存在当前浏览器，可用「导出全部内容」备份。</p>`,`<button class="solid-button" id="create-guide">打开 Markdown 示例</button>`);$('#create-guide').onclick=()=>{closeDialog();createDraft(guide,selectedLocation(),'Markdown 写作示例')};
  };
  document.addEventListener('keydown',event=>{
    if(dialog.open)return;const typing=event.target.closest('input,textarea,select,[contenteditable="true"]');
    if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='s'){event.preventDefault();persist();toast('草稿已保存到本机')}
    if((event.metaKey||event.ctrlKey)&&event.key==='Enter'&&currentID){event.preventDefault();requestPublish('post')}
    if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='e'&&currentID){event.preventDefault();setMode(mode==='edit'?'preview':'edit')}
    if(event.key==='F2'&&!typing&&state.selected&&['post','folder'].includes(state.selected.kind)){event.preventDefault();renameNode(state.selected.kind,state.selected.id)}
    if(event.key==='/'&&!typing){event.preventDefault();$('#desk-search').focus()}
    if(event.key==='Escape'){hideMenu();editorRoot.classList.remove('mobile-tree')}
  });
  async function syncRemote(){
    const remote=await client.readContent();state=createWorkspace(remote.data,state);published=remote.data;contentSha=remote.sha;
    if(currentID){if(current())openPost(currentID,mode);else openCollection('category',state.categories[0]?.id)}else refreshWorkspace();return remote;
  }

  function connectionLabel(){
    $('#connection-status').textContent=client?`已连接 Xu0615 · ${connection.remembered?'此设备已记住':'仅本次使用'}`:'未连接 · 可在本机写作';
    $('#connect-github').textContent=client?'GitHub / 设备连接 ↗':'连接 GitHub ↗';
  }
  async function handleAuthError(error){
    if(error.status===401||error.code==='WRONG_ACCOUNT'){
      client=null;contentSha=null;await connection.disconnect().catch(()=>{});connectionLabel();
    }
  }
  async function restoreConnection(){
    $('#connection-status').textContent='正在恢复设备连接…';
    try{
      const restored=await connection.restore();
      if(restored){client=restored.client;await syncRemote();}
      connectionLabel();
    }catch(error){
      await handleAuthError(error);connectionLabel();
      $('#connection-status').textContent=client?'已恢复连接 · 待同步':error.code==='NETWORK'||error.code==='RATE_LIMITED'?'连接已记住 · 稍后重试':'需要重新连接 · 草稿已保留';
      $('#publish-status').textContent=error.message;
    }
  }
  async function connectDialog(){
    if(restoreTask)await restoreTask;
    if(client){
      showDialog('GitHub 已连接',`<p>当前账户：Xu0615。内容保存在 <strong>${REPO}</strong>。</p><p>${connection.remembered?'这台设备已记住连接。下次打开写作台会自动恢复，直接点击发布即可。':'当前为“仅本次使用”。若希望下次自动连接，请先断开，再勾选“记住此设备”连接一次。'}</p><p>同步会读取远端最新内容，并保留本机草稿。断开连接会移除此设备保存的凭证。</p><p id="connect-error" class="connection-error" role="alert"></p>`,`<button class="quiet-button" id="disconnect">断开并忘记此设备</button><button class="solid-button" id="sync-remote">同步 GitHub</button>`);
      $('#disconnect').onclick=async()=>{
        client=null;contentSha=null;
        try{await connection.disconnect();closeDialog();toast('此设备已忘记 GitHub 连接。草稿仍然保留。')}
        catch{$('#connect-error').textContent='连接已断开，但浏览器未能清除保存的凭证。请清除此网站的浏览器数据，或在 GitHub 撤销凭证。'}
        connectionLabel();
      };
      $('#sync-remote').onclick=async()=>{try{await syncRemote();closeDialog();toast('已同步最新公开内容，本机草稿已保留。')}catch(err){await handleAuthError(err);$('#connect-error').textContent=err.message}};
      return;
    }
    showDialog('连接一次，安心写作',`<p>写作与预览无需登录。连接 GitHub 后，文章会保存到你的博客仓库。</p><ol><li>在 <a href="https://github.com/settings/personal-access-tokens/new?name=xuwang-writing-desk&target_name=Xu0615&contents=write&issues=write" target="_blank" rel="noopener">GitHub 创建 Fine-grained token ↗</a>。</li><li>Repository access 选择 <strong>Only select repositories → Xu0615.github.io</strong>。</li><li>Repository permissions 设置 <strong>Contents: Read and write</strong> 与 <strong>Issues: Read and write</strong>。前者用于发布，后者用于创建评论区。</li></ol><label for="github-token">GitHub token</label><input id="github-token" class="token-field" type="password" autocomplete="off" spellcheck="false" placeholder="粘贴新生成的 token"><label class="remember-device"><input id="remember-device" type="checkbox" checked><span>记住此设备，下次自动连接</span></label><p class="connection-note">仅在自己的可信设备上使用。凭证加密保存在此浏览器中，不会写入文章、导出文件或 GitHub 仓库。清除浏览器数据、凭证到期或被撤销后，需重新连接。请直接在这里输入，不要发送到聊天。</p><p id="connect-error" class="connection-error" role="alert"></p>`,`<button class="quiet-button" id="retry-saved">重试已保存的连接</button><button class="solid-button" id="confirm-connect">连接并验证发布权限</button>`);
    $('#retry-saved').onclick=async()=>{restoreTask=restoreConnection();await restoreTask;if(client){closeDialog();toast('已恢复此设备的连接。')}else $('#connect-error').textContent=$('#publish-status').textContent||'此设备尚未保存连接，请输入凭证连接一次。'};
    $('#confirm-connect').onclick=async()=>{
      const button=$('#confirm-connect'),errorBox=$('#connect-error'),token=$('#github-token').value.trim(),remember=$('#remember-device').checked;
      if(!token){$('#connect-error').textContent='请输入凭证。';return}
      button.disabled=true;button.textContent='正在验证…';
      $('#github-token').value='';errorBox.textContent='';
      try{
        const result=await connection.attach(token,{remember});client=result.client;connectionLabel();await syncRemote();
        closeDialog();$('#publish-status').textContent='发布权限已验证';
        toast(result.remembered?'连接已记住。以后在此浏览器打开写作台，可直接发布。':'GitHub 已连接，本次可直接发布。');
        if(result.storageWarning)showDialog('已连接，但未记住设备',`<p>${e(result.storageWarning)}</p><p>当前页面仍可发布。请检查浏览器存储设置，下次打开时需要重新连接。</p>`);
      }
      catch(err){await handleAuthError(err);connectionLabel();errorBox.textContent=err.message;button.disabled=false;button.textContent='重新验证连接'}
    };
  }
  $('#connect-github').onclick=connectDialog;


  function requestPublish(kind='post'){
    if(publishing)return;
    const changes=structureChanges(state,published),conflict=kind==='post'&&draftHasRemoteChanges(state,published,currentID);
    if(kind==='structure'||changes.deleted||conflict){
      const deleted=published.posts.filter(p=>state.deleted.includes(p.id));
      showDialog(kind==='post'?'发布文章与目录变更':'发布目录变更',`<p>${kind==='structure'?'仅同步栏目、文件夹、文章位置与移除操作。其他文档的草稿正文不会发布。':'发布当前文章，并同步待发布的目录变更。其他文档的草稿正文不会发布。'}</p>${changes.moved?`<p>${changes.moved} 篇文章的位置或顺序将更新。</p>`:''}${deleted.length?`<p>以下 ${deleted.length} 篇文章会从公开网站移除，仍可从本机回收站恢复：</p><ul>${deleted.map(p=>`<li>${e(p.title)}</li>`).join('')}</ul>`:''}${conflict?'<p class="connection-error">远端文章在你编辑期间有更新，继续发布会以当前本机草稿覆盖远端正文。建议先打开公开版本对照。</p>':''}`,`<button id="cancel-publish" class="quiet-button">继续整理</button><button id="confirm-publish" class="solid-button">确认发布 ↗</button>`);
      $('#cancel-publish').onclick=closeDialog;$('#confirm-publish').onclick=()=>{closeDialog();publish(kind)};
    }else publish(kind);
  }
  async function publish(kind='post'){
    if(publishing)return;
    if(restoreTask)await restoreTask;if(publishing)return;
    if(!client){connectDialog();return}
    if(!contentSha){try{await syncRemote()}catch(err){await handleAuthError(err);toast(err.message);return}}
    clearTimeout(saveTimer);persist();const postID=kind==='post'?currentID:null;
    let next;try{next=buildPublication(state,published,{postID,date:today(),revision:crypto.randomUUID()})}catch(err){toast(err.message);return}
    const setProgress=text=>{$('#publish-status').textContent=text;status.textContent=text};
    publishing=true;$('#publish-post').disabled=true;editorRoot.inert=true;
    try{
      const check=await client.readContent();if(check.sha!==contentSha)throw new Error('远端内容已更新。请通过左下角“GitHub / 设备连接 → 同步 GitHub”先同步，本机草稿会保留。');
      $('#publish-warning').textContent='';
      if(postID){
        const post=next.posts.find(p=>p.id===postID);
        if(!post.issue){
          setProgress('建立文章评论区…');const discussion=await client.prepareDiscussion(post);
          if(discussion.issue){post.issue=discussion.issue;const draft=workingPost(state,published,postID);draft.issue=post.issue;saveDraft(state,published,draft);$('#post-issue').value=post.issue;persist()}
          if(discussion.warning)$('#publish-warning').textContent='评论区尚未建立：'+discussion.warning;
        }
      }
      const usedAssets=assets.filter(a=>next.posts.some(p=>p.body.includes('/'+a.path))),previous=published;
      const result=await client.publish(next,published,contentSha,usedAssets,setProgress);
      contentSha=result.contentSha;acceptPublication(state,previous,next,postID);published=clone(next);undoSnapshot=null;
      try{await removeAssets(usedAssets.map(a=>a.path))}catch{toast('内容已提交；本机图片缓存将在下次清理。')}
      assets=assets.filter(a=>!usedAssets.some(u=>u.path===a.path));refreshWorkspace();renderReaderHeading();setProgress('已提交到 GitHub，正在等待网站更新…');
      toast('提交成功。网站更新需要几分钟，无需重复发布。');
      void waitForDeployment(next.revision,postID?postURL(next.posts.find(p=>p.id===postID)):'/blog/',result.commit);
    }catch(err){await handleAuthError(err);setProgress('未发布 · 草稿已保留');showDialog('内容尚未发布',`<p class="connection-error" role="alert">${e(err.message)}</p><p>你的文字、图片与目录修改仍保存在此设备，可以继续编辑或导出。</p>`,`<button class="solid-button" id="fix-connection">${client?'检查连接 / 同步':'连接 GitHub'}</button>`);$('#fix-connection').onclick=()=>{closeDialog();connectDialog()};}
    finally{publishing=false;$('#publish-post').disabled=false;editorRoot.inert=false}
  }
  async function waitForDeployment(revision,url,commit){
    latestDeployment=revision;
    for(let i=0;i<75;i++){
      await new Promise(r=>setTimeout(r,8000));if(latestDeployment!==revision)return;
      try{const response=await fetch(`/blog/content.json?v=${encodeURIComponent(revision)}`,{cache:'no-store'});if(response.ok&&(await response.json()).revision===revision){$('#publish-status').innerHTML=`网站已更新 · <a href="${url}" target="_blank" rel="noopener">查看网站 ↗</a>`;status.textContent='发布成功 · 网站已更新';toast('网站已更新，可以分享链接了。');return}}catch{}
    }
    $('#publish-status').innerHTML=`内容已提交，无需重复发布 · <a href="https://github.com/${REPO}/commit/${commit}" target="_blank" rel="noopener">查看提交 ↗</a> · <a href="https://github.com/${REPO}/actions" target="_blank" rel="noopener">查看部署 ↗</a>`;
  }
  $('#publish-post').onclick=()=>requestPublish();$('#publish-structure').onclick=()=>requestPublish('structure');
  function manageCategories(){
    let edited=clone(state.categories);
    const render=()=>{
      showDialog('整理栏目',`<p>栏目可以改名、排序与新增。删除前，请先移走其中的文档和文件夹。保存后点击「发布目录」同步到公开网站。</p><div id="category-list">${edited.map((c,i)=>`<div class="category-edit" data-index="${i}"><label>栏目名称<input data-field="name" value="${e(c.name)}"></label><label>中文名称<input data-field="zh" value="${e(c.zh||'')}"></label><div><button class="category-up" data-index="${i}" aria-label="上移栏目">↑</button> <button class="category-down" data-index="${i}" aria-label="下移栏目">↓</button></div><label class="description-label">栏目简介<input data-field="description" value="${e(c.description||'')}"></label><button class="category-delete" data-index="${i}">删除</button></div>`).join('')}</div><button id="add-category" class="text-link">＋ 新建栏目</button>`,`<button id="save-categories" class="solid-button">保存到本机</button>`);
      $('#category-list').addEventListener('input',ev=>{const row=ev.target.closest('[data-index]');if(row&&ev.target.dataset.field)edited[Number(row.dataset.index)][ev.target.dataset.field]=ev.target.value});
      dialog.querySelectorAll('.category-delete').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.index),cat=edited[i];if(edited.length===1){toast('至少保留一个栏目。');return}if(allItems().some(p=>p.category===cat.id)||state.folders.some(f=>f.category===cat.id)){toast('栏目中还有文档或文件夹，请先移动或删除。');return}edited.splice(i,1);render()});
      for(const [selector,offset] of [['.category-up',-1],['.category-down',1]])dialog.querySelectorAll(selector).forEach(b=>b.onclick=()=>{const i=Number(b.dataset.index),j=i+offset;if(j<0||j>=edited.length)return;[edited[i],edited[j]]=[edited[j],edited[i]];render()});
      $('#add-category').onclick=()=>{edited.push({id:'topic-'+crypto.randomUUID().slice(0,12),name:'新栏目',zh:'',description:'',en:''});render()};
      $('#save-categories').onclick=()=>{if(edited.some(c=>!c.name.trim())){toast('请给每个栏目填写名称。');return}state.categories=edited.map(c=>({...c,name:c.name.trim()}));undoSnapshot=null;closeDialog();if(state.selected?.kind==='category'&&!state.categories.some(c=>c.id===state.selected.id))openCollection('category',state.categories[0].id);else refreshWorkspace();toast('栏目已保存，发布目录后对读者生效。')};
    };render();
  }
  $('#manage-categories').onclick=manageCategories;
  const params=new URLSearchParams(location.search),requested=params.get('post'),selection=state.selected;
  if(requested&&workingPost(state,published,requested))openPost(requested,params.get('mode')==='edit'?'edit':'read');
  else if(selection?.kind==='post'&&workingPost(state,published,selection.id))openPost(selection.id);
  else if(selection?.kind==='folder'&&state.folders.some(f=>f.id===selection.id))openCollection('folder',selection.id);
  else if(selection?.kind==='category'&&state.categories.some(c=>c.id===selection.id))openCollection('category',selection.id);
  else openCollection('category',state.categories[0]?.id);
  restoreTask=restoreConnection();
  window.addEventListener('pagehide',()=>{persist();connection.releaseMemory();client=null;contentSha=null});
  window.addEventListener('pageshow',event=>{if(event.persisted)restoreTask=restoreConnection()});
  window.addEventListener('beforeunload',ev=>{if(publishing){ev.preventDefault();ev.returnValue='发布正在进行。'}});
}
