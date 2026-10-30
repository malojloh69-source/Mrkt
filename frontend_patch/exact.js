/* Offline navigation over sanitized, observed MRKT interface markup. */
(() => {
  'use strict';
  const screens=window.__MRKT_EXACT_SCREENS||[];
  const byRoute=new Map(screens.map(s=>[s.route,s]));
  const aliases={'/halloween/fright-fight':'/play-hub/fight-club','/halloween/grave-game':'/play-hub/squid-game','/profile/gram':'/profile','/profile/gram/locked':'/profile','/event/staking':'/staking','/my-gifts':'/storage','/my-gifts/unlisted':'/storage/unlisted','/gifts':'/storage','/social-tasks':'/tasks','/social-tasks/leaderboard':'/tasks/leaderboard'};
  const groups=new Map();
  const openers=new Map();
  const scrollPositions=new Map();
  let previousRoute='';
  let returning=false;
  let pendingFrame=null;
  const normalized=route=>aliases[route]||route;
  function contextFor(route){
    const r=normalized(route);
    if(r.startsWith('/orders/skins'))return '/orders/skins';
    if(r.startsWith('/orders'))return '/orders';
    for(const category of ['skins','bundles','channels'])if(r.startsWith('/storage/'+category))return '/storage/'+category;
    return '/storage';
  }
  function resolveScreen(key){
    if(key==='/profile'||key.startsWith('/play-hub')||/^\/(storage|orders|profile)\/skins(?:\/|$)/.test(key))return null;
    if(byRoute.has(key))return byRoute.get(key);
    if(/^\/(?:storage|orders)(?:\/(?:skins|bundles|channels))?\/(?:filters|sort|filter\/nft)$/.test(key)){
      const template=key.endsWith('/sort')?'/storage/sort':key.endsWith('/filter/nft')?'/storage/filter/nft':'/storage/filters';
      const source=byRoute.get(template), base=byRoute.get(contextFor(key));
      if(!source||!base)return null;
      const d=new DOMParser().parseFromString(source.html,'text/html');
      const b=new DOMParser().parseFromString(base.html,'text/html');
      d.getElementById('root')?.replaceWith(b.getElementById('root'));
      return {...source,html:d.body.innerHTML};
    }
    return null;
  }
  window.__MRKT_IS_CAPTURED=route=>Boolean(resolveScreen(normalized(route)));
  function createFrame(){
    const element=document.createElement('iframe');element.title='MRKT';
    element.setAttribute('sandbox','allow-scripts allow-same-origin');
    element.style.cssText='position:fixed;inset:0;width:100%;height:100%;border:0;background:#171718;z-index:5000;display:none;color-scheme:dark';
    return element;
  }
  let frame=createFrame();frame.id='exact-interface';document.body.append(frame);
  const routeKey=()=>normalized((location.hash.slice(1)||'/').split('?')[0]);
  function scrollKey(route){
    if(/\/(?:filters|sort|filter\/nft)$/.test(route))return contextFor(route);
    if(route==='/orders/create/collection')return '/orders/create';
    if(route.startsWith('/staking/'))return '/staking';
    return route;
  }
  function rememberScroll(){
    if(frame.dataset.ready!=='true'||frame.style.display==='none')return;
    try{scrollPositions.set(scrollKey(frame.dataset.route),frame.contentWindow.scrollY);}catch{}
  }
  function commitFrame(next){
    if(next!==pendingFrame||next.dataset.route!==routeKey())return;
    const motionBefore=window.__MRKT_MOTION.captureCurrent();
    const old=frame;
    frame=next;pendingFrame=null;old.removeAttribute('id');frame.id='exact-interface';
    document.body.classList.add('exact-active','interface-ready');
    document.querySelector('#app').inert=true;
    frame.style.visibility='visible';frame.style.pointerEvents='';frame.dataset.ready='true';
    frame.contentWindow.scrollTo({top:scrollPositions.get(scrollKey(frame.dataset.route))||0,behavior:'instant'});
    window.__MRKT_UPDATE_NAV?.(frame.dataset.route,Boolean(frame.contentDocument.querySelector('[role=dialog]')));
    window.__MRKT_MOTION.enter(frame.contentDocument,motionBefore);
    old.remove();
    window.__MRKT_UPDATES?.applyIdentity(frame.contentDocument);
    frame.contentWindow.postMessage({mrktActivate:true},'*');
  }
  const go=route=>{if(!/^\/[a-z0-9/-]*$/.test(route))return;if(normalized(location.hash.slice(1)||'/')===normalized(route))return;location.hash=route;};
  const bridge=String.raw`(() => {
    const send=(type,value)=>parent.postMessage({mrktOffline:true,type,value,route:current},'*');
    const current=__CURRENT__;
    const nav={'Маркет':'/','Ордеры':'/orders','Игровой хаб':'/play-hub','Halloween':'/halloween','Хранилище':'/my-gifts'};
    const text=e=>(e?.textContent||'').replace(/\s+/g,' ').trim();
    const go=route=>send('navigate',route);
    const note=message=>send('notice',message);
    const close=()=>send('back');
    const closestClass=(el,prefix)=>el.closest('[class*="'+prefix+'"]');
    document.addEventListener('submit',e=>{e.preventDefault();note('Форма доступна для просмотра в локальной копии.');});
    document.addEventListener('click',e=>{
      const target=e.target instanceof Element?e.target:e.target.parentElement;
      const tab=target.closest('[class*="_tab_14fxt_"]');
      if(tab){const label=tab.querySelector('[data-label]')?.getAttribute('data-label');if(nav[label]){e.preventDefault();go(nav[label]);return;}}
      if(closestClass(target,'_balance_1k6lb_')){send('funding','deposit');return;}
      const points=closestClass(target,'_mrktCard_');
      if(points&&text(points).includes('MRKT Points')){go('/profile/points');return;}
      if(current==='/tasks'&&(closestClass(target,'_card_sxdeq_')||closestClass(target,'_hint_1qpno_'))){go('/tasks/leaderboard');return;}
      const orderRow=closestClass(target,'_orderItem_17j94_');
      if(current==='/orders'&&orderRow){if(text(orderRow).startsWith('Plush Pepe'))go('/orders/collection/plush-pepe');else note('Подробности этого ордера не сохранены в локальном снимке.');return;}
      if(current==='/orders/create'&&(target.matches('input[placeholder="Выбрать"]')||target.closest('[class*="_input_rjyph_"]')?.querySelector('input[placeholder="Выбрать"]'))){go('/orders/create/collection');return;}
      const button=target.closest('button,[role="tab"],a,[data-source-link]');
      if(!button)return;
      e.preventDefault();
      const t=text(button), cls=String(button.className);
      if(button.matches('[class*="_avatar_"]')){go('/profile');return;}
      if(button.getAttribute('aria-label')==='Close'||button.closest('#tc-widget-root')&&button.querySelector('svg')&&!t){close();return;}
      if(current==='/wallet-connect'||button.closest('#tc-widget-root')){note('Подключение кошелька недоступно в локальной копии.');return;}
      if(cls.includes('_iconButton_1k6lb_')){
        const all=[...document.querySelectorAll('button[class*="_iconButton_1k6lb_"]')];
        const index=all.indexOf(button);if(index===2){note('Канал MRKT открывается в Telegram.');return;}go(['/halloween','/staking','','/menu'][index]||'/menu');return;
      }
      if(t==='Gifts'){go('/profile');return;}
      if(t==='CS2-скины'&&current.startsWith('/profile')){go('/profile/skins');return;}
      if(t==='Баланс GRAM'||cls.includes('_gramCard_')){send('funding','deposit');return;}
      if(t==='Вывод'||t==='Ввод'){send('funding',t==='Вывод'?'withdraw':'deposit');return;}
      if(t==='Добавить'){note('Добавление подарков выполняется через MRKT Bank в Telegram.');return;}
      if(t.includes('БЕСПЛАТНЫЙ ВЫВОД')){go('/free-gift-withdrawals');return;}
      if(/^Ордера\d*$/.test(t)){go('/orders/my');return;}
      if(/^Офферы\d*$/.test(t)){go('/profile/offers');return;}
      if(current==='/profile/offers'&&t==='Выставить на продажу'){go('/storage');return;}
      if(current.startsWith('/profile/points')){if(t==='История')go('/profile/points');else if(t==='Сгорающие points')go('/profile/points/expiring');else note('Раздел открыт в локальном режиме.');return;}
      if(current.startsWith('/profile/gram')){if(t==='История')go('/profile/gram');else if(t==='Заблокированные GRAM')go('/profile/gram/locked');return;}
      if(current.startsWith('/menu')){if(t==='Официальные каналы'){go(current==='/menu/channels'?'/menu':'/menu/channels');return;}note('Этот пункт открывается в Telegram.');return;}
      if(current==='/halloween'){
        if(/^Fright Fight/i.test(t))go('/play-hub/fight-club');
        else if(/^Grave Game/i.test(t))go('/play-hub/squid-game');
        else if(/^Trick or Trade/i.test(t))go('/halloween/trade');
        else if(/^Staking/i.test(t))go('/staking');
        else if(/^Lucky buy/i.test(t))go('/lucky-buy');
        else go('/');return;
      }
      if(current.startsWith('/halloween/trade')){if(t==='Правила')go('/halloween/trade/rules');else if(t==='Продолжить')go('/halloween/trade');else if(t==='Продать')go('/storage');else if(t==='Купить')go('/');else if(t==='Загрузить')note('Загрузка подарков выполняется через MRKT Bank в Telegram.');return;}
      if(current.startsWith('/staking')){if(t==='Подробнее')go('/staking/info');else if(t==='Внести')go('/staking/deposit');else if(t==='Отмена'||t==='Продолжить')go('/staking');else if(t==='Добавить подарки')note('Стейкинг требует подключения собственного сервиса.');return;}
      if(current==='/free-gift-withdrawals'){if(t==='Добавить подарок')note('Добавление подарков выполняется через MRKT Bank в Telegram.');return;}
      if(current.startsWith('/storage')){
        const category=button.matches('[role="tab"]')&&closestClass(button,'_tabItem_1ybf0_');
        if(category){const cats=[...document.querySelectorAll('[role="tab"][class*="_tabItem_1ybf0_"]')];go(['/storage','/storage/skins','/storage/bundles','/storage/channels'][cats.indexOf(button)]||'/storage');return;}
        const base=current.startsWith('/storage/skins')?'/storage/skins':current.startsWith('/storage/bundles')?'/storage/bundles':current.startsWith('/storage/channels')?'/storage/channels':'/storage';
        if(/^На продаже/.test(t)){go(base);return;}
        if(/^Хранилище/.test(t)){go(base+'/unlisted');return;}
        if(t==='Ожидание'){go(base+'/pending');return;}
        if(t==='Передача'){go(base+'/transfer');return;}
        if(t==='Покупка'&&current.includes('/rules')){go('/storage/channels/rules');return;}
        if(t==='Продажа'&&current.includes('/rules')){go('/storage/channels/rules/sell');return;}
        if(t==='Согласен'){go('/storage/channels');return;}
        if(t==='Создать коллекцию'){go('/storage/bundles/create');return;}
        if(t==='Создать каналы'||cls.includes('_createButton_')){go('/storage/channels/create');return;}
        if(base==='/storage/channels'&&cls.includes('_button_1x2gz_')){go('/storage/channels/rules');return;}
        if(t==='Отмена'){close();return;}
        if(t==='Создать'){note('Форма заполнена локально. Сервис хранения ещё не подключён.');return;}
        if(t==='Показать результаты'){go(base);return;}
        if(t==='Сбросить'){document.querySelectorAll('input').forEach(e=>{if(e.type==='checkbox')e.checked=false;else e.value='';});return;}
        if(cls.includes('_allFiltersButton_')){go(base+'/filters');return;}
        if(t==='Выиграть'){go('/play-hub');return;}
        if(/^Купить|^Посмотреть/.test(t)){go('/');return;}
        if(t==='Загрузить'){note('Загрузка подарков выполняется через MRKT Bank в Telegram.');return;}
        if(t==='Загрузить скин'){go('/profile/skins');return;}
        if(button.getAttribute('aria-label')==='Сортировать по'){go(base+'/sort');return;}
        if(['NFT','Модель','Фон','Символ','Цена','Feed','Тип'].includes(t)){go(t==='NFT'?'/storage/filter/nft':t==='Цена'?'/storage/filter/price':'/storage/filters');return;}
      }
      if(current.startsWith('/orders')){
        const base=current.startsWith('/orders/skins')?'/orders/skins':'/orders';
        if(button.matches('[role="tab"][class*="_tabItem_1ybf0_"]')){const cats=[...document.querySelectorAll('[role="tab"][class*="_tabItem_1ybf0_"]')];go(cats.indexOf(button)===1?'/orders/skins':'/orders');return;}
        if(t==='Все ордеры'){go(base);return;}
        if(t==='Мои ордеры'){go(base+'/my');return;}
        if(/Создать ордер/.test(t)||button.getAttribute('aria-label')==='Создать ордер'){go(base+'/create');return;}
        if(t==='Отмена'||t==='Сохранить'){go('/orders/create');return;}
        if(t==='Создать'){note('Форма заполнена локально. Ордер не размещён.');return;}
        if(t==='Назад'){go('/orders');return;}
        if(t==='Продать'){note('Продажа требует подключения собственного сервиса.');return;}
      }
      if(current==='/tasks'&&/Доступные награды|Больше наград/.test(t)){go('/tasks/leaderboard');return;}
      if(t==='Начать'||t==='Подключить Steam'){note('Это действие требует подключения собственного сервиса.');return;}
      if(cls.includes('_headingClose')||button.getAttribute('aria-label')==='Назад'){close();return;}
      if(button.hasAttribute('data-source-link')){note('Внешняя ссылка доступна в оригинальном MRKT.');return;}
      if(t==='Пре-Mаркет'||t==='Lucky Buy'||t==='Неулучшенные'||t==='Скрафченные'||t==='Передаваемые'||t==='Можно стейкать'){
        button.setAttribute('aria-pressed',button.getAttribute('aria-pressed')!=='true'?'true':'false');return;
      }
      if(t&&button.tagName==='BUTTON')note('Элемент сохранён для просмотра.');
    });
    document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
    // Give icon-only category tabs the same accessible names as their expanded state.
    [...document.querySelectorAll('[role="tab"][class*="_tabItem_1ybf0_"]')].forEach((e,i)=>e.setAttribute('aria-label',['Подарки','CS2-скины','Коллекции','Каналы'][i]||''));
    const navItems=document.querySelectorAll('[class*="_tab_14fxt_"]');
    for(const e of navItems){const label=e.querySelector('[data-label]')?.getAttribute('data-label');e.setAttribute('role','button');e.setAttribute('aria-label',label||'');e.tabIndex=0;e.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();go(nav[label]);}});}
    addEventListener('message',event=>{
      if(event.source!==parent||!event.data?.mrktActivate)return;
      const dialog=document.querySelector('[role="dialog"]');
      if(dialog)(dialog.querySelector('button:not(:disabled),input:not(:disabled)')||dialog).focus({preventScroll:true});
    });
    // Keep the previous screen painted until styles, fonts and artwork are ready.
    for(const image of document.images)image.loading='eager';
    Promise.allSettled([document.fonts.ready,...[...document.images].map(image=>image.decode().catch(()=>{}))]).then(()=>requestAnimationFrame(()=>requestAnimationFrame(()=>send('ready',current))));
  })();`;
  function render() {
    const route=location.hash.slice(1).split('?')[0]||'/';
    const key=aliases[route]||route;
    const screen=resolveScreen(key);
    if(pendingFrame){pendingFrame.remove();pendingFrame=null;}
    rememberScroll();
    if(previousRoute!==key){
      if(!returning&&previousRoute){
        if(openers.get(previousRoute)===key)openers.delete(previousRoute);
        else if(screen?.html.includes('role="dialog"')||key==='/staking')openers.set(key,previousRoute);
        else openers.clear();
      }
      returning=false;
      previousRoute=key;
    }
    if(!screen){const wasCaptured=document.body.classList.contains('exact-active'),motionBefore=window.__MRKT_MOTION.captureCurrent();frame.style.display='none';frame.inert=false;document.body.classList.remove('exact-active');document.body.classList.add('interface-ready');document.querySelector('#app').inert=false;window.__MRKT_RESTORE_SCROLL?.();window.__MRKT_UPDATE_NAV?.(key);if(wasCaptured)window.__MRKT_MOTION.enter(document,motionBefore);return;}
    const next=createFrame();pendingFrame=next;next.style.display='block';next.style.visibility='hidden';next.style.pointerEvents='none';next.dataset.ready='loading';next.dataset.route=key;document.body.append(next);
    frame.inert=true;
    const esc=s=>String(s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
    const base=new URL('.',location.href).href;
    const rules=window.__MRKT_REPAIR_CSS||'';
    const context=contextFor(key);
    const json=value=>JSON.stringify(value).replace(/</g,'\\u003c');
    const repair='('+window.__MRKT_IMAGE_GUARD.toString()+')(document);('+window.__MRKT_REPAIR.toString()+')('+json(key)+','+json(groups.get(context)||{})+','+json(context)+','+json(window.__MRKT_REFERENCE_CATALOG||[])+');';
    const markup=window.__MRKT_ASSETS?screen.html.replace(/assets\/[A-Za-z0-9_./-]+/g,path=>window.__MRKT_ASSETS[path]||path):screen.html;
    const styleTag=s=>'<style>'+s.replace(/<\/style/gi,'<\\/style')+'</style>';
    next.srcdoc='<!doctype html><html lang="ru" class="'+esc(screen.htmlClass)+'" style="'+esc(screen.htmlStyle)+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><base href="'+esc(base)+'"><meta http-equiv="Content-Security-Policy" content="default-src &apos;none&apos;; img-src &apos;self&apos; data: https: file: http://127.0.0.1:* http://localhost:*; style-src &apos;self&apos; &apos;unsafe-inline&apos; file: http://127.0.0.1:* http://localhost:*; font-src &apos;self&apos; data: file: http://127.0.0.1:* http://localhost:*; script-src &apos;unsafe-inline&apos;; connect-src &apos;none&apos;; form-action &apos;none&apos;">'+screen.styles.map(s=>window.__MRKT_INLINE_CSS?.[s]?styleTag(window.__MRKT_INLINE_CSS[s]):'<link rel="stylesheet" href="'+esc(s)+'">').join('')+screen.inlineStyles.map(styleTag).join('')+(window.__MRKT_REPAIR_CSS?'':'<link rel="stylesheet" href="'+esc(new URL('screen-fixes.css',base).href)+'">')+'<style>'+rules+'</style></head><body class="'+esc(screen.bodyClass)+'" style="'+esc(screen.bodyStyle)+'">'+markup+'<script>'+repair+bridge.replace('__CURRENT__',JSON.stringify(key))+'<\/script></body></html>';
    document.title='MRKT · '+({ '/profile':'Профиль','/orders':'Ордеры','/tasks':'Задания','/play-hub':'Игровой хаб'}[key]||'Хранилище');
  }
  function back(){returning=true;const r=location.hash.slice(1)||'/';const key=aliases[r]||r;if(openers.has(key)){const opener=openers.get(key);openers.delete(key);go(opener);return;}if(/\/(?:filters|sort|filter\/nft)$/.test(key)){go(contextFor(key));return;}if(key==='/orders/collection/plush-pepe'){go('/orders');return;}const parents={'/wallet-connect':'/profile','/menu':'/profile','/menu/channels':'/menu','/staking/info':'/staking','/staking/deposit':'/staking','/staking':'/profile','/free-gift-withdrawals':'/profile','/tasks/leaderboard':'/social-tasks','/halloween':'/profile','/halloween/trade':'/halloween','/halloween/trade/rules':'/halloween/trade','/halloween/fright-fight':'/halloween','/halloween/grave-game':'/halloween','/profile/gram/locked':'/profile/gram','/orders/create':'/orders/my','/orders/create/collection':'/orders/create','/orders/skins/create':'/orders/skins/my'};if(parents[key])go(parents[key]);else if(key.includes('/points/'))go('/profile/points');else if(key.startsWith('/profile/')||key==='/profile')go(key==='/profile'?'/my-gifts':'/profile');else if(key.startsWith('/storage/channels/')&&key.includes('/rules'))go('/storage/channels');else if(key.startsWith('/storage/bundles/'))go('/storage/bundles/unlisted');else if(key.startsWith('/storage/channels/'))go('/storage/channels');else if(key.startsWith('/storage/'))go('/my-gifts');else go('/');}
  let noticeTimer;
  const notice=document.createElement('div');notice.id='offline-notice';notice.setAttribute('role','status');notice.style.cssText='position:fixed;bottom:80px;left:50%;transform:translateX(-50%);max-width:min(90%,420px);padding:12px 16px;background:#333336;color:#e5e5ea;border-radius:12px;font-size:14px;z-index:8000;display:none;text-align:center;box-shadow:0 5px 24px #0007';document.body.append(notice);
  window.addEventListener('message',e=>{
    if(!e.data?.mrktOffline)return;
    if(pendingFrame&&e.source===pendingFrame.contentWindow){
      if(e.data.type==='ready'&&e.data.route===pendingFrame.dataset.route)commitFrame(pendingFrame);
      return;
    }
    if(e.source!==frame.contentWindow||e.data.route!==frame.dataset.route||frame.style.display==='none'||frame.dataset.route!==routeKey())return;
    const {type,value}=e.data;
    if(type==='state'&&value&&typeof value.context==='string'&&value.state){groups.set(value.context,value.state);return;}
    if(type==='order-reference'){window.__MRKT_OPEN_ORDER?.(value);return;}
    if(type==='funding'){window.__MRKT_OPEN_FUNDS?.(value);return;}
    if(type==='lucky-buy'){window.__MRKT_OPEN_LUCKY?.(value);return;}
    if(type==='navigate'&&typeof value==='string'&&/^\/[a-z0-9/-]*$/.test(value))go(value);
    else if(type==='back')back();
    else if(type==='notice'){clearTimeout(noticeTimer);notice.textContent=value;notice.style.display='block';noticeTimer=setTimeout(()=>notice.style.display='none',3200);}
  });
  window.addEventListener('hashchange',render);window.addEventListener('keydown',e=>{if(e.key==='Escape'&&frame.style.display!=='none'&&!document.querySelector('dialog[open]'))back();});
  render();
})();
