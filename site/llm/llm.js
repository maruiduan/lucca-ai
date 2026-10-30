(function(){
"use strict";
const $=s=>document.querySelector(s);
const el=(t,c,txt)=>{const e=document.createElement(t);if(c)e.className=c;if(txt!=null)e.textContent=txt;return e;};
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
$('#y').textContent=new Date().getFullYear();

/* ---------- 阅读进度 & 字号 ---------- */
const prog=$('#progress');
let pt=false;addEventListener('scroll',()=>{if(pt)return;pt=true;requestAnimationFrame(()=>{pt=false;const h=document.documentElement;prog.style.transform='scaleX('+(h.scrollTop/(h.scrollHeight-h.clientHeight))+')';});},{passive:true});
// Storage is optional (private browsing / disabled storage must not break the page).
const art=$('#art');let storedFs=null;
try{storedFs=localStorage.getItem('ai-fs');}catch(e){}
let fs=Number(storedFs);if(!storedFs||!Number.isFinite(fs))fs=17;
fs=Math.max(14,Math.min(22,fs));
const setFs=v=>{fs=Math.max(14,Math.min(22,v));if(art)art.style.fontSize=fs+'px';try{localStorage.setItem('ai-fs',String(fs));}catch(e){}};
if(art&&storedFs!==null)art.style.fontSize=fs+'px';
if($('#fs-m'))$('#fs-m').onclick=()=>setFs(fs-1);
if($('#fs-p'))$('#fs-p').onclick=()=>setFs(fs+1);

/* ---------- 吸顶小栏 & 目录 ---------- */
(function(){
  const toc=$('#toc'),bar=$('#sbar'),cur=$('#sb-cur'),sheet=$('#sheet'),list=$('#sheet-list');
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
    list.querySelectorAll('a').forEach(a=>a.classList.toggle('cur',c&&a.getAttribute('href')==='#'+c.id));
  }
  addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(upd);}},{passive:true});upd();
})();

/* ---------- 时间线渐显 ---------- */
const evs=document.querySelectorAll('.ev');
if('IntersectionObserver' in window&&!reduce){
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}}),{rootMargin:'0px 0px -8% 0px'});
  evs.forEach(e=>io.observe(e));
}else evs.forEach(e=>e.classList.add('in'));

/* ---------- 玩具语料（已分好词，空格分隔） ---------- */
const CORPUS=`今天 天气 很 好 ， 我们 去 公园 散步 吧 。
今天 天气 很 好 ， 阳光 很 温暖 。
今天 天气 不错 ， 适合 出去 走走 。
今天 天气 不错 ， 我 想 去 爬山 。
今天 天气 有点 冷 ， 记得 多 穿 衣服 。
今天 天气 晴朗 ， 天空 很 蓝 。
今天 天气 怎么样 ？
今天 下雨 了 ， 记得 带 伞 。
今天 是 星期一 ， 我 要 去 上班 。
今天 晚上 我 想 吃 火锅 。
明天 天气 会 变 冷 。
明天 我 想 去 图书馆 看书 。
我 想 吃 火锅 。
我 想 吃 面条 。
我 想 吃 苹果 。
我 想 喝 一杯 茶 。
我 想 喝 一杯 咖啡 。
我 想 去 公园 散步 。
我 想 去 海边 看看 。
我 想 睡觉 了 。
我 喜欢 读书 。
我 喜欢 小猫 。
我 喜欢 春天 。
我 喜欢 喝 茶 。
我们 去 公园 散步 吧 。
我们 去 吃 火锅 吧 。
我们 一起 去 看 电影 吧 。
小猫 喜欢 吃 鱼 。
小猫 喜欢 晒 太阳 。
小猫 喜欢 玩 毛线球 。
小猫 在 沙发 上 睡觉 。
小狗 喜欢 啃 骨头 。
小狗 喜欢 在 公园 里 跑 。
小狗 在 门口 等 主人 。
春天 来 了 ， 花 都 开 了 。
春天 来 了 ， 小草 绿 了 。
春天 来 了 ， 燕子 飞 回来 了 。
秋天 来 了 ， 树叶 黄 了 。
冬天 来 了 ， 天气 很 冷 。
床前 明月 光 ， 疑是 地上 霜 。
举头 望 明月 ， 低头 思 故乡 。
春眠 不觉 晓 ， 处处 闻 啼鸟 。
白日 依山 尽 ， 黄河 入海 流 。
人工 智能 可以 帮 我们 写 文章 。
人工 智能 可以 帮 我们 翻译 。
人工 智能 可以 回答 问题 。
人工 智能 会 犯错 ， 要 自己 核对 。
人工 智能 正在 改变 世界 。
大 模型 会 猜 下一个 字 。
大 模型 会 写 诗 。
大 模型 需要 很多 数据 。
大 模型 需要 很多 显卡 。
电脑 可以 帮 我们 算 数 。
手机 没电 了 ， 我 要 充电 。
妈妈 在 厨房 做饭 。
妈妈 做 的 饭 很 好吃 。
爸爸 在 看 报纸 。
这 本书 很 有意思 。
这 部 电影 很 好看 。
这 家 店 的 火锅 很 好吃 。
火锅 很 好吃 。
苹果 很 甜 。
咖啡 有点 苦 。
天空 很 蓝 ， 白云 很 白 。
谢谢 你 的 帮助 。
祝 你 生日 快乐 。
祝 你 天天 开心 。
你好 ， 很 高兴 认识 你 。
你 今天 吃饭 了 吗 ？
你 想 去 哪里 ？
你 喜欢 什么 颜色 ？`.split('\n').map(l=>l.trim().split(/\s+/));
const END=new Set(['。','？','！']);
const S='<s>';
const VOCAB=[];const VID=new Map();
const addV=w=>{if(!VID.has(w)){VID.set(w,VOCAB.length);VOCAB.push(w);}};
CORPUS.forEach(s=>s.forEach(addV));
['人工智能','大模型','模型','天气','向量','注意力','学习','我们','你们','他们','中国','世界','公园','散步','今天','明天','昨天','因为','所以','但是','可是','一个','什么','怎么','知道','喜欢','语言','文字','机器','电脑','手机','上班','下班','学校','老师','学生','朋友','时间','问题','答案','，','。','？','！','、','：','“','”'].forEach(addV);
const EN=['the','cat','sat','on','mat','un','believ','able','token','iz','ation','hello','world','love','you','play','ing','ed','er','is','it','model','lang','uage','great','what','are','to','do','i','a','s'];
EN.forEach(w=>addV(w));
const MAXL=4;

/* 计数：三元 & 二元 & 句首 */
const tri=new Map(),bi=new Map();
const inc=(m,k,w)=>{let o=m.get(k);if(!o){o=new Map();m.set(k,o);}o.set(w,(o.get(w)||0)+1);};
CORPUS.forEach(s=>{const t=[S,S,...s];for(let i=2;i<t.length;i++){inc(tri,t[i-2]+'|'+t[i-1],t[i]);inc(bi,t[i-1],t[i]);}});

/* ---------- 玩具切分器 ---------- */
function tokenize(text){
  const out=[];let i=0,space=false;
  while(i<text.length){
    const ch=text[i];
    if(/\s/.test(ch)){space=true;i++;continue;}
    if(/[A-Za-z]/.test(ch)){
      let j=i;while(j<text.length&&/[A-Za-z]/.test(text[j]))j++;
      const word=text.slice(i,j);let k=0,first=true;
      while(k<word.length){
        let m=1;for(let L=Math.min(8,word.length-k);L>=1;L--){if(VID.has(word.slice(k,k+L).toLowerCase())){m=L;break;}}
        const piece=word.slice(k,k+m);
        out.push({t:piece,show:(first&&space&&out.length?'␣':'')+piece,id:VID.has(piece.toLowerCase())?VID.get(piece.toLowerCase()):null});
        k+=m;first=false;
      }
      i=j;space=false;continue;
    }
    if(/[0-9]/.test(ch)){let j=i;while(j<text.length&&j-i<3&&/[0-9]/.test(text[j]))j++;out.push({t:text.slice(i,j),show:text.slice(i,j),id:'数'});i=j;space=false;continue;}
    let m=1;for(let L=Math.min(MAXL,text.length-i);L>=1;L--){if(VID.has(text.slice(i,i+L))){m=L;break;}}
    const w=text.slice(i,i+m);out.push({t:w,show:w,id:VID.has(w)?VID.get(w):null});
    i+=m;space=false;
  }
  return out;
}
const tokIn=$('#tok-in'),tokOut=$('#tok-out'),tokStat=$('#tok-stat');
function renderTok(){
  const toks=tokenize(tokIn.value);tokOut.innerHTML='';
  toks.forEach((t,k)=>{const c=el('span','chip c'+(k%5));c.style.animationDelay=Math.min(k*30,600)+'ms';c.append(t.show);const i=el('i',null,t.id===null?'单字':t.id==='数'?'数字':'#'+t.id);c.append(i);tokOut.append(c);});
  const chars=[...tokIn.value.replace(/\s/g,'')].length;
  tokStat.innerHTML=`<span><b>${chars}</b>个字符</span><span><b>${toks.length}</b>个 token</span><span>平均每个 token <b>${toks.length?(chars/toks.length).toFixed(1):0}</b>个字符</span>`;
}
['今天天气很好，我们去公园散步吧。','人工智能正在改变世界。','The cat sat on the mat.','unbelievable tokenization','我爱吃螺蛳粉'].forEach(p=>{const b=el('button',null,p.length>12?p.slice(0,12)+'…':p);b.onclick=()=>{tokIn.value=p;renderTok();};$('#tok-presets').append(b);});
let tokT;tokIn.addEventListener('input',()=>{clearTimeout(tokT);tokT=setTimeout(renderTok,120);});
renderTok();

/* ---------- 全景动画（宽屏横排 / 手机竖排） ---------- */
(function(){
  const svg=$('#pipe');if(!svg)return;
  const toks=['今天','天气','很'];
  const pal=['#a33a2b','#2f6f8f','#b0812a','#4f7a4a','#7b5ea7','#c9765f'];
  const vec=(seed,mix)=>Array.from({length:6},(_,i)=>Math.sin(seed*9.7+i*3.1+(mix||0))*.5+.5);
  const op=v=>(.25+v*.75).toFixed(2);
  const cands=[['好',.48],['不错',.22],['冷',.13],['晴朗',.09],['……',.08]];
  const defs=`<defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--accent)"/></marker>
  <style>#pipe .st{opacity:0;transition:opacity .5s}#pipe .lab{font-size:13px;fill:var(--sub)}#pipe .bx{fill:var(--card);stroke:var(--line)}#pipe .tx{font-size:17px;fill:var(--ink)}#pipe .pbar{transform-box:fill-box;transform-origin:left;transform:scaleX(0);transition:transform .9s cubic-bezier(.2,.8,.2,1)}#pipe.s4on .pbar{transform:scaleX(1)}#pipe .flow{stroke-dasharray:5 5;animation:dash 1s linear infinite}#pipe.paused .flow{animation-play-state:paused}@keyframes dash{to{stroke-dashoffset:-20}}</style></defs>`;
  function wide(){
    let h=defs;
    [['① 切 token',50],['② 变向量',160],['③ 注意力 × 很多层',315],['④ 概率',490],['⑤ 抽一个',600]].forEach(([t,x],i)=>h+=`<text class="lab st g${i+1}" x="${x}" y="22" text-anchor="middle">${t}</text>`);
    h+=`<g class="g0 raw"><text class="tx" x="20" y="300">「今天天气很 ___」</text></g>`;
    const Y=[70,130,190];
    toks.forEach((t,i)=>{h+=`<g class="st g1"><rect class="bx" x="16" y="${Y[i]-18}" width="68" height="34" rx="8"/><text class="tx" x="50" y="${Y[i]+6}" text-anchor="middle">${t}</text></g>`;});
    toks.forEach((t,i)=>{h+=`<g class="st g2">`;vec(i+1).forEach((v,j)=>h+=`<rect x="${112+j*16}" y="${Y[i]-10}" width="14" height="20" rx="3" fill="${pal[(i+j)%6]}" opacity="${op(v)}"/>`);h+=`<path d="M86 ${Y[i]}H108" stroke="var(--line)" stroke-width="2"/></g>`;});
    h+=`<g class="st g3"><rect x="222" y="40" width="190" height="186" rx="16" fill="var(--blue-soft)" stroke="var(--blue)" stroke-opacity=".4"/><text class="lab" x="317" y="246" text-anchor="middle">× 几十到上百层</text>`;
    [[0,1],[0,2],[1,2]].forEach(([a,b])=>h+=`<path class="flow" d="M264 ${Y[a]} C ${b-a>1?232:244} ${Y[a]}, ${b-a>1?232:244} ${Y[b]}, 264 ${Y[b]}" fill="none" stroke="var(--blue)" stroke-width="${b-a>1?1.2:2.4}"/>`);
    toks.forEach((t,i)=>vec(i+1,i*1.7+2).forEach((v,j)=>h+=`<rect x="${270+j*20}" y="${Y[i]-10}" width="17" height="20" rx="3" fill="${pal[(j+2*i+1)%6]}" opacity="${op(v)}"/>`));
    h+=`</g><g class="st g4"><path d="M412 ${Y[2]}H436" stroke="var(--accent)" stroke-width="2" marker-end="url(#ar)"/>`;
    cands.forEach(([w,p],i)=>{const y=66+i*36;h+=`<text class="tx" x="452" y="${y+6}" font-size="16">${w}</text><rect x="490" y="${y-8}" width="${p*120}" height="16" rx="4" fill="var(--accent)" opacity="${i?0.45:0.95}" class="pbar"/><text class="lab" x="${494+p*120}" y="${y+5}">${Math.round(p*100)}%</text>`;});
    h+=`</g><g class="st g5"><rect x="580" y="52" width="52" height="30" rx="8" fill="var(--accent)"/><text x="606" y="73" text-anchor="middle" fill="#fff" font-size="16">好</text>
    <path class="flow" d="M606 86 C 606 300, 120 300, 70 ${Y[2]+40}" fill="none" stroke="var(--accent)" stroke-width="1.6" marker-end="url(#ar)"/>
    <rect x="16" y="${Y[2]+42}" width="68" height="30" rx="8" fill="var(--soft)" stroke="var(--accent)"/><text class="tx" x="50" y="${Y[2]+63}" text-anchor="middle">好</text></g>`;
    return ['0 0 640 330',h];
  }
  function tall(){
    let h=defs;const X=[52,138,224],NX=314;
    h+=`<g class="g0 raw"><text class="tx" x="180" y="26" text-anchor="middle" font-size="18">「今天天气很 ___」</text></g>`;
    h+=`<text class="lab st g1" x="10" y="56">① 切成 token</text>`;
    toks.forEach((t,i)=>{h+=`<g class="st g1"><rect class="bx" x="${X[i]-38}" y="64" width="76" height="38" rx="9"/><text class="tx" x="${X[i]}" y="89" text-anchor="middle">${t}</text></g>`;});
    h+=`<text class="lab st g2" x="10" y="128">② 每块变成一串数字（向量）</text>`;
    toks.forEach((t,i)=>{h+=`<g class="st g2"><path d="M${X[i]} 103V134" stroke="var(--line)" stroke-width="2"/>`;vec(i+1).forEach((v,j)=>h+=`<rect x="${X[i]-37+j*12.6}" y="136" width="11" height="22" rx="2.5" fill="${pal[(i+j)%6]}" opacity="${op(v)}"/>`);h+=`</g>`;});
    h+=`<g class="st g3"><rect x="8" y="174" width="344" height="134" rx="16" fill="var(--blue-soft)" stroke="var(--blue)" stroke-opacity=".4"/><text class="lab" x="20" y="196" style="fill:var(--blue)">③ 注意力：互相看一眼，交换信息</text>`;
    [[0,1],[1,2],[0,2]].forEach(([a,b])=>{const hgt=b-a>1?52:30;h+=`<path class="flow" d="M${X[a]} 252 C ${X[a]} ${252-hgt}, ${X[b]} ${252-hgt}, ${X[b]} 252" fill="none" stroke="var(--blue)" stroke-width="${b-a>1?1.4:2.4}"/>`;});
    toks.forEach((t,i)=>vec(i+1,i*1.7+2).forEach((v,j)=>h+=`<rect x="${X[i]-37+j*12.6}" y="254" width="11" height="22" rx="2.5" fill="${pal[(j+2*i+1)%6]}" opacity="${op(v)}"/>`));
    h+=`<text class="lab" x="340" y="298" text-anchor="end">× 几十到上百层</text></g>`;
    h+=`<g class="st g4"><path d="M${X[2]} 309V330" stroke="var(--accent)" stroke-width="2" marker-end="url(#ar)"/><text class="lab" x="10" y="334">④ 每个候选的概率</text>`;
    cands.forEach(([w,p],i)=>{const y=358+i*32;h+=`<text class="tx" x="14" y="${y+6}" font-size="16">${w}</text><rect x="62" y="${y-8}" width="${p*300}" height="16" rx="4" fill="var(--accent)" opacity="${i?0.45:0.95}" class="pbar"/><text class="lab" x="${67+p*300}" y="${y+5}">${Math.round(p*100)}%</text>`;});
    h+=`</g><g class="st g5"><text class="lab" x="300" y="334" text-anchor="middle">⑤ 抽一个</text><rect x="288" y="344" width="56" height="30" rx="8" fill="var(--accent)"/><text x="316" y="365" text-anchor="middle" fill="#fff" font-size="16">好</text>
    <path class="flow" d="M346 352 C 372 280, 372 140, ${NX+24} 104" fill="none" stroke="var(--accent)" stroke-width="1.6" marker-end="url(#ar)"/>
    <rect x="${NX-22}" y="64" width="44" height="38" rx="9" fill="var(--soft)" stroke="var(--accent)"/><text class="tx" x="${NX}" y="89" text-anchor="middle">好</text></g>`;
    return ['0 0 360 516',h];
  }
  const caps=['一句没写完的话：「今天天气很」。模型要猜下一个字。',
   '① 先把文字切成 token，每块在词表里有个编号。',
   '② 每个 token 查表换成一串数字（向量），这里画成一排小色块。',
   '③ 向量进入 Transformer：通过注意力互相「看一眼」、交换信息，颜色（内容）被前文改变。这样的层要叠很多层。',
   '④ 用最后一个位置的向量给词表里每个候选打分，softmax 后变成概率。',
   '⑤ 按概率抽中「好」，接到句尾。整句再送回模型，继续猜下一个。'];
  const cap=$('#pipe-cap'),play=$('#pipe-play'),dotsBox=$('#pipe-dots');let step=0,timer=null,mode='';
  const dots=caps.map((c,i)=>{const b=el('button','dot');b.setAttribute('aria-label','第 '+i+' 步');b.textContent=i?i:'始';b.onclick=()=>{stop();show(i);};dotsBox.append(b);return b;});
  function build(){const m=svg.parentElement.clientWidth<560?'tall':'wide';if(m===mode)return;mode=m;const [vb,h]=m==='tall'?tall():wide();svg.setAttribute('viewBox',vb);svg.innerHTML=h;show(step,true);}
  function show(s,instant){step=s;for(let i=1;i<=5;i++)svg.querySelectorAll('.g'+i).forEach(g=>g.style.opacity=i<=s?1:0);svg.classList.toggle('s4on',s>=4);cap.textContent=caps[s];dots.forEach((d,i)=>d.classList.toggle('on',i===s));}
  function stop(){clearInterval(timer);timer=null;play.textContent='▶ 播放';}
  function start(){if(step>=5)show(0);timer=setInterval(()=>{if(step>=5){stop();return;}show(step+1);},2600);play.textContent='❚❚ 暂停';}
  play.onclick=()=>timer?stop():start();
  $('#pipe-step').onclick=()=>{stop();show(step>=5?0:step+1);};
  // 左右滑动切换步骤
  let sx=null,sy=0;
  svg.addEventListener('pointerdown',e=>{sx=e.clientX;sy=e.clientY;});
  svg.addEventListener('pointerup',e=>{if(sx==null)return;const dx=e.clientX-sx,dy=e.clientY-sy;sx=null;
    if(Math.abs(dx)>40&&Math.abs(dx)>Math.abs(dy)){stop();show(dx<0?Math.min(5,step+1):Math.max(0,step-1));}
    else if(Math.abs(dx)<8&&Math.abs(dy)<8){stop();show(step>=5?0:step+1);}});
  svg.addEventListener('pointercancel',()=>sx=null);
  build();let rt;addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(build,150);});
  if('IntersectionObserver' in window){
    let started=false;
    new IntersectionObserver(es=>{const vis=es[0].isIntersecting;svg.classList.toggle('paused',!vis);
      if(!vis&&timer)stop();
      if(vis&&!started&&!reduce){started=true;setTimeout(()=>{if(!timer&&step===0)start();},500);}},{threshold:.4}).observe(svg);
  }
  if(reduce)show(5);
})();

/* ---------- 词向量地图 ---------- */
(function(){
  const svg=$('#emb');if(!svg)return;
  const P=[['小猫',16,20,'动物'],['小狗',25,15,'动物'],['老虎',11,31,'动物'],['兔子',25,29,'动物'],
   ['苹果',70,18,'水果'],['香蕉',80,26,'水果'],['西瓜',74,10,'水果'],['葡萄',86,16,'水果'],
   ['汽车',18,70,'交通'],['火车',29,78,'交通'],['飞机',12,84,'交通'],['自行车',31,66,'交通'],
   ['国王',58,57,'人物'],['女王',59,80,'人物'],['男人',80,58,'人物'],['女人',80,80,'人物'],['王子',45,47,'人物'],['公主',50,86,'人物'],
   ['开心',40,30,'心情'],['高兴',50,32,'心情'],['难过',36,40,'心情']];
  const X=x=>x*3.6+20,Y=y=>y*2.6+26;
  const NS='http://www.w3.org/2000/svg';
  let h=`<defs><marker id="ea" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--accent)"/></marker><marker id="eb" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--gold)"/></marker></defs>`;
  h+=`<rect x="1" y="1" width="398" height="298" rx="12" fill="none" stroke="var(--line)"/>`;
  [['动物',12,6],['水果',74,6],['交通',20,95],['人物',70,96],['心情',43,22]].forEach(([g,x,y])=>h+=`<text class="grp" x="${X(x)}" y="${Y(y)}" text-anchor="middle">${g}</text>`);
  h+=`<g id="emb-lines"></g>`;
  P.forEach(([w,x,y],i)=>h+=`<g class="pt" data-i="${i}" tabindex="0" role="button" aria-label="${w}"><circle cx="${X(x)}" cy="${Y(y)}" r="5" fill="var(--blue)"/><circle cx="${X(x)}" cy="${Y(y)}" r="20" fill="transparent"/><rect x="${X(x)+4}" y="${Y(y)-14}" width="${w.length*14+10}" height="28" fill="transparent"/><text x="${X(x)+8}" y="${Y(y)+5}">${w}</text></g>`);
  svg.innerHTML=h;
  const lines=svg.querySelector('#emb-lines'),cap=$('#emb-cap');
  const dots=[...svg.querySelectorAll('.pt')];
  const reset=()=>{lines.innerHTML='';dots.forEach(d=>{d.querySelector('circle').setAttribute('fill','var(--blue)');d.querySelector('circle').setAttribute('r',5);});};
  function pick(i){
    reset();wbtn.forEach((b,j)=>b.classList.toggle('on',j===i));const [w,x,y]=P[i];
    const near=P.map((p,j)=>[j,Math.hypot(p[1]-x,p[2]-y)]).filter(a=>a[0]!==i).sort((a,b)=>a[1]-b[1]).slice(0,3);
    let s='';near.forEach(([j])=>{s+=`<line x1="${X(x)}" y1="${Y(y)}" x2="${X(P[j][1])}" y2="${Y(P[j][2])}" stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="4 3"/>`;dots[j].querySelector('circle').setAttribute('fill','var(--accent)');});
    lines.innerHTML=s;const c=dots[i].querySelector('circle');c.setAttribute('fill','var(--accent)');c.setAttribute('r',7);
    cap.textContent=`离「${w}」最近的是：${near.map(([j])=>P[j][0]).join('、')}。它们在训练文字里常出现在相似的位置，所以坐标挨得近。`;
  }
  const wr=$('#emb-words');const wbtn=P.map((p,i)=>{const b=el('button',null,p[0]);b.onclick=()=>pick(i);wr.append(b);return b;});
  svg.addEventListener('click',e=>{
    const m=svg.getScreenCTM();if(!m)return;const q=new DOMPoint(e.clientX,e.clientY).matrixTransform(m.inverse());
    let best=-1,bd=1e9;P.forEach(([w,x,y],i)=>{const d=Math.min(Math.hypot(q.x-X(x),q.y-Y(y)),Math.hypot(q.x-(X(x)+10+w.length*7),q.y-Y(y))*1.15);if(d<bd){bd=d;best=i;}});
    if(bd<40)pick(best);});
  dots.forEach((d,i)=>{d.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();pick(i);}});});
  $('#emb-reset').onclick=()=>{reset();wbtn.forEach(b=>b.classList.remove('on'));cap.textContent='点图上的词（或下面一排按钮），看离它最近的三个词。';};
  $('#emb-ana').onclick=()=>{
    reset();wbtn.forEach(b=>b.classList.remove('on'));const g=n=>P.find(p=>p[0]===n);const k=g('国王'),m=g('男人'),wo=g('女人');
    const tx=k[1]+(wo[1]-m[1]),ty=k[2]+(wo[2]-m[2]);
    lines.innerHTML=`<line x1="${X(m[1])}" y1="${Y(m[2])}" x2="${X(wo[1])}" y2="${Y(wo[2])-7}" stroke="var(--gold)" stroke-width="2.5" marker-end="url(#eb)"/>
    <line x1="${X(k[1])}" y1="${Y(k[2])}" x2="${X(tx)}" y2="${Y(ty)-7}" stroke="var(--accent)" stroke-width="2.5" stroke-dasharray="5 4" marker-end="url(#ea)"/>
    <circle cx="${X(tx)}" cy="${Y(ty)}" r="13" fill="none" stroke="var(--accent)" stroke-width="1.5"/>`;
    ['国王','男人','女人','女王'].forEach(n=>dots[P.indexOf(g(n))].querySelector('circle').setAttribute('fill','var(--accent)'));
    cap.textContent='黄箭头是「男人 → 女人」的方向。从「国王」出发沿同一方向走同样的距离，就落在「女王」旁边。向量里的「方向」也带着意思。';
  };
})();

/* ---------- 注意力 ---------- */
(function(){
  const SENTS=[
   {name:'它太小了',t:['我','想','把','大','箱子','放进','车','里','，','可是','它','太','小','了'],
    w:{10:{4:.36,6:.34,9:.08,5:.06},12:{6:.55,10:.2,4:.08,11:.07},4:{3:.45,2:.2,4:.2},5:{4:.42,2:.18,5:.2},7:{6:.5,5:.25,7:.15}},
    cap:{10:'「它」指谁？写到这里，后面的「小」还没出现，所以它对「箱子」和「车」差不多一样关注，还拿不准。',12:'到了「小」：什么东西太小？装不下箱子的是「车」。所以「小」把大部分注意力给了「车」。',4:'「箱子」主要关注修饰它的「大」。',5:'「放进」关注要放的东西「箱子」。',7:'「里」关注「车」：车里。'}},
   {name:'它太大了',t:['我','想','把','大','箱子','放进','车','里','，','可是','它','太','大','了'],
    w:{10:{4:.36,6:.34,9:.08,5:.06},12:{4:.52,10:.2,3:.1,6:.07},4:{3:.45,2:.2,4:.2},5:{4:.42,2:.18,5:.2},7:{6:.5,5:.25,7:.15}},
    cap:{10:'「它」指谁？写到这里还看不到后面的「大」，所以对「箱子」和「车」都有关注。',12:'到了「大」：什么东西太大？放不进去的是「箱子」。只改了一个字，注意力就从「车」转向了「箱子」。',4:'「箱子」主要关注修饰它的「大」。',5:'「放进」关注要放的东西「箱子」。',7:'「里」关注「车」：车里。'}},
   {name:'小猫累了',t:['小猫','追着','毛线球','跑','了','半天','，','它','累','了'],
    w:{7:{0:.6,2:.18,3:.06,7:.08},8:{7:.42,0:.28,3:.12,5:.08},3:{0:.4,1:.2,2:.15,3:.15},2:{1:.45,0:.25,2:.25}},
    cap:{7:'「它」主要关注「小猫」：会累的是小猫，不是毛线球。',8:'「累」关注「它」和「小猫」（谁累了），也看了「跑」「半天」（为什么累）。',3:'「跑」关注是谁在跑：「小猫」。',2:'「毛线球」关注「追着」：它是被追的那个。'}}
  ];
  let cur=0,q=null;
  const pickBox=$('#att-pick'),sent=$('#att-sent'),cap=$('#att-cap');
  SENTS.forEach((s,i)=>{const b=el('button',i===0?'on':'',s.name);b.onclick=()=>{cur=i;q=null;pickBox.querySelectorAll('button').forEach((x,j)=>x.classList.toggle('on',j===i));render();};pickBox.append(b);});
  function weights(s,i){
    let w=s.w[i];const n=i+1;const out=new Array(s.t.length).fill(0);
    if(w){let sum=0;for(const k in w){out[k]=w[k];sum+=w[k];}const rest=Math.max(0,1-sum);const others=[...Array(n).keys()].filter(k=>!(k in w));others.forEach(k=>out[k]+=rest/others.length||0);if(!others.length)out[i]+=rest;}
    else{out[i]=.35;if(i>0)out[i-1]+=.3;const others=[...Array(Math.max(0,i-1)).keys()];if(others.length)others.forEach(k=>out[k]+=.35/others.length);else out[i]+=i>0?.35:.65;}
    return out;
  }
  function render(){
    const s=SENTS[cur];sent.innerHTML='';
    const w=q==null?null:weights(s,q);
    s.t.forEach((t,i)=>{
      const b=el('span','att-tok',t);b.tabIndex=0;b.setAttribute('role','button');
      if(w){
        if(i>q)b.classList.add('fut');
        else{const a=w[i];b.style.background=`color-mix(in srgb, var(--accent) ${Math.round(a*100*1.4)}%, var(--bg))`;if(a>.3)b.style.color='#fff';if(a>=.05){const p=el('span','pct',Math.round(a*100)+'%');b.append(p);}}
        if(i===q)b.classList.add('q');
      }
      b.onclick=()=>{q=i;render();};b.onkeydown=e=>{if(e.key==='Enter'){q=i;render();}};
      sent.append(b);
    });
    if(q==null)cap.textContent='点句子里的任意一个词（试试「它」和倒数第二个字），看它在关注前面的哪些词。';
    else cap.textContent=s.cap[q]||`「${s.t[q]}」主要关注自己和紧挨着的前一个词。这类词没什么需要「回头找」的信息。`;
  }
  render();
})();

/* ---------- 下一个词：玩具模型 ---------- */
(function(){
  let toks=[];let T=1;let auto=null,pendingSample=null;
  const ctx=$('#nt-ctx'),info=$('#nt-info'),cands=$('#nt-cands'),inp=$('#nt-in'),sm=$('#sm-table');
  function state(){
    let a=S,b=S;const n=toks.length;
    // 句末之后从句首开始
    let start=0;for(let i=n-1;i>=0;i--){if(END.has(toks[i])){start=i+1;break;}}
    const sent=toks.slice(start);
    if(sent.length>=1)b=sent[sent.length-1];if(sent.length>=2)a=sent[sent.length-2];
    let m=tri.get(a+'|'+b),lvl=2,win=Math.min(2,sent.length);
    if(!m||!m.size){m=bi.get(b);lvl=1;win=Math.min(1,sent.length);}
    if(!m||!m.size){m=bi.get(S);lvl=0;win=0;}
    if(sent.length===0){lvl=-1;win=0;}
    return {m,lvl,win};
  }
  function dist(m){
    const arr=[...m.entries()].map(([w,c])=>({w,c,s:Math.log(c)}));
    const mx=Math.max(...arr.map(a=>a.s/T));let Z=0;arr.forEach(a=>{a.e=Math.exp(a.s/T-mx);Z+=a.e;});
    arr.forEach(a=>a.p=a.e/Z);arr.sort((x,y)=>y.c-x.c||0);
    return arr;
  }
  function render(newIdx){
    const st=state();const d=dist(st.m);
    ctx.innerHTML='';
    toks.forEach((t,i)=>{const s=el('span','tk',t);if(i>=toks.length-st.win)s.classList.add('win');if(i===newIdx)s.classList.add('new');ctx.append(s);});
    ctx.append(el('span','caret'));
    const total=d.reduce((s,a)=>s+a.c,0);
    info.textContent=st.lvl===2?`模型看了最后 2 个词（黄色），在语料里见过这个组合 ${total} 次，后面跟过 ${d.length} 种词：`:
      st.lvl===1?`没见过最后两个词连在一起，只好只看最后 1 个词（黄色）来猜，共有 ${d.length} 种候选：`:
      st.lvl===-1?`一句话的开头：从语料里所有句子的第一个词里猜（${d.length} 种）：`:
      `这个词它完全没见过，只好像从句首那样瞎猜（${d.length} 种候选）：`;
    cands.innerHTML='';
    d.slice(0,8).forEach(a=>{
      const b=el('button','cand');b.innerHTML=`<span class="w"></span><span class="bar"><span></span></span><span class="p">${(a.p*100).toFixed(a.p<.1?1:0)}%</span>`;
      b.querySelector('.w').textContent=a.w;b.onclick=()=>{stopAuto();append(a.w);};b.dataset.w=a.w;cands.append(b);
      requestAnimationFrame(()=>requestAnimationFrame(()=>b.querySelector('.bar span').style.transform='scaleX('+Math.max(.005,a.p)+')'));
    });
    if(d.length>8)cands.append(el('div','lbl',`……还有 ${d.length-8} 个概率更小的候选没列出来。`));
    // softmax 表
    const top=d.slice(0,4);
    let h=`<table style="width:100%;border-collapse:collapse;font-size:13px;min-width:420px"><thead><tr style="color:var(--sub);text-align:right"><th style="text-align:left;padding:4px">候选</th><th>出现次数</th><th>分数 = ln(次数)</th><th>÷ 温度 ${T.toFixed(1)}</th><th>e 的次方</th><th>概率</th></tr></thead><tbody>`;
    const Zall=d.reduce((s,a)=>s+Math.exp(a.s/T),0);
    top.forEach(a=>{const e=Math.exp(a.s/T);h+=`<tr style="text-align:right;border-top:1px solid var(--line)"><td style="text-align:left;padding:5px 4px;font-size:15px">${a.w.replace(/</g,'&lt;')}</td><td>${a.c}</td><td>${a.s.toFixed(2)}</td><td>${(a.s/T).toFixed(2)}</td><td>${e<1000?e.toFixed(2):e.toExponential(1)}</td><td style="color:var(--accent);font-weight:600">${(e/Zall*100).toFixed(1)}%</td></tr>`;});
    h+=`</tbody></table><div class="lbl" style="margin-top:6px">概率 = 这一行的「e 的次方」÷ 所有 ${d.length} 个候选的「e 的次方」之和。${d.length>4?'表里只列了前 4 个。':''}</div>`;
    sm.innerHTML=h;
    return d;
  }
  function append(w,quiet){
    toks.push(w);inp.value=toks.join('');render(toks.length-1);
    if(!quiet)cands.querySelectorAll('.cand').forEach(c=>{});
  }
  function sample(){
    const d=dist(state().m);let r=Math.random(),acc=0,pick=d[d.length-1];
    for(const a of d){acc+=a.p;if(r<=acc){pick=a;break;}}
    const btn=[...cands.querySelectorAll('.cand')].find(c=>c.dataset.w===pick.w);
    if(btn&&!reduce){btn.classList.add('pick');pendingSample=setTimeout(()=>{pendingSample=null;append(pick.w);},280);}else append(pick.w);
    return pick.w;
  }
  function stopAuto(cancelSample=true){clearTimeout(auto);auto=null;if(cancelSample){clearTimeout(pendingSample);pendingSample=null;}$('#nt-auto').textContent='自动写到句号';}
  $('#nt-sample').onclick=()=>{stopAuto();sample();};
  $('#nt-auto').onclick=()=>{
    if(auto){stopAuto();return;}
    stopAuto();
    $('#nt-auto').textContent='停';let n=0;
    if(toks.length&&END.has(toks[toks.length-1])){}
    const tick=()=>{const w=sample();n++;if(END.has(w)||n>=30){stopAuto(false);return;}auto=setTimeout(tick,reduce?50:650);};
    tick();
  };
  $('#nt-undo').onclick=()=>{stopAuto();toks.pop();inp.value=toks.join('');render();};
  const presets=['今天天气','我想','小猫喜欢','床前明月','人工智能','春天来了'];
  presets.forEach(p=>{const b=el('button',null,p+'…');b.onclick=()=>{stopAuto();toks=tokenize(p).map(t=>t.t);inp.value=p;render();};$('#nt-presets').append(b);});
  // Keep model state in sync immediately: generation may be clicked before a debounce fires.
  inp.addEventListener('input',()=>{stopAuto();toks=tokenize(inp.value).map(t=>t.t);render();});
  const tr=$('#nt-t'),tv=$('#nt-tv'),td=$('#nt-tdesc');
  const setT=()=>{stopAuto();T=+tr.value;tv.textContent=T.toFixed(1);td.textContent=T<.5?'保守：几乎总选第一名':T<=1.2?'正常':'大胆：冷门词机会变大';document.querySelectorAll('#nt-tq button').forEach(b=>b.classList.toggle('on',Math.abs(+b.dataset.t-T)<.01));render();};
  tr.addEventListener('input',setT);document.querySelectorAll('#nt-tq button').forEach(b=>b.onclick=()=>{tr.value=b.dataset.t;setT();});
  toks=tokenize('今天天气').map(t=>t.t);inp.value='今天天气';render();
})();

/* ---------- 模型文件大小 ---------- */
(function(){
  const p=$('#c-p'),b=$('#c-b'),o=$('#c-out'),n=$('#c-note');
  function up(){const gb=(+p.value)*(+b.value)/1e9;o.textContent=(gb>=10?Math.round(gb):gb.toFixed(1))+' GB';
    n.textContent=`${p.options[p.selectedIndex].text} 个参数 × ${b.value} 字节 ≈ ${(gb>=10?Math.round(gb):gb.toFixed(1))} GB。存得越省（位数越少），文件越小，但精度会略有损失。真正运行时还要额外的内存。`;}
  p.onchange=b.onchange=up;up();
})();
})();
