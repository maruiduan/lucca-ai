(function(){
"use strict";
const {$,el}=window.AI;
const segOn=(box,i)=>[...box.children].forEach((x,j)=>x.classList.toggle('on',j==i));
/* ① */
(function(){
  const RAW='<span class="k">def</span> get_weather(city): ...\n\ntools = [{<span class="c"># 手写工具说明书</span>\n  "name": "get_weather",\n  "description": "查询城市天气",\n  "parameters": {"city": "string"}}]\n\nmessages = [user("北京明天要带伞吗？")]\n<span class="k">for</span> step <span class="k">in</span> range(10):          <span class="c"># 循环，最多 10 圈</span>\n  reply = model.call(messages, tools)\n  messages.append(reply)\n  <span class="k">if not</span> reply.tool_calls:          <span class="c"># 不再用工具 → 结束</span>\n    <span class="k">break</span>\n  <span class="k">for</span> call <span class="k">in</span> reply.tool_calls:     <span class="c"># 执行工具</span>\n    <span class="k">try</span>:\n      out = get_weather(**call.args)\n    <span class="k">except</span> Exception <span class="k">as</span> e:\n      out = "出错：" + str(e)\n    messages.append(tool_result(call.id, out))\n    log(step, call, out)           <span class="c"># 自己记日志</span>\nprint(reply.text)';
  const FW='<span class="k">@tool</span>\n<span class="k">def</span> get_weather(city: str):\n  """查询城市天气"""\n  ...\n<span class="hid"><span class="c">  ↑ 框架读函数名、参数类型和这行注释，自动生成工具说明书</span></span>\nagent = Agent(model="某模型", tools=[get_weather])\n<span class="hid"><span class="c">  ↑ 框架内部：拼系统提示（你看不到全文）、设好最大圈数</span></span>\nresult = agent.run("北京明天要带伞吗？")\n<span class="hid"><span class="c">  ↑ 框架内部：for 循环 → 调模型 → 解析工具调用 → 执行 →\n    捕获异常 → 放回结果 → 判断结束 → 记录追踪日志</span></span>\nprint(result.text)';
  let m=0,open=false;
  function run(){const b=$('#cd-box');b.innerHTML=m?FW:RAW;b.classList.toggle('open',open);$('#cd-open').style.display=m?'':'none';
    $('#cd-cap').textContent=m?(open?'黄色部分就是框架替你做的事，和左边自己写的那些行一一对应。省事，但出了问题时，你得知道去哪一层找。':'短了很多。打开「显示框架替你做的事」看看那些行去哪了。'):'自己写：大约 20 行，每一步都看得见。工具说明书、循环、出错处理、日志都是你自己的代码。';}
  [...$('#cd-m').children].forEach((b,i)=>b.onclick=()=>{m=i;segOn($('#cd-m'),i);run();});
  $('#cd-open').onclick=function(){open=!open;this.classList.toggle('on',open);run();};run();
})();
/* ② */
(function(){
  const N=(t,c)=>'<span class="n'+(c?' '+c:'')+'">'+t+'</span>',A='<span class="a">→</span>';
  const col=a=>'<span class="col">'+a.join('')+'</span>';
  const P=[
   [N('输入')+A+N('模型：写大纲','l')+A+N('检查大纲','g')+A+N('模型：按大纲写','l')+A+N('输出'),'<b>串联</b>（prompt chaining）：把任务拆成固定的几步，上一步的输出是下一步的输入，中间可以插代码检查。例：先写大纲，检查通过后再写正文；先写文案，再翻译。'],
   [N('客服消息')+A+N('模型：分类','l')+A+col([N('退款流程'),N('技术支持'),N('一般问答')]),'<b>分流</b>（routing）：先让模型判断类型，再交给专门的流程或更合适的模型。例：简单问题给小模型、难题给大模型；退款和技术问题走不同的提示。'],
   [N('一段代码')+A+col([N('模型：查安全','l'),N('模型：查性能','l'),N('模型：查风格','l')])+A+N('汇总'),'<b>并行</b>（parallelization）：同时跑几个独立的调用再汇总；或者同一个问题问几遍投票（第一部分<a href="../reasoning/">推理模型</a>那篇的「多想几遍」）。'],
   [N('任务')+A+N('模型：编排者','l')+A+col([N('工人 A','l'),N('工人 B','l'),N('…')])+A+N('编排者汇总','l'),'<b>编排者–工人</b>（orchestrator-workers）：由模型现场决定拆成几个子任务、各交给谁。和并行的区别是子任务事先不确定。例：改代码时要动哪些文件，看了才知道。'],
   [N('模型：写译文','l')+'<span class="a">⇄</span>'+N('模型：评审打分','l')+A+N('达标后输出'),'<b>评审–改进</b>（evaluator-optimizer）：一个写、一个评，循环到达标为止。适合有清楚评判标准、而且多改几轮确实会更好的任务，比如文学翻译。'],
   [N('任务')+A+N('模型','l')+'<span class="a">⇄</span>'+N('工具 / 环境')+A+N('模型判断完成'),'<b>智能体</b>：没有预设路线，模型在循环里自己决定下一步，直到它认为完成或达到上限。最灵活，也最贵、最难预测。第 2 篇讲的就是它。']];
  [...$('#pt-m').children].forEach((b,i)=>b.onclick=()=>{segOn($('#pt-m'),i);$('#pt-d').innerHTML=P[i][0];$('#pt-cap').innerHTML=P[i][1];});
  $('#pt-d').innerHTML=P[0][0];$('#pt-cap').innerHTML=P[0][1];
})();
/* ③ */
(function(){
  const S=['读需求','查资料','写草稿','发邮件给客户','生成报表','归档'];let cp=false,ran=false;
  function draw(){const box=$('#gp-n');box.innerHTML='';
    S.forEach((s,i)=>{const d=el('span','n');d.textContent=(i+1)+' '+s;
      if(ran){if(i<4){d.classList.add(cp?'done':'redo');if(cp)d.classList.add('cp');}else if(i==4)d.classList.add('x');}
      box.append(d);if(i<S.length-1){const a=el('span','a');a.textContent='→';box.append(a);}});
    if(!ran){$('#gp-re').textContent='—';$('#gp-cost').textContent='—';$('#gp-cap').textContent='点「运行」。第 5 步「生成报表」时，报表服务超时，程序崩了。';return;}
    $('#gp-re').textContent=cp?'1 步':'5 步';$('#gp-cost').textContent=cp?'1 次':'5 次';
    $('#gp-cap').textContent=cp?'✓ 修好报表服务后，从第 4 步之后的检查点接着跑，只重做第 5 步。邮件不会重发。':'✗ 没有检查点，只能从头再跑：前 4 步重做一遍（黄色），更糟的是第 4 步会把邮件再给客户发一次。';}
  $('#gp-cp').onclick=function(){cp=!cp;this.classList.toggle('on',cp);this.textContent='每步存检查点：'+(cp?'开':'关');draw();};
  $('#gp-run').onclick=()=>{ran=true;draw();};draw();
})();
/* ④ */
(function(){
  const Q=[['任务需要好几步，而且步数事先说不准？',['否','是']],['需要跑很久、中途等人审批，或者崩了要能续跑？',['否','是']],['要接很多现成的数据源和服务？',['否','是']],['团队里有人愿意读懂框架的底层代码？',['否','是']]];
  const a=[0,0,0,0];const box=$('#dc-q');
  Q.forEach((q,i)=>{const d=el('div','q');d.innerHTML='<div>'+(i+1)+'. '+q[0]+'</div>';const s=el('div','seg');s.style.marginTop='4px';
    q[1].forEach((t,j)=>{const b=el('button'+'');b.textContent=t;if(j==a[i])b.classList.add('on');b.onclick=()=>{a[i]=j;segOn(s,j);run();};s.append(b);});d.append(s);box.append(d);});
  function run(){const r=$('#dc-r');let t;
    if(!a[0]&&!a[1])t='直接调模型接口就行：一次调用或者几步写死的工作流（串联、分流），几十行代码，完全看得见。';
    else if(a[1]&&a[3])t='可以考虑图式框架（如 LangGraph）：流程画成图、自带检查点和人工审批节点，正好对上你的需求。前提是团队真的读懂它。';
    else if(a[1])t='你需要检查点和续跑，但团队不打算深入框架：要么花时间学懂一个图式框架，要么自己用数据库存每一步的状态。别在不懂的情况下把关键流程交给黑盒。';
    else if(a[2])t='轻量 SDK 加现成连接器（或 MCP）比较合适：用它省掉胶水代码，核心循环保持简单。';
    else t='一个轻量的智能体 SDK（如 OpenAI Agents SDK 一类）或自己写的循环都可以。先自己写一遍，理解了再决定要不要换。';
    r.className='verdict ok';r.textContent=t;}
  run();
})();
})();
