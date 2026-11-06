const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export const MODEL_SPECS = Object.freeze({
  qwen: {name:'Qwen3.5-9B', d:4096, v:1152, vision:'model.visual.blocks.26', bridge:'model.visual.merger', hook:'model.language_model.layers.23', layers:32, vocab:248320, visionShape:'[1024, 1152]', bridgeShape:'[256, 4096]', patch:'512 × 512 → 32 × 32 patches', blocks:'27 个视觉 blocks', merge:'2 × 2 合并 · 4 × 1152 → 4096', backbone:'3 × Gated DeltaNet + 1 × full attention，重复 8 组', note:'第 24 个完整 block（索引 23）之后；已加回 residual。', widthNote:'无 DeepStack；每个视觉 token 占据一个 4096 维序列位置。'},
  gemma: {name:'Gemma 4 E4B', d:2560, v:768, vision:'model.vision_tower.encoder.layers.15', bridge:'model.embed_vision', hook:'model.language_model.layers.29', layers:42, vocab:262144, visionShape:'[1, 2520, 768]', bridgeShape:'[256, 2560]', patch:'正方形 resize 768 × 768 → 48 × 48 patches', blocks:'16 个视觉 layers · 2304 真 patch + 216 padding', merge:'3 × 3 pooling：280 槽 − 24 padding → 256；768 → 2560', backbone:'5 × sliding + 1 × full attention，重复 7 组', note:'第 30 个完整 block（索引 29）之后；包含 PLE 分支与 layer scalar。', widthNote:'PLE 每层额外输入为 256 维；残差始终是 2560 维。后 18 层有 KV sharing。'}
});

const ROLE_NAMES = {I:'图片 I', Q:'问题 Q', Ans:'答案 Ans'};
const QUESTIONS = {
  color:{q:'What color are the apples?',a:'The apples are red.',task:'颜色查询',concept:'红色属性'},
  count:{q:'How many apples are there?',a:'There are two apples.',task:'计数查询',concept:'数量：两个'}
};
const scene = `<svg class="sae-scene" viewBox="0 0 240 126" role="img" aria-label="教学图片：两个红苹果、一个杯子与写有 SALE 的字牌"><title>两个苹果、杯子与 SALE 字牌；教学插画</title><path d="M12 105H228" stroke="var(--line)"/><path d="M163 56h37v39q-18 13-37 0z" fill="var(--soft)" stroke="var(--green)" stroke-width="2"/><path d="M200 62q27 0 16 21h-16" fill="none" stroke="var(--green)" stroke-width="3"/><path d="M43 58c-28-13-34 29-11 40 7 4 10 1 11 1 18 8 38-31 17-41-7-3-11-1-17 0zM111 58c-28-13-34 29-11 40 7 4 10 1 11 1 18 8 38-31 17-41-7-3-11-1-17 0z" fill="var(--rust)"/><path d="M43 58l4-15m64 15 4-15" fill="none" stroke="var(--ink)" stroke-width="3"/><path d="M48 48q6-16 18-6-7 13-18 6M116 48q6-16 18-6-7 13-18 6" fill="var(--green)"/><rect x="166" y="9" width="57" height="27" rx="2" fill="var(--paper)" stroke="var(--line)"/><text x="195" y="28" text-anchor="middle" font-size="14" fill="var(--ink)">SALE</text></svg>`;

export function flowState(model='qwen', hook='c', role='Q', question='color') {
  const m=MODEL_SPECS[model] || MODEL_SPECS.qwen;
  const actualRole=hook==='c'?role:'I';
  const d=hook==='a'?m.v:m.d, K=hook==='a'?16384:hook==='b'?32768:65536;
  const path=hook==='a'?m.vision:hook==='b'?m.bridge:m.hook;
  const meaning=hook==='a'?'仍有细粒度空间索引的视觉语义；没有读取问题。':hook==='b'?'压缩并映射到语言宽度的视觉表示；没有读取问题。':actualRole==='I'?'视觉位置的深层表示；可以含物体与场景信息，但看不到后置问题。':actualRole==='Q'?`带图片上下文的${QUESTIONS[question].task}；可含任务意图与视觉关联。`:`已输入答案的内容与表达；可含${QUESTIONS[question].concept}，不证明答案正确。`;
  return {m,actualRole,d,K,path,meaning};
}

function flowBody(s) {
  const {m,actualRole,d,K,path,meaning}=flowState(s.model,s.hook,s.role,s.question);
  const q=QUESTIONS[s.question];
  const stages=[
    ['Processor · 两路输入','图片 → patches；文本 → IDs','只有图片进入视觉编码器，文本走 embedding 旁路'],
    ['视觉编码',m.visionShape,`${m.patch}；${m.blocks}`],
    ['视觉桥接',m.bridgeShape,m.merge],
    ['融合 → 语言主干',`[1, L, ${m.d}]`,m.backbone],
    ['SAE 编码',`z ∈ R^${K.toLocaleString()}`,'每 token 最多 64 个非零系数'],
    ['SAE 重构',`x̂ ∈ R^${d.toLocaleString()}`,'比较 x 与 x̂；只更新 SAE']
  ];
  const descriptions=[
    '把图片放在问题前面，已有答案在后面。teacher forcing 不执行自由生成，也不更新原模型。',
    `A 位于视觉编码器最后一个 block 之后。${s.model==='gemma'?'hook 张量包含 216 个 padding patch，训练时必须排除。':'这里的每个向量宽度为 1152。'} A 中还没有问题文本。`,
    `B 输出是视觉向量，不是词 ID。${m.widthNote}`,
    `视觉向量替换 image slots，与文本向量组成序列。${m.note} L 包含有效图像、文本和模板位置；本图不伪造 tokenizer 的精确文本长度。`,
    `从 ${path} 选择有效 ${ROLE_NAMES[actualRole]} 位置，每个 ${d} 维向量独立归一化并编码。不要先平均 hidden。`,
    `用相同的 z 重构同一个 token 的 x；目标不是图片或答案。正常 MLLM 继续使用原始 hidden；SAE 是读取分支。`
  ];
  const feature = s.hook==='a'?['区域/物体','颜色/形状','纹理候选']:s.hook==='b'?['压缩视觉概念','物体/场景','图像文字候选']:actualRole==='I'?['物体：苹果','红色视觉线索','图片文字候选']:actualRole==='Q'?[q.task,'提问句式','图文关联候选']:[q.concept,'答案表达','回答内容'];
  return `<div class="sae-input-pair"><div class="sae-picture">${scene}<small>教学插画 · 512 × 512 正方形输入</small></div><div class="sae-dialogue"><div><b>USER · Q</b><span>${q.q}</span></div><div><b>ASSISTANT · Ans</b><span>${q.a}</span></div><small>图在前、问在后；答案由已有训练数据提供</small></div></div>
  <div class="sae-route-label">冻结 MLLM · 图片路线 →</div>
  <div class="sae-journey" role="group" aria-label="前向计算步骤">${stages.slice(0,4).map((v,i)=>`<button type="button" class="sae-stage ${i===s.step?'is-current':''} ${i===({a:1,b:2,c:3}[s.hook])?'is-hook':''}" data-step="${i}" aria-pressed="${i===s.step}"><span class="sae-step-number">0${i+1}${i===({a:1,b:2,c:3}[s.hook])?` · ${s.hook.toUpperCase()} HOOK ↓`:''}</span><b>${v[0]}</b><code>${v[1]}</code><small>${v[2]}</small></button>`).join('')}</div>
  <div class="sae-text-route"><b>文本旁路 ↗</b><span>Q / Ans → tokenizer → embed_tokens → [1, N_text, ${m.d}] → 融合进 LLM</span></div>
  <div class="sae-main-output"><b>主模型继续向前 →</b><span>其余 blocks → norm → LM head → logits [1, L, ${m.vocab}] → 下一 token</span></div>
  <div class="sae-branch-label">↓ 从 ${s.hook.toUpperCase()} 输出复制并 detach · 主模型继续使用原 hidden</div>
  <div class="sae-branch-grid"><div class="sae-branch-source"><span class="sae-overline">SAE 读取分支</span><code>${esc(path)}</code><strong>[N, ${d}]</strong><small>选择有效位置 → 固定 μ/s</small></div>${stages.slice(4).map((v,j)=>`<button type="button" class="sae-stage ${j+4===s.step?'is-current':''}" data-step="${j+4}" aria-pressed="${j+4===s.step}"><span class="sae-step-number">0${j+5}</span><b>${v[0]}</b><code>${v[1]}</code><small>${v[2]}</small></button>`).join('')}</div>
  <div class="sae-step-detail" role="status"><b>0${s.step+1} / 06</b><span>${descriptions[s.step]}</span></div>
  ${s.hook==='c'?`<div class="sae-sequence" aria-label="序列位置来源"><span>从 LLM 选位置</span><span class="sae-token ignored">模板 ×</span>${Object.keys(ROLE_NAMES).map(r=>`<button type="button" class="sae-token ${r===actualRole?'is-selected':''}" data-role="${r}" aria-pressed="${r===actualRole}">${r==='I'?'I × 256':r==='Q'?'Q × Nq':'Ans × Na'}</button>`).join('')}<span class="sae-token ignored">padding ×</span></div>`:`<div class="sae-sequence"><span>${s.hook==='a'?`从 ${s.model==='gemma'?'2,304':'1,024'} 个真实 patch 中抽 N 个；排除 padding`:'从 256 个视觉 token 中抽 N 个'} · 此处没有 Q / Ans 位置</span></div>`}
  <div class="sae-hook-readout"><span class="sae-overline">${s.hook.toUpperCase()} HOOK · ${ROLE_NAMES[actualRole]}</span><code>${esc(path)}</code><p>${meaning}</p></div>
  <div class="sae-transform" aria-label="SAE 逐 token 输入输出"><div><small>选择并 detach</small><strong>[N, ${d}]</strong><span>h → 固定 μ/s → x</span></div><i aria-hidden="true">→</i><div><small>encoder + TopK</small><strong>[N, ${K.toLocaleString()}]</strong><span>z：每行最多 64 个非零</span></div><i aria-hidden="true">→</i><div><small>decoder 重构</small><strong>[N, ${d}]</strong><span>x̂ → 还原 ĥ</span></div></div>
  <div class="sae-feature-hints"><span>希望检验的 feature：</span>${feature.map(f=>`<span>${f}</span>`).join('')}</div>
  <p class="sae-caption">尺寸来自配置；feature 标签为教学假设。${s.hook==='c'?'I/Q/Ans 共用本模型这个 hook 的 65K 字典。':'A/B 若训练，使用各自独立的 SAE 与统计。'} 其他模型、层位和 hook 不共用 feature ID。</p>`;
}

function flowMarkup() {
  return `<figure class="sae-lab" data-sae-kind="flow"><figcaption><span class="sae-overline">FIGURE 01 · TRACE A SAMPLE</span><strong>从像素到稀疏特征</strong><span>切换一个条件，看表示如何改变</span></figcaption><div class="sae-controls"><label>模型<select data-control="model" aria-label="演示模型"><option value="qwen">Qwen3.5-9B</option><option value="gemma">Gemma 4 E4B</option></select></label><label>读取位置<select data-control="hook" aria-label="Hook 位置"><option value="c">C · 多模态主 SAE</option><option value="a">A · 视觉编码器</option><option value="b">B · 视觉桥接</option></select></label><label>同图换问<select data-control="question" aria-label="示例问题"><option value="color">询问颜色</option><option value="count">询问数量</option></select></label><button type="button" class="sae-play" data-action="play">▷ 播放一次</button></div><div data-sae-body>${flowBody({model:'qwen',hook:'c',role:'Q',question:'color',step:0})}</div><noscript>开启 JavaScript 可切换模型和步骤；各 hook 的完整静态表格在图后。</noscript></figure>`;
}

export const SOURCE_MIX = [
  ['CC3M',20],['COCO captions',15],['Localized narratives',10],['VQAv2',20],['GQA',15],['A-OKVQA',5],['TextVQA',5],['LLaVA mix',10]
];
const TRAIN_STEPS = [
  ['数据入库','先保证“这张图”与“这段对话”对应','图片 + messages + source + image_group_id','坏图/错配过滤，图片 hash/近重复分组，排除评测重叠；按图片组切分 90/5/5。独立问答分别展开，真实多轮保留历史。'],
  ['Processor','让图片和文本进入正确接口','pixels / input_ids / mask / positions','固定 processor revision、chat template 与分辨率。图片展开为视觉占位，记录每个正文 span。保留 I、Q、Ans 标签，排除模板与 padding。'],
  ['冻结前向','只读模型，不训练它','完整 block output → [B, L, d]','eval + no_grad + use_cache=False。读取 Qwen layer 23 / Gemma layer 29 的完整输出，detach；只用目标位置，不保存整套 hidden_states。'],
  ['分池采样','让长图、长答案不会独占更新','[N, d] + token 来源与样本索引','按来源配比抽图片/样本，再按 I 50% / 文本 50% 抽向量；问答文本 Q/Ans 等分。caption 的固定请求不采样。进入 shuffle buffer。'],
  ['稀疏重构','一个 hidden，少量字典方向','x[d] → z[65536] → x̂[d]','训练集估计 μ/s 后固定。逐 token 编码、ReLU、TopK64，再线性重构。MSE + dead-feature AuxK，只有 SAE 参数接收梯度。'],
  ['验证与保存','重构好，还要保留行为与信息','权重 + μ/s + 配置 + 按池指标','检查 I/Q/Ans 的 FVU、dead、L0 与替换重构后的答案 CE；回看不同原图/文本的 top examples。验证停滞时早停，保存实际暴露预算。'],
  ['数据选择','从 token features 到样本指纹','v_I / v_Q / v_Ans + feature 集合','先编码再聚合。联合三份指纹找重复候选；按可靠 feature 的新增覆盖选多样样本。用误删标注集和固定预算下游 SFT 对比随机/dense 基线。']
];

function trainingBody(step=0,model='qwen') {
  const [name,title,shape,desc]=TRAIN_STEPS[step],m=MODEL_SPECS[model];
  return `<div class="sae-training-track" role="group" aria-label="训练流程步骤">${TRAIN_STEPS.map((t,i)=>`<button type="button" data-training-step="${i}" class="${i===step?'is-current':''}" aria-pressed="${i===step}"><span>0${i+1}</span>${t[0]}</button>`).join('')}</div><div class="sae-training-view" role="status"><div class="sae-training-index">0${step+1}<span>/ 07</span></div><div><span class="sae-overline">${name}</span><strong>${title}</strong><code>${shape.replaceAll('[d]',`[${m.d}]`).replaceAll('[B, L, d]',`[B, L, ${m.d}]`).replaceAll('[N, d]',`[N, ${m.d}]`)}</code><p>${desc}</p></div></div><div class="sae-gradient"><span class="sae-frozen">MLLM 冻结 · ${m.name}</span><span aria-hidden="true">── detach ──→</span><span class="sae-trainable">SAE 可训练 · ${m.d} → 65,536 → ${m.d}</span></div><div class="sae-budget"><span>每模型主 SAE：<b>20M pilot ⊂ 最多 200M 暴露</b></span><span>每次更新 <b>4,096</b> 个有效向量</span></div><div class="sae-mixture" aria-label="激活来源预算">${SOURCE_MIX.map(([n,v],i)=>`<div style="--portion:${v};--mix-tone:${i%2}" aria-label="${n} ${v}%" title="${n} ${v}%"><span>${v}%</span></div>`).join('')}</div><div class="sae-mix-legend">${SOURCE_MIX.map(([n,v])=>`<span>${n} <b>${v}%</b></span>`).join('')}</div><p class="sae-caption">比例按实际送入 SAE 的有效向量计；不是数据行数，也不是 MLLM 前向处理的全部 token。200M 是工程上限，没有实测训练曲线。</p>`;
}
function trainingMarkup() {
  return `<figure class="sae-lab" data-sae-kind="training"><figcaption><span class="sae-overline">FIGURE 02 · THE TRAINING LOOP</span><strong>训练的边界在哪里？</strong><span>点选步骤，或播放一次完整管线</span></figcaption><div class="sae-controls"><label>模型<select data-control="training-model" aria-label="训练流程模型"><option value="qwen">Qwen3.5-9B</option><option value="gemma">Gemma 4 E4B</option></select></label><button type="button" class="sae-play" data-action="training-play">▷ 播放一次</button><button type="button" data-action="previous">← 上一步</button><button type="button" data-action="next">下一步 →</button></div><div data-training-body>${trainingBody()}</div><noscript>七个步骤与完整参数也在正文中列出。</noscript></figure>`;
}

export const DEMO_FEATURES = [
  {id:42,label:'苹果 / 物体候选',values:[.92,.48,.65],kind:'图文共同激活候选',note:'相同 ID 在图片和文字中活跃，是跨模态候选；仍需相关图文、负例与干预验证。'},
  {id:918,label:'红色视觉线索',values:[.88,.12,.18],kind:'视觉偏好候选',note:'图片位置活跃较多；不能仅凭这个统计断言它只编码颜色，也可能偏好特定区域或纹理。'},
  {id:1741,label:'疑问句式',values:[.03,.87,.09],kind:'文本偏好候选',note:'问题位置活跃，可能编码语法或任务形式。它仍可用于保留不同类型的指令。'},
  {id:9812,label:'属性问答关联',values:[.16,.76,.81],kind:'任务 / 融合候选',note:'主要在文本位置激活，不代表只含文本；固定问题换图、遮挡苹果，才能检验视觉依赖。'},
  {id:31007,label:'答案措辞',values:[.02,.15,.91],kind:'答案表达候选',note:'teacher forcing 下反映输入答案的内容和表达；不能把强激活解释成答案真实或模型自信。'}
];
export function activeDemoIds(role,k) {
  const index={I:0,Q:1,Ans:2}[role];
  const forced=DEMO_FEATURES.filter(f=>f.values[index]>.3).map(f=>f.id);
  const set=new Set(forced);
  let i=0;while(set.size<k){set.add((137+i*7919+index*19001)%65536);i++;}
  return [...set];
}
function dictionaryDetail(feature=42, role='I', k=64, model='qwen') {
  const f=DEMO_FEATURES.find(x=>x.id===feature),m=MODEL_SPECS[model];
  return `<div class="sae-dictionary-header"><div><small>同一个字典中的 feature</small><strong>F${String(f.id).padStart(5,'0')} · ${f.label}</strong></div><span>${f.kind}</span></div><div class="sae-profile" aria-label="三类位置的合成平均激活">${Object.keys(ROLE_NAMES).map((r,i)=>`<div><span>${ROLE_NAMES[r]}</span><div class="sae-bar-track"><i style="width:${f.values[i]*100}%" class="${r===role?'is-active':''}"></i></div><b>${f.values[i].toFixed(2)}</b></div>`).join('')}</div><p>${f.note}</p><div class="sae-dictionary-math"><span>共享 encoder：<b>65,536 × ${m.d}</b></span><span>共享 decoder：<b>${m.d} × 65,536</b></span><span>本 token：<b>${k} / 65,536</b> 活跃（${(k/65536*100).toFixed(3)}%）</span></div><p class="sae-caption">这里恰好点亮 k 个槽以演示稀疏预算；真实 ReLU + TopK 可以少于 k。条形数值为合成数据。I/Q/Ans 标签用于训练后统计，不是分配给三套字典。模型切换仅演示尺寸；两套真实字典的 feature ID 不对齐。</p>`;
}
function dictionaryMarkup() {
  return `<figure class="sae-lab" data-sae-kind="dictionary"><figcaption><span class="sae-overline">FIGURE 03 · ONE SHARED DICTIONARY</span><strong>65,536 个位置，没有预划的模态分区</strong><span>同一模型、同一 hook；每个 token 只使用少量方向</span></figcaption><div class="sae-controls"><label>独立字典<select data-control="dictionary-model" aria-label="字典所属模型"><option value="qwen">Qwen C · 4096 维输入</option><option value="gemma">Gemma C · 2560 维输入</option></select></label><label>当前 token 来源<select data-control="dictionary-role" aria-label="字典 token 来源"><option value="I">图片 I</option><option value="Q">问题 Q</option><option value="Ans">答案 Ans</option></select></label><label>TopK 稀疏预算<select data-control="dictionary-k" aria-label="TopK 预算"><option value="32">k = 32</option><option value="64" selected>k = 64</option><option value="128">k = 128</option></select></label></div><div class="sae-dictionary-overview"><div class="sae-grid-wrap"><canvas width="512" height="512" data-dictionary-canvas role="img" aria-label="65,536 个字典槽的缩略图；当前示意 token 激活 64 个"><span>65,536 槽；示意激活 64 个</span></canvas><small>256 × 256 个槽 · 无模态分区</small></div><div class="sae-feature-picker" role="group" aria-label="查看示例 feature">${DEMO_FEATURES.map((f,i)=>`<button type="button" data-feature="${f.id}" aria-pressed="${i===0}"><code>F${String(f.id).padStart(5,'0')}</code><span>${f.label}</span></button>`).join('')}<small>编号和命名仅用于本图，不对应两个模型的真实 feature。</small></div></div><div data-dictionary-detail aria-live="polite">${dictionaryDetail()}</div><noscript>每个模型单独训练一个 65K 字典；正文表格说明各种 feature 的证据边界。</noscript></figure>`;
}

export function renderSAELesson(kind) {
  if(kind==='flow')return flowMarkup();
  if(kind==='training')return trainingMarkup();
  if(kind==='dictionary')return dictionaryMarkup();
  return null;
}

export function mountSAELessons(root=document) {
  root.querySelectorAll('.sae-lab:not([data-sae-ready])').forEach(el=>{
    el.dataset.saeReady='true';
    const kind=el.dataset.saeKind;
    if(kind==='flow'){
      let state={model:'qwen',hook:'c',role:'Q',question:'color',step:0},timer=null;
      const stop=()=>{clearTimeout(timer);timer=null;el.querySelector('[data-action="play"]').textContent='▷ 播放一次';};
      const draw=()=>{el.querySelector('[data-sae-body]').innerHTML=flowBody(state);};
      const tick=()=>{if(!el.isConnected||document.hidden){stop();return;}if(state.step>=5){stop();return;}state.step++;draw();timer=setTimeout(tick,2400);};
      el.addEventListener('change',ev=>{const key=ev.target.dataset.control;if(['model','hook','question'].includes(key)){stop();state[key]=ev.target.value;draw();}});
      el.addEventListener('click',ev=>{const b=ev.target.closest('button');if(!b)return;if(b.dataset.step!==undefined){stop();state.step=Number(b.dataset.step);draw();}else if(b.dataset.role){stop();state.role=b.dataset.role;draw();}else if(b.dataset.action==='play'){if(timer){stop();return;}state.step=0;draw();b.textContent='Ⅱ 暂停';timer=setTimeout(tick,1800);}});
    } else if(kind==='training'){
      let step=0,model='qwen',timer=null;
      const stop=()=>{clearTimeout(timer);timer=null;el.querySelector('[data-action="training-play"]').textContent='▷ 播放一次';};
      const draw=()=>{el.querySelector('[data-training-body]').innerHTML=trainingBody(step,model);el.querySelector('[data-action="previous"]').disabled=step===0;el.querySelector('[data-action="next"]').disabled=step===6;};
      const tick=()=>{if(!el.isConnected||document.hidden){stop();return;}if(step>=6){stop();return;}step++;draw();timer=setTimeout(tick,3000);};
      el.addEventListener('change',ev=>{if(ev.target.dataset.control==='training-model'){stop();model=ev.target.value;draw();}});
      el.addEventListener('click',ev=>{const b=ev.target.closest('button');if(!b)return;const a=b.dataset.action;if(a==='training-play'){if(timer){stop();return;}step=0;draw();b.textContent='Ⅱ 暂停';timer=setTimeout(tick,1800);}else if(a==='previous'||a==='next'){stop();step=Math.max(0,Math.min(6,step+(a==='next'?1:-1)));draw();}else if(b.dataset.trainingStep!==undefined){stop();step=Number(b.dataset.trainingStep);draw();}});draw();
    }else if(kind==='dictionary'){
      let feature=42,role='I',k=64,model='qwen';
      const canvas=el.querySelector('[data-dictionary-canvas]'),ctx=canvas.getContext('2d');
      const draw=()=>{
        el.querySelector('[data-dictionary-detail]').innerHTML=dictionaryDetail(feature,role,k,model);
        el.querySelectorAll('[data-feature]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.feature)===feature)));
        canvas.setAttribute('aria-label',`65,536 个字典槽；当前 ${ROLE_NAMES[role]} 示意 token 激活 ${k} 个，所选 F${feature}`);
        if(!ctx)return;
        const style=getComputedStyle(el),muted=style.getPropertyValue('--surface').trim(),ink=style.getPropertyValue('--green').trim(),accent=style.getPropertyValue('--rust').trim();
        ctx.fillStyle=muted;ctx.fillRect(0,0,512,512);
        ctx.fillStyle=ink;activeDemoIds(role,k).forEach(id=>{ctx.fillRect((id%256)*2,Math.floor(id/256)*2,2,2);});
        ctx.strokeStyle=accent;ctx.lineWidth=2;const x=(feature%256)*2,y=Math.floor(feature/256)*2;ctx.strokeRect(x-5,y-5,12,12);
      };
      el.addEventListener('change',ev=>{const c=ev.target.dataset.control;if(c==='dictionary-model')model=ev.target.value;if(c==='dictionary-role')role=ev.target.value;if(c==='dictionary-k')k=Number(ev.target.value);draw();});
      el.addEventListener('click',ev=>{const b=ev.target.closest('[data-feature]');if(b){feature=Number(b.dataset.feature);draw();}});
      const onTheme=()=>{if(el.isConnected)draw();else document.removeEventListener('theme-change',onTheme);};document.addEventListener('theme-change',onTheme);draw();
    }
  });
}
