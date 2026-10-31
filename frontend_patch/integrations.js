/* Application integrations. No MRKT session, seed phrase or private key is used. */
(() => {
 'use strict';
 const ui=()=>window.__MRKT_APP;
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const links={
  'канал mrkt':'https://t.me/official_mrkt','mrkt на x':'https://x.com/official_mrkt',
  'буст канала':'https://t.me/boost/official_mrkt','peek.tg':'https://peek.tg/',
  'игровой канал':'https://t.me/+XJOmctihaqszNjBi','канал с продажами подарков':'https://t.me/mrktnotification',
  'канал pulse events':'https://t.me/mrkt_pulse','канал с продажами каналов':'https://t.me/mrkt_channels_notify',
  'канал с продажами коллекций подарков':'https://t.me/mrkt_collections_notify','поддержка':'https://t.me/mrkt_help_service',
  'платформа mrkt':'https://mrkt.land/','mini app mrkt':'https://t.me/mrkt','бот peek.tg':'https://t.me/peektgbot'
 };
 const normalize=v=>v.replace(/\s+/g,' ').trim().toLowerCase();
 const open=url=>{if(url.startsWith('https://t.me/')&&window.Telegram?.WebApp?.openTelegramLink)window.Telegram.WebApp.openTelegramLink(url);else if(window.Telegram?.WebApp?.openLink)window.Telegram.WebApp.openLink(url);else window.open(url,'_blank','noopener,noreferrer');};
 const docs=new WeakSet(),frames=new WeakSet();
 function apply(doc){
  if(!doc?.body)return;
  for(const el of doc.querySelectorAll('button,a,[data-source-link]')){const url=links[normalize(el.textContent)];if(url){el.dataset.ecosystemUrl=url;if(el.tagName==='A'){el.href=url;el.rel='noopener noreferrer';el.target='_blank';}}}
  for(const root of doc.querySelectorAll('[role="dialog"]'))if(root.textContent.includes('СООБЩЕСТВО')&&!root.querySelector('.ecosystem-extra')){
   const extra=doc.createElement('div');extra.className='ecosystem-extra';extra.style.cssText='padding:12px 16px;display:grid;gap:12px;color:#e5e5ea';
   for(const [title,url] of [['Платформа MRKT','https://mrkt.land/'],['Mini App MRKT','https://t.me/mrkt'],['Бот Peek.tg','https://t.me/peektgbot']]){const a=doc.createElement('a');a.textContent=title;a.href=url;a.dataset.ecosystemUrl=url;a.style.color='inherit';extra.append(a);}const prices=doc.createElement('a');prices.textContent='Цены NFT';prices.href='#';prices.dataset.nftQuotes='';prices.style.color='inherit';extra.append(prices);root.append(extra);
  }
  if(docs.has(doc))return;docs.add(doc);
  doc.addEventListener('click',e=>{if(e.target.closest?.('[data-nft-quotes]')){e.preventDefault();e.stopImmediatePropagation();showQuotes();return;}const node=e.target.closest?.('[data-ecosystem-url]');if(!node)return;e.preventDefault();e.stopImmediatePropagation();open(node.dataset.ecosystemUrl);},true);
 }
 function inspect(){apply(document);for(const f of document.querySelectorAll('iframe')){if(!frames.has(f)){frames.add(f);f.addEventListener('load',()=>{try{apply(f.contentDocument);}catch{}});}try{apply(f.contentDocument);}catch{}}
  for(const detail of document.querySelectorAll('.nft-detail-view'))if(!detail.querySelector('[data-nft-quotes]')){const b=document.createElement('button');b.className='secondary';b.dataset.nftQuotes='';b.textContent='Цены по фонам и быстрая продажа';detail.append(b);}
 }
 new MutationObserver(inspect).observe(document.body,{subtree:true,childList:true});inspect();
 document.addEventListener('click',e=>{if(e.target.closest('[data-cs2-refresh]')){e.preventDefault();ui().render();}if(e.target.closest('[data-nft-quotes]'))showQuotes();if(e.target.closest('[data-ton-check]'))checkPayment(document.getElementById('funding-error'));});
 const initData=()=>window.Telegram?.WebApp?.initData||'';
 async function post(path,body){const r=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...body,initData:initData()}),signal:AbortSignal.timeout(18000)});const data=await r.json();if(!r.ok)throw Error(data.message||({'telegram_authorization_required':'Откройте приложение через своего Telegram-бота.','payment_not_configured':'Укажите HTTPS-домен приложения.'}[data.error]||'Сервис временно недоступен.'));return data;}
 let configPromise,ton,invoice,checking=false;
 async function config(){return configPromise??=fetch('/api/payments/config',{signal:AbortSignal.timeout(8000)}).then(r=>{if(!r.ok)throw Error('Настройки пополнения недоступны.');return r.json();}).catch(e=>{configPromise=null;throw e;});}
 async function wallet(){if(ton)return ton;await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='vendor/tonconnect-ui.min.js';s.onload=resolve;s.onerror=()=>reject(Error('Не удалось загрузить TON Connect.'));document.head.append(s);});ton=new window.TON_CONNECT_UI.TonConnectUI({manifestUrl:new URL('/tonconnect-manifest.json',location.origin).href});await ton.connectionRestored;return ton;}
 function formatNano(v){const s=String(v||'0').padStart(10,'0'),fraction=s.slice(-9).replace(/0+$/,'');return s.slice(0,-9)+(fraction?'.'+fraction:'');}
 async function checkPayment(output){if(!invoice||checking||!output)return;checking=true;try{const status=await post('/api/payments/status',{id:invoice.id});if(status.status==='confirmed'){output.textContent='Зачислено на баланс этого приложения. Баланс: '+formatNano(status.balance_nano)+' TON.';invoice=null;const submit=document.querySelector(".funds-submit");if(submit)submit.textContent="Пополнить баланс";const balance=document.querySelector(".ton-receipts p");if(balance)balance.textContent="Баланс TON: "+formatNano(status.balance_nano);}else output.textContent=status.status==='expired'?'Срок счёта истёк. Если перевод отправлен позже, обратитесь в поддержку этого приложения.':'Подтверждение сети ещё не получено. Повторите проверку позже.';}catch(e){output.textContent=e.message;}finally{checking=false;}}
 window.__MRKT_TON={
  decorate(sheet){const note=document.createElement('p');note.className='ton-recipient';note.textContent='Получение настроек TON…';sheet.querySelector('form').insertBefore(note,sheet.querySelector('.funds-submit'));configPromise=null;config().then(c=>{if(note.isConnected)note.textContent='Пополнение баланса этого приложения в TON. Получатель: '+c.address;}).catch(e=>{note.textContent=e.message;});if(initData())post('/api/payments/account',{}).then(account=>{if(!note.isConnected)return;const list=document.createElement('div');list.className='ton-receipts';const balance=document.createElement('p');balance.textContent='Баланс TON: '+formatNano(account.balance_nano);list.append(balance);for(const row of account.pending){const b=document.createElement('button');b.type='button';b.className='secondary';b.textContent='Проверить счёт '+formatNano(row.nano)+' TON · '+new Date(row.created*1000).toLocaleString('ru-RU');b.addEventListener('click',()=>{invoice={id:row.id};checkPayment(document.getElementById('funding-error'));});list.append(b);}note.after(list);}).catch(()=>{});},
  async deposit(amount,output){
   try{if(invoice){await checkPayment(output);return;}configPromise=null;const c=await config();if(!c.enabled)throw Error('Пополнение пока недоступно. Обратитесь в поддержку приложения.');
    amount=amount.trim().replace(',','.');if(!/^\d+(?:\.\d{1,9})?$/.test(amount))throw Error('Укажите сумму TON.');
    const w=await wallet();if(!w.wallet){await w.openModal();output.textContent='Подключите кошелёк. Затем снова нажмите «Пополнить баланс».';return;}
    const button=document.querySelector('.funds-submit');button.disabled=true;
    try{invoice=await post('/api/payments/intents',{amount});if(!output.closest('dialog')?.open){invoice=null;return;}if(invoice.address!==c.address){invoice=null;throw Error('Адрес получателя изменился. Откройте пополнение заново и проверьте адрес.');}output.textContent='Подтвердите '+amount+' TON в кошельке. Получатель: '+invoice.address;
     await w.sendTransaction(invoice.transaction);output.textContent='Запрос отправлен в кошелёк. Подтверждение сети проверяется отдельно.';
    }catch(e){output.textContent=invoice?'Подтверждение не получено. Сначала проверьте статус, чтобы не отправить повторный перевод.':e.message;}
    finally{button.disabled=false;button.textContent=invoice?'Проверить зачисление':'Пополнить баланс';}
   }catch(e){output.textContent=e.message;}
  }
 };
 function showQuotes(){
  const collections=window.__MRKT_GIFT_DATA?.collections||[];
  ui().showSheet('Цены NFT',`<form id="quote-form"><label>Коллекция<select name="collection">${collections.map(c=>`<option>${esc(c.name)}</option>`).join('')}</select></label><label>Фон<input name="background" placeholder="Любой фон" list="quote-backdrops"></label><datalist id="quote-backdrops">${Object.keys(window.__MRKT_GIFT_DATA?.backdrops||{}).map(n=>`<option value="${esc(n)}">`).join('')}</datalist><button class="primary">Посмотреть цены</button></form><div id="quote-result" role="status"></div>`);
  const form=document.getElementById('quote-form');form.addEventListener('submit',async e=>{e.preventDefault();const out=document.getElementById('quote-result');out.textContent='Получение цен…';try{const query=new URLSearchParams(new FormData(form));const r=await fetch('/api/market/quote?'+query,{signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error();const d=await r.json();out.textContent='';for(const row of d.quotes){const p=document.createElement('p');p.textContent=`${row.source==='live_catalog'?'Каталог сервера':'Снимок MRKT'}: продажа ${row.listing_floor??'нет данных'} ${row.currency}; быстрая продажа ${row.quick_sell??'нет данных'} ${row.currency}${row.captured_at?' · '+new Date(row.captured_at).toLocaleString('ru-RU'):''}`;out.append(p);}if(!d.quotes.length)out.textContent='Подтверждённых цен для выбранного фона пока нет. Выберите другой фон или подключите источник каталога.';}catch{out.textContent='Цены временно недоступны. Попробуйте снова.';}});
 }
 window.__MRKT_PRICE_VIEW=showQuotes;
})();
