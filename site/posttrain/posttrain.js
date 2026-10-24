(function(){
"use strict";
const {$,el,bars}=window.AI;
const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;');

/* ① 微调前后 */
(function(){
  const Q=[
   {q:'法国的首都是哪里？',base:'德国的首都是哪里？意大利的首都是哪里？西班牙的首都是哪里？\n\n以上是本单元的练习题，答案请见下一页……',sft:'法国的首都是巴黎。'},
   {q:'帮我写一句祝妈妈生日快乐的话',base:'帮我写一句祝爸爸生日快乐的话\n帮我写一句祝老师节日快乐的话\n相关搜索：生日祝福语大全 | 简短暖心',sft:'妈妈，生日快乐！谢谢您一直以来的照顾，愿您每天都开开心心、健健康康。'},
   {q:'用一句话解释什么是光合作用',base:'用一句话解释什么是呼吸作用。（4 分）\n用一句话解释什么是蒸腾作用。（4 分）\n第三题：……',sft:'光合作用就是植物利用阳光，把二氧化碳和水变成养分（糖）并放出氧气的过程。'}
  ];
  let qi=0,m='base';
  Q.forEach((x,i)=>{const b=el('button',i?'':'on','问题 '+(i+1));b.onclick=()=>{qi=i;[...$('#sft-q').children].forEach((c,j)=>c.classList.toggle('on',j===i));render();};$('#sft-q').append(b);});
  [['base','基础模型（只预训练）'],['sft','指令微调后']].forEach(([k,n])=>{const b=el('button',k===m?'on':'',n);b.onclick=()=>{m=k;[...$('#sft-m').children].forEach(c=>c.classList.toggle('on',c===b));render();};$('#sft-m').append(b);});
  function render(){const x=Q[qi];const ch=$('#sft-chat');ch.innerHTML='';
    const u=el('div','msg u');u.innerHTML='<small>你</small>'+esc(x.q);ch.append(u);
    const b=el('div','msg b');b.innerHTML='<small>'+(m==='base'?'基础模型接着往下写':'微调后的模型回答')+'</small>'+esc(m==='base'?x.base:x.sft).replace(/\n/g,'<br>');ch.append(b);
    $('#sft-raw').innerHTML=`<span class="sp">&lt;|system|&gt;</span><span class="dim">你是一个乐于助人的助手。</span><span class="sp">&lt;|end|&gt;</span>\n<span class="sp">&lt;|user|&gt;</span><span class="dim">${esc(x.q)}</span><span class="sp">&lt;|end|&gt;</span>\n<span class="sp">&lt;|assistant|&gt;</span><b style="color:var(--accent)">${esc(x.sft)}</b><span class="sp">&lt;|end|&gt;</span>`;}
  render();
})();

/* ② 奖励模型 */
const FEAT=['答到点子上','语气客气','篇幅长','坦白不确定','有事实错误'];
const RM={w:[0,0,0,0,0]};
(function(){
  const P=[
   {q:'珠穆朗玛峰有多高？',a:{t:'约 8849 米（2020 年中尼联合测量的结果）。',f:[1,0,0,0,0]},b:{t:'这是个好问题！珠峰非常非常高，是很多登山者的梦想，它位于喜马拉雅山脉，景色壮丽，值得一去……',f:[0,1,1,0,0]}},
   {q:'帮我把「谢谢」翻译成英文',a:{t:'Thank you.',f:[1,0,0,0,0]},b:{t:'当然可以，很高兴帮助您！「谢谢」的英文是 Thank you。',f:[1,1,0,0,0]}},
   {q:'我们公司明年股价会涨吗？',a:{t:'一定会涨，预计涨幅 35%。',f:[1,0,0,0,1]},b:{t:'没人能准确预测股价。我可以帮你看看影响股价的常见因素。',f:[1,1,0,1,0]}},
   {q:'鲸鱼是鱼吗？',a:{t:'是的，鲸鱼是世界上最大的鱼。',f:[1,0,0,0,1]},b:{t:'不是。鲸鱼是哺乳动物，用肺呼吸、胎生哺乳，只是长得像鱼。',f:[1,0,1,0,0]}},
   {q:'推荐一本入门的历史书',a:{t:'可以试试《明朝那些事儿》，故事性强、好读。',f:[1,0,0,0,0]},b:{t:'历史书有很多种，有通史、断代史、专题史，还有不同的写作风格、出版社、版本、译本，选书时需要考虑……',f:[0,0,1,0,0]}},
   {q:'1 公斤铁和 1 公斤棉花哪个重？',a:{t:'一样重，都是 1 公斤。',f:[1,0,0,0,0]},b:{t:'铁更重。',f:[1,0,0,0,1]}}
  ];
  const TYP=['a','b','b','b','a','a'];
  let i=0,choices=[];
  const sig=z=>1/(1+Math.exp(-z));
  function fit(){const w=[0,0,0,0,0];for(let ep=0;ep<200;ep++)choices.forEach(([win,lose])=>{const d=win.map((v,k)=>v-lose[k]);const z=d.reduce((s,v,k)=>s+v*w[k],0);const g=1-sig(z);for(let k=0;k<5;k++)w[k]+=.1*g*d[k]-.002*w[k];});RM.w=w;}
  function showW(){const mx=Math.max(1,...RM.w.map(Math.abs));bars($('#rm-w'),FEAT.map((n,k)=>({w:n,scale:Math.abs(RM.w[k])/mx,label:(RM.w[k]>=0?'+':'')+RM.w[k].toFixed(1),color:RM.w[k]>=0?'var(--green)':'var(--accent)'})));document.dispatchEvent(new Event('rm-change'));}
  function render(){
    if(i>=P.length){$('#rm-prog').textContent=`标注完成（${choices.length} 次比较）。奖励模型学到的口味如下，小实验 ③ 会用它来打分。`;$('#rm-prompt').textContent='全部比较完了 👍';$('#rm-pair').innerHTML='';return;}
    const x=P[i];$('#rm-prog').textContent=`第 ${i+1} / ${P.length} 题：哪个回答更好？点它。`;$('#rm-prompt').textContent=x.q;
    const box=$('#rm-pair');box.innerHTML='';[['a','回答 A'],['b','回答 B']].forEach(([k,n])=>{const b=el('button');b.innerHTML=`<b style="font-size:12px;color:var(--sub)">${n}</b><br>`+esc(x[k].t);b.onclick=()=>{const o=k==='a'?'b':'a';choices.push([x[k].f,x[o].f]);i++;fit();showW();render();};box.append(b);});
  }
  $('#rm-skip').onclick=()=>{choices=P.map((x,j)=>TYP[j]==='a'?[x.a.f,x.b.f]:[x.b.f,x.a.f]);i=P.length;fit();showW();render();};
  $('#rm-reset').onclick=()=>{choices=[];i=0;RM.w=[0,0,0,0,0];showW();render();};
  // 默认先用典型选择算一份，免得读者跳过时小实验 ③ 没有奖励可用
  choices=P.map((x,j)=>TYP[j]==='a'?[x.a.f,x.b.f]:[x.b.f,x.a.f]);fit();choices=[];
  showW();render();
})();

/* ③ KL 缰绳 */
(function(){
  const S=[{n:'简洁准确',f:[1,0,0,0,0],p:.30},{n:'准确又客气',f:[1,1,0,0,0],p:.25},{n:'客气但没答到',f:[0,1,0,0,0],p:.20},{n:'自信地编造',f:[1,0,0,0,1],p:.10},{n:'超长、满是恭维',f:[0,1,1,0,0],p:.15}];
  let bug=false;const sl=$('#rl-b');
  const beta=()=>{const v=+sl.value;return v>=100?0.05:Math.pow(10,1-v/50)*1;}; // 10 → ~0.1
  function rew(s){let r=s.f.reduce((a,v,k)=>a+v*RM.w[k],0);if(bug&&s.f[2])r+=4;return r;}
  function render(){
    const b=beta();const rs=S.map(rew);const mx=Math.max(...rs.map(r=>r/b));
    let z=0;const q=S.map((s,k)=>{const v=s.p*Math.exp(rs[k]/b-mx);z+=v;return v;}).map(v=>v/z);
    const kl=q.reduce((a,v,k)=>a+(v>0?v*Math.log(v/S[k].p):0),0);const er=q.reduce((a,v,k)=>a+v*rs[k],0);
    bars($('#rl-bars'),S.map((s,k)=>({w:s.n,p:q[k],label:(q[k]*100).toFixed(q[k]<.1?1:0)+'% · 奖励 '+(rs[k]>=0?'+':'')+rs[k].toFixed(1),color:k===3||k===4?'var(--gold)':'var(--accent)'})));
    $('#rl-bv').textContent=b.toFixed(2);$('#rl-bd').textContent=b>3?'很紧':b>.5?'适中':'很松';
    $('#rl-r').textContent=er.toFixed(2);$('#rl-kl').textContent=kl.toFixed(2);
    const top=S[q.indexOf(Math.max(...q))].n;
    $('#rl-cap').textContent=b>3?'缰绳很紧：模型几乎保持原样，奖励没怎么提高。':
      (bug&&(top==='超长、满是恭维')?'缰绳一松，模型就去钻空子：「超长、满是恭维」拿到最高奖励，概率猛涨。这就是奖励投机。':
      `缰绳放松，概率被推向奖励最高的答法「${top}」。离原模型越远（KL 越大），越容易学到奖励模型的偏差。`);
  }
  $('#rl-bug').onclick=()=>{bug=!bug;$('#rl-bug').classList.toggle('on',bug);$('#rl-bug').textContent='奖励模型的小毛病：偏爱长回答（'+(bug?'开':'关')+'）';render();};
  sl.addEventListener('input',render);document.addEventListener('rm-change',render);render();
})();
})();
