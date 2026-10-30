"""Verify identity in this bot's Mini App, without phone numbers, OTPs or sessions."""
import hashlib
import hmac
import json
import time
from urllib.parse import parse_qsl

class AuthError(ValueError):
    pass

def verify_init_data(raw, token, *, now=None, max_age=300):
    if not token or not isinstance(raw,str) or len(raw)>16384:
        raise AuthError('Telegram authorization is unavailable')
    pairs=parse_qsl(raw,keep_blank_values=True,strict_parsing=True)
    if len({key for key,_ in pairs}) != len(pairs):
        raise AuthError('Duplicate fields')
    fields=dict(pairs)
    supplied=fields.pop('hash','')
    check='\n'.join(f'{key}={value}' for key,value in sorted(fields.items()))
    secret=hmac.new(b'WebAppData',token.encode(),hashlib.sha256).digest()
    expected=hmac.new(secret,check.encode(),hashlib.sha256).hexdigest()
    if not hmac.compare_digest(supplied,expected):
        raise AuthError('Invalid Telegram signature')
    try:
        age=(time.time() if now is None else now)-int(fields['auth_date'])
        user=json.loads(fields['user'])
        if not isinstance(user.get('id'),int) or isinstance(user['id'],bool):
            raise ValueError()
    except (KeyError,ValueError,TypeError):
        raise AuthError('Invalid Telegram identity') from None
    if age < -30 or age>max_age:
        raise AuthError('Telegram authorization expired; reopen the admin panel')
    return user
