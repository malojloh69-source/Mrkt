const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const code=fs.readFileSync('frontend_patch/market-sync.js','utf8');
const gift=(n,overrides={})=>({id:'mrkt-'+n.toString(16).padStart(32,'0'),name:'Gift '+n,number:n,price:1.25,currency:'TON',image:'https://example.com/gift.webp',...overrides});
function fixture(responses){
 const queue=[...responses],requests=[],rendered=[],label={},events={};
 const context={URL,Map,Number,Error,location:{protocol:'https:'},setInterval:()=>{},document:{hidden:false,getElementById:()=>label,addEventListener:(name,fn)=>events[name]=fn},window:{addEventListener:()=>{},__MRKT_APP:{setCatalog:items=>rendered.push(JSON.parse(JSON.stringify(items)))}},fetch:async path=>{requests.push(path);const data=queue.shift();if(data instanceof Error)throw data;return {ok:true,json:async()=>data};}};
 vm.runInNewContext(code,context);
 return {market:context.window.__MRKT_MARKET,requests,rendered,label,events};
}
test('main catalogue loads further pages and deduplicates overlapping listings',async()=>{
 const f=fixture([{items:[gift(1),gift(2)],total:3,next_offset:2,updated_at:100},{items:[gift(2),gift(3)],total:3,next_offset:null,updated_at:100}]);
 await f.market.refresh();await f.market.more();
 assert.equal(f.market.state.items.length,3);assert.equal(f.market.state.next,null);
 assert.deepEqual(f.requests,['/api/catalog?limit=200&offset=0','/api/catalog?limit=200&offset=2']);
 assert.equal(f.rendered.at(-1)[2].currency,'TON');assert.equal(f.rendered.at(-1)[2].read_only,true);
});
test('unconfigured source preserves supplied catalogue; failed refresh preserves last good page',async()=>{
 const f=fixture([{items:[],total:0,next_offset:null},{items:[gift(1)],total:1,next_offset:null,updated_at:100},new Error('offline')]);
 await f.market.refresh();assert.equal(f.rendered.length,0);
 await f.market.refresh();await f.market.refresh();
 assert.equal(f.market.state.items.length,1);assert.equal(f.market.state.stale,true);
});
test('a valid empty source snapshot removes old listings',async()=>{
 const f=fixture([{items:[gift(1)],total:1,next_offset:null,updated_at:100},{items:[],total:0,next_offset:null,updated_at:101}]);
 await f.market.refresh();await f.market.refresh();
 assert.equal(f.rendered.at(-1).length,0);assert.equal(f.market.state.connected,true);
});
test('source validation rejects invalid quotes and strips unsafe media and links',async()=>{
 const f=fixture([{items:[gift(1,{price:Infinity}),gift(2,{image:'https://user:password@example.com/a',url:'javascript:alert(1)'}),gift(3,{currency:'USD'})],total:3,next_offset:null,updated_at:100}]);
 await f.market.refresh();assert.equal(f.market.state.items.length,1);
 assert.equal(f.market.state.items[0].image,null);assert.equal(f.market.state.items[0].url,null);
});
test('pagination failure does not publish a partially refreshed catalogue',async()=>{
 const f=fixture([{items:[gift(1)],total:2,next_offset:1,updated_at:100},{items:[gift(2)],total:2,next_offset:null,updated_at:100},{items:[gift(3)],total:3,next_offset:1,updated_at:101},new Error('page failed')]);
 await f.market.refresh();await f.market.more();await f.market.refresh();
 assert.deepEqual(f.rendered.at(-1).map(g=>g.number),[1,2]);assert.equal(f.market.state.stale,true);
});
