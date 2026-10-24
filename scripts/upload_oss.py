#!/usr/bin/env python3
"""Upload stamped dist/ to Aliyun OSS. Credentials: OSS_ACCESS_KEY_ID/SECRET env.
HTML/robots/sitemap → no-cache; name.<8hex>.ext and mp3 → immutable year.
Never deletes old objects.

Security response headers are already stored on HTML, robots.txt and sitemap.xml
as OSS persistent headers. PutObject replaces metadata and drops them, so each
of those puts sends the same set again via x-oss-persistent-headers.
Values match the live ai.lucca.top objects. CSP is on HTML only.
CSS, JS and other assets are not given these headers.
"""
from __future__ import annotations
import base64, mimetypes, os, re, sys
from pathlib import Path

HASHED = re.compile(r"\.[0-9a-f]{8}\.[A-Za-z0-9]+$")
NOCACHE = {"index.html", "robots.txt", "sitemap.xml", "stamp-manifest.json", "favicon.ico", "favicon.svg"}
ENTRY_NAMES = {"robots.txt", "sitemap.xml"}

# Baseline copied from live GET responses on 2026-10-24.
# script-src and connect-src also allow https://hm.baidu.com so Baidu Tongji can
# load hm.js and report. Do not add commas: persistent-header framing splits on them.
CSP = (
    "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; "
    "img-src 'self' data: https:; font-src 'self' data:; style-src 'self' 'unsafe-inline'; "
    "script-src 'self' 'unsafe-inline' https://hm.baidu.com; "
    "connect-src 'self' https://hm.baidu.com; form-action 'self'"
)
COMMON_SECURITY = (
    ("Permissions-Policy", "geolocation=(), microphone=(), camera=()"),
    ("Referrer-Policy", "strict-origin-when-cross-origin"),
    ("Strict-Transport-Security", "max-age=31536000; includeSubDomains"),
    ("X-Content-Type-Options", "nosniff"),
    ("X-Frame-Options", "SAMEORIGIN"),
)

def ctype(path: Path) -> str:
    types = {".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
             ".js": "application/javascript; charset=utf-8", ".json": "application/json; charset=utf-8",
             ".svg": "image/svg+xml", ".xml": "application/xml", ".txt": "text/plain; charset=utf-8",
             ".mp3": "audio/mpeg", ".ico": "image/x-icon"}
    return types.get(path.suffix.lower()) or (mimetypes.guess_type(path.name)[0] or "application/octet-stream")

def cache_for(rel: str) -> str:
    name = Path(rel).name
    if HASHED.search(name) or Path(name).suffix.lower() in {".mp3", ".woff2", ".woff"}:
        return "public, max-age=31536000, immutable"
    if name in NOCACHE or rel.endswith(".html"):
        return "no-cache, must-revalidate"
    return "no-cache, must-revalidate"

def security_pairs(rel: str) -> tuple[tuple[str, str], ...]:
    """Headers to persist. Empty for assets. HTML adds CSP; robots/sitemap do not."""
    if rel.endswith(".html"):
        return (("Content-Security-Policy", CSP),) + COMMON_SECURITY
    if Path(rel).name in ENTRY_NAMES:
        return COMMON_SECURITY
    return ()

def persistent_header_value(pairs: tuple[tuple[str, str], ...]) -> str:
    """OSS frame: key:base64(value),key:base64(value). Commas inside values stay in the base64."""
    parts = []
    for key, value in pairs:
        if any(c in key for c in ",:"):
            raise ValueError(f"persistent header name {key!r}")
        encoded = base64.b64encode(value.encode("utf-8")).decode("ascii")
        parts.append(f"{key}:{encoded}")
    return ",".join(parts)

def decode_persistent(header: str) -> dict[str, str]:
    out = {}
    if not header:
        return out
    for part in header.split(","):
        key, encoded = part.split(":", 1)
        out[key] = base64.b64decode(encoded).decode("utf-8")
    return out

def object_headers(rel: str, path: Path) -> dict[str, str]:
    headers = {"Content-Type": ctype(path), "Cache-Control": cache_for(rel)}
    pairs = security_pairs(rel)
    if pairs:
        headers["x-oss-persistent-headers"] = persistent_header_value(pairs)
    return headers

def check() -> None:
    common_keys = tuple(k for k, _ in COMMON_SECURITY)
    html_keys = ("Content-Security-Policy",) + common_keys
    samples = {
        "index.html": html_keys,
        "llm/index.html": html_keys,
        "robots.txt": common_keys,
        "sitemap.xml": common_keys,
        "assets/ai.css": (),
        "assets/app.0123abcd.js": (),
    }
    for rel, keys in samples.items():
        pairs = security_pairs(rel)
        got = decode_persistent(persistent_header_value(pairs)) if pairs else {}
        if tuple(got) != keys:
            raise SystemExit(f"{rel}: keys {tuple(got)} != {keys}")
        for key, value in pairs:
            if got[key] != value:
                raise SystemExit(f"{rel}: {key} mismatch")
    perm = decode_persistent(persistent_header_value(security_pairs("robots.txt")))
    if perm["Permissions-Policy"] != "geolocation=(), microphone=(), camera=()":
        raise SystemExit("Permissions-Policy did not round-trip")
    if "x-oss-persistent-headers" in object_headers("assets/ai.fcac2b9e.css", Path("ai.css")):
        raise SystemExit("hashed css must not get security headers")
    html = object_headers("index.html", Path("index.html"))
    decoded = decode_persistent(html["x-oss-persistent-headers"])
    if decoded["X-Content-Type-Options"] != "nosniff":
        raise SystemExit("nosniff missing")
    if decoded["Referrer-Policy"] != "strict-origin-when-cross-origin":
        raise SystemExit("referrer policy mismatch")
    if "," in decoded["Content-Security-Policy"]:
        raise SystemExit("CSP contains a comma; persistent-header framing would split it")
    csp = decoded["Content-Security-Policy"]
    for directive in ("script-src", "connect-src"):
        part = csp.split(directive, 1)[1].split(";", 1)[0]
        if "https://hm.baidu.com" not in part:
            raise SystemExit(f"{directive} must allow https://hm.baidu.com")
    robots = object_headers("robots.txt", Path("robots.txt"))
    if "Content-Security-Policy" in decode_persistent(robots["x-oss-persistent-headers"]):
        raise SystemExit("robots.txt must not carry CSP")
    print("security headers ok", len(html["x-oss-persistent-headers"]), "bytes on html")

def main():
    if len(sys.argv) == 2 and sys.argv[1] == "--check":
        check()
        return
    if len(sys.argv) != 3:
        raise SystemExit("usage: upload_oss.py DIST bucket-name | upload_oss.py --check")
    dist, bucket_name = Path(sys.argv[1]), sys.argv[2]
    ak = os.environ.get("OSS_ACCESS_KEY_ID") or ""
    sk = os.environ.get("OSS_ACCESS_KEY_SECRET") or ""
    if not ak or not sk:
        raise SystemExit("OSS_ACCESS_KEY_ID / OSS_ACCESS_KEY_SECRET required")
    import oss2
    endpoint = os.environ.get("OSS_ENDPOINT", "https://oss-cn-hongkong.aliyuncs.com")
    b = oss2.Bucket(oss2.Auth(ak, sk), endpoint, bucket_name)
    files = sorted(p for p in dist.rglob("*") if p.is_file() and p.name != "stamp-manifest.json")
    assets, entries = [], []
    for p in files:
        rel = p.relative_to(dist).as_posix()
        (entries if rel.endswith(".html") or Path(rel).name in {"robots.txt", "sitemap.xml"} else assets).append((rel, p))
    for rel, p in assets + entries:
        headers = object_headers(rel, p)
        b.put_object_from_file(rel, str(p), headers=headers)
        kind = "security" if "x-oss-persistent-headers" in headers else "plain"
        print("put", rel, headers["Cache-Control"], kind)
    print(f"Published {len(files)} objects to {bucket_name}")

if __name__ == "__main__":
    main()
