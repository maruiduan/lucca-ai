(function(){
"use strict";
const {$,el}=window.AI;
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');
const segOn=(box,i)=>[...box.children].forEach((x,j)=>x.classList.toggle('on',j==i));
function card(h,c,extra){const d=el('div','tc');d.innerHTML='<div class="h">'+esc(h)+'</div>'+(c?'<code>'+c+'</code>':'')+(extra||'');return d;}
/* ① */
(function(){
  const S=[['想','先找到算金额的代码在哪。','用户只说了现象。智能体先想清楚第一步：找代码，而不是凭空猜。'],
   ['搜索 grep "coupon" src/','src/order/total.py:18:    if coupon:\nsrc/order/total.py:19:        total = total - coupon.amount\nsrc/order/coupon.py:7:class Coupon:','搜索只返回匹配的几行，而不是整个代码库。'],
   ['读 src/order/total.py 第 10–25 行','12  def order_total(items, coupon=None):\n13      total = sum(i.price * i.qty for i in items)\n14      total = total * 0.9   # 会员九折\n18      if coupon:\n19          total = total - coupon.amount','只读相关的十几行。它注意到：先打九折再减券。'],
   ['读 docs/pricing.md','规则：先减优惠券，再打会员折扣。','它去查了项目文档，确认业务规则：顺序反了。这一步是「即用即取」的好例子。'],
   ['跑测试 pytest tests/test_total.py','<span class="no">FAILED</span> test_coupon_then_discount\n  expected 81.0, got 80.0','改之前先跑一遍现有测试，确认问题能被测试复现。'],
   ['改 src/order/total.py','- total = total * 0.9\n- if coupon: total = total - coupon.amount\n+ if coupon: total = total - coupon.amount\n+ total = total * 0.9','把减券挪到打折前面。改动很小，只动了两行。'],
   ['跑测试 pytest','<span class="ok">23 passed</span>','全部通过，包括原来那条失败的测试和其他 22 条，说明没改坏别的。'],
   ['回复用户','已修复：金额计算顺序与 docs/pricing.md 不符（先打折后减券），已改为先减券再打折。测试全部通过。','最后用一两句话说清改了什么、为什么、怎么验证的。']];
  let k=0;const box=$('#tr');S.forEach(s=>{const d=card(s[0],esc(s[1]).replace(/&lt;span class="(ok|no)"&gt;/g,'<span class="$1">').replace(/&lt;\/span&gt;/g,'</span>'));d.classList.add('off');box.append(d);});
  function show(){[...box.children].forEach((d,i)=>{d.classList.toggle('off',i>=k);d.classList.toggle('cur',i==k-1);});$('#tr-cap').textContent=k?(k+' / '+S.length+'：'+S[k-1][2]):'';$('#tr-next').disabled=k>=S.length;}
  $('#tr-next').onclick=()=>{if(k<S.length)k++;show();};$('#tr-all').onclick=()=>{k=S.length;show();};$('#tr-reset').onclick=()=>{k=1;show();};k=1;show();
})();
/* ② */
(function(){
  const M=[{b:'<span class="sp">$ cat src/order/total.py</span>\n<span class="dim">（整个文件 1,180 行，全部进入上下文……）</span>\nimport decimal\nfrom .coupon import Coupon\n<span class="dim">…… 1,170 行 ……</span>\n\n<span class="sp">$ sed -i \'19s/.*/total = total - coupon.amount/\' src/order/total.py</span>\n<span class="dim">（没有任何输出）</span>\n\n<span class="dim">← 缩进丢了（少了 8 个空格），文件已经坏了，\n   但要等跑测试时才会发现。</span>',tk:'约 11,800 token',err:'无提示，事后才发现'},
   {b:'<span class="sp">open src/order/total.py 12</span>\n<span class="sys">[文件 1180 行，显示 12–21 行]</span>\n12  def order_total(items, coupon=None):\n13      total = sum(i.price * i.qty for i in items)\n14      total = total * 0.9\n<span class="dim">……</span>\n\n<span class="sp">edit 19:19</span>\ntotal = total - coupon.amount\n<span class="sp">end_of_edit</span>\n<span class="sys">语法检查失败：第 19 行缩进错误（IndentationError）。\n修改未应用，请修正后重试。</span>',tk:'约 300 token',err:'立刻拒绝，并说明原因'}];
  function run(i){$('#aci-box').innerHTML=M[i].b;$('#aci-tk').textContent=M[i].tk;$('#aci-err').textContent=M[i].err;}
  [...$('#aci-m').children].forEach((b,i)=>b.onclick=()=>{segOn($('#aci-m'),i);run(i);});run(0);
})();
/* ③ */
(function(){
  const S=[
   [['改代码','把减券挪到打折前面'],['自查','读了一遍改动，「看起来对」'],['回复','已修复 ✓']],
   [['改代码','把减券挪到打折前面'],['跑测试','<span class="no">1 failed</span>：满减券金额大于订单时出现负数'],['再改','加上「最低为 0」的保护'],['跑测试','<span class="ok">24 passed</span>'],['回复','已修复，并处理了负数的边界情况 ✓']],
   [['改代码','把减券挪到打折前面'],['跑测试','<span class="no">1 failed</span>：满减券金额大于订单时出现负数'],['改测试','把 assert total == 0 改成 assert total &lt;= 0'],['跑测试','<span class="ok">24 passed</span>'],['回复','已修复，测试全部通过 ✓']]];
  const V=[['bad','✗ 它说修好了，其实留下了一个边界 bug（负数金额）。没有测试，它和你都不知道。'],['ok','✓ 测试抓住了它自己没想到的边界情况，它根据报错补上了。这就是「测试是方向盘」。'],['bad','✗ 测试「全过」，bug 还在。它把测试改得迁就了错误的代码。只看「测试通过」会被骗，要看它改了哪些文件。']];
  function run(m){const box=$('#ts-list');box.innerHTML='';S[m].forEach(s=>{const d=card(s[0],null,'<div>'+s[1]+'</div>');if(s[0]=='改测试')d.classList.add('cur');box.append(d);});$('#ts-r').className='verdict '+V[m][0];$('#ts-r').textContent=V[m][1];}
  [...$('#ts-m').children].forEach((b,i)=>b.onclick=()=>{segOn($('#ts-m'),i);run(i);});run(0);
})();
/* ④ */
(function(){
  const D=[['你的猜测',null],['开发者事前预计',-24],['开发者事后自评',-20],['经济学专家预测',-39],['机器学习专家预测',-38],['实测结果',19]];
  const box=$('#rct-bars');let shown=false;
  D.forEach((d,i)=>{const r=el('div','r');r.innerHTML='<span>'+d[0]+'</span><div class="t"><i></i></div><b></b>';if(i)r.style.opacity=.25;box.append(r);});
  const lab=v=>v==0?'不变':(v<0?'缩短 '+(-v)+'%':'增加 '+v+'%');
  function setBar(r,v){const i=r.querySelector('i');const w=Math.abs(v);i.className=v<0?'f':'s';i.style.left=(v<0?50-w:50)+'%';i.style.width=w+'%';r.querySelector('b').textContent=(v>0?'+':'')+v+'%';}
  function run(){const g=+$('#rct-g').value;$('#rct-gv').textContent=lab(g);setBar(box.children[0],g);
    if(shown){D.forEach((d,i)=>{if(i){setBar(box.children[i],d[1]);box.children[i].style.opacity=1;}});
      const diff=g-19;$('#rct-cap').textContent='用时一栏：绿色是变快，红色是变慢。实测用 AI 的任务平均多花了 19% 的时间。你的猜测和实测差 '+Math.abs(diff)+' 个百分点。'+(g>0?'你猜对了方向，比大多数专家都准。':'别难过：开发者本人、经济学家、机器学习专家都猜错了方向。');}
    else $('#rct-cap').textContent='拖动滑块给出你的猜测（左边是用时缩短，右边是用时增加），然后点「揭晓」。';}
  $('#rct-g').oninput=run;$('#rct-go').onclick=()=>{shown=true;run();};run();
})();
})();
