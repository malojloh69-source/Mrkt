import hashlib
import json
import shutil
import tempfile
import unittest
import zipfile
from pathlib import Path
from prepare_site import ensure_site
from prepare_frontend import pack

class BundleTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name)
    def tearDown(self):self.tmp.cleanup()

    def test_pack_restore_and_cache(self):
        public=self.root/'public';public.mkdir();(public/'index.html').write_text('<h1>Saved UI</h1>');(public/'art.webp').write_bytes(b'asset')
        meta=pack(self.root,part_size=100);self.assertGreater(len(meta['parts']),1)
        shutil.rmtree(public);self.assertEqual(ensure_site(self.root),public)
        self.assertEqual((public/'index.html').read_text(),'<h1>Saved UI</h1>');self.assertEqual((public/'art.webp').read_bytes(),b'asset')
        modified=(public/'index.html').stat().st_mtime_ns;ensure_site(self.root)
        self.assertEqual((public/'index.html').stat().st_mtime_ns,modified)

    def test_corrupt_part_is_rejected(self):
        public=self.root/'public';public.mkdir();(public/'index.html').write_text('UI');meta=pack(self.root)
        shutil.rmtree(public);(self.root/'site_bundle'/meta['parts'][0]['name']).write_bytes(b'bad')
        with self.assertRaisesRegex(RuntimeError,'checksum'):ensure_site(self.root)
        self.assertFalse(public.exists())

    def test_traversal_archive_is_rejected(self):
        bundle=self.root/'site_bundle';bundle.mkdir();zip_path=self.root/'bad.zip'
        with zipfile.ZipFile(zip_path,'w') as z:z.writestr('../escaped','no')
        data=zip_path.read_bytes();digest=hashlib.sha256(data).hexdigest();(bundle/'site-000.part').write_bytes(data)
        (bundle/'manifest.json').write_text(json.dumps({'sha256':digest,'size':len(data),'parts':[{'name':'site-000.part','sha256':digest}]}))
        with self.assertRaises(RuntimeError):ensure_site(self.root)
        self.assertFalse((self.root/'escaped').exists())

if __name__=='__main__':unittest.main()
