#!/usr/bin/env python3
"""Build one Part-2 article from p2src/<slug>.html into site/<slug>/index.html."""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
f = sys.argv[1]
src = (ROOT / "p2src" / f"{f}.html").read_text()
meta, rest = src.split("\n", 1)
m = json.loads(meta)
style, body = rest.split("</style>", 1)
head = (ROOT / "p2src" / "head.tpl").read_text().replace("上下文工程 · AI", m["short"] + " · AI")
crumb_n = m["n"]
js = m["js"]
body_html = body.strip()
out = (
    head
    + style
    + "</style>\n</head>\n<body>\n"
    + '<div class="progress" id="progress"></div>\n'
    + '<div class="sbar ui" id="sbar" aria-hidden="true">'
    + '<button id="sb-toc" aria-label="打开目录">☰ 目录</button>'
    + '<span id="sb-cur"></span>'
    + '<button id="fs-m" aria-label="缩小字号">A−</button>'
    + '<button id="fs-p" aria-label="放大字号">A+</button></div>\n'
    + '<div class="sheet ui" id="sheet" hidden>'
    + '<div class="sheet-bg" id="sheet-bg"></div>'
    + '<div class="sheet-body" role="dialog" aria-label="目录">'
    + '<div class="sheet-h"><b>目录</b><button id="sheet-x" aria-label="关闭">✕</button></div>'
    + '<ol id="sheet-list"></ol></div></div>\n'
    + '<div class="wrap">\n'
    + '<nav class="crumb">'
    + '<a class="home" href="https://www.lucca.top/" aria-label="回 lucca 首页">'
    + '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11l9-7 9 7M5 10v10h5v-6h4v6h5V10"/></svg>'
    + "<span>lucca</span></a><span>›</span>"
    + '<a href="../">AI 是怎么回事</a><span>›</span>'
    + f"<span>第 {crumb_n} 篇</span></nav>\n"
    + '<article id="art">\n'
    + body_html
    + "\n</article>\n"
    + '<footer>© <span id="y"></span> lucca.top</footer>\n'
    + "</div>\n"
    + '<script src="../assets/common.js?v=3"></script>\n'
    + f'<script src="{js}?v=1"></script>\n'
    + "</body>\n</html>\n"
)
out_dir = ROOT / "site" / f
out_dir.mkdir(parents=True, exist_ok=True)
(out_dir / "index.html").write_text(out)
print("ok", f)
