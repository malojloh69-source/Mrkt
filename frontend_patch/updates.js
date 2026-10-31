/* Independent reference views. No credentials, purchases, bets or transfers. */
(() => {
  'use strict';
  const ref=window.__MRKT_NEW_REFERENCE;
  const ui=()=>window.__MRKT_APP;
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const art=(path,alt='',cls='')=>`<img src="assets/${esc(path.replace(/^assets\//,''))}" alt="${esc(alt)}" class="${cls}" loading="lazy" decoding="async">`;
  const icon=name=>ui().icon(name);
  const gram=()=>ui().gram();
  const priceGram=()=>'<span class="price-static-gram" aria-hidden="true"></span>';
  const channelShield=()=>'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C9 4 5 5 3 5v7c0 5 5 9 9 11 4-2 9-6 9-11V5c-2 0-6-1-9-3Z" fill="currentColor"/><path d="M12 8v6" stroke="#282828" stroke-width="2.6" stroke-linecap="round"/><circle cx="12" cy="17.5" r="1.4" fill="#282828"/></svg>';
  const amount=value=>Number(value).toLocaleString('en-US',{useGrouping:false,maximumFractionDigits:4});
  const note=()=>'<p class="reference-note">Сохранённые данные · 30 октября 2026 · текущая доступность не подтверждена</p>';
  const product={kind:'stars',amount:100,period:3,recipient:''};
  const channels={query:'',collections:[],min:'',max:'',sort:'source'};
  const detail={tab:'details',view:'analytics',range:'all',kind:'all'};
  const ownUsername=()=>ui()?.account.verified&&ui().account.user?.username?'@'+ui().account.user.username:'';
  const productPrice=()=>product.kind==='premium'?({3:10.3936,6:13.8649,12:25.1416}[product.period]):Math.round(product.amount/100*1.3045*10000)/10000;
  const star=kind=>art(`updates/${kind==='premium'?'premium':'stars'}.webp`,kind==='premium'?'Telegram Premium':'Telegram Stars','product-star');
  function preserveRender(){const y=window.scrollY;ui().render();window.scrollTo({top:y,behavior:'instant'});}
  function show(title,body,cls=''){
    ui().showSheet(title,body);document.getElementById('sheet').classList.add('updated-sheet');
    if(cls)document.getElementById('sheet').classList.add(cls);
  }
  function starsPane(){
    if(!product.recipient)product.recipient=ownUsername();
    const premium=product.kind==='premium';
    return `<section class="products-view"><div class="product-form"><h2>ЧТО ВЫ ХОТИТЕ КУПИТЬ?<button class="icon-button" data-up="product-info" aria-label="Информация о Stars и Premium">${icon('info')}</button></h2>
      <fieldset class="product-kinds"><legend class="sr-only">Продукт Telegram</legend>${[['stars','Телеграм звезды'],['premium','Телеграм премиум']].map(([kind,label])=>`<label><input type="radio" name="product-kind" value="${kind}" ${product.kind===kind?'checked':''}><span>${label}</span>${star(kind)}</label>`).join('')}</fieldset>
      <label class="product-label" for="product-recipient">Получатель</label><div class="product-recipient"><input id="product-recipient" maxlength="33" autocomplete="off" spellcheck="false" value="${esc(product.recipient)}" placeholder="Введите Телеграм юзернейм"><button class="primary" data-up="product-self">Отправить себе</button></div>
      ${premium?`<label class="product-label">Длительность</label><div class="premium-periods">${[[3,'3 месяца',10.3936],[6,'6 месяцев',13.8649],[12,'1 год',25.1416]].map(([n,label,price])=>`<button data-up-period="${n}" class="${product.period===n?'active':''}" aria-pressed="${product.period===n}"><span>${label}</span><span>${priceGram()} ${amount(price)}</span></button>`).join('')}</div>`:`<label class="product-label" for="product-amount">Количество</label><input id="product-amount" type="number" min="50" max="1000000" step="1" value="${product.amount}" inputmode="numeric"><div class="product-presets">${[50,100,500,1000].map(n=>`<button class="secondary" data-up-stars="${n}">${star('stars')} ${n}</button>`).join('')}</div>`}</div>
      <p id="product-error" class="form-error" role="alert"></p><button class="primary product-review" data-up="product-review">Посмотреть заказ ${priceGram()} <span data-product-price>${amount(productPrice())}</span></button>
      <p class="reference-note">Стоимость по референсу. Оплата и доставка Stars/Premium в этом приложении не подключены.</p></section>`;
  }
  function reviewProduct(){
    product.recipient=(document.getElementById('product-recipient')?.value||product.recipient).trim();
    if(product.kind==='stars')product.amount=Number(document.getElementById('product-amount')?.value||product.amount);
    const error=!/^@[A-Za-z][A-Za-z0-9_]{3,31}$/.test(product.recipient)?'Укажите корректный @username получателя.':product.kind==='stars'&&(!Number.isInteger(product.amount)||product.amount<50||product.amount>1000000)?'Количество звёзд: целое число от 50 до 1 000 000.':'';
    if(error){document.getElementById('product-error').textContent=error;return;}
    const premium=product.kind==='premium',title=premium?'Телеграм премиум':'Телеграм звезды';
    show(title,`<div class="product-confirm">${star(product.kind)}<h3>${title}</h3><p>${premium?'Длительность: '+({3:'3 месяца',6:'6 месяцев',12:'1 год'}[product.period]):'Количество: '+product.amount}</p><h2>Вы уверены, что хотите купить ${premium?'Telegram Premium':'Звёзды'} для <span class="yellow">${esc(product.recipient)}</span>?</h2><div class="product-total">${priceGram()} ${amount(productPrice())}</div><div class="product-balance">Баланс: ${gram()} 0</div><p class="reference-note">Актуальная цена не получена. Платёжный сервис не подключён.</p><button class="primary" disabled>Оплата недоступна</button><button class="secondary" data-up="close">Отмена</button></div>`,'product-confirm-sheet');
  }
  function unavailable(kind='hub'){
    if(kind==='skins')return '<section class="unavailable updated-unavailable"><h1>Инвентарь CS2</h1><p>Steam-аккаунт ещё не подключён. Доступных скинов нет.</p><button class="secondary" data-cs2-refresh>Проверить снова</button></section>';
    return `<section class="unavailable updated-unavailable">${art('ui/globe-unavailable.png','')}<h1>PlayHub сейчас недоступен :(</h1><p>Попробуйте зайти позже</p></section>`;
  }
  function luckyRow(g,i){
    return `<article class="lucky-reference-row${i===0?' first':''}">${art(g.image,g.name)}<div class="lucky-reference-name"><strong>${esc(g.name)}</strong><small>${g.number?'#'+g.number:esc(g.detail)}</small></div><div><small>Цена</small><span>${g.currency==='USD'?'$':gram()} ${amount(g.price)}</span></div><div><small>Lucky buy</small><span class="yellow">${g.currency==='USD'?'$':gram()} ${amount(g.cost)}</span></div></article>`;
  }
  function luckyPage(){
    return `<section class="lucky-reference-page"><header><h1>LUCKY BUY</h1><button class="icon-button" data-up="lucky-info" aria-label="Информация о Lucky Buy">${icon('info')}</button></header><div class="lucky-cashback"><div><strong>КЕШБЭК 6% В LUCKY BUY</strong><span>Вернём часть с каждой неудачи</span></div>${art('original/cdn-0j8ze0.stg.tgmrkt.io/images/banners/halloween-week/pumpkin.webp','Тыква')}</div>
      <div class="lucky-explanation"><div><p>Испытайте удачу и получите <span class="yellow">подарок</span> или <span class="yellow">скин</span> всего за % от его стоимости:</p><p class="lucky-bullet">Если выиграете, подарок или скин ваш!</p><p class="lucky-bullet">Если не повезёт, вы получите Lucky Card для будущих покупок!</p></div><div class="lucky-categories"><button class="secondary" data-up="catalog">${icon('gift')} Подарки</button><button class="secondary" data-up="skins">${icon('game')} Скины</button></div></div>
      ${note()}<h2>Топ-3 подарков</h2>${ref.lucky.slice(0,3).map(luckyRow).join('')}<h2>Топ-3 скинов</h2>${ref.lucky.slice(3).map(luckyRow).join('')}<p class="reference-note">Описание механики и результаты из референса. Розыгрыши и ставки не подключены.</p></section>`;
  }
  function renderChannels(target){
    let list=ref.channels.filter(g=>(!channels.query||g.username.toLowerCase().includes(channels.query.toLowerCase().replace(/^@/,'')))&&(!channels.collections.length||channels.collections.includes(g.collection))&&(channels.min===''||g.price>=Number(channels.min))&&(channels.max===''||g.price<=Number(channels.max)));
    if(channels.sort!=='source')list.sort((a,b)=>(a.price-b.price)*(channels.sort==='high'?-1:1));
    document.querySelector('.catalog-tools')?.setAttribute('hidden','');
    target.className='channels-reference';target.innerHTML=`<div class="channels-tools"><button class="icon-button" data-up="channel-search-toggle" aria-label="Поиск каналов">${icon('filters')}</button><button class="secondary" data-up="channel-filter">NFT ${channels.collections.length?'('+channels.collections.length+')':''} ${icon('down')}</button><button class="secondary" data-up="channel-price">Цена ${icon('down')}</button><button class="icon-button" data-up="channel-sort" aria-label="Сортировать каналы">${icon('sort')}</button></div><label class="channel-search" hidden>${icon('search')}<input id="channel-search" type="search" value="${esc(channels.query)}" placeholder="Поиск по @username" aria-label="Поиск каналов"></label><div class="channel-reference-grid">${list.map(g=>`<article class="channel-reference-card"><div class="channel-reference-art"><span>${icon('gift')} ${g.count}</span>${art(g.image,g.collection)}</div><h3 title="@${esc(g.username)}">@${esc(g.username)}</h3><div class="channel-reference-controls"><button class="icon-button" data-up-report="${g.id}" aria-label="Пожаловаться на @${esc(g.username)}">${channelShield()}</button><button class="secondary" data-up-channel="${g.id}">${gram()} ${amount(g.price)}</button></div></article>`).join('')||'<div class="empty-state"><h2>Ничего не найдено</h2><p>Измените фильтры каналов.</p></div>'}</div><button class="channel-rules-fab icon-button" data-up="channel-rules" aria-label="Правила сделок с каналами">${icon('info')}</button><button class="channel-top-fab icon-button" data-up="top" aria-label="Наверх">${icon('arrowup')}</button>`;
  }
  function channelFilter(){
    let selected=new Set(channels.collections),query='';
    show('Коллекция',`<section class="channel-picker"><input id="channel-filter-search" class="sheet-search" placeholder="Поиск" aria-label="Поиск коллекции"><button class="channel-picker-all" role="checkbox" aria-checked="false"><span class="catalog-check"></span>Выбрать все</button><div class="channel-picker-list"></div><footer><button class="secondary" data-channel-reset>Сбросить</button><button class="primary" data-channel-apply>Показать результаты</button></footer></section>`,'channel-picker-sheet');
    const root=document.querySelector('.channel-picker'),list=root.querySelector('.channel-picker-list');
    const options=()=>ref.channel_collections.filter(g=>g.name.toLowerCase().includes(query));
    function draw(){list.innerHTML=options().map(g=>`<button class="channel-picker-row" role="checkbox" aria-label="${esc(g.name)}" aria-checked="${selected.has(g.name)}" data-name="${esc(g.name)}"><span class="catalog-check"></span>${art(g.image,g.name)}<span>${g.label_inferred?'':esc(g.name)}</span></button>`).join('');root.querySelector('.channel-picker-all').setAttribute('aria-checked',String(options().length>0&&options().every(g=>selected.has(g.name))));}
    root.querySelector('input').addEventListener('input',e=>{query=e.target.value.toLowerCase();draw();});
    root.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;e.preventDefault();e.stopPropagation();if(b.hasAttribute('data-name'))selected.has(b.dataset.name)?selected.delete(b.dataset.name):selected.add(b.dataset.name);else if(b.matches('.channel-picker-all')){const remove=options().every(g=>selected.has(g.name));options().forEach(g=>remove?selected.delete(g.name):selected.add(g.name));}else if(b.hasAttribute('data-channel-reset'))selected.clear();else if(b.hasAttribute('data-channel-apply')){channels.collections=[...selected];ui().closeSheet();ui().render();return;}draw();});draw();
  }
  function priceFilter(){
    show('Цена, GRAM',`<label class="product-label" for="channel-min">От</label><input class="sheet-search" id="channel-min" type="number" min="0" value="${esc(channels.min)}"><label class="product-label" for="channel-max">До</label><input class="sheet-search" id="channel-max" type="number" min="0" value="${esc(channels.max)}"><p id="channel-price-error" class="form-error" role="alert"></p><button class="primary" data-up="channel-price-apply">Показать результаты</button><button class="secondary" data-up="channel-price-reset">Сбросить</button>`);
  }
  function rules(sell=false){
    const section=(title,text)=>`<section><h3>${title}</h3>${text}</section>`;
    const bullet=text=>`<p class="rule-bullet">${text}</p>`;
    const purchase=section('Перед покупкой',bullet('Проверьте описание канала, коллекции и количество подарков.')+bullet('Убедитесь, что у вашего Telegram-аккаунта есть @username.')+bullet('Проверьте возможность принять владение каналом в Telegram.'))+section('Процесс покупки и передачи',bullet('В оригинальном сервисе сделка начинается по кнопке «Купить».')+bullet('Присоединитесь к каналу, чтобы владелец мог передать его вам.'))+section('После передачи',bullet('Проверьте соответствие канала и подарков первоначальному описанию.')+bullet('В референсе подтверждение получения выполняется во вкладке «Ожидание», срок проверки — 3 часа.'))+section('Срок передачи','<p>В референсе при отсутствии передачи за 12 часов сделка отменяется, средства возвращаются покупателю.</p>');
    const sale=section('Перед продажей','<p>На референсе требуется двухфакторная аутентификация, включённая более 7 дней назад.</p>')+section('Начало сделки',bullet('После выставления в оригинальном сервисе канал появляется во вкладке «Передача».')+bullet('Передача владения выполняется через официальный Telegram, затем подтверждается в сервисе.'))+section('Завершение','<p>На скриншоте указан срок передачи 12 часов. Если канал не передан, сделка отменяется; при отсутствии подтверждения покупателя за 3 часа описано автоматическое завершение.</p>');
    show('Правила сделки с каналом',`<div class="channel-rules"><div class="rules-tabs"><button class="${!sell?'active':''}" data-up="rules-buy">Покупка</button><button class="${sell?'active':''}" data-up="rules-sell">Продажа</button></div><p class="reference-note">Пересказ предоставленного референса. Здесь сделки, переводы и автоматические выплаты не выполняются.</p>${sell?sale:purchase}<button class="primary" data-up="close">Понятно</button></div>`,'channel-rules-sheet');
  }
  let reportItem='';
  function reportDialog(id){
    reportItem=id;show('Пожаловаться на канал',`<div class="report-view">${art('updates/report.webp','Восклицательный знак','report-art')}<h2>Пожаловаться на канал</h2><p>Если вы увидели запрещённый или чувствительный контент, сообщите модератору этого приложения.</p><p class="reference-note">Жалоба сохраняется в этом приложении. В Telegram и MRKT автоматически не отправляется.</p><button class="primary" data-up="report-submit">Пожаловаться</button></div>`,'report-sheet');
  }
  async function sendReport(button){
    button.disabled=true;
    try{
      const initData=window.Telegram?.WebApp?.initData||'';
      const response=await fetch('/api/reports',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({initData,item:reportItem})});
      const result=await response.json();
      if(response.status===403)throw new Error('Откройте приложение заново через вашего Telegram-бота.');
      if(response.status===409&&result.duplicate){show('Пожаловаться на канал','<div class="report-view"><div class="report-triangle">!</div><h2>Вы уже отправляли жалобу на этот канал</h2><button class="primary" data-up="close">Ок</button></div>','report-sheet');return;}
      if(!response.ok||!result.ok)throw new Error('Не удалось сохранить жалобу. Повторите позже.');
      show('Жалоба сохранена',`<div class="report-view"><div class="report-check">${icon('check')}</div><h2>Жалоба сохранена для модерации этого приложения</h2><button class="primary" data-up="close">Отлично</button></div>`,'report-sheet');
    }catch(error){ui().toast(error.message);if(button.isConnected)button.disabled=false;}
  }
  function giftPage(g){
    if(g.read_only)return `<section class="nft-detail-view live-gift-detail"><button class="secondary" data-up="catalog">${icon('back')} Назад</button>${g.image?`<img src="${esc(g.image)}" alt="${esc(g.name)}" referrerpolicy="no-referrer">`:''}<h1>${esc(g.name)}</h1><div class="nft-number">#${esc(g.number??'—')}</div><strong>${amount(g.price)} TON</strong><p>${[g.model,g.background,g.symbol].filter(Boolean).map(esc).join(' · ')}</p><p>Покупка выполняется в исходном сервисе.</p>${g.url?`<a class="primary" href="${esc(g.url)}" target="_blank" rel="noopener noreferrer">Открыть NFT в Telegram</a>`:''}</section>`;
    const isObserved=g.id==='lol-pop-285611';
    const attr=(label,value,extra='')=>`<button class="nft-attribute" data-up-trait="${label}" data-up-id="${esc(g.id)}"><span>${label}</span>${extra}<strong>${esc(value||'—')} ↗</strong></button>`;
    const rows=isObserved?[['Листинг','30 окт. 14:54:33',4.16],['Покупка','30 окт. 14:52:53',3.98],['Листинг','30 окт. 14:52:53',3.98]]:[];
    const history=rows.filter(row=>detail.kind==='all'||row[0]===detail.kind);
    return `<section class="nft-detail-view"><button class="secondary" data-up="catalog">${icon('back')} Назад</button><div class="nft-detail-hero">${art(g.image,g.name)}</div><h1>${esc(g.name)}</h1><div class="nft-number">#${esc(g.number)}</div>${note()}<section class="nft-sale"><span>Выставлено за</span><strong>${gram()} ${amount(g.price)}</strong><div><button class="icon-button" data-up="nft-offer" aria-label="Офферы">${icon('percent')}</button><button class="icon-button" data-cart-add="${esc(g.id)}" aria-label="Добавить в корзину">${icon('cart')}</button><button class="primary" data-buy="${esc(g.id)}">Купить ${gram()} ${amount(g.price)}</button></div></section>
      <div class="nft-tabs"><button class="${detail.tab==='details'?'active':''}" data-up-detail-tab="details">${icon('receipt')} Подробнее</button><button class="${detail.tab==='offers'?'active':''}" data-up-detail-tab="offers">${icon('percent')} Офферы</button></div>
      ${detail.tab==='offers'?`<section class="nft-offers"><header>ПРЕДЛОЖЕНИЯ<button class="icon-button" data-up="nft-offer" aria-label="Добавить предложение">${icon('plus')}</button></header><h2>Укажите свою цену</h2><p>Для размещения предложения нужен подключённый торговый сервис.</p><button class="secondary" disabled>Разместить предложение</button></section>`:`<section class="nft-attributes">${attr('КОЛЛЕКЦИЯ',g.name,isObserved?`<small>флор: ${gram()} 4.07</small>`:'')}${attr('МОДЕЛЬ',g.model,`${isObserved?`<small>флор: ${gram()} 4.16</small>`:''}${g.modelRarity?`<mark>${g.modelRarity}%</mark>`:''}`)}${attr('ФОН',g.background,g.backgroundRarity?`<mark>${g.backgroundRarity}%</mark>`:'')}${attr('СИМВОЛ',g.symbol)}</section><section class="nft-observations"><header><div class="nft-tabs"><button class="${detail.view==='analytics'?'active':''}" data-up-detail-view="analytics">${icon('grid')} Аналитика</button><button class="${detail.view==='history'?'active':''}" data-up-detail-view="history">${icon('clock')} История</button></div>${detail.view==='analytics'?'<span class="reference-period">Все</span>':''}</header>${detail.view==='analytics'?(isObserved?`${art(ref.chart,'Сохранённый график цены Lol Pop со скриншота 140860.jpg','reference-chart')}<p class="reference-note">График со скриншота, без обновления котировок.</p>`:'<p class="reference-note">Сохранённого графика этого предмета нет.</p>'):`<div class="history-filter"><select id="nft-history-kind" aria-label="Тип события"><option value="all">Тип события: все</option><option ${detail.kind==='Листинг'?'selected':''}>Листинг</option><option ${detail.kind==='Покупка'?'selected':''}>Покупка</option></select><button class="icon-button" data-up="history-source" aria-label="Источник истории">${icon('info')}</button></div>${history.map(row=>`<article class="nft-history-row">${art(g.image,g.name)}<div><strong>${esc(g.name)}</strong><small>#${g.number}</small></div><div><span class="${row[0]==='Покупка'?'green':'yellow'}">${row[0]}</span><small>${row[1]}</small></div><span>${gram()} ${amount(row[2])}</span></article>`).join('')||'<p class="reference-note">Для этого предмета нет сохранённых событий.</p>'}`}</section>`}</section>`;
  }
  function applyIdentity(doc=document){
    const user=ui()?.account.verified?ui().account.user:null;if(!user)return;
    for(const button of doc.querySelectorAll('[class*="_avatar_"]')){
      button.textContent='';const photo=user.photo_url;
      if(photo){const img=doc.createElement('img');img.src=photo;img.alt='Аватар Telegram';img.referrerPolicy='no-referrer';img.style.cssText='width:100%;height:100%;object-fit:cover';img.onerror=()=>{button.textContent=user.first_name?.slice(0,1)||'П';};button.append(img);}else button.textContent=user.first_name?.slice(0,1)||'П';
    }
  }
  const actions={
    close:()=>ui().closeSheet(),catalog:()=>{ui().state.category='gifts';ui().navigate('/');ui().render();},skins:()=>{ui().state.category='cs2';ui().navigate('/');ui().render();},
    'product-self':()=>{const username=ownUsername();if(!username){ui().toast(ui().account.verified?'У вашего аккаунта не указан username.':'Откройте миниапп через Telegram для подтверждения профиля.');return;}product.recipient=username;document.getElementById('product-recipient').value=username;},
    'product-review':reviewProduct,'product-info':()=>show('Stars и Premium','<p>Получатель указывается как @username. «Отправить себе» использует только подтверждённый профиль Telegram.</p><p>Цены взяты из референса. Продажа и доставка не подключены.</p>'),
    'lucky-info':()=>show('Lucky Buy','<p>Здесь показаны описание механики и сохранённые топы из предоставленных скриншотов. Живые розыгрыши, ставки и выдача призов не подключены.</p>'),
    'channel-filter':channelFilter,'channel-price':priceFilter,'channel-sort':()=>{channels.sort=channels.sort==='low'?'high':'low';preserveRender();},
    'channel-search-toggle':()=>{const field=document.querySelector('.channel-search');field.hidden=!field.hidden;if(!field.hidden)field.querySelector('input').focus();},
    'channel-price-reset':()=>{channels.min='';channels.max='';ui().closeSheet();ui().render();},
    'channel-price-apply':()=>{const min=document.getElementById('channel-min').value,max=document.getElementById('channel-max').value;if((min!==''&&(!Number.isFinite(+min)||+min<0))||(max!==''&&(!Number.isFinite(+max)||+max<0))||(min!==''&&max!==''&&+min>+max)){document.getElementById('channel-price-error').textContent='Укажите корректный диапазон цены.';return;}channels.min=min;channels.max=max;ui().closeSheet();ui().render();},
    'channel-rules':()=>rules(false),'rules-buy':()=>rules(false),'rules-sell':()=>rules(true),'report-submit':sendReport,
    top:()=>window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'}),
    'nft-offer':()=>{detail.tab='offers';preserveRender();},'history-source':()=>ui().toast('События со скриншота 140861.jpg, 30 октября 2026. Новые события не подключены.')
  };
  document.addEventListener('click',event=>{
    const b=event.target.closest('button');if(!b||b.disabled)return;
    let handled=true;
    if(b.dataset.up)actions[b.dataset.up]?.(b);
    else if(b.dataset.upPeriod){product.period=Number(b.dataset.upPeriod);preserveRender();}
    else if(b.dataset.upStars){product.amount=Number(b.dataset.upStars);preserveRender();}
    else if(b.dataset.upLiveGift){const g=ui().giftById(b.dataset.upLiveGift);if(!g)return;show(g.name,`<div class="live-gift-detail">${g.image?`<img src="${esc(g.image)}" alt="${esc(g.name)}" referrerpolicy="no-referrer">`:''}<h3>${esc(g.name)} #${esc(g.number??'—')}</h3><p>${[g.model,g.background,g.symbol].filter(Boolean).map(esc).join(' · ')}</p><strong>${amount(g.price)} TON</strong><p>Объявление из каталога. Покупка выполняется в исходном сервисе.</p>${g.url?`<a class="primary" href="${esc(g.url)}" target="_blank" rel="noopener noreferrer">Открыть NFT в Telegram</a>`:''}</div>`);}
    else if(b.dataset.upReport)reportDialog(b.dataset.upReport);
    else if(b.dataset.upChannel){const g=ref.channels.find(g=>g.id===b.dataset.upChannel);show('@'+g.username,`${art(g.image,g.collection,'channel-detail-art')}<p>Подарков: ${g.count}</p><p>Цена на скриншоте: ${amount(g.price)} GRAM</p>${note()}<p>Покупка и передача канала не подключены.</p><button class="secondary" data-up="channel-rules">Правила по референсу</button><button class="primary" data-up="close">Закрыть</button>`);}
    else if(b.dataset.upDetailTab){detail.tab=b.dataset.upDetailTab;preserveRender();}
    else if(b.dataset.upDetailView){detail.view=b.dataset.upDetailView;preserveRender();}
    else if(b.dataset.upTrait){const g=ui().giftById(b.dataset.upId),names={'КОЛЛЕКЦИЯ':'NFT','МОДЕЛЬ':'Модель','ФОН':'Фон','СИМВОЛ':'Символ'},field=names[b.dataset.upTrait],value=field==='NFT'?g.name:field==='Модель'?g.model:field==='Фон'?g.background:g.symbol;ui().state.category='gifts';ui().state.filters={NFT:[g.name],Модель:[],Фон:[],Символ:[]};if(field!=='NFT'&&value)ui().state.filters[field]=[value];ui().navigate('/');}
    else if(b.dataset.action==='purchase-info'){const g=ui().currentGift();if(g)ui().navigate('/gift/'+g.id);}
    else handled=false;
    if(handled){event.preventDefault();event.stopImmediatePropagation();}
  },true);
  document.addEventListener('change',event=>{
    const t=event.target;if(t.name==='product-kind'){product.kind=t.value;preserveRender();}
    if(t.id==='nft-history-kind'){detail.kind=t.value;preserveRender();}
  });
  document.addEventListener('input',event=>{
    const t=event.target;
    if(t.id==='product-recipient')product.recipient=t.value;
    if(t.id==='product-amount'){product.amount=Number(t.value);const price=document.querySelector('[data-product-price]');if(price)price.textContent=Number.isFinite(product.amount)?amount(productPrice()):'—';}
    if(t.id==='channel-search'){const start=t.selectionStart;channels.query=t.value;preserveRender();const next=document.getElementById('channel-search');next.focus();next.setSelectionRange(start,start);}
  });
  window.__MRKT_UPDATES={starsPane,luckyPage,renderChannels,giftPage,unavailable,applyIdentity};
  document.addEventListener('DOMContentLoaded',()=>{
    const loader=document.getElementById('launch-screen');if(!loader)return;
    let done=false;
    const finish=()=>{if(done)return;done=true;loader.classList.add('finished');setTimeout(()=>loader.remove(),350);};
    Promise.allSettled([document.fonts.ready,...[...loader.querySelectorAll('img')].map(image=>image.decode())]).then(()=>requestAnimationFrame(()=>requestAnimationFrame(finish)));
    setTimeout(finish,8000);
  });
})();
