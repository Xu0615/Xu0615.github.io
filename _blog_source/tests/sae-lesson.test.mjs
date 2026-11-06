import test from 'node:test';
import assert from 'node:assert/strict';
import { renderMarkdown } from '../src/markdown.js';
import { renderSAELesson, flowState, SOURCE_MIX, activeDemoIds } from '../src/sae-lesson.js';

test('Only trusted named SAE figures render; arbitrary code remains inert',()=>{
  for(const name of ['flow','training','dictionary'])assert.match(renderMarkdown('```mllm-sae\n'+name+'\n```').html,/class="sae-lab"/);
  for(const name of ['__proto__','constructor','<script>alert(1)</script>']){
    assert.equal(renderSAELesson(name),null);
    const html=renderMarkdown('```mllm-sae\n'+name+'\n```').html;
    assert.doesNotMatch(html,/<script>|class="sae-lab"/);
  }
});
test('Visual hooks cannot acquire the future question; residual width is model-specific',()=>{
  for(const model of ['qwen','gemma'])for(const hook of ['a','b']){
    const color=flowState(model,hook,'Q','color'),count=flowState(model,hook,'Ans','count');
    assert.equal(color.actualRole,'I');assert.equal(color.meaning,count.meaning);
  }
  assert.equal(flowState('qwen','c','Q').d,4096);
  assert.equal(flowState('gemma','c','Q').d,2560);
  assert.equal(flowState('gemma','a','I').d,768);
  assert.notEqual(flowState('qwen','c','Q','color').meaning,flowState('qwen','c','Q','count').meaning);
  assert.equal(flowState('qwen','c','I','color').meaning,flowState('qwen','c','I','count').meaning);
});
test('Exposure mixture and displayed sparse token budgets are internally consistent',()=>{
  assert.equal(SOURCE_MIX.reduce((n,x)=>n+x[1],0),100);
  for(const r of ['I','Q','Ans'])for(const k of [32,64,128]){
    const ids=activeDemoIds(r,k);assert.equal(new Set(ids).size,k);assert.ok(ids.every(x=>x>=0&&x<65536));
  }
});
