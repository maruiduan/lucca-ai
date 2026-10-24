(function(){
"use strict";
const {$,el,bars,rng}=window.AI;
const css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();

/* ① 熟题与冷题 */
(function(){
  const Q=[
   {n:'熟题',q:'《静夜思》的作者是 ___',d:[['李白',.93],['杜甫',.03],['王维',.02],['白居易',.01],['其他',.01]]},
   {n:'冷题',q:'一位小镇诗人（网上只提到过一次）的生日是 ___',d:[['3月12日',.09],['9月10日',.08],['5月3日',.07],['11月21日',.07],['1月8日',.06],['7月30日',.06],['其他日期',.57]]}
  ];
  let qi=0;
  Q.forEach((x,i)=>{const b=el('button',i?'':'on',x.n);b.onclick=()=>{qi=i;[...$('#fam-q').children].forEach(c=>c.classList.toggle('on',c===b));render();};$('#fam-q').append(b);});
  const OTHER=['2月14日','6月6日','10月1日','4月18日','8月25日','12月9日','1月23日','3月30日'];
  function draw(){const d=Q[qi].d;let r=Math.random();for(const [w,p] of d){r-=p;if(r<=0)return w==='其他日期'?OTHER[Math.floor(Math.random()*OTHER.length)]:w==='其他'?'杜牧':w;}return d[0][0];}
  function render(){const x=Q[qi];$('#fam-prompt').textContent=x.q;bars($('#fam-bars'),x.d.map(([w,p])=>({w,p})));$('#fam-ans').innerHTML='';$('#fam-cap').textContent='';}
  $('#fam-ask').onclick=()=>{const a=[];for(let i=0;i<5;i++)a.push(draw());const box=$('#fam-ans');box.innerHTML='';
    a.forEach((w,i)=>{const s=el('span',null,'');s.textContent=w;s.style.cssText='width:auto;padding:0 8px;height:32px;font-size:13px;background:var(--blue);animation-delay:'+(i*80)+'ms';box.append(s);});
    const u=new Set(a).size;$('#fam-cap').textContent=u===1?`5 次答案完全一样（${a[0]}）：概率表很「尖」，模型有把握。`:`5 次给出了 ${u} 种答案，每次都说得很肯定：概率表很「平」，它其实不知道，只是每次都抽了一个写出来。`;};
  render();
})();

/* ② 考试模拟 */
(function(){
  const r=rng(42);const C=[];
  for(let i=0;i<40;i++)C.push(.85+r()*.14);for(let i=0;i<30;i++)C.push(.5+r()*.3);for(let i=0;i<30;i++)C.push(.03+r()*.37);
  let pen=3;const sl=$('#ex-t'),cv=$('#exam-cv'),c=cv.getContext('2d');
  [[1,'答错扣 1 分'],[3,'答错扣 3 分']].forEach(([k,n])=>{const b=el('button',k===pen?'on':'',n);b.onclick=()=>{pen=k;[...$('#ex-pen').children].forEach(x=>x.classList.toggle('on',x===b));render();};$('#ex-pen').append(b);});
  function stat(t){let a=0,e=0,s=0;C.forEach(p=>{if(p>t){a+=p;e+=1-p;}else s++;});return {a,e,s,s1:a,s2:a-pen*e};}
  function plot(t){const W=cv.width,H=cv.height,L=44,R=14,T=14,B=30;c.clearRect(0,0,W,H);
    const ts=[];for(let v=0;v<=95;v+=1)ts.push(v/100);const S=ts.map(stat);
    const lo=Math.min(-10,...S.map(s=>s.s2)),hi=80;const X=v=>L+v/.95*(W-L-R),Y=v=>T+(hi-v)/(hi-lo)*(H-T-B);
    c.font='12px system-ui,sans-serif';c.fillStyle=css('--sub');c.strokeStyle=css('--line');
    [hi,40,0,lo].forEach(g=>{c.beginPath();c.moveTo(L,Y(g));c.lineTo(W-R,Y(g));c.stroke();c.fillText(Math.round(g),6,Y(g)+4);});
    [0,.25,.5,.75,.95].forEach(v=>c.fillText(Math.round(v*100)+'%',X(v)-12,H-10));
    [['s1','--blue'],['s2','--accent']].forEach(([k,col])=>{c.strokeStyle=css(col);c.lineWidth=3;c.beginPath();S.forEach((s,i)=>i?c.lineTo(X(ts[i]),Y(s[k])):c.moveTo(X(ts[i]),Y(s[k])));c.stroke();});
    c.strokeStyle=css('--ink');c.setLineDash([4,4]);c.lineWidth=1;c.beginPath();c.moveTo(X(t),T);c.lineTo(X(t),H-B);c.stroke();c.setLineDash([]);
    const s=stat(t);[['s1','--blue'],['s2','--accent']].forEach(([k,col])=>{c.fillStyle=css(col);c.beginPath();c.arc(X(t),Y(s[k]),7,0,7);c.fill();});}
  function render(){const t=sl.value/100;const s=stat(t);$('#ex-tv').textContent=Math.round(t*100)+'%';
    $('#ex-a').textContent=s.a.toFixed(0);$('#ex-e').textContent=s.e.toFixed(0);$('#ex-s').textContent=s.s;$('#ex-s1').textContent=s.s1.toFixed(1);$('#ex-s2').textContent=s.s2.toFixed(1);
    let best=0,bv=-1e9;for(let v=0;v<=95;v+=5){const x=stat(v/100).s2;if(x>bv){bv=x;best=v;}}
    $('#ex-cap').textContent=t===0?`门槛为 0：每题都答。「只算答对」时这就是最高分，但也产生了约 ${s.e.toFixed(0)} 个错误回答。`:`门槛提高后，答错的少了，「只算答对」的分却只降不升，所以只看准确率的评测永远鼓励瞎猜。而在「答错扣 ${pen} 分」的规则下，门槛约 ${best}% 时得分最高。`;
    plot(t);}
  sl.addEventListener('input',render);
  cv.addEventListener('pointerdown',e=>{const rc=cv.getBoundingClientRect();const x=(e.clientX-rc.left)/rc.width*cv.width;const v=Math.max(0,Math.min(95,Math.round(((x-44)/(cv.width-58)*.95*100)/5)*5));sl.value=v;render();});
  render();
})();

/* ③ strawberry */
(function(){
  const T=['str','aw','berry'];const box=$('#sb-chips');let open=false;
  function render(){box.innerHTML='';
    T.forEach((t,i)=>{const c=el('span','chip c'+i);if(!open){c.append(t);c.append(el('i',null,'token '+(i+1)));}else{c.style.flexDirection='row';c.style.gap='2px';[...t].forEach(ch=>{const s=el('b',null,ch);s.style.cssText='font-weight:'+(ch==='r'?'700':'400')+';color:'+(ch==='r'?'var(--accent)':'inherit')+';padding:0 1px';c.append(s);});}box.append(c);});
    $('#sb-cap').textContent=open?'拆开以后一目了然：s-t-r-a-w-b-e-r-r-y，一共 3 个 r（第一块 1 个，最后一块 2 个）。可模型平时看不到这一层，它只看到 3 块 token。':'在模型眼里，这个词只是 3 块 token（比如上面这种切法）。字母 r 藏在块的里面，它没法像我们一样「看」着去数。';
    $('#sb-open').textContent=open?'合上，回到 token':'拆开看看里面的字母';}
  $('#sb-open').onclick=()=>{open=!open;render();};render();
})();
})();
