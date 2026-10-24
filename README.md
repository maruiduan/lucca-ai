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

## TODO: 百度统计
Do not embed Baidu Tongji on this site yet. Confirmed numeric site IDs are only 古文 `23606161` and www `23606167`. There is no ID for `ai.lucca.top`. Do not invent one and do not reuse another site's `hm.js` token. When an ID exists, also allow `hm.baidu.com` in the HTML CSP (`script-src` and `connect-src` are `'self'` today).

## 不蒜子
Not added. The counter needs a long-running backend; this bucket cannot host it. Do not load `busuanzi.ibruce.info`.
