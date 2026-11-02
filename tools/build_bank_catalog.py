"""Build a bounded, read-only catalogue from observed public MRKT Bank NFT links."""
import argparse
import hashlib
import json
from pathlib import Path
import re


def build(source, root, limit=500, allow_partial=False):
    rows = source['items']
    assert 1 <= limit <= 500, 'At most 500 NFT are requested'
    assert allow_partial or len(rows) >= limit, 'Not enough observed NFT for the requested selection'
    rows = rows[:limit]
    assert len({row['url'] for row in rows}) == len(rows), 'Duplicate NFT links'
    assert allow_partial or all(row.get('animation_url') for row in rows), 'Every selected NFT needs its original animation link'
    gift_source=(root/'frontend_patch/gift-data.js').read_text(encoding='utf-8')
    gifts=json.loads(gift_source.split('=',1)[1].strip().rstrip(';'))
    name_key=lambda value:re.sub('[^a-z0-9]','',value.lower())
    collections={name_key(c['name']):c for c in gifts['collections']}
    items=[]
    public_rows=[]
    fields=('name','number','url','observed_at','animation_url','animation_format',
            'animation_refresh_from','preview_url','resolved_at','model','background','symbol',
            'model_rarity','model_rarity_label','background_rarity','symbol_rarity','owner_at_resolution','error',
            'animation_source_nft','animation_match','animation_source','animation_source_index',
            'animation_json_sha256','animation_json_bytes','animation_frame_rate','animation_frames',
            'animation_validated_at')
    for row in rows:
        match=re.fullmatch(r'https://t\.me/nft/([A-Za-z0-9]+)-(\d+)',row['url'])
        assert match and int(match[2])==row['number'], 'Invalid NFT link or serial'
        public_rows.append({**{key:row[key] for key in fields if key in row},
                            'animation_refresh_from':row['url'],
                            'animation_endpoint':'/api/bank-nfts/'+match[1]+'-'+match[2]+'/animation'})
        collection=collections.get(name_key(row['name']),{})
        model=next((m for m in collection.get('models',[]) if m[0]==row.get('model')),None)
        image=row.get('preview_url') or (model[2] if model else collection.get('image',''))
        item=dict(id='bank-'+hashlib.md5(row['url'].encode()).hexdigest(),name=row['name'],
                  number=row['number'],url=row['url'],image=image,price=None,currency='GRAM',
                  quote_currency='GRAM',listing_confirmed=False,read_only=True,exactImage=True,
                  model_preview=not bool(row.get('preview_url')),
                  source='mrktbank_public_gallery',owner='MRKT Bank',captured_at=row['observed_at'])
        for key in ('animation_url','model','background','symbol'):
            if row.get(key):item[key]=row[key]
        for key,target in [('model_rarity','modelRarity'),('background_rarity','backgroundRarity'),('symbol_rarity','symbolRarity')]:
            if key in row:item[target]=row[key]
        items.append(item)
    manifest=dict(schema_version=1,source_profile='https://t.me/mrktbank',selection_limit=limit,
                  selection_complete=len(rows)==limit,profile_inventory_complete=False,
                  captured_at=source.get('captured_at'),items=public_rows,
                  animation_url_lifetime='Refresh public CDN links from each permanent NFT page.')
    target=root/'frontend_patch'
    (target/'mrktbank-nfts.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    (target/'mrktbank-links.txt').write_text('\n'.join(row['url'] for row in rows)+'\n',encoding='utf-8')
    (target/'mrktbank-animation-links.txt').write_text('\n'.join(row['animation_url'] for row in rows if row.get('animation_url'))+'\n',encoding='utf-8')
    (target/'bank-current.js').write_text('/* Public MRKT Bank NFT references. Selection limit: 500. */\nwindow.__MRKT_BANK_CATALOG='+json.dumps({**{k:v for k,v in manifest.items() if k!='items'},'items':items},ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
    return manifest


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input',type=Path,required=True)
    parser.add_argument('--root',type=Path,default=Path(__file__).resolve().parents[1])
    parser.add_argument('--limit',type=int,default=500)
    parser.add_argument('--allow-partial',action='store_true',help='Local QA only; selection_complete remains false')
    args=parser.parse_args()
    manifest=build(json.loads(args.input.read_text(encoding='utf-8')),args.root,args.limit,args.allow_partial)
    print(json.dumps({'selected':len(manifest['items']),'selection_complete':manifest['selection_complete'],
                      'animations':sum(bool(row.get('animation_url')) for row in manifest['items'])}))
