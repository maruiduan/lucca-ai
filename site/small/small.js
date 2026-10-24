(function(){
"use strict";
const {$,el,bars,rng}=window.AI;
const css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const NS='http://www.w3.org/2000/svg';
const sv=(t,a,txt)=>{const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);if(txt!=null)e.textContent=txt;return e;};
function segs(box,items,cur,cb){items.forEach(([k,n])=>{const b=el('button',k===cur?'on':'',n);b.onclick=()=>{[...box.children].forEach(c=>c.classList.toggle('on',c===b));cb(k);};box.append(b);});}

/* ① 软标签与温度 */
(function(){
  const C=[['轿车',9],['跑车',6.5],['垃圾车',3],['自行车',1],['胡萝卜',-3]];
  let mode='soft';const sl=$('#kd-t');
  function soft(T){const z=C.map(c=>c[1]/T),m=Math.max(...z),e=z.map(v=>Math.exp(v-m)),s=e.reduce((a,b)=>a+b,0);return e.map(v=>v/s);}
  const fmt=p=>p>=.1?(p*100).toFixed(0)+'%':p>=.001?(p*100).toFixed(1)+'%':p>=1e-6?(p*100).toFixed(4)+'%':'≈0';
  function render(){const T=+sl.value;$('#kd-tv').textContent=T.toFixed(1);$('#kd-tw').style.display=mode==='soft'?'':'none';
    if(mode==='hard'){bars($('#kd-bars'),C.map((c,i)=>({w:c[0],p:i?0:1,label:i?'0':'100%',hi:!i})));
      $('#kd-cap').textContent='标准答案（硬标签）只说「这是轿车」。垃圾车和胡萝卜都是 0，学生看不出哪个错得更离谱。';return;}
    const p=soft(T);bars($('#kd-bars'),C.map((c,i)=>({w:c[0],p:p[i],label:fmt(p[i]),hi:!i,scale:Math.max(p[i],.004)})));
    $('#kd-cap').textContent=T<2?`T=1 时，「垃圾车」只有 ${fmt(p[2])}，「胡萝卜」只有 ${fmt(p[4])}：小概率几乎看不见，学生很难从中学到东西。往右拖温度。`:`T=${T.toFixed(1)} 时概率表变软了，但顺序不变：轿车 > 跑车 > 垃圾车 > 自行车 > 胡萝卜。「跑车、垃圾车也有点像，胡萝卜最不像」这层暗知识清楚地露了出来。`;}
  segs($('#kd-mode'),[['hard','只给标准答案'],['soft','给老师的概率表']],mode,k=>{mode=k;render();});
  sl.addEventListener('input',render);render();
})();

/* ② 量化 */
(function(){
  const r=rng(11);const BASE=[];
  for(let i=0;i<48;i++){const u=Math.max(1e-9,r()),v=r();BASE.push(Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)*.1);}
  let out=false,grp=false;const sl=$('#q-b'),cv=$('#q-cv'),c=cv.getContext('2d');
  const W=()=>{const w=BASE.slice();if(out)w[29]=.95;return w;};
  function quant(w,b){const L=Math.pow(2,b-1)-1;const G=grp?8:w.length;const q=[],sc=[];
    for(let g=0;g<w.length;g+=G){const part=w.slice(g,g+G);const m=Math.max(...part.map(Math.abs))||1;const s=m/L;part.forEach(x=>{q.push(Math.round(x/s)*s);sc.push(s);});}
    return {q,sc,L};}
  function render(){const b=+sl.value,w=W(),{q,sc,L}=quant(w,b);
    const err=w.reduce((a,x,i)=>a+Math.abs(x-q[i]),0)/w.length,mag=w.reduce((a,x)=>a+Math.abs(x),0)/w.length;
    const zero=w.filter((x,i)=>x!==0&&q[i]===0).length;
    $('#q-bv').textContent=b+' 位';$('#q-k1').textContent=(2*L+1)+' 档';$('#q-k2').textContent=(err/mag*100).toFixed(1)+'%';$('#q-k3').textContent=Math.round(70*b/8)+' GB';
    const Wd=cv.width,H=cv.height,Lp=10,R=10,T=12,B=12;c.clearRect(0,0,Wd,H);
    const hi=Math.max(...w.map(Math.abs))*1.08;const X=i=>Lp+(i+.5)/w.length*(Wd-Lp-R),Y=v=>T+(hi-v)/(2*hi)*(H-T-B);
    c.strokeStyle=css('--line');c.lineWidth=1;
    if(!grp){const s=sc[0];for(let k=-L;k<=L;k++){const y=Y(k*s);if(y<T-2||y>H-B+2)continue;c.beginPath();c.moveTo(Lp,y);c.lineTo(Wd-R,y);c.stroke();}}
    else{for(let g=0;g<w.length;g+=8){const s=sc[g];for(let k=-L;k<=L;k++){const y=Y(k*s);if(y<T-2||y>H-B+2)continue;c.beginPath();c.moveTo(X(g)-5,y);c.lineTo(X(Math.min(g+7,w.length-1))+5,y);c.stroke();}}}
    c.strokeStyle=css('--ink');c.globalAlpha=.4;c.beginPath();c.moveTo(Lp,Y(0));c.lineTo(Wd-R,Y(0));c.stroke();c.globalAlpha=1;
    w.forEach((x,i)=>{c.strokeStyle=css('--accent');c.lineWidth=1.5;c.beginPath();c.moveTo(X(i),Y(x));c.lineTo(X(i),Y(q[i]));c.stroke();
      c.fillStyle=css('--sub');c.beginPath();c.arc(X(i),Y(x),4,0,7);c.fill();
      c.fillStyle=css('--accent');c.fillRect(X(i)-4,Y(q[i])-2,8,4);});
    let cap;
    if(out&&!grp)cap=`有了一个特别大的离群值，最大的那一档被它占去，其余 47 个小参数挤在中间寥寥几档里，${zero} 个被直接舍成了 0，误差暴增。这正是 LLM.int8() 要单独处理离群特征的原因。试试「分组量化」。`;
    else if(out&&grp)cap='分组后，每 8 个参数单独定一个缩放比例：离群值只影响它自己那一组，其他组照样精细。真实的量化格式几乎都是这样分组的（代价是每组要多存一个缩放比例）。';
    else cap=b>=8?`8 位有 ${2*L+1} 档，红色短线（量化后）和灰点（原始值）几乎重合。文件比 16 位小一半。`:b<=3?`只剩 ${2*L+1} 档，很多参数被挪得很远，模型质量会明显受损。`:`${b} 位有 ${2*L+1} 档：每个参数都被挪到最近的一档，红线就是挪动的距离。文件只有 16 位时的 ${b}/16。`;
    $('#q-cap').textContent=cap;}
  sl.addEventListener('input',render);
  $('#q-out').onclick=()=>{out=!out;$('#q-out').classList.toggle('on',out);render();};
  $('#q-grp').onclick=()=>{grp=!grp;$('#q-grp').classList.toggle('on',grp);render();};
  cv.addEventListener('pointerdown',()=>{out=!out;$('#q-out').classList.toggle('on',out);render();});
  render();
})();

/* ③ 内存估算 */
(function(){
  const P=[[1.5,'1.5B'],[7,'7B'],[14,'14B'],[32,'32B'],[70,'70B'],[405,'405B']];
  const Bt=[[16,'16 位'],[8,'8 位'],[4,'4 位']];
  const D=[[8,'8 GB'],[16,'16 GB'],[24,'24 GB'],[48,'48 GB'],[80,'80 GB'],[192,'192 GB']];
  let p=7,b=4,d=16;const svg=$('#mem-fig');
  const gb=v=>v>=100?Math.round(v)+' GB':v.toFixed(1)+' GB';
  function render(){const m=p*b/8,need=m*1.2,fit=need<=d;
    $('#mem-k1').textContent=gb(m);$('#mem-k2').textContent=gb(need);$('#mem-k3').textContent=fit?'装得下':'装不下';
    const maxP=d/1.2/(b/8);
    $('#mem-cap').textContent=`${p}B 个参数 × ${b/8} 字节 = ${gb(m)}。`+(fit?`${d} GB 的设备装得下，还剩约 ${gb(d-need)}。`:`${d} GB 不够。`)+`按 ${b} 位算，这台设备大约能装下 ${maxP>=10?Math.round(maxP):maxP.toFixed(1)}B 以内的模型。`+(b===16&&!fit?'试试把精度降到 4 位。':'');
    svg.innerHTML='';const full=Math.max(d,need)*1.05,X=v=>10+v/full*340;
    svg.append(sv('text',{x:10,y:14,'font-size':11,fill:css('--sub')},'设备内存'));
    svg.append(sv('rect',{x:10,y:20,width:X(d)-10,height:18,rx:5,fill:css('--blue'),opacity:.3}));
    svg.append(sv('text',{x:10,y:58,'font-size':11,fill:css('--sub')},'模型 + 余量'));
    svg.append(sv('rect',{x:10,y:64,width:Math.max(2,X(m)-10),height:18,rx:5,fill:fit?css('--green'):css('--accent')}));
    svg.append(sv('rect',{x:X(m),y:64,width:Math.max(1,X(need)-X(m)),height:18,rx:5,fill:fit?css('--green'):css('--accent'),opacity:.4}));
    svg.append(sv('line',{x1:X(d),x2:X(d),y1:16,y2:86,stroke:css('--ink'),'stroke-dasharray':'3 3'}));}
  segs($('#mem-p'),P,p,k=>{p=k;render();});segs($('#mem-b'),Bt,b,k=>{b=k;render();});segs($('#mem-d'),D,d,k=>{d=k;render();});
  render();
})();
})();
