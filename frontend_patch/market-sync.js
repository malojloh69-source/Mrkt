/* Read-only catalogue. This module cannot place orders or access account sessions. */
(() => {
 'use strict';
 const pageSize=200;
 const state={items:[],next:null,total:0,updatedAt:null,connected:false,loading:false,stale:false};
 let pages=1,inflight=false,stopped=false;
 const url=value=>{try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null;}catch{return null;}};
 function item(raw){
  if(!raw||typeof raw!=='object'||typeof raw.id!=='string'||!/^mrkt-[a-f0-9]{32}$/.test(raw.id)||typeof raw.name!=='string'||typeof raw.price!=='number'||!Number.isFinite(raw.price)||raw.price<0||raw.currency!=='TON')return null;
  return {id:raw.id,name:raw.name.slice(0,200),number:raw.number,price:raw.price,currency:'TON',image:url(raw.image),url:/^https:\/\/t\.me\/nft\/[a-zA-Z0-9-]+$/.test(raw.url||'')?raw.url:null,model:raw.model,background:raw.background,symbol:raw.symbol,read_only:true,source:'mrkt'};
 }
 function notify(){
  if(state.connected)window.__MRKT_APP?.setCatalog(state.items);
  const label=document.getElementById('catalog-source-label');
  if(label){label.textContent=state.connected?(state.stale?'Каталог · сохранено':`Каталог · ${state.total.toLocaleString('ru-RU')}`):'Сохранённый каталог';label.title=state.updatedAt?'Обновлено '+new Date(state.updatedAt*1000).toLocaleString('ru-RU'):'';}
 }
 async function read(offset){
  const response=await fetch(`/api/catalog?limit=${pageSize}&offset=${offset}`,{cache:'no-store',headers:{Accept:'application/json'}});
  if(!response.ok)throw Error('catalog_unavailable');
  const data=await response.json();
  if(!Array.isArray(data.items)||!Number.isSafeInteger(data.total)||data.total<0)throw Error('invalid_catalog');
  if(data.next_offset!==null&&(!Number.isSafeInteger(data.next_offset)||data.next_offset<=offset))throw Error('invalid_cursor');
  return data;
 }
 async function refresh(more=false){
  if(inflight||stopped||!/^https?:$/.test(location.protocol))return;
  if(more&&state.next===null)return;
  inflight=true;state.loading=true;
  try{
   let data,rows=more?[...state.items]:[],offset=more?state.next:0;
   const count=more?1:pages;
   for(let page=0;page<count;page++){
    data=await read(offset);rows.push(...data.items.map(item).filter(Boolean));
    if(data.next_offset===null)break;
    offset=data.next_offset;
   }
   // An unconfigured server has no snapshot; keep the supplied reference data.
   if(!Number.isFinite(data.updated_at)&&!data.total)return;
   state.items=[...new Map(rows.map(row=>[row.id,row])).values()];
   state.next=data.next_offset;state.total=data.total;state.updatedAt=data.updated_at||null;state.connected=true;state.stale=false;
   if(more)pages++;
  }catch{state.stale=state.connected;}
  finally{inflight=false;state.loading=false;notify();}
 }
 window.__MRKT_MARKET={state,more:()=>refresh(true),refresh:()=>refresh()};
 document.addEventListener('click',event=>{if(event.target.closest('[data-market-more]')){event.preventDefault();refresh(true);}});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
 window.addEventListener('pagehide',()=>{stopped=true;});
 window.addEventListener('pageshow',()=>{stopped=false;refresh();});
 document.addEventListener('DOMContentLoaded',()=>{notify();refresh();});
 setInterval(()=>{if(!document.hidden)refresh();},15000);
})();
