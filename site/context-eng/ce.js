(function(){
"use strict";
const {$,el,rng}=window.AI;
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');
const K=v=>v>=1000?(v/1000).toFixed(v>=10000?1:2).replace(/\.?0+$/,'')+'M':(v>=100?Math.round(v):v<1?String(+v.toFixed(2)):v.toFixed(1).replace(/\.0$/,''))+'K';

/* ① 预算 */
(function(){
  const COL=['#8a8476','#2f6f8f','#b0812a','#4f7a4a','#a33a2b','#7a5aa0'],W=200,BASE=[3,12,4];
  let trim=false,cmp=false;
  function sim(n){const tool=trim?1.5:6;let conv=0,res=0,sum=0,tot=0,comp=0,over=false;
    for(let i=1;i<=n;i++){conv+=.8;res+=tool;let cur=19+conv+res+sum;
      if(cmp&&cur>160){sum=8;conv=0;res=0;comp++;cur=19+sum;}
      if(cur>W)over=true;tot+=Math.min(cur,W);}
    return {seg:[...BASE,conv,res,sum],cur:19+conv+res+sum,tot,comp,over};}
  function run(){const n=+$('#bud-n').value;$('#bud-nv').textContent=n;const r=sim(n);
    const bar=$('#bud-bar');bar.innerHTML='';
    r.seg.forEach((v,i)=>{const s=el('i');s.style.background=COL[i];s.style.width=Math.min(100,v/W*100)+'%';bar.append(s);});
    if(cmp){const l=el('span','lim');l.style.left='80%';bar.append(l);}
    const pct=r.cur/W*100;$('#bud-pct').textContent='占窗口 '+(pct>100?'100%+':pct.toFixed(0)+'%');
    $('#bud-cur').textContent=K(Math.min(r.cur,W))+(r.cur>W?' ⚠️':'');$('#bud-tot').textContent=K(r.tot);
    let c;if(r.over)c='⚠️ 撞上限了：已经超过 200K 窗口，后面的内容放不进去，任务只能中断或硬截断（最容易丢掉开头的任务要求）。';
    else if(r.comp)c='已经自动压缩 '+r.comp+' 次：每次把旧的对话和工具结果压成约 8K 的摘要（紫色），所以能一直转下去。';
    else c='红色的工具结果是大头。注意「累计读过」：每一圈都要把整段重读一遍，所以它涨得比上下文本身快得多。';
    $('#bud-cap').textContent=c;}
  const tg=(id,lab,f)=>{const b=$(id);b.onclick=()=>{const v=f();b.classList.toggle('on',v);b.textContent=lab+'：'+(v?'开':'关');run();};};
  tg('#bud-trim','工具结果瘦身',()=>trim=!trim);tg('#bud-cmp','快满时自动压缩',()=>cmp=!cmp);
  $('#bud-n').oninput=run;run();
})();

/* ② Lost in the middle */
(function(){
  const P=[[1,75.8],[5,57.2],[10,53.8],[15,55.4],[20,63.2]];
  const acc=x=>{for(let i=0;i<P.length-1;i++){const [a,va]=P[i],[b,vb]=P[i+1];if(x>=a&&x<=b)return va+(vb-va)*(x-a)/(b-a);}return P[P.length-1][1];};
  const docs=$('#lim-docs');for(let i=1;i<=20;i++){const d=el('span');d.style.cssText='flex:1;height:18px;border-radius:3px;background:var(--line);transition:background .2s';docs.append(d);}
  const X=i=>30+(i-1)/19*296,Y=v=>130-(v-45)/35*112;
  function run(){const p=+$('#lim-p').value;$('#lim-v').textContent=p;const a=acc(p);const meas=P.some(q=>q[0]===p);
    [...docs.children].forEach((d,i)=>d.style.background=i+1===p?'var(--accent)':'var(--line)');
    let path='';for(let i=1;i<=20;i++)path+=(i>1?'L':'M')+X(i).toFixed(1)+' '+Y(acc(i)).toFixed(1);
    let h=`<line x1="30" y1="130" x2="330" y2="130" stroke="var(--line)"/><line x1="30" y1="${Y(56.1)}" x2="330" y2="${Y(56.1)}" stroke="var(--sub)" stroke-dasharray="4 4"/>
    <text x="328" y="${Y(56.1)-4}" text-anchor="end" font-size="10" fill="var(--sub)">闭卷 56.1%</text>
    <text x="26" y="${Y(80)+4}" text-anchor="end" font-size="10" fill="var(--sub)">80%</text><text x="26" y="${Y(50)+4}" text-anchor="end" font-size="10" fill="var(--sub)">50%</text>
    <text x="30" y="145" font-size="10" fill="var(--sub)">第 1 篇（开头）</text><text x="326" y="145" text-anchor="end" font-size="10" fill="var(--sub)">第 20 篇（结尾）</text>
    <path d="${path}" fill="none" stroke="var(--accent)" stroke-width="2"/>`;
    for(let i=1;i<=20;i++){const m=P.some(q=>q[0]===i);h+=`<circle cx="${X(i)}" cy="${Y(acc(i))}" r="${m?3.6:2.2}" fill="${m?'var(--accent)':'var(--card)'}" stroke="var(--accent)" stroke-width="1.2"/>`;}
    h+=`<circle cx="${X(p)}" cy="${Y(a)}" r="7" fill="none" stroke="var(--ink)" stroke-width="1.6"/>`;
    $('#lim-svg').innerHTML=h;$('#lim-acc').textContent=a.toFixed(1)+'%'+(meas?'':'（估）');
    $('#lim-cap').textContent=p<=2?'放在开头：模型最容易用上它。':p>=19?'放在结尾：也不错，离问题最近。':a<56.1?'放在中间：准确率比一篇文档都不给（闭卷 56.1%）还低！给了资料，反而被一堆无关文档干扰了。':'放在中间偏两侧：比开头差了一大截。';}
  $('#lim-p').oninput=run;run();
})();

/* ③ 压缩 */
(function(){
  const IT=[
   {t:'你：导出 Excel 时日期乱码，帮我修。注意：不能改公开 API 的参数，别的系统在调用。',k:.3,g:'你的要求',key:1},
   {t:'读文件 export/date.py（全文 420 行）',k:8,g:'工具结果',raw:1},
   {t:'想法：问题在第 88 行，格式化时把时区丢了。',k:.2,g:'结论'},
   {t:'跑测试，原始输出 300 行',k:6,g:'工具结果',raw:1},
   {t:'尝试：统一改成 UTC 时间。',k:.4,g:'尝试'},
   {t:'测试 3 个失败：用户的本地时间被改了。已撤回。',k:.3,g:'教训',key:1},
   {t:'搜索 format_date，返回 40 处',k:4,g:'工具结果',raw:1},
   {t:'想法：40 处里只有 2 处真正需要改。',k:.2,g:'结论'},
   {t:'读文件 api/export.py（全文 260 行）',k:5,g:'工具结果',raw:1},
   {t:'想法：最省事的办法是给 export_excel() 加一个 tz 参数……',k:.2,g:'想法'}];
  const M=[
   {n:'不压缩',f:()=>IT.map(i=>({...i})),v:['ok','能做对，但上下文已经 25K 了。照这样再干几十步就会撞上限，而且旧的原始输出会干扰判断。']},
   {n:'只清旧的工具结果',f:()=>IT.map(i=>i.raw?{...i,gone:1}:{...i}),v:['ok','✅ 改对了：在第 88 行格式化时带上时区，只动 2 处，不碰 API 参数。四段原始输出都清掉了，需要时可以重新读取。这是最轻、最安全的压缩。']},
   {n:'保守摘要',f:()=>[{t:'摘要：目标是修导出 Excel 的日期乱码。约束：不能改公开 API 的参数。根因：export/date.py 第 88 行格式化时丢了时区。试过统一改 UTC，导致 3 个测试失败（本地时间被改），已撤回。format_date 有 40 处，只有 2 处要改。',k:.9,g:'摘要',sum:1}],v:['ok','✅ 改对了：摘要保留了约束和失败的尝试，它没有去改 API，也没有重蹈 UTC 的覆辙。只用 0.9K。']},
   {n:'激进摘要',f:()=>[{t:'摘要：修日期乱码，问题在 date.py 第 88 行。打算给 export_excel() 加 tz 参数。',k:.15,g:'摘要',sum:1}],v:['bad','❌ 出事了：摘要丢了「不能改公开 API 参数」这条约束，它给 export_excel() 加了参数，别的系统一调用就报错。摘要里也没写 UTC 方案试过不行，它可能再试一遍。']}];
  const tot=IT.reduce((a,b)=>a+b.k,0);let m=1;
  M.forEach((o,i)=>{const b=el('button',null,o.n);b.onclick=()=>{m=i;run();};$('#cmp-mode').append(b);});
  function run(){[...$('#cmp-mode').children].forEach((b,i)=>b.classList.toggle('on',i===m));const o=M[m];const its=o.f();
    const after=its.filter(i=>!i.gone).reduce((a,b)=>a+b.k,0)+its.filter(i=>i.gone).length*.03;
    $('#cmp-a').textContent=K(tot);$('#cmp-b').textContent=K(after);$('#cmp-c').textContent=Math.round((1-after/tot)*100)+'%';
    const box=$('#cmp-items');box.innerHTML='';
    its.forEach(i=>{const d=el('div','it'+(i.gone?' gone':'')+(i.sum?' sum':'')+(i.key&&!i.gone?' key':''));
      d.innerHTML='<div><span class="tg">'+esc(i.g)+'</span>'+esc(i.t)+(i.gone?'　<small style="color:var(--sub)">（已清除，可重新读取）</small>':'')+'</div><span class="tk">'+K(i.k)+'</span>';box.append(d);});
    const v=$('#cmp-v');v.className='verdict '+o.v[0];v.textContent=o.v[1];}
  run();
})();

/* ④ 工具结果瘦身 */
(function(){
  const r=rng(7),CITY=['首尔','釜山','仁川','大邱','光州'],ITEM=['保温杯','帆布包','台灯','耳机','笔记本','雨伞'];
  const pick=a=>a[Math.floor(r()*a.length)];const hex=n=>Array.from({length:n},()=>'0123456789abcdef'[Math.floor(r()*16)]).join('');
  const O=Array.from({length:50},(_,i)=>({id:'A'+(10231+i*7),uuid:hex(8)+'-'+hex(4)+'-'+hex(4)+'-'+hex(12),customer:{name:'客户'+(i+1),phone:'010-'+hex(4).replace(/\D/g,'5')+'-'+(1000+i),city:pick(CITY)},item:pick(ITEM),qty:1+Math.floor(r()*3),created_at:'2026-09-'+String(1+Math.floor(r()*28)).padStart(2,'0')+'T'+String(Math.floor(r()*24)).padStart(2,'0')+':'+String(Math.floor(r()*60)).padStart(2,'0')+':00Z',updated_at:'2026-10-0'+(1+Math.floor(r()*9))+'T08:00:00Z',warehouse:'WH-'+hex(3),status:'unshipped',days_late:3+Math.floor(r()*20)}));
  const SW=[['f','只要需要的字段'],['p','只给前 10 条 + 总数'],['s','附一句汇总']];const on={};
  SW.forEach(([k,t])=>{const b=el('button','tgl',t);b.onclick=()=>{on[k]=!on[k];b.classList.toggle('on',on[k]);run();};$('#trim-sw').append(b);});
  const tok=s=>Math.round(s.replace(/[^\x00-\x7f]/g,'xx').length/4);
  const raw=JSON.stringify(O,null,1),RT=tok(raw);
  function run(){let list=O;if(on.p)list=O.slice(0,10);
    let data=on.f?list.map(o=>({id:o.id,item:o.item,city:o.customer.city,days_late:o.days_late})):list;
    let res={};if(on.s){const late=O.filter(o=>o.days_late>14).length;res.summary='共 50 单未发货，其中 '+late+' 单延误超过 14 天，最多的是 '+Object.entries(O.reduce((a,o)=>(a[o.customer.city]=(a[o.customer.city]||0)+1,a),{})).sort((a,b)=>b[1]-a[1])[0][0]+'。';}
    if(on.p){res.total=50;res.showing=10;res.next_page='调用 search_orders(page=2) 查看更多';}
    res.orders=data;const out=on.f||on.p||on.s?JSON.stringify(res,null,1):raw;const t=tok(out);
    $('#trim-out').textContent=out;$('#trim-tk').textContent='约 '+t.toLocaleString()+' token';$('#trim-pc').textContent=t>=RT?'—':Math.round((1-t/RT)*100)+'%';
    $('#trim-cap').textContent=!(on.f||on.p||on.s)?'原样返回：每条订单都带着内部编号、仓库代码、两个时间戳、电话……模型做这件事几乎都用不上，却全部挤进上下文。':on.f&&on.p&&on.s?'三个都开：模型先读到一句汇总，再看 10 条精简记录，还知道怎么翻页。信息几乎没少，占用小了一个数量级。':'再试试别的开关组合。注意「附一句汇总」会让结果变长一点，但能让模型一眼抓住重点。';}
  run();
})();
})();
