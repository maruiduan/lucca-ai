(function(){
"use strict";
const {$,el,reduce,onVisible}=window.AI;
const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;');

/* 流程动画 */
(function(){
  const svg=$('#flow');
  const N=[ // x,y,w,h,label,stage
   [14,44,100,40,'📄 原始资料',1],[130,44,100,40,'✂️ 切成小块',1],[246,44,100,40,'🔢 变成向量',1],
   [130,118,216,38,'🗄️ 存进向量库',1],
   [14,214,100,40,'❓ 你的问题',2],[130,214,100,40,'🔢 问题变向量',2],[246,214,100,40,'🔍 找最近 3 块',2],
   [14,300,160,40,'📝 资料 + 问题拼成提示',2],[190,300,156,40,'🤖 模型照着资料写',2],
   [70,376,220,40,'✅ 带出处的回答',2]];
  const E=[[0,1],[1,2],[2,3],[4,5],[5,6],[3,6],[6,7],[7,8],[8,9]];
  const STEP=[[0],[1],[2,3],[4,5],[6],[7],[8,9]];
  const CAP=['准备阶段 ①：收集要用的资料，比如说明书、制度、网页。','准备阶段 ②：把长资料切成一小块一小块。','准备阶段 ③：用向量化模型把每块变成一串数字，存进「向量库」。这几步只需做一次，资料更新时再补。','回答阶段 ①：用户提问。问题也用同一个模型变成向量。','回答阶段 ②：在向量库里找离问题最近的几块，也就是意思最相关的资料。','回答阶段 ③：把找到的资料和问题拼成一段提示：「请只根据以下资料回答……」','回答阶段 ④：模型照着资料写出回答，并标明用了哪几块，方便你核对。'];
  const c=(x,y,w,h)=>[x+w/2,y+h/2];
  let h=`<defs><marker id="fa" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--sub)"/></marker></defs>
  <text x="14" y="30" font-size="13" fill="var(--sub)">提前准备（一次）</text><text x="14" y="200" font-size="13" fill="var(--sub)">现场回答（每次提问）</text>
  <line x1="10" y1="178" x2="350" y2="178" stroke="var(--line)" stroke-dasharray="4 4"/>`;
  E.forEach(([a,b],i)=>{const A=N[a],B=N[b];let [x1,y1]=c(...A),[x2,y2]=c(...B);
    if(Math.abs(y1-y2)<5){x1=A[0]+A[2];x2=B[0];}else if(y2>y1){y1=A[1]+A[3];y2=B[1];}
    h+=`<path id="fe${i}" d="M${x1} ${y1}L${x2-(Math.abs(y1-y2)<5?4:0)} ${y2-(y2>y1?4:0)}" stroke="var(--sub)" stroke-width="1.6" fill="none" marker-end="url(#fa)" opacity=".5"/>`;});
  N.forEach((n,i)=>{h+=`<g id="fn${i}" style="transition:opacity .4s"><rect x="${n[0]}" y="${n[1]}" width="${n[2]}" height="${n[3]}" rx="10" fill="var(--card)" stroke="var(--line)" stroke-width="1.5"/><text x="${n[0]+n[2]/2}" y="${n[1]+n[3]/2+5}" text-anchor="middle" font-size="13.5" fill="var(--ink)">${n[4]}</text></g>`;});
  svg.innerHTML=h;
  let s=0,timer=null;const dots=CAP.map((_,i)=>{const b=el('button',null,String(i+1));b.onclick=()=>{stop();show(i);};$('#flow-dots').append(b);return b;});
  function show(k){s=k;const act=new Set(STEP[k]);const done=new Set(STEP.slice(0,k).flat());
    N.forEach((n,i)=>{const g=$('#fn'+i);const r=g.querySelector('rect');g.style.opacity=act.has(i)||done.has(i)?1:.35;r.setAttribute('stroke',act.has(i)?'var(--accent)':'var(--line)');r.setAttribute('stroke-width',act.has(i)?3:1.5);r.setAttribute('fill',act.has(i)?'var(--soft)':'var(--card)');});
    E.forEach(([a,b],i)=>$('#fe'+i).setAttribute('opacity',(done.has(a)||act.has(a))&&(act.has(b)||done.has(b))?1:.25));
    dots.forEach((d,i)=>d.classList.toggle('on',i===k));$('#flow-cap').textContent=CAP[k];}
  function stop(){clearInterval(timer);timer=null;$('#flow-play').textContent='▶ 播放';}
  $('#flow-play').onclick=()=>{if(timer){stop();return;}if(s>=CAP.length-1)show(0);$('#flow-play').textContent='❚❚ 暂停';timer=setInterval(()=>{if(s>=CAP.length-1){stop();return;}show(s+1);},2400);};
  $('#flow-next').onclick=()=>{stop();show(s>=CAP.length-1?0:s+1);};
  svg.addEventListener('click',()=>{stop();show(s>=CAP.length-1?0:s+1);});
  show(0);onVisible(svg,v=>{if(!v)stop();});
})();

/* ① 切块 */
(function(){
  const DOC='自习室位于图书馆三楼，共有 120 个座位。使用前需要在小程序上预约。每次最多可预约 4 小时，过时自动释放。它在考试周非常紧张，请提前预约。离开超过 30 分钟未签到的座位，将被系统取消。自习室内请保持安静，手机调成静音。请不要用书本或物品长时间占座。';
  let mode='len';const sl=$('#chk-sz');
  [['len','按固定字数切'],['sent','按句子切']].forEach(([k,n])=>{const b=el('button',k===mode?'on':'',n);b.onclick=()=>{mode=k;[...$('#chk-mode').children].forEach(x=>x.classList.toggle('on',x===b));render();};$('#chk-mode').append(b);});
  function render(){const sz=+sl.value;$('#chk-v').textContent=sz;$('#chk-sz-wrap').style.display=mode==='len'?'':'none';
    let parts=[];if(mode==='len'){for(let i=0;i<DOC.length;i+=sz)parts.push(DOC.slice(i,i+sz));}else{parts=DOC.match(/[^。]+。/g);}
    const out=$('#chk-out');out.innerHTML='';let cut=0;
    parts.forEach((p,i)=>{const d=el('div','chunk');const broken=mode==='len'&&!/。$/.test(p)&&i<parts.length-1;if(broken)cut++;d.innerHTML=`<span class="sc">#${i+1}${broken?' ✂️':''}</span>`+esc(p);out.append(d);});
    $('#chk-n').textContent=`共 ${parts.length} 块`;
    $('#chk-cap').textContent=mode==='sent'?'按句子切，每块都是完整的话。但「它在考试周非常紧张」单独看，不知道「它」是自习室，这就是给块补上下文说明的原因。':sz<=40?`块很小：有 ${cut} 处句子被拦腰切断（✂️），单独检索到一块时往往看不懂。`:sz>=150?'块很大：几乎整篇一块。检索到它时，会把很多无关内容一起塞进提示词。':`有 ${cut} 处句子被切断（✂️）。块大小需要在「完整」和「精准」之间取舍。`;}
  sl.addEventListener('input',render);render();
})();

/* ② 检索 + 生成 */
(function(){
  const KB=['开放时间：周二至周日 9:00–20:00，每周一闭馆。','借阅规则：持读者证每人最多借 10 本书，借期 21 天，到期前可在线续借一次。','逾期归还：每本书每天收取 0.1 元滞纳金，逾期超过 30 天暂停借书资格。','办理读者证：带身份证到一楼服务台免费办理；未满 14 岁需家长陪同。','宠物须知：除导盲犬外，宠物不得进入馆内。','自习室：三楼自习室需在小程序预约，每次最多 4 小时。','饮食：馆内只允许饮用有盖的水，阅览区不得进食。','复印打印：二楼提供复印打印服务，黑白每页 0.2 元，彩色每页 1 元。'];
  const Q=[['书的借期是多久？','一般图书馆的借期是 30 天。'],['周一开放吗？','图书馆每天都开放，周一当然可以去。'],['能带狗进去吗？','可以带宠物进去，但要拴好绳子。'],['自习室要预约吗？','不需要预约，先到先得。'],['打印一页多少钱？','黑白打印大约每页 0.5 元。'],['馆长叫什么名字？','馆长是王建国先生，他从 2015 年起担任馆长。']];
  const SYN=[[/狗|猫/g,'宠物'],[/多久/g,'借期'],[/能去|开门/g,'开放'],[/馆长/g,'馆长'],[/一页多少钱|多少钱/g,'每页']];
  let qi=0,on=true,sem=false;
  const bg=s=>{s=s.replace(/[^\u4e00-\u9fa5A-Za-z0-9]/g,'');const m=new Map();for(let i=0;i<s.length-1;i++){const k=s.slice(i,i+2);m.set(k,(m.get(k)||0)+1);}return m;};
  const cos=(a,b)=>{let d=0,na=0,nb=0;a.forEach((v,k)=>{na+=v*v;if(b.has(k))d+=v*b.get(k);});b.forEach(v=>nb+=v*v);return na&&nb?d/Math.sqrt(na*nb):0;};
  const KV=KB.map(bg);
  Q.forEach(([q],i)=>{const b=el('button',i?'':'on',q);b.onclick=()=>{qi=i;[...$('#rg-q').children].forEach(x=>x.classList.toggle('on',x===b));render();};$('#rg-q').append(b);});
  function render(){
    let q=Q[qi][0];let qq=q;if(sem)SYN.forEach(([r,t])=>qq=qq.replace(r,t));
    const qv=bg(qq);const sc=KV.map((v,i)=>({i,s:cos(qv,v)})).sort((a,b)=>b.s-a.s);const top=sc.slice(0,3);
    const hits=$('#rg-hits');hits.innerHTML='';$('#rg-plbl').style.display=on?'':'none';$('#rg-prompt').style.display=on?'':'none';
    if(on){const lbl=el('div','lbl','检索到最相关的 3 块（相似度越高越相关）：');hits.append(lbl);
      top.forEach(t=>{const d=el('div','chunk'+(t.s>=.05?' hit':''));let txt=esc(KB[t.i]);qv.forEach((_,k)=>{if(KV[t.i].has(k))txt=txt.split(k).join('<mark>'+k+'</mark>');});d.innerHTML=`<span class="sc">#${t.i+1} · ${t.s.toFixed(2)}</span>`+txt;hits.append(d);});
      $('#rg-prompt').textContent='请只根据下面的资料回答问题，并注明来源编号；资料里没有的，就回答「资料里没有提到」。\n\n'+top.map(t=>`[#${t.i+1}] ${KB[t.i]}`).join('\n')+`\n\n问题：${q}`;}
    let ans;
    if(!on)ans=`<small>模型（闭卷，示意）</small>${esc(Q[qi][1])}<br><span class="lbl">听起来很肯定，但没有出处，可能是编的。</span>`;
    else if(top[0].s<.05)ans=`<small>模型（开卷）</small>资料里没有提到这一点，我无法确定。${qi===2&&!sem?'<br><span class="lbl">其实资料 #5 写了「宠物不得进入」，但关键词搜索不知道「狗」就是「宠物」。打开「懂意思」再试。</span>':''}`;
    else ans=`<small>模型（开卷）</small>${esc(KB[top[0].i].split('：')[1]||KB[top[0].i])} <b style="color:var(--accent)">[来源 #${top[0].i+1}]</b>`;
    $('#rg-ans').innerHTML=ans;
  }
  $('#rg-on').onclick=()=>{on=!on;$('#rg-on').classList.toggle('on',on);$('#rg-on').textContent='RAG：'+(on?'开':'关');render();};
  $('#rg-sem').onclick=()=>{sem=!sem;$('#rg-sem').classList.toggle('on',sem);$('#rg-sem').textContent='「懂意思」：'+(sem?'开':'关');render();};
  render();
})();
})();
