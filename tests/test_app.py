import hashlib
import hmac
import json
import tempfile
import time
import unittest
from dataclasses import replace
from pathlib import Path
from urllib.parse import urlencode
from unittest.mock import patch
from app import create_app
from settings import Settings, public_url
from storage import Store
from collector import Collector, normalize_listing
from bot_service import TelegramBot
from telegram_auth import AuthError, verify_init_data

TOKEN='123456:local-test-only'

def signed(uid=42, age=0, token=TOKEN):
    fields={'auth_date':str(int(time.time())-age),'user':json.dumps({'id':uid,'first_name':'Owner'})}
    check='\n'.join(f'{k}={v}' for k,v in sorted(fields.items()))
    secret=hmac.new(b'WebAppData',token.encode(),hashlib.sha256).digest()
    fields['hash']=hmac.new(secret,check.encode(),hashlib.sha256).hexdigest()
    return urlencode(fields)

class Response:
    def __init__(self, data, status=200, headers=None):
        self.data=data;self.status_code=status;self.headers=headers or {};self.encoding='utf-8'
    def __enter__(self):return self
    def __exit__(self,*args):pass
    def json(self):return self.data

class AppTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.settings=Settings(bot_token=TOKEN,domain='https://unit.bothost.tech',admin_id=42,data_dir=Path(self.tmp.name),api_key='source-test-only')
        self.store=Store(Path(self.tmp.name)/'test.sqlite3')
        self.collector=Collector(self.settings,self.store)
        self.app=create_app(self.settings,store=self.store,collector=self.collector)
        self.client=self.app.test_client()
    def tearDown(self):self.tmp.cleanup()

    def test_health_and_static_pages(self):
        for url in ['/health','/','/admin','/catalog','/service.js','/game-engine.js']:
            response=self.client.get(url);self.assertEqual(response.status_code,200,url);response.close()
        self.assertTrue(self.client.get('/health').json['ok'])

    def test_json_status_and_catalog_routes(self):
        response=self.client.get('/api/status');self.assertEqual(response.status_code,200)
        self.assertTrue(response.json['configured']);self.assertTrue(response.json['read_only'])
        response=self.client.get('/api/catalog');self.assertEqual(response.status_code,200)
        self.assertEqual(response.json['items'],[]);self.assertEqual(response.json['currency'],'TON')
        response=self.client.post('/api/admin/status',json={'initData':signed()})
        self.assertEqual(response.status_code,200);self.assertTrue(response.json['admin_configured'])
        self.assertEqual(self.client.post('/api/admin/control',json=['bad']).status_code,400)

    def test_private_files_and_login_routes_are_not_exposed(self):
        for url in ['/settings.py','/data/market.sqlite3','/.env','/../settings.py','/api/auth/send-code','/api/login','/api/session']:
            self.assertIn(self.client.get(url).status_code,(404,405))
        self.assertNotIn('source-test-only',self.client.get('/api/status').text)
        self.assertNotIn(TOKEN,self.client.get('/api/status').text)

    def test_unsigned_and_other_users_cannot_control(self):
        for data in [{},{'initData':'bad','action':'start'},{'initData':signed(7),'action':'start'}]:
            self.assertEqual(self.client.post('/api/admin/control',json=data).status_code,403)
        self.assertFalse(self.store.get('sync_enabled',False))

    def test_owner_can_start_stop_and_state_survives(self):
        for action,expected in [('start',True),('stop',False)]:
            r=self.client.post('/api/admin/control',json={'initData':signed(),'action':action})
            self.assertEqual(r.status_code,200);self.assertEqual(r.json['status']['enabled'],expected)
            reopened=Store(Path(self.tmp.name)/'test.sqlite3');self.assertEqual(reopened.get('sync_enabled'),expected)

    def test_missing_source_key_is_honest(self):
        c=Collector(replace(self.settings,api_key=''),self.store)
        with self.assertRaises(ValueError):c.set_enabled(True)
        self.assertFalse(c.status()['configured']);self.assertFalse(c.status()['games_connected'])

    def test_signature_expiration_tampering_duplicates(self):
        self.assertEqual(verify_init_data(signed(),TOKEN)['id'],42)
        for raw in [signed(age=301),signed(age=-90),signed()+'&user=x',signed().replace('Owner','Other')]:
            with self.assertRaises((AuthError,ValueError)):verify_init_data(raw,TOKEN)

    def test_admin_configuration_fails_closed(self):
        app=create_app(replace(self.settings,admin_id=0),store=self.store,collector=self.collector)
        self.assertEqual(app.test_client().post('/api/admin/status',json={'initData':signed()}).status_code,403)

    def test_pagination_validation(self):
        self.assertEqual(self.client.get('/api/catalog?offset=bad').status_code,400)
        self.assertEqual(self.client.get('/api/events?after=bad').status_code,400)
        self.assertEqual(self.client.post('/api/admin/events',json={'initData':signed(),'after':None}).status_code,400)

    def test_partial_snapshot_does_not_remove_unseen(self):
        self.store.snapshot([{'id':'a','price':1},{'id':'b','price':2}],complete=True,started=time.time())
        self.store.snapshot([{'id':'a','price':3}],complete=False,started=time.time())
        self.assertEqual(self.store.catalog()['total'],2)
        self.store.snapshot([{'id':'a','price':3}],complete=True,started=time.time())
        self.assertEqual(self.store.catalog()['total'],1)

    def test_events_deduplicate_and_survive_restart(self):
        self.store.event('listing',{'slug':'gift-1'});self.store.event('listing',{'slug':'gift-1'})
        rows=Store(Path(self.tmp.name)/'test.sqlite3').history();self.assertEqual(len(rows),1)
        self.assertEqual(rows[0]['data']['slug'],'gift-1')
        self.assertEqual(self.client.get('/api/events?after=1').json['events'],[])

    def test_listing_normalization_rejects_unsafe_or_unknown_prices(self):
        row={'provider':'mrkt','slug':'LolPop-7','title':'Lol Pop','number':7,'price':3.91,'photo_url':'https://example.com/x.png','options':{'payload':'not-persisted'}}
        item=normalize_listing(row);self.assertEqual(item['currency'],'TON');self.assertNotIn('options',item)
        self.assertIsNone(normalize_listing({**row,'price':float('nan')}))
        self.assertIsNone(normalize_listing({**row,'price':None}))
        self.assertIsNone(normalize_listing({**row,'provider':'unknown'}))
        self.assertIsNone(normalize_listing({**row,'photo_url':'javascript:bad'})['image'])

    def test_collector_request_shape_and_complete_scan(self):
        calls=[]
        def request(method,url,**kwargs):
            calls.append((method,url,kwargs))
            return Response({'total':1,'items':[{'provider':'mrkt','slug':'gift-1','title':'Gift','price':1}],'meta':{'partial':False}})
        c=Collector(self.settings,self.store,request);c.set_enabled(True)
        self.assertTrue(c.sync_once());self.assertTrue(self.store.get('catalog_status')['complete'])
        self.assertEqual(calls[0][2]['json'],{'market':['mrkt'],'sort_by':'price asc'})
        self.assertEqual(calls[0][2]['params'],{'page':0,'limit':200})
        self.assertNotIn('source-test-only',calls[0][1])

    def test_partial_upstream_empty_does_not_erase(self):
        self.store.snapshot([{'id':'a','price':1}],complete=True,started=time.time())
        c=Collector(self.settings,self.store,lambda *args,**kwargs:Response({'total':0,'items':[],'meta':{'partial':True}}));c.set_enabled(True)
        c.sync_once();self.assertEqual(self.store.catalog()['total'],1);self.assertFalse(self.store.get('catalog_status')['complete'])

    def test_stream_only_saves_public_market_fields(self):
        self.collector._record_stream('buy',json.dumps({'items':[{'slug':'gift-1','price':1,'date':'2026-10-30','event_id':'event1','password':'must-not-store','options':{'payload':'must-not-store'}}]}))
        rows=self.store.history();self.assertEqual(len(rows),1);self.assertNotIn('must-not-store',json.dumps(rows))
        self.assertEqual(rows[0]['data']['type'],'buy')

    def test_bot_hidden_command_inline_menu(self):
        bot=TelegramBot(self.settings,self.store,self.collector);calls=[]
        bot.call=lambda method,payload:calls.append((method,payload))
        bot.handle({'message':{'chat':{'id':42,'type':'private'},'from':{'id':42},'text':'/clezzy1488'}})
        buttons=calls[-1][1]['reply_markup']['inline_keyboard']
        self.assertTrue(any(b.get('callback_data')=='sync:on' for row in buttons for b in row))
        self.assertFalse(any('номер' in b['text'].lower() for row in buttons for b in row))

    def test_bot_start_responds_every_time_and_ignores_codes(self):
        bot=TelegramBot(self.settings,self.store,self.collector);calls=[];bot.call=lambda method,payload:calls.append((method,payload))
        def update(text=None):return {'message':{'chat':{'id':7,'type':'private'},'from':{'id':7},**({'text':text} if text is not None else {})}}
        bot.handle(update('/start'));bot.handle(update('/start'));self.assertEqual(len(calls),2)
        bot.handle(update('12345'));bot.handle(update('+79990001122'));bot.handle(update())
        self.assertEqual(len(calls),2)

    def test_bot_unauthorized_callback_cannot_start(self):
        bot=TelegramBot(self.settings,self.store,self.collector);calls=[];bot.call=lambda method,payload:calls.append((method,payload))
        bot.handle({'callback_query':{'id':'1','from':{'id':7},'message':{'chat':{'id':7,'type':'private'}},'data':'sync:on'}})
        self.assertFalse(self.store.get('sync_enabled',False));self.assertTrue(calls[-1][1]['show_alert'])

    def test_domain_validation(self):
        self.assertEqual(public_url('bot-1.bothost.tech'),'https://bot-1.bothost.tech')
        for url in ['http://example.com','https://user:password@example.com','https://example.com/path']:
            with self.assertRaises(ValueError):public_url(url)

if __name__=='__main__':unittest.main()
