(function(){
"use strict";
const {$,el}=window.AI;
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');
const K=v=>v>=1000?(v/1000).toFixed(1).replace(/\.0$/,'')+'K':Math.round(v)+'';
const segOn=(box,i)=>[...box.children].forEach((x,j)=>x.classList.toggle('on',j==i));
/* ① */
(function(){
  const COL=['#8a8476','#2f6f8f','#b0812a','#a33a2b'],W=200000;let t=0;
  function bar(id,parts){const b=$(id);b.innerHTML='';parts.forEach((v,i)=>{const s=el('i');s.style.background=COL[i];s.style.width=Math.min(100,v/W*100)+'%';b.append(s);});}
  function run(){const n=+$('#pd-n').value;$('#pd-nv').textContent=n;
    const all=20000+n*100+n*3000+n*4000;
    const used=t==0?0:1,ref=t==2?4000:0;
    const pd=20000+n*100+used*3000+ref;
    bar('#pd-a',[20000,n*100,n*3000,n*4000]);bar('#pd-b',[20000,n*100,used*3000,ref]);
    $('#pd-x').textContent=K(all)+(all>W?' ⚠️':'');$('#pd-y').textContent=K(pd);
    $('#pd-cap').textContent=all>W?'全部塞进去的话，装到 '+Math.floor(180000/7100)+' 个左右就超过 200K 窗口了；渐进披露装 '+n+' 个只占 '+K(pd)+'，其中封面一共 '+K(n*100)+'。':'渐进披露时，没用到的 Skill 每个只占约 100 token 的封面。'+(t?'用到的那个才把正文'+(t==2?'和参考资料':'')+'读进来。':'');}
  [...$('#pd-task').children].forEach((b,i)=>b.onclick=()=>{t=i;segOn($('#pd-task'),i);run();});
  $('#pd-n').oninput=run;run();
})();
/* ② */
(function(){
  const SK=[['contract-review','审查合同：找出付款、违约、保密等条款并标出风险。用户提到合同、条款、协议时使用。','处理文档',['合同','条款']],
    ['weekly-report','按市场部格式撰写周报。用户提到周报、本周总结、每周数据时使用。','写东西',['周报','本周总结']],
    ['pdf','读取、拆分、合并 PDF，填写 PDF 表单。用户提到 PDF 或表单时使用。','处理文档',['PDF','表格','表单']]];
  const Q=[['合同','条款'],['本周总结'],['PDF','表格']];let q=0,vague=false;
  function run(){const box=$('#tr-list');box.innerHTML='';let hit=-1,amb=[];
    SK.forEach((s,i)=>{const d=vague?s[2]:s[1];const m=vague?0:Q[q].filter(w=>s[3].includes(w)).length;if(m)hit=i;});
    if(vague)amb=q==1?[1]:[0,2];
    SK.forEach((s,i)=>{const d=el('div','ski');d.innerHTML='<code>'+s[0]+'</code><small>'+esc(vague?s[2]:s[1])+'</small>';
      if(!vague&&i==hit)d.classList.add('hit');if(vague&&q==0&&i==2)d.classList.add('wrong');if(vague&&q==2&&i==2)d.classList.add('hit');box.append(d);});
    const r=$('#tr-r');
    if(!vague){r.className='verdict ok';r.textContent='✓ 请求里的「'+Q[q].join('」「')+'」直接出现在 '+SK[hit][0]+' 的描述里，模型去读了它的 SKILL.md。';}
    else if(q==1){r.className='verdict bad';r.textContent='✗ 「写东西」太宽泛，模型不确定这是不是它要的，很可能直接自己写，没按你们的格式。';}
    else {r.className='verdict bad';r.textContent='✗ 两个 Skill 都叫「处理文档」，模型只能猜。'+(q==0?'这次它打开了 pdf，白白读了 3000 token 还没用。':'这次碰巧猜对，但下次未必。');}}
  [...$('#tr-q').children].forEach((b,i)=>b.onclick=()=>{q=i;segOn($('#tr-q'),i);run();});
  $('#tr-vague').onclick=function(){vague=!vague;this.classList.toggle('on',vague);this.textContent='description 写得含糊：'+(vague?'开':'关');run();};run();
})();
/* ③ */
(function(){
  const P=[['weekly-report','按市场部格式撰写周报（四节结构、固定措辞）。用户提到“周报”“本周总结”或需要汇报每周数据时使用。'],['-weekly','写周报'],['weekly--report','按市场部格式撰写周报。用户提到周报时使用。']];
  function run(){const n=$('#ed-name').value,d=$('#ed-desc').value;
    const R=[[n.length>=1&&n.length<=64,'name 长度 1–64 个字符（现在 '+n.length+'）'],
      [/^[a-z0-9-]*$/.test(n)&&n.length>0,'name 只用小写字母、数字、连字符'],
      [!/^-|-$/.test(n),'name 不以连字符开头或结尾'],
      [!/--/.test(n),'name 不含连续两个连字符'],
      [d.trim().length>=1&&d.length<=1024,'description 长度 1–1024 个字符（现在 '+d.length+'）'],
      [/时使用|时用|when/i.test(d),'description 写了「什么时候用」（规范建议，非硬性）']];
    $('#ed-rules').innerHTML=R.map(r=>'<li class="'+(r[0]?'':'bad')+'">'+(r[0]?'✓ ':'✗ ')+esc(r[1])+'</li>').join('');
    const hard=R.slice(0,5).every(r=>r[0]),all=R.every(r=>r[0]);const v=$('#ed-r');
    v.className='verdict '+(all?'ok':'bad');v.textContent=all?'✓ 合格，而且描述写清了触发时机。':hard?'格式合格，但描述没说什么时候用，智能体可能想不起来用它。':'✗ 不合格：照规范，这个 Skill 可能无法被加载。';}
  [...$('#ed-pre').children].forEach((b,i)=>b.onclick=()=>{$('#ed-name').value=P[i][0];$('#ed-desc').value=P[i][1];run();});
  $('#ed-name').oninput=run;$('#ed-desc').oninput=run;run();
})();
/* ④ */
(function(){
  const L=['MCP','Skill','系统提示','子智能体'];
  const Q=[['让智能体能读写公司的 Jira',0,'要连上一个外部服务：MCP 服务器。'],
   ['教它按公司模板做季度汇报 PPT',1,'是「怎么做」的经验，只在做汇报时需要：Skill。'],
   ['所有回答都用简体中文',2,'每次都要遵守、只有一句话：放系统提示。'],
   ['在大代码库里找出所有用到旧接口的地方，只要清单',3,'要读很多文件、但只需要结论：派子智能体，别弄脏主上下文。'],
   ['报销单的 23 条审核规则和例外情况',1,'很长、只在审报销时用：Skill（规则可以放 references/ 里）。']];
  let sc=0;const box=$('#ch');
  Q.forEach(q=>{const d=el('div','ski');d.innerHTML='<div>'+esc(q[0])+'</div>';const s=el('div','seg');s.style.marginTop='6px';const fb=el('small');
    L.forEach((l,i)=>{const b=el('button');b.textContent=l;b.onclick=()=>{if(d.dataset.done)return;d.dataset.done=1;b.classList.add('on');const ok=i==q[1];if(ok)sc++;
      d.classList.add(ok?'hit':'wrong');fb.textContent=(ok?'✓ ':'✗ 更合适的是「'+L[q[1]]+'」。')+q[2];$('#ch-s').textContent=sc+' / '+Q.length;};s.append(b);});
    d.append(s,fb);box.append(d);});
})();
})();
