"""Local pack/unpack command for the versioned frontend bundle."""
import hashlib
import json
import sys
import tempfile
import zipfile
from pathlib import Path
from prepare_site import ensure_site

ROOT=Path(__file__).resolve().parent

def pack(root=ROOT, part_size=512*1024):
    root=Path(root);public=root/'public';bundle=root/'site_bundle';bundle.mkdir(exist_ok=True)
    if not (public/'index.html').is_file():
        raise RuntimeError('Unpack the site before editing/packing')
    with tempfile.TemporaryDirectory() as tmp:
        archive=Path(tmp)/'site.zip'
        with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
            for f in sorted(public.rglob('*')):
                if f.is_file() and not any(p.startswith('.') for p in f.relative_to(public).parts):
                    z.write(f,f.relative_to(public))
        for p in bundle.glob('site-*.part'):p.unlink()
        digest=hashlib.sha256();parts=[];size=0
        with archive.open('rb') as source:
            while True:
                block=source.read(part_size)
                if not block:break
                name=f'site-{len(parts):03}.part';(bundle/name).write_bytes(block)
                parts.append({'name':name,'sha256':hashlib.sha256(block).hexdigest(),'size':len(block)})
                digest.update(block);size+=len(block)
        manifest={'format':1,'sha256':digest.hexdigest(),'size':size,'parts':parts}
        (bundle/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
        (public/'.bundle-version').write_text(manifest['sha256'])
        return manifest

if __name__=='__main__':
    action=sys.argv[1] if len(sys.argv)>1 else 'unpack'
    if action=='pack':
        result=pack();print(f"Packed {len(result['parts'])} parts, {result['size']} bytes")
    elif action=='unpack':
        print(ensure_site(ROOT))
    else:
        raise SystemExit('Use: python prepare_frontend.py pack|unpack')
