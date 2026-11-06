import { REPO } from './model.js';

// This store is deliberately separate from article drafts, exports and Git data.
// Same-origin script can still use the key: encryption is not an XSS boundary.
export class IndexedDBAuthStore {
  constructor(indexedDB=globalThis.indexedDB){this.indexedDB=indexedDB;}
  async open(){
    if(!this.indexedDB)throw new Error('此浏览器不支持保存连接。');
    return new Promise((resolve,reject)=>{
      const request=this.indexedDB.open('xuwang-device-auth',1);
      request.onupgradeneeded=()=>request.result.createObjectStore('connection');
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(new Error('无法打开设备连接存储。'));
      request.onblocked=()=>reject(new Error('设备连接存储被其他页面占用，请关闭旧写作台后重试。'));
    });
  }
  async transact(mode,operation){
    const db=await this.open();
    return new Promise((resolve,reject)=>{
      const transaction=db.transaction('connection',mode);
      const request=operation(transaction.objectStore('connection'));
      transaction.oncomplete=()=>{db.close();resolve(request.result)};
      transaction.onerror=transaction.onabort=()=>{db.close();reject(new Error('无法保存设备连接，请检查浏览器存储设置。'))};
    });
  }
  get(){return this.transact('readonly',store=>store.get('github'));}
  set(record){return this.transact('readwrite',store=>store.put(record,'github'));}
  clear(){return this.transact('readwrite',store=>store.delete('github'));}
}

export class DeviceAuthVault {
  constructor({store=new IndexedDBAuthStore(),crypto=globalThis.crypto,origin=globalThis.location?.origin}={}){
    this.store=store;this.crypto=crypto;this.origin=origin;
  }
  aad(){return new TextEncoder().encode(`xuwang-device-auth:v1:${this.origin}:${REPO}`);}
  async save(token){
    if(!this.crypto?.subtle||!this.origin)throw new Error('此浏览器无法记住连接；请使用 HTTPS 下的现代浏览器。');
    const key=await this.crypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']);
    const iv=this.crypto.getRandomValues(new Uint8Array(12));
    const ciphertext=await this.crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:this.aad()},key,new TextEncoder().encode(token));
    await this.store.set({version:1,repository:REPO,key,iv,ciphertext,savedAt:Date.now()});
  }
  async load(){
    const record=await this.store.get();
    if(!record)return null;
    try{
      if(record.version!==1||record.repository!==REPO)throw new Error('Unsupported record');
      const plaintext=await this.crypto.subtle.decrypt({name:'AES-GCM',iv:record.iv,additionalData:this.aad()},record.key,record.ciphertext);
      return new TextDecoder().decode(plaintext);
    }catch{
      await this.clear();
      throw new Error('已保存的连接无法恢复，请重新连接一次。文章草稿未受影响。');
    }
  }
  clear(){return this.store.clear();}
}

export class DeviceConnection {
  constructor(vault,createClient){this.vault=vault;this.createClient=createClient;this.client=null;this.remembered=false;}
  async attach(token,{remember=true,probeWrite=true}={}){
    const candidate=this.createClient(token);
    let user;
    try{user=await candidate.connect({probeWrite})}catch(error){candidate.clear();throw error}
    let storageWarning=null;
    try{if(remember)await this.vault.save(token);else await this.vault.clear();this.remembered=remember;}
    catch(error){this.remembered=false;storageWarning=error.message;await this.vault.clear().catch(()=>{});}
    this.client?.clear();this.client=candidate;
    return {client:candidate,user,remembered:this.remembered,storageWarning};
  }
  async restore(){
    const token=await this.vault.load();
    if(!token){this.remembered=false;return null;}
    const candidate=this.createClient(token);
    try{const user=await candidate.connect({probeWrite:false});this.client?.clear();this.client=candidate;this.remembered=true;return {client:candidate,user,remembered:true}}
    catch(error){candidate.clear();if(error.status===401||error.code==='WRONG_ACCOUNT')await this.vault.clear();throw error}
  }
  async disconnect(){
    this.client?.clear();this.client=null;this.remembered=false;
    await this.vault.clear();
  }
  releaseMemory(){this.client?.clear();this.client=null;}
}
