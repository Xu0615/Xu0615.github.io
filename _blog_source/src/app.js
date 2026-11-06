import './style.css';
import './sae-lesson.css';
import { mountSAELessons } from './sae-lesson.js';
import { escapeHTML as e, renderMarkdown, plainText } from './markdown.js';
import { searchPosts, postURL, REPO } from './model.js';

const data = JSON.parse(document.querySelector('#site-data').textContent);
const shouldStart=!document.documentElement.hasAttribute('data-xuwang-started');
if(shouldStart)document.documentElement.setAttribute('data-xuwang-started','true');
let language = 'zh';
try { language = localStorage.getItem('xuwang-language') || 'zh'; } catch {}
export function applyLanguage() {
  document.documentElement.lang = language === 'en' ? 'en' : 'zh-CN';
  document.querySelectorAll('[data-zh][data-en]').forEach(el=>el.textContent=el.dataset[language]);
  const btn = document.querySelector('.language-toggle');
  if (btn) btn.textContent=language==='zh'?'EN':'中';
}
if(shouldStart){
applyLanguage();
document.querySelector('.language-toggle')?.addEventListener('click',()=>{ language=language==='zh'?'en':'zh'; try{localStorage.setItem('xuwang-language',language)}catch{} applyLanguage(); });
document.querySelector('.theme-toggle')?.addEventListener('click',()=>{
  const theme=document.documentElement.dataset.theme==='dark'?'light':'dark';
  document.documentElement.dataset.theme=theme;
  try{localStorage.setItem('xuwang-theme',theme)}catch{}
  document.dispatchEvent(new Event('theme-change'));
});
}

export async function enhanceMarkdown(root=document) {
  mountSAELessons(root);
  root.querySelectorAll('.copy-code').forEach(button=>{
    button.onclick=async()=>{
      try{await navigator.clipboard.writeText(button.parentElement.querySelector('code').textContent);button.textContent='Copied ✓';setTimeout(()=>button.textContent='Copy',1800)}
      catch{button.textContent='请选择代码复制';}
    };
  });
  const diagrams=[...root.querySelectorAll('.mermaid:not([data-rendered])')];
  if(!diagrams.length)return;
  const { default: mermaid }=await import('mermaid');
  mermaid.initialize({startOnLoad:false,securityLevel:'strict',theme:'base',fontFamily:'system-ui, sans-serif',themeVariables:{primaryColor:'#e5ebdf',primaryTextColor:'#303c32',primaryBorderColor:'#80917b',lineColor:'#80917b',secondaryColor:'#f7f5ed',tertiaryColor:'#f2e6d9'},suppressErrorRendering:true});
  for (const el of diagrams) {
    if(!el.isConnected)continue;
    const source=el.textContent;
    el.dataset.rendered='true';
    try {
      const id='diagram-'+crypto.randomUUID().replaceAll('-','');
      const result=await mermaid.render(id,source);
      if(el.isConnected){el.innerHTML=result.svg;el.setAttribute('aria-label','Mermaid diagram');}
    }catch(error){if(el.isConnected){el.textContent=source;const msg=document.createElement('p');msg.className='diagram-error';msg.textContent='流程图语法尚未完整，请检查 Mermaid 内容。';el.parentElement.prepend(msg);}}
  }
}

const searchDialog=document.querySelector('#search-dialog');
if(searchDialog&&shouldStart){
  const input=document.querySelector('#search-input'),results=document.querySelector('#search-results');
  const renderResults=()=>{
    const found=searchPosts(data,input.value);
    results.innerHTML=found.length?found.map(p=>`<a class="search-result" href="${postURL(p)}"><small>${e(data.categories.find(c=>c.id===p.category)?.name)}</small><h3>${e(p.title)}</h3><p>${e(p.summary||plainText(p.body).slice(0,120))}</p></a>`).join(''):`<p class="muted">没有找到相关笔记。试试另一组词。<br>No matching notes. Try another phrase.</p>`;
  };
  const open=()=>{renderResults();searchDialog.showModal();input.focus()};
  document.querySelectorAll('.search-toggle').forEach(btn=>btn.addEventListener('click',open));
  searchDialog.querySelector('.dialog-close').onclick=()=>searchDialog.close();
  searchDialog.onclick=ev=>{if(ev.target===searchDialog&&ev.clientY<searchDialog.getBoundingClientRect().top)searchDialog.close()};
  input.addEventListener('input',renderResults);
  document.addEventListener('keydown',ev=>{if((ev.metaKey||ev.ctrlKey)&&ev.key.toLowerCase()==='k'){ev.preventDefault();open()}});
}

if(shouldStart&&document.body.dataset.page==='home'){
  const params=new URLSearchParams(location.search);
  let tag=params.get('tag');
  function filter(topic='all'){
    let count=0;
    document.querySelectorAll('.post-card').forEach(el=>{
      el.hidden=(topic!=='all'&&el.dataset.category!==topic)||(tag&&!el.dataset.tags.split('|').includes(tag));
      if(!el.hidden)count++;
    });
    document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===topic)));
    document.querySelector('#empty-notes').hidden=count>0;
    document.querySelector('#filter-caption').textContent=tag?'# '+tag:'';
  }
  filter(data.categories.some(c=>c.id===params.get('topic'))?params.get('topic'):'all');
  document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
    tag=null;filter(button.dataset.filter);
    history.replaceState(null,'',button.dataset.filter==='all'?'/blog/#notes':`/blog/?topic=${encodeURIComponent(button.dataset.filter)}#notes`);
  }));
  initField();
}

if(shouldStart&&document.body.dataset.page==='article'){
  enhanceMarkdown();
  const post=data.posts.find(p=>p.id===document.body.dataset.post);
  let commentsLoading=false;
  const loadComments=async()=>{
    if(commentsLoading)return;commentsLoading=true;
    const root=document.querySelector('#comments-list');
    try{
      let issue=post.issue;
      if(!issue){
        const response=await fetch(`https://api.github.com/search/issues?q=${encodeURIComponent(`repo:${REPO} is:issue in:title "[blog] ${post.id}"`)}`);
        if(!response.ok)throw new Error();
        issue=(await response.json()).items?.[0]?.number;
      }
      if(!issue){root.innerHTML='<p class="muted">还没有讨论。欢迎留下第一个问题。<br>No discussion yet. Bring the first question.</p>';return;}
      const commentLink=document.querySelector('#comment-link');
      commentLink.href=`https://github.com/${REPO}/issues/${issue}#new_comment_field`;
      const response=await fetch(`https://api.github.com/repos/${REPO}/issues/${issue}/comments?per_page=100`);
      if(!response.ok)throw new Error();
      const comments=await response.json();
      root.innerHTML=comments.length?comments.map(c=>`<div class="comment"><div class="comment-header"><a href="https://github.com/${e(c.user.login)}" target="_blank" rel="noopener">${e(c.user.login)}</a><time>${e(c.created_at.slice(0,10))}</time><a href="https://github.com/${REPO}/issues/${issue}#issuecomment-${Number(c.id)}" target="_blank" rel="noopener">↗</a></div><div class="prose">${renderMarkdown(c.body).html}</div></div>`).join('')+(comments.length===100?`<p><a href="${commentLink.href}">在 GitHub 查看完整讨论 ↗</a></p>`:''):'<p class="muted">页边还留着空白。欢迎留下第一个问题。<br>The margins are open. Start a conversation.</p>';
      enhanceMarkdown(root);
    }catch{root.innerHTML='<p class="muted">暂时无法读取评论。你仍可以通过下方链接参与 GitHub 讨论。</p>';}
    finally{commentsLoading=false;}
  };
  const observer=new IntersectionObserver(entries=>{if(entries.some(x=>x.isIntersecting)){loadComments();observer.disconnect();}},{rootMargin:'300px'});
  observer.observe(document.querySelector('#comments'));
  document.querySelector('#refresh-comments').onclick=loadComments;
  const headings=[...document.querySelectorAll('.prose h2,.prose h3')];
  const headingObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){document.querySelectorAll('.article-toc a').forEach(a=>a.classList.toggle('active',decodeURIComponent(a.hash.slice(1))===entry.target.id));}}),{rootMargin:'0px 0px -65% 0px'});
  headings.forEach(h=>headingObserver.observe(h));
}
if(shouldStart&&document.body.dataset.page==='editor') import('./editor.js').then(m=>m.startEditor(data,enhanceMarkdown)).catch(error=>{document.querySelector('#save-status').textContent='写作台加载失败，请刷新页面。';console.error(error)});

function initField(){
  const canvas=document.querySelector('#field-canvas');if(!canvas)return;
  const ctx=canvas.getContext('2d');if(!ctx)return;
  document.querySelector('.art-fallback').hidden=true;
  let width=550,height=345,frame=0,raf=null,paused=matchMedia('(prefers-reduced-motion: reduce)').matches,visible=true,last=0;
  let pointer={x:.55,y:.5},target={x:.55,y:.5};
  const resize=()=>{const rect=canvas.getBoundingClientRect();width=rect.width;height=rect.height;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=width*dpr;canvas.height=height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);draw()};
  const draw=()=>{
    ctx.clearRect(0,0,width,height);
    pointer.x+=(target.x-pointer.x)*.045;pointer.y+=(target.y-pointer.y)*.045;
    const dark=document.documentElement.dataset.theme==='dark';
    const t=frame*.006;
    ctx.save();ctx.translate(width*.50,height*.51);ctx.rotate(-.18);
    for(let i=0;i<56;i++){
      const s=i/55;
      ctx.beginPath();
      for(let j=0;j<=130;j++){
        const a=j/130*Math.PI*2;
        const ripple=1+.14*Math.sin(a*3+t*.7+s*2)+.08*Math.cos(a*5-t*.45);
        const r=29+s*Math.min(width*.36,190);
        const x=Math.cos(a)*r*ripple+(pointer.x-.5)*s*22;
        const y=Math.sin(a)*r*.61*ripple+Math.sin(a*2+t)*10*s+(pointer.y-.5)*s*18;
        j?ctx.lineTo(x,y):ctx.moveTo(x,y);
      }
      ctx.closePath();ctx.strokeStyle=i%8===0?(dark?'#b1bc87':'#8b9775'):(dark?'#8b9e80':'#758b71');ctx.globalAlpha=.17+.39*Math.sin(s*Math.PI);ctx.lineWidth=i%8===0?.85:.6;ctx.stroke();
    }
    ctx.globalAlpha=.8;ctx.fillStyle=dark?'#dba181':'#ae694a';
    const a=t*.15-1.3, r=115;
    ctx.beginPath();ctx.arc(Math.cos(a)*r,Math.sin(a)*r*.61,3.3,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=.25;ctx.beginPath();ctx.arc(Math.cos(a)*r,Math.sin(a)*r*.61,8,0,Math.PI*2);ctx.strokeStyle=ctx.fillStyle;ctx.stroke();ctx.restore();ctx.globalAlpha=1;
  };
  const loop=time=>{raf=null;if(!paused&&visible&&!document.hidden){if(time-last>40){frame++;draw();last=time}raf=requestAnimationFrame(loop)}};
  const start=()=>{if(!raf&&!paused&&visible&&!document.hidden)raf=requestAnimationFrame(loop)};
  canvas.addEventListener('pointermove',ev=>{const rect=canvas.getBoundingClientRect();target={x:(ev.clientX-rect.left)/width,y:(ev.clientY-rect.top)/height};if(paused)draw()});
  canvas.addEventListener('pointerleave',()=>target={x:.55,y:.5});
  const toggle=document.querySelector('#motion-toggle');
  const updateButton=()=>{toggle.textContent=paused?'▷':'Ⅱ';toggle.setAttribute('aria-label',paused?'播放动画':'暂停动画');toggle.setAttribute('aria-pressed',String(paused))};
  toggle.onclick=()=>{paused=!paused;updateButton();start()};
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;start()}).observe(canvas);
  document.addEventListener('visibilitychange',start);document.addEventListener('theme-change',draw);
  updateButton();resize();start();
}
