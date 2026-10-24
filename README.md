# lucca-ai — ai.lucca.top

「AI 是怎么回事」系列预览站。Live: https://ai.lucca.top/

## Layout
- `site/` — editable source (unstamped)
- `src/` / `build.py` / `p2src/` — article builders that write into `site/`
- `scripts/stamp_static.py` — builds hashed `dist/`
- `scripts/upload_oss.py` — uploads to OSS bucket `lucca-ai` (Hong Kong)
- CI on `master` stamps and deploys

## Local
```bash
python3 scripts/stamp_static.py site dist
OSS_ACCESS_KEY_ID=… OSS_ACCESS_KEY_SECRET=… python3 scripts/upload_oss.py dist lucca-ai
```

## Secrets
Repo secrets `OSS_ACCESS_KEY_ID` / `OSS_ACCESS_KEY_SECRET` must **write** `lucca-ai`. Until RAM grants write, deploy fails with AccessDenied — expected.

## Security headers
HTML, `robots.txt` and `sitemap.xml` on the bucket already carry OSS persistent response headers. A normal PutObject drops them. `scripts/upload_oss.py` sends the same set on every one of those puts (`x-oss-persistent-headers`). CSS/JS stay without them. CSP is HTML-only. `python3 scripts/upload_oss.py --check` round-trips the values without credentials.

## 百度统计
Every public HTML page loads Baidu Tongji for `ai.lucca.top`. The `hm.js` hash is `2ecc4596fa3468da1fb9070fe3d84634` (not 古文, www, or en). Canonical snippet: `scripts/baidu_tongji.html`. `build.py` and `p2src/build.py` insert it into `<head>`; pages under `site/` already contain the same block. Copy that block into `<head>` when adding a hand-written page. HTML CSP allows `https://hm.baidu.com` on `script-src` and `connect-src`.

## 不蒜子
Not added. The counter needs a long-running backend; this bucket cannot host it. Do not load `busuanzi.ibruce.info`.
