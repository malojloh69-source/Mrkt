import hashlib
import hmac
import json
import tempfile
import time
import unittest
from pathlib import Path
from urllib.parse import urlencode

from app import create_app
from settings import Settings
from storage import Store
from telegram_auth import verify_init_data, AuthError

TOKEN='123456:unit-test-token'

def signature(user,age=0):
    fields={'auth_date':str(int(time.time())-age),'user':json.dumps(user)}
    check='\n'.join(f'{key}={value}' for key,value in sorted(fields.items()))
    secret=hmac.new(b'WebAppData',TOKEN.encode(),hashlib.sha256).digest()
    fields['hash']=hmac.new(secret,check.encode(),hashlib.sha256).hexdigest()
    return urlencode(fields)

class IdentityAndReports(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        settings=Settings(bot_token=TOKEN,admin_id=42,data_dir=Path(self.tmp.name))
        self.store=Store(Path(self.tmp.name)/'market.sqlite3')
        self.client=create_app(settings,store=self.store).test_client()

    def tearDown(self):self.tmp.cleanup()

    def test_profile_verifies_signature_and_only_returns_public_identity(self):
        user={'id':7,'first_name':'Reader','username':'reader_7','photo_url':'https://t.me/i/userpic/photo.jpg','phone_number':'must-not-return','password':'must-not-return'}
        r=self.client.post('/api/telegram/me',json={'initData':signature(user)})
        self.assertEqual(r.status_code,200)
        self.assertEqual(r.json['user']['username'],'reader_7')
        self.assertTrue(r.json['verified'])
        self.assertNotIn('must-not-return',r.text)
        self.assertEqual(r.headers['Cache-Control'],'no-store')

    def test_profile_fails_closed_without_valid_telegram_signature(self):
        for raw in ['',signature({'id':7},age=3600),signature({'id':7}).replace('7','8')]:
            self.assertEqual(self.client.post('/api/telegram/me',json={'initData':raw}).status_code,403)
        self.assertEqual(self.client.post('/api/telegram/me',json=['invalid']).status_code,400)

    def test_photo_and_malformed_identity_are_rejected(self):
        r=self.client.post('/api/telegram/me',json={'initData':signature({'id':7,'photo_url':'javascript:alert(1)'})})
        self.assertNotIn('photo_url',r.json['user'])
        for user in [[],42,{'id':True},{'id':-1}]:
            with self.assertRaises(AuthError):verify_init_data(signature(user),TOKEN)

    def test_reports_are_persistent_private_and_deduplicated(self):
        payload={'initData':signature({'id':7}),'item':'channel-saved-reference'}
        self.assertEqual(self.client.post('/api/reports',json=payload).status_code,201)
        duplicate=self.client.post('/api/reports',json=payload)
        self.assertEqual(duplicate.status_code,409);self.assertTrue(duplicate.json['duplicate'])
        self.assertEqual(len(Store(Path(self.tmp.name)/'market.sqlite3').reports()),1)
        self.assertEqual(self.client.get('/api/events').json['events'],[])
        self.assertEqual(self.client.get('/api/admin/reports').status_code,403)
        self.assertEqual(self.client.post('/api/admin/reports',json={'initData':signature({'id':7})}).status_code,403)
        self.assertEqual(len(self.client.post('/api/admin/reports',json={'initData':signature({'id':42})}).json['reports']),1)

    def test_report_requires_identity_and_valid_item(self):
        self.assertEqual(self.client.post('/api/reports',json={'item':'x'}).status_code,403)
        r=self.client.post('/api/reports',json={'initData':signature({'id':7}),'item':'../escape'})
        self.assertEqual(r.status_code,400)

if __name__=='__main__':unittest.main()
