"""Resolve public Telegram NFT pages to their original animated TGS sources.

Input is an exported JSON list (or an object with `items`) containing `url` fields.
This utility has no login, Telegram session, account token or trading capability.
"""
import argparse
import concurrent.futures
from datetime import datetime, timezone
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import time
from urllib.parse import urlsplit
import requests


class GiftPage(HTMLParser):
    def __init__(self):
        super().__init__()
        self.meta = {}
        self.animation = None
        self.table = False
        self.cell = None
        self.label = ''
        self.text = []
        self.attributes = {}

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'meta' and attrs.get('property', '').startswith('og:'):
            self.meta[attrs['property']] = attrs.get('content', '')
        if tag == 'source' and attrs.get('type') == 'application/x-tgsticker':
            self.animation = attrs.get('srcset', '').split(' ')[0]
        if tag == 'table' and 'tgme_gift_table' in attrs.get('class', '').split():
            self.table = True
        if self.table and tag in ('th', 'td'):
            self.cell, self.text = tag, []

    def handle_data(self, data):
        if self.cell:
            self.text.append(data)

    def handle_endtag(self, tag):
        if self.table and tag == self.cell:
            value = ''.join(self.text).strip()
            if tag == 'th':
                self.label = value
            else:
                self.attributes[self.label] = value
            self.cell = None
        if tag == 'table':
            self.table = False


def resolve(item):
    fields = ('name', 'number', 'url', 'observed_at', 'model', 'background', 'symbol',
              'model_rarity', 'model_rarity_label', 'background_rarity', 'symbol_rarity')
    result = {key: item[key] for key in fields if key in item}
    url = item.get('url', '')
    if not re.fullmatch(r'https://t\.me/nft/[A-Za-z0-9]+-\d+', url):
        return {**result, 'error': 'invalid_nft_url'}
    try:
        response = requests.get(url, timeout=(5, 20), allow_redirects=False)
        response.raise_for_status()
        page = GiftPage()
        page.feed(response.text)
        title = page.meta.get('og:title', '')
        serial = re.search(r'#(\d+)$', title)
        if not serial or serial.group(1) != url.rsplit('-', 1)[1]:
            return {**result, 'error': 'nft_page_unavailable', 'page_title': title,
                    'response_status': response.status_code}
        animation = urlsplit(page.animation or '')
        if animation.scheme != 'https' or not (animation.hostname or '').endswith('.telesco.pe') or animation.path != '/file/sticker.tgs':
            return {**result, 'title': title, 'error': 'original_animation_unavailable'}
        result.update(title=title, animation_url=page.animation, animation_format='TGS',
                      animation_refresh_from=url, preview_url=page.meta.get('og:image'),
                      resolved_at=datetime.now(timezone.utc).isoformat())
        for line in page.meta.get('og:description', '').splitlines():
            for label, field in [('Model:', 'model'), ('Backdrop:', 'background'), ('Symbol:', 'symbol')]:
                if line.startswith(label):
                    result[field] = line[len(label):].strip()
        for label, field in [('Model', 'model'), ('Backdrop', 'background'), ('Symbol', 'symbol')]:
            value = page.attributes.get(label, '')
            match = re.fullmatch(r'(.+?)\s+(\d+(?:\.\d+)?)%', value)
            if match:
                result[field] = match[1]
                result[field + '_rarity'] = float(match[2])
        if page.attributes.get('Owner'):
            result['owner_at_resolution'] = page.attributes['Owner']
        return result
    except requests.RequestException as error:
        return {**result, 'error': type(error).__name__}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--workers', type=int, default=1)
    parser.add_argument('--delay', type=float, default=6)
    args = parser.parse_args()
    source = json.loads(args.input.read_text(encoding='utf-8'))
    items = source['items'] if isinstance(source, dict) else source
    previous = {}
    if args.output.is_file():
        previous = {r['url']: r for r in json.loads(args.output.read_text(encoding='utf-8')).get('items', [])}
    missing = [item for item in items if item['url'] not in previous or previous[item['url']].get('error')]
    def save():
        resolved = list({item['url']: previous.get(item['url'], {
            **{key: item[key] for key in ('name', 'number', 'url', 'observed_at') if key in item},
            'error': 'not_resolved_yet'}) for item in items}.values())
        output = dict(schema_version=1, source_profile='https://t.me/mrktbank',
                      complete=bool(isinstance(source, dict) and source.get('complete')),
                      captured_at=datetime.now(timezone.utc).isoformat(), items=resolved,
                      animation_url_lifetime='Public CDN links may expire; refresh from the permanent NFT page.')
        args.output.parent.mkdir(parents=True, exist_ok=True)
        temporary = args.output.with_suffix('.tmp')
        temporary.write_text(json.dumps(output, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
        temporary.replace(args.output)
        args.output.with_suffix('.txt').write_text('\n'.join(item['url'] for item in resolved)+'\n', encoding='utf-8')
        args.output.with_name(args.output.stem+'-animations.txt').write_text('\n'.join(item['animation_url'] for item in resolved if item.get('animation_url'))+'\n', encoding='utf-8')
        return output

    if args.workers == 1:
        for index, item in enumerate(missing):
            if index:
                time.sleep(max(0, args.delay))
            result = resolve(item)
            previous[result['url']] = result
            save()
    else:
        with concurrent.futures.ThreadPoolExecutor(max_workers=max(1, min(4, args.workers))) as pool:
            for result in pool.map(resolve, missing):
                previous[result['url']] = result
                save()
    output = save()
    resolved = output['items']
    print(json.dumps(dict(nfts=len(resolved), animations=sum(bool(i.get('animation_url')) for i in resolved),
                          complete=output['complete'], errors=[{'url':i['url'],'error':i['error']} for i in resolved if i.get('error')])))


if __name__ == '__main__':
    main()
