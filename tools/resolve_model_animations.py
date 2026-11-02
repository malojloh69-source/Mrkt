"""Resolve observed NFT models using the published Gift Changes CDN directory index.

No guessed media URLs: each copied TGS URL must exist in its collection's index.
The downloaded vector animation is validated; only links and validation metadata
are added to the snapshot. Cache files stay outside the repository.
"""
import argparse
import concurrent.futures
from datetime import datetime, timezone
from html.parser import HTMLParser
import hashlib
import json
from pathlib import Path
import re
import sys
import time
from urllib.parse import unquote, urljoin, urlsplit
import requests

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from bank_nfts import download_animation


class Links(HTMLParser):
    def __init__(self):super().__init__();self.links=[]
    def handle_starttag(self, tag, attrs):
        if tag=='a':self.links.append(dict(attrs).get('href',''))


def index(url):
    for attempt in range(3):
        try:
            response=requests.get(url,timeout=(15,30),allow_redirects=False)
            response.raise_for_status()
            break
        except requests.RequestException:
            if attempt==2:raise
            time.sleep(2*(attempt+1))
    parser=Links();parser.feed(response.text)
    return [urljoin(url,href) for href in parser.links]


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input',type=Path,required=True)
    parser.add_argument('--output',type=Path,required=True)
    parser.add_argument('--cache-dir',type=Path,required=True)
    args=parser.parse_args()
    args.cache_dir.mkdir(parents=True,exist_ok=True)
    previous={r['url']:r for r in json.loads(args.output.read_text(encoding='utf-8'))['items']} if args.output.is_file() else {}
    source=json.loads(args.input.read_text(encoding='utf-8'))
    rows=[{**{k:v for k,v in row.items() if k!='tile_key'},**previous.get(row['url'],{})} for row in source['items'][:500]]
    key=lambda text:re.sub('[^a-z0-9]','',text.lower())
    directories={}
    for url in index('https://cdn.changes.tg/gifts/models/'):
        parts=unquote(urlsplit(url).path).strip('/').split('/')
        if urlsplit(url).hostname=='cdn.changes.tg' and len(parts)==3 and parts[:2]==['gifts','models'] and url.endswith('/'):
            directories[key(parts[2])]=url
    wanted={key(row['name']) for row in rows if not row.get('animation_url') and row.get('model')}
    def collection_index(name):
        if name not in directories:return name,{}
        path=args.cache_dir/(name+'-index.json')
        if path.is_file():return name,json.loads(path.read_text(encoding='utf-8'))
        links={}
        for url in index(directories[name]):
            part=unquote(urlsplit(url).path).rsplit('/',1)[-1]
            if part.endswith('.tgs') and urlsplit(url).hostname=='cdn.changes.tg':links[part[:-4]]=url
        path.write_text(json.dumps(links,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
        return name,links
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        models=dict(pool.map(collection_index,sorted(wanted)))
    urls={models.get(key(row['name']),{}).get(row.get('model')) for row in rows if not row.get('animation_url')}
    urls.discard(None)
    def validate(url):
        cache=args.cache_dir/(hashlib.sha256(url.encode()).hexdigest()+'.json')
        if cache.is_file():return url,json.loads(cache.read_text(encoding='utf-8'))
        try:
            raw=download_animation(url);data=json.loads(raw)
            info={'animation_json_sha256':hashlib.sha256(raw).hexdigest(),'animation_json_bytes':len(raw),
                  'animation_frame_rate':data.get('fr'),'animation_frames':data.get('op',0)-data.get('ip',0),
                  'animation_validated_at':datetime.now(timezone.utc).isoformat()}
            cache.write_text(json.dumps(info,indent=2)+'\n',encoding='utf-8')
            return url,info
        except (requests.RequestException,ValueError,OSError,EOFError) as error:
            return url,{'validation_error':type(error).__name__}
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        verified=dict(pool.map(validate,sorted(urls)))
    for row in rows:
        if row.get('animation_url'):continue
        url=models.get(key(row['name']),{}).get(row.get('model'))
        info=verified.get(url,{})
        if url and info and not info.get('validation_error'):
            for field in ('error','page_title','response_status'):row.pop(field,None)
            row.update(animation_url=url,animation_format='TGS',animation_refresh_from=row['url'],
                       animation_source='giftchanges_model_cdn',animation_match='observed_collection_and_model',
                       animation_source_index=directories[key(row['name'])],
                       resolved_at=datetime.now(timezone.utc).isoformat(),**info)
    output={'schema_version':1,'source_profile':'https://t.me/mrktbank','complete':False,
            'selection_limit':500,'selection_complete':len(rows)==500,'captured_at':rows[-1]['observed_at'],'items':rows}
    args.output.write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'nfts':len(rows),'animations':sum(bool(r.get('animation_url')) for r in rows),
                      'missing':[r['url'] for r in rows if not r.get('animation_url')]}))


if __name__=='__main__':main()
