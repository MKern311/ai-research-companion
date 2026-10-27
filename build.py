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
html = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
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
{src('app.js')}
</script>
</body>
</html>
"""
(R / 'index.html').write_text(html, encoding='utf-8')
print('built index.html', len(html), 'bytes; remote =', bool(cfg.get('supabaseUrl')))
