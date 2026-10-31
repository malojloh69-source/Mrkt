"""Public reference metadata, separate quote provenance and a bounded art cache."""
import hashlib
import json
import math
import os
import tempfile
from pathlib import Path
from urllib.parse import urlsplit
import requests
from flask import jsonify, request, send_file

def register_catalog(app,settings,store,public):
    def read(name,default):
        try:return json.loads((public/name).read_text(encoding='utf-8'))
        except (OSError,ValueError):return default
    data=read('catalog-metadata.json',{'collections':[]})
    collections={c['id']:c for c in data['collections']}
    observations=read('price-observations.json',[])

    @app.get('/api/gift-collections')
    def metadata():return jsonify(data)

    @app.get('/api/market/quote')
    def quote():
        name=request.args.get('collection','').strip();background=request.args.get('background','').strip()
        if not name or len(name)>100 or len(background)>100:return jsonify(error='invalid_filter'),400
        with store.connect() as db:
            rows=db.execute("SELECT body FROM listings WHERE active=1 AND lower(json_extract(body,'$.name'))=lower(?)",(name,)).fetchall()
        grouped={}
        for row in rows:
            item=json.loads(row['body'])
            if background and str(item.get('background','')).casefold()!=background.casefold():continue
            price=item.get('price');currency=item.get('currency')
            if isinstance(price,(int,float)) and not isinstance(price,bool) and math.isfinite(price) and price>=0 and currency in ('TON','GRAM','USD'):
                grouped[currency]=min(grouped.get(currency,float('inf')),price)
        quotes=[{'source':'live_catalog','listing_floor':p,'quick_sell':None,'currency':c} for c,p in grouped.items()]
        quotes.extend({**r,'source':'observed_snapshot'} for r in observations if r.get('collection','').casefold()==name.casefold() and (r.get('background') or '').casefold()==background.casefold())
        return jsonify(collection=name,background=background or None,quotes=quotes)

    @app.get('/api/gift-assets/<collection>/<int:index>')
    def art(collection,index):
        item=collections.get(collection)
        if not item or index>=len(item.get('models',[])):return jsonify(error='unknown_asset'),404
        url=item['models'][index][2];parsed=urlsplit(url)
        if parsed.scheme!='https' or parsed.hostname!='cdn.changes.tg' or not parsed.path.startswith('/gifts/models/') or parsed.query or parsed.fragment or parsed.username:return jsonify(error='invalid_source'),400
        key=hashlib.sha256(url.encode()).hexdigest();cache=settings.data_dir/'gift-art';cache.mkdir(exist_ok=True)
        target=cache/(key+'.bin');meta=cache/(key+'.json')
        if target.is_file() and meta.is_file():return send_file(target,mimetype=json.loads(meta.read_text())['mime'])
        temporary=None
        try:
            with requests.get(url,stream=True,timeout=(5,20),allow_redirects=False) as response:
                mime=response.headers.get('Content-Type','').split(';')[0]
                if response.status_code!=200 or mime not in ('image/png','image/webp','image/jpeg','image/gif'):return jsonify(error='source_image_unavailable'),502
                with tempfile.NamedTemporaryFile(dir=cache,delete=False) as file:
                    temporary=Path(file.name);length=0
                    for block in response.iter_content(65536):
                        length+=len(block)
                        if length>8*1024*1024:raise ValueError('Image exceeds cache limit')
                        file.write(block)
                if not length:raise ValueError('Empty image')
                os.replace(temporary,target);temporary=None
                meta.write_text(json.dumps({'url':url,'mime':mime}),encoding='utf-8')
                return send_file(target,mimetype=mime)
        except (requests.RequestException,ValueError,OSError):return jsonify(error='source_image_unavailable'),502
        finally:
            if temporary:temporary.unlink(missing_ok=True)
