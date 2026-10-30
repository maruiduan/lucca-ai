const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..');
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function page(slug,storage,reducedMotion=false){
  const dom=new JSDOM(fs.readFileSync(path.join(root,'site',slug,'index.html'),'utf8'),{url:'https://ai.lucca.top/'+slug+'/',runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window;
  w.matchMedia=()=>({matches:reducedMotion});
  if(storage==='denied')Object.defineProperty(w,'localStorage',{get(){throw new Error('Storage disabled');}});
  else if(storage!=null)w.localStorage.setItem('ai-fs',storage);
  const scripts=slug==='llm'?['llm/llm.js']:['assets/common.js'];
  for(const script of scripts)w.eval(fs.readFileSync(path.join(root,'site',script),'utf8'));
  return dom;
}
for(const slug of ['pretrain','llm']){
 test(slug+': disabled storage preserves reader controls',async()=>{
   const dom=page(slug,'denied');try{
    const d=dom.window.document;d.querySelector('#fs-p').click();assert.equal(d.querySelector('#art').style.fontSize,'18px');
    d.querySelector('#sb-toc').click();await wait(30);assert.equal(d.querySelector('#sheet').hidden,false);
   }finally{dom.window.close();}
 });
 test(slug+': invalid font preferences recover, bounded size remains usable',()=>{
   const dom=page(slug,'garbage');try{const d=dom.window.document;assert.equal(d.querySelector('#art').style.fontSize,'17px');d.querySelector('#fs-p').click();assert.equal(d.querySelector('#art').style.fontSize,'18px');for(let i=0;i<10;i++)d.querySelector('#fs-p').click();assert.equal(d.querySelector('#art').style.fontSize,'22px');}finally{dom.window.close();}
 });
 test(slug+': reopened drawer survives old close timer; Escape restores overflow/focus',async()=>{
   const dom=page(slug);try{
    const w=dom.window,d=w.document,open=d.querySelector('#sb-toc'),sheet=d.querySelector('#sheet');
    d.body.style.overflow='auto';open.focus();open.click();await wait(30);d.querySelector('#sheet-x').click();open.click();await wait(260);
    assert.equal(sheet.hidden,false);assert.equal(sheet.classList.contains('show'),true);assert.equal(d.body.style.overflow,'hidden');
    w.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape'}));await wait(240);assert.equal(sheet.hidden,true);assert.equal(d.body.style.overflow,'auto');assert.equal(d.activeElement,open);
    open.click();d.querySelector('#sheet-x').click();await wait(240);assert.equal(sheet.classList.contains('show'),false);
   }finally{dom.window.close();}
 });
}
test('llm: delayed sample cannot overwrite a newly selected preset or typed input',async()=>{
 const dom=page('llm');try{const w=dom.window,d=w.document;w.Math.random=()=>0;
 d.querySelector('#nt-sample').click();d.querySelector('#nt-presets button').click();const preset=d.querySelector('#nt-in').value;await wait(340);assert.equal(d.querySelector('#nt-in').value,preset);
 d.querySelector('#nt-sample').click();const input=d.querySelector('#nt-in');input.value='小猫喜欢';input.dispatchEvent(new w.Event('input'));await wait(340);assert.equal(input.value,'小猫喜欢');
 }finally{dom.window.close();}
});
test('all article scripts initialize without errors',async()=>{
 for(const entry of fs.readdirSync(path.join(root,'site'),{withFileTypes:true})){
  const html=path.join(root,'site',entry.name,'index.html');if(!entry.isDirectory()||!fs.existsSync(html))continue;
  const dom=new JSDOM(fs.readFileSync(html,'utf8'),{url:'https://ai.lucca.top/'+entry.name+'/',runScripts:'outside-only',pretendToBeVisual:true});
  try{const w=dom.window;w.matchMedia=()=>({matches:false});
   // jsdom has no canvas renderer; this smoke test checks wiring, not visual output.
   w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>{},set:()=>true});
   for(const tag of w.document.querySelectorAll('script[src]')){
    const src=tag.getAttribute('src').split('?')[0];if(/^https?:/.test(src))continue;
    w.eval(fs.readFileSync(path.resolve(path.dirname(html),src),'utf8'));
   }
   await wait(40);
  }finally{dom.window.close();}
 }
});

for(const reducedMotion of [false,true])for(const action of ['#nt-sample','#nt-auto','#nt-cands button']){
 test('llm: immediate generation after typing uses the new prompt ('+action+', reduced motion='+reducedMotion+')',async()=>{
  const dom=page('llm',null,reducedMotion);try{const w=dom.window,d=w.document;w.Math.random=()=>0;
   const input=d.querySelector('#nt-in');input.value='小猫喜欢';input.dispatchEvent(new w.Event('input'));
   const first=d.querySelector('#nt-cands button').dataset.w;
   d.querySelector(action).click();await wait(340);
   assert.ok(input.value.startsWith('小猫喜欢'+first));assert.ok(input.value.length>'小猫喜欢'.length);
  }finally{dom.window.close();}
 });
}
test('llm: temperature changes cancel old-distribution pending samples',async()=>{
 const dom=page('llm');try{const w=dom.window,d=w.document;w.Math.random=()=>0;const input=d.querySelector('#nt-in'),before=input.value;
 d.querySelector('#nt-sample').click();d.querySelector('#nt-t').value='0.5';d.querySelector('#nt-t').dispatchEvent(new w.Event('input'));await wait(340);assert.equal(input.value,before);
 }finally{dom.window.close();}
});
