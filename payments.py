"""TON Connect invoices. Client wallet responses never credit a balance."""
import base64
import binascii
import json
import re
import sqlite3
import time
import uuid
from decimal import Decimal, InvalidOperation
import requests
from flask import jsonify, request
from telegram_auth import verify_init_data, AuthError

DEFAULT_WALLET='UQAnvk0ZBh884n9Sb_vBg05do10BXIBl6URoBBMBWgSNtQAj'

def raw_address(value):
    if not isinstance(value,str):raise ValueError('Invalid TON address')
    if re.fullmatch(r'(?:0|-1):[a-fA-F0-9]{64}',value):return value.lower()
    if not re.fullmatch(r'[A-Za-z0-9_-]{48}',value):raise ValueError('Invalid TON address')
    data=base64.urlsafe_b64decode(value)
    if data[0] not in (0x11,0x51) or data[1] not in (0,255) or binascii.crc_hqx(data[:-2],0).to_bytes(2,'big')!=data[-2:]:raise ValueError('Invalid mainnet TON address/checksum')
    return f'{0 if data[1]==0 else -1}:'+data[2:34].hex()

def nano_amount(value):
    if not isinstance(value,str) or not re.fullmatch(r'\d+(?:\.\d{1,9})?',value):raise ValueError('Укажите сумму TON, до 9 знаков после точки.')
    amount=Decimal(value)
    if not Decimal('0.1')<=amount<=Decimal('1000'):raise ValueError('Сумма должна быть от 0.1 до 1000 TON.')
    return str(int(amount*1000000000))

def comment_payload(comment):
    data=b'\0\0\0\0'+comment.encode('utf-8')
    if len(data)>127:raise ValueError('Comment too long')
    cell=bytes((0,len(data)*2))+data
    return base64.b64encode(bytes.fromhex('b5ee9c72')+bytes((1,1,1,1,0,len(cell),0))+cell).decode()

def register_payments(app,settings,store):
    address=settings.ton_deposit_wallet
    if address:
        if not re.fullmatch(r'[A-Za-z0-9_-]{48}',address):raise ValueError('TON_DEPOSIT_WALLET must be a friendly mainnet address (UQ/EQ)')
        raw_address(address)
    with store.connect() as db:
        db.execute('''CREATE TABLE IF NOT EXISTS ton_deposits(id TEXT PRIMARY KEY,user_id INTEGER NOT NULL,address TEXT NOT NULL,nano TEXT NOT NULL,comment TEXT UNIQUE NOT NULL,created INTEGER NOT NULL,expires INTEGER NOT NULL,tx_hash TEXT UNIQUE)''')

    def user():
        body=request.get_json(silent=True)
        if not isinstance(body,dict):raise AuthError('Invalid request')
        return body,verify_init_data(body.get('initData',''),settings.bot_token)['id']

    def balance(uid):
        with store.connect() as db:
            rows=db.execute('SELECT nano FROM ton_deposits WHERE user_id=? AND tx_hash IS NOT NULL',(uid,)).fetchall()
        return str(sum(int(r['nano']) for r in rows))

    @app.get('/api/payments/config')
    def config():
        return jsonify(address=address,network='-239',currency='TON',min_amount='0.1',enabled=bool(address and settings.domain and settings.bot_token),manifest_url='/tonconnect-manifest.json')

    @app.get('/tonconnect-manifest.json')
    def manifest():
        if not settings.domain:return jsonify(error='public_https_domain_required'),503
        return jsonify(url=settings.domain,name='Gift Catalog',iconUrl=settings.domain+'/assets/payment-icon.png')

    @app.post('/api/payments/intents')
    def intent():
        try:
            body,uid=user()
            if not address or not settings.domain:return jsonify(error='payment_not_configured'),503
            nano=nano_amount(body.get('amount'))
        except AuthError:return jsonify(error='telegram_authorization_required'),403
        except (ValueError,TypeError,InvalidOperation) as e:return jsonify(error='invalid_amount',message=str(e)),400
        now=int(time.time());identity=uuid.uuid4().hex;comment='deposit:'+identity;expires=now+1200
        with store.connect() as db:
            pending=db.execute('SELECT COUNT(*) FROM ton_deposits WHERE user_id=? AND tx_hash IS NULL AND expires>?',(uid,now)).fetchone()[0]
            if pending>=10:return jsonify(error='too_many_pending_deposits'),429
            db.execute('INSERT INTO ton_deposits VALUES(?,?,?,?,?,?,?,NULL)',(identity,uid,address,nano,comment,now,expires))
        return jsonify(id=identity,address=address,amount_nano=nano,expires=expires,transaction={'validUntil':now+300,'network':'-239','messages':[{'address':address,'amount':nano,'payload':comment_payload(comment)}]}),201

    @app.post('/api/payments/account')
    def ton_account():
        try:body,uid=user()
        except (AuthError,ValueError,TypeError):return jsonify(error='telegram_authorization_required'),403
        with store.connect() as db:
            pending=db.execute('SELECT id,nano,address,created,expires FROM ton_deposits WHERE user_id=? AND tx_hash IS NULL ORDER BY created DESC LIMIT 50',(uid,)).fetchall()
        return jsonify(balance_nano=balance(uid),currency='TON',pending=[dict(row) for row in pending])

    @app.post('/api/payments/status')
    def payment_status():
        try:body,uid=user()
        except (AuthError,ValueError,TypeError):return jsonify(error='telegram_authorization_required'),403
        identity=body.get('id')
        if not isinstance(identity,str):return jsonify(error='invalid_invoice'),400
        with store.connect() as db:row=db.execute('SELECT * FROM ton_deposits WHERE id=? AND user_id=?',(identity,uid)).fetchone()
        if not row:return jsonify(error='invoice_not_found'),404
        if row['tx_hash']:return jsonify(status='confirmed',balance_nano=balance(uid),currency='TON')
        try:
            headers={'X-API-Key':settings.toncenter_api_key} if settings.toncenter_api_key else {}
            response=requests.get('https://toncenter.com/api/v3/transactions',params={'account':row['address'],'start_utime':row['created']-5,'end_utime':row['expires'],'limit':1000,'sort':'desc'},headers=headers,timeout=(5,12))
            response.raise_for_status();transactions=response.json()['transactions']
            if not isinstance(transactions,list):raise ValueError('Malformed chain response')
            for tx in transactions:
                try:
                    msg=tx.get('in_msg') or {};decoded=(msg.get('message_content') or {}).get('decoded') or {}
                    if tx.get('emulated',False) or tx.get('description',{}).get('aborted') is not False or msg.get('bounced') is not False:continue
                    if decoded.get('type')!='text_comment' or decoded.get('comment')!=row['comment']:continue
                    if raw_address(msg.get('destination'))!=raw_address(row['address']) or int(msg.get('value','0'))!=int(row['nano']):continue
                    if not row['created']-5<=int(tx.get('now',-1))<=row['expires']:continue
                    tx_hash=tx.get('hash','')
                    if not isinstance(tx_hash,str) or not 32<=len(tx_hash)<=100:continue
                    with store.connect() as db:
                        db.execute('UPDATE ton_deposits SET tx_hash=? WHERE id=? AND tx_hash IS NULL',(tx_hash,identity))
                    return jsonify(status='confirmed',balance_nano=balance(uid),currency='TON')
                except (ValueError,TypeError,KeyError,sqlite3.IntegrityError):continue
        except (requests.RequestException,ValueError,KeyError,TypeError):
            return jsonify(status='pending',verification_available=False),202
        return jsonify(status='expired' if time.time()>row['expires']+600 else 'pending',balance_nano=balance(uid),currency='TON')
