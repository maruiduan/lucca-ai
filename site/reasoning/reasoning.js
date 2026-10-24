(function(){
"use strict";
const {$,el,bars,rng,reduce,onVisible}=window.AI;
const css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const NS='http://www.w3.org/2000/svg';
const sv=(t,a)=>{const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);return e;};
function segs(box,items,cur,cb){items.forEach(([k,n])=>{const b=el('button',k===cur?'on':'',n);b.onclick=()=>{[...box.children].forEach(c=>c.classList.toggle('on',c===b));cb(k);};box.append(b);});}

/* 动画：计算量摊在 token 上 */
(function(){
  const svg=$('#tk-fig');let mode='one',timer=null;
  const PROMPT=['23','×','47','='];const STEP=['23','×','40','=','920','…','161','→','1081'];
  function draw(){clearInterval(timer);svg.innerHTML='';
    const toks=PROMPT.concat(mode==='one'?['1081']:STEP);const n=toks.length,w=Math.min(34,340/n),x0=(360-n*w)/2;
    svg.append(sv('text',{x:6,y:16,'font-size':11,fill:css('--sub')}).appendChild(document.createTextNode('每列 = 写一个 token 时的全部计算（4 层只是示意）')).parentNode);
    const cols=[];
    toks.forEach((t,i)=>{const g=sv('g',{});const isAns=i>=PROMPT.length;const x=x0+i*w;
      for(let l=0;l<4;l++)g.append(sv('rect',{x:x+3,y:40+l*30,width:w-6,height:24,rx:5,fill:isAns?css('--accent'):css('--line'),opacity:isAns?.85:1}));
      const tx=sv('text',{x:x+w/2,y:180,'text-anchor':'middle','font-size':n>10?10:12,fill:isAns?css('--accent'):css('--ink'),'font-family':'ui-monospace,monospace'});tx.textContent=t;g.append(tx);
      svg.append(g);if(isAns){cols.push(g);if(!reduce)g.style.opacity=0;}});
    if(!reduce){let k=0;timer=setInterval(()=>{if(k>=cols.length){clearInterval(timer);return;}cols[k].style.transition='opacity .35s';cols[k].style.opacity=1;k++;},mode==='one'?300:260);}
    $('#tk-cap').textContent=mode==='one'?'一口气答：读完题，只有 1 列计算（红色）可以用来得出 1081。整道乘法要在一次前向计算里「心算」完成。':'分步写：先写 23×40=920，再算 23×7=161，最后相加。红色的 9 列计算都在为这道题出力，而且每列只做一件小事。';}
  segs($('#tk-mode'),[['one','一口气答'],['step','分步写']],mode,k=>{mode=k;draw();});
  draw();onVisible(svg,v=>{if(v)draw();},.6);
})();

/* ① 一口气 vs 分步 */
(function(){
  const ONE=[['1081',.40],['1071',.15],['1181',.12],['981',.10],['1091',.08],['其他',.15]];
  const STEPS=[{t:'23 × 40 = 920',p:.98},{t:'23 × 7 = 161',p:.97},{t:'920 + 161 = 1081',p:.99}];
  const WRONG=['1071','1181','981','1091','1061','1801'];
  let mode='one',shown=0,tm=null;
  const pStep=STEPS.reduce((a,s)=>a*s.p,1);
  function render(){clearInterval(tm);$('#cot-vote').innerHTML='';$('#cot-cap').textContent='';const box=$('#cot-steps');box.innerHTML='';
    if(mode==='one'){box.innerHTML='<div>答：<b>？</b>（必须立刻写出答案的第一个 token）</div>';$('#cot-lbl').textContent='模型给答案的概率（示意）：';bars($('#cot-bars'),ONE.map(([w,p])=>({w,p,hi:w==='1081'})));}
    else{$('#cot-lbl').textContent='每一步写对的概率（示意），全部写对的概率 = 三者相乘：';
      bars($('#cot-bars'),STEPS.map(s=>({w:'第'+(STEPS.indexOf(s)+1)+'步',p:s.p})).concat([{w:'全对',p:pStep,hi:true}]));
      shown=0;const add=()=>{if(shown>=STEPS.length){clearInterval(tm);const d=el('div');d.innerHTML='答：<b>1081 元</b>';box.append(d);return;}box.append(el('div',null,STEPS[shown].t));shown++;};
      if(reduce){for(let i=0;i<=STEPS.length;i++)add();}else{add();tm=setInterval(add,650);}}}
  function once(){if(mode==='one'){let r=Math.random();for(const [w,p] of ONE){r-=p;if(r<=0)return w==='其他'?WRONG[Math.floor(Math.random()*WRONG.length)]:w;}return '1081';}
    let ok=true;for(const s of STEPS)if(Math.random()>s.p)ok=false;return ok?'1081':WRONG[Math.floor(Math.random()*WRONG.length)];}
  $('#cot-run').onclick=()=>{const v=$('#cot-vote');v.innerHTML='';let c=0;
    for(let i=0;i<20;i++){const a=once();const ok=a==='1081';c+=ok;const s=el('span',ok?'ok':'no',ok?'✓':'✗');s.title=a;s.style.animationDelay=(i*40)+'ms';v.append(s);}
    $('#cot-cap').textContent=mode==='one'?`20 遍里答对 ${c} 遍（按设定，期望约 ${Math.round(.4*20)} 遍）。每次的错答都写得同样肯定。`:`20 遍里答对 ${c} 遍（按设定，期望约 ${Math.round(pStep*20)} 遍）。每一步都简单，错的机会就少。`;};
  segs($('#cot-mode'),[['one','一口气答'],['step','分步写']],mode,k=>{mode=k;render();});
  render();
})();

/* ② 自洽性投票 */
(function(){
  const cv=$('#sc-cv'),c=cv.getContext('2d'),sp=$('#sc-p'),sn=$('#sc-n');
  const lc=[1];function C(n,k){let r=1;for(let i=1;i<=k;i++)r=r*(n-k+i)/i;return r;}
  function maj(p,N){let s=0;for(let j=Math.floor(N/2)+1;j<=N;j++)s+=C(N,j)*Math.pow(p,j)*Math.pow(1-p,N-j);return s;}
  const Ns=[];for(let k=0;k<=12;k++)Ns.push(2*k+1);
  function plot(p,N){const W=cv.width,H=cv.height,L=46,R=14,T=14,B=30;c.clearRect(0,0,W,H);
    const X=n=>L+(n-1)/24*(W-L-R),Y=v=>T+(1-v)*(H-T-B);
    c.font='12px system-ui,sans-serif';c.fillStyle=css('--sub');c.strokeStyle=css('--line');c.lineWidth=1;
    [0,.25,.5,.75,1].forEach(g=>{c.beginPath();c.moveTo(L,Y(g));c.lineTo(W-R,Y(g));c.stroke();c.fillText(Math.round(g*100)+'%',6,Y(g)+4);});
    [1,5,9,13,17,21,25].forEach(n=>c.fillText('N='+n,X(n)-14,H-10));
    c.strokeStyle=css('--sub');c.setLineDash([5,5]);c.beginPath();c.moveTo(L,Y(p));c.lineTo(W-R,Y(p));c.stroke();c.setLineDash([]);
    c.strokeStyle=css('--accent');c.lineWidth=3;c.beginPath();Ns.forEach((n,i)=>i?c.lineTo(X(n),Y(maj(p,n))):c.moveTo(X(n),Y(maj(p,n))));c.stroke();
    c.fillStyle=css('--accent');Ns.forEach(n=>{c.beginPath();c.arc(X(n),Y(maj(p,n)),n===N?8:3,0,7);c.fill();});}
  function render(){const p=sp.value/100,N=2*sn.value+1;const m=maj(p,N);
    $('#sc-pv').textContent=Math.round(p*100)+'%';$('#sc-nv').textContent=N+' 遍';
    $('#sc-k1').textContent=(p*100).toFixed(0)+'%';$('#sc-k2').textContent=(m*100).toFixed(1)+'%';$('#sc-k3').textContent=N+' 倍';
    $('#sc-cap').textContent=N===1?'只写 1 遍时，投票等于没投。把 N 往右拖。':p>.5?`写 ${N} 遍取多数，准确率从 ${(p*100).toFixed(0)}% 升到 ${(m*100).toFixed(1)}%，代价是 ${N} 倍的计算。注意曲线越往右越平：多投的票，收益递减。`:p<.5?`p 低于 50% 时，错的票总是更多，投得越多越确定地选错：准确率从 ${(p*100).toFixed(0)}% 降到 ${(m*100).toFixed(1)}%。`:'p 正好 50%：投票既不帮忙也不添乱。';
    $('#sc-vote').innerHTML='';plot(p,N);}
  sp.addEventListener('input',render);sn.addEventListener('input',render);
  cv.addEventListener('pointerdown',e=>{const r=cv.getBoundingClientRect();const x=(e.clientX-r.left)/r.width*cv.width;const n=1+(x-46)/(cv.width-60)*24;sn.value=Math.max(0,Math.min(12,Math.round((n-1)/2)));render();});
  $('#sc-run').onclick=()=>{const p=sp.value/100,N=2*sn.value+1;const v=$('#sc-vote');v.innerHTML='';let k=0;
    for(let i=0;i<N;i++){const ok=Math.random()<p;k+=ok;const s=el('span',ok?'ok':'no',ok?'✓':'✗');s.style.animationDelay=(i*40)+'ms';v.append(s);}
    const win=k>N/2;$('#sc-cap').textContent=`这次 ${N} 票里 ${k} 票对、${N-k} 票错，多数投票的结果：${win?'答对 ✓':'答错 ✗'}。多点几次，答对的比例会接近上面的 ${(maj(p,N)*100).toFixed(1)}%。`;};
  render();
})();

/* ③ 可验证奖励的强化学习（玩具） */
(function(){
  const S=[{n:'直接答',acc:.30,len:20},{n:'写两步',acc:.55,len:90},{n:'分步算',acc:.80,len:240},{n:'再验算',acc:.95,len:420}];
  const INIT=[2.0,1.2,.5,0],ETA=4,G=8,MAXR=40;
  let th,R,hist,auto=null;const cv=$('#rl-cv'),c=cv.getContext('2d');
  const pi=()=>{const m=Math.max(...th),e=th.map(v=>Math.exp(v-m)),s=e.reduce((a,b)=>a+b,0);return e.map(v=>v/s);};
  const stat=p=>({acc:p.reduce((a,v,i)=>a+v*S[i].acc,0),len:p.reduce((a,v,i)=>a+v*S[i].len,0)});
  function reset(){clearInterval(auto);auto=null;th=INIT.slice();R=rng(7);hist=[stat(pi())];$('#rl-vote').innerHTML='';render('一开始，模型最常「直接答」，很少验算（初始习惯是设定的）。');}
  function step(){const p=pi();const picks=[],rw=[];
    for(let g=0;g<G;g++){let r=R(),a=0;for(;a<3;a++){r-=p[a];if(r<=0)break;}picks.push(a);rw.push(R()<S[a].acc?1:0);}
    const mean=rw.reduce((a,b)=>a+b,0)/G;const grad=[0,0,0,0];
    picks.forEach((a,g)=>{const A=rw[g]-mean;for(let i=0;i<4;i++)grad[i]+=A*((i===a?1:0)-p[i])/G;});
    for(let i=0;i<4;i++)th[i]+=ETA*grad[i];
    hist.push(stat(pi()));
    const v=$('#rl-vote');v.innerHTML='';picks.forEach((a,g)=>{const s=el('span',rw[g]?'ok':'no',String(a+1));s.title=S[a].n;s.style.animationDelay=(g*40)+'ms';v.append(s);});
    const ok=rw.reduce((a,b)=>a+b,0);
    render(`第 ${hist.length-1} 轮：8 遍里答对 ${ok} 遍（方块里的数字是用了第几种习惯）。${mean===0||mean===1?'这 8 遍全对或全错，没有可比的，这一轮不更新。':'答对的那几遍所用的习惯被加强了。'}`);}
  function plot(){const W=cv.width,H=cv.height,L=40,R2=40,T=12,B=26;c.clearRect(0,0,W,H);
    const X=i=>L+i/MAXR*(W-L-R2),YA=v=>T+(1-v)*(H-T-B),YL=v=>T+(1-v/450)*(H-T-B);
    c.font='12px system-ui,sans-serif';c.strokeStyle=css('--line');c.lineWidth=1;c.fillStyle=css('--sub');
    [0,.5,1].forEach(g=>{c.beginPath();c.moveTo(L,YA(g));c.lineTo(W-R2,YA(g));c.stroke();c.fillText(Math.round(g*100)+'%',4,YA(g)+4);});
    c.fillText('0',W-R2+6,YL(0)+4);c.fillText('450',W-R2+4,YL(450)+10);c.fillText('第 '+MAXR+' 轮',W-R2-44,H-8);c.fillText('第 0 轮',L,H-8);
    [['acc','--green',YA],['len','--blue',YL]].forEach(([k,col,Y])=>{c.strokeStyle=css(col);c.lineWidth=3;c.beginPath();hist.forEach((h,i)=>i?c.lineTo(X(i),Y(h[k])):c.moveTo(X(i),Y(h[k])));c.stroke();});}
  function render(cap){const p=pi(),s=stat(p);
    bars($('#rl-bars'),S.map((x,i)=>({w:'①②③④'[i]+x.n,p:p[i],label:(p[i]*100).toFixed(0)+'%'})));
    $('#rl-bars').querySelectorAll('.w').forEach((w,i)=>{w.style.fontSize='14px';w.title=`答对率 ${S[i].acc*100}%，约 ${S[i].len} token`;});
    $('#rl-k0').textContent=hist.length-1;$('#rl-k1').textContent=(s.acc*100).toFixed(0)+'%';$('#rl-k2').textContent=Math.round(s.len);
    if(hist.length-1>=MAXR)cap+=` 已训练 ${MAXR} 轮：奖励只看答对，回答却从平均约 ${Math.round(hist[0].len)} 个 token 变成约 ${Math.round(s.len)} 个。在这个玩具里，长是因为「验算」本身更长又更准，这和 R1-Zero 回答自己越写越长是同一个道理。`;
    $('#rl-cap').textContent=cap;plot();
    $('#rl-one').disabled=$('#rl-auto').disabled=hist.length-1>=MAXR;}
  $('#rl-one').onclick=()=>{if(hist.length-1<MAXR)step();};
  $('#rl-auto').onclick=()=>{if(auto)return;auto=setInterval(()=>{if(hist.length-1>=MAXR){clearInterval(auto);auto=null;return;}step();},reduce?0:120);};
  $('#rl-reset').onclick=reset;
  const lbl=el('p','lbl','4 种习惯的设定：①直接答：答对率 30%、约 20 token；②写两步：55%、约 90；③分步算：80%、约 240；④分步算完再验算：95%、约 420。');$('#rl-bars').before(lbl);
  reset();
})();
})();
