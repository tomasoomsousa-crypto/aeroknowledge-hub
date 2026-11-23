"""Gera index.html (GitHub Pages) a partir de aeroknowledge-hub.html (versão Artifact do claude.ai)."""
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
</head>
<body>
'''

(root / 'index.html').write_text(head + src + '\n</body>\n</html>\n', encoding='utf-8')
print('index.html gerado')
