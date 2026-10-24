(function(){
"use strict";
const {$,el,reduce}=window.AI;
const css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
function ctx2(cv){const c=cv.getContext('2d');return c;}
function ptr(cv,e){const r=cv.getBoundingClientRect();return {x:(e.clientX-r.left)*cv.width/r.width,y:(e.clientY-r.top)*cv.height/r.height};}
function dragOn(cv,fn){let down=false;cv.addEventListener('pointerdown',e=>{down=true;cv.setPointerCapture(e.pointerId);fn(ptr(cv,e),'down');});cv.addEventListener('pointermove',e=>{if(down)fn(ptr(cv,e),'move');});const up=()=>{down=false;};cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);}

/* ① 数据清洗 */
(function(){
  const D=[
   {t:'猫咪为什么喜欢晒太阳？因为阳光能帮它们保持体温，还能让毛发干燥。',k:[]},
   {t:'首页 | 登录 | 注册 | 购物车(0) | 联系我们 | 网站地图 | 返回顶部',k:['q']},
   {t:'猫咪为什么喜欢晒太阳？因为阳光能帮它们保持体温，还能让毛发干燥。',k:['d']},
   {t:'Photosynthesis converts light energy into chemical energy stored in glucose.',k:['l']},
   {t:'便宜 便宜 最便宜 特价 特价 点击 点击 点击 立即购买 包邮',k:['q']},
   {t:'黄河发源于青藏高原，流经九个省区，最后注入渤海。',k:[]},
   {t:'有问题请联系张经理，电话 138xxxx5678，邮箱 zhang@example.com。',k:['p']},
   {t:'牛顿第一定律：物体在不受外力时，保持静止或匀速直线运动。',k:[]},
   {t:'黄河发源于青藏高原，流经九个省区，最后注入渤海。（转载）',k:['d']},
   {t:'锟斤拷烫烫烫锟斤拷�����烫烫烫',k:['q']}
  ];
  const F=[['d','去重复'],['q','去低质量'],['l','只留中文'],['p','隐去个人信息']];
  const on=new Set();const box=$('#flt-docs'),kpi=$('#flt-kpi');
  const why={d:'重复',q:'低质量',l:'非中文',p:'含个人信息'};
  F.forEach(([k,n])=>{const b=el('button',null,n);b.onclick=()=>{on.has(k)?on.delete(k):on.add(k);b.classList.toggle('on',on.has(k));render();};$('#flt-btns').append(b);});
  function render(){
    box.innerHTML='';let keep=0,chars=0,all=0;
    D.forEach(d=>{const c=el('div','doc');let txt=d.t;const out=d.k.some(k=>on.has(k)&&k!=='p');
      if(d.k.includes('p')&&on.has('p'))txt=txt.replace(/138xxxx5678/,'[电话]').replace(/zhang@example\.com/,'[邮箱]');
      c.append(txt);const tg=el('div','tags');d.k.forEach(k=>{const s=el('span',(on.has(k)?'why':''),why[k]);tg.append(s);});if(d.k.length)c.append(tg);
      if(out)c.classList.add('out');else{keep++;chars+=txt.length;}all+=d.t.length;box.append(c);});
    kpi.innerHTML=`<div class="kpi">留下的网页<b class="ac">${keep} / ${D.length}</b></div><div class="kpi">留下的字数<b>${chars}</b></div><div class="kpi">扔掉了<b>${Math.round((1-chars/all)*100)}%</b></div>`;
  }
  render();
})();

/* ② 罚分曲线 */
(function(){
  const cv=$('#loss-cv'),c=ctx2(cv),sl=$('#loss-p');const W=cv.width,H=cv.height,L=54,R=16,T=18,B=40;
  const X=p=>L+(p-0)/(1)*(W-L-R),Y=v=>T+(1-v/4.8)*(H-T-B);
  function draw(){
    const p=sl.value/100,v=-Math.log(p);
    c.clearRect(0,0,W,H);c.font='13px system-ui,sans-serif';c.fillStyle=css('--sub');c.strokeStyle=css('--line');c.lineWidth=1;
    for(let g=0;g<=4;g++){c.beginPath();c.moveTo(L,Y(g));c.lineTo(W-R,Y(g));c.stroke();c.fillText(g,L-18,Y(g)+4);}
    [0,25,50,75,100].forEach(q=>c.fillText(q+'%',X(q/100)-12,H-14));
    c.fillText('罚分',6,T+8);
    c.strokeStyle=css('--accent');c.lineWidth=3;c.beginPath();for(let i=1;i<=100;i++){const q=i/100;const y=Y(Math.min(4.8,-Math.log(q)));i===1?c.moveTo(X(q),y):c.lineTo(X(q),y);}c.stroke();
    c.setLineDash([4,4]);c.strokeStyle=css('--sub');c.lineWidth=1;c.beginPath();c.moveTo(X(p),Y(0));c.lineTo(X(p),Y(v));c.lineTo(L,Y(v));c.stroke();c.setLineDash([]);
    c.fillStyle=css('--accent');c.beginPath();c.arc(X(p),Y(Math.min(4.8,v)),9,0,7);c.fill();
    $('#loss-pv').textContent=Math.round(p*100)+'%';$('#loss-v').textContent=v.toFixed(2);
    $('#loss-cap').textContent=p>=.8?'很有把握又猜对了，几乎不罚。':p>=.4?'有一定把握，罚得不多。':p>=.1?'正确答案排得不靠前，罚分开始变大。':'几乎没想到会是「光」，罚得很重。越往左曲线越陡：越离谱，罚得越狠。';
  }
  sl.addEventListener('input',draw);
  dragOn(cv,pt=>{const p=Math.max(.01,Math.min(.99,(pt.x-L)/(W-L-R)));sl.value=Math.round(p*100);draw();});
  draw();matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change',draw);
})();

/* ③ 梯度下降 */
(function(){
  const cv=$('#gd-cv'),c=ctx2(cv);const W=cv.width,H=cv.height,L=20,R=20,T=20,B=30;
  const f=x=>.05*x**4-.6*x*x+.3*x+2,df=x=>.2*x**3-1.2*x+.3;
  const X=x=>L+(x+4.2)/8.4*(W-L-R),Y=v=>T+(1-(v+1)/9.5)*(H-T-B),IX=px=>(px-L)/(W-L-R)*8.4-4.2;
  let x0=3.6,x=x0,trail=[x],n=0,timer=null,lr=.3,dead=false;
  function draw(){
    c.clearRect(0,0,W,H);
    c.fillStyle=css('--blue-soft');c.beginPath();c.moveTo(X(-4.2),H-B);for(let i=0;i<=200;i++){const xx=-4.2+8.4*i/200;c.lineTo(X(xx),Y(f(xx)));}c.lineTo(X(4.2),H-B);c.fill();
    c.strokeStyle=css('--blue');c.lineWidth=3;c.beginPath();for(let i=0;i<=200;i++){const xx=-4.2+8.4*i/200;i?c.lineTo(X(xx),Y(f(xx))):c.moveTo(X(xx),Y(f(xx)));}c.stroke();
    c.font='13px system-ui,sans-serif';c.fillStyle=css('--sub');c.fillText('最低点',X(-2.57)-20,Y(f(-2.57))+24);c.fillText('小坑',X(2.33)-14,Y(f(2.33))+24);c.fillText('旋钮位置 →',W-R-80,H-8);
    c.strokeStyle=css('--accent');c.lineWidth=1.5;c.setLineDash([3,3]);c.beginPath();trail.forEach((t,i)=>{const tx=Math.max(-4.2,Math.min(4.2,t));i?c.lineTo(X(tx),Y(Math.min(8.5,f(tx)))):c.moveTo(X(tx),Y(Math.min(8.5,f(tx))));});c.stroke();c.setLineDash([]);
    trail.slice(0,-1).forEach(t=>{if(Math.abs(t)<=4.2){c.fillStyle=css('--accent');c.globalAlpha=.3;c.beginPath();c.arc(X(t),Y(f(t)),4,0,7);c.fill();c.globalAlpha=1;}});
    if(Math.abs(x)<=4.2){c.fillStyle=css('--accent');c.beginPath();c.arc(X(x),Y(f(x))-2,11,0,7);c.fill();c.strokeStyle='#fff';c.lineWidth=2;c.stroke();
      const g=df(x);c.strokeStyle=css('--gold');c.lineWidth=3;const dir=-Math.sign(g);if(Math.abs(g)>.02){c.beginPath();c.moveTo(X(x),Y(f(x))-22);c.lineTo(X(x)+dir*Math.min(60,20+Math.abs(g)*25),Y(f(x))-22);c.stroke();}}
    $('#gd-n').textContent=n;$('#gd-l').textContent=dead?'飞出去了':f(x).toFixed(2);
  }
  function step(){if(dead)return false;const g=df(x);const nx=x-lr*g;trail.push(nx);x=nx;n++;
    if(Math.abs(x)>6||!isFinite(x)){dead=true;$('#gd-cap').textContent='步子太大，小球越跳越高，直接飞出了画面：这就是学习率太大导致训练「发散」。调小学习率再试。';draw();return false;}
    draw();if(Math.abs(g)<1e-3){$('#gd-cap').textContent=f(x)<0?'停在了最低点附近：坡度几乎为 0，再走也不动了。':'停在了右边的「小坑」里：这里坡度也是 0，小球不知道左边还有更低的地方。真实模型的地形有无数个这样的坑，不过在超高维空间里，这通常没有想象中那么糟。';return false;}return true;}
  function stop(){clearInterval(timer);timer=null;$('#gd-run').textContent='▶ 连续走';}
  function reset(nx){stop();x0=nx!=null?nx:x0;x=x0;trail=[x];n=0;dead=false;draw();}
  $('#gd-run').onclick=()=>{if(timer){stop();return;}if(dead)reset();$('#gd-run').textContent='❚❚ 暂停';timer=setInterval(()=>{if(!step()||n>=120)stop();},reduce?30:260);};
  $('#gd-step').onclick=()=>{stop();step();};$('#gd-reset').onclick=()=>reset();
  const sl=$('#gd-lr');const setLr=()=>{lr=+sl.value;$('#gd-lrv').textContent=lr.toFixed(2);$('#gd-lrd').textContent=lr<.1?'很小：走得很慢':lr<=.8?'适中':'很大：可能乱跳';};sl.addEventListener('input',setLr);setLr();
  dragOn(cv,pt=>reset(Math.max(-4,Math.min(4,IX(pt.x)))));
  draw();
})();

/* ④ 迷你模型：真正用梯度下降训练的二元模型 */
(function(){
  const C={
   '唐诗':`床前明月光\n疑是地上霜\n举头望明月\n低头思故乡\n白日依山尽\n黄河入海流\n欲穷千里目\n更上一层楼\n春眠不觉晓\n处处闻啼鸟\n夜来风雨声\n花落知多少\n红豆生南国\n春来发几枝\n愿君多采撷\n此物最相思\n千山鸟飞绝\n万径人踪灭\n孤舟蓑笠翁\n独钓寒江雪\n松下问童子\n言师采药去\n只在此山中\n云深不知处\n锄禾日当午\n汗滴禾下土\n谁知盘中餐\n粒粒皆辛苦\n离离原上草\n一岁一枯荣\n野火烧不尽\n春风吹又生`,
   '日常':`今天天气很好\n我们去公园散步吧\n我想吃火锅\n小猫喜欢晒太阳\n小狗在门口等主人\n妈妈在厨房做饭\n这家店的面条很好吃\n明天我想去图书馆看书\n春天来了花都开了\n你今天吃饭了吗\n周末我们一起去看电影吧\n今天下雨了记得带伞\n我喜欢喝热茶\n天空很蓝白云很白\n谢谢你的帮助\n祝你天天开心`
  };
  let lines=[],V=[],idx=new Map(),cnt,rowN,Wt,N=0,opt=0,steps=0,hist=[],timer=null,name='唐诗';
  const cv=$('#mini-cv'),c=cv.getContext('2d'),ta=$('#mini-text');
  function setup(text){
    lines=text.split(/\n+/).map(s=>s.replace(/[\s，。！？、,.!?]/g,'')).filter(Boolean);
    const chars=new Set();lines.forEach(l=>[...l].forEach(ch=>chars.add(ch)));
    V=['^','$',...chars];idx=new Map(V.map((v,i)=>[v,i]));const n=V.length;
    cnt=Array.from({length:n},()=>new Float64Array(n));rowN=new Float64Array(n);N=0;
    lines.forEach(l=>{const t=['^',...l,'$'];for(let i=0;i<t.length-1;i++){const a=idx.get(t[i]),b=idx.get(t[i+1]);cnt[a][b]++;rowN[a]++;N++;}});
    Wt=Array.from({length:n},()=>new Float64Array(n));
    opt=0;for(let a=0;a<n;a++)for(let b=0;b<n;b++)if(cnt[a][b])opt-=cnt[a][b]*Math.log(cnt[a][b]/rowN[a]);opt/=N;
    steps=0;hist=[loss()];$('#mini-p').textContent=(n*n).toLocaleString();upd();draw();sample();
  }
  function soft(row){let m=-1e9;for(const v of row)m=Math.max(m,v);let z=0;const p=new Float64Array(row.length);for(let i=0;i<row.length;i++){p[i]=Math.exp(row[i]-m);z+=p[i];}for(let i=0;i<p.length;i++)p[i]/=z;return p;}
  function loss(){let L=0;for(let a=0;a<V.length;a++){if(!rowN[a])continue;const p=soft(Wt[a]);for(let b=0;b<V.length;b++)if(cnt[a][b])L-=cnt[a][b]*Math.log(p[b]);}return L/N;}
  const LR=1.2;
  function train(){ // 一步梯度下降：每行的梯度 = 预测概率 − 实际频率
    for(let a=0;a<V.length;a++){if(!rowN[a])continue;const p=soft(Wt[a]);const r=Wt[a],ct=cnt[a],na=rowN[a];
      for(let b=0;b<V.length;b++)r[b]-=LR*(p[b]-ct[b]/na);}
    steps++;hist.push(loss());
  }
  function sample(){
    const out=[];for(let k=0;k<3;k++){let cur=0,s='';for(let i=0;i<14;i++){const p=soft(Wt[cur]);let r=Math.random(),j=0;for(;j<p.length-1;j++){r-=p[j];if(r<=0)break;}if(j===1)break;if(j===0)continue;s+=V[j];cur=j;}out.push(s||'（什么都没写就结束了）');}
    $('#mini-sample').innerHTML='';out.forEach(s=>$('#mini-sample').append(el('div',null,s)));
  }
  function upd(){$('#mini-n').textContent=steps;$('#mini-l').textContent=hist[hist.length-1].toFixed(3);}
  function draw(){
    const W=cv.width,H=cv.height,L=40,R=12,T=14,B=26;c.clearRect(0,0,W,H);
    const ymax=Math.log(V.length)*1.02,xmax=Math.max(60,hist.length-1);
    const X=i=>L+i/xmax*(W-L-R),Y=v=>T+(1-v/ymax)*(H-T-B);
    c.font='12px system-ui,sans-serif';c.fillStyle=css('--sub');c.strokeStyle=css('--line');c.lineWidth=1;
    for(let g=0;g<=4;g++){const v=ymax*g/4;c.beginPath();c.moveTo(L,Y(v));c.lineTo(W-R,Y(v));c.stroke();c.fillText(v.toFixed(1),4,Y(v)+4);}
    c.fillText('训练步数 →',W-R-74,H-6);
    c.strokeStyle=css('--blue');c.setLineDash([6,5]);c.lineWidth=2;c.beginPath();c.moveTo(L,Y(opt));c.lineTo(W-R,Y(opt));c.stroke();c.setLineDash([]);
    c.strokeStyle=css('--accent');c.lineWidth=3;c.beginPath();hist.forEach((v,i)=>i?c.lineTo(X(i),Y(v)):c.moveTo(X(i),Y(v)));c.stroke();
  }
  function stop(){cancelAnimationFrame(timer);timer=null;$('#mini-run').textContent=steps?'▶ 继续训练':'▶ 开始训练';}
  function run(){let k=0;const loop=()=>{for(let i=0;i<(reduce?10:1);i++)train();k++;upd();draw();if(k%15===0)sample();
      if(hist[hist.length-1]-opt<.01||steps>=600){stop();sample();return;}timer=requestAnimationFrame(loop);};timer=requestAnimationFrame(loop);$('#mini-run').textContent='❚❚ 暂停';}
  $('#mini-run').onclick=()=>timer?stop():run();
  $('#mini-reset').onclick=()=>{stop();setup(name==='自己写'?ta.value||'你好':C[name]);stop();};
  ['唐诗','日常','自己写'].forEach(n=>{const b=el('button',n===name?'on':'',n);b.onclick=()=>{name=n;document.querySelectorAll('#mini-corpus button').forEach(x=>x.classList.toggle('on',x===b));ta.hidden=n!=='自己写';stop();setup(n==='自己写'?(ta.value||'在这里输入你自己的句子\n每行一句'):C[n]);stop();};$('#mini-corpus').append(b);});
  let tt;ta.addEventListener('input',()=>{clearTimeout(tt);tt=setTimeout(()=>{stop();setup(ta.value||'你好');stop();},400);});
  setup(C[name]);
  AI.onVisible(cv,v=>{if(!v&&timer)stop();});
})();

/* 规模小算盘 */
(function(){
  const s=$('#sc-n');const real={'8e9':['超过 15 万亿 token',15e12],'7e10':['超过 15 万亿 token',15e12],'4.05e11':['15.6 万亿 token',15.6e12]};
  const fmt=t=>t>=1e12?(t/1e12).toFixed(t>=1e13?0:1)+' 万亿':(t/1e8).toFixed(0)+' 亿';
  function up(){const n=+s.value,o=20*n;$('#sc-opt').textContent=fmt(o)+' token';const r=real[s.value];
    $('#sc-real').textContent=r?r[0]:'（Llama 3 没有这个尺寸）';
    $('#sc-cap').textContent=r?`实际数据量是「最划算配比」的约 ${Math.round(r[1]/o)} 倍。${r[1]/o>5?'这就是故意「多读」：训练多花钱，换来一个用起来便宜又够强的小模型。':'旗舰模型大致贴着最优配比训练。'}`:'按 20 倍配比：10 亿参数配约 200 亿个 token。';}
  s.onchange=up;up();
})();
})();
