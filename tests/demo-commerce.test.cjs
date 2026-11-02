const test=require('node:test');
const assert=require('node:assert/strict');
const demo=require('../frontend_patch/demo-commerce.js');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const nft=(id,price='0.1',claim=id)=>({id,name:id,units:demo.units(price),claims:[claim],assets:[{id,name:id,demo:true}]});

test('fractional GRAM are charged exactly and the input state remains unchanged',()=>{
  const before=demo.initial();before.balance=demo.units('0.3');
  const after=demo.purchase(before,[nft('a','0.1'),nft('b','0.2')],'request-1','2026-11-02');
  assert.equal(after.state.balance,'0');assert.equal(before.balance,demo.units('0.3'));
  assert.deepEqual(Object.keys(after.state.owned),['a','b']);assert.equal(after.receipt.total,demo.units('0.3'));
});
test('repeated confirmation cannot debit the same order twice',()=>{
  const lines=[nft('a','12.34')],one=demo.purchase(demo.initial(),lines,'request-2','2026-11-02');
  const two=demo.purchase(one.state,lines,'request-2','2026-11-02');
  assert.equal(two.replayed,true);assert.equal(two.state.balance,one.state.balance);assert.equal(two.state.receipts.length,1);
  assert.throws(()=>demo.purchase(one.state,[nft('b')],'request-2','2026-11-02'),/другого состава/);
});
test('an insufficient cart has no partial debit or inventory writes',()=>{
  const before=demo.initial();before.balance=demo.units('1');const copy=JSON.stringify(before);
  assert.throws(()=>demo.purchase(before,[nft('a','0.5'),nft('b','2')],'request-3','2026-11-02'),/Недостаточно/);
  assert.equal(JSON.stringify(before),copy);
});
test('NFT overlap between a bundle and a separate card is rejected',()=>{
  assert.throws(()=>demo.purchase(demo.initial(),[nft('bundle','5','nft/1'),nft('card','1','nft/1')],'request-4','2026-11-02'),/повторяется/);
  const first=demo.purchase(demo.initial(),[nft('a','1','nft/1')],'request-5','2026-11-02');
  assert.throws(()=>demo.purchase(first.state,[nft('b','1','nft/1')],'request-6','2026-11-02'),/демо-хранилище/);
});
test('purchases survive a storage round trip; only virtual credits are granted',()=>{
  const bought=demo.purchase(demo.initial(),[nft('a','4.08')],'request-7','2026-11-02');
  const stored=JSON.parse(JSON.stringify(bought.state));assert.equal(demo.format(stored.balance),'995.92');assert.equal(stored.owned.a.demo,true);
  assert.equal(demo.format(demo.grant(stored).state.balance),'1995.92');assert.equal(demo.format(demo.initial().balance),'1000');
});
test('negative, malformed, zero and out-of-range prices cannot be purchased',()=>{
  for(const value of ['-1','NaN','Infinity','1e3','0.0000000001',null])assert.throws(()=>demo.units(value));
  for(const value of ['0','-1','999999999999999999999999'])assert.throws(()=>demo.purchase(demo.initial(),[{...nft('a'),units:value}],'request-8','2026-11-02'));
});
test('all 500 Bank references get explicit demo quotes without mutating their source prices',()=>{
  const sandbox={window:{},indexedDB:{open:()=>({})}};vm.createContext(sandbox);
  for(const file of ['gift-data.js','catalog-current.js','bank-current.js','demo-commerce.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../frontend_patch',file),'utf8'),sandbox);
  const D=sandbox.window.__MRKT_DEMO,items=sandbox.window.__MRKT_BANK_CATALOG.items;
  assert.equal(items.length,500);
  for(const item of items){const quote=D.quote(item);assert.ok(quote&&BigInt(quote.units)>0n,item.url);assert.equal(item.price,null);assert.equal(item.listing_confirmed,false);assert.equal(D.decorate(item).demo,true);}
  assert.equal(D.quote({...items[0],currency:'TON',price:100}),null,'TON must never be silently treated as GRAM');
});
