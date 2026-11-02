/* Visible demo checkout shared by NFT cards, bundles and the cart. */
(() => {
  'use strict';
  const D=window.__MRKT_DEMO;
  if(!D)return;
  let app,pending=null,busy=false;
  const notice='<p class="demo-note"><strong>ДЕМО</strong> · Оплата виртуальными GRAM. Реальные средства не списываются, настоящие активы не передаются.</p>';
  const showError=error=>app?.toast(error.message||'Демо-операция не сохранена.');
  function install(api){
    app=api;document.body.classList.add('demo-mode');
    const banner=document.createElement('aside');banner.className='demo-banner';banner.setAttribute('aria-label','Демонстрационный режим');
    banner.innerHTML='<div><strong>ДЕМО</strong>Виртуальные GRAM · Настоящие активы не передаются</div><button data-demo-action="wallet">Демо-кошелёк</button>';
    document.body.prepend(banner);
    const update=()=>{app.account.balances.GRAM=Number(D.balance());app.render();};
    D.subscribe(update);D.ready.then(update).catch(error=>{banner.querySelector('div').textContent='ДЕМО · Хранилище браузера недоступно. Покупки отключены.';showError(error);});
  }
  async function checkout(items){
    try{
      await D.ready;
      const lines=items.map(D.line),keys=lines.flatMap(l=>l.claims);
      if(new Set(keys).size!==keys.length)throw Error('Один предмет указан несколько раз, в том числе внутри коллекции.');
      if(items.some(D.owned))throw Error('Один из предметов уже есть в демо-хранилище.');
      pending={lines,key:crypto.randomUUID?.()||`demo-${Date.now()}-${Math.random()}`};
      drawCheckout();
    }catch(error){showError(error);}
  }
  function drawCheckout(){
    if(!pending)return;
    const total=pending.lines.reduce((n,l)=>n+BigInt(l.units),0n),enough=BigInt(D.balanceUnits())>=total;
    const lines=pending.lines.slice(0,20).map(l=>`<div class="demo-checkout-line"><div>${app.escape(l.name)}${l.number?` #${app.escape(l.number)}`:''}<small>${app.escape(l.basis)}${l.at?' · '+app.escape(new Date(l.at).toLocaleDateString('ru-RU')):''}</small></div><span>${D.format(l.units)} GRAM</span></div>`).join('');
    app.state.sheet='demo-checkout';
    app.showSheet('Демо-покупка',`${notice}<div class="demo-checkout-items">${lines}${pending.lines.length>20?`<p>Ещё ${pending.lines.length-20} позиций</p>`:''}</div><div class="operation-summary"><span>Сумма</span><strong>${D.format(total)} виртуальных GRAM</strong></div><div class="insufficient-balance">Демо-баланс: ${D.balance()} GRAM</div><p class="demo-checkout-error" id="demo-checkout-error" role="status">${enough?'':'Недостаточно виртуальных GRAM.'}</p><button class="primary" data-demo-action="pay" ${enough?'':'disabled'}>Оплатить ${D.format(total)} виртуальных GRAM</button>${enough?'':'<button class="secondary" data-demo-action="wallet">Добавить тестовые GRAM бесплатно</button>'}<button class="secondary" data-demo-action="cancel">Отмена</button>`);
    document.getElementById('sheet').classList.add('purchase-confirmation-sheet');
  }
  async function pay(button){
    if(busy||!pending)return;
    busy=true;button.disabled=true;
    const order=pending;
    try{
      const result=await D.purchase(order.lines,order.key);
      const ids=new Set(order.lines.map(l=>l.id));app.state.cart=app.state.cart.filter(id=>!ids.has(id));app.state.cartExcluded=app.state.cartExcluded.filter(id=>!ids.has(id));app.save();pending=null;
      app.render();
      app.showSheet('Демо-покупка сохранена',`${notice}<h3>Тестовая покупка выполнена</h3><p>Списано ${D.format(result.receipt.total)} виртуальных GRAM.</p><p>Демо-баланс: <strong>${D.balance()} GRAM</strong></p><div class="demo-success-actions"><button class="primary" data-demo-action="inventory">Открыть демо-хранилище</button><button class="secondary" data-demo-action="close">Продолжить просмотр</button></div>`);
    }catch(error){const output=document.getElementById('demo-checkout-error');if(output)output.textContent=error.message;button.disabled=false;}
    finally{busy=false;}
  }
  async function wallet(kind){
    try{await D.ready;}catch(error){showError(error);return;}
    app.state.sheet='demo-wallet';
    app.showSheet('Демо-кошелёк',`${notice}<p>Тестовый баланс сохраняется в этом браузере.</p><div class="demo-wallet-balance">${D.balance()} виртуальных GRAM</div><p>${kind==='withdraw'?'Виртуальные GRAM нельзя вывести.':'Стартовый баланс — 1 000 GRAM. Добавление тестовых GRAM бесплатно.'}</p><div class="demo-success-actions"><button class="primary" data-demo-action="grant">Добавить 1 000 тестовых GRAM</button>${pending?'<button class="secondary" data-demo-action="return-checkout">Вернуться к демо-покупке</button>':''}<button class="secondary" data-demo-action="reset">Сбросить демо-данные</button><button class="secondary" data-demo-action="close">Закрыть</button></div>`);
  }
  function storage(){
    const items=D.inventory();
    return `<section class="page-pad"><h1>Демо-хранилище</h1>${notice}<p>${items.length} тестовых предметов. Настоящие NFT остаются у своих владельцев.</p></section>${items.length?`<div class="catalog-grid">${items.map(app.giftCard).join('')}</div>`:'<section class="page-pad"><p>Здесь появятся покупки за виртуальные GRAM.</p><button class="secondary" data-go="/">Открыть каталог</button></section>'}`;
  }
  function history(){
    const rows=D.receipts().slice(-50).reverse();
    return rows.length?rows.map(r=>`<div class="demo-history-row"><strong>Демо-покупка · −${D.format(r.total)} GRAM</strong><div>${app.escape(r.lines.map(l=>l.name+(l.number?' #'+l.number:'')).join(', '))}</div><small>${app.escape(new Date(r.at).toLocaleString('ru-RU'))} · Баланс после покупки ${D.format(r.balance_after)} виртуальных GRAM</small></div>`).join(''):'<div class="history-empty">История демо-покупок пуста</div>';
  }
  document.addEventListener('click',async event=>{
    const button=event.target.closest('[data-demo-action]');if(!button||button.disabled)return;
    event.preventDefault();event.stopImmediatePropagation();
    try{
      switch(button.dataset.demoAction){
        case 'wallet':await wallet();break;
        case 'pay':await pay(button);break;
        case 'grant':button.disabled=true;await D.grant();await wallet();break;
        case 'return-checkout':drawCheckout();break;
        case 'inventory':app.navigate('/my-gifts');break;
        case 'cancel':pending=null;app.closeSheet();break;
        case 'close':app.closeSheet();break;
        case 'reset':app.showSheet('Сброс демо-данных',`${notice}<p>Будут удалены только тестовые покупки этого браузера, баланс вернётся к 1 000 виртуальных GRAM.</p><button class="primary" data-demo-action="reset-confirm">Сбросить тестовые данные</button><button class="secondary" data-demo-action="wallet">Отмена</button>`);break;
        case 'reset-confirm':button.disabled=true;await D.reset();pending=null;app.state.cart=[];app.state.cartExcluded=[];app.save();await wallet();break;
      }
    }catch(error){showError(error);button.disabled=false;}
  },true);
  window.__MRKT_DEMO_UI={install,checkout,wallet,storage,history,notice,closed:()=>{pending=null;}};
})();
