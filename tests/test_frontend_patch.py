import tempfile
import unittest
from pathlib import Path
from prepare_site import ensure_site

class FrontendPatchTests(unittest.TestCase):
    def test_reviewed_patch_is_applied_on_initial_and_cached_startup(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);public=root/'public';patch=root/'frontend_patch'
            public.mkdir();patch.mkdir()
            (public/'index.html').write_text('base')
            (patch/'index.html').write_text('updated')
            (patch/'updates.js').write_text('first')
            ensure_site(root)
            self.assertEqual((public/'index.html').read_text(),'updated')
            (patch/'updates.js').write_text('second')
            ensure_site(root)
            self.assertEqual((public/'updates.js').read_text(),'second')

    def test_patch_rejects_symlink_destination(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);public=root/'public';patch=root/'frontend_patch'
            public.mkdir();patch.mkdir();outside=root/'outside';outside.mkdir()
            (public/'index.html').write_text('base')
            (public/'escape').symlink_to(outside,target_is_directory=True)
            (patch/'escape').mkdir();(patch/'escape'/'x.js').write_text('must not escape')
            with self.assertRaises(RuntimeError):ensure_site(root)
            self.assertFalse((outside/'x.js').exists())

if __name__=='__main__':unittest.main()
