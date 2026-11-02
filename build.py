"""Build index.html from src/ (single self-contained file for GitHub Pages or local use)."""
import json, pathlib
R = pathlib.Path(__file__).parent
src = lambda f: (R / 'src' / f).read_text(encoding='utf-8')
cfg = json.loads((R / 'config.json').read_text()) if (R / 'config.json').exists() else {}
svg = src('hitachi-wordmark.svg').strip()
guides = {}
for f in sorted((R / 'src' / 'guides').glob('part_*.json')):
    guides.update(json.loads(f.read_text(encoding='utf-8')))
body = src('body.html').replace('{{WORDMARK}}', svg)
pack = json.loads((R / 'materials' / 'pack.json').read_text(encoding='utf-8'))
details = json.loads((R / 'src' / 'usecases' / 'details.json').read_text(encoding='utf-8'))
html = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22%3E%3Crect width=%2216%22 height=%2216%22 rx=%223%22 fill=%22%23CC0000%22/%3E%3C/svg%3E">
<title>AI in the Research Process</title>
<style>
{src('style.css')}
</style>
</head>
<body>
{body}
<script>window.AIRP_CONFIG = {json.dumps(cfg)};</script>
<script>
{src('data.js')}
const GUIDES = {json.dumps(guides, ensure_ascii=False)};
const PACK = {json.dumps(pack, ensure_ascii=False)};
const DETAILS = {json.dumps(details, ensure_ascii=False)};
{src('app.js')}
</script>
</body>
</html>
"""
(R / 'index.html').write_text(html, encoding='utf-8')
print('built index.html', len(html), 'bytes; remote =', bool(cfg.get('supabaseUrl')))
