(function(){
"use strict";
const {$,el,reduce,bars,onVisible}=window.AI;
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');

/* ① 流程动画：四个角色 */
(function(){
  const svg=$('#flow');
  const X=[45,135,225,315],L=['🙋 你','🖥️ 程序','🤖 模型','🌤️ 工具'];
  const M=[ // from,to,y,label
   [0,1,98,'首尔现在多少度？'],[1,2,140,'问题 + 工具说明书'],[2,1,182,'申请：get_weather(首尔)'],
   [1,3,224,'调用天气服务'],[3,1,252,'12°C，多云'],[1,2,286,'工具结果'],[2,1,314,'写好的回答'],[1,0,342,'首尔现在 12°C…']];
  const STEP=[[0],[1],[2],[3,4],[5,6],[7]];
  const CAP=['① 你提问。问题先到程序（聊天 App 的后台），不是直接到模型。','② 程序把问题，连同「有哪些工具、怎么用」的说明书，一起放进上下文交给模型。','③ 模型判断：这个问题要查实时数据。它不直接回答，而是输出一张格式固定的「申请单」：要用 get_weather，参数 city=首尔。','④ 程序看懂申请单，替模型去调用真正的天气服务，拿到结果。模型自己从不执行任何东西。','⑤ 程序把结果贴回上下文，再叫模型一次。这回模型看到了真实数据，写出回答。','⑥ 程序把回答显示给你。你只看到最后一句话，中间的来回都在后台。'];
  let h=`<defs><marker id="fa" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--accent)"/></marker></defs>`;
  X.forEach((x,i)=>{h+=`<rect x="${x-42}" y="14" width="84" height="40" rx="10" fill="var(--card)" stroke="var(--line)" stroke-width="1.5" id="fa${i}"/><text x="${x}" y="39" text-anchor="middle" font-size="14" fill="var(--ink)">${L[i]}</text><line x1="${x}" y1="56" x2="${x}" y2="352" stroke="var(--line)" stroke-dasharray="3 4"/>`;});
  M.forEach((m,i)=>{const a=X[m[0]],b=X[m[1]],d=b>a?1:-1;
    h+=`<g id="fm${i}" style="transition:opacity .4s"><line x1="${a+d*4}" y1="${m[2]}" x2="${b-d*6}" y2="${m[2]}" stroke="var(--accent)" stroke-width="1.8" marker-end="url(#fa)"/><text x="${(a+b)/2}" y="${m[2]-6}" text-anchor="middle" font-size="11.5" fill="var(--ink)">${esc(m[3])}</text></g>`;});
  svg.innerHTML=h;
  let s=0,timer=null;
  const dots=CAP.map((_,i)=>{const b=el('button',null,String(i+1));b.onclick=()=>{stop();show(i);};$('#flow-dots').append(b);return b;});
  function show(k){s=k;const done=new Set(STEP.slice(0,k).flat()),act=new Set(STEP[k]);
    M.forEach((_,i)=>{$('#fm'+i).style.opacity=act.has(i)?1:done.has(i)?.28:0;});
    const who=new Set();STEP[k].forEach(i=>{who.add(M[i][0]);who.add(M[i][1]);});
    X.forEach((_,i)=>{const r=$('#fa'+i);r.setAttribute('stroke',who.has(i)?'var(--accent)':'var(--line)');r.setAttribute('fill',who.has(i)?'var(--soft)':'var(--card)');});
    dots.forEach((d,i)=>d.classList.toggle('on',i===k));$('#flow-cap').textContent=CAP[k];}
  function stop(){if(timer){clearInterval(timer);timer=null;}$('#flow-play').textContent='▶ 播放';}
  $('#flow-play').onclick=()=>{if(timer){stop();return;}if(s>=CAP.length-1)show(0);$('#flow-play').textContent='❚❚ 暂停';timer=setInterval(()=>{if(s>=CAP.length-1){stop();return;}show(s+1);},2600);};
  $('#flow-next').onclick=()=>{stop();show((s+1)%CAP.length);};
  svg.onclick=()=>{stop();show((s+1)%CAP.length);};
  show(0);
  let auto=false;onVisible($('#flow-demo'),v=>{if(v&&!auto&&!reduce){auto=true;show(0);$('#flow-play').click();}},.5);
})();

/* ② 模拟器 */
(function(){
  const LN=['🙋 你','🖥️ 程序','🤖 模型','🧰 工具'];
  const lanes=LN.map(t=>{const d=el('div','lane');d.innerHTML='<b>'+t.split(' ')[0]+'</b>'+t.split(' ')[1];$('#sim-lanes').append(d);return d;});
  const J=o=>JSON.stringify(o,null,1).replace(/\n\s*/g,' ');
  const TOOLS='工具说明书（3 个）：get_weather 查天气 · calculator 计算器 · search_docs 查图书馆资料库';
  const expr='37*48*1.08',val=Function('return '+expr)();const valS=String(Math.round(val*100)/100);
  const Q=[
   {q:'首尔现在多少度？',
    ok:[['call',2,'模型 → 程序：申请调用工具',J({name:'get_weather',arguments:{city:'首尔'}}),'问题要实时数据，模型自己不知道，所以开申请单。'],
        ['res',3,'程序执行 get_weather，结果交回模型',J({city:'首尔',temp_c:12,condition:'多云'})],
        ['ans',2,'模型 → 你：最终回答','首尔现在 12°C，多云。早晚偏凉，出门可以带件外套。']],
    err:[['call',2,'模型 → 程序：申请调用工具',J({name:'get_weather',arguments:{city:'首尔'}}),'问题要实时数据，所以开申请单。'],
        ['err',3,'程序执行 get_weather：出错了，把错误交回模型',J({error:'找不到城市「首尔」。本服务只认英文城市名，例如 Seoul、Beijing。'})],
        ['call',2,'模型读到错误，改参数重试',J({name:'get_weather',arguments:{city:'Seoul'}}),'错误信息写得清楚，模型就知道该怎么改。'],
        ['res',3,'程序再次执行，这次成功',J({city:'Seoul',temp_c:12,condition:'多云'})],
        ['ans',2,'模型 → 你：最终回答','首尔现在 12°C，多云。早晚偏凉，出门可以带件外套。']]},
   {q:'37 乘 48，再加 8% 的税是多少？',
    ok:[['call',2,'模型 → 程序：申请调用工具',J({name:'calculator',arguments:{expression:expr}}),'要精确计算，交给计算器比自己「猜」数字可靠。'],
        ['res',3,'程序执行 calculator（你的浏览器真的算了一遍）',J({result:+valS})],
        ['ans',2,'模型 → 你：最终回答','37 × 48 = 1776，加 8% 的税后是 '+valS+'。']],
    err:[['call',2,'模型 → 程序：申请调用工具',J({name:'calculator',arguments:{expression:'37×48×108%'}}),'模型把算式写成了人习惯的写法。'],
        ['err',3,'程序执行 calculator：出错了',J({error:'表达式无法解析：只支持数字和 + - * / ( )，例如 37*48*1.08'})],
        ['call',2,'模型读到错误，改写算式重试',J({name:'calculator',arguments:{expression:expr}}),'按错误提示改成了程序能懂的格式。'],
        ['res',3,'程序再次执行，这次成功',J({result:+valS})],
        ['ans',2,'模型 → 你：最终回答','37 × 48 = 1776，加 8% 的税后是 '+valS+'。']]},
   {q:'北京和上海现在哪边更暖和？',
    ok:[['call',2,'模型 → 程序：一次开两张申请单（并行调用）',J({name:'get_weather',arguments:{city:'北京'}})+'\n'+J({name:'get_weather',arguments:{city:'上海'}}),'两次查询互不依赖，可以同时查。'],
        ['res',3,'程序同时执行两次，两个结果一起交回',J({city:'北京',temp_c:9,condition:'晴'})+'\n'+J({city:'上海',temp_c:17,condition:'小雨'})],
        ['ans',2,'模型 → 你：最终回答','上海更暖和：上海 17°C 小雨，北京 9°C 晴，差了 8 度。去上海记得带伞。']]},
   {q:'图书馆能带狗进去吗？',
    ok:[['call',2,'模型 → 程序：申请查资料库',J({name:'search_docs',arguments:{query:'宠物 入馆 规定'}}),'这是第 6 篇的 RAG，只是由模型自己决定去查，还自己把「狗」改写成了「宠物」。'],
        ['res',3,'程序执行 search_docs，把找到的资料交回',J({hits:[{id:'须知-5',text:'除导盲犬外，宠物不得入馆。'}]})],
        ['ans',2,'模型 → 你：最终回答','不能带狗进去。馆内规定除导盲犬外，宠物不得入馆（出处：须知第 5 条）。']]},
   {q:'给我讲个冷笑话',
    ok:[['ans',2,'模型 → 你：直接回答，没有调用任何工具','为什么数学书总是很忧郁？因为它的问题太多了。'],
        ['note',1,'说明','三个工具都和这个问题无关，模型判断不需要工具，直接回答。用不用工具，是模型自己决定的。']]}
  ];
  let qi=0,err=false,step=0,seq=[];
  const qb=Q.map((o,i)=>{const b=el('button',null,o.q);b.onclick=()=>{qi=i;reset();};$('#sim-q').append(b);return b;});
  function build(){const o=Q[qi];const body=(err&&o.err)||o.ok;
    seq=[['ask',0,'你 → 程序：提问',o.q],['ctx',1,'程序 → 模型：把问题和工具说明书一起送进去',TOOLS]].concat(body);}
  function lane(k){lanes.forEach((d,i)=>d.classList.toggle('on',i===k));}
  function card(c){const d=el('div','sc '+c[0]);d.innerHTML='<small>'+esc(c[2])+'</small>'+(['call','res','err'].includes(c[0])?'<pre>'+esc(c[3])+'</pre>':esc(c[3]))+(c[4]?'<span class="why">💭 '+esc(c[4])+'</span>':'');$('#sim-log').append(d);return d;}
  function next(scroll){if(step>=seq.length)return;const c=seq[step++];const d=card(c);lane(c[0]==='ans'&&step===seq.length?0:c[1]);
    if(scroll&&d.getBoundingClientRect().bottom>innerHeight-20)d.scrollIntoView({block:'nearest',behavior:reduce?'auto':'smooth'});upd();}
  function upd(){const done=step>=seq.length;$('#sim-next').textContent=done?'完成 ✓':'下一步（'+step+'/'+seq.length+'）';$('#sim-next').disabled=done;$('#sim-all').disabled=done;}
  function reset(){qb.forEach((b,i)=>b.classList.toggle('on',i===qi));$('#sim-err').disabled=!Q[qi].err;$('#sim-log').innerHTML='';step=0;build();next(false);}
  $('#sim-next').onclick=()=>next(true);
  $('#sim-all').onclick=()=>{while(step<seq.length)next(false);};
  $('#sim-reset').onclick=reset;
  $('#sim-err').onclick=()=>{err=!err;$('#sim-err').classList.toggle('on',err);$('#sim-err').textContent='让工具出一次错：'+(err?'开':'关');reset();};
  reset();
})();

/* ③ 说明书实验 */
(function(){
  const SYN={'狗':'宠物','猫':'宠物','冷':'气温','热':'气温','度':'气温','温度':'气温','下雨':'天气','伞':'天气','借':'借阅','书':'借阅','多少钱':'计算 总价','一共':'总价 计算','乘':'计算','加':'计算','几点':'开放时间','开门':'开放时间'};
  const PRE={
   '清楚':{get_weather:'查询城市当前天气：气温、晴雨、风力。用户问天气、温度、冷不冷、要不要带伞时使用。',calculator:'精确计算数学算式，加减乘除、百分比。用户要算钱、算总价、算数时使用。',search_docs:'检索图书馆资料库：开放时间、借阅规则、宠物规定、座位预约。问图书馆相关问题时使用。'},
   '含糊':{get_weather:'获取数据。',calculator:'一个工具。',search_docs:'查询信息。'},
   '写错':{get_weather:'检索图书馆资料库：开放时间、借阅规则、宠物规定。',calculator:'精确计算数学算式，加减乘除、算总价。',search_docs:'查询城市当前天气和气温。'}};
  const QS=['今天首尔冷不冷？','图书馆几点开门？','能带狗进图书馆吗？','3 杯咖啡每杯 28 元，一共多少钱？','你好呀'];
  const ANS={'今天首尔冷不冷？':'get_weather','图书馆几点开门？':'search_docs','能带狗进图书馆吗？':'search_docs','3 杯咖啡每杯 28 元，一共多少钱？':'calculator','你好呀':'（不用工具）'};
  const names=Object.keys(PRE['清楚']);let pre='清楚',qi=0;const tas={};
  Object.keys(PRE).forEach(k=>{const b=el('button',null,k==='清楚'?'写得清楚':k==='含糊'?'写得含糊':'两条写反了');b.dataset.k=k;b.onclick=()=>{pre=k;fill();};$('#sch-pre').append(b);});
  names.forEach(n=>{const w=el('div','sch');w.innerHTML='<span class="nm">'+n+'</span>';const t=el('textarea');t.setAttribute('aria-label',n+' 的说明');t.oninput=()=>{pre=null;mark();run();};w.append(t);$('#sch-tools').append(w);tas[n]=t;});
  QS.forEach((q,i)=>{const b=el('button',null,q);b.onclick=()=>{qi=i;run();};$('#sch-q').append(b);});
  const norm=s=>{let o=s;Object.keys(SYN).sort((a,b)=>b.length-a.length).forEach(k=>{if(o.includes(k))o+=' '+SYN[k];});return o;};
  const grams=s=>{const g=new Set();const c=s.replace(/[\s，。、：？！,.?:!（）()\d]/g,'');for(let i=0;i<c.length-1;i++)g.add(c.slice(i,i+2));return g;};
  function score(q,d){const a=grams(norm(q)),b=grams(norm(d));let n=0;a.forEach(x=>{if(b.has(x))n++;});return n;}
  function mark(){[...$('#sch-pre').children].forEach(b=>b.classList.toggle('on',b.dataset.k===pre));}
  function fill(){names.forEach(n=>tas[n].value=PRE[pre][n]);mark();run();}
  function run(){[...$('#sch-q').children].forEach((b,i)=>b.classList.toggle('on',i===qi));
    const q=QS[qi];const sc=names.map(n=>score(q,n+' '+tas[n].value));
    const all=names.map((n,i)=>({w:n,s:sc[i]})).concat([{w:'（不用工具）',s:1.2}]);
    const ex=all.map(a=>Math.exp(a.s*1.3)),Z=ex.reduce((x,y)=>x+y,0);
    all.forEach((a,i)=>a.p=ex[i]/Z);const best=all.reduce((a,b)=>b.p>a.p?b:a);best.hi=1;
    bars($('#sch-bars'),all.map(a=>({w:a.w,p:a.p,hi:a.hi})));
    const right=ANS[q];const ok=best.w===right;
    $('#sch-cap').innerHTML=(ok?'✅ 选对了：':'❌ 选错了：')+'它选了 <b>'+esc(best.w)+'</b>'+(ok?'。':'，应该是 <b>'+esc(right)+'</b>。')+(ok?'':(pre==='含糊'?'说明太含糊，它分不清哪个工具管什么。':'它只能看到说明，说明写成什么，它就照着信。'));}
  fill();
})();

/* ④ 并行动画 */
(function(){const p=$('#par');const go=()=>{p.classList.remove('go');void p.offsetWidth;requestAnimationFrame(()=>p.classList.add('go'));};
  $('#par-go').onclick=go;let d=false;onVisible($('#par-demo'),v=>{if(v&&!d){d=true;go();}},.5);})();
})();
