"""Public NFT animation links, restricted to the reviewed MRKT Bank snapshot."""
import gzip
import json
import re
import threading
from urllib.parse import urlsplit, unquote

import requests
from flask import jsonify, send_file


def animation_url(value):
    try:
        url = urlsplit(value or '')
        if url.scheme != 'https' or url.username or url.password or url.port not in (None, 443):
            return False
        if re.fullmatch(r'cdn\d+\.telesco\.pe', url.hostname or ''):
            return url.path == '/file/sticker.tgs'
        parts = unquote(url.path).split('/')
        return (url.hostname == 'cdn.changes.tg' and not url.query and not url.fragment
                and len(parts) == 5 and parts[:3] == ['', 'gifts', 'models']
                and parts[3] not in ('', '.', '..') and parts[4].endswith('.tgs')
                and parts[4][:-4] not in ('', '.', '..'))
    except ValueError:
        return False


def download_animation(url):
    if not animation_url(url):
        raise ValueError('Unapproved animation source')
    with requests.get(url, timeout=(5, 20), stream=True, allow_redirects=False) as response:
        if response.status_code != 200:
            raise ValueError('Animation source unavailable')
        chunks, size = [], 0
        for chunk in response.iter_content(65536):
            size += len(chunk)
            if size > 2 * 1024 * 1024:
                raise ValueError('Animation too large')
            chunks.append(chunk)
    compressed = b''.join(chunks)
    # TGS is gzip-compressed Lottie JSON. Bound both compressed and decoded data.
    import io
    with gzip.GzipFile(fileobj=io.BytesIO(compressed)) as stream:
        raw = stream.read(8 * 1024 * 1024 + 1)
    if len(raw) > 8 * 1024 * 1024:
        raise ValueError('Decoded animation too large')
    data = json.loads(raw)
    if not isinstance(data, dict) or not isinstance(data.get('layers'), list):
        raise ValueError('Invalid Lottie data')
    # Telegram TGS uses vector shapes. Never load external Lottie assets/scripts.
    if any(asset.get('p') or asset.get('u') for asset in data.get('assets', []) if isinstance(asset, dict)):
        raise ValueError('External animation assets are unsupported')
    return raw


def register_bank_nfts(app, settings, public):
    cache = settings.data_dir / 'bank-nft-animation'
    lock = threading.Lock()

    @app.get('/api/bank-nfts/<slug>/animation')
    def bank_nft_animation(slug):
        if not re.fullmatch(r'[A-Za-z0-9]+-\d+', slug):
            return jsonify(error='unknown_nft'), 404
        try:
            snapshot = json.loads((public / 'mrktbank-nfts.json').read_text(encoding='utf-8'))
            item = next((row for row in snapshot['items']
                         if row.get('url') == 'https://t.me/nft/' + slug), None)
        except (OSError, ValueError, KeyError, TypeError):
            item = None
        if not item:
            return jsonify(error='unknown_nft'), 404
        target = cache / (slug + '.json')
        try:
            with lock:
                if not target.is_file():
                    url = item.get('animation_url')
                    try:
                        raw = download_animation(url)
                    except (requests.RequestException, ValueError, OSError, EOFError):
                        # CDN links are refreshable from the permanent public NFT page.
                        from tools.resolve_nft_links import resolve
                        refreshed = resolve(item)
                        raw = download_animation(refreshed.get('animation_url'))
                    cache.mkdir(parents=True, exist_ok=True)
                    temporary = target.with_suffix('.tmp')
                    temporary.write_bytes(raw)
                    temporary.replace(target)
            return send_file(target, mimetype='application/json', conditional=True)
        except (requests.RequestException, ValueError, OSError, EOFError, TypeError):
            return jsonify(error='animation_temporarily_unavailable'), 502
