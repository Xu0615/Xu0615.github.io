import {clone,validID,validateContent,byOrder,folderPath} from './model.js';

const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export const locationOf=p=>({category:p.category,folder:p.folder||null,order:p.order??1e9});
export function mergeCollection(local,base,remote){
  const result=clone(remote),baseMap=new Map(base.map(x=>[x.id,x]));
  for(const old of base)if(!local.some(x=>x.id===old.id)){const i=result.findIndex(x=>x.id===old.id);if(i>=0)result.splice(i,1);}
  for(const item of local){
    if(same(item,baseMap.get(item.id)))continue;
    const i=result.findIndex(x=>x.id===item.id);if(i>=0)result[i]=clone(item);else result.push(clone(item));
  }
  const localOrder=local.filter(x=>baseMap.has(x.id)).map(x=>x.id),baseOrder=base.filter(x=>local.some(y=>y.id===x.id)).map(x=>x.id);
  if(!same(localOrder,baseOrder))result.sort((a,b)=>{const ai=local.findIndex(x=>x.id===a.id),bi=local.findIndex(x=>x.id===b.id);return (ai<0?1e9:ai)-(bi<0?1e9:bi)});
  return result;
}
export function createWorkspace(published,saved={}){
  const state={
    storageVersion:2,
    categories:mergeCollection(saved.categories||published.categories,saved.baseCategories||published.categories,published.categories),
    folders:mergeCollection(saved.folders||published.folders||[],saved.baseFolders||published.folders||[],published.folders||[]),
    drafts:clone(saved.drafts||{}),placements:clone(saved.placements||{}),deleted:[...(saved.deleted||[])],trash:clone(saved.trash||[]),
    collapsed:[...(saved.collapsed||[])],favorites:[...(saved.favorites||[])],
    selected:saved.selected||(saved.currentID?{kind:'post',id:saved.currentID}:null),
    draftBases:clone(saved.draftBases||{}),baseCategories:clone(published.categories),baseFolders:clone(published.folders||[])
  };
  // A deleted remote category must not make a local, unpublished draft disappear.
  const references=[...Object.values(state.drafts),...Object.values(state.placements)];
  for(const ref of references){
    if(!state.categories.some(c=>c.id===ref.category)){
      const old=(saved.categories||saved.baseCategories||[]).find(c=>c.id===ref.category);
      if(old)state.categories.push(clone(old));
      else if(state.categories[0])ref.category=state.categories[0].id;
    }
    for(const folder of folderPath(saved.folders||[],ref.folder))if(!state.folders.some(f=>f.id===folder.id))state.folders.push(clone(folder));
    if(ref.folder&&!state.folders.some(f=>f.id===ref.folder&&f.category===ref.category))ref.folder=null;
  }
  return state;
}
export function workingPosts(state,published){
  const byID=new Map(published.posts.map(p=>[p.id,p]));
  for(const p of Object.values(state.drafts))byID.set(p.id,p);
  return [...byID.values()].filter(p=>!state.deleted.includes(p.id)).map(p=>({...clone(p),...clone(state.placements[p.id]||{})}));
}
export function workingPost(state,published,id){return workingPosts(state,published).find(p=>p.id===id);}
export function saveDraft(state,published,post){
  const source=published.posts.find(p=>p.id===post.id);
  if(!Object.hasOwn(state.draftBases,post.id))state.draftBases[post.id]=source?clone(source):null;
  state.drafts[post.id]=clone(post);
}
export function draftHasRemoteChanges(state,published,id){
  return Boolean(state.drafts[id]&&state.draftBases[id]&&!same(state.draftBases[id],published.posts.find(p=>p.id===id)));
}
export function subtreeIDs(folders,id){
  const ids=new Set([id]);let changed=true;
  while(changed){changed=false;for(const f of folders)if(ids.has(f.parent)&&!ids.has(f.id)){ids.add(f.id);changed=true;}}
  return ids;
}
export function destination(state,category,folder=null){
  if(folder){const target=state.folders.find(f=>f.id===folder);if(!target)throw new Error('目标文件夹不存在。');category=target.category;}
  if(!state.categories.some(c=>c.id===category))throw new Error('目标栏目不存在。');
  return {category,folder:folder||null};
}
export function addFolder(state,{id,name,category,parent=null}){
  const target=destination(state,category,parent);
  if(!validID(id)||state.folders.some(f=>f.id===id)||!name.trim())throw new Error('请填写有效的文件夹名称。');
  if(folderPath(state.folders,parent).length>=20)throw new Error('文件夹层级不能超过 20 层。');
  const folder={id,name:name.trim(),category:target.category,parent:target.folder,order:Date.now()};state.folders.push(folder);return folder;
}
export function moveNode(state,published,kind,id,category,folder=null,{relativeTo=null,after=false}={}){
  const target=destination(state,category,folder),posts=workingPosts(state,published);
  const before={folders:clone(state.folders),locations:{}};
  if(kind==='post'){
    const post=posts.find(p=>p.id===id);if(!post)throw new Error('文章不存在。');
    const siblings=posts.filter(p=>p.id!==id&&p.category===target.category&&(p.folder||null)===target.folder).sort(byOrder);
    let at=relativeTo?siblings.findIndex(p=>p.id===relativeTo):siblings.length;
    if(at<0)at=siblings.length;else if(relativeTo&&after)at++;
    siblings.splice(at,0,post);
    for(const [index,p] of siblings.entries()){before.locations[p.id]=locationOf(p);state.placements[p.id]={...target,order:index};}
  }else if(kind==='folder'){
    const root=state.folders.find(f=>f.id===id);if(!root)throw new Error('文件夹不存在。');
    const ids=subtreeIDs(state.folders,id);
    if(ids.has(target.folder))throw new Error('不能把文件夹移动到自己或子文件夹中。');
    const relativeDepth=Math.max(...[...ids].map(fid=>folderPath(state.folders,fid).length-folderPath(state.folders,id).length));
    if(folderPath(state.folders,target.folder).length+relativeDepth+1>20)throw new Error('文件夹层级不能超过 20 层。');
    for(const f of state.folders)if(ids.has(f.id))f.category=target.category;
    root.parent=target.folder;root.order=Date.now();
    for(const p of posts)if(ids.has(p.folder)){before.locations[p.id]=locationOf(p);state.placements[p.id]={...locationOf(p),category:target.category};}
  }else throw new Error('该项目不能移动。');
  return before;
}
export function undoMove(state,snapshot){
  state.folders=clone(snapshot.folders);
  for(const [id,location] of Object.entries(snapshot.locations))state.placements[id]=clone(location);
}
export function duplicatePost(state,published,id,newID,date){
  const source=workingPost(state,published,id);if(!source)throw new Error('文章不存在。');
  if(!validID(newID)||workingPost(state,published,newID))throw new Error('文章 ID 重复。');
  const copy={...clone(source),id:newID,title:`${source.title||'未命名文档'} · 副本`,issue:null,date,updated:date,order:Date.now()};
  saveDraft(state,published,copy);return copy;
}
export function deleteNode(state,published,kind,id,key,deletedAt){
  const posts=workingPosts(state,published);
  const ids=kind==='folder'?subtreeIDs(state.folders,id):new Set();
  const removed=kind==='post'?posts.filter(p=>p.id===id):posts.filter(p=>ids.has(p.folder));
  const removedFolders=kind==='folder'?state.folders.filter(f=>ids.has(f.id)):[];
  if(!removed.length&&!removedFolders.length)throw new Error('项目不存在。');
  const item={key,kind,name:kind==='post'?removed[0].title:removedFolders.find(f=>f.id===id)?.name,deletedAt,posts:clone(removed),folders:clone(removedFolders),root:id};
  for(const post of removed){if(published.posts.some(p=>p.id===post.id)&&!state.deleted.includes(post.id))state.deleted.push(post.id);delete state.drafts[post.id];delete state.placements[post.id];delete state.draftBases[post.id];}
  state.folders=state.folders.filter(f=>!ids.has(f.id));state.trash.unshift(item);return item;
}
export function restoreTrash(state,published,key){
  const item=state.trash.find(t=>t.key===key);if(!item)throw new Error('回收站中不存在该项目。');
  const activeIDs=new Set(workingPosts(state,published).map(p=>p.id));
  if(item.posts.some(p=>activeIDs.has(p.id))||item.folders.some(f=>state.folders.some(x=>x.id===f.id)))throw new Error('原位置已有相同 ID 的项目，请先重命名其网址 ID 或移动冲突项目。');
  const fallback=state.categories[0]?.id;if(!fallback)throw new Error('请先新建一个栏目再恢复。');
  for(const original of item.folders){const f=clone(original);if(!state.categories.some(c=>c.id===f.category))f.category=fallback;state.folders.push(f);}
  for(const f of state.folders)if(f.parent&&!state.folders.some(x=>x.id===f.parent&&x.category===f.category))f.parent=null;
  for(const original of item.posts){
    const p=clone(original);if(!state.categories.some(c=>c.id===p.category))p.category=fallback;
    if(p.folder&&!state.folders.some(f=>f.id===p.folder&&f.category===p.category))p.folder=null;
    state.deleted=state.deleted.filter(id=>id!==p.id);saveDraft(state,published,p);state.placements[p.id]=locationOf(p);
  }
  state.trash=state.trash.filter(t=>t.key!==key);return item;
}
export function buildPublication(state,published,{postID=null,date,revision}={}){
  const next=clone(published);next.categories=clone(state.categories);next.folders=clone(state.folders);next.updated=date||published.updated;if(revision)next.revision=revision;
  next.posts=published.posts.filter(p=>!state.deleted.includes(p.id)).map(p=>({...clone(p),...clone(state.placements[p.id]||{})}));
  if(postID){
    const post=workingPost(state,published,postID);if(!post)throw new Error('文章已被移入回收站。');
    post.title=post.title.trim();post.updated=next.updated;
    const index=next.posts.findIndex(p=>p.id===postID);if(index>=0)next.posts[index]=post;else next.posts.unshift(post);
  }
  return validateContent(next);
}
export function acceptPublication(state,previous,next,postID=null){
  for(const draft of Object.values(state.drafts)){
    Object.assign(draft,state.placements[draft.id]||{});
    if(same(state.draftBases[draft.id],previous.posts.find(p=>p.id===draft.id)))state.draftBases[draft.id]=clone(next.posts.find(p=>p.id===draft.id)||null);
  }
  if(postID){delete state.drafts[postID];delete state.draftBases[postID];}
  state.placements={};state.deleted=[];state.baseCategories=clone(next.categories);state.baseFolders=clone(next.folders||[]);
}
export function structureChanges(state,published){
  const moved=published.posts.filter(p=>state.placements[p.id]&&!same(locationOf(p),state.placements[p.id])&&!state.deleted.includes(p.id));
  return {moved:moved.length,deleted:state.deleted.filter(id=>published.posts.some(p=>p.id===id)).length,folders:!same(state.folders,published.folders||[]),categories:!same(state.categories,published.categories),pending:Boolean(moved.length||state.deleted.some(id=>published.posts.some(p=>p.id===id))||!same(state.folders,published.folders||[])||!same(state.categories,published.categories))};
}
