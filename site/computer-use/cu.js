(function(){
"use strict";
const {$,el}=window.AI;
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');
const segOn=(box,i)=>[...box.children].forEach((x,j)=>x.classList.toggle('on',j==i));
/* ① */
(function(){
  const scr=$('#cl-scr');
  const U={type:[6,20,40,14,'类型：请选择 ▾'],typ2:[6,35,40,22,'交通 / 餐饮 / 住宿'],amt:[52,20,40,14,'金额'],note:[6,40,86,14,'备注'],save:[66,72,26,14,'保存']};
  const nodes={};for(const k in U){const u=U[k];const d=el('div','ui'+(k=='save'?' btn':''));d.style.cssText='left:'+u[0]+'%;top:'+u[1]+'%;width:'+u[2]+'%;height:'+u[3]+'%';d.textContent=u[4];if(k=='typ2'){d.style.display='none';d.style.zIndex=2;d.style.background='var(--card)';}scr.append(d);nodes[k]=d;}
  const W=1280,H=800;const px=(k)=>{const u=U[k];return [Math.round((u[0]+u[2]/2)/100*W),Math.round((u[1]+u[3]/2)/100*H)];};
  const S=[
   ['screenshot()',null,()=>{},'第一步永远是截图：模型「看到」一个空白的报销表单。'],
   ['left_click(x='+px('type')[0]+', y='+px('type')[1]+')','type',()=>{nodes.typ2.style.display='flex';},'模型判断「类型」是个下拉框，算出它中心的像素坐标并点击。下拉菜单弹了出来，挡住了下面的「备注」框。'],
   ['screenshot()',null,()=>{},'每做一步都要重新截图，确认发生了什么。这一步很关键：如果不看，它不知道菜单挡住了东西。'],
   ['left_click(x='+px('typ2')[0]+', y='+Math.round(38/100*H)+')','typ2',()=>{nodes.typ2.style.display='none';nodes.type.textContent='类型：交通';},'在菜单里点「交通」。菜单收起。'],
   ['left_click(x='+px('amt')[0]+', y='+px('amt')[1]+')\ntype("86.50")','amt',()=>{nodes.amt.textContent='¥ 86.50';},'点金额框，输入金额。输入是另一个动作：敲键盘。'],
   ['left_click(x='+px('note')[0]+', y='+px('note')[1]+')\ntype("10/14 客户拜访 打车")','note',()=>{nodes.note.textContent='10/14 客户拜访 打车';},'备注也一样。'],
   ['screenshot()',null,()=>{},'提交前再看一眼，核对三个字段都填对了。'],
   ['left_click(x='+px('save')[0]+', y='+px('save')[1]+')','save',()=>{nodes.save.textContent='已保存 ✓';},'点保存。一张发票：9 个动作。有接口的话，这只是 1 次调用。']];
  let k=0;
  function reset(){k=0;nodes.typ2.style.display='none';nodes.type.textContent=U.type[4];nodes.amt.textContent=U.amt[4];nodes.note.textContent=U.note[4];nodes.save.textContent=U.save[4];
    for(const n in nodes)nodes[n].classList.remove('hl');$('#cl-x').style.left='50%';$('#cl-x').style.top='60%';$('#cl-log').innerHTML='';$('#cl-cap').textContent='点「下一步」开始。';$('#cl-next').disabled=false;}
  function step(){if(k>=S.length)return;const s=S[k];for(const n in nodes)nodes[n].classList.remove('hl');
    if(s[1]){const u=U[s[1]];$('#cl-x').style.left=(u[0]+u[2]/2)+'%';$('#cl-x').style.top=(s[1]=='typ2'?38:(u[1]+u[3]/2))+'%';nodes[s[1]].classList.add('hl');}
    s[2]();$('#cl-log').innerHTML+=(k?'\n':'')+'<span class="dim">'+(k+1)+'.</span> '+esc(s[0]);$('#cl-log').scrollTop=1e4;$('#cl-cap').textContent=s[3];k++;$('#cl-next').disabled=k>=S.length;}
  $('#cl-next').onclick=step;$('#cl-reset').onclick=reset;
  $('#cl-g').onclick=function(){scr.classList.toggle('g');this.classList.toggle('on');};reset();step();step();
})();
/* ② */
(function(){
  const T=[['调接口',1],['简单网页',5],['录一张发票',15],['跨三个软件',50]];
  const box=$('#cp-bars');T.forEach(t=>{const r=el('div','r');r.innerHTML='<span>'+t[0]+'<br>'+t[1]+' 步</span><div class="t"><i></i></div><b></b>';box.append(r);});
  function run(){const p=+$('#cp-p').value/100;$('#cp-pv').textContent=(p*100).toFixed(1).replace(/\.0$/,'')+'%';
    [...box.children].forEach((r,i)=>{const v=Math.pow(p,T[i][1]);r.querySelector('i').style.width=v*100+'%';r.querySelector('b').textContent=Math.round(v*100)+'%';});
    const v50=Math.pow(p,50);$('#cp-cap').textContent=p>=1?'每步都不出错时，多少步都一样。现实中没有这种好事。':'每步 '+(p*100).toFixed(1).replace(/\.0$/,'')+'% 听起来很高，可 50 步连起来只剩 '+Math.round(v50*100)+'%。要让 50 步任务有 90% 成功率，每步需要 '+(Math.pow(.9,1/50)*100).toFixed(1)+'%。';}
  $('#cp-p').oninput=run;run();
})();
/* ③ */
(function(){
  const D=[['2024.04 论文发表时最好',12.24],['2024.10 Claude 3.5 Sonnet（只看截图）',14.9],['2024.10 同上，放宽步数',22.0],['2025.01 OpenAI CUA',38.1],['2025.05 Claude Sonnet 4',42.2],['2025.09 Claude Sonnet 4.5',61.4],['2026.08 Claude Fable 5（Verified 官方榜）',85.96],['人类（论文）',72.36,1]];
  const box=$('#os-bars');D.forEach(d=>{const r=el('div','r'+(d[2]?' h':''));r.innerHTML='<span>'+d[0]+'</span><div class="t"><i></i></div><b></b>';box.append(r);});
  box.querySelectorAll('.r').forEach(r=>r.style.gridTemplateColumns='10.5em 1fr 3.4em');
  let tm=[];
  function show(n){[...box.children].forEach((r,i)=>{r.querySelector('i').style.width=(i<n?D[i][1]:0)+'%';r.querySelector('b').textContent=i<n?D[i][1]+'%':'';});
    $('#os-cap').textContent=n>=D.length?'从 12% 到 86%，两年多一点，已超过论文里的人类成绩。差距主要缩在「点准」和「多步不迷路」上。':'';}
  function anim(){tm.forEach(clearTimeout);tm=[];show(0);const reduce=window.AI.reduce;if(reduce){show(D.length);return;}
    D.forEach((d,i)=>tm.push(setTimeout(()=>show(i+1),250+i*380)));}
  const sb=[...$('#os-s').children];sb[0].onclick=()=>{segOn($('#os-s'),0);anim();};sb[1].onclick=()=>{segOn($('#os-s'),1);tm.forEach(clearTimeout);show(D.length);};
  show(0);window.AI.onVisible($('#os-demo'),anim);
})();
/* ④ */
(function(){
  const st={iso:0,conf:0,watch:0};
  [['iso','隔离浏览器（没登录邮箱）'],['conf','发邮件前要我确认'],['watch','敏感网站需要我盯着']].forEach(s=>{const b=el('button','tgl');b.textContent=s[1];b.onclick=()=>{st[s[0]]^=1;b.classList.toggle('on',!!st[s[0]]);run();};$('#pi-sw').append(b);});
  $('#pi-show').onclick=function(){$('#pi-scr').classList.toggle('show');this.classList.toggle('on');};
  function run(){const r=$('#pi-r');let t,ok=true;
    if(st.iso)t='✓ 智能体照着隐藏文字想去开邮箱，发现这个浏览器根本没登录任何邮箱，只好作罢，继续订房。最根本的一道防线：它碰不到的东西，就没法被骗着交出去。';
    else if(st.conf)t='✓ 它打开了你的邮箱、找到验证码邮件、准备转发，此时弹出确认：「要把一封银行邮件转发给 help@hotel-check.example 吗？」你一看就知道不对，点了拒绝。';
    else if(st.watch)t='⚠️ 进入邮箱时它停下来要求你盯着。你看到它在翻银行邮件，及时叫停。前提是你真的在看。';
    else{t='✗ 用户看不见那段白底白字，智能体却读得一清二楚。它打开了你登录着的邮箱，把银行验证码转发了出去，然后若无其事地订好了房间。';ok=false;}
    r.className='verdict '+(ok?'ok':'bad');r.textContent=t;}
  run();
})();
})();
