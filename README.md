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
