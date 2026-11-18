"""Build a complete single-file game (including the five original WAV tracks).
No network or third-party libraries are needed. Run: python3 scripts/build_offline.py

An optional local server gives best browser compatibility, but this release artifact
also works when opened directly in a modern desktop browser with file://.
"""
from pathlib import Path
import base64
import re

ROOT=Path(__file__).resolve().parent.parent
MODULES=['src/content.js','src/simulation.js','src/render.js','src/audio.js','src/main.js']
AUDIO=['01_the_maze','02_the_ward','03_the_foundry','04_the_transmission','05_the_heart']


def transform(module):
    source=(ROOT/module).read_text(encoding='utf-8')
    source=re.sub(r'^import\s+.*?\s+from\s+[\'\"].*?[\'\"];?\s*$', '',source,flags=re.M)
    source=re.sub(r'\bexport\s+(?=(const|let|function|class)\b)', '',source)
    if module=='src/audio.js':
        source=source.replace(
            "const url=new URL(`../assets/audio/${TRACKS[index]}.wav`,import.meta.url);\n      const res=await fetch(url);if(!res.ok)throw Error('Original loop unavailable');\n      buffer=await this.ctx.decodeAudioData(await res.arrayBuffer());",
            "const raw=atob(EMBEDDED_WAVS[index]);\n      const bytes=new Uint8Array(raw.length);\n      for(let i=0;i<raw.length;i++) bytes[i]=raw.charCodeAt(i);\n      buffer=await this.ctx.decodeAudioData(bytes.buffer);"
        )
    if module=='src/main.js':
        source=source.replace("import('./simulation.js').then(m=>m.fire(run));", "fire(run);")
    if re.search(r'^import\s|\bexport\s|import\.meta',source,flags=re.M):
        raise ValueError(f'Untransformed module syntax in {module}')
    return source


def main():
    html=(ROOT/'index.html').read_text(encoding='utf-8')
    css=(ROOT/'styles.css').read_text(encoding='utf-8')
    html=html.replace('<link rel="stylesheet" href="styles.css">',f'<style>\n{css}\n</style>')
    music=[base64.b64encode((ROOT/'assets/audio'/f'{t}.wav').read_bytes()).decode('ascii') for t in AUDIO]
    header='const EMBEDDED_WAVS = [' + ','.join('"'+encoded+'"' for encoded in music) + '];\n'
    body='\n\n'.join(transform(path) for path in MODULES)
    combined='<script>\n'+header+body+'\n</script>'
    html=html.replace('<script type="module" src="src/main.js"></script>',combined)
    if '<script type="module"' in html:
        raise ValueError('Module link remains in offline build')
    out=ROOT/'play-offline.html'
    out.write_text(html,encoding='utf-8')
    print(f'Built {out} ({out.stat().st_size:,} bytes; five original WAV tracks embedded).')


if __name__=='__main__':
    main()
