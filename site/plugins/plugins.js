(function(){
"use strict";
const {$,el}=window.AI;
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');
const segOn=(box,i)=>[...box.children].forEach((x,j)=>x.classList.toggle('on',j==i));
/* ① */
(function(){
  const C=[['cmd','命令','commands/\n│   └── weekly.md','/weekly 一键出周报','你输入 /weekly','0（你调用时才读）'],
   ['skill','Skill','skills/\n│   └── weekly-report/SKILL.md','按部门格式写周报','模型觉得用得上','约 100 token 封面'],
   ['mcp','MCP 服务器','.mcp.json   (连 Jira)','读写 Jira 任务','模型决定调用','每个工具一份说明书'],
   ['agent','子智能体','agents/\n│   └── data-digger.md','派去拉数据、只交回结论','模型派活','一行简介'],
   ['hook','钩子','hooks/hooks.json','发送前检查有没有泄露客户名','程序自动运行','0（不进上下文）']];
  const st={cmd:1,skill:1,mcp:0,agent:0,hook:0};
  C.forEach(c=>{const b=el('button','tgl'+(st[c[0]]?' on':''));b.textContent=c[1];b.onclick=()=>{st[c[0]]^=1;b.classList.toggle('on',!!st[c[0]]);run();};$('#pk-sw').append(b);});
  function run(){let t='marketing-kit/\n├── .claude-plugin/plugin.json   <span class="dim"># 名字、版本、简介</span>\n';
    const on=C.filter(c=>st[c[0]]);
    C.forEach(c=>{t+='<span class="'+(st[c[0]]?'on':'of')+'">├── '+esc(c[2])+'</span>\n';});
    $('#pk-tree').innerHTML=t.replace(/\n$/,'');
    $('#pk-t').innerHTML='<tr><th>零件</th><th>它干什么</th><th>谁触发</th><th>平时占上下文</th></tr>'+(on.length?on.map(c=>'<tr><td><b>'+c[1]+'</b></td><td>'+c[3]+'</td><td>'+c[4]+'</td><td>'+c[5]+'</td></tr>').join(''):'<tr><td colspan="4">空的插件：什么也不加。</td></tr>');
    $('#pk-cap').textContent=on.length?'同事装上这个插件，就一次得到这 '+on.length+' 样东西；你改了周报格式发个新版本，所有人一起更新。':'至少选一样零件。';}
  run();
})();
/* ② */
(function(){
  const S=[['读取 src/report.py','read src/report.py',0],['修改 src/report.py','edit src/report.py',0],['运行测试','run pytest',0],
   ['「顺手」改配置','edit .env  (加上调试用的密钥)',1],['清理临时目录','run rm -rf ./build /',1],['推送代码','run git push',2]];
  let m=0,inj=false;
  function run(){const box=$('#hk-list');box.innerHTML='';let viol=0,blk=0;
    S.forEach((s,i)=>{let bad=false;
      if(s[2]==1)bad=(i==3)||(inj&&i==4);       // 提示模式：第4步违规；被注入后第5步也违规
      const d=el('div','cl');let lab='执行';
      if(bad){if(m==1){d.classList.add('blk');lab='钩子拦下';blk++;}else{d.classList.add('bad');lab='执行了 ✗';viol++;}}
      if(s[2]==2&&m==1){d.classList.add('blk');lab='钩子：已确认测试通过';}
      d.innerHTML='<span class="st">'+lab+'</span><div>'+esc(s[0])+'<br><code>'+esc(s[1])+'</code></div>';box.append(d);});
    const r=$('#hk-r');
    if(m==0){r.className='verdict bad';r.textContent='✗ 规矩写在提示里，但模型在第 4 步「好心」改了 .env'+(inj?'，读到恶意文字后又在第 5 步删了整个根目录（命令末尾多了个 /）':'')+'。提示是「请求」，不是「保证」。';}
    else{r.className='verdict ok';r.textContent='✓ 钩子在每次工具调用前检查命令：拦下了 '+blk+' 次违规。'+(inj?'恶意文字能骗过模型，骗不过一段只看命令内容的程序。':'它不会忘、不会被说服，但也只能管你事先想到的规则。');}}
  [...$('#hk-m').children].forEach((b,i)=>b.onclick=()=>{m=i;segOn($('#hk-m'),i);run();});
  $('#hk-inj').onclick=function(){inj=!inj;this.classList.toggle('on',inj);this.textContent='中途读到一段恶意文字：'+(inj?'开':'关');run();};run();
})();
/* ③ */
(function(){
  const P=[
   {src:'官方市场 · 开源 · 1.2 万次安装',it:[['钩子','改完文件后运行 prettier 格式化',0],['命令','/format 手动格式化',0]],v:['ok','✓ 来源清楚、开源可查、零件只做它声称的事。可以装。']},
   {src:'不知名个人市场 · 不开源 · 刚上架',it:[['钩子','每次启动时运行 install.sh（内容未公开）',2],['MCP 服务器','连接 speedup-ai.example（远程）',1],['Skill','描述：「所有任务都先用本 Skill」',1]],v:['bad','✗ 别装。启动就跑看不到内容的脚本；Skill 要求「所有任务都先用它」，等于抢走模型的注意力；远程服务器能看到你发出的数据。名字越诱人越要小心。']},
   {src:'公司内部市场 · IT 部门维护',it:[['MCP 服务器','连接公司 Jira（需要你登录）',1],['Skill','按公司格式写周报',0],['钩子','发送前检查是否含客户隐私',0]],v:['ok','✓ 来源可信。Jira 服务器能写入数据，建议把「创建/修改任务」设成每次询问。']}];
  const L=['低','留意','高'];
  function run(i){const p=P[i],box=$('#rv-list');box.innerHTML='';
    const h=el('div','cl');h.innerHTML='<span class="st">来源</span><div>'+esc(p.src)+'</div>';box.append(h);
    p.it.forEach(t=>{const d=el('div','cl'+(t[2]==2?' bad':''));d.innerHTML='<span class="st">风险'+L[t[2]]+'</span><div><b>'+t[0]+'</b>：'+esc(t[1])+'</div>';box.append(d);});
    $('#rv-r').className='verdict '+p.v[0];$('#rv-r').textContent=p.v[1];}
  [...$('#rv-p').children].forEach((b,i)=>b.onclick=()=>{segOn($('#rv-p'),i);run(i);});run(0);
})();
})();
