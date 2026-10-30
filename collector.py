"""Read-only Swift partner API adapter. Never logs in to Telegram user accounts."""
import hashlib
import json
import math
import threading
import time
from urllib.parse import urlsplit
import requests

API_ORIGIN='https://partners.swiftgifts.tg'

def text(value, limit=200):
    return str(value)[:limit] if value is not None else ''

def https_url(value):
    if not isinstance(value,str) or len(value)>4096:
        return None
    try:
        u=urlsplit(value)
        return value if u.scheme=='https' and u.hostname and not u.username and not u.password else None
    except ValueError:
        return None

def normalize_listing(row):
    if not isinstance(row,dict) or text(row.get('provider')).lower()!='mrkt':
        return None
    norm=row.get('normalized') or {}
    gift=norm.get('gift') or {}
    price=norm.get('price') or {}
    slug=text(gift.get('slug') or row.get('slug'))
    identity=gift.get('id') or slug
    value=row.get('seller_price_ton')
    if value is None:
        value=price.get('seller_ton')
    if value is None:
        value=row.get('price')
    try:
        amount=float(value)
        if isinstance(value,bool) or not math.isfinite(amount) or amount<0:
            return None
    except (TypeError,ValueError,OverflowError):
        return None
    if not identity:
        return None
    attrs=gift.get('attributes') or row.get('attributes') or {}
    def trait(key):
        raw=attrs.get(key)
        return text(raw.get('name') if isinstance(raw,dict) else raw) or None
    return {'id':'mrkt-'+hashlib.sha256(str(identity).encode()).hexdigest()[:32],
            'slug':slug,'name':text(gift.get('collection') or row.get('title')),
            'number':gift.get('number') or row.get('number'),'price':amount,'currency':'TON','source':'mrkt',
            'image':https_url(gift.get('image_url') or row.get('source_image_url') or row.get('photo_url')),
            'url':('https://t.me/nft/'+slug) if slug and all(c.isalnum() or c=='-' for c in slug) else None,
            'model':trait('model'),'background':trait('backdrop'),'symbol':trait('symbol')}

def event_rows(payload):
    if isinstance(payload,list):
        for row in payload:
            yield from event_rows(row)
    elif isinstance(payload,dict):
        for key in ('items','data','actions'):
            if isinstance(payload.get(key),list):
                yield from event_rows(payload[key]); return
        if any(k in payload for k in ('slug','gift_id','normalized')):
            yield payload

class Collector:
    def __init__(self, settings, store, request=requests.request):
        self.settings=settings
        self.store=store
        self.request=request
        self.stop_event=threading.Event()
        self.wake=threading.Event()
        self.lock=threading.Lock()
        self.threads=[]

    def status(self):
        return {'configured':bool(self.settings.api_key),'enabled':bool(self.settings.api_key) and self.store.get('sync_enabled',False),
                'catalog':self.store.get('catalog_status',{}),'last_error':self.store.get('sync_error'),
                'last_event_at':self.store.get('last_event_at'),'interval':self.settings.sync_interval,
                'max_pages':self.settings.max_pages,'games_connected':False}

    def set_enabled(self, enabled):
        if enabled and not self.settings.api_key:
            raise ValueError('SWIFT_API_KEY не настроен в переменных Bothost')
        self.store.set('sync_enabled',bool(enabled)); self.wake.set()

    def start(self):
        if self.threads or not self.settings.api_key:
            return
        for target,args in [(self._poll,())]+[(self._stream,(kind,)) for kind in ('listing','buy','change_price')]:
            t=threading.Thread(target=target,args=args,daemon=True);t.start();self.threads.append(t)

    def close(self):
        self.stop_event.set();self.wake.set()

    def _headers(self):
        return {'X-API-KEY':self.settings.api_key,'Accept':'application/json'}

    def sync_once(self):
        if not self.settings.api_key:
            raise ValueError('SWIFT_API_KEY не настроен')
        if not self.lock.acquire(blocking=False):
            return False
        try:
            started=time.time();items={};complete=False
            for page in range(self.settings.max_pages):
                if self.stop_event.is_set() or not self.store.get('sync_enabled',False):
                    return False
                with self.request('POST',API_ORIGIN+'/api/aggregator',params={'page':page,'limit':200},
                                  json={'market':['mrkt'],'sort_by':'price asc'},headers=self._headers(),timeout=(10,35)) as response:
                    if response.status_code==429:
                        self.store.set('sync_error','rate_limited')
                        self.stop_event.wait(max(1,int(response.headers.get('Retry-After','60'))));return False
                    if response.status_code!=200:
                        self.store.set('sync_error','source_http_'+str(response.status_code));return False
                    body=response.json()
                if not isinstance(body,dict) or not isinstance(body.get('items'),list):
                    self.store.set('sync_error','invalid_source_response');return False
                meta=body.get('meta') or {};partial=bool(meta.get('partial')) or bool(meta.get('providerErrors'))
                raw=body['items'];before=len(items)
                for row in raw:
                    item=normalize_listing(row)
                    if item:
                        items[item['id']]=item
                total=body.get('total')
                valid_total=isinstance(total,int) and not isinstance(total,bool) and total>=0
                if partial:
                    break
                if valid_total and len(items)>=total:
                    complete=True;break
                if not raw:
                    complete=not valid_total or len(items)>=total;break
                if len(items)==before:
                    break
                if self.stop_event.wait(1.05):
                    return False
            # A bounded or partial scan never removes unseen listings.
            self.store.snapshot(list(items.values()),complete=complete,started=started)
            self.store.set('sync_error',None if complete else 'partial_catalog')
            return True
        except (requests.RequestException,ValueError,TypeError,KeyError):
            self.store.set('sync_error','source_unavailable');return False
        finally:
            self.lock.release()

    def _poll(self):
        while not self.stop_event.is_set():
            self.wake.clear()
            if self.store.get('sync_enabled',False):
                self.sync_once()
            self.wake.wait(self.settings.sync_interval)

    def _stream(self, kind):
        delay=2
        while not self.stop_event.is_set():
            if not self.store.get('sync_enabled',False):
                self.stop_event.wait(1);continue
            try:
                with self.request('GET',API_ORIGIN+'/api/realtime/markets',params={'market':'mrkt','type':kind},
                                  headers={**self._headers(),'Accept':'text/event-stream'},stream=True,timeout=(10,75)) as response:
                    if response.status_code!=200:
                        delay=max(2,int(response.headers.get('Retry-After','60')))
                        self.store.set('sync_error','stream_http_'+str(response.status_code))
                    else:
                        delay=2;response.encoding='utf-8';lines=[];size=0
                        for line in response.iter_lines(chunk_size=4096,decode_unicode=True):
                            if self.stop_event.is_set() or not self.store.get('sync_enabled',False):
                                break
                            if not line:
                                if lines:
                                    self._record_stream(kind,'\n'.join(lines))
                                lines=[];size=0
                            elif line.startswith('data:'):
                                value=line[5:].lstrip();size+=len(value)
                                if size>262144:
                                    raise ValueError('oversize event')
                                lines.append(value)
            except (requests.RequestException,ValueError,TypeError):
                self.store.set('sync_error','stream_reconnecting')
            self.stop_event.wait(delay)

    def _record_stream(self, kind, raw):
        payload=json.loads(raw)
        if isinstance(payload,dict) and payload.get('error'):
            self.store.set('sync_error','source_event_error');return
        for row in event_rows(payload):
            # Only public market fields are persisted, never purchase payloads or credentials.
            norm=row.get('normalized') or {};gift=norm.get('gift') or {}
            observation={'type':kind,'source':'mrkt','event_id':text(row.get('event_id')) or None,
                         'source_time':text(row.get('date')) or None,'slug':text(gift.get('slug') or row.get('slug')) or None,
                         'collection':text(gift.get('collection') or row.get('collection') or row.get('title')) or None,
                         'price':self._finite_price(row.get('price_ton',row.get('price'))),'currency':'TON'}
            self.store.event('market_event',observation)
            self.store.set('last_event_at',time.time())

    @staticmethod
    def _finite_price(value):
        try:
            n=float(value)
            return n if not isinstance(value,bool) and math.isfinite(n) and n>=0 else None
        except (ValueError,TypeError,OverflowError):
            return None
