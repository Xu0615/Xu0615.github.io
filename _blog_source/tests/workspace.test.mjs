import test from 'node:test';
import assert from 'node:assert/strict';
import {clone,validateContent,postURL,folderPath} from '../src/model.js';
import {createWorkspace,workingPosts,workingPost,saveDraft,draftHasRemoteChanges,addFolder,moveNode,undoMove,duplicatePost,deleteNode,restoreTrash,buildPublication,acceptPublication,structureChanges} from '../src/workspace.js';
import {sidebar,renderDocument} from '../src/templates.js';
import {buildEntries} from '../src/publishing.js';

const post=(id,category)=>({id,category,title:id,body:`## ${id}\n\nPublished body.`,summary:'A note',tags:[],lang:'zh-CN',date:'2026-11-06',updated:'2026-11-06',issue:3});
const fixture=()=>({version:1,updated:'2026-11-06',categories:[{id:'pretrain',name:'Pretrain',description:'Learning'},{id:'data',name:'Data Scaling',description:'Scaling'},{id:'interp',name:'Interpretability',description:'Understanding'}],posts:[post('one','pretrain'),post('two','interp'),post('three','interp')]});
const publish=(state,data,postID=null)=>buildPublication(state,data,{postID,date:'2026-11-07',revision:'test-revision'});

test('legacy browser drafts migrate without replacing the newest public content',()=>{
  const old=fixture(),remote=fixture();remote.posts[0].body='Updated remotely';remote.categories.push({id:'new',name:'New'});
  const draft={...old.posts[1],body:'Local draft from the previous writing desk'};
  const state=createWorkspace(remote,{drafts:{two:draft},categories:old.categories,baseCategories:old.categories,currentID:'two'});
  assert.equal(state.storageVersion,2);assert.equal(workingPost(state,remote,'two').body,draft.body);assert.equal(workingPost(state,remote,'one').body,'Updated remotely');assert.equal(state.categories.length,4);assert.deepEqual(state.selected,{kind:'post',id:'two'});
});
test('category reorder, rename, and remote additions survive refresh',()=>{
  const data=fixture(),state=createWorkspace(data);state.categories.reverse();state.categories[0].name='Interp notes';
  const remote=clone(data);remote.categories.push({id:'new',name:'New'});
  const restored=createWorkspace(remote,JSON.parse(JSON.stringify(state)));
  assert.deepEqual(restored.categories.map(c=>c.id),['interp','data','pretrain','new']);assert.equal(restored.categories[0].name,'Interp notes');
});
test('nested folder move updates every descendant, keeps URLs/comments, and can be undone',()=>{
  const data=fixture(),state=createWorkspace(data);
  addFolder(state,{id:'papers',name:'论文',category:'interp'});addFolder(state,{id:'sae',name:'SAE',category:'interp',parent:'papers'});
  moveNode(state,data,'post','two','interp','sae');
  const before=workingPost(state,data,'two'),undo=moveNode(state,data,'folder','papers','pretrain');
  assert.equal(workingPost(state,data,'two').category,'pretrain');assert.equal(state.folders.find(f=>f.id==='sae').category,'pretrain');assert.equal(workingPost(state,data,'two').issue,3);assert.equal(postURL(before),postURL(workingPost(state,data,'two')));
  saveDraft(state,data,{...workingPost(state,data,'two'),body:'New text after moving'});undoMove(state,undo);
  assert.equal(workingPost(state,data,'two').category,'interp');assert.equal(workingPost(state,data,'two').body,'New text after moving');assert.equal(state.folders.find(f=>f.id==='papers').category,'interp');assert.equal(folderPath(state.folders,'sae').length,2);
});
test('folder cycles, invalid destinations, and cross-category orphans are rejected',()=>{
  const data=fixture(),state=createWorkspace(data);addFolder(state,{id:'root',name:'root',category:'interp'});addFolder(state,{id:'child',name:'child',category:'interp',parent:'root'});
  const before=clone(state);assert.throws(()=>moveNode(state,data,'folder','root','interp','child'),/子文件夹/);assert.deepEqual(state,before);
  assert.throws(()=>moveNode(state,data,'post','two','missing'));assert.throws(()=>moveNode(state,data,'post','two','interp','missing'));
  const invalid=clone(data);invalid.folders=clone(state.folders);invalid.folders[0].parent='child';assert.throws(()=>validateContent(invalid),/循环/);
  invalid.folders=clone(state.folders);invalid.posts[0].folder='child';assert.throws(()=>validateContent(invalid),/文件夹/);
});
test('article reorder inserts before/after, and moving retains a local draft body',()=>{
  const data=fixture();data.posts[1].order=0;data.posts[2].order=1;const state=createWorkspace(data);saveDraft(state,data,{...data.posts[0],body:'Private unfinished text'});
  moveNode(state,data,'post','one','interp',null,{relativeTo:'two',after:true});
  assert.equal(workingPost(state,data,'one').body,'Private unfinished text');assert.equal(workingPost(state,data,'one').order,1);assert.equal(workingPost(state,data,'two').order,0);assert.equal(workingPost(state,data,'three').order,2);
});
test('duplicate is an independent draft with no shared comment issue',()=>{
  const data=fixture(),state=createWorkspace(data),copy=duplicatePost(state,data,'two','two-copy','2026-11-07');
  assert.equal(copy.issue,null);assert.equal(copy.body,data.posts[1].body);assert.equal(copy.date,'2026-11-07');assert.equal(workingPosts(state,data).length,4);assert.equal(data.posts.length,3);assert.equal(publish(state,data).posts.length,3);
});
test('directory publication never leaks unpublished draft content',()=>{
  const data=fixture(),state=createWorkspace(data);addFolder(state,{id:'papers',name:'论文',category:'pretrain'});
  saveDraft(state,data,{...data.posts[1],body:'PRIVATE BODY',title:'Private revised title'});saveDraft(state,data,post('new-draft','interp'));
  moveNode(state,data,'post','two','pretrain','papers');const next=publish(state,data);
  assert.equal(next.posts.find(p=>p.id==='two').body,data.posts[1].body);assert.equal(next.posts.find(p=>p.id==='two').title,'two');assert.equal(next.posts.find(p=>p.id==='two').folder,'papers');assert.ok(!next.posts.some(p=>p.id==='new-draft'));
  acceptPublication(state,data,next);assert.equal(workingPost(state,next,'two').body,'PRIVATE BODY');assert.equal(workingPost(state,next,'two').category,'pretrain');assert.equal(draftHasRemoteChanges(state,next,'two'),false);assert.equal(structureChanges(state,next).pending,false);
});
test('publishing one article preserves every other draft',()=>{
  const data=fixture(),state=createWorkspace(data);saveDraft(state,data,{...data.posts[0],body:'Ready to publish'});saveDraft(state,data,{...data.posts[1],body:'Keep private'});
  const next=publish(state,data,'one');assert.equal(next.posts[0].body,'Ready to publish');assert.equal(next.posts[1].body,data.posts[1].body);
  acceptPublication(state,data,next,'one');assert.equal(state.drafts.one,undefined);assert.equal(state.drafts.two.body,'Keep private');assert.equal(draftHasRemoteChanges(state,next,'two'),false);
});
test('deleting a folder stashes drafts and descendants; restore survives a directory publish',()=>{
  const data=fixture(),state=createWorkspace(data);addFolder(state,{id:'papers',name:'论文',category:'interp'});addFolder(state,{id:'sae',name:'SAE',category:'interp',parent:'papers'});moveNode(state,data,'post','two','interp','sae');saveDraft(state,data,{...workingPost(state,data,'two'),body:'Unsaved publicly'});
  deleteNode(state,data,'folder','papers','trash-key','2026-11-07');assert.equal(workingPost(state,data,'two'),undefined);assert.equal(state.trash[0].posts[0].body,'Unsaved publicly');
  const next=publish(state,data);acceptPublication(state,data,next);assert.equal(next.posts.length,2);assert.equal(next.folders.length,0);
  restoreTrash(state,next,'trash-key');assert.equal(workingPost(state,next,'two').body,'Unsaved publicly');assert.equal(state.folders.length,2);assert.equal(state.trash.length,0);assert.ok(!publish(state,next).posts.some(p=>p.id==='two'));assert.equal(publish(state,next,'two').posts.find(p=>p.id==='two').folder,'sae');
});
test('restore before publishing cancels deletion and restores original article location',()=>{
  const data=fixture(),state=createWorkspace(data);deleteNode(state,data,'post','one','trash-key','2026-11-07');restoreTrash(state,data,'trash-key');
  assert.equal(state.deleted.length,0);assert.equal(publish(state,data).posts.length,3);assert.equal(workingPost(state,data,'one').category,'pretrain');
});
test('remote body changes are identified without replacing the local draft',()=>{
  const data=fixture(),state=createWorkspace(data);saveDraft(state,data,{...data.posts[0],body:'Local'});const remote=clone(data);remote.posts[0].body='Changed by another writer';
  const merged=createWorkspace(remote,state);assert.equal(workingPost(merged,remote,'one').body,'Local');assert.equal(draftHasRemoteChanges(merged,remote,'one'),true);
});
test('published folder tree opens active ancestors and safely escapes names',()=>{
  const data=fixture(),state=createWorkspace(data);addFolder(state,{id:'papers',name:'<papers>',category:'interp'});addFolder(state,{id:'sae',name:'SAE',category:'interp',parent:'papers'});moveNode(state,data,'post','two','interp','sae');
  const next=publish(state,data),html=sidebar(next,'two');assert.match(html,/&lt;papers&gt;/);assert.equal((html.match(/class="public-folder" open/g)||[]).length,2);assert.match(html,/aria-current="page"/);
  const entries=buildEntries(next,data);assert.match(entries.find(x=>x.path==='blog/notes/two/index.html').content,/public-folder/);assert.match(renderDocument(next,'editor'),/data-view="edit"/);
});
