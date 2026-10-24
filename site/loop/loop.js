(function(){
"use strict";
const {$,el,reduce,onVisible}=window.AI;
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');

/* ① 循环动画 */
(function(){
  const svg=$('#cyc');
  const N=[[180,48,'💭 想','下一步做什么'],[300,165,'🔧 做','调用一个工具'],[180,282,'👀 看','读工具结果'],[60,165,'✅ 做完了？','检查目标']];
  const CAP=['① 想：模型读完整段上下文（任务、计划、之前所有结果），决定下一步做什么。','② 做：它输出一张工具调用申请单，程序替它执行（上一篇讲的就是这一步）。','③ 看：程序把工具结果贴回上下文。这就是「观察」，智能体对世界的了解全靠它。','④ 检查：任务完成了吗？没完成就回到「想」，再转一圈；完成了就跳出循环。','⑤ 跳出：模型不再调用工具，而是直接写出最终回答交给你。也可能因为步数用完、卡住而被叫停。'];
  let h=`<defs><marker id="ca" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--accent)"/></marker></defs>`;
  const arcs=[['M232 62 Q300 80 304 128'],['M300 202 Q296 262 236 274'],['M124 274 Q64 262 60 202'],['M60 128 Q64 80 126 62']];
  arcs.forEach((a,i)=>{h+=`<path id="ce${i}" d="${a[0]}" fill="none" stroke="var(--accent)" stroke-width="2" marker-end="url(#ca)" opacity=".25" style="transition:opacity .4s"/>`;});
  h+=`<path id="ce4" d="M60 202 L60 300 L20 300" fill="none" stroke="var(--green)" stroke-width="2" stroke-dasharray="4 3" opacity=".25" style="transition:opacity .4s"/><text x="64" y="318" font-size="12" fill="var(--green)" id="cex" opacity=".3">→ 交给你</text>
  <text x="180" y="170" text-anchor="middle" font-size="13" fill="var(--sub)">直到做完</text><text x="180" y="188" text-anchor="middle" font-size="12" fill="var(--sub)" id="cround">第 1 圈</text>`;
  N.forEach((n,i)=>{h+=`<g><rect id="cn${i}" x="${n[0]-54}" y="${n[1]-26}" width="108" height="52" rx="14" fill="var(--card)" stroke="var(--line)" stroke-width="1.6" style="transition:all .3s"/><text x="${n[0]}" y="${n[1]-3}" text-anchor="middle" font-size="15" fill="var(--ink)">${n[2]}</text><text x="${n[0]}" y="${n[1]+15}" text-anchor="middle" font-size="11" fill="var(--sub)">${n[3]}</text></g>`;});
  svg.innerHTML=h;
  let s=0,timer=null,round=1;
  const dots=CAP.map((_,i)=>{const b=el('button',null,String(i+1));b.onclick=()=>{stop();show(i);};$('#cyc-dots').append(b);return b;});
  function show(k){s=k;N.forEach((_,i)=>{const r=$('#cn'+i);const on=(k<4&&i===k)||(k===4&&i===3);r.setAttribute('stroke',on?'var(--accent)':'var(--line)');r.setAttribute('fill',on?'var(--soft)':'var(--card)');});
    for(let i=0;i<4;i++)$('#ce'+i).style.opacity=(k<4&&i===k)?1:.25;
    $('#ce4').style.opacity=k===4?1:.25;$('#cex').setAttribute('opacity',k===4?1:.3);$('#cround').textContent='第 '+round+' 圈';
    dots.forEach((d,i)=>d.classList.toggle('on',i===k));$('#cyc-cap').textContent=CAP[k];}
  function stop(){if(timer){clearInterval(timer);timer=null;}$('#cyc-play').textContent='▶ 播放';}
  let seq=[0,1,2,3,0,1,2,3,4],si=0;
  $('#cyc-play').onclick=()=>{if(timer){stop();return;}si=0;round=1;show(0);$('#cyc-play').textContent='❚❚ 暂停';
    timer=setInterval(()=>{si++;if(si>=seq.length){stop();return;}if(seq[si]===0)round++;show(seq[si]);},1900);};
  $('#cyc-next').onclick=()=>{stop();show((s+1)%CAP.length);};
  svg.onclick=()=>{stop();show((s+1)%CAP.length);};
  show(0);let auto=false;onVisible($('#cyc-demo'),v=>{if(v&&!auto&&!reduce){auto=true;$('#cyc-play').click();}},.5);
})();

/* ② 模拟器 */
(function(){
  const PLAN=['查周六天气','查日落时间','查路程','算出发时间'];
  const F=[['none','没麻烦'],['timeout','工具超时'],['wrong','结果不对劲'],['stuck','一直失败'],['rain','周六下大雨']];
  let f='none',B=8,step=0,ev=[];
  F.forEach(([k,t])=>{const b=el('button',null,t);b.dataset.k=k;b.onclick=()=>{f=k;reset();};$('#ag-f').append(b);});
  const W=(c,o)=>Object.assign({k:c},o);
  const weather=W('act',{t:'get_weather(city="首尔", day="周六")'});
  function script(){
    const s=[W('th',{t:'任务要几条信息，先列个计划：周六天气 → 日落时间 → 路程 → 倒推出发时间。',plan:PLAN.slice()})];
    if(f==='timeout')s.push(weather,W('err',{t:'错误：天气服务超时（10 秒无响应）'}),W('th',{t:'超时多半是偶发的，重试一次。'}));
    if(f==='rain'){s.push(weather,W('obs',{t:'周六：全天中到大雨，夜里才停。',mark:[0,'ok'],fact:'周六全天大雨'}),
      W('th',{t:'情况变了，要改计划：周六看不到日落，日落和路程都不用查了。查一下周日能不能作为替代。',replan:['查周六天气','查周日天气（新）','建议改期（新）'],mark:[0,'ok']}),
      W('act',{t:'get_weather(city="首尔", day="周日")'}),W('obs',{t:'周日：全天晴，日落 17:51。',mark:[1,'ok'],fact:'周日全天晴，日落 17:51'}),
      W('end',{t:'周六首尔全天中到大雨，去南山塔看不到日落，不建议去。周日全天晴、日落 17:51，更合适。要我按周日帮你算出发时间吗？',mark:[2,'ok']}));return s;}
    s.push(weather,W('obs',{t:'周六：上午小雨，14:00 后转晴。',mark:[0,'ok'],fact:'周六 14:00 后转晴'}),
      W('th',{t:'下午可以去，不会淋雨。接下来查日落时间。'}),W('act',{t:'get_sunset(city="首尔", day="周六")'}),W('obs',{t:'日落 17:52。',mark:[1,'ok'],fact:'日落 17:52'}),
      W('th',{t:'还要知道从公司到南山塔多久。'}),W('act',{t:'get_route(from="公司", to="南山塔")'}));
    if(f==='stuck'){s.push(W('err',{t:'错误：路线服务暂时不可用（503）'}),W('th',{t:'可能是偶发，再试一次。'}),W('act',{t:'get_route(from="公司", to="南山塔")'}),
      W('err',{t:'错误：路线服务暂时不可用（503）'}),
      W('stop',{t:'同样的调用、同样的错误连续出现两次，我判断自己卡住了，停下来，不再浪费步数。\n目前知道：周六 14:00 后转晴，日落 17:52。\n还差：路程。你告诉我从公司过去大概多久，我马上算出发时间。',mark:[2,'x']}));return s;}
    if(f==='wrong')s.push(W('obs',{t:'南山（釜山）：约 4 小时 20 分钟。',fact:'?? 路程 4 小时 20 分（釜山）'}),
      W('th',{t:'不对劲：公司在首尔，去南山塔不可能要 4 个多小时。它把「南山」理解成了釜山的南山。换完整名称重查。',mark:[2,'x'],unfact:'?? 路程 4 小时 20 分（釜山）'}),
      W('act',{t:'get_route(from="公司", to="首尔 N首尔塔（南山塔）")'}));
    s.push(W('obs',{t:'地铁 + 步行 + 缆车：约 50 分钟。',mark:[2,'ok'],fact:'路程约 50 分钟'}),
      W('th',{t:'看日落最好提前 30 分钟到。17:52 往前减 30 分钟、再减 50 分钟路程，用计算器算，别心算。'}),
      W('act',{t:'calculator("17:52 - 0:30 - 0:50")'}),W('obs',{t:'16:32',mark:[3,'ok'],fact:'最晚 16:32 出发'}),
      W('end',{t:'建议周六 16:30 前从公司出发：14:00 后已转晴，不会淋雨；路上约 50 分钟，17:20 左右到，比日落（17:52）早半小时。周末缆车可能要排队，想稳妥可以 16:00 出发。'}));
    return s;}
  function build(){const s=script();ev=[];let used=0;
    for(const e of s){if(e.k==='act'){if(used>=B){ev.push(W('stop',{t:'已经用完 '+B+' 步的上限，按规定停下。',budget:1}));return;}used++;e.n=used;}ev.push(e);}}
  let plan=[],st=[],facts=[],used=0;
  function pad(){const p=$('#ag-pad');let h='<h4>📋 草稿本 · 计划</h4><ul>'+(plan.length?plan.map((t,i)=>'<li class="'+(st[i]||'')+'">'+esc(t)+'</li>').join(''):'<li>（还没列）</li>')+'</ul>';
    h+='<h4 style="margin-top:8px">📌 已知事实</h4><ul class="facts">'+(facts.length?facts.map(t=>'<li>'+esc(t)+'</li>').join(''):'<li>（暂无）</li>')+'</ul>';
    h+='<h4 style="margin-top:8px">🔢 步数 '+used+' / '+B+'</h4><div class="meter">'+Array.from({length:B},(_,i)=>'<i class="'+(i<used?'u':'')+'"></i>').join('')+'</div>';p.innerHTML=h;}
  const LB={th:'💭 想法',act:'🔧 行动',obs:'👀 观察',err:'⚠️ 观察：出错',end:'✅ 做完了：最终回答',stop:'⏹ 停下'};
  function next(scroll){if(step>=ev.length)return;const e=ev[step++];
    if(e.plan){plan=e.plan;st=[];}if(e.replan){plan=e.replan;st=st.slice(0,1);}if(e.mark)st[e.mark[0]]=e.mark[1];
    if(e.fact)facts.push(e.fact);if(e.unfact)facts=facts.filter(x=>x!==e.unfact);if(e.n)used=e.n;
    let t=e.t;if(e.budget){const done=plan.filter((_,i)=>st[i]==='ok'),left=plan.filter((_,i)=>st[i]!=='ok');t+='\n已完成：'+(done.join('、')||'无')+'。\n还差：'+left.join('、')+'。\n'+(facts.length?'目前知道：'+facts.join('；')+'。':'')+'\n要我继续，可以把步数调高再来。';}
    const d=el('div','sc '+e.k);d.innerHTML='<small>'+LB[e.k]+(e.n?' · 第 '+e.n+' 步':'')+'</small>'+(e.k==='act'?'<pre>'+esc(t)+'</pre>':esc(t).replace(/\n/g,'<br>'));
    const log=$('#ag-log');log.append(d);log.scrollTop=log.scrollHeight;pad();upd();}
  function upd(){const done=step>=ev.length;$('#ag-next').textContent=done?'完成 ✓':'下一步';$('#ag-next').disabled=done;$('#ag-all').disabled=done;}
  function reset(){[...$('#ag-f').children].forEach(b=>b.classList.toggle('on',b.dataset.k===f));$('#ag-log').innerHTML='';plan=[];st=[];facts=[];used=0;step=0;build();
    const d=el('div','sc');d.innerHTML='<small>🙋 任务</small>这周六我想下午去南山塔看日落，帮我算一下几点从公司出发，别淋雨。';$('#ag-log').append(d);pad();upd();}
  $('#ag-b').oninput=e=>{B=+e.target.value;$('#ag-bv').textContent=B;reset();};
  $('#ag-next').onclick=()=>next(true);$('#ag-all').onclick=()=>{while(step<ev.length)next(false);};$('#ag-reset').onclick=reset;
  reset();
})();

/* ③ 错误累积 */
(function(){
  const P=$('#cp-p'),Nn=$('#cp-n'),svg=$('#cp-svg');
  const pct=x=>x>=.995?(x*100).toFixed(1)+'%':x<.001?'< 0.1%':(x*100).toFixed(x<.1?1:0)+'%';
  function run(){const p=+P.value/100,n=+Nn.value,p2=p+(1-p)*.5;
    $('#cp-pv').textContent=(+P.value).toFixed(1).replace(/\.0$/,'')+'%';$('#cp-nv').textContent=n;
    $('#cp-r').textContent=pct(Math.pow(p,n));$('#cp-r2').textContent=pct(Math.pow(p2,n));
    const X=i=>30+i/100*300,Y=v=>110-v*96;let a='',b='';
    for(let i=1;i<=100;i++){a+=(i>1?'L':'M')+X(i).toFixed(1)+' '+Y(Math.pow(p,i)).toFixed(1);b+=(i>1?'L':'M')+X(i).toFixed(1)+' '+Y(Math.pow(p2,i)).toFixed(1);}
    svg.innerHTML=`<line x1="30" y1="110" x2="330" y2="110" stroke="var(--line)"/><line x1="30" y1="14" x2="30" y2="110" stroke="var(--line)"/>
    <text x="26" y="18" text-anchor="end" font-size="10" fill="var(--sub)">100%</text><text x="26" y="113" text-anchor="end" font-size="10" fill="var(--sub)">0</text>
    <text x="330" y="124" text-anchor="end" font-size="10" fill="var(--sub)">100 步</text><text x="32" y="124" font-size="10" fill="var(--sub)">1</text>
    <path d="${b}" fill="none" stroke="var(--blue)" stroke-width="1.6" stroke-dasharray="4 3"/><path d="${a}" fill="none" stroke="var(--accent)" stroke-width="2"/>
    <line x1="${X(n)}" y1="14" x2="${X(n)}" y2="110" stroke="var(--sub)" stroke-dasharray="2 3"/><circle cx="${X(n)}" cy="${Y(Math.pow(p,n))}" r="4.5" fill="var(--accent)"/>
    <text x="200" y="28" font-size="10.5" fill="var(--accent)">— 不会自己改错</text><text x="200" y="42" font-size="10.5" fill="var(--blue)">- - 能改正一半的错</text>`;}
  P.oninput=run;Nn.oninput=run;run();
})();

/* ④ 工作流 vs 智能体 */
(function(){
  const T=[
   {t:'把一篇文章翻成英文',a:['翻译','→','查术语表','→','润色'],b:['想','→','翻译','→','看','→','想：查术语','→','查术语表','→','看','→','想','→','润色','→','完成？'],
    r:[['步数','固定 3 步','约 5~8 步，不固定'],['花费','低','约 2~3 倍'],['结果可预测','高','较低'],['应对意外','不需要','能力用不上']],w:0,
    cap:'步骤一清二楚，用工作流就够了。用智能体反而更慢、更贵，还多了出错的机会。'},
   {t:'客服：判断用户要退款还是咨询',a:['判断类型','→','退款 → 退款流程','/','咨询 → 查知识库回答'],b:['想','→','查订单','→','看','→','想','→','查政策','→','看','→','想','→','回复','→','完成？'],
    r:[['步数','2 步','不固定'],['花费','低','较高'],['结果可预测','高，容易审核','较低'],['应对意外','少见情况转人工','能处理但难审核']],w:0,
    cap:'这是 Anthropic 文章里的「分流」工作流：先分类，再交给对应的固定流程。涉及退款这种钱的事，可预测、可审核更重要。'},
   {t:'修一个原因不明的 bug',a:['读报错','→','改报错那一行','→','跑测试 ✗'],bad:2,b:['想','→','读报错','→','搜代码','→','看：根源在另一个文件','→','改','→','跑测试 ✗','→','想','→','再改','→','跑测试 ✓'],
    r:[['步数','固定 3 步','约 6~20 步'],['花费','低','较高'],['结果可预测','高，但常修不好','较低'],['应对意外','做不到：根源不在报错那一行','能：跟着线索走、看测试结果再改']],w:1,
    cap:'问题出在哪事先不知道，固定流程只能「改报错那一行」，常常改不对。智能体能跟着线索找到真正的原因，并用测试结果检查自己。'},
   {t:'调研「首尔哪个区适合租房」',a:['搜一次','→','总结前 5 个网页'],b:['想','→','搜房租','→','看','→','想：还要通勤','→','搜交通','→','看','→','想：查治安和生活','→','搜','→','看','→','写报告（带出处）'],
    r:[['步数','2 步','十几到上百步'],['花费','低','高'],['结果可预测','高，但比较浅','较低，要核对出处'],['应对意外','做不到','能顺着新线索继续查']],w:1,
    cap:'这就是「深度研究」的场景：下一步查什么要看上一步查到什么。智能体更合适，但报告里的结论要点开出处核对。'}];
  let k=0;
  T.forEach((o,i)=>{const b=el('button',null,o.t);b.onclick=()=>{k=i;run();};$('#wf-t').append(b);});
  const fill=(box,arr,bad)=>{box.innerHTML='';arr.forEach((x,i)=>{if(x==='→'||x==='/'){box.append(el('em',null,x));return;}const s=el('span',(bad!=null&&i===bad)?'bad':'',x);box.append(s);});};
  function run(){[...$('#wf-t').children].forEach((b,i)=>b.classList.toggle('on',i===k));const o=T[k];
    fill($('#wf-a'),o.a,o.bad);fill($('#wf-b'),o.b);
    $('#wf-tab').innerHTML='<tr><th></th><th>工作流'+(o.w===0?' 👍':'')+'</th><th>智能体'+(o.w===1?' 👍':'')+'</th></tr>'+o.r.map(r=>'<tr><td>'+r[0]+'</td><td>'+r[1]+'</td><td>'+r[2]+'</td></tr>').join('');
    $('#wf-cap').innerHTML='<b>'+(o.w===0?'更适合：工作流。':'更适合：智能体。')+'</b>'+esc(o.cap);}
  run();
})();
})();
