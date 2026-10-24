import sys,re
# usage: build.py folder  (reads p2src/<folder>.html : first line JSON meta, then <style>..</style> then body)
import json
f=sys.argv[1]
src=open(f'/workspace/ai-preview/p2src/{f}.html').read()
meta,rest=src.split('\n',1)
m=json.loads(meta)
style,body=rest.split('</style>',1)
head=open('/workspace/ai-preview/p2src/head.tpl').read().replace('上下文工程 · AI',m['short']+' · AI')
out=head+style+'</style>\n</head>\n<body>\n'+'''<div class="progress" id="progress"></div>
<div class="sbar ui" id="sbar" aria-hidden="true"><button id="sb-toc" aria-label="打开目录">☰ 目录</button><span id="sb-cur"></span><button id="fs-m" aria-label="缩小字号">A−</button><button id="fs-p" aria-label="放大字号">A+</button></div>
<div class="sheet ui" id="sheet" hidden><div class="sheet-bg" id="sheet-bg"></div><div class="sheet-body" role="dialog" aria-label="目录"><div class="sheet-h"><b>目录</b><button id="sheet-x" aria-label="关闭">✕</button></div><ol id="sheet-list"></ol></div></div>
<div class="wrap">
<nav class="crumb"><a class="home" href="https://www.lucca.top/" aria-label="回 lucca 首页"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11l9-7 9 7M5 10v10h5v-6h4v6h5V10"/></svg><span>lucca</span></a><span>›</span><a href="../">AI 是怎么回事</a><span>›</span><span>第 %d 篇</span></nav>
<article id="art">
'''%m['n']+body.strip()+'''
</article>
<footer>© <span id="y"></span> lucca.top</footer>
</div>
<script src="../assets/common.js?v=3"></script>
<script src="%s?v=1"></script>
</body>
</html>
'''%m['js']
import os
os.makedirs(f'/workspace/ai-preview/site/{f}',exist_ok=True)
open(f'/workspace/ai-preview/site/{f}/index.html','w').write(out)
print('ok',f)
import subprocess
subprocess.run(['python3','/workspace/tools/seo.py','/workspace/ai-preview/site','https://ai.lucca.top/','AI 是怎么回事 · lucca'],check=True)
