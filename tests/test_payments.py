import base64
import json
import tempfile
import time
import unittest
from pathlib import Path
from unittest.mock import Mock,patch
from app import create_app
from settings import Settings
from storage import Store
from payments import DEFAULT_WALLET,raw_address,nano_amount,comment_payload
from test_app import TOKEN,signed

class PaymentTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.store=Store(Path(self.tmp.name)/'test.db')
        self.client=create_app(Settings(bot_token=TOKEN,domain='https://example.org',data_dir=Path(self.tmp.name)),store=self.store).test_client()
    def tearDown(self):self.tmp.cleanup()
    def create(self):
        r=self.client.post('/api/payments/intents',json={'initData':signed(),'amount':'0.123456789'})
        self.assertEqual(r.status_code,201);return r.json
    def chain(self,intent,**changes):
        with self.store.connect() as db:row=db.execute('SELECT * FROM ton_deposits WHERE id=?',(intent['id'],)).fetchone()
        msg={'destination':raw_address(DEFAULT_WALLET),'value':intent['amount_nano'],'bounced':False,'message_content':{'decoded':{'type':'text_comment','comment':row['comment']}}};msg.update(changes)
        return {'hash':'a'*64,'now':int(time.time()),'description':{'aborted':False},'in_msg':msg}
    def status(self,intent):return self.client.post('/api/payments/status',json={'initData':signed(),'id':intent['id']})
    def test_address_precision_and_boc(self):
        self.assertTrue(raw_address(DEFAULT_WALLET).startswith('0:'))
        with self.assertRaises(ValueError):raw_address(DEFAULT_WALLET[:-1]+'k')
        self.assertEqual(nano_amount('0.123456789'),'123456789')
        for bad in ['NaN','1e2','0.01','1000.1','1.1234567890',False]:
            with self.assertRaises(ValueError):nano_amount(bad)
        boc=base64.b64decode(comment_payload('deposit:test'))
        self.assertEqual(boc[:4],bytes.fromhex('b5ee9c72'));self.assertTrue(boc.endswith(b'\0\0\0\0deposit:test'))
    def test_requires_signed_identity_and_hides_other_users_invoice(self):
        self.assertEqual(self.client.post('/api/payments/intents',json={'amount':'1'}).status_code,403)
        i=self.create();self.assertEqual(self.client.post('/api/payments/status',json={'initData':signed(uid=77),'id':i['id']}).status_code,404)
        self.assertEqual(i['transaction']['messages'][0]['address'],DEFAULT_WALLET)
        self.assertEqual(self.client.post('/api/payments/account',json={'initData':signed()}).json['pending'][0]['id'],i['id'])
        self.assertEqual(self.client.post('/api/payments/account',json={'initData':signed(uid=77)}).json['pending'],[])
    @patch('payments.requests.get')
    def test_credits_only_matching_chain_transaction_once(self,get):
        i=self.create();get.return_value=Mock();get.return_value.json.return_value={'transactions':[self.chain(i)]}
        for _ in range(2):self.assertEqual(self.status(i).json,{'status':'confirmed','balance_nano':'123456789','currency':'TON'})
        self.assertEqual(get.call_count,1)
        account=self.client.post('/api/payments/account',json={'initData':signed()}).json
        self.assertEqual(account['pending'],[]);self.assertEqual(account['balance_nano'],'123456789')
    @patch('payments.requests.get')
    def test_wrong_amount_and_comment_do_not_credit(self,get):
        i=self.create();get.return_value=Mock();get.return_value.json.return_value={'transactions':[self.chain(i,value='1'),self.chain(i,message_content={'decoded':{'type':'text_comment','comment':'wrong'}})]}
        self.assertEqual(self.status(i).json['status'],'pending')
        with self.store.connect() as db:self.assertIsNone(db.execute('SELECT tx_hash FROM ton_deposits').fetchone()[0])
    @patch('payments.requests.get')
    def test_aborted_and_bounced_do_not_credit(self,get):
        i=self.create();tx=self.chain(i);tx['description']['aborted']=True
        get.return_value=Mock();get.return_value.json.return_value={'transactions':[tx,self.chain(i,bounced=True)]}
        self.assertEqual(self.status(i).json['status'],'pending')
    def test_metadata_and_snapshot_currency_are_explicit(self):
        meta=self.client.get('/api/gift-collections').json;self.assertEqual(len(meta['collections']),133)
        quote=self.client.get('/api/market/quote?collection=Vice+Cream&background=Black').json
        self.assertEqual(quote['quotes'][0]['quick_sell'],'25.02');self.assertEqual(quote['quotes'][0]['currency'],'GRAM')
        with self.store.connect() as db:
            db.execute('INSERT INTO listings VALUES(?,?,1,?)',('test',json.dumps({'name':'Vice Cream','background':'Black','price':2.3,'currency':'TON'}),time.time()))
        live=self.client.get('/api/market/quote?collection=Vice+Cream&background=Black').json['quotes']
        self.assertEqual(live[0]['currency'],'TON');self.assertIsNone(live[0]['quick_sell']);self.assertEqual(live[1]['currency'],'GRAM')
        self.assertEqual(self.client.get('/api/gift-assets/not-a-collection/0').status_code,404)
