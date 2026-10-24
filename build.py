#!/usr/bin/env python3
"""把 src/<slug>.html 片段套进统一模板，写到 site/<slug>/index.html。不碰第 1 篇（llm）。"""
import re, os, sys, html
from pathlib import Path
ROOT=str(Path(__file__).resolve().parent)
V='3'
SERIES=[('llm','什么是 LLM'),('pretrain','预训练'),('posttrain','后训练'),('context','上下文与提示词'),
        ('hallucination','幻觉与局限'),('rag','RAG：先查资料再回答'),('reasoning','推理模型'),('small','蒸馏与量化')]
TPL='''<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#f6f3ec" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#16150f" media="(prefers-color-scheme: dark)">
<meta name="robots" content="noindex,nofollow">
<title>{title_txt} · AI 是怎么回事 · lucca</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%23a33a2b'/%3E%3Ctext x='32' y='44' font-size='34' text-anchor='middle' fill='%23f6f3ec' font-family='serif'%3EL%3C/text%3E%3C/svg%3E">
<link rel="stylesheet" href="../assets/ai.css?v={V}">
</head>
<body>
<div class="progress" id="progress"></div>
<div class="sbar ui" id="sbar" aria-hidden="true"><button id="sb-toc" aria-label="打开目录">☰ 目录</button><span id="sb-cur"></span><button id="fs-m" aria-label="缩小字号">A−</button><button id="fs-p" aria-label="放大字号">A+</button></div>
<div class="sheet ui" id="sheet" hidden><div class="sheet-bg" id="sheet-bg"></div><div class="sheet-body" role="dialog" aria-label="目录"><div class="sheet-h"><b>目录</b><button id="sheet-x" aria-label="关闭">✕</button></div><ol id="sheet-list"></ol></div></div>
<div class="preview-bar">预览版 · 尚未上线，内容仍在调整</div>
<div class="wrap">
<nav class="crumb"><a href="https://www.lucca.top/">lucca</a><span>›</span><a href="../">AI 是怎么回事</a><span>›</span><span>第 {n} 篇</span></nav>
<article id="art">
<h1>{title}</h1>
<p class="meta-line">{meta}</p>
<div class="lead"><small>一句话结论</small>{lead}</div>
<details class="toc" id="toc" open><summary><b>目录</b><span class="toc-n">{tocn} 节 · 点开/收起</span></summary>
<ol>
{toc}
</ol></details>
{body}
</article>
<footer>© <span id="y"></span> lucca.top</footer>
</div>
<script src="../assets/common.js?v={V}"></script>
<script src="{slug}.js?v={V}"></script>
</body>
</html>
'''
def pn(i):
    prev=SERIES[i-1] if i>0 else None; nxt=SERIES[i+1] if i+1<len(SERIES) else None
    a=f'<a href="../{prev[0]}/"><small>← 上一篇</small>{prev[1]}</a>' if prev else '<a href="../"><small>← 返回</small>目录</a>'
    b=f'<a class="nx" href="../{nxt[0]}/"><small>下一篇 →</small>{nxt[1]}</a>' if nxt else '<a class="nx" href="../"><small>第一部分完 →</small>回目录，看第二部分</a>'
    return f'<div class="pn">\n {a}\n {b}\n</div>'
def build(slug):
    i=[s for s,_ in SERIES].index(slug)
    src=open(f'{ROOT}/src/{slug}.html',encoding='utf-8').read()
    meta={k:v.strip() for k,v in re.findall(r'<!--(\w+):(.*?)-->',src,flags=re.S)}
    body=re.sub(r'<!--\w+:.*?-->\n?','',src,flags=re.S).strip()
    heads=re.findall(r'<h2 id="([^"]+)"><span class="k">[^<]*</span>(.*?)</h2>',body)
    heads=[(h,t) for h,t in heads if h!='refs']
    toc='\n'.join(f'<li><a href="#{h}">{re.sub("<[^>]+>","",t)}</a></li>' for h,t in heads)
    body=body.replace('<!--PN-->',pn(i))
    assert '<div class="pn">' in body, slug+' missing PN marker'
    out=TPL.format(title=meta['title'],title_txt=re.sub('<[^>]+>','',meta['short']),meta=meta['meta'],lead=meta['lead'],toc=toc,tocn=len(heads),body=body,slug=slug,n=i+1,V=V)
    d=f'{ROOT}/site/{slug}';os.makedirs(d,exist_ok=True)
    tmp=f'{d}/index.html.tmp';open(tmp,'w',encoding='utf-8').write(out);os.replace(tmp,f'{d}/index.html')
    print('built',slug,len(out.encode()),'bytes',len(heads),'sections')
for s in (sys.argv[1:] or [x for x,_ in SERIES[1:]]): build(s)
