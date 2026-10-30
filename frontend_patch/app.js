/* Shared browser/Telegram interface. Identity and offer writes are verified by the backend. */
(() => {
  "use strict";

  const asset = value => {
    const path=String(value||"");let clean=path.replace(/^assets\//,"");if(clean.startsWith("enhanced/")&&!["enhanced/banner-cheers.png","enhanced/banner-free-withdrawal.png","enhanced/banner-halloween.png"].includes(clean))clean=clean.replace(/^enhanced\//,"optimized/").replace(/\.png$/,".webp");
    const embedded=window.__MRKT_ASSETS?.[path]||window.__MRKT_ASSETS?.[clean]||window.__MRKT_ASSETS?.[`assets/${clean}`];
    if(embedded)return embedded;
    if(/^data:image\//.test(path))return path;
    if(/^https:\/\//.test(path)){try{const u=new URL(path);return !u.username&&!u.password?u.href:"";}catch{return "";}}
    if(/^http:\/\//.test(path))return "";
    return `assets/${clean}`;
  };
  const escape = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const symbols = {
    x:'<path d="m6 6 12 12M18 6 6 18"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    minus:'<path d="M5 12h14"/>',
    search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
    right:'<path d="m9 4 8 8-8 8"/>',
    down:'<path d="m5 9 7 7 7-7"/>',
    back:'<path d="M20 12H4m7-7-7 7 7 7"/>',
    external:'<path d="M6 18 19 5M6 5h13v13"/>',
    check:'<path d="m5 12 4 4L19 6"/>',
    sort:'<path d="M4 6h16M4 12h11M4 18h6"/>',
    filters:'<path d="M4 6h16M4 12h16M4 18h16M8 3v6m8 0v6m-6 0v6"/>',
    info:'<circle cx="12" cy="12" r="10" fill="currentColor" stroke="none"/><path d="M12 11v6m0-10v.2" stroke="var(--icon-inner,#171717)" stroke-width="2.8"/>',
    gift:'<path d="M3 10h18v4H3zM5 14h14v7H5z" fill="currentColor" stroke="none"/><path d="M12 10v11" stroke="#171717" stroke-width="2"/><path d="M12 10C4 11 4 3 8 3c3 0 4 7 4 7Zm0 0c8 1 8-7 4-7-3 0-4 7-4 7Z"/>',
    receipt:'<path d="M5 3h14v19l-3-2-4 2-4-2-3 2V3Z" fill="currentColor" stroke="none"/><path d="M9 8h6M9 12h6M9 16h6" stroke="var(--icon-inner,#242424)"/>',
    feed:'<rect x="3" y="2" width="18" height="20" rx="3" fill="currentColor" stroke="none"/><path d="M7 7h7M7 12h10M10 17h7" stroke="var(--icon-inner,#242424)" stroke-width="2"/>',
    arrowdown:'<path d="M9 3h6v10h5l-8 9-8-9h5Z" fill="currentColor" stroke="none"/>',
    arrowup:'<path d="M9 21h6V11h5l-8-9-8 9h5Z" fill="currentColor" stroke="none"/>',
    heart:'<path d="M12 21S2 15 2 8a5 5 0 0 1 10-2 5 5 0 0 1 10 2c0 7-10 13-10 13Z"/>',
    bag:'<path d="M5 7h14l2 15H3L5 7Z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/>',
    wallet:'<rect x="2" y="5" width="20" height="16" rx="3"/><path d="M3 5V3h16v2m-3 8h6v5h-6z"/>',
    grid:'<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
    bell:'<path d="M5 9a7 7 0 0 1 14 0v6l2 3H3l2-3V9Zm5 12h4"/>',
    user:'<circle cx="12" cy="7" r="4"/><path d="M3 22v-3a9 9 0 0 1 18 0v3"/>',
    shield:'<path d="M12 2 3 6v6c0 6 9 10 9 10s9-4 9-10V6L12 2Z"/><path d="m7 12 3 3 7-7"/>',
    percent:'<path d="m6 18 12-12"/><circle cx="7" cy="7" r="3"/><circle cx="17" cy="17" r="3"/>',
    globe:'<circle cx="12" cy="12" r="10"/><ellipse cx="12" cy="12" rx="4" ry="10"/><path d="M2 12h20M4 6h16M4 18h16"/>',
    clock:'<circle cx="12" cy="12" r="10"/><path d="M12 6v7l5 3"/>',
    star:'<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.2-6.2 3.2 1.2-6.8-5-4.9 6.9-1L12 2Z" fill="currentColor" stroke="none"/>',
    collection:'<rect x="3" y="3" width="18" height="3" rx="1" fill="currentColor" stroke="none"/><rect x="3" y="8" width="18" height="11" rx="1"/><path d="M12 16s-5-3-3-5c1-1 3 0 3 1 0-1 2-2 3-1 2 2-3 5-3 5Z" fill="currentColor" stroke="none"/><path d="M3 22h18"/>',
    copy:'<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V3H3v13h5"/>',
    telegram:'<path d="m21.6 3.5-3.4 16c-.3 1.1-1 1.4-2 .9l-5.2-3.8-2.5 2.4c-.3.3-.5.5-1 .5l.4-5.3 9.6-8.7c.4-.4-.1-.6-.6-.3L5 12.7.9 11.4c-.9-.3-.9-.9.2-1.3L20 2.8c.9-.3 1.7.2 1.6.7Z" fill="currentColor" stroke="none"/>',
    share:'<path d="m14 3 8 7-8 7v-5C7 12 4 14 2 20 1 8 6 6 14 6V3Z" fill="currentColor" stroke="none"/>',
    game:'<path d="M7 5h10c3 0 4 3 5 10 .6 5-3 6-5 2l-1-2H8l-1 2c-2 4-5.6 3-5-2C3 8 4 5 7 5Z" fill="currentColor" stroke="none"/><path d="M6 8v5m-2.5-2.5h5M16 9h.01M19 12h.01" stroke="var(--icon-inner,#222223)" stroke-width="2.2"/>',
    discount:'<path d="m12 1 2.4 2.3 3.3-.2.8 3.2 2.9 1.7-1.1 3.2 1.1 3.2-2.9 1.7-.8 3.2-3.3-.2L12 23l-2.4-2.3-3.3.2-.8-3.2-2.9-1.7 1.1-3.2L2.6 9.6l2.9-1.7.8-3.2 3.3.2L12 1Z" fill="currentColor" stroke="none"/><path d="m8.5 16 7-8" stroke="var(--icon-inner,#222223)" stroke-width="2"/><circle cx="8.5" cy="8.5" r="1.5" fill="var(--icon-inner,#222223)" stroke="none"/><circle cx="15.5" cy="15.5" r="1.5" fill="var(--icon-inner,#222223)" stroke="none"/>',
    clover:'<path d="M12 12c-5-2-9-8-5-10 3-2 5 1 5 3 0-2 3-5 6-3 4 3-1 8-6 10 4-2 10-3 10 2 0 4-5 4-8 1 1 4 2 6 4 8h-4c-1-3-2-5-2-9-3 5-9 5-10 1-1-5 5-6 10-3Z" fill="currentColor" stroke="none"/>',
    moneybag:'<path d="M7 2h10l-2 4H9L7 2Zm1 6h8c4 4 6 7 5 10-1 4-17 4-18 0C2 15 4 12 8 8Z" fill="currentColor" stroke="none"/><circle cx="12" cy="15" r="2" fill="var(--icon-inner,#a78341)" stroke="none"/>',
    trash:'<path d="M4 7h16M9 7V3h6v4M6 7l1 15h10l1-15M10 11v7m4-7v7"/>',
    cart:'<path d="M2 3h3l3 12h11l3-9H6M9 21h.01M19 21h.01" stroke-width="2.7"/>',
  };
  function icon(name, cls="") { return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${symbols[name] || symbols.info}</svg>`; }
  function gram() { return `<span class="gram original-mask" style="mask-image:url('${escape(asset("original/inline-svg/svg-8f7fe54a59eada2e.svg"))}')" aria-hidden="true"></span>`; }
  const pic = (path, alt="", cls="", extra="") => `<img src="${escape(asset(path))}" alt="${escape(alt)}" class="${cls}" ${extra}>`;
  const nav = [
    ["/","Маркет","nav-market.png","nav-market-active.png"],
    ["/orders","Ордеры","nav-orders.png"],
    ["/play-hub","Игровой хаб","nav-game.png","nav-game-active.png"],
    ["/halloween","Halloween","nav-halloween.png"],
    ["/my-gifts","Хранилище","nav-storage.png"]
  ];
  const liveNav = ["svg-1dd93f09c670b4f9.svg","svg-a3dc672417aab370.svg","svg-b6092b9342adc92d.svg","svg-cca1ac0de4d1a581.svg","svg-acf2a24a25c0ab11.svg"];
  // Collection labels are navigation metadata, never synthetic listings.
  const collections=window.__MRKT_GIFT_DATA.collections;
  const snapshot = window.__MRKT_SNAPSHOT && typeof window.__MRKT_SNAPSHOT === "object" ? window.__MRKT_SNAPSHOT : {};
  const source = name => snapshot[name] && snapshot[name].status === "snapshot" ? snapshot[name] : null;
  const sourceItems = name => Array.isArray(source(name)?.items) ? source(name).items : [];
  const snapshotNote = () => "";
  const bundles=[
    {id:"bundle-sketch",bundle:true,name:"🤍@mainer_bitcoinov🤍 Offers",group:"По фону",price:35,count:3,image:"ui/bundle-sketch.webp",numbers:[54055,27661,10877],nftNames:["Tama Gadget"],models:[]},
    {id:"bundle-green",bundle:true,name:"Up📈 Up📊",group:"По фону",price:24.48,count:3,image:"ui/bundle-green.webp",numbers:[447249,426116,274329],nftNames:["Chill Flame"],models:["Chill Flame::Bull Run"]},
    {id:"bundle-battleship",bundle:true,name:"Battleshipgrey& number 103$5557",group:"По фону",price:51,count:3,image:"ui/bundle-battleship.webp",thumbs:["ui/bundle-battleship-1.webp","ui/bundle-battleship-2.webp","ui/bundle-battleship-3.webp"],numbers:[103,5160,5557],nftNames:["Gravestone","Evil Eye","Joyful Bundle"],models:[]}
  ];
  const marketCategoryState=new Map();
  function changeMarketCategory(next){
    if(next===state.category)return;
    marketCategoryState.set(state.category,structuredClone({query:state.query,filters:state.filters,min:state.min,max:state.max,chips:state.chips,view:state.view,sort:state.sort}));
    const saved=marketCategoryState.get(next)||{query:"",filters:{NFT:[],Модель:[],Фон:[],Символ:[]},min:"",max:"",chips:[],view:"gifts",sort:"new"};
    Object.assign(state,structuredClone(saved),{category:next});render();
  }
  function bundleCard(b){const inCart=state.cart.includes(b.id);return `<article class="bundle-card"><div class="bundle-preview">${pic(b.image,`Коллекция из ${b.count} NFT: ${b.numbers.map(n=>"#"+n).join(", ")}`)}</div><div class="bundle-title"><strong>${escape(b.name)}</strong><span>${b.group}</span></div><div class="bundle-actions"><button class="bundle-buy" data-bundle-open="${b.id}">${gram()}${money(b.price)}</button><button class="icon-button${inCart?" in-cart":""}" aria-pressed="${inCart}" data-cart-add="${b.id}" aria-label="В корзину: ${escape(b.name)}">${inCart?icon("check"):icon("cart")}</button></div></article>`;}
  function bundleSheet(id){
    const b=bundles.find(x=>x.id===id);if(!b)return;state.activeBundle=b.id;
    const inCart=state.cart.includes(b.id);
    showSheet("Покупка коллекции",`<div class="bundle-purchase"><button class="icon-button bundle-share" data-action="bundle-share" aria-label="Поделиться коллекцией">${icon("share")}</button><article class="bundle-purchase-card"><div class="bundle-purchase-art">${pic(b.image,`Коллекция из ${b.count} NFT: ${b.numbers.map(n=>"#"+n).join(", ")}`)}</div><div class="bundle-title"><strong>${escape(b.name)}</strong><span>${b.group}</span></div></article><div class="bundle-thumbnails">${b.numbers.map((n,i)=>b.thumbs?pic(b.thumbs[i],`NFT #${n}`):`<div class="bundle-mini" style="--tile:${i}">${pic(b.image,`NFT #${n}`)}</div>`).join("")}</div><div class="bundle-share-note" hidden><label for="bundle-share-text">Коллекция</label><textarea id="bundle-share-text" readonly>${escape(bundleDescription(b))}</textarea></div><div class="bundle-purchase-actions"><button class="icon-button" data-action="bundle-offer" aria-label="Сделать оффер на коллекцию">${icon("discount")}</button><button class="icon-button${inCart?" in-cart":""}" data-bundle-cart="${b.id}" aria-label="${inCart?"Убрать коллекцию из корзины":"Добавить коллекцию в корзину"}" aria-pressed="${inCart}">${icon("cart")}</button><button class="primary" data-action="bundle-confirm">Купить ${gram()} ${money(b.price)}</button></div></div>`);
    sheet.classList.add("bundle-purchase-sheet");
  }
  function bundleDescription(b){return `${b.name} · ${b.group}\n${b.numbers.map(n=>"#"+n).join(" · ")}\n${money(b.price)} GRAM`;}
  async function shareBundle(){const b=bundles.find(x=>x.id===state.activeBundle);if(!b)return;try{await navigator.clipboard.writeText(bundleDescription(b));toast("Данные коллекции скопированы.");}catch{const note=sheet.querySelector('.bundle-share-note');if(note){note.hidden=false;note.querySelector('textarea').select();}}}
  function confirmBundle(){const b=bundles.find(x=>x.id===state.activeBundle);if(!b)return;state.fundingAmount=String(b.price);showSheet("Покупка коллекции",`<div class="bundle-confirmation">${pic(b.image,`Коллекция из ${b.count} NFT`)}<h3>${escape(b.name)}</h3><p>${b.count} подарка</p><div class="purchase-price">${gram()} ${money(b.price)}</div><div class="insufficient-balance">Баланс: ${gram()} ${balanceValue("GRAM")}</div><button class="primary" data-action="bundle-funding">Пополнить баланс</button><button class="secondary" data-action="bundle-back">Назад</button></div>`);}
  function bundleOffer(){const b=bundles.find(x=>x.id===state.activeBundle);if(!b)return;showSheet("Оффер на коллекцию",`<p>${escape(b.name)}</p><label class="field-label" for="bundle-offer-price">Ваша цена, GRAM</label><input class="sheet-search" id="bundle-offer-price" inputmode="decimal" placeholder="Сумма"><p id="bundle-offer-error" class="form-error" role="alert"></p><button class="primary" data-action="bundle-offer-submit">Сделать оффер</button><button class="secondary" data-action="bundle-back">Назад</button>`);}
  const events = [
    {id:"fright-fight",name:"FRIGHT FIGHT",description:"Сражайтесь и побеждайте в праздничных боях",color:"#69b235",action:"Играть",route:"/play-hub/fight-club"},
    {id:"grave-game",name:"GRAVE GAME",description:"Бросайте вызов и выигрывайте в жутких раундах",color:"#b13a89",action:"Играть",route:"/play-hub/squid-game"},
    {id:"trick-or-trade",name:"TRICK OR TRADE",description:"Торгуйте, поднимайтесь в рейтинге и боритесь за призы",color:"#6756c1",action:"Перейти в маркет",route:"/"},
    {id:"lucky-buy",name:"LUCKY BUY",description:"Выбивайте подарки, а если не везёт — кэшбек 6%",color:"#b58b45",action:"Смотреть подарки",route:"/lucky-buy"},
    {id:"staking",name:"STAKING",description:"Отправляйте активы в стейкинг и лутайте бонусы",color:"#b5a335",action:"Открыть стейкинг",route:"/staking"}
  ];

  const storageKey="mrkt-ui-v1";
  const persisted = (() => {try{return JSON.parse(localStorage.getItem(storageKey) || "{}");}catch{return {};}})();
  const state = {
    route:"/",cartExcluded:[],cartSort:false,cartPoints:false,cartOrigin:"/",query:"", category:"gifts",view:"gifts",sort:"new",filters:{NFT:[],Модель:[],Фон:[],Символ:[]},min:"",max:"", chips:[],
    favorites:Array.isArray(persisted.favorites)?persisted.favorites:[],cart:Array.isArray(persisted.cart)?persisted.cart:[],orders:Array.isArray(persisted.orders)?persisted.orders:[],
    storageTab:source("storage")?.activeTab==="storage"?"storage":"sale",ordersTab:"all",taskTab:"hot",profileTab:"gifts",sheet:null,draft:null,quantity:1,withdrawSlide:0,filterSearch:"",activeTask:null,
  };
  const el = id => document.getElementById(id);
  const main = el("main"), header = el("header"), navigation = el("navigation"), sheet = el("sheet");
  const filters = ["NFT","Модель","Фон","Символ"];
  const capturedEndAt = Date.parse(snapshot.event?.endsAt || "");
  const endAt = Number.isFinite(capturedEndAt) ? capturedEndAt : null;
  let toastTimer, lastFocus, swipeX=0, purchaseGift=null;
  const lucky={confettiTimer:null,gift:null,chance:1,skip:false,agreed:false,animation:null,timer:null,sequence:0,resolving:false};
  let telegram = window.Telegram?.WebApp;
  try { if(window.parent !== window && window.parent.Telegram?.WebApp?.initData) telegram=window.parent.Telegram.WebApp; } catch {}
  const inTelegram=Boolean(telegram?.initData);
  // Captured account data must never identify the visitor of a disconnected file.
  const account={user:null,verified:false,balances:{GRAM:0,USD:0,points:0,cards:0}};
  let catalog=sourceItems("catalog");
  let serverReady=false, serviceConfig={}, publicOffers=[], myOffers=[], offerLoading="", activeOffer=null, bannerIndex=0, bannerTouchedAt=0;
  const banners=[{"route":"/event/trick-or-trade","background":"rgb(28, 28, 29) none repeat scroll 0% 0% / auto padding-box border-box","height":65,"padding":"0px 18px","radius":"15px","content":[{"background":"rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box","class":"_text_zf8n7_1 _s1_zf8n7_77 _primary_zf8n7_101 _bannerTitle_bag12_60","color":"rgb(255, 250, 250)","lineHeight":"21.6px","maxWidth":"none","padding":"0px","radius":"0px","size":"18px","text":"TRICK OR TRADE","weight":"600"},{"background":"rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box","class":"_bannerActionContainer_bag12_85","color":"rgb(255, 250, 250)","lineHeight":"24px","maxWidth":"none","padding":"0px","radius":"0px","size":"16px","text":"Торгуй подарками и выигрывай GRAMВперед!","weight":"400"}],"images":[{"localURL":"assets/original/cdn-0j8ze0.stg.tgmrkt.io/images/banners/halloween-trading/asset-175c6ffa02da.webp","style":"position: absolute; inset-inline-end: 0px; top: 0px; width: 100%; height: 100%; object-fit: cover; z-index: 0;"},{"localURL":"assets/original/cdn-0j8ze0.stg.tgmrkt.io/images/banners/halloween-trading/glow.svg","style":"position: absolute; inset-inline-end: -192px; top: -168px; width: 504px; height: 402px; z-index: 1;"},{"localURL":"assets/original/cdn-0j8ze0.stg.tgmrkt.io/images/banners/halloween-trading/shade.svg","style":"position: absolute; inset-inline-end: 52px; top: -106px; width: 460px; height: 274px; z-index: 2;"},{"localURL":"assets/original/cdn-0j8ze0.stg.tgmrkt.io/images/banners/halloween-trading/eye.webp","style":"position: absolute; inset-inline-end: 73px; top: 18px; width: 41px; height: 41px; object-fit: contain; z-index: 3;"},{"localURL":"assets/original/cdn-0j8ze0.stg.tgmrkt.io/images/banners/halloween-trading/bucket.webp","style":"position: absolute; inset-inline-end: -20px; top: -24px; width: 125px; height: 94px; object-fit: contain; z-index: 4;"}]},{"route":"/halloween","background":"linear-gradient(80.78deg, rgb(9, 7, 6) 0.17%, rgb(67, 52, 115) 53.51%, rgb(99, 81, 174) 99.23%) repeat scroll 0% 0% / auto padding-box border-box, rgb(9, 7, 6) none repeat scroll 0% 0% / auto padding-box border-box","height":65,"padding":"0px 18px","radius":"15px","content":[{"background":"rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box","class":"_text_zf8n7_1 _s1_zf8n7_77 _primary_zf8n7_101 _bannerTitle_bag12_60","color":"rgb(255, 250, 250)","lineHeight":"21.6px","maxWidth":"none","padding":"0px","radius":"0px","size":"18px","text":"HALLOWEEN FEST: 85K GRAM","weight":"600"},{"background":"rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box","class":"_bannerActionContainer_bag12_85","color":"rgb(255, 250, 250)","lineHeight":"24px","maxWidth":"none","padding":"0px","radius":"0px","size":"16px","text":"Играй! Торгуй! Забирай призы!Вперед!","weight":"400"}],"images":[{"localURL":"assets/original/cdn.tgmrkt.io/images/icons/social/bats.webp","style":"position: absolute; inset-inline-end: -11px; top: -23px; width: 337px; height: 112px; z-index: 0;"},{"localURL":"assets/original/cdn-0j8ze0.stg.tgmrkt.io/images/banners/halloween-week/pumpkin.webp","style":"position: absolute; inset-inline-end: -26px; top: -61px; width: 146px; height: 155px; object-fit: cover; z-index: 1;"}]},{"route":"/halloween","background":"linear-gradient(88deg, rgb(9, 7, 6) 0.17%, rgb(5, 71, 117) 46.33%, rgb(8, 107, 200) 99.23%) repeat scroll 0% 0% / auto padding-box border-box, rgb(38, 38, 39) none repeat scroll 0% 0% / auto padding-box border-box","height":65,"padding":"0px 18px","radius":"15px","content":[{"background":"rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box","class":"_text_zf8n7_1 _s1_zf8n7_77 _primary_zf8n7_101 _bannerTitle_bag12_60","color":"rgb(255, 250, 250)","lineHeight":"21.6px","maxWidth":"none","padding":"0px","radius":"0px","size":"18px","text":"7 ДНЕЙ REDO HUNT","weight":"600"},{"background":"rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box","class":"_bannerActionContainer_bag12_85","color":"rgb(255, 250, 250)","lineHeight":"24px","maxWidth":"none","padding":"0px","radius":"0px","size":"16px","text":"Борьба за 10K GRAMВперед!","weight":"400"}],"images":[{"localURL":"assets/original/cdn.tgmrkt.io/images/icons/social/asset-001462cf5215.png","style":"position: absolute; inset-inline-end: 0px; top: 0px; width: 227px; height: 65px; object-fit: contain; z-index: 1;"},{"localURL":"assets/original/cdn.tgmrkt.io/images/icons/social/Ellipse-2677.png","style":"position: absolute; inset-inline-end: -55px; top: 0px; z-index: 1;"},{"localURL":"assets/original/cdn.tgmrkt.io/images/icons/social/asset-b676e573e686.png","style":"position: absolute; inset-inline-end: 5px; top: 0px; width: 119px; height: 65px; object-fit: contain; z-index: 3;"}]},{"route":"/lucky-buy","background":"linear-gradient(-90deg, rgb(235, 172, 143) 0%, rgb(198, 108, 39) 100%) repeat scroll 0% 0% / auto padding-box border-box, rgb(235, 172, 143) none repeat scroll 0% 0% / auto padding-box border-box","height":65,"padding":"0px 18px","radius":"15px","content":[{"background":"rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box","class":"_text_zf8n7_1 _s1_zf8n7_77 _primary_zf8n7_101 _bannerTitle_bag12_60","color":"rgb(255, 250, 250)","lineHeight":"21.6px","maxWidth":"none","padding":"0px","radius":"0px","size":"18px","text":"ВЫБЕЙ REDO","weight":"600"},{"background":"rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box","class":"_bannerActionContainer_bag12_85","color":"rgb(255, 250, 250)","lineHeight":"24px","maxWidth":"none","padding":"0px","radius":"0px","size":"16px","text":"ЗА 1 BOOSTER COINВперед!","weight":"400"}],"images":[{"localURL":"assets/original/cdn.tgmrkt.io/images/banners/redo-lootbox/asset-031c161e3201.webp","style":"position: absolute; inset-inline-end: 0px; top: 0px; width: 100%; height: 100%; object-fit: cover; z-index: 0;"},{"localURL":"assets/original/cdn.tgmrkt.io/images/banners/redo-lootbox/art.webp","style":"position: absolute; inset-inline-end: 0px; top: 0px; width: 131px; height: 65px; z-index: 1;"}]},{"route":"/lucky-buy","background":"linear-gradient(80.78deg, rgb(9, 7, 6) 0.17%, rgb(46, 26, 12) 46.33%, rgb(15, 149, 43) 99.23%) repeat scroll 0% 0% / auto padding-box padding-box, linear-gradient(rgb(9, 7, 6), rgb(9, 7, 6)) repeat scroll 0% 0% / auto padding-box padding-box, rgba(0, 0, 0, 0) linear-gradient(90deg, rgb(33, 123, 79) 0%, rgba(43, 69, 39, 0.298) 100%) repeat scroll 0% 0% / auto border-box border-box","height":65,"padding":"0px 18px","radius":"15px","content":[{"background":"rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box","class":"_text_zf8n7_1 _s1_zf8n7_77 _primary_zf8n7_101 _bannerTitle_bag12_60","color":"rgb(255, 250, 250)","lineHeight":"21.6px","maxWidth":"none","padding":"0px","radius":"0px","size":"18px","text":"REDO ЗА 5 GRAM?","weight":"600"},{"background":"rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box","class":"_bannerActionContainer_bag12_85","color":"rgb(255, 250, 250)","lineHeight":"24px","maxWidth":"none","padding":"0px","radius":"0px","size":"16px","text":"Реальность! Проверь самВперед!","weight":"400"}],"images":[{"localURL":"assets/original/cdn.tgmrkt.io/images/banners/resist-lucky-buy/glow.svg","style":"position: absolute; inset-inline-end: -60px; top: -127px; width: 265px; height: 265px; z-index: 0;"},{"localURL":"assets/original/cdn.tgmrkt.io/images/banners/resist-lucky-buy/art.webp","style":"position: absolute; inset-inline-end: 0px; top: 0px; width: 283px; height: 65px; z-index: 1;"},{"localURL":"assets/original/cdn.tgmrkt.io/images/banners/resist-lucky-buy/pointers.svg","style":"position: absolute; inset-inline-end: 40px; top: 2px; width: 10px; height: 60px; z-index: 3;"}]},{"route":"/lucky-buy","background":"linear-gradient(90deg, rgb(11, 123, 30) 0%, rgb(69, 142, 75) 33.65%, rgb(113, 111, 255) 70.29%, rgb(6, 24, 14) 100%) repeat scroll 0% 0% / auto padding-box border-box, rgb(11, 123, 30) none repeat scroll 0% 0% / auto padding-box border-box","height":65,"padding":"0px 18px","radius":"15px","content":[{"background":"rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box","class":"_text_zf8n7_1 _s1_zf8n7_77 _primary_zf8n7_101 _bannerTitle_bag12_60","color":"rgb(255, 250, 250)","lineHeight":"21.6px","maxWidth":"none","padding":"0px","radius":"0px","size":"18px","text":"Lucky Buy для скинов","weight":"600"},{"background":"rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box","class":"_bannerActionContainer_bag12_85","color":"rgb(255, 250, 250)","lineHeight":"24px","maxWidth":"none","padding":"0px","radius":"0px","size":"16px","text":"Испытайте удачу и заберите скинВперед!","weight":"400"}],"images":[{"localURL":"assets/original/cdn.tgmrkt.io/images/banners/lucky-buy-skins/art.webp","style":"position: absolute; inset-inline-end: 0px; top: 0px; height: 100%; object-fit: cover; z-index: 1;"}]},{"route":"/staking","background":"linear-gradient(90deg, rgb(28, 28, 29) 0%, rgb(157, 80, 194) 34.37%, rgb(28, 28, 29) 100%) repeat scroll 0% 0% / auto padding-box padding-box, linear-gradient(rgb(28, 28, 29), rgb(28, 28, 29)) repeat scroll 0% 0% / auto padding-box padding-box, rgba(0, 0, 0, 0) linear-gradient(88.97deg, rgba(253, 192, 255, 0.54) 24.88%, rgba(245, 123, 254, 0.54) 37.24%, rgba(245, 123, 254, 0) 56.23%) repeat scroll 0% 0% / auto border-box border-box","height":65,"padding":"0px 18px","radius":"15px","content":[{"background":"rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box","class":"_text_zf8n7_1 _s1_zf8n7_77 _primary_zf8n7_101 _bannerTitle_bag12_60","color":"rgb(255, 250, 250)","lineHeight":"21.6px","maxWidth":"none","padding":"0px","radius":"0px","size":"18px","text":"НОВАЯ НЕДЕЛЯ СТЕЙКИНГА","weight":"600"},{"background":"rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box","class":"_bannerActionContainer_bag12_85","color":"rgb(255, 250, 250)","lineHeight":"24px","maxWidth":"none","padding":"0px","radius":"0px","size":"16px","text":"Играй, стейкай — зарабатывайВперед","weight":"400"}],"images":[{"localURL":"assets/original/cdn.tgmrkt.io/images/banners/staking/v3/tiles.webp","style":"position: absolute; inset-inline-end: 0px; top: 0px; height: 100%; object-fit: contain; z-index: 1;"}]},{"route":"/play-hub","background":"linear-gradient(90deg, rgb(10, 10, 10) 0%, rgb(29, 29, 29) 100%) repeat scroll 0% 0% / auto padding-box border-box, rgb(10, 10, 10) none repeat scroll 0% 0% / auto padding-box border-box","height":65,"padding":"0px 18px","radius":"15px","content":[{"background":"rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box","class":"_text_zf8n7_1 _s1_zf8n7_77 _primary_zf8n7_101 _bannerTitle_bag12_60","color":"rgb(255, 250, 250)","lineHeight":"21.6px","maxWidth":"none","padding":"0px","radius":"0px","size":"18px","text":"PLAYHUB HOT STREAK","weight":"600"},{"background":"rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box","class":"_bannerActionContainer_bag12_85","color":"rgb(255, 250, 250)","lineHeight":"24px","maxWidth":"none","padding":"0px","radius":"0px","size":"16px","text":"100 мест и 30 000 GRAMВперед","weight":"400"}],"images":[{"localURL":"assets/original/cdn.tgmrkt.io/images/social-tasks/playhub-event-banner-sm.webp","style":"position: absolute; inset-inline-end: 0px; top: 0px; width: 100%; height: 100%; object-fit: cover; z-index: 0;"}]}];
  if(inTelegram){document.body.classList.add("in-telegram");telegram.ready?.();telegram.expand?.();telegram.setHeaderColor?.("#171717");telegram.setBackgroundColor?.("#171717");}

  function save(){try{localStorage.setItem(storageKey,JSON.stringify({favorites:state.favorites,cart:state.cart,orders:state.orders}));}catch{}}
  function toast(message){clearTimeout(toastTimer);el("toast").textContent=message;el("toast").classList.add("visible");toastTimer=setTimeout(()=>el("toast").classList.remove("visible"),3800);}
  function money(value,currency){if(value===null||value===""||!Number.isFinite(Number(value)))return "—";if(currency==="USD")return Number(value).toFixed(2);return Number(value).toLocaleString("en-US",{useGrouping:false,maximumFractionDigits:9});}
  function giftById(id){return catalog.find(g=>g.id===id)||cs2Item(id);}
  function canonicalRoute(route){return ({"/halloween/fright-fight":"/play-hub/fight-club","/halloween/grave-game":"/play-hub/squid-game","/event/staking":"/staking","/event/lucky-buy":"/lucky-buy","/profile/gram":"/profile","/profile/gram/locked":"/profile"})[route]||route;}
  function getRoute(){let route=location.hash.replace(/^#/,"")||"/";return canonicalRoute(route.startsWith("/")?route:"/");}
  const nativeScroll=new Map();
  function rememberNativeScroll(){if(!document.body.classList.contains("exact-active"))nativeScroll.set(state.route,window.scrollY);}
  function restoreNativeScroll(){if(!document.body.classList.contains("exact-active")&&!window.__MRKT_IS_CAPTURED?.(state.route))window.scrollTo({top:nativeScroll.get(state.route)||0,behavior:"instant"});}
  window.__MRKT_RESTORE_SCROLL=restoreNativeScroll;
  function navigate(route){route=canonicalRoute(route);closeSheet();if(state.route===route)return;rememberNativeScroll();state.route=route;location.hash=route;render();restoreNativeScroll();main.focus({preventScroll:true});}
  function activeNav(route){if(route.startsWith("/play-hub/"))return "/play-hub";if(route.startsWith("/orders"))return "/orders";if(/^\/(?:storage|my-gifts|profile)(?:\/|$)/.test(route))return "/my-gifts";if(route.startsWith("/halloween")||route.startsWith("/event/"))return "/halloween";if(nav.some(n=>n[0]===route))return route;if(route.startsWith("/gift/")||route.startsWith("/collection/")||route==="/favorites"||route==="/feed"||route==="/lucky-buy")return "/";return "";}
  function backRoute(){if(window.__MRKT_GAME_UI?.isRoute(state.route))return state.route.endsWith("/leaderboard")?state.route.replace(/\/leaderboard$/,""):"/play-hub";if(state.route.startsWith("/cart"))return state.cartOrigin||"/";if(state.route.startsWith("/event/"))return "/halloween";if(state.route==="/free-withdrawal"||state.route==="/history")return "/profile";return "/";}
  function localBack(){return inTelegram?"":`<button class="local-back" data-go="${backRoute()}">${icon("back")}Назад</button>`;}
  function defaultHeader(profile=false){
    const u=account.user,cartView=state.route.startsWith("/cart"),usd=cartView?state.route==="/cart/skins":state.category==="cs2";
    const name=u?.username||[u?.first_name,u?.last_name].filter(Boolean).join(" ")||"Гость";
    const initials=[u?.first_name,u?.last_name].filter(Boolean).map(x=>x[0]).join("").slice(0,2)||name.slice(0,1);
    const rawPhoto=u?.photo_url; const photo=account.verified&&typeof rawPhoto==="string"&&/^https:\/\//.test(rawPhoto)?rawPhoto:asset("guest-avatar.svg");
    return `<header class="app-header${cartView?" cart-header":""}"><div class="account-row"><button class="avatar" data-go="/profile" data-initials="${escape(initials.toUpperCase())}" aria-label="Открыть профиль">${photo?`<img src="${escape(photo)}" alt="Аватар Telegram" referrerpolicy="no-referrer">`:`<span>${escape(initials.toUpperCase())}</span>`}</button>${profile?`<button class="account-name" data-action="account">${escape(name)}</button>`:`<div class="balance-short"><button class="balance-short-value" data-action="balance" aria-label="Открыть ввод средств">${usd?'<span>$</span>':gram()}<span>${balanceValue(usd?"USD":"GRAM")}</span></button><button class="plus-circle" data-action="deposit" aria-label="Ввод средств">${icon("plus")}</button></div>`}<div class="header-actions"><button class="header-action" data-go="/halloween" aria-label="Halloween Fest">${pic("original/inline-svg/svg-cca1ac0de4d1a581.svg","","source-header-icon")}</button><button class="header-action" data-go="/staking" aria-label="Стейкинг">${pic("original/inline-svg/svg-579b33a066a3638f.svg","","source-header-icon")}</button><button class="header-action" data-action="news" aria-label="Новости">${pic("original/inline-svg/svg-bb84cec2553edc55.svg","","source-header-icon")}</button><button class="header-action" data-action="menu" aria-label="Меню">${pic("original/inline-svg/svg-22091470aba4148a.svg","","source-header-icon")}</button></div></div></header>`;
  }
  function renderNav(route=state.route,hidden=false,animate=true){
    const active=activeNav(route);navigation.hidden=hidden;
    if(!navigation.children.length)navigation.innerHTML=`<span class="nav-indicator" aria-hidden="true"></span>`+nav.map(([path,label],index)=>`<button class="nav-item${path==="/halloween"?" halloween-nav":""}" data-go="${path}"><span class="nav-original-icon original-mask" style="mask-image:url('${escape(asset(`original/inline-svg/${liveNav[index]}`))}')" aria-hidden="true"></span><span>${label}</span></button>`).join("");
    const buttons=[...navigation.querySelectorAll('.nav-item')],indicator=navigation.querySelector('.nav-indicator'),oldLeft=indicator.style.left;
    for(const button of buttons){const on=button.dataset.go===active;button.classList.toggle('active',on);if(on)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');}
    const selected=buttons.find(b=>b.dataset.go===active);indicator.hidden=!selected;if(selected){const left=selected.offsetLeft+selected.offsetWidth/2-17.5;indicator.style.left=left+'px';if(animate&&oldLeft&&oldLeft!==indicator.style.left&&window.__MRKT_MOTION.enabled())indicator.animate([{left:oldLeft},{left:left+'px'}],{duration:220,easing:'cubic-bezier(.2,.8,.2,1)'});}
  }
  window.__MRKT_UPDATE_NAV=renderNav;
  addEventListener('resize',()=>{const frame=document.querySelector('#exact-interface'),captured=document.body.classList.contains('exact-active');renderNav(captured?frame.dataset.route:location.hash.slice(1)||'/',captured&&Boolean(frame.contentDocument?.querySelector('[role=dialog]')),false);navigation.querySelector('.nav-indicator')?.getAnimations().forEach(a=>a.cancel());});
  function categorySwitcher(context="market"){
    const all=[["gifts","Подарки","svg-6d9cc1f97aecdeb4.svg"],["cs2","CS2-скины","svg-5be8f8d030b50443.svg"],["packs","Наборы","svg-cc6d5d7233ddb729.svg"],["channels","Каналы","svg-9c7e879a3f3f7233.svg"]];
    const tabs=context==="orders"?all.slice(0,2):all;
    return `<div class="page-pad common-category-pad"><div class="category-row"><div class="category-tabs ${context}-categories" aria-label="Категории">${tabs.map(([id,label,image])=>`<button class="category-tab${state.category===id?" active":""}" data-category="${id}" aria-label="${label}">${pic(`original/inline-svg/${image}`)}${state.category===id?`<span>${label}</span>`:""}</button>`).join("")}</div>${context==="orders"?"":`<button class="icon-button cart-button" data-action="cart" aria-label="Корзина">${pic("original/inline-svg/svg-a3525823c2f93069.svg")}</button>`}</div></div>`;
  }
  function searchTools(feed=true){
    const isOrders=state.route==="/orders";
    const special=isOrders?["Можно стейкать"]:["Пре-Маркет","Lucky Buy",...(state.route==="/my-gifts"?[]:["Кешбэк Lucky Buy"]),"Неулучшенные","Скрафченные","Передаваемые","Можно стейкать"];
    return `<div class="catalog-tools${isOrders?" orders-tools":""}">${isOrders?"":`<div class="search-row"><label class="search-field">${icon("search")}<input id="catalog-search" type="search" aria-label="Поиск по названию NFT или номеру" placeholder="${state.category==="packs"?"Поиск по названию коллекции":"Поиск по названию NFT / номеру"}" value="${escape(state.query)}"><button class="search-clear" data-action="clear-search" aria-label="Очистить поиск" ${state.query?"":"hidden"}>${icon("x")}</button></label>${feed?`<button class="feed-button" data-go="/feed">${pic("original/inline-svg/svg-1c739e076dc4c29d.svg","","source-feed-icon")}Feed</button>`:""}</div>`}<div class="filter-row"><button class="filter-trigger${filters.some(n=>state.filters[n].length)?" selected":""}" data-action="all-filters" aria-label="Все фильтры">${icon("filters")}</button><div class="filter-scroll">${filters.map(name=>`<div class="filter-chip${state.filters[name].length?" selected":""}"><button class="filter-open" data-filter="${name}">${state.filters[name].length?`<span class="count">${state.filters[name].length}</span>`:""}<span>${name}</span>${state.filters[name].length?"":icon("down")}</button>${state.filters[name].length?`<button class="remove-filter" data-reset-filter="${name}" aria-label="Сбросить фильтр ${name}">${icon("x")}</button>`:""}</div>`).join("")}<button class="filter-chip${state.min!==""||state.max!==""?" selected":""}" data-filter="Цена">Цена${icon("down")}</button>${special.map(s=>`<button class="filter-chip extra-chip${state.chips.includes(s)?" selected":""}" data-chip="${s}">${s==="Lucky Buy"?"♣ ":""}${s}</button>`).join("")}</div><button class="sort-trigger" data-action="sort" aria-label="Сортировать">${icon("sort")}</button></div></div>`;
  }
  function filteredGifts(){
    let list=catalog.filter(g=>!state.query||`${g.name} ${g.number}`.toLowerCase().includes(state.query.trim().toLowerCase()));
    list=list.filter(g=>filters.every(f=>!state.filters[f].length||(f==="Модель"?(state.filters[f].includes(g.name+"::"+g.model)||state.filters[f].includes(g.model)):state.filters[f].includes(f==="NFT"?g.name:f==="Фон"?g.background:g.symbol))));
    if(state.min!=="")list=list.filter(g=>+g.price>=+state.min);
    if(state.max!=="")list=list.filter(g=>+g.price<=+state.max);
    for(const chip of state.chips){
      if(chip==="Lucky Buy"||chip==="Кешбэк Lucky Buy")list=list.filter(g=>g.lucky);
      else if(chip==="Неулучшенные")list=list.filter(g=>g.unupgraded);
      else if(chip==="Скрафченные")list=list.filter(g=>g.crafted);
      else if(chip==="Пре-Маркет")list=list.filter(g=>g.preMarket);
      else if(chip==="Можно стейкать")list=list.filter(g=>g.stakeable||g.lucky);
      else if(chip==="Передаваемые")list=list.filter(g=>!g.locked);
    }
    if(state.sort==="low")list.sort((a,b)=>+a.price-+b.price);
    if(state.sort==="high")list.sort((a,b)=>+b.price-+a.price);
    if(state.sort==="number")list.sort((a,b)=>a.number-b.number);
    return list;
  }
  function nftActions(g){
    if(g.read_only)return "";
    if(g.currency==="USD")return "";
    const bakedLucky=["lol-pop","big-year-telegramium","big-year-constructor","big-year-1984"].includes(g.id)?" baked-lucky":"",bakedStake=["lol-pop"].includes(g.id)?" baked-stake":"";
    return `<div class="nft-actions${bakedLucky}${bakedStake}"><button class="nft-quick-button nft-lucky-button" data-lucky-id="${escape(g.id)}" aria-label="Lucky Buy: ${escape(g.name)} #${escape(g.number)}"><span class="nft-quick-icon original-mask" style="mask-image:url('${escape(asset("original/inline-svg/svg-d710e71bf9fa5b2e.svg"))}')" aria-hidden="true"></span></button><button class="nft-quick-button nft-staking-button" data-go="/staking" aria-label="Стейкинг подарков"><span class="nft-quick-icon original-mask" style="mask-image:url('${escape(asset("original/inline-svg/svg-579b33a066a3638f.svg"))}')" aria-hidden="true"></span></button></div>`;
  }
  function giftCard(g){if(g.read_only)return `<article class="gift-card public-market-card"><div class="gift-art"><div class="gift-image">${g.image?pic(g.image,g.name,'','loading="lazy" decoding="async" referrerpolicy="no-referrer"'):'<span class="market-no-art">'+icon('gift')+'</span>'}</div></div><div class="gift-meta"><h3>${escape(g.name)}</h3><p class="gift-number">#${escape(g.number??'—')}</p><button class="gift-buy" data-up-live-gift="${escape(g.id)}" aria-label="Подробнее: ${escape(g.name)} #${escape(g.number??'')}">${money(g.price)} <small>TON</small></button></div></article>`;const inCart=state.cart.includes(g.id);return `<article class="gift-card"><div class="gift-art${g.exactImage?" exact":""}"><div class="gift-image">${pic(g.image,g.name)}</div>${nftActions(g)}${g.exactImage?"":`<button class="gift-heart${state.favorites.includes(g.id)?" selected":""}" data-favorite="${escape(g.id)}" aria-label="${state.favorites.includes(g.id)?"Убрать из избранного":"Добавить в избранное"}" aria-pressed="${state.favorites.includes(g.id)}">${icon("heart")}</button>`}</div><div class="gift-meta"><h3>${escape(g.name)}</h3><p class="gift-number">#${escape(g.number)}</p><div class="gift-controls"><button class="gift-buy" data-buy="${escape(g.id)}">${g.currency==="USD"?"$":gram()}${money(g.price,g.currency)}</button><button class="gift-cart icon-button${inCart?" in-cart":""}" aria-pressed="${inCart}" data-cart-add="${escape(g.id)}" aria-label="В корзину: ${escape(g.name)}">${inCart?icon("check"):pic("ui/cart.png")}</button></div></div></article>`;}
  function orderCard(g){return `<article class="order-card"><div class="order-art">${pic("ui/orders-placeholder.png")}<div class="order-price">${gram()}<span>${money(g.price,g.currency)}</span></div><button class="card-info" data-action="order-info" aria-label="Информация об ордерах">${icon("info")}</button></div><div class="order-actions"><button class="secondary" data-action="all-orders">Все ордеры</button><button class="primary" data-sell="${g.id}">Быстрая продажа</button></div></article>`;}
  function empty(title,text,action=""){return `<section class="empty-state">${icon("bag")}<h2>${title}</h2><p>${text}</p>${action}</section>`;}
  function renderCatalogResults(){
    const target=el("catalog-results");if(!target)return;
    target.parentElement.querySelectorAll(".snapshot-note,.market-more").forEach(note=>note.remove());
    let list=filteredGifts();
    if(state.category==="cs2"){target.className="";target.innerHTML=window.__MRKT_UPDATES.unavailable("skins");return;}
    if(state.category==="channels"){window.__MRKT_UPDATES.renderChannels(target);return;}
    if(window.__MRKT_MARKET?.state.connected)main.querySelector(".bulk-buy")?.remove();
    if(state.category==="packs"){
      const matching=bundles.filter(b=>{
        if(state.query&&!`${b.name} ${b.group} ${b.numbers.join(" ")} ${b.nftNames.join(" ")}`.toLowerCase().includes(state.query.trim().toLowerCase()))return false;
        if(state.filters.NFT.length&&!b.nftNames.some(name=>state.filters.NFT.includes(name)))return false;
        if(state.filters.Модель.length&&!b.models.some(model=>state.filters.Модель.includes(model)))return false;
        if(state.filters.Фон.length||state.filters.Символ.length||state.chips.length)return false;
        return (state.min===""||b.price>=Number(state.min))&&(state.max===""||b.price<=Number(state.max));
      });
      if(state.sort==="low")matching.sort((a,b)=>a.price-b.price);else if(state.sort==="high")matching.sort((a,b)=>b.price-a.price);
      target.className="bundle-market-list";target.innerHTML=matching.length?matching.map(bundleCard).join(""):empty("Ничего не найдено","Измените поиск коллекции.");return;
    }
    target.className=list.length?"catalog-grid":"";
    if(!window.__MRKT_MARKET?.state.connected&&!source("catalog")){target.className="";target.innerHTML=empty("Источник каталога не подключён","Подтверждённый снимок товаров и цен пока не добавлен.");return;}
    if(!list.length){target.innerHTML=snapshotNote("catalog")+empty("Ничего не найдено","Попробуйте изменить поиск или сбросить фильтры.",'<button class="secondary" data-action="reset-filters">Сбросить фильтры</button>');return;}
    if(state.view==="orders"&&state.category==="gifts"){const realOrders=sourceItems("orders");target.innerHTML=realOrders.length?realOrders.map(orderCard).join(""):empty("Источник ордеров не подключён","Ордеры не создаются из товаров каталога.");return;}
    target.innerHTML=list.map(giftCard).join("");
    if(window.__MRKT_MARKET?.state.connected&&window.__MRKT_MARKET.state.next!==null)target.insertAdjacentHTML("afterend",'<button class="secondary market-more" data-market-more>Загрузить ещё</button>');
    target.insertAdjacentHTML("beforebegin",snapshotNote(state.category==="cs2"?"skins":"catalog"));
  }
  function market(){
    const tabs=[["gifts","Подарки","gift-tab.png"],["cs2","CS2-скины","cs2.png"],["stars","Звёзды","star-tab.png"],["packs","Коллекции","orders.png"],["channels","Каналы","telegram-tab.png"]];
    return `<div class="page-pad"><div class="promo-carousel" id="promo-carousel" aria-label="События">${banners.map(renderBanner).join("")}</div><div class="category-row"><div class="category-tabs" aria-label="Категории">${tabs.map(([id,label,img])=>`<button class="category-tab${state.category===id?" active":""}" data-category="${id}" aria-label="${label}">${id==="packs"?icon("collection"):pic(`ui/${img}`)}${state.category===id?`<span>${label}</span>`:""}</button>`).join("")}</div><button class="icon-button cart-button" data-action="cart" aria-label="Корзина">${pic("ui/cart.png")}${state.cart.length?`<span class="cart-count">${state.cart.length}</span>`:""}</button></div></div>${state.category==="stars"?starsPane():(["channels","cs2"].includes(state.category)?"":searchTools())+`<div id="catalog-results"></div>`}${state.category==="gifts"&&!window.__MRKT_MARKET?.state.connected?`<button class="bulk-buy" data-action="cart">${icon("bag")}Купить оптом</button>`:""}`;
  }
  function renderBanner(banner,index){
    const title=banner.content?.[0],action=banner.content?.[1];
    const actionText=action?.text||"",cta=actionText.match(/Вперед!?$/)?.[0]||"";
    const subtitle=cta?actionText.slice(0,-cta.length):actionText;
    const titleStyle=title?`color:${title.color};font-size:${title.size};line-height:${title.lineHeight};font-weight:${title.weight}`:"";
    return `<div class="promo-slide" data-banner-index="${index}" aria-label="${escape(title?.text||"")}" style="background:${escape(banner.background)};border-radius:${escape(banner.radius)};padding:${escape(banner.padding)}"><span class="banner-images" aria-hidden="true">${banner.images.map(image=>pic(image.localURL,"","banner-image",`style="${escape(image.style)}"`)).join("")}</span><span class="banner-copy"><span class="banner-title" style="${escape(titleStyle)}">${escape(title?.text)}</span><span class="banner-action"><span class="banner-subtitle">${escape(subtitle)}</span>${cta?`<button class="banner-cta" data-go="${escape(banner.route)}">${escape(cta)}</button>`:""}</span></span></div>`;
  }
  function batBackground(){const bat='<path d="M0 53C23 49 30 18 47 0c-2 34 21 46 34 40l6-20 9 14 10-2 8-15 7 23c17 8 41-7 43-40 17 22 21 43 46 53-31-2-40 11-42 24-19-14-32-5-42 16-13-20-30-24-47-12-7-14-21-24-45-15Z"/>';return `<div class="event-bats" aria-hidden="true">${Array.from({length:6},()=>`<svg viewBox="0 0 210 100">${bat}</svg>`).join("")}</div>`;}
  function halloween(){return `<section class="halloween-page">${batBackground()}<div class="halloween-hero"><div class="event-timer"><span class="event-dot"></span><span id="event-timer">Срок события не подключён</span></div><h1>HALLOWEEN<br>FEST</h1><p class="halloween-description">ИГРАЙТЕ, ТОРГУЙТЕ И УЧАСТВУЙТЕ В ПРАЗДНИЧНЫХ АКТИВНОСТЯХ, ЧТОБЫ ПОБОРОТЬСЯ ЗА ЧАСТЬ ПРИЗОВОГО ФОНДА В 85 000 GRAM.</p><div class="prize-row">${gram()}<strong>85 000</strong><span>призовой фонд</span></div></div><div class="event-list">${events.map(e=>`<button class="event-card" style="--edge:${e.color}" data-go="/event/${e.id}">${pic(`source_crops/${e.id}.png`)}<span class="event-copy"><strong>${e.name}</strong><span>${e.description}</span></span>${icon("right")}</button>`).join("")}</div><section class="event-collections"><h2>КОЛЛЕКЦИИ ИВЕНТА</h2><div class="collection-carousel" aria-label="Коллекции ивента">${collections.slice(0,17).map(g=>`<button class="collection-card" data-go="/collection/${g.id}">${icon("external")}${pic(g.image,g.name)}<span>${g.name}</span></button>`).join("")}</div></section></section>`;}
  function gameHubMarkup(){return `<section class="video-gamehub"><div class="video-game-banner">${pic("original/cdn.tgmrkt.io/images/banners/redo-lootbox/asset-031c161e3201.webp","")}<h2>ВЫБЕЙ REDO</h2><div><span>ЗА 1 BOOSTER COIN</span><button data-repair-game-promo>Вперед!</button></div>${pic("original/cdn.tgmrkt.io/images/banners/redo-lootbox/art.webp","","video-game-promo-art")}</div><button class="video-referrals" data-repair-referrals><span>Рефералы</span><strong>${gram()} 0</strong></button><div class="video-game-tabs" role="tablist" aria-label="Игры"><button role="tab" aria-selected="true" data-game-tab="pvp">⚔ PvP</button><button role="tab" aria-selected="false" data-game-tab="solo">✣ Соло</button></div><div class="video-game-grid">${[["spire","SPIRE","Последний подарок забирает всё"],["squid","SQUID GAME","Победить может каждый"],["fight","FIGHT CLUB","Колесо выберет победителя"]].map(([id,title,copy])=>`<button class="video-game-card ${id}" data-repair-game="${title}">${pic(`ui/game-${id}.webp`,"")}<strong>${title}</strong><span>${copy}</span></button>`).join("")}</div><p class="video-games-empty" hidden>Пока нет игр</p></section>`;}
  window.__MRKT_GAMEHUB=gameHubMarkup;
  function unavailable(){return window.__MRKT_UPDATES.unavailable();}
  function historyRow(){return '<div class="history-empty">Источник истории не подключён</div>';}
  function profile(){return `<section class="profile-page"><div class="metrics"><button class="metric" data-action="points">${pic("ui/mrkt-points.png")}<div><strong>${balanceValue("points")}</strong><span>MRKT Points</span></div></button><button class="metric" data-action="cards">${pic("ui/lucky-cards.png")}<div><strong>${balanceValue("cards")}</strong><span>Lucky Cards</span></div></button></div><div class="profile-tabs"><button data-profile-tab="gifts" class="${state.profileTab==="gifts"?"active":""}">${pic("ui/gift.png")}Gifts</button><button data-profile-tab="cs2" class="${state.profileTab==="cs2"?"active":""}">${pic("ui/cs2.png")}CS2-скины</button></div><button class="withdraw-banner" data-go="/free-withdrawal" aria-label="Бесплатный вывод подарков">${pic("banners/banner-free-withdrawal.png","БЕСПЛАТНЫЙ ВЫВОД ПОДАРКОВ!")}</button><div class="balance-panel"><button class="balance-main" data-action="balance">${gram()}<strong>${balanceValue(state.profileTab==="gifts"?"GRAM":"USD")}</strong><span>Баланс ${state.profileTab==="gifts"?"GRAM":"USD"}</span></button><div class="balance-stats"><button class="balance-stat" data-go="/orders">${icon("receipt")}Ордера<strong>${state.orders.length}</strong></button><button class="balance-stat" data-go="/offers">${icon("percent")}Офферы<strong>${myOffers.filter(o=>o.status==="active").length}</strong></button></div></div><section class="panel"><h2 class="panel-title">БЫСТРЫЕ ДЕЙСТВИЯ</h2><div class="quick-actions"><button data-action="withdraw">${icon("arrowdown")}Вывод</button><button data-action="deposit">${icon("plus")}Ввод</button><button data-action="add-gift">${icon("gift")}Добавить</button></div></section><section class="panel"><button class="panel-title" data-go="/history">ИСТОРИЯ${icon("right")}</button>${historyRow()}</section></section>`;}
  function withdrawal(){return `<section class="withdraw-page"><h1 class="withdraw-title">БЕСПЛАТНЫЙ<br>ВЫВОД<br>ПОДАРКОВ</h1><button class="icon-button withdraw-info" data-action="withdraw-info" aria-label="Условия бесплатного вывода">${icon("info")}</button><ul class="withdraw-conditions"><li><span><span class="yellow">БЕСПЛАТНЫЙ ВЫВОД</span>, ЕСЛИ ПОДАРОК <span class="yellow">РАЗМЕЩЕН НА ПРОДАЖЕ</span> КАК МИНИМУМ <span class="yellow">1 ДЕНЬ</span></span></li><li><span>ВЫВОД СО <span class="yellow">СКИДКОЙ 50%</span>, ЕСЛИ ПОДАРОК <span class="yellow">В ХРАНИЛИЩЕ</span> КАК МИНИМУМ <span class="yellow">1 ДЕНЬ</span></span></li></ul><div class="withdraw-gift"><div class="withdraw-gift-inner"><div class="gift-progress-count"><span class="yellow">0</span> / 1 ${icon("gift")}</div><div class="pepe-carousel" id="pepe-carousel">${pic(state.withdrawSlide?"pink-purse.webp":"optimized/plush-pepe.webp",state.withdrawSlide?"Pretty Posy":"Plush Pepe")}</div><h2>${state.withdrawSlide?"Pretty Posy":"Plush Pepe"}</h2><div class="carousel-dots"><button data-slide="0" class="${state.withdrawSlide===0?"active":""}" aria-label="Plush Pepe" aria-pressed="${state.withdrawSlide===0}"></button><button data-slide="1" class="${state.withdrawSlide===1?"active":""}" aria-label="Pretty Posy" aria-pressed="${state.withdrawSlide===1}"></button></div><div class="progress-track"><span style="width:0%"></span></div><p class="withdraw-status">Ожидание вашего подарка</p></div><button class="primary" data-action="add-gift">${icon("gift")}Добавить подарок</button></div></section>`;}
  function heading(title,button=""){return `<div class="page-heading"><h1>${title}</h1>${button}</div>`;}
  function row(g,action,extra=""){return `<button class="list-row" ${action}>${pic(g.image,g.name)}<div><strong>${escape(g.name)}</strong><small>${escape(extra||`#${g.number}`)}</small></div><span class="row-end">${gram()}${money(g.price,g.currency)}</span></button>`;}
  function ordersPage(){const show=state.ordersTab==="all"?sourceItems("orders"):state.orders.map(o=>({...giftById(o.giftId),price:o.price,localId:o.id,quantity:o.quantity})).filter(g=>g.id);return `<section class="page-pad">${heading("Ордеры",`<button class="icon-button" data-action="order-info" aria-label="Об ордерах">${icon("info")}</button>`)}<div class="segmented"><button data-orders-tab="all" class="${state.ordersTab==="all"?"active":""}">Все ордеры</button><button data-orders-tab="mine" class="${state.ordersTab==="mine"?"active":""}">Мои ордеры${state.orders.length?` (${state.orders.length})`:""}</button></div><div class="toolbar"><span style="color:#888;font-size:.85rem">GRAM ${gram()}</span><button class="primary" data-action="create-order">${icon("plus")}Создать ордер</button></div><div class="table-labels"><span>Коллекция</span><span>Количество</span><span>Цена</span></div>${state.ordersTab==="all"?snapshotNote("orders"):""}${show.length?show.map(g=>row(g,state.ordersTab==="all"?`data-sell="${escape(g.id)}"`:`data-local-order="${escape(g.localId)}"`,state.ordersTab==="all"?`${escape(g.model||"")} · ${escape(g.quantity??"—")} шт.`:`${escape(g.quantity)} шт. · Локальный черновик`)).join(""):empty(state.ordersTab==="all"&&!source("orders")?"Источник ордеров не подключён":"Ордеров пока нет",state.ordersTab==="all"?"Снимок реальных ордеров пока не добавлен.":"Здесь отображаются только ваши локальные черновики, не опубликованные на маркете.")}</section>`;}
  function tasks(){const group=state.taskTab;const taskItems=sourceItems("tasks").filter(t=>t.group===group);return `<section class="page-pad">${heading("Задания")}<div class="segmented">${[["hot","Горячие"],["daily","Ежедневные"],["common","Общие"]].map(([id,t])=>`<button data-task-tab="${id}" class="${group===id?"active":""}">${t}</button>`).join("")}</div>${snapshotNote("tasks")}${taskItems.length?taskItems.map(t=>`<button class="task-card" data-go="${escape(t.route||"/social-tasks")}">${t.image?pic(t.image):""}<span><strong>${escape(t.name)}</strong><small>${escape(t.sub)}</small></span>${icon("right")}</button>`).join(""):empty(source("tasks")?"Заданий пока нет":"Источник заданий не подключён","Снимок доступных заданий и прогресса пока не добавлен.")}</section>`;}
  function storage(){
    const data=source("storage"),listed=Array.isArray(data?.listed)?data.listed:[],unlisted=Array.isArray(data?.unlisted)?data.unlisted:[];
    const controls=`<div class="storage-tab-row"><div class="storage-tabs"><button data-storage-tab="sale" class="${state.storageTab==="sale"?"active":""}">На продаже (${data?listed.length:"—"})</button><button data-storage-tab="storage" class="${state.storageTab==="storage"?"active":""}">Хранилище (${data?unlisted.length:"—"})</button></div><button class="storage-report" data-action="storage-info" aria-label="Пожаловаться">${pic("original/inline-svg/svg-ba5066532c77b394.svg")}</button></div>`;
    let content=empty("Источник подарков не подключён","Снимок хранилища пока не добавлен.");
    if(data){
      const gifts=state.storageTab==="sale"?listed:unlisted;
      if(gifts.length)content=`<div class="catalog-grid">${gifts.map(giftCard).join("")}</div>`;
      else if(state.storageTab==="sale")content=`<section class="storage-empty storage-empty-listed">${pic("original/inline-svg/svg-9cc908589a632464.svg","","storage-empty-symbol")}<h2>Нет подарков в продаже</h2><p>Выставьте предметы на продажу — они появятся здесь.</p><button class="secondary" data-storage-tab="storage">Посмотреть подарки</button></section>`;
      else content=`<section class="storage-empty storage-empty-unlisted"><h2>Нет доступных подарков</h2><p>Выберите самый удобный способ получить подарок.</p><button class="storage-details" data-action="storage-info">Подробнее <span>здесь.</span> ${pic("original/inline-svg/svg-24087b566a7636e9.svg")}</button><div class="storage-empty-actions"><div>${pic("original/inline-svg/svg-e6d96ea9c5ce8e5e.svg")}<button class="secondary" data-go="/play-hub">Выиграть</button></div><div>${pic("original/inline-svg/svg-95514d43c57af85a.svg")}<button class="secondary" data-action="show-gifts">Купить</button></div><div>${pic("original/inline-svg/svg-f3092b0b5d2f5155.svg")}<button class="secondary" data-action="add-gift">Загрузить</button></div></div></section>`;
    }
    return `${categorySwitcher("storage")}${searchTools()}${controls}${content}`;
  }
  function feed(){return `<section class="page-pad">${heading("Feed")}<div class="feed-top"><span><span class="live-dot"></span>Предложения</span><button data-action="refresh-feed" aria-label="Обновить ленту">${icon("clock")}</button></div>${publicOffers.length?publicOffers.map(offerRow).join(""):empty("Событий пока нет","Здесь появятся предложения вашего приложения.")}</section>`;}
  function favorites(){const list=state.favorites.map(giftById).filter(Boolean);return `${localBack()}<section class="page-pad">${heading("Избранное")}</section>${list.length?`<div class="catalog-grid" style="padding-top:0">${list.map(giftCard).join("")}</div>`:empty("Сохранённых подарков пока нет","Нажмите на сердечко в карточке подарка.",'<button class="secondary" data-action="show-gifts">Открыть каталог</button>')}`;}
  function collectionPage(id){const g=giftById(id);if(!g)return notFound();const list=catalog.filter(x=>x.name===g.name);return `${localBack()}<section class="page-pad">${heading(escape(g.name))}</section><div class="catalog-grid" style="padding-top:.3rem">${(list.length?list:[g]).map(giftCard).join("")}</div>`;}
  function giftPage(id){const g=giftById(id);return g?window.__MRKT_UPDATES.giftPage(g):notFound();}
  function eventPage(id){const e=events.find(e=>e.id===id);if(!e)return notFound();return `${localBack()}<section class="event-detail"><div class="event-detail-illustration">${pic(`enhanced/${e.id}.png`,e.name)}</div><h1>${e.name}</h1><p>${e.description}</p><section class="panel"><h2>HALLOWEEN FEST</h2><p>Общий призовой фонд события — 85 000 GRAM.</p><p style="margin-top:.5rem">${e.id==="staking"?"Выберите подарок из хранилища, чтобы открыть доступные действия.":e.id==="trick-or-trade"?"Посмотрите коллекции события и предложения в маркете.":e.id==="lucky-buy"?"Откройте каталог подарков и выберите коллекцию.":"Игры доступны через раздел «Игровой хаб»."}</p></section><button class="primary" data-go="${e.route}">${e.action}${icon("right")}</button><button class="secondary" data-go="/halloween" style="width:100%;margin-top:.5rem">К событию</button></section>`;}
  function notFound(){return `${localBack()}${empty("Страница не найдена","Вернитесь в маркет, чтобы продолжить.",'<button class="primary" data-go="/">В маркет</button>')}`;}
  function gameAdapter(){return {asset,pic,icon,gram,escape,navigate,showSheet,closeSheet,funds(amount){state.fundingAmount=String(amount);funding("deposit");},catalog(background){state.category="gifts";if(background)state.filters["Фон"]=[background];navigate("/");}};}
  function render(){
    const r=state.route;
    window.__MRKT_GAME_UI?.destroy();
    if(window.__MRKT_IS_CAPTURED?.(r))return;
    const motionBefore=window.__MRKT_MOTION.captureCurrent();
    el("app").classList.toggle("cart-view",r.startsWith("/cart"));
    const noHeader=window.__MRKT_GAME_UI?.isRoute(r)||r==="/halloween"||r==="/free-withdrawal"||r.startsWith("/event/")||r.startsWith("/gift/");
    header.innerHTML=noHeader?((r==="/halloween"||r==="/free-withdrawal")?localBack():""):defaultHeader(r==="/profile");
    if(r.startsWith("/play-hub"))main.innerHTML=unavailable();
    else if(/^\/(storage|orders|profile)\/skins(?:\/|$)/.test(r))main.innerHTML=window.__MRKT_UPDATES.unavailable("skins");
    else if(r==="/")main.innerHTML=market();
    else if(r==="/halloween")main.innerHTML=halloween();
    else if(r==="/cart"||r==="/cart/skins")main.innerHTML=cartPage();
    else if(r==="/play-hub")main.innerHTML=unavailable();
    else if(r==="/profile")main.innerHTML=profile();
    else if(r==="/offers")main.innerHTML=offersPage();
    else if(r==="/lucky-buy")main.innerHTML=window.__MRKT_UPDATES.luckyPage();
    else if(r.startsWith("/offer/"))main.innerHTML=offerPage(r.split("/")[2]);
    else if(r==="/free-withdrawal")main.innerHTML=withdrawal();
    else if(r==="/orders")main.innerHTML=ordersPage();
    else if(r==="/social-tasks")main.innerHTML=tasks();
    else if(r==="/my-gifts")main.innerHTML=storage();
    else if(r==="/feed")main.innerHTML=`${localBack()}${feed()}`;
    else if(r==="/history")main.innerHTML=`${localBack()}<section class="page-pad">${heading("История")}${historyRow()}</section>`;
    else if(r==="/favorites")main.innerHTML=favorites();
    else if(r.startsWith("/collection/"))main.innerHTML=collectionPage(r.split("/")[2]);
    else if(r.startsWith("/gift/"))main.innerHTML=giftPage(r.split("/")[2]);
    else if(r.startsWith("/event/"))main.innerHTML=eventPage(r.split("/")[2]);
    else main.innerHTML=notFound();
    if(r==="/")renderCatalogResults();
    renderNav();updateTimer();
    if(window.__MRKT_GAME_UI?.isRoute(r)&&!r.startsWith("/play-hub"))window.__MRKT_GAME_UI.mount(main,gameAdapter());
    window.__MRKT_MOTION.enter(document,motionBefore);
    const carousel=el("promo-carousel");if(carousel)carousel.scrollLeft=bannerIndex*carousel.clientWidth;
    document.title=(window.__MRKT_GAME_UI?.isRoute(r)?({"fight-club":"Fight Club","squid-game":"Squid Game","spire":"Spire"}[r.split("/")[2]]+(r.endsWith("/leaderboard")?" · Лидерборд":"")):r==="/halloween"?"Halloween Fest":r==="/profile"?"Профиль":r==="/free-withdrawal"?"Бесплатный вывод":nav.find(n=>n[0]===r)?.[1]||"Подарки")+" · Независимый каталог · сохранённые данные";
    if(inTelegram){if(r==="/")telegram.BackButton?.hide?.();else telegram.BackButton?.show?.();}
  }

  function updateTimer(){const target=el("event-timer");if(!target)return;if(endAt===null){target.textContent="Срок события не подключён";return;}const secs=Math.max(0,Math.floor((endAt-Date.now())/1000));const d=Math.floor(secs/86400),h=Math.floor(secs%86400/3600),m=Math.floor(secs%3600/60),s=secs%60;target.textContent=`${d} ДНЕЙ ${[h,m,s].map(n=>String(n).padStart(2,"0")).join(":")}`;}
  function stopLucky(){closeLuckyResult();lucky.sequence++;clearTimeout(lucky.timer);clearTimeout(lucky.confettiTimer);lucky.animation?.cancel();lucky.animation=null;lucky.resolving=false;}
  function closeSheet(){sheet.__pickerDestroy?.();sheet.__pickerDestroy=null;stopLucky();if(sheet.open)sheet.close();state.sheet=null;document.body.classList.remove("dialog-open");if(lastFocus?.isConnected)lastFocus.focus({preventScroll:true});}
  function showSheet(title,body,center=false){sheet.__pickerDestroy?.();sheet.__pickerDestroy=null;stopLucky();lastFocus=document.activeElement;sheet.className=`sheet${center?" modal-center":""}`;sheet.innerHTML=`<div class="sheet-handle"></div><div class="sheet-heading"><h2 id="sheet-title">${title}</h2><button class="icon-button" data-action="close-sheet" aria-label="Закрыть окно">${icon("x")}</button></div><div class="sheet-content">${body}</div>`;if(!sheet.open)sheet.showModal();sheet.scrollTop=0;sheet.querySelector(".sheet-content").scrollTop=0;document.body.classList.add("dialog-open");window.__MRKT_MOTION.sheet(sheet);}
  function optionsFor(name){
    const selected=state.draft?.filters?.NFT||state.filters.NFT;
    const items=selected.length?catalog.filter(g=>selected.includes(g.name)):catalog;
    if(name==="NFT")return [...new Set(catalog.map(g=>g.name))].sort((a,b)=>a.localeCompare(b));
    const key=name==="Модель"?"model":name==="Фон"?"background":"symbol";
    return [...new Set(items.map(g=>g[key]).filter(Boolean))];
  }
  function filterOptions(name){
    if(name==="Модель"&&!state.draft.filters.NFT.length)return '<div class="filter-required">Сначала выберите NFT</div>';
    return optionsFor(name).filter(t=>t.toLowerCase().includes(state.filterSearch.toLowerCase())).map(value=>{
      const items=catalog.filter(g=>name==="NFT"?g.name===value:name==="Модель"?g.model===value:name==="Фон"?g.background===value:g.symbol===value);
      const g=items[0],selected=state.draft.filters[name].includes(value),floor=g?(name==="NFT"&&g.floor?g.floor:Math.min(...items.map(x=>+x.price))):0;
      const tile=name==="Фон"?`<span class="color-tile" style="background:${backgroundColor(value)}"></span>`:g?pic(g.image):"";
      return `<button class="option${selected?" selected":""}" data-filter-value="${escape(value)}" data-filter-name="${name}"><span class="option-check">${selected?icon("check"):""}</span>${tile}<span class="option-name">${escape(value)}</span><span class="floor-value">${gram()}${money(floor)}</span>${name==="NFT"?`<span class="turnover-value">${g?.turnover?money(g.turnover):"—"}</span>`:""}</button>`;
    }).join("");
  }
  function openFilter(name){
    state.sheet=`filter:${name}`;state.draft={filters:structuredClone(state.filters),min:state.min,max:state.max,view:state.view};state.filterSearch="";
    if(name==="Цена"){renderFilter(name);return;}
    showSheet(name==="NFT"?"Коллекция":name,"");
    window.__MRKT_MOUNT_PICKER(sheet,{field:name,collections:state.filters.NFT,selected:state.filters[name],onClose:closeSheet,onChooseCollection:()=>openFilter("NFT"),onApply:values=>{
      const changed=name==="NFT"&&JSON.stringify(values)!==JSON.stringify(state.filters.NFT);
      state.filters[name]=values;if(changed){state.filters.Модель=[];state.filters.Фон=[];state.filters.Символ=[];}
      closeSheet();render();
    }});
  }
  function renderFilter(name){
    const price=name==="Цена";
    showSheet(name==="NFT"?"Коллекция":name,`${price?`<div class="price-inputs"><label>${gram()}<input id="price-min" type="number" min="0" max="100000" step="any" placeholder="0" aria-label="Минимальная цена" value="${escape(state.draft.min)}"></label><label>${gram()}<input id="price-max" type="number" min="0" max="100000" step="any" placeholder="100000" aria-label="Максимальная цена" value="${escape(state.draft.max)}"></label></div><div class="dual-range"><input id="range-min" type="range" min="0" max="100000" value="${state.draft.min||0}" aria-label="Минимальная цена на шкале"><input id="range-max" type="range" min="0" max="100000" value="${state.draft.max||100000}" aria-label="Максимальная цена на шкале"></div><div id="price-error" class="form-error" role="alert"></div>`:`<label class="filter-search-field">${icon("search")}<input id="filter-search" class="sheet-search" type="search" placeholder="Поиск" aria-label="Поиск значений фильтра"></label>${name==="NFT"?'<div class="filter-table-head"><button data-action="select-all-nft">□ Выбрать все</button><span>Флор↕</span><span>Оборот↕</span></div>':""}<div class="option-list" id="filter-options">${filterOptions(name)}</div>`}<div class="sheet-footer"><button class="secondary" data-clear-draft="${name}">Сбросить</button><button class="primary" data-apply-filter="${name}">Показать результаты</button></div>`);
    sheet.classList.add(price?"price-sheet":"filter-sheet");if(name==="Модель"&&!state.draft.filters.NFT.length)sheet.classList.add("needs-nft");
  }
  function allFilters(){state.sheet="all-filters";state.draft={filters:structuredClone(state.filters),min:state.min,max:state.max,view:state.view};showSheet("Фильтры",`<div class="filter-group-title">Вид каталога</div><div class="segmented"><button data-view="orders" class="${state.view==="orders"?"active":""}">Ордеры</button><button data-view="gifts" class="${state.view==="gifts"?"active":""}">Подарки</button></div>${filters.map(f=>`<button class="option" data-filter="${f}"><span>${f}</span><span class="option-count">${state.filters[f].length?state.filters[f].map(v=>f==="Модель"?v.split("::").at(-1):v).join(", "):"Все"}</span>${icon("right")}</button>`).join("")}<button class="option" data-filter="Цена">Цена${icon("right")}</button><div class="sheet-footer"><button class="secondary" data-action="reset-filters">Сбросить всё</button><button class="primary" data-action="close-sheet">Готово</button></div>`);}
  function applyFilter(name){
    if(name==="Цена"){
      const min=el("price-min").value,max=el("price-max").value;
      if((min!==""&&(!Number.isFinite(+min)||+min<0))||(max!==""&&(!Number.isFinite(+max)||+max<0))||(min!==""&&max!==""&&+min>+max)){el("price-error").textContent="Укажите корректный диапазон цены.";return;}
      state.min=min;state.max=max;
    }else{
      state.filters[name]=state.draft.filters[name];
      if(name==="NFT"){state.filters.Модель=[];state.filters.Фон=[];state.filters.Символ=[];}
    }
    closeSheet();render();
  }
  function resetFilters(){state.filters={NFT:[],Модель:[],Фон:[],Символ:[]};state.min="";state.max="";state.chips=[];state.query="";state.view="gifts";state.category="gifts";closeSheet();if(state.route!=="/")navigate("/");else render();}
  function sortSheet(){state.sheet="sort";showSheet("Сортировать",[["new","Сначала новые"],["low","Цена по возрастанию"],["high","Цена по убыванию"],["number","По номеру NFT"]].map(([id,label])=>`<button class="option${state.sort===id?" selected":""}" data-sort="${id}">${label}<span class="option-check">${state.sort===id?icon("check"):""}</span></button>`).join(""));}
  function balance(){funding("deposit");}
  function operation(kind,id){
    const g=giftById(id)||cs2Item(id);if(!g)return;
    if(kind==="buy"){purchaseSheet(g);return;}
    state.sheet=`operation:${kind}:${id}`;
    showSheet("Быстрая продажа",`${row(g,'data-action="noop"',`#${g.number}`)}<div class="operation-summary"><span>Цена ордера</span><strong>${gram()} ${money(g.price,g.currency)} GRAM</strong></div><p class="operation-note">Для продажи нужен подарок в вашем хранилище и подключение сервиса передачи NFT. Продажа и списание средств сейчас не выполняются.</p><button class="primary" data-action="sell-unavailable">Продать</button>`);
  }
  function createOrder(){state.sheet="create-order";state.quantity=1;showSheet("Создать ордер",`<label class="field-label" for="order-collection">Коллекция</label><select id="order-collection" class="sheet-search">${catalog.map(g=>`<option value="${escape(g.id)}">${escape(g.name)}</option>`).join("")}</select><label class="field-label" for="order-price">Цена за подарок, GRAM</label><input id="order-price" class="sheet-search" type="number" min="0.0001" step="any" placeholder="Например, 4.48"><span class="field-label">Количество</span><div class="quantity-field"><button class="icon-button" data-quantity="-1" aria-label="Уменьшить количество">${icon("minus")}</button><output id="order-quantity">1</output><button class="icon-button" data-quantity="1" aria-label="Увеличить количество">${icon("plus")}</button></div><div id="order-error" class="form-error" role="alert"></div><p class="operation-note">Будет сохранён локальный черновик. Он не размещается на маркете и не резервирует средства.</p><button class="primary" data-action="save-order">Сохранить черновик</button>`);}
  function cartItem(id){return giftById(id)||cs2Item(id)||bundles.find(b=>b.id===id);}
  function cartEntries(skins=state.route==="/cart/skins"){return state.cart.map(cartItem).filter(g=>g&&(g.currency==="USD")===skins);}
  function cartCurrency(){return state.route==="/cart/skins"?"USD":"GRAM";}
  function selectedCart(){return cartEntries().filter(g=>!state.cartExcluded.includes(g.id));}
  function cartTotal(){return Number(selectedCart().reduce((sum,g)=>sum+Number(g.price),0).toFixed(9));}
  function cart(){if(!state.route.startsWith("/cart"))state.cartOrigin=state.route;navigate(state.category==="cs2"?"/cart/skins":"/cart");}
  function cartPage(){
    const skins=state.route==="/cart/skins",list=cartEntries(skins),chosen=selectedCart(),unit=skins?"USD":"GRAM",currency=skins?"$":gram(),all=list.length>0&&chosen.length===list.length,total=cartTotal();
    if(state.cartSort)list.sort((a,b)=>a.price-b.price);
    const gifts=cartEntries(false).reduce((n,g)=>n+(g.bundle?g.count:1),0),skinCount=cartEntries(true).length;
    return `<section class="cart-page"><div class="cart-title-row"><h1>Ваша корзина</h1><button class="icon-button" data-action="cart-info" aria-label="Информация о корзине">${icon("info")}</button><button class="icon-button cart-sort${state.cartSort?" selected":""}" data-action="cart-sort" aria-label="Сортировать корзину по цене" aria-pressed="${state.cartSort}">${icon("sort")}</button></div><div class="cart-tabs" role="tablist" aria-label="Категории корзины"><button role="tab" aria-selected="${!skins}" data-go="/cart" class="${!skins?"active":""}">${icon("gift")}Подарки (${gifts})</button><button role="tab" aria-selected="${skins}" data-go="/cart/skins" class="${skins?"active":""}"><span class="cart-skin-icon original-mask" style="mask-image:url('${escape(asset("original/inline-svg/svg-5be8f8d030b50443.svg"))}')"></span>Скины (${skinCount})</button></div><div class="cart-toolbar"><button class="cart-select-all" data-action="cart-select-all" role="checkbox" aria-checked="${all}" ${!list.length?"disabled":""}><span class="cart-checkbox${all?" checked":""}" aria-hidden="true">${all?icon("check"):""}</span>ВЫБРАТЬ ВСЕ</button><button data-action="cart-delete-all" ${!list.length?"disabled":""}>УДАЛИТЬ ВСЁ<span class="cart-trash">${icon("trash")}</span></button></div>${list.length?`<div class="cart-items">${list.map(g=>{const checked=!state.cartExcluded.includes(g.id);return `<article class="cart-item${g.bundle?" cart-bundle-item":""}" data-cart-row="${g.id}"><button class="cart-checkbox${checked?" checked":""}" role="checkbox" aria-checked="${checked}" aria-label="Выбрать ${escape(g.name)}" data-cart-select="${g.id}">${checked?icon("check"):""}</button>${pic(g.image,g.name,"cart-item-image")}<div class="cart-item-copy"><button ${g.bundle?`data-bundle-open="${g.id}"`:`data-buy="${g.id}"`}>${escape(g.name)}</button><small>${g.bundle?`${g.count} подарка`:"#"+escape(g.number)}</small></div><span class="cart-item-price">${currency}${money(g.price,unit)}</span><button class="icon-button" data-cart-remove="${g.id}" aria-label="Убрать ${escape(g.name)} из корзины">${icon("trash")}</button></article>`;}).join("")}</div>`:`<div class="cart-empty"><h2>Корзина пуста</h2><p>Вы ещё не добавили ни одного<br>предмета</p><button class="secondary" data-action="cart-catalog">${skins?`<span class="cart-skin-icon original-mask" style="mask-image:url('${escape(asset("original/inline-svg/svg-5be8f8d030b50443.svg"))}')"></span>`:icon("gift")}${skins?"Каталог скинов":"Каталог"}</button></div>`}</section><section class="cart-checkout" aria-label="Оплата корзины"><div class="cart-total"><span>Общая стоимость</span><strong>${currency} ${total===0?"0":money(total,unit)}</strong></div><div class="cart-balance-row${skins?" skins":""}"><span class="cart-balance${!skins&&total>Number(account.balances.GRAM)?" insufficient":""}">Баланс: ${skins?"$":`<span class="yellow">${gram()}</span>`} ${balanceValue(unit)}</span>${skins?`<div class="cart-points"><span class="points-m">M</span> ${balanceValue("points")}<button class="cart-points-switch" data-action="cart-points" role="switch" aria-label="Использовать MRKT Points" aria-checked="${state.cartPoints}" disabled><span></span></button><button data-action="points" aria-label="Информация о MRKT Points">${icon("info")}</button></div>`:""}</div><button class="primary cart-pay" data-action="${skins?"cart-steam":total>Number(account.balances.GRAM)?"cart-topup":"cart-checkout"}" ${!chosen.length?"disabled":""}>${skins?"Подключить Steam":total>Number(account.balances.GRAM)?`Пополнить баланс ${gram()} ${money(total)}`:"Оплатить"}</button></section>`;
  }
  function deleteCartItems(ids,button){
    const rows=[...document.querySelectorAll('[data-cart-row]')],old=new Map(rows.map(row=>[row.dataset.cartRow,row.getBoundingClientRect().y]));
    const commit=()=>{state.cart=state.cart.filter(id=>!ids.includes(id));state.cartExcluded=state.cartExcluded.filter(id=>!ids.includes(id));save();render();if(window.__MRKT_MOTION.enabled()){for(const row of document.querySelectorAll('[data-cart-row]')){const y=old.get(row.dataset.cartRow),next=row.getBoundingClientRect().y;if(y!==undefined&&y!==next)row.animate([{transform:`translateY(${y-next}px)`},{transform:'translateY(0)'}],{duration:180,easing:'ease-out'});}document.querySelector('.cart-empty')?.animate([{opacity:0},{opacity:1}],{duration:180});}};
    const removed=rows.filter(row=>ids.includes(row.dataset.cartRow));if(!window.__MRKT_MOTION.enabled()||!removed.length){commit();return;}if(button)button.disabled=true;Promise.all(removed.map(row=>row.animate([{opacity:1,transform:'translateX(0)'},{opacity:0,transform:'translateX(12px)'}],{duration:160,easing:'ease-out'}).finished.catch(()=>{}))).then(commit);
  }
  function cartCheckout(){const list=selectedCart(),total=cartTotal();if(!list.length)return;state.fundingAmount=String(total);showSheet("Покупка подарков",`<h3>${list.reduce((n,g)=>n+(g.bundle?g.count:1),0)} подарков</h3><div class="operation-summary"><span>Общая стоимость</span><strong>${gram()} ${money(total)}</strong></div><div class="insufficient-balance">Баланс: ${gram()} ${balanceValue("GRAM")}</div><button class="primary" data-action="topup-price">Пополнить баланс</button><button class="secondary" data-action="close-sheet">Назад в корзину</button>`);}
  function orderReference(id){const o=window.__MRKT_ORDER_REFERENCE?.find(x=>x.id===id);if(!o)return;showSheet("Ордер",`<div class="order-reference-summary">${pic(o.image,o.name)}<h3>${escape(o.name)}</h3><p>Выполнено: ${o.filled}/${o.quantity}</p><div class="operation-summary"><span>Цена, GRAM</span><strong>${gram()} ${money(o.min)} — ${gram()} ${escape(o.maxDisplay)}</strong></div>${o.priceClipped?`<p class="operation-note">Окончание цены закрыто на исходном скриншоте.</p>`:""}<button class="primary" data-go="/orders/create">Создать ордер</button><button class="secondary" data-action="close-sheet">Закрыть</button></div>`);}
  function menu(){navigate("/menu");}
  function infoSheet(title,text,center=false){state.sheet="info";showSheet(title,`<p>${text}</p><button class="primary" data-action="close-sheet">Понятно</button>`,center);}
  function funding(kind){
    const deposit=kind==="deposit",title=deposit?"Ввод средств":"Вывод средств";state.sheet=kind;state.fundingKind=kind;
    showSheet(title,`<form class="funds-layout" novalidate><div class="funds-art"><picture><source media="(prefers-reduced-motion: reduce)" srcset="${escape(asset(`ui/funds-${kind}.webp`))}">${pic("pink-purse.webp","Анимированный кошелёк")}</picture></div><h2 class="funds-title">${title}</h2><label class="funds-input"><input id="funding-amount" inputmode="decimal" type="text" autocomplete="off" aria-label="Сумма, GRAM" placeholder="${deposit?"0.1":"Сумма"}" value="${deposit?escape(state.fundingAmount||"0.1"):""}">${gram()}</label>${deposit?"":`<div class="funds-balance">Баланс депозита: ${gram()}<strong>${balanceValue("GRAM")}</strong></div><p class="funds-minimum">Минимальный вывод 0.1 GRAM</p>`}<p id="funding-error" class="funds-error" role="status" aria-live="polite"></p><button type="submit" class="primary funds-submit" >${deposit?"Пополнить баланс":"Вывести"}</button></form>`);
    sheet.classList.add("funds-sheet",deposit?"funds-deposit":"funds-withdraw");
    sheet.querySelector('form').addEventListener('submit',event=>{event.preventDefault();submitFunding();});updateFunding();
  }
  function fundingAmount(){const raw=el("funding-amount")?.value.trim().replace(",",".")||"";return /^\d+(?:\.\d{1,9})?$/.test(raw)?Number(raw):NaN;}
  function updateFunding(){const amount=fundingAmount(),withdraw=state.fundingKind==="withdraw";const valid=Number.isFinite(amount)&&amount>=.1&&(!withdraw||amount<=Number(account.balances.GRAM));const button=sheet.querySelector('.funds-submit');if(button)button.disabled=!valid;}
  function submitFunding(){updateFunding();const button=sheet.querySelector('.funds-submit');if(!button||button.disabled)return;el("funding-error").textContent="Платёжный сервис не подключён. Перевод не выполнен.";}



  function balanceValue(currency){const value=account.balances[currency];return value===null||value===undefined?"0":String(value);}
  function cs2Item(id){return sourceItems("skins").find(item=>item.id===id)||null;}
  function backgroundColor(name){return {Black:"#181818",Onyx:"#1d1c22",Amber:"#dc971d",Gold:"#c99f21","Carrot Juice":"#e58a50","Coral Red":"#c16366",Emerald:"#3d907c",Silver:"#a9aaaa",Midnight:"#293c69",Rose:"#b95b88",Rosewood:"#a86382",Lavender:"#8c75c1"}[name]||"#777078";}
  function starsPane(){return window.__MRKT_UPDATES.starsPane();}
  function openLuckyById(id){
    let g=id?giftById(id):catalog.find(item=>item.currency!=="USD");
    if(!g&&purchaseGift?.id===id)g=purchaseGift;
    if(!g&&activeOffer&&!activeOffer.error&&`offer-${activeOffer.id}`===id)g=offerItem(activeOffer);
    if(!g||g.currency==="USD"){toast("Этот подарок не найден.");return;}
    lucky.gift=g;lucky.chance=1;lucky.skip=false;lucky.agreed=false;
    const tiles=Array.from({length:54},(_,index)=>(index===23||[0,3,4].includes(index%7))?`<div class="lucky-reel-card lucky-token-card">${pic("ui/lucky-clover-card.webp","Клевер","lucky-token-image")}</div>`:`<div class="lucky-reel-card lucky-gift-card"><div class="lucky-reel-art${g.exactImage?" exact":""}" style="--lucky-background:${escape(backgroundColor(g.background))}">${pic(g.image,g.name)}</div></div>`).join("");
    showSheet(`${escape(g.name)} <span class="lucky-title-number">#${escape(g.number)}</span>`,`<div class="lucky-layout"><div class="lucky-reel" aria-label="Лента Lucky Buy"><div class="lucky-track" id="lucky-track" data-result-index="23">${tiles}</div><span class="lucky-reel-marker lucky-reel-marker-top" aria-hidden="true"></span><span class="lucky-reel-marker lucky-reel-marker-bottom" aria-hidden="true"></span></div><div class="lucky-stake-price">${gram()}<span id="lucky-stake-amount">0.05</span></div><div class="lucky-account-balance">Баланс ${gram()}<span>${escape(balanceValue("GRAM"))}</span></div><div class="lucky-odds"><div class="lucky-odds-title"><label for="lucky-chance">Вероятность выиграть</label><output id="lucky-chance-label" for="lucky-chance">1%</output></div><input id="lucky-chance" type="range" min="1" max="80" step="1" value="1" aria-label="Вероятность выиграть"></div><label class="lucky-skip-row" for="lucky-skip"><span>Пропустить анимацию</span><input id="lucky-skip" type="checkbox" role="switch" aria-label="Пропустить анимацию"></label><div class="lucky-calculation"><div><span>Возможный выигрыш:</span><span><small id="lucky-multiplier">(x89.00)</small>${gram()}${money(g.price,g.currency)}</span></div><div><span>MRKT покрывает:</span><span>${gram()}<span id="lucky-coverage">—</span></span></div></div><div class="lucky-controls"><button class="secondary lucky-spin-button" data-action="lucky-spin">Демо</button><button class="primary lucky-topup-button" data-action="lucky-funding">Пополнить баланс ${gram()}<span id="lucky-topup-amount">0.1</span></button></div><div class="lucky-consent"><label><input id="lucky-agree" type="checkbox"><span>Я согласен с</span></label><button data-action="lucky-terms-info">Условиями Использования</button></div><p id="lucky-message" class="lucky-message" role="status" aria-live="polite"></p><div class="lucky-rules" id="lucky-rules" hidden><p>Демо показывает анимацию Lucky Buy. Баланс не меняется. Для покупки попыток и выдачи NFT необходим подключённый сервис.</p></div></div>`);
    sheet.classList.add("lucky-sheet");updateLucky();
    requestAnimationFrame(()=>{const track=el("lucky-track");if(track)track.style.transform=luckyPosition(1);});
  }
  function luckyCost(){
    const prize=Number(lucky.gift?.price)||0,multiplier=89/lucky.chance,raw=prize/multiplier;
    return {cost:Math.max(.05,Math.ceil(raw*100)/100),multiplier,coverage:Math.max(0,prize*(1-lucky.chance/100))};
  }
  function updateLucky(){
    if(!sheet.classList.contains("lucky-sheet")||!el("lucky-chance"))return;
    const {cost,multiplier,coverage}=luckyCost();
    el("lucky-chance-label").textContent=`${lucky.chance}%`;
    el("lucky-chance").style.setProperty("--lucky-range-fill",`${(lucky.chance-1)/79*100}%`);
    const busy=Boolean(lucky.animation||lucky.resolving);
    el("lucky-chance").disabled=busy;el("lucky-skip").disabled=busy;el("lucky-agree").disabled=busy;sheet.querySelector('[data-action="lucky-funding"]').disabled=busy;
    el("lucky-stake-amount").textContent=cost.toFixed(2);
    el("lucky-multiplier").textContent=`(x${multiplier.toFixed(2)})`;
    el("lucky-coverage").textContent=coverage.toFixed(2);
    el("lucky-topup-amount").textContent=money(Math.max(.1,cost));
    const spin=sheet.querySelector('[data-action="lucky-spin"]');spin.disabled=busy;spin.innerHTML=busy?'<span class="lucky-loading" aria-label="Прокрутка"></span>':"Демо";
  }
  function luckyPosition(index){
    const track=el("lucky-track"),reel=track?.parentElement,first=track?.firstElementChild;
    if(!reel||!first)return 'translateX(0px)';
    const gap=parseFloat(getComputedStyle(track).gap)||0,width=first.getBoundingClientRect().width;
    return `translateX(${reel.clientWidth/2-width/2-index*(width+gap)}px)`;
  }
  function spinLucky(){
    if(!lucky.gift||lucky.animation||lucky.resolving)return;
    const message=el("lucky-message");
    if(!lucky.agreed){message.textContent="Подтвердите согласие с условиями.";el("lucky-agree").focus({preventScroll:true});return;}
    const track=el("lucky-track");if(!track)return;
    message.textContent="";const sequence=++lucky.sequence;
    track.querySelectorAll(".lucky-landed").forEach(card=>card.classList.remove("lucky-landed"));
    const target=Number(track.dataset.resultIndex),start=luckyPosition(track.dataset.stopped?1:1),finish=luckyPosition(target);
    const skip=lucky.skip||!window.__MRKT_MOTION.enabled();
    const x=value=>Number(value.match(/translateX\(([-.\d]+)px\)/)?.[1]||0),from=x(start),distance=x(finish)-from;
    const measured=[[0,0],[.15,.11086],[.3,.21644],[.5,.33107],[.75,.46531],[1,.58032],[1.25,.66968],[1.5,.75302],[1.75,.81297],[2,.85935],[2.25,.90083],[2.5,.93024],[2.75,.95814],[3,.97285],[3.25,.98643],[3.5,.99698],[3.75,1.00415],[4,1.00754],[4.25,1.00867],[4.5,1.00867],[4.75,1.00867],[5,1.00716],[5.25,1.00264],[5.4,1]];
    const frames=skip?[{transform:start},{transform:finish}]:measured.map(([t,progress])=>({offset:t/5.4,transform:`translateX(${from+distance*progress}px)`}));
    track.style.transform=start;
    lucky.animation=track.animate(frames,{duration:skip?80:5400,easing:'linear',fill:'forwards'});updateLucky();
    lucky.animation.finished.then(()=>{
      if(sequence!==lucky.sequence||!track.isConnected)return;
      track.style.transform=finish;track.dataset.stopped='true';lucky.animation.cancel();lucky.animation=null;lucky.resolving=true;
      if(!skip){track.children[target].classList.add("lucky-landed");lucky.confettiTimer=setTimeout(()=>{if(sequence===lucky.sequence&&sheet.open)celebrateLucky(sheet);},950);}
      lucky.timer=setTimeout(()=>{if(sequence!==lucky.sequence)return;lucky.resolving=false;updateLucky();showLuckyResult();},skip?0:1300);
    }).catch(()=>{});
  }
  function closeLuckyResult(){const result=el("lucky-result");if(result){if(result.open)result.close();result.remove();}sheet.querySelector(".lucky-celebration")?.remove();}
  function showLuckyResult(){
    if(!sheet.classList.contains("lucky-sheet")||!sheet.open)return;
    const confetti=sheet.querySelector(".lucky-celebration");confetti?.remove();closeLuckyResult();
    const result=document.createElement("dialog");result.id="lucky-result";result.className="lucky-result";result.setAttribute("aria-labelledby","lucky-result-title");
    result.innerHTML=`<button class="lucky-result-close" data-action="lucky-result-close" aria-label="Закрыть результат">${icon("x")}</button><article class="lucky-result-card"><div class="lucky-result-art lucky-token-card">${pic("ui/lucky-clover-card.webp","Клевер","lucky-token-image")}</div><div class="lucky-result-card-meta"><div>Lucky Card</div><small>Количество: 1</small><button data-action="lucky-card-info" aria-label="Информация о Lucky Card">${icon("info")}</button></div></article><h2 id="lucky-result-title">Возможные награды</h2><p>Lucky Card не выдается в демо-режиме</p><button class="primary" data-action="lucky-funding">Испытать удачу по-настоящему</button>`;
    result.addEventListener("cancel",event=>{event.preventDefault();closeLuckyResult();});document.body.append(result);result.showModal();
    if(confetti)result.append(confetti);else if(!lucky.skip&&window.__MRKT_MOTION.enabled())celebrateLucky(result);
    window.__MRKT_MOTION.sheet(result);
  }
  function celebrateLucky(host){
    if(!window.__MRKT_MOTION.enabled())return;const particles=document.createElement("div");particles.className="lucky-celebration";particles.setAttribute("aria-hidden","true");
    particles.innerHTML=Array.from({length:56},(_,i)=>`<span style="--confetti-side:${i%2?100:0}%;--confetti-x:${(i%2?-1:1)*(70+(i*53)%330)}px;--confetti-y:${-180+(i*67)%430}px;--confetti-delay:${(i%6)*.025}s;--confetti-turn:${i*71}deg;background:${["#e70dca","#f2cf00","#16bdd1","#69d518"][i%4]}"></span>`).join("");host.append(particles);
  }
  function nftLink(g){const slug=String(g.collection_slug||g.name||"").replace(/[^a-zA-Z0-9]/g,"");return slug&&/^\d+$/.test(String(g.number))?`https://t.me/nft/${slug}-${g.number}`:"";}
  function purchaseFloor(g,model=false){
    const supplied=model?g.modelFloor:g.floor;
    if(supplied!==null&&supplied!==undefined&&Number.isFinite(+supplied))return +supplied;
    const values=catalog.filter(item=>item.name===g.name&&(!model||item.model===g.model)).map(item=>+item.price).filter(Number.isFinite);
    return values.length?Math.min(...values):null;
  }
  function purchaseRarity(value){const number=typeof value==="string"?Number(value.replace(/%$/, "")):Number(value);return value!==null&&value!==undefined&&value!==""&&Number.isFinite(number)&&number>=0&&number<=100?`<span class="purchase-rarity">${escape(number)}%</span>`:"";}
  function purchaseAttribute(g,name,value,floor=null,rarity=null){
    return `<button class="purchase-attribute" data-purchase-attribute="${name}" ${!value?"disabled":""}><span class="purchase-attribute-left"><span class="purchase-attribute-label">${name=== "NFT"?"КОЛЛЕКЦИЯ":name.toUpperCase()}</span>${name==="NFT"||name==="Модель"?`<span class="purchase-attribute-floor">флор: ${g.currency==="USD"?"$":gram()} ${money(floor,g.currency)}</span>`:""}</span><span class="purchase-attribute-value">${purchaseRarity(rarity)}<span>${escape(value||"—")}</span>${icon("external")}</span></button>`;
  }
  function purchaseSheet(g){
    purchaseGift=g;state.sheet=`purchase:${g.id}`;state.fundingAmount=String(g.price);
    const currency=g.currency==="USD"?"$":gram(),inCart=state.cart.includes(g.id),link=nftLink(g);
    showSheet("Покупка подарка",`<div class="purchase-layout"><div class="purchase-hero"><div class="purchase-side purchase-side-left">${link?`<a class="purchase-side-button" href="${escape(link)}" target="_blank" rel="noopener noreferrer" aria-label="Открыть подарок в Telegram">${icon("telegram")}</a>`:""}<button class="purchase-side-button" data-action="share-purchase" aria-label="Поделиться подарком">${icon("share")}</button><button class="purchase-side-button" data-go="/play-hub" aria-label="Открыть игровой хаб">${icon("game")}</button></div><article class="purchase-card"><div class="purchase-art${g.exactImage?" exact":""}" style="--purchase-art-bg:${escape(backgroundColor(g.background))}">${pic(g.image,g.name)}${nftActions(g)}</div><div class="purchase-meta"><h3>${escape(g.name)}</h3><p>#${escape(g.number)}</p></div></article><div class="purchase-side purchase-side-right"><button class="purchase-side-button purchase-info-button" data-action="purchase-info" aria-expanded="false" aria-controls="purchase-info-note" aria-label="Информация о подарке">${icon("info")}</button></div></div><div class="purchase-attributes">${purchaseAttribute(g,"NFT",g.name,purchaseFloor(g))}${purchaseAttribute(g,"Модель",g.model,purchaseFloor(g,true),g.modelRarity??g.rarity?.model)}${purchaseAttribute(g,"Фон",g.background,null,g.backgroundRarity??g.rarity?.background)}${purchaseAttribute(g,"Символ",g.symbol)}</div><div class="purchase-info-note" id="purchase-info-note" hidden><p>Флор рассчитан по сохранённому каталогу. Цены не обновляются автоматически.</p><p>Профиль: ${account.verified?escape(account.user?.username||account.user?.first_name||"Пользователь"):"Гость"}. Баланс: ${escape(balanceValue(g.currency==="USD"?"USD":"GRAM"))} ${g.currency==="USD"?"USD":"GRAM"}.</p></div><div class="purchase-share-note" id="purchase-share-note" hidden><label for="purchase-share-link">Ссылка на подарок</label><input id="purchase-share-link" readonly value="${escape(link)}" aria-label="Ссылка на подарок"></div>${g.id.startsWith("offer-")&&activeOffer?`<p class="offer-purchase-source">@${escape(activeOffer.operator)} · ${escape(activeOffer.creator_label)}<br>Владение NFT не подтверждено</p>`:""}<div class="purchase-bottom-actions"><button class="purchase-side-button purchase-offer-button" data-action="create-offer" aria-label="Сделать оффер">${icon("discount")}</button><button class="purchase-side-button purchase-cart-button${inCart?" in-cart":""}" data-purchase-cart="${escape(g.id)}" aria-label="${inCart?"Убрать из корзины":"Добавить в корзину"}" aria-pressed="${inCart}">${icon("cart")}</button><button class="purchase-buy-button" data-action="confirm-purchase">Купить ${currency}<span>${money(g.price,g.currency)}</span></button></div></div>`);
    sheet.classList.add("purchase-sheet");
  }
  async function sharePurchase(){
    if(!purchaseGift)return;const link=nftLink(purchaseGift);if(!link){toast("Ссылка на этот предмет не добавлена.");return;}
    try{await navigator.clipboard.writeText(link);const button=sheet.querySelector('[data-action="share-purchase"]');if(button){button.innerHTML=icon("check");button.setAttribute("aria-label","Ссылка скопирована");setTimeout(()=>{if(button.isConnected){button.innerHTML=icon("share");button.setAttribute("aria-label","Поделиться подарком");}},2200);}}catch{el("purchase-share-note").hidden=false;el("purchase-share-link").focus();el("purchase-share-link").select();}
  }
  function purchaseAttributeFilter(name){
    const g=purchaseGift;if(!g)return;const value=name==="NFT"?g.name:name==="Модель"?g.model:name==="Фон"?g.background:g.symbol;if(!value)return;
    state.filters={NFT:[g.name],Модель:[],Фон:[],Символ:[]};if(name!=="NFT")state.filters[name]=[value];state.query="";state.min="";state.max="";state.chips=[];state.category=g.currency==="USD"?"cs2":"gifts";navigate("/");
  }
  function purchaseConfirmation(g){
    state.sheet=`purchase:${g.id}`;state.fundingAmount=String(g.price);
    const unit=g.currency==="USD"?"USD":"GRAM",amount=money(g.price,g.currency);
    showSheet("Покупка подарка",`<article class="purchase-card"><div class="purchase-art${g.exactImage?" exact":""}">${pic(g.image,g.name)}</div><div class="purchase-meta"><h3>${escape(g.name)}</h3><p>#${escape(g.number)}</p></div></article><h2 class="purchase-question">Купить этот предмет?</h2>${g.id.startsWith("offer-")&&activeOffer?`<p class="offer-purchase-source">@${escape(activeOffer.operator)} · ${escape(activeOffer.creator_label)}<br>Владение NFT не подтверждено</p>`:""}<div class="purchase-price">${unit==="USD"?"$":gram()}${amount}</div><div class="insufficient-balance">Баланс: ${unit==="USD"?"$":gram()} ${balanceValue(unit)}</div><button class="primary purchase-confirm" data-action="topup-price">Пополнить баланс ${unit==="USD"?"$":gram()} ${amount}</button><button class="secondary purchase-cancel" data-action="back-to-purchase">Назад</button>`);
    sheet.classList.add("purchase-confirmation-sheet");
  }
  async function api(path,body){
    if(window.__MRKT_LOCAL_ONLY||window.__MRKT_OFFLINE||!/^https?:$/.test(location.protocol))throw new Error("Сервер не подключён. Открыта локальная версия.");
    const response=await fetch(path,{method:body?"POST":"GET",headers:body?{"Content-Type":"application/json"}:{"Accept":"application/json"},body:body?JSON.stringify(body):undefined,cache:"no-store"});
    let result;try{result=await response.json();}catch{throw new Error("Сервер приложения не подключён.");}
    if(!response.ok)throw new Error(result.message||"Не удалось выполнить запрос.");return result;
  }
  async function bootstrap(){
    // Identity is verified independently of the deliberately disabled trading API.
    if(telegram?.initData&&/^https?:$/.test(location.protocol)){
      try{
        const response=await fetch('/api/telegram/me',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({initData:telegram.initData}),cache:'no-store'});
        const identity=await response.json();
        if(response.ok&&identity.verified&&identity.user){account.user=identity.user;account.verified=true;render();const frame=document.getElementById('exact-interface');if(frame?.contentDocument)window.__MRKT_UPDATES.applyIdentity(frame.contentDocument);}
      }catch{account.verified=false;}
    }
    const start=new URLSearchParams(location.search).get("offer")||"";
    if(/^[a-f0-9]{32}$/.test(start))navigate(`/offer/${start}`);
    if(window.__MRKT_LOCAL_ONLY||window.__MRKT_OFFLINE||!/^https?:$/.test(location.protocol))return;
    try{serviceConfig=await api("/api/config");serverReady=true;}catch{return;}
    if(telegram?.initData){try{const data=await api("/api/telegram/me",{initData:telegram.initData});account.user=data.user;account.verified=true;render();}catch{account.verified=false;}}
    await Promise.allSettled([refreshCatalog(),refreshOffers()]);
    if(state.route.startsWith("/offer/"))loadOffer(state.route.split("/")[2]);
    else render();
    telegram?.onEvent?.("activated",()=>{refreshCatalog();refreshOffers();});
  }
  async function refreshCatalog(){
    try{const data=await api("/api/catalog");if(Array.isArray(data.items)){catalog=data.items.filter(g=>g&&/^[a-zA-Z0-9_-]{1,100}$/.test(g.id)&&typeof g.name==="string"&&Number.isFinite(+g.price)).map(g=>({...g,price:+g.price}));if(state.route==="/")renderCatalogResults();}}catch{}
  }
  async function refreshOffers(notify=false){
    try{const data=await api("/api/offers");publicOffers=Array.isArray(data.offers)?data.offers:[];if(account.verified){const mine=await api("/api/me/offers",{initData:telegram.initData});myOffers=mine.offers||[];}if(state.route==="/offers"||state.route==="/feed"||state.route==="/profile")render();if(notify)toast("Предложения обновлены.");}catch{if(notify)toast("Сервер предложений не подключён.");}
  }
  function offerRow(o){return `<button class="list-row" data-go="/offer/${escape(o.id)}"><span class="offer-row-art">${icon("gift")}</span><span><strong>${escape(o.name)} #${escape(o.number)}</strong><small>${escape(o.creator_label)} · ${o.status==="cancelled"?"Отменён":"Активен"}</small></span><span class="row-end">${gram()}${escape(o.price)}</span></button>`;}
  function offersPage(){return `${localBack()}<section class="page-pad">${heading("Офферы",`<button class="primary compact" data-action="create-offer">${icon("plus")}Сделать оффер</button>`)}${serviceConfig.bot_username?`<p class="operator-label">Оператор: @${escape(serviceConfig.bot_username)}</p>`:""}${(account.verified?myOffers:publicOffers).length?(account.verified?myOffers:publicOffers).map(offerRow).join(""):empty("Предложений пока нет","Создайте оффер: укажите ссылку на NFT и цену.")}</section>`;}
  function offerItem(o){const known=catalog.find(g=>g.name.replace(/\W/g,"").toLowerCase()===o.collection_slug.toLowerCase())||collections.find(g=>g.name.replace(/\W/g,"").toLowerCase()===o.collection_slug.toLowerCase());return {id:`offer-${o.id}`,name:o.name,number:o.number,price:+o.price,image:known?.image||"source_crops/pink-purse.png",exactImage:known?.exactImage||false,model:"",background:"",symbol:""};}
  function offerPage(id){
    if(!/^[a-f0-9]{32}$/.test(id))return notFound();
    if(!activeOffer||activeOffer.id!==id){if(offerLoading!==id){offerLoading=id;loadOffer(id);}return `${localBack()}${empty("Открываем оффер…","Проверяем ссылку предложения.")}`;}
    const o=activeOffer;if(o.error)return `${localBack()}${empty("Оффер недоступен",escape(o.error))}`;
    const g=offerItem(o);if(!catalog.some(x=>x.id===g.id))catalog.push(g);
    return `${localBack()}<section class="page-pad" style="padding-top:1rem"><p class="operator-label">Предложение в @${escape(o.operator)} · ${escape(o.creator_label)}</p><div class="gift-detail-art${g.exactImage?" exact":""}">${pic(g.image,g.name)}${nftActions(g)}</div><h1 class="gift-detail-name">${escape(o.name)}</h1><p class="gift-detail-number">#${escape(o.number)}</p><button class="primary full-width" data-buy="${g.id}" ${o.status!=="active"?"disabled":""}>${gram()}${escape(o.price)} · ${o.status==="active"?"Купить":"Оффер отменён"}</button>${myOffers.some(x=>x.id===o.id)&&o.status==="active"?`<button class="secondary full-width" style="margin-top:.5rem" data-offer-cancel="${o.id}">Отменить оффер</button>`:""}</section>`;
  }
  async function loadOffer(id){try{const data=await api(`/api/offers/${encodeURIComponent(id)}`);activeOffer=data.offer;}catch(error){activeOffer={id,error:error.message};}finally{offerLoading="";if(state.route===`/offer/${id}`){render();if(activeOffer&&!activeOffer.error&&activeOffer.status==="active")purchaseSheet(offerItem(activeOffer));}}}
  function createOfferForm(){
    if(!account.verified){infoSheet("Сделать оффер","Откройте мини-апп через вашего Telegram-бота с настроенным сервером. Аккаунт подтвердится автоматически — номер телефона и код входа не нужны.");return;}
    state.sheet="create-offer";state.offerRequestKey=crypto.randomUUID?.()||`${Date.now()}-${Math.random()}`;
    showSheet("Сделать оффер",`<label class="field-label" for="offer-nft">Ссылка на NFT</label><input class="sheet-search" id="offer-nft" type="url" placeholder="https://t.me/nft/StarNotepad-59483"><label class="field-label" for="offer-price">Цена, GRAM</label><input class="sheet-search" id="offer-price" type="number" min="0.0001" step="0.0001" placeholder="4.63"><p class="operator-label">Ссылка будет создана для @${escape(serviceConfig.bot_username||"")}.</p><div id="offer-error" class="form-error" role="alert"></div><button class="primary" data-action="submit-offer">Создать ссылку</button>`);
  }
  async function submitOffer(){
    const button=sheet.querySelector('[data-action="submit-offer"]');if(!button)return;button.disabled=true;
    try{const result=await api("/api/offers",{initData:telegram?.initData||"",nft_url:el("offer-nft").value,price:el("offer-price").value,request_key:state.offerRequestKey});state.createdOfferLink=result.offer.link;await refreshOffers();showSheet("Оффер создан",`<p>${escape(result.offer.name)} #${escape(result.offer.number)}<br>${escape(result.offer.price)} GRAM</p><label class="field-label" for="created-offer-link">Ссылка на мини-апп</label><input class="sheet-search" id="created-offer-link" readonly value="${escape(result.offer.link)}"><button class="primary" data-action="copy-offer">${icon("copy")}Скопировать ссылку</button><button class="secondary" data-go="/offer/${result.offer.id}">Открыть оффер</button>`);}catch(error){if(el("offer-error"))el("offer-error").textContent=error.message;button.disabled=false;}
  }
  async function copyOffer(){try{await navigator.clipboard.writeText(state.createdOfferLink);toast("Ссылка скопирована.");}catch{el("created-offer-link")?.select();toast("Выделите и скопируйте ссылку.");}}
  async function cancelOffer(id){try{await api(`/api/offers/${id}/cancel`,{initData:telegram?.initData||""});await refreshOffers();activeOffer=null;loadOffer(id);}catch(error){toast(error.message);}}

  const actions = {
    "bundle-confirm":confirmBundle,"bundle-back":()=>bundleSheet(state.activeBundle),"bundle-share":shareBundle,"bundle-offer":bundleOffer,
    "bundle-offer-submit":()=>{const raw=el("bundle-offer-price").value.trim().replace(",","."),value=Number(raw);el("bundle-offer-error").textContent=!raw||!Number.isFinite(value)||value<=0?"Укажите цену больше нуля.":"Сервис офферов не подключён. Предложение не отправлено.";},
    "cart-info":()=>infoSheet("Ваша корзина","Выберите подарки для покупки. Здесь можно убрать отдельные предметы или очистить корзину. Коллекция покупается целиком."),
    "cart-sort":()=>{state.cartSort=!state.cartSort;render();},
    "cart-select-all":()=>{const ids=cartEntries().map(g=>g.id),all=ids.every(id=>!state.cartExcluded.includes(id));state.cartExcluded=state.cartExcluded.filter(id=>!ids.includes(id));if(all)state.cartExcluded.push(...ids);render();},
    "cart-delete-all":()=>deleteCartItems(cartEntries().map(g=>g.id)),
    "cart-catalog":()=>{const skins=state.route==="/cart/skins";state.category=skins?"cs2":"gifts";navigate("/");},
    "cart-topup":()=>{state.fundingAmount=String(cartTotal());funding("deposit");},"cart-checkout":cartCheckout,"cart-steam":()=>infoSheet("Подключить Steam","Сервис подключения Steam не настроен. Аккаунт не подключён."),

    "bundle-funding":()=>{const b=bundles.find(x=>x.id===state.activeBundle);if(b){state.fundingAmount=String(b.price);funding("deposit");}},"noop":()=>{},"lucky-spin":spinLucky,"lucky-result-close":closeLuckyResult,"lucky-card-info":()=>toast("Lucky Card не выдается в демо-режиме"),"lucky-funding":()=>{state.fundingAmount=String(Math.max(.1,luckyCost().cost));funding("deposit");},"lucky-terms-info":()=>{el("lucky-rules").hidden=!el("lucky-rules").hidden;},"close-sheet":closeSheet,"share-purchase":sharePurchase,"confirm-purchase":()=>{if(purchaseGift)purchaseConfirmation(purchaseGift);},"back-to-purchase":()=>{if(purchaseGift)purchaseSheet(purchaseGift);},"purchase-info":()=>{const note=el("purchase-info-note");if(note){note.hidden=!note.hidden;sheet.querySelector("[data-action=purchase-info]").setAttribute("aria-expanded",String(!note.hidden));}},"menu":menu,"balance":balance,"sort":sortSheet,"all-filters":allFilters,"reset-filters":resetFilters,
    "clear-search":()=>{state.query="";el("catalog-search").value="";document.querySelector(".search-clear").hidden=true;renderCatalogResults();el("catalog-search").focus();},
    "show-gifts":()=>{state.view="gifts";state.filters={NFT:[],Модель:[],Фон:[],Символ:[]};state.min="";state.max="";state.query="";state.category="gifts";closeSheet();if(state.route!=="/")navigate("/");else render();},
    "all-orders":()=>navigate("/orders"),"create-order":createOrder,"cart":cart,
    "order-info":()=>infoSheet("Ордера","Ордер — предложение купить подарок по указанной цене. Вы можете посмотреть предложения и открыть форму быстрой продажи. Числа в браузерной версии служат для просмотра интерфейса и не являются актуальными котировками."),
    "withdraw-info":()=>infoSheet("Бесплатный вывод подарков","На референсе показаны условия: бесплатный вывод, если подарок размещён на продаже минимум 1 день; скидка 50%, если подарок хранится минимум 1 день. Реальная проверка условий и вывод требуют серверного подключения."),
    "storage-info":()=>infoSheet("Хранилище","Снимок доступных способов получить подарок. Выигрыш, покупка и передача подарков в локальной копии не выполняются."),
    "add-gift":()=>{state.sheet="add-gift";showSheet("Добавить подарок",`<div class="wallet-illustration">${pic("optimized/plush-pepe.webp")}</div><p>Подарки добавляются через Telegram. Для передачи подарка необходимы подключённый бот и подтверждённый аккаунт.</p><p class="operation-note">Адрес бота отсутствует в прикреплённых материалах. Передача подарка в браузерном просмотре недоступна.</p><button class="primary" data-action="close-sheet">Понятно</button>`);},
    "wallet":()=>{state.sheet="wallet";showSheet("Привязать кошелёк",`<div class="wallet-illustration">${pic("pink-purse.webp","Кошелёк")}</div><p>Подключение кошелька требует конфигурации TON Connect. Она не включена в прикреплённые материалы.</p><button class="primary" data-action="wallet-unavailable">Подключить кошелёк</button>`,true);},
    "wallet-unavailable":()=>toast("Не задана конфигурация TON Connect. Кошелёк не подключён."),
    "deposit":()=>funding("deposit"),"withdraw":()=>funding("withdraw"),
    "funding-submit":submitFunding,"funding-unavailable":()=>toast("Платёжный сервис не подключён. Перевод не выполнен."),
    "purchase-unavailable":()=>toast("Нужен подключённый сервер. Покупка не выполнена."),
    "sell-unavailable":()=>toast("В хранилище нет подключённых подарков. Продажа не выполнена."),
    "news":()=>infoSheet("Новости","HALLOWEEN FEST: 85K GRAM<br><br>Играй! Торгуй! Забирай призы!<br><br>Откройте событие через кнопку с тыквой в верхнем меню."),
    "founders":()=>infoSheet("CHEERS TO THE FOUNDER","Баннер восстановлен из прикреплённых ассетов. Целевая ссылка в материалах не указана."),
    "account":()=>infoSheet("Профиль",account.user?`${escape([account.user.first_name,account.user.last_name].filter(Boolean).join(" "))}<br>${account.user.username?"@"+escape(account.user.username):""}<br>${account.verified?"Аккаунт подтверждён Telegram.":"Для подтверждения профиля откройте приложение через своего бота с настроенным сервером."}`:"Откройте мини-апп из вашего Telegram-бота: имя и аватар появятся автоматически."),
    "points":()=>infoSheet("MRKT Points",`MRKT Points: ${escape(balanceValue("points"))}. Источник счёта пока не подключён.`),
    "cards":()=>infoSheet("Lucky Cards",`Lucky Cards: ${escape(balanceValue("cards"))}. Источник счёта пока не подключён.`),
    "offers":()=>navigate("/offers"),
    "create-offer":createOfferForm,
    "submit-offer":submitOffer,
    "copy-offer":copyOffer,
    "topup-price":()=>funding("deposit"),
    "select-all-nft":()=>{const values=optionsFor("NFT");state.draft.filters.NFT=state.draft.filters.NFT.length===values.length?[]:values;el("filter-options").innerHTML=filterOptions("NFT");},
    "stars-self":()=>{el("stars-recipient").value=account.user?.username?"@"+account.user.username:"";},
    "stars-buy":()=>toast("Продажа звёзд не подключена. Оплата не выполнена."),
    "cs2":()=>infoSheet("CS2-скины","В прикреплённых материалах нет каталога CS2-скинов."),
    "transaction":()=>infoSheet("История","Операций пока нет."),
    "refresh-feed":()=>refreshOffers(true),
    "about":()=>infoSheet("О приложении","Интерфейс восстановлен по прикреплённым скриншотам и ассетам. Поиск, фильтры, навигация, избранное, корзина и черновики ордеров работают локально.<br><br>Интерфейс уточнён по видео. Профиль подтверждается через Telegram initData. Каталог может обновляться через разрешённый API. Игры, платежи и передача подарков требуют отдельных интеграций."),
    "save-order":()=>{const price=el("order-price").value;if(!price||!Number.isFinite(+price)||+price<=0){el("order-error").textContent="Укажите цену больше нуля.";return;}state.orders.push({id:Date.now().toString(36),giftId:el("order-collection").value,price:+price,quantity:state.quantity});save();closeSheet();state.ordersTab="mine";if(state.route==="/orders")render();else navigate("/orders");toast("Черновик сохранён в этом браузере.");},
  };

  document.addEventListener("click",event=>{
    const b=event.target.closest("button,[data-go]");if(!b||b.disabled)return;
    if(b.dataset.luckyId){openLuckyById(b.dataset.luckyId);return;}
    if(b.dataset.purchaseAttribute){purchaseAttributeFilter(b.dataset.purchaseAttribute);return;}
    if(b.dataset.purchaseCart){const id=b.dataset.purchaseCart;state.cart=state.cart.includes(id)?state.cart.filter(value=>value!==id):[...state.cart,id];save();const added=state.cart.includes(id);b.classList.toggle("in-cart",added);b.setAttribute("aria-pressed",String(added));b.setAttribute("aria-label",added?"Убрать из корзины":"Добавить в корзину");b.innerHTML=icon(added?"check":"cart");window.__MRKT_MOTION.added(b);render();return;}
    if(b.dataset.cartSelect){const id=b.dataset.cartSelect;state.cartExcluded=state.cartExcluded.includes(id)?state.cartExcluded.filter(x=>x!==id):[...state.cartExcluded,id];render();return;}
    if(b.dataset.bundleCart){const id=b.dataset.bundleCart,added=!state.cart.includes(id);state.cart=added?[...state.cart,id]:state.cart.filter(x=>x!==id);state.cartExcluded=state.cartExcluded.filter(x=>x!==id);save();b.classList.toggle("in-cart",added);b.setAttribute("aria-pressed",String(added));b.setAttribute("aria-label",added?"Убрать коллекцию из корзины":"Добавить коллекцию в корзину");b.innerHTML=icon(added?"check":"cart");window.__MRKT_MOTION.added(b);render();return;}
    if(b.dataset.bundleOpen){bundleSheet(b.dataset.bundleOpen);return;}
    if(b.dataset.go){navigate(b.dataset.go);return;}
    if(b.dataset.action){actions[b.dataset.action]?.();return;}
    if(b.dataset.filter){openFilter(b.dataset.filter);return;}
    if(b.dataset.resetFilter){state.filters[b.dataset.resetFilter]=[];render();return;}
    if(b.dataset.filterValue!==undefined){const name=b.dataset.filterName,value=b.dataset.filterValue;const a=state.draft.filters[name];state.draft.filters[name]=a.includes(value)?a.filter(v=>v!==value):[...a,value];const input=el("filter-search");const focusSelection=input?.selectionStart;el("filter-options").innerHTML=filterOptions(name);if(input&&document.activeElement===input)input.setSelectionRange(focusSelection,focusSelection);return;}
    if(b.dataset.clearDraft){const name=b.dataset.clearDraft;if(name==="Цена"){el("price-min").value="";el("price-max").value="";}else{state.draft.filters[name]=[];el("filter-options").innerHTML=filterOptions(name);}return;}
    if(b.dataset.applyFilter){applyFilter(b.dataset.applyFilter);return;}
    if(b.dataset.sort){state.sort=b.dataset.sort;closeSheet();renderCatalogResults();return;}
    if(b.dataset.view){state.view=b.dataset.view;closeSheet();render();allFilters();return;}
    if(b.dataset.category){changeMarketCategory(b.dataset.category);return;}
    if(b.dataset.chip){state.chips=state.chips.includes(b.dataset.chip)?state.chips.filter(x=>x!==b.dataset.chip):[...state.chips,b.dataset.chip];render();return;}
    if(b.dataset.starsAmount){el("stars-amount").value=b.dataset.starsAmount;return;}
    if(b.dataset.offerCancel){cancelOffer(b.dataset.offerCancel);return;}
    if(b.dataset.favorite){const id=b.dataset.favorite;state.favorites=state.favorites.includes(id)?state.favorites.filter(x=>x!==id):[...state.favorites,id];save();b.classList.toggle("selected",state.favorites.includes(id));b.setAttribute("aria-pressed",String(state.favorites.includes(id)));b.setAttribute("aria-label",state.favorites.includes(id)?"Убрать из избранного":"Добавить в избранное");if(state.route==="/favorites")render();return;}
    if(b.dataset.cartAdd){const id=b.dataset.cartAdd;if(cs2Item(id)){toast("Добавление скинов пока недоступно.");return;}const added=!state.cart.includes(id);state.cart=added?[...state.cart,id]:state.cart.filter(x=>x!==id);state.cartExcluded=state.cartExcluded.filter(x=>x!==id);save();b.classList.toggle('in-cart',added);b.setAttribute('aria-pressed',String(added));b.innerHTML=icon(added?'check':'cart');b.setAttribute('aria-label',added?'Убрать из корзины':'В корзину: '+(cartItem(id)?.name||''));window.__MRKT_MOTION.added(b);const count=document.querySelector('.cart-count');if(count){count.textContent=state.cart.length;count.hidden=!state.cart.length;}else if(state.cart.length)document.querySelector('.cart-button')?.insertAdjacentHTML('beforeend',`<span class="cart-count">${state.cart.length}</span>`);return;}
    if(b.dataset.cartRemove){deleteCartItems([b.dataset.cartRemove],b);return;}
    if(b.dataset.buy){operation("buy",b.dataset.buy);return;}
    if(b.dataset.sell){operation("sell",b.dataset.sell);return;}
    if(b.dataset.ordersTab){state.ordersTab=b.dataset.ordersTab;render();return;}
    if(b.dataset.profileTab){state.profileTab=b.dataset.profileTab;render();return;}
    if(b.dataset.storageTab){state.storageTab=b.dataset.storageTab;render();return;}
    if(b.dataset.taskTab){state.taskTab=b.dataset.taskTab;render();return;}
    if(b.dataset.slide!==undefined){state.withdrawSlide=+b.dataset.slide;main.innerHTML=withdrawal();return;}
    if(b.dataset.quantity){state.quantity=Math.min(99,Math.max(1,state.quantity+(+b.dataset.quantity)));el("order-quantity").textContent=state.quantity;return;}
    if(b.dataset.localOrder){const o=state.orders.find(o=>o.id===b.dataset.localOrder);if(o){const g=giftById(o.giftId);showSheet("Черновик ордера",`<p>${g.name}<br>Количество: ${o.quantity}<br>Цена за подарок: ${o.price} GRAM</p><p class="operation-note">Черновик сохранён локально и не размещён на маркете.</p><button class="secondary" data-delete-order="${o.id}">Удалить черновик</button>`);}return;}
    if(b.dataset.deleteOrder){state.orders=state.orders.filter(o=>o.id!==b.dataset.deleteOrder);save();closeSheet();render();toast("Черновик удалён.");}
  });
  document.addEventListener("input",event=>{
    if(event.target.id==="funding-amount"){updateFunding();return;}
    if(event.target.id==="lucky-chance"){lucky.chance=Number(event.target.value);updateLucky();return;}
    if(event.target.id==="range-min"){const max=+el("range-max").value;event.target.value=Math.min(+event.target.value,max);el("price-min").value=event.target.value;}
    if(event.target.id==="range-max"){const min=+el("range-min").value;event.target.value=Math.max(+event.target.value,min);el("price-max").value=event.target.value;}
    if(event.target.id==="price-min"&&el("range-min"))el("range-min").value=event.target.value||0;
    if(event.target.id==="price-max"&&el("range-max"))el("range-max").value=event.target.value||100000;
    if(event.target.id==="catalog-search"){state.query=event.target.value;document.querySelector(".search-clear").hidden=!state.query;renderCatalogResults();}
    if(event.target.id==="filter-search"){state.filterSearch=event.target.value;const name=state.sheet?.split(":")[1];if(name)el("filter-options").innerHTML=filterOptions(name);}
  });
  document.addEventListener("change",event=>{if(event.target.id==="lucky-agree"){lucky.agreed=event.target.checked;updateLucky();}if(event.target.id==="lucky-skip")lucky.skip=event.target.checked;});
  sheet.addEventListener("click",event=>{if(event.target===sheet){const r=sheet.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeSheet();}});
  sheet.addEventListener("cancel",event=>{event.preventDefault();closeSheet();});
  sheet.addEventListener("close",()=>{document.body.classList.remove("dialog-open");});
  document.addEventListener("error",event=>{const img=event.target;if(img?.matches?.(".avatar img")){const avatar=img.parentElement;avatar.textContent=avatar.dataset.initials||"Г";}},true);
  document.addEventListener("keydown",event=>{if(event.key==="Escape"&&!sheet.open&&state.route!=="/")navigate(backRoute());});
  document.addEventListener("touchstart",event=>{if(event.target.closest("#pepe-carousel"))swipeX=event.touches[0].clientX;},{passive:true});
  document.addEventListener("touchend",event=>{if(event.target.closest("#pepe-carousel")&&Math.abs(event.changedTouches[0].clientX-swipeX)>35){state.withdrawSlide=state.withdrawSlide?0:1;main.innerHTML=withdrawal();}},{passive:true});
  window.addEventListener("hashchange",()=>{const next=getRoute();if(next===state.route)return;rememberNativeScroll();closeSheet();state.route=next;render();restoreNativeScroll();main.focus({preventScroll:true});});
  if(inTelegram)telegram.BackButton?.onClick?.(()=>sheet.open?closeSheet():navigate(backRoute()));
  window.__MRKT_OPEN_LUCKY=id=>id?openLuckyById(id):navigate("/lucky-buy");
  window.__MRKT_OPEN_ORDER=orderReference;
  window.__MRKT_OPEN_FUNDS=kind=>funding(kind==="withdraw"?"withdraw":"deposit");
  window.__MRKT_APP={account,state,render,navigate,showSheet,closeSheet,toast,asset,pic,icon,gram,money,escape,giftById,currentGift:()=>purchaseGift,setCatalog(items){catalog=items;if(state.route==="/"&&state.category==="gifts")renderCatalogResults();}};
  state.route=getRoute();render();setInterval(updateTimer,1000);bootstrap();
  setInterval(()=>{if(serverReady&&!window.__MRKT_OFFLINE&&!document.hidden){refreshCatalog();refreshOffers();}},30000);
  document.addEventListener("scroll",event=>{if(event.target?.id==="promo-carousel"&&event.target.clientWidth>0){bannerIndex=Math.round(event.target.scrollLeft/event.target.clientWidth);bannerTouchedAt=Date.now();}},true);
  setInterval(()=>{const c=el("promo-carousel");if(!c||c.clientWidth<=0||document.body.classList.contains("exact-active")||sheet.open||Date.now()-bannerTouchedAt<4500||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;bannerIndex=(bannerIndex+1)%banners.length;c.scrollTo({left:bannerIndex*c.clientWidth,behavior:"smooth"});},6000);
})();


