import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { DeviceAuthVault, DeviceConnection } from '../src/device-auth.js';
import { GitHubClient, GitHubError, githubError } from '../src/publishing.js';

const testToken='synthetic-test-credential-not-a-real-token';
class MemoryStore {
  record=null;
  async get(){return structuredClone(this.record)}
  async set(record){this.record=structuredClone(record)}
  async clear(){this.record=null}
}
const vaultFor=(store,origin='https://xu0615.github.io')=>new DeviceAuthVault({store,crypto:webcrypto,origin});
const clientFactory=(calls,error=null)=>token=>({
  async connect(options){calls.push({token,...options});if(error)throw error;return {login:'Xu0615'}},
  clear(){calls.push({cleared:true})}
});

test('Remembered connection survives a fresh session without persisting plaintext',async()=>{
  const store=new MemoryStore(),calls=[];
  const first=new DeviceConnection(vaultFor(store),clientFactory(calls));
  await first.attach(testToken,{remember:true});
  assert.equal(store.record.key.extractable,false);
  assert.doesNotMatch(JSON.stringify(store.record),new RegExp(testToken));
  assert.notEqual(new TextDecoder().decode(store.record.ciphertext),testToken);
  await assert.rejects(webcrypto.subtle.exportKey('raw',store.record.key));
  first.releaseMemory();
  const second=new DeviceConnection(vaultFor(store),clientFactory(calls));
  const restored=await second.restore();
  assert.equal(restored.user.login,'Xu0615');assert.equal(restored.remembered,true);
  assert.deepEqual(calls.filter(c=>!c.cleared),[{token:testToken,probeWrite:true},{token:testToken,probeWrite:false}]);
  await second.disconnect();
  assert.equal(await new DeviceConnection(vaultFor(store),clientFactory(calls)).restore(),null);
});

test('Session-only connection removes any previously remembered credential',async()=>{
  const store=new MemoryStore();await vaultFor(store).save('previous-synthetic-token');
  const connection=new DeviceConnection(vaultFor(store),clientFactory([]));
  const result=await connection.attach(testToken,{remember:false});
  assert.equal(result.remembered,false);assert.equal(store.record,null);assert.ok(result.client);
});

test('Saved credentials cannot be restored under a different origin',async()=>{
  const store=new MemoryStore();await vaultFor(store).save(testToken);
  await assert.rejects(vaultFor(store,'https://different.example').load(),/无法恢复/);
  assert.equal(store.record,null);
});

test('Storage failure keeps a working session and explicitly reports persistence failure',async()=>{
  const store=new MemoryStore();store.set=async()=>{throw new Error('Storage denied')};
  const result=await new DeviceConnection(vaultFor(store),clientFactory([])).attach(testToken);
  assert.ok(result.client);assert.equal(result.remembered,false);assert.equal(result.storageWarning,'Storage denied');
});

test('Temporary failures keep saved connection; revoked and wrong-account credentials are removed',async()=>{
  for(const [error,keep] of [
    [new GitHubError('offline',{code:'NETWORK'}),true],
    [new GitHubError('rate limit',{code:'RATE_LIMITED',status:403}),true],
    [new GitHubError('permission',{code:'CONTENTS_PERMISSION',status:403}),true],
    [new GitHubError('expired',{code:'AUTH_EXPIRED',status:401}),false],
    [new GitHubError('wrong account',{code:'WRONG_ACCOUNT'}),false]
  ]){
    const store=new MemoryStore();await vaultFor(store).save(testToken);
    await assert.rejects(new DeviceConnection(vaultFor(store),clientFactory([],error)).restore());
    assert.equal(Boolean(store.record),keep,error.code);
  }
});

test('Account push flag is insufficient: token write probe rejects empty-scoped token',async()=>{
  const original=globalThis.fetch,calls=[];
  globalThis.fetch=async(url,options)=>{
    calls.push({url,options});
    if(url.endsWith('/user'))return Response.json({login:'Xu0615'});
    if(url.endsWith('/git/blobs'))return Response.json({message:'Resource not accessible by personal access token'},{status:403});
    return Response.json({permissions:{push:true}});
  };
  try{
    const store=new MemoryStore();
    await assert.rejects(new DeviceConnection(vaultFor(store),token=>new GitHubClient(token)).attach(testToken),error=>error.code==='CONTENTS_PERMISSION'&&error.message.includes('Xu0615.github.io'));
    assert.equal(store.record,null);assert.equal(calls.filter(c=>c.options.method==='POST').length,1);
    assert.ok(calls.every(c=>!c.url.includes('/refs/')));
  }finally{globalThis.fetch=original}
});

test('Rate-limit, contents, issues, and expired-token errors have distinct actionable diagnoses',async()=>{
  const cases=[
    [403,{message:'Resource not accessible by personal access token'},{},'/repos/Xu0615/Xu0615.github.io/git/trees','CONTENTS_PERMISSION'],
    [403,{message:'Resource not accessible by personal access token'},{},'/repos/Xu0615/Xu0615.github.io/issues','ISSUES_PERMISSION'],
    [403,{message:'API rate limit exceeded'},{'x-ratelimit-remaining':'0','retry-after':'120'},'/repos/Xu0615/Xu0615.github.io/git/trees','RATE_LIMITED'],
    [401,{message:'Bad credentials'},{},'/user','AUTH_EXPIRED'],
    [404,{message:'Not Found'},{},'/repos/Xu0615/Xu0615.github.io','REPOSITORY_PERMISSION']
  ];
  for(const [status,body,headers,path,code] of cases){
    const error=await githubError(Response.json(body,{status,headers}),path);assert.equal(error.code,code);
    if(code==='RATE_LIMITED')assert.ok(error.retryAt>Date.now()+100000);
  }
});

test('Missing comment permission does not prevent publishing an article',async()=>{
  const client=new GitHubClient(testToken);
  client.createDiscussion=async()=>{throw new GitHubError('需要 Issues 写入权限',{code:'ISSUES_PERMISSION'})};
  assert.deepEqual(await client.prepareDiscussion({id:'new-note'}),{issue:null,warning:'需要 Issues 写入权限'});
  assert.deepEqual(await client.prepareDiscussion({id:'existing-note',issue:3}),{issue:3,warning:null});
  client.createDiscussion=async()=>{throw new GitHubError('Expired',{status:401,code:'AUTH_EXPIRED'})};
  await assert.rejects(client.prepareDiscussion({id:'new-note'}),error=>error.status===401);
});
