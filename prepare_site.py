"""Reassemble the checked frontend bundle into public/ on first startup."""
import hashlib
import json
import os
import shutil
import stat
import tempfile
import zipfile
from pathlib import Path

def apply_frontend_patch(root,public):
    """Keep reviewed text/assets separately editable from the large base bundle."""
    patch=Path(root)/'frontend_patch'
    if patch.is_dir():
        for source in sorted(patch.rglob('*')):
            relative=source.relative_to(patch)
            if source.is_symlink() or any(part.startswith('.') for part in relative.parts):
                raise RuntimeError('Invalid frontend patch member')
            if source.is_file():
                target=Path(public)/relative
                if any(parent.is_symlink() for parent in [target,*target.parents] if parent!=Path(root).parent):
                    raise RuntimeError('Invalid frontend patch destination')
                target.parent.mkdir(parents=True,exist_ok=True)
                if not target.is_file() or target.read_bytes()!=source.read_bytes():
                    temporary=target.with_name(target.name+'.updating')
                    temporary.write_bytes(source.read_bytes());os.replace(temporary,target)
    return public

def ensure_site(root):
    root=Path(root);public=root/'public';bundle=root/'site_bundle';manifest=bundle/'manifest.json'
    if not manifest.is_file():
        if (public/'index.html').is_file():
            return apply_frontend_patch(root,public)
        raise RuntimeError('Frontend bundle is missing')
    meta=json.loads(manifest.read_text())
    version=meta['sha256'];marker=public/'.bundle-version'
    if marker.is_file() and marker.read_text()==version and (public/'index.html').is_file():
        return apply_frontend_patch(root,public)
    with tempfile.TemporaryDirectory(prefix='.site-build-',dir=root) as tmp:
        temp=Path(tmp);archive=temp/'site.zip';digest=hashlib.sha256();size=0
        with archive.open('wb') as target:
            for part in meta['parts']:
                name=part['name']
                if Path(name).name!=name:
                    raise RuntimeError('Invalid bundle part')
                data=(bundle/name).read_bytes();size+=len(data)
                if hashlib.sha256(data).hexdigest()!=part['sha256']:
                    raise RuntimeError('Frontend part checksum mismatch')
                digest.update(data);target.write(data)
        if size!=meta['size'] or digest.hexdigest()!=version:
            raise RuntimeError('Frontend checksum mismatch')
        staged=temp/'public';staged.mkdir()
        with zipfile.ZipFile(archive) as z:
            if sum(i.file_size for i in z.infolist())>150*1024*1024:
                raise RuntimeError('Frontend exceeds unpack limit')
            for info in z.infolist():
                path=Path(info.filename)
                mode=info.external_attr>>16
                if path.is_absolute() or '..' in path.parts or '\\' in info.filename or stat.S_ISLNK(mode) or info.file_size>25*1024*1024:
                    raise RuntimeError('Invalid frontend archive member')
                z.extract(info,staged)
        if not (staged/'index.html').is_file():
            raise RuntimeError('Frontend index is missing')
        (staged/'.bundle-version').write_text(version)
        previous=root/'.public-previous'
        if previous.exists():shutil.rmtree(previous)
        if public.exists():os.replace(public,previous)
        os.replace(staged,public)
        if previous.exists():shutil.rmtree(previous)
    return apply_frontend_patch(root,public)
