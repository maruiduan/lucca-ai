/* 各篇文章共用：进度条、吸顶目录、字号、时间线渐显，以及几个小工具 */
(function(){
"use strict";
const $=s=>document.querySelector(s);
const el=(t,c,txt)=>{const e=document.createElement(t);if(c)e.className=c;if(txt!=null)e.textContent=txt;return e;};
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
// 可复现的伪随机数（mulberry32）
function rng(seed){let a=seed>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
// 概率条：items=[{w,p,note}]
function bars(box,items,opt){
  opt=opt||{};box.innerHTML='';
  items.forEach(a=>{
    const r=el(opt.onPick?'button':'div','cand'+(a.hi?' pick':''));
    r.innerHTML='<span class="w"></span><span class="bar"><span></span></span><span class="p"></span>';
    r.querySelector('.w').textContent=a.w;r.querySelector('.p').textContent=a.label!=null?a.label:(a.p*100).toFixed(a.p<.1?1:0)+'%';
    if(a.color)r.querySelector('.bar span').style.background=a.color;
    if(opt.onPick)r.onclick=()=>opt.onPick(a);
    box.append(r);
    const s=r.querySelector('.bar span');const v=Math.max(.004,Math.min(1,a.scale!=null?a.scale:a.p));
    if(reduce)s.style.transform='scaleX('+v+')';else requestAnimationFrame(()=>requestAnimationFrame(()=>s.style.transform='scaleX('+v+')'));
  });
}
function onVisible(node,cb,th){if(!('IntersectionObserver' in window)){cb(true);return;}new IntersectionObserver(es=>es.forEach(e=>cb(e.isIntersecting)),{threshold:th||.3}).observe(node);}
window.AI={$,el,reduce,rng,bars,onVisible};

const y=$('#y');if(y)y.textContent=new Date().getFullYear();
const prog=$('#progress');
if(prog){let pt=false;addEventListener('scroll',()=>{if(pt)return;pt=true;requestAnimationFrame(()=>{pt=false;const h=document.documentElement;prog.style.transform='scaleX('+(h.scrollTop/Math.max(1,h.scrollHeight-h.clientHeight))+')';});},{passive:true});}
// Storage is optional (private browsing / disabled storage must not break the page).
const art=$('#art');let storedFs=null;
try{storedFs=localStorage.getItem('ai-fs');}catch(e){}
let fs=Number(storedFs);if(!storedFs||!Number.isFinite(fs))fs=17;
fs=Math.max(14,Math.min(22,fs));
const setFs=v=>{fs=Math.max(14,Math.min(22,v));if(art)art.style.fontSize=fs+'px';try{localStorage.setItem('ai-fs',String(fs));}catch(e){}};
if(art&&storedFs!==null)art.style.fontSize=fs+'px';
if($('#fs-m'))$('#fs-m').onclick=()=>setFs(fs-1);
if($('#fs-p'))$('#fs-p').onclick=()=>setFs(fs+1);

(function(){
  const toc=$('#toc'),bar=$('#sbar'),cur=$('#sb-cur'),sheet=$('#sheet'),list=$('#sheet-list');
  if(!toc||!bar)return;
  if(innerWidth<560)toc.removeAttribute('open');
  toc.querySelectorAll('a').forEach(a=>{const li=el('li');const b=a.cloneNode(true);b.onclick=()=>close();li.append(b);list.append(li);});
  let hideTimer=null,showFrame=null,isOpen=false,previousOverflow='',previousFocus=null;
  const open=()=>{
    clearTimeout(hideTimer);cancelAnimationFrame(showFrame);
    if(!isOpen){previousOverflow=document.body.style.overflow;previousFocus=document.activeElement;}
    isOpen=true;sheet.hidden=false;document.body.style.overflow='hidden';
    showFrame=requestAnimationFrame(()=>{if(isOpen){sheet.classList.add('show');$('#sheet-x').focus();}});
  };
  const close=()=>{
    if(!isOpen)return;
    isOpen=false;cancelAnimationFrame(showFrame);sheet.classList.remove('show');
    document.body.style.overflow=previousOverflow;
    if(previousFocus&&previousFocus.isConnected)previousFocus.focus({preventScroll:true});
    hideTimer=setTimeout(()=>{if(!isOpen)sheet.hidden=true;},reduce?0:220);
  };
  $('#sb-toc').onclick=open;$('#sheet-x').onclick=close;$('#sheet-bg').onclick=close;
  addEventListener('keydown',e=>{if(e.key==='Escape'&&!sheet.hidden)close();});
  const heads=[...document.querySelectorAll('article h2[id]')];
  let ticking=false;
  function upd(){ticking=false;
    const show=toc.getBoundingClientRect().bottom<0;bar.classList.toggle('show',show);bar.setAttribute('aria-hidden',!show);
    let c=null;for(const h of heads){if(h.getBoundingClientRect().top<90)c=h;else break;}
    cur.textContent=c?c.textContent.replace(/^\d+|^参考/,'').trim():'';
    list.querySelectorAll('a').forEach(a=>a.classList.toggle('cur',!!c&&a.getAttribute('href')==='#'+c.id));
  }
  addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(upd);}},{passive:true});upd();
})();
const evs=document.querySelectorAll('.ev');
if('IntersectionObserver' in window&&!reduce){
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}}),{rootMargin:'0px 0px -8% 0px'});
  evs.forEach(e=>io.observe(e));
}else evs.forEach(e=>e.classList.add('in'));
})();
