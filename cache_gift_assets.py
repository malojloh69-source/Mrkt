"""Optional full download of original model art. No bot or collector is started."""
import argparse
import concurrent.futures
import json
import os
from pathlib import Path
from prepare_site import ensure_site
from settings import ROOT,Settings
from flask import Flask
from gift_catalog import register_catalog

if __name__=='__main__':
    parser=argparse.ArgumentParser(description='Cache public gift model images in DATA_DIR/gift-art')
    parser.add_argument('--all',action='store_true',help='Download all model images (may require several hundred MB)')
    parser.add_argument('--limit',type=int,default=1)
    args=parser.parse_args();public=ensure_site(ROOT)
    data=json.loads((public/'catalog-metadata.json').read_text(encoding='utf-8'))
    jobs=[(c['id'],i) for c in data['collections'] for i in range(len(c['models']))]
    if not args.all:jobs=jobs[:max(0,args.limit)]
    settings=Settings(data_dir=Path(os.getenv('DATA_DIR',str(ROOT/'data'))))
    settings.data_dir.mkdir(parents=True,exist_ok=True)
    app=Flask('gift-art-cache')
    register_catalog(app,settings,None,public)
    def cache(job):
        with app.test_client() as client:return client.get(f'/api/gift-assets/{job[0]}/{job[1]}').status_code==200
    complete=success=0
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        for ok in pool.map(cache,jobs):
            complete+=1;success+=ok
            if complete%25==0 or complete==len(jobs):print(f'{complete}/{len(jobs)} checked; {success} cached',flush=True)
    raise SystemExit(0 if success==len(jobs) else 1)
