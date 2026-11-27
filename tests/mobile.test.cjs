const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..');
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));

function domFor(slug){
  const html=path.join(root,'site',slug,'index.html');
  const dom=new JSDOM(fs.readFileSync(html,'utf8'),{url:'https://ai.lucca.top/'+slug+'/',runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window;
  w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
  w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>{},set:()=>true});
  return {dom,html};
}
function loadScripts(dom,html){
  const w=dom.window,errors=[];
  w.addEventListener('error',e=>errors.push(String(e.message||e.error)));
  for(const tag of w.document.querySelectorAll('script[src]')){
    const src=tag.getAttribute('src').split('?')[0];
    if(/^https?:/.test(src))continue;
    try{w.eval(fs.readFileSync(path.resolve(path.dirname(html),src),'utf8'));}
    catch(e){errors.push(e.message);}
  }
  return errors;
}

test('tools: production CSP blocks string eval, four demos still run',async()=>{
  const src=fs.readFileSync(path.join(root,'site/tools/tools.js'),'utf8');
  assert.doesNotMatch(src,/\bFunction\s*\(/);
  assert.doesNotMatch(src,/\beval\s*\(/);
  const {dom,html}=domFor('tools');
  try{
    const w=dom.window;
    const Native=w.Function;
    w.Function=function(){throw new w.EvalError("Evaluating a string as JavaScript violates the following Content Security Policy directive because 'unsafe-eval' is not an allowed source of script: script-src 'self' 'unsafe-inline' https://hm.baidu.com");};
    w.Function.prototype=Native.prototype;
    const errors=loadScripts(dom,html);
    assert.deepEqual(errors,[]);
    const d=w.document;
    assert.equal(d.querySelectorAll('#flow-dots button').length,6);
    const cap0=d.querySelector('#flow-cap').textContent;
    d.querySelector('#flow-next').click();
    assert.notEqual(d.querySelector('#flow-cap').textContent,cap0);
    assert.equal(d.querySelectorAll('#sim-q button').length,5);
    const log0=d.querySelector('#sim-log').textContent.length;
    d.querySelector('#sim-next').click();
    assert.ok(d.querySelector('#sim-log').textContent.length>log0);
    for(let i=0;i<8&&!d.querySelector('#sim-next').disabled;i++)d.querySelector('#sim-next').click();
    assert.equal(d.querySelector('#sim-next').disabled,true);
    assert.match(d.querySelector('#sim-next').textContent,/完成/);
    d.querySelectorAll('#sim-q button')[1].click();
    d.querySelector('#sim-all').click();
    assert.match(d.querySelector('#sim-log').textContent,/1918\.08/);
    assert.equal(d.querySelector('#sim-next').disabled,true);
    const areas=[...d.querySelectorAll('#sch-tools textarea')];
    assert.equal(areas.length,3);
    assert.ok(areas.every(t=>t.value.length>0));
    assert.equal(d.querySelectorAll('#sch-bars .cand').length,4);
    d.querySelectorAll('#sch-q button')[2].click();
    assert.match(d.querySelector('#sch-cap').textContent,/选/);
    d.querySelector('#par-go').click();
    await wait(40);
    assert.equal(d.querySelector('#par').classList.contains('go'),true);
  }finally{dom.window.close();}
});

test('computer-use: 全部显示 survives later visibility changes',async()=>{
  const {dom,html}=domFor('computer-use');
  try{
    const w=dom.window;
    let cb=null;
    w.IntersectionObserver=class{constructor(fn){cb=fn;}observe(){}unobserve(){}disconnect(){}takeRecords(){return [];}};
    const errors=loadScripts(dom,html);
    assert.deepEqual(errors,[]);
    const d=w.document,bars=()=>[...d.querySelectorAll('#os-bars i')].map(i=>i.style.width);
    cb([{isIntersecting:true}]);
    d.querySelector('#os-s').children[1].click();
    const shown=bars();
    assert.ok(shown.length>=7);
    assert.ok(shown.every(x=>parseFloat(x)>0));
    assert.match(d.querySelector('#os-cap').textContent,/12%/);
    cb([{isIntersecting:false}]);
    cb([{isIntersecting:true}]);
    await wait(400);
    assert.deepEqual(bars(),shown);
    assert.equal(d.querySelector('#os-s').children[1].classList.contains('on'),true);
    assert.equal(d.querySelector('#os-s').children[0].classList.contains('on'),false);
    d.querySelector('#os-s').children[0].click();
    assert.ok(bars().every(x=>parseFloat(x)===0));
  }finally{dom.window.close();}
});

test('pretrain: punctuation-only custom text does not show NaN',async()=>{
  const {dom,html}=domFor('pretrain');
  try{
    const w=dom.window,errors=loadScripts(dom,html);
    assert.deepEqual(errors,[]);
    const d=w.document;
    const own=[...d.querySelectorAll('#mini-corpus button')].find(b=>b.textContent==='自己写');
    own.click();
    const ta=d.querySelector('#mini-text');
    const type=async value=>{ta.value=value;ta.dispatchEvent(new w.Event('input'));await wait(480);};
    await type('。。。，！？ ');
    assert.equal(ta.value,'。。。，！？ ');
    assert.equal(d.querySelector('#mini-p').textContent,'16');
    assert.match(d.querySelector('#mini-l').textContent,/^\d+\.\d{3}$/);
    await type('   \n，，');
    assert.match(d.querySelector('#mini-l').textContent,/^\d+\.\d{3}$/);
    await type('春眠不觉晓');
    assert.equal(d.querySelector('#mini-p').textContent,'49');
    assert.match(d.querySelector('#mini-l').textContent,/^\d+\.\d{3}$/);
    d.querySelector('#mini-run').click();
    await wait(1500);
    const steps=+d.querySelector('#mini-n').textContent;
    assert.match(d.querySelector('#mini-l').textContent,/^\d+\.\d{3}$/);
    assert.ok(steps<600);
  }finally{dom.window.close();}
});
