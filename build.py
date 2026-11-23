"""Builds index.html (Netlify / GitHub Pages) from aeroknowledge-hub.html (the claude.ai Artifact version)."""
from pathlib import Path

root = Path(__file__).parent
src = (root / 'aeroknowledge-hub.html').read_text(encoding='utf-8')
src = src.replace('<meta charset="utf-8">\n', '', 1)

head = '''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style>
<meta name="theme-color" content="#0b2a55">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" href="icon-192.png">
<link rel="apple-touch-icon" href="icon-192.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<script>if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));</script>
</head>
<body>
'''

(root / 'index.html').write_text(head + src + '\n</body>\n</html>\n', encoding='utf-8')
print('index.html built')
