/* Explicit, browser-local simulation. No payment API, wallet or real funds. */
(function(root,factory){
  const core=factory();
  if(typeof module==='object'&&module.exports){module.exports=core;return;}
  const database='mrkt-demo-commerce-v1',channel=typeof BroadcastChannel==='function'?new BroadcastChannel(database):null;
  let cached=core.initial(),db;
  const listeners=new Set();
  const notify=()=>listeners.forEach(fn=>fn());
  const ready=new Promise((resolve,reject)=>{
    const open=indexedDB.open(database,1);
    open.onupgradeneeded=()=>open.result.createObjectStore('account');
    open.onerror=()=>reject(Error('Не удалось открыть демо-кошелёк в этом браузере.'));
    open.onsuccess=()=>{db=open.result;db.onversionchange=()=>db.close();const tx=db.transaction('account','readwrite'),store=tx.objectStore('account'),get=store.get('state');
      get.onsuccess=()=>{cached=get.result||core.initial();if(!get.result)store.put(cached,'state');};
      tx.oncomplete=()=>{notify();resolve();};tx.onerror=()=>reject(tx.error);
    };
  });
  async function read(){await ready;return new Promise((resolve,reject)=>{const tx=db.transaction('account','readonly'),get=tx.objectStore('account').get('state');get.onsuccess=()=>{cached=get.result||core.initial();notify();resolve();};get.onerror=()=>reject(get.error);});}
  async function change(operation){await ready;return new Promise((resolve,reject)=>{
    const tx=db.transaction('account','readwrite'),store=tx.objectStore('account'),get=store.get('state');let result,error;
    get.onsuccess=()=>{try{result=operation(get.result||core.initial());store.put(result.state,'state');}catch(e){error=e;tx.abort();}};
    tx.oncomplete=()=>{cached=result.state;notify();channel?.postMessage('changed');resolve(result);};
    tx.onabort=()=>reject(error||tx.error||Error('Демо-покупка не сохранена.'));tx.onerror=()=>{};
  });}
  channel?.addEventListener('message',()=>read().catch(()=>{}));
  const collections=new Map((root.__MRKT_GIFT_DATA?.collections||[]).map(c=>[core.nameKey(c.name),c]));
  const observations=new Map((root.__MRKT_SNAPSHOT?.catalog?.items||[]).filter(i=>i.currency==='GRAM'&&i.url).map(i=>[i.url,i]));
  function quote(item){
    if(!item?.id||item.currency==='USD'||item.currency==='TON')return null;
    const collection=collections.get(core.nameKey(item.name)),listing=observations.get(item.url);
    const model=collection?.models.find(m=>m[0]===item.model);
    const choices=[
      [listing?.price,'Цена экземпляра из снимка MRKT',listing?.captured_at],
      [model?.[4],'Флор модели из снимка MRKT',collection?.captured_at],
      [collection?.floor,'Флор коллекции из снимка MRKT',collection?.captured_at],
      [item.bundle||item.demo_product?item.price:null,'Цена из сохранённого примера',item.captured_at]
    ];
    for(const [value,basis,at] of choices){try{const units=core.units(value);if(BigInt(units)>0n)return {units,basis,at:at||null};}catch{}}
    return null;
  }
  function claims(item){
    if(!item)return [];
    if(item.demo_product)return item.demo_consumable?[]:[item.id];
    if(item.bundle)return item.numbers.map((n,i)=>'https://t.me/nft/'+String(item.nftNames[i]||item.nftNames[0]).replace(/[^a-zA-Z0-9]/g,'')+'-'+n);
    return [item.url||item.id];
  }
  function decorate(item){if(!item)return item;const p=quote(item);return {...item,demo:true,demo_owned:claims(item).some(id=>cached.owned[id]),demo_price_basis:p?.basis,demo_price_at:p?.at,price:p?Number(core.format(p.units)):null,currency:item.currency==='USD'||item.currency==='TON'?item.currency:'GRAM'};}
  function line(item){
    const p=quote(item);if(!p)throw Error('Для этого примера нет цены в GRAM.');
    const keys=claims(item),assets=item.bundle?keys.map((key,i)=>({id:`demo-${item.id}-${i}`,name:item.nftNames[i]||item.nftNames[0],number:item.numbers[i],url:key,image:item.thumbs?.[i]||item.image,demo:true,demo_owned:true,currency:'GRAM',read_only:true,exactImage:true})):keys.map(()=>({...item,demo:true,demo_owned:true}));
    return {id:item.id,name:item.name,number:item.number,units:p.units,claims:keys,assets,basis:p.basis,at:p.at};
  }
  root.__MRKT_DEMO={enabled:true,ready,quote,decorate,line,format:core.format,
    balance:()=>core.format(cached.balance),balanceUnits:()=>cached.balance,inventory:()=>Object.values(cached.owned),receipts:()=>cached.receipts,
    owned:item=>claims(item).some(id=>cached.owned[id]),
    purchase:(lines,key)=>change(state=>core.purchase(state,lines,key,new Date().toISOString())),
    grant:()=>change(state=>core.grant(state)),
    reset:()=>change(()=>({state:core.initial()})),
    subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);}
  };
})(typeof window==='object'?window:this,function(){
  'use strict';
  const scale=1000000000n,limit=1000000n*scale;
  function units(value){
    if(typeof value==='number'){if(!Number.isFinite(value)||value<0)throw Error('Некорректная демо-цена.');value=value.toFixed(9).replace(/0+$/,'').replace(/\.$/,'');}
    if(typeof value!=='string'||!/^\d+(?:\.\d{1,9})?$/.test(value))throw Error('Некорректная демо-цена.');
    const [a,b='']=value.split('.'),n=BigInt(a)*scale+BigInt(b.padEnd(9,'0'));
    if(n>limit)throw Error('Демо-цена превышает лимит.');return String(n);
  }
  function format(value){const n=BigInt(value||'0'),fraction=String(n%scale).padStart(9,'0').replace(/0+$/,'');return String(n/scale)+(fraction?'.'+fraction:'');}
  const initial=()=>({schema:1,balance:String(1000n*scale),owned:{},receipts:[]});
  function purchase(before,lines,key,at){
    if(typeof key!=='string'||key.length<8||key.length>100||!Array.isArray(lines)||!lines.length||lines.length>500)throw Error('Некорректная демо-покупка.');
    const ids=new Set(),claims=new Set();let total=0n;
    for(const line of lines){
      if(typeof line.id!=='string'||ids.has(line.id)||!/^\d+$/.test(line.units)||BigInt(line.units)<=0n||BigInt(line.units)>limit||!Array.isArray(line.claims)||!Array.isArray(line.assets)||line.claims.length!==line.assets.length)throw Error('Некорректный состав демо-покупки.');
      ids.add(line.id);total+=BigInt(line.units);
      for(const claim of line.claims){if(typeof claim!=='string'||['__proto__','prototype','constructor'].includes(claim)||claims.has(claim))throw Error('Предмет повторяется в корзине.');claims.add(claim);}
    }
    const fingerprint=JSON.stringify(lines.map(l=>[l.id,l.units,[...l.claims].sort()]).sort((a,b)=>a[0].localeCompare(b[0])));
    const previous=before.receipts.find(r=>r.key===key);
    if(previous){if(previous.fingerprint!==fingerprint)throw Error('Ключ покупки уже использован для другого состава.');return {state:before,receipt:previous,replayed:true};}
    for(const claim of claims)if(before.owned[claim])throw Error('Этот предмет уже есть в демо-хранилище.');
    if(total>BigInt(before.balance))throw Error('Недостаточно виртуальных GRAM. Добавьте тестовые GRAM бесплатно.');
    const state=JSON.parse(JSON.stringify(before));state.balance=String(BigInt(state.balance)-total);
    const receipt={key,fingerprint,at,total:String(total),lines:JSON.parse(JSON.stringify(lines)),balance_after:state.balance,demo:true};
    for(const line of lines)line.claims.forEach((claim,i)=>{state.owned[claim]={...line.assets[i],demo:true,demo_owned:true,demo_receipt:key};});
    state.receipts.push(receipt);return {state,receipt,replayed:false};
  }
  function grant(before){const state=JSON.parse(JSON.stringify(before));state.balance=String(BigInt(state.balance)+1000n*scale);if(BigInt(state.balance)>limit)throw Error('Достигнут лимит виртуального баланса.');return {state};}
  return {units,format,initial,purchase,grant,nameKey:value=>String(value||'').toLowerCase().replace(/[^a-z0-9]/g,'')};
});
