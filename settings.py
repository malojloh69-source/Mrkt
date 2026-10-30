"""Server configuration. No Telegram user sessions or login-code collection."""
import os
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent

def public_url(value):
    value = value.strip().rstrip('/')
    if not value:
        return ''
    if '://' not in value:
        value = 'https://' + value
    parsed = urlsplit(value)
    if parsed.scheme != 'https' or not parsed.hostname or parsed.username or parsed.password or parsed.query or parsed.fragment or parsed.path not in ('', '/'):
        raise ValueError('DOMAIN/PUBLIC_URL must be an HTTPS origin without a path')
    return value

@dataclass(frozen=True)
class Settings:
    bot_token: str = ''
    domain: str = ''
    admin_id: int = 0
    port: int = 3000
    data_dir: Path = ROOT / 'data'
    api_key: str = ''
    sync_interval: int = 60
    max_pages: int = 25

    @classmethod
    def from_env(cls):
        token = next((os.getenv(k, '').strip() for k in ('BOT_TOKEN', 'TELEGRAM_BOT_TOKEN', 'API_TOKEN', 'TOKEN') if os.getenv(k, '').strip()), '')
        data = os.getenv('DATA_DIR', '/app/data' if Path('/app').is_dir() else str(ROOT / 'data'))
        return cls(bot_token=token, domain=public_url(os.getenv('PUBLIC_URL') or os.getenv('DOMAIN', '')),
                   admin_id=int(os.getenv('ADMIN_TELEGRAM_ID') or '0'), port=int(os.getenv('PORT', '3000')),
                   data_dir=Path(data), api_key=os.getenv('SWIFT_API_KEY', '').strip(),
                   sync_interval=max(30, int(os.getenv('SYNC_INTERVAL', '60'))),
                   max_pages=max(1, min(1001, int(os.getenv('SYNC_MAX_PAGES', '25')))))
