(function(){
"use strict";
const {$,el}=window.AI;
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');
const segOn=(box,i)=>[...box.children].forEach((x,j)=>x.classList.toggle('on',j==i));
const H=h=>h<24?h+' 小时前':h<24*60?Math.round(h/24)+' 天前':Math.round(h/24/30)+' 个月前';
/* ① */
const M=[['去年送过小林一本诗集，她说很喜欢',8760,6,[.95,.05]],
 ['小林上周说她搬进了很小的单间，别送大件',150,7,[.6,.05]],
 ['小林说最近迷上了手冲咖啡',72,5,[.85,.1]],
 ['早上刷牙、洗脸',3,1,[.05,.05]],
 ['医生说我最近胃不好，要少吃辣',30,8,[.05,.6]],
 ['我一直很喜欢川菜',4000,4,[.05,.9]],
 ['中午和同事吃了火锅',6,2,[.05,.8]],
 ['楼下新开了一家面馆',48,3,[.1,.7]],
 ['小林家里养了两只猫',2000,4,[.7,.02]]];
window.__memScore=function(q,w){const rec=M.map(m=>Math.pow(.995,m[1])),imp=M.map(m=>m[2]),rel=M.map(m=>m[3][q]);
  const nz=a=>{const lo=Math.min(...a),hi=Math.max(...a);return a.map(v=>(v-lo)/(hi-lo||1));};
  const R=nz(rec),I=nz(imp),L=nz(rel);return M.map((m,i)=>({i,r:R[i],im:I[i],l:L[i],s:w?R[i]+I[i]+L[i]:L[i]}));};
(function(){let q=0,w=1;
  function run(){const sc=window.__memScore(q,w);const ord=[...sc].sort((a,b)=>b.s-a.s);const top=new Set(ord.slice(0,3).map(x=>x.i));
    const box=$('#rt-list');box.innerHTML='';
    ord.forEach(x=>{const m=M[x.i];const d=el('div','mr'+(top.has(x.i)?' top':' dim'));
      d.innerHTML='<span>'+esc(m[0])+'</span><span class="sc">'+x.s.toFixed(2)+'</span><small>'+H(m[1])+' · 新近 '+x.r.toFixed(2)+' · 重要 '+x.im.toFixed(2)+'（'+m[2]+'/10） · 相关 '+x.l.toFixed(2)+'</small>';box.append(d);});
    const has=i=>top.has(i);let c;
    if(q==0)c=has(1)?'✓ 「搬进小单间、别送大件」这条较新、较重要，被取了出来，礼物建议会避开大件。不过注意第三条「少吃辣」和礼物毫无关系也挤了进来：三项等权时，又新又重要的记忆会占位置。这是这套简单公式的毛病，实际系统会调权重或先按相关度筛一遍。':'✗ 只看相关时，取出的是一年前的诗集和咖啡，漏掉了「别送大件」。智能体可能推荐一台咖啡机。';
    else c=has(4)?'✓ 「医生说要少吃辣」重要性 8 分，又是最近的事，被排在前面。':'✗ 只看相关时，「喜欢川菜」「中午吃火锅」排在前面，「胃不好要少吃辣」没取到。智能体可能推荐水煮鱼。';
    $('#rt-cap').textContent=c;}
  [...$('#rt-q').children].forEach((b,i)=>b.onclick=()=>{q=i;segOn($('#rt-q'),i);run();});
  [...$('#rt-w').children].forEach((b,i)=>b.onclick=()=>{w=i;segOn($('#rt-w'),i);run();});run();})();
/* ② */
(function(){
  const T=[['「我对花生过敏」',1,0,'长期、重要'],['「这周我在上海出差」',0,0,'临时的'],['「帮我查下张三的身份证号 3101…」',0,0,'敏感信息'],
    ['「我喜欢简短的回答」',1,0,'长期偏好'],['「我住在杭州」（一月）',1,1,'会变的事实'],['「我搬到成都了」（三月）',1,2,'更新']];
  const R=[['bad','✗ 三个月后它还以为你在上海出差，推荐上海的餐厅；记下了别人的身份证号（隐私风险）；同时记着「住杭州」和「搬到成都」，回答时左右摇摆。'],
    ['bad','比较干净了，但「住在杭州」和「搬到成都」两条并存：问它附近的医院，它有一半概率按杭州答。'],
    ['ok','✓ 只留长期有用的；新事实替换掉旧事实。你还可以在设置里看到并删除每一条。']];
  function run(p){const box=$('#wr-list');box.innerHTML='';
    T.forEach(t=>{let keep=p==0?true:t[1]==1;let cls='';let note=t[3];
      if(p==2&&t[2]==1){keep=false;}
      if(!keep){cls=' dim';note+=p==2&&t[2]==1?' → 被三月的新事实替换':' → 不记';}
      else if(p==0&&t[1]==0)cls=' bad';else if(p==1&&t[2])cls=' bad';else cls=' top';
      const d=el('div','mr'+cls);d.innerHTML='<span>'+esc(t[0])+'</span><span class="sc">'+(keep?'已记住':'—')+'</span><small>'+esc(note)+'</small>';box.append(d);});
    $('#wr-r').className='verdict '+R[p][0];$('#wr-r').textContent=R[p][1];}
  [...$('#wr-p').children].forEach((b,i)=>b.onclick=()=>{segOn($('#wr-p'),i);run(i);});run(0);
})();
/* ③ */
(function(){let t=0;
  function run(){const n=+$('#sp-n').value;$('#sp-nv').textContent=n;let time,tok,q,c;
    if(t==0){const k=Math.min(n,8);time=8/k+ (n>1?0.6:0);tok=n==1?1:(1+0.4*n)*1.6;q=Math.min(95,55+Math.round(40*(1-Math.exp(-(n-1)/2.2))));
      c=n==1?'一个智能体依次查 8 家公司：慢，而且 8 份财报塞进一个窗口，后面的会挤掉前面的细节。':'每个子智能体查 '+(8/n%1?'约 ':'')+Math.ceil(8/n)+' 家，各用一个干净窗口，主智能体只读结论。快了，也更全面，但 token 花费涨到 '+tok.toFixed(1)+' 倍。'+(n>=6?'再往上加，收益越来越小。':'');}
    else{time=n==1?6:6/Math.min(n,2)+1.2*(n-1);tok=n==1?1:(1+0.5*n)*1.5;q=n==1?80:Math.max(25,80-12*(n-1));
      c=n==1?'一个智能体从头到尾改：慢一点，但每一步都知道前面改了什么。':'模块之间互相调用，'+n+' 个子智能体各改各的，接口对不上，主智能体要花大量时间合并、返工。分得越多越糟。';}
    $('#sp-time').textContent=time.toFixed(1)+' h';$('#sp-tok').textContent=tok.toFixed(1)+' 倍';$('#sp-q').textContent=q+' 分';$('#sp-cap').textContent=c;}
  [...$('#sp-t').children].forEach((b,i)=>b.onclick=()=>{t=i;segOn($('#sp-t'),i);run();});$('#sp-n').oninput=run;run();})();
/* ④ */
(function(){
  const S=[
   [['子智能体 A 收到','「做 Flappy Bird 的背景」','x','画了超级马里奥风格的砖块和水管，像素风'],['子智能体 B 收到','「做一只会飞的小鸟」','x','画了一只写实风格的 3D 小鸟，尺寸也不对']],
   [['子智能体 A 收到','任务原文 + 「整体用简洁扁平风格，画布 288×512」+ B 在做什么','y','扁平风格的天空和绿色管道'],['子智能体 B 收到','任务原文 + 同样的风格约定 + A 已经画好的配色','y','扁平风格的黄色小鸟，配色一致']],
   [['唯一的智能体','先定风格，再画背景，再画小鸟','y','每一步都看得到之前的决定'],['代价','慢一些','','任务很长时要靠上下文压缩撑住']]];
  const V=[['bad','✗ 拼不到一起：两个子智能体各自做了合理但互相冲突的决定，主智能体只能返工。这正是 Cognition 文章里的例子。'],
    ['ok','✓ 共享了背景和已做的决定，结果对得上。代价是每个子智能体的上下文变长了。'],['ok','✓ Cognition 推荐的默认做法：一条线做下去，决定不会冲突。']];
  function run(m){$('#ho-g').innerHTML=S[m].map(a=>'<div class="'+a[2]+'"><b>'+esc(a[0])+'</b>'+esc(a[1])+'<br>→ '+esc(a[3])+'</div>').join('');$('#ho-r').className='verdict '+V[m][0];$('#ho-r').textContent=V[m][1];}
  [...$('#ho-m').children].forEach((b,i)=>b.onclick=()=>{segOn($('#ho-m'),i);run(i);});run(0);
})();
})();
