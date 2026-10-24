(function(){
"use strict";
const {$,el}=window.AI;
const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;');

/* ① 对话拼装 */
(function(){
  const SYS={'默认':'你是一个乐于助人的助手。今天是 2026 年 10 月 19 日。','只用一句话':'你是一个助手。无论问什么，都只用一句话回答。','像说书人':'你是一位说书先生，回答时用评书的口吻。'};
  const T=[
   ['推荐一部适合全家看的电影',{'默认':'可以看《千与千寻》，画面美、故事温暖，大人小孩都喜欢。','只用一句话':'推荐《千与千寻》。','像说书人':'列位看官，今儿个给您推荐一部《千与千寻》，那叫一个老少皆宜！'}],
   ['它讲的是什么？',{'默认':'讲一个叫千寻的小女孩误入神灵的世界，为了救回变成猪的父母，在汤屋里打工、慢慢长大的故事。','只用一句话':'讲小女孩千寻在神灵世界里救回父母的故事。','像说书人':'话说小姑娘千寻，误入神灵地界，爹娘变了猪，她只得进汤屋做工……欲知后事如何，且听下回分解！'}],
   ['导演还拍过什么？',{'默认':'导演是宫崎骏，他还拍过《龙猫》《哈尔的移动城堡》《天空之城》等。','只用一句话':'宫崎骏还拍过《龙猫》《哈尔的移动城堡》等。','像说书人':'这位导演宫崎骏，可了不得！《龙猫》《天空之城》，部部都是传世之作！'}]
  ];
  const FORGOT={1:'你说的「它」是指什么呢？能再具体说说吗？',2:'你想问的是哪位导演？'};
  let sys='默认',n=1,forget=false;
  Object.keys(SYS).forEach(k=>{const b=el('button',k===sys?'on':'',k);b.onclick=()=>{sys=k;[...$('#cd-sys').children].forEach(c=>c.classList.toggle('on',c===b));render();};$('#cd-sys').append(b);});
  function render(){
    const ch=$('#cd-chat');ch.innerHTML='';
    for(let i=0;i<n;i++){const u=el('div','msg u');u.innerHTML='<small>你</small>'+esc(T[i][0]);ch.append(u);
      const ans=(forget&&i===n-1&&FORGOT[i])?FORGOT[i]:T[i][1][sys];const b=el('div','msg b');b.innerHTML='<small>模型</small>'+esc(ans);ch.append(b);}
    let raw=`<span class="sp">&lt;|system|&gt;</span><span class="sys">${esc(SYS[sys])}</span><span class="sp">&lt;|end|&gt;</span>\n`;let len=SYS[sys].length+6;
    const start=forget?n-1:0;
    if(forget&&n>1)raw+=`<span class="dim">（之前的 ${n-1} 轮没有发过去）</span>\n`;
    for(let i=start;i<n;i++){raw+=`<span class="sp">&lt;|user|&gt;</span><span class="dim">${esc(T[i][0])}</span><span class="sp">&lt;|end|&gt;</span>\n`;len+=T[i][0].length+6;
      if(i<n-1){raw+=`<span class="sp">&lt;|assistant|&gt;</span>${esc(T[i][1][sys])}<span class="sp">&lt;|end|&gt;</span>\n`;len+=T[i][1][sys].length+6;}}
    raw+=`<span class="sp">&lt;|assistant|&gt;</span><b style="color:var(--accent)">← 模型从这里开始往下写</b>`;
    $('#cd-raw').innerHTML=raw;$('#cd-n').textContent=len;
    $('#cd-next').disabled=n>=T.length;$('#cd-next').textContent=n>=T.length?'聊完了':'下一轮 ▶';
  }
  $('#cd-next').onclick=()=>{if(n<T.length){n++;render();}};
  $('#cd-reset').onclick=()=>{n=1;render();};
  $('#cd-forget').onclick=()=>{forget=!forget;$('#cd-forget').classList.toggle('on',forget);$('#cd-forget').textContent='不把历史发过去（'+(forget?'开':'关')+'）';if(forget&&n<2)n=2;render();};
  render();
})();

/* ② 上下文窗口 */
(function(){
  const WIN=2000,SYS=150,DOC=700,U=50,A=140,SUM=120;let mode='drop';
  [['drop','丢掉最早的'],['sum','把旧对话压成摘要']].forEach(([k,n])=>{const b=el('button',k===mode?'on':'',n);b.onclick=()=>{mode=k;[...$('#wd-mode').children].forEach(c=>c.classList.toggle('on',c===b));render();};$('#wd-mode').append(b);});
  const sl=$('#wd-t');
  function render(){
    const t=+sl.value;$('#wd-tv').textContent=t;
    let items=[{k:'sys',n:SYS,c:'var(--blue)',pin:1},{k:'doc',n:DOC,c:'var(--gold)'}];
    for(let i=0;i<t;i++){items.push({k:'u',n:U,c:'var(--accent)'});items.push({k:'a',n:i===t-1?0:A,c:'var(--green)'});}
    items=items.filter(x=>x.n>0);
    let total=items.reduce((s,x)=>s+x.n,0),used=0,out=0;
    if(total>WIN){
      if(mode==='drop'){let room=WIN-SYS;for(let i=items.length-1;i>=1;i--){if(room>=items[i].n){room-=items[i].n;items[i].in=1;}else items[i].in=0;}items[0].in=1;}
      else{ // 摘要：保留最近的，把更早的（含文档）压成一段摘要
        let room=WIN-SYS-SUM;let cut=items.length;for(let i=items.length-1;i>=1;i--){if(room>=items[i].n){room-=items[i].n;cut=i;}else break;}
        const old=items.slice(1,cut);items=[items[0],{k:'sum',n:SUM,c:'#7b5ea7',in:1,was:old.reduce((s,x)=>s+x.n,0)},...items.slice(cut).map(x=>(x.in=1,x))];items[0].in=1;}
    }else items.forEach(x=>x.in=1);
    used=items.filter(x=>x.in).reduce((s,x)=>s+x.n,0);out=items.filter(x=>!x.in).reduce((s,x)=>s+x.n,0)+(items.find(x=>x.k==='sum')?.was||0);
    const st=$('#wd-strip');st.innerHTML='';
    items.forEach(x=>{const b=el('div','blk'+(x.in?'':' drop'));b.style.background=x.c;b.style.width=`calc(${x.n/WIN*100}% - 3px)`;b.title=x.n+' token';st.append(b);});
    $('#wd-in').textContent=used.toLocaleString()+' / 2,000';$('#wd-out').textContent=out?out.toLocaleString()+' 个':'没有';
    $('#wd-pairs').textContent=(used*used).toLocaleString();
    $('#wd-cap').textContent=total<=WIN?'还装得下，模型能看到全部内容。':mode==='drop'?'装不下了：最早的内容（连同那份长文档）被挤出窗口，变成灰色，模型再也看不到它们。':'装不下了：更早的对话和文档被压缩成一段摘要。省了地方，但细节丢了。';
  }
  sl.addEventListener('input',render);render();
})();

/* ③ 提示词积木 */
(function(){
  const B=[['ctx','背景：给 8 岁孩子讲'],['spec','要求：不超过 3 句'],['eg','例子：先打个比方'],['fmt','格式：先结论，再两条要点']];
  const on=new Set();
  B.forEach(([k,n])=>{const b=el('button',null,n);b.onclick=()=>{on.has(k)?on.delete(k):on.add(k);b.classList.toggle('on',on.has(k));render();};$('#pr-blocks').append(b);});
  const TXT={
   adult:{c:'天空是蓝色的，是因为阳光被空气散射，而蓝光被散射得最多。',r:['阳光包含各种颜色的光，波长短的蓝光更容易被空气分子散射，这叫瑞利散射。','被散射的蓝光从四面八方进入眼睛，所以整个天空看起来是蓝的；傍晚阳光穿过更厚的大气，蓝光散失多了，天空就偏红。'],a:'就像一群人在人潮里走，个子小的（蓝光）最容易被挤得东倒西歪，满场都是它们。'},
   kid:{c:'天空是蓝的，因为阳光里的蓝色最爱「到处乱跑」。',r:['太阳光其实藏着好多颜色，蓝色碰到空气就会弹来弹去。','它跑满了整个天空，所以我们抬头看到的就是蓝蓝的一片。'],a:'就像撒了一把蓝色的小弹珠，满屋子都是它们。'}
  };
  function render(){
    const t=TXT[on.has('ctx')?'kid':'adult'];
    let p='解释为什么天空是蓝色的。';
    if(on.has('ctx'))p+='\n读者是一个 8 岁的孩子，请用他能听懂的话。';
    if(on.has('spec'))p+='\n不超过 3 句话。';
    if(on.has('eg'))p+='\n参考这个风格：「彩虹就像阳光换上的七彩裙子……」先打个比方再解释。';
    if(on.has('fmt'))p+='\n格式：第一行一句话结论，然后列两条要点。';
    $('#pr-prompt').textContent=p;
    let parts=[];
    if(on.has('fmt')){let s='<b>'+esc(t.c)+'</b><br>';const rs=on.has('spec')?t.r.slice(0,1):t.r;if(on.has('eg'))s='<b>'+esc(t.c)+'</b><br>'+esc(t.a)+'<br>';s+=rs.map(r=>'· '+esc(r)).join('<br>');if(on.has('spec')&&!on.has('eg')&&t.r[1])s+='<br>· '+esc(t.r[1]);parts=[s];}
    else{let seq=[];if(on.has('eg'))seq.push(t.a);seq.push(t.c,...t.r);if(!on.size)seq.push('总之，这是一个涉及光学和大气物理的有趣现象，感兴趣的话还可以进一步了解米氏散射、大气成分对天空颜色的影响，以及其他星球上天空的颜色……');if(on.has('spec'))seq=seq.slice(0,3);parts=[seq.map(esc).join('')];}
    $('#pr-ans').innerHTML='<small>模型（示意）</small>'+parts.join('');
  }
  render();
})();
})();
