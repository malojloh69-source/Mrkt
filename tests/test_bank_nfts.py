import gzip
import json
from pathlib import Path
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import patch

from flask import Flask
from bank_nfts import animation_url, download_animation, register_bank_nfts
from tools.resolve_nft_links import GiftPage, resolve


class Response:
    status_code=200
    def __init__(self,data):self.data=data
    def __enter__(self):return self
    def __exit__(self,*args):pass
    def iter_content(self,size):yield self.data


class BankNFTTests(unittest.TestCase):
    def test_only_original_tgs_cdn_is_accepted(self):
        self.assertTrue(animation_url('https://cdn4.telesco.pe/file/sticker.tgs?token=public-cdn-signature'))
        self.assertTrue(animation_url('https://cdn.changes.tg/gifts/models/Myth%20Mask/Azure%20Oracle.tgs'))
        for value in ['http://cdn4.telesco.pe/file/sticker.tgs','https://cdn4.telesco.pe.evil.test/file/sticker.tgs',
                      'https://cdn4.telesco.pe@localhost/file/sticker.tgs','https://cdn4.telesco.pe:999/file/sticker.tgs',
                      'https://cdn4.telesco.pe/file/other.tgs','https://cdn.changes.tg/gifts/models/../other.tgs',
                      'https://cdn.changes.tg/gifts/models/Myth%20Mask/Other.tgs?redirect=1']:
            self.assertFalse(animation_url(value),value)

    def test_tgs_is_decoded_and_external_assets_are_rejected(self):
        data={'layers':[],'fr':60,'ip':0,'op':180,'w':512,'h':512}
        url='https://cdn4.telesco.pe/file/sticker.tgs?token=test'
        with patch('bank_nfts.requests.get',return_value=Response(gzip.compress(json.dumps(data).encode()))) as request:
            self.assertEqual(json.loads(download_animation(url)),data)
            self.assertFalse(request.call_args.kwargs['allow_redirects'])
        data['assets']=[{'p':'https://other.test/file.png'}]
        with patch('bank_nfts.requests.get',return_value=Response(gzip.compress(json.dumps(data).encode()))):
            with self.assertRaises(ValueError):download_animation(url)

    def test_unknown_nft_cannot_trigger_network_and_known_animation_is_cached(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);public=root/'public';public.mkdir()
            (public/'mrktbank-nfts.json').write_text(json.dumps({'items':[{'url':'https://t.me/nft/SleighBell-12557','animation_url':'https://cdn4.telesco.pe/file/sticker.tgs?token=test'}]}))
            app=Flask(__name__);register_bank_nfts(app,SimpleNamespace(data_dir=root/'data'),public)
            client=app.test_client()
            with patch('bank_nfts.download_animation',return_value=b'{"layers":[],"fr":60}') as download:
                self.assertEqual(client.get('/api/bank-nfts/Unknown-1/animation').status_code,404)
                download.assert_not_called()
                first=client.get('/api/bank-nfts/SleighBell-12557/animation')
                self.assertEqual(first.status_code,200)
                self.assertEqual(first.json['fr'],60)
                first.close()
                second=client.get('/api/bank-nfts/SleighBell-12557/animation')
                self.assertEqual(second.status_code,200);second.close()
                download.assert_called_once()

    def test_public_gift_metadata_preserves_escaped_link_and_rarity(self):
        page=GiftPage()
        page.feed('<meta property="og:title" content="Sleigh Bell #12557"><source type="application/x-tgsticker" srcset="https://cdn4.telesco.pe/file/sticker.tgs?token=a&amp;b=c"><table class="table tgme_gift_table"><tr><th>Model</th><td>Tinker Bell <mark>1%</mark></td></tr></table>')
        self.assertEqual(page.animation,'https://cdn4.telesco.pe/file/sticker.tgs?token=a&b=c')
        self.assertEqual(page.attributes['Model'],'Tinker Bell 1%')
        with patch('tools.resolve_nft_links.requests.get') as request:
            self.assertEqual(resolve({'url':'https://other.test/nft/SleighBell-12557'})['error'],'invalid_nft_url')
            request.assert_not_called()


if __name__=='__main__':unittest.main()
