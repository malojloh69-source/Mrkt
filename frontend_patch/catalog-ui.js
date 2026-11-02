/* Shared collection and trait picker. All names, artwork and rarity come from the supplied catalogue. */
(() => {
  'use strict';
  const data=window.__MRKT_GIFT_DATA;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const asset=path=>window.__MRKT_ASSETS?.[path]||path;
  const gram=()=>`<span class="catalog-gram" style="mask-image:url('${esc(asset('assets/original/inline-svg/svg-8f7fe54a59eada2e.svg'))}')" aria-hidden="true"></span>`;
  const num=n=>n===null||n===undefined?'—':Number(n).toLocaleString('en-US',{maximumFractionDigits:2}).replace(/,/g,' ');
  function entries(field,selected=[]){
    if(field==='NFT')return data.collections.map(c=>({...c,value:c.name}));
    const chosen=selected.length?data.collections.filter(c=>selected.includes(c.name)):[];
    if(field==='Модель')return chosen.flatMap(c=>c.models.map(([name,rarity,image,category,floor])=>({name,category,floor,value:c.name+'::'+name,trait:name,collection:c.name,rarity,image})));
    const kind=field==='Фон'?'backdrops':'patterns';
    if(!chosen.length)return Object.values(data[kind]).map(p=>({...p,value:p.name}));
    const result=new Map();
    for(const c of chosen)for(const [name,rarity] of c[kind])if(!result.has(name))result.set(name,{...data[kind][name],name,value:name,rarity});
    return [...result.values()];
  }
  window.__MRKT_CATALOG={data,entries,asset,byName:name=>data.collections.find(c=>c.name===name)};
  const css=`
.catalog-picker-host{width:min(614px,100%)!important;max-width:100%!important;height:calc(100dvh - 12px)!important;max-height:calc(100dvh - 12px)!important;padding:0!important;background:#111!important;border:0!important;border-radius:28px 28px 0 0!important;overflow:hidden!important;color:#dedee4!important;font:400 16px/1.4 "Space Grotesk","Noto Sans",sans-serif!important}
.catalog-picker{height:100%;width:100%;min-height:0;display:flex;flex-direction:column;background:#111;color:#dedee4;text-align:left}
.catalog-picker *{box-sizing:border-box}.catalog-picker [hidden]{display:none!important}
.catalog-picker button,.catalog-picker input{font:inherit;color:inherit;touch-action:manipulation}.catalog-picker button{border:0;cursor:pointer;background:none;padding:0}
.catalog-picker-head{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-shrink:0;padding:12px 12px 10px 16px;min-height:60px}.catalog-picker-head h2{margin:0;font-size:20px;line-height:28px;font-weight:400}.catalog-picker-close{display:grid;place-items:center;width:44px;height:44px;color:#777!important;font-size:32px!important;line-height:1!important}
.catalog-picker-search{display:flex;align-items:center;gap:12px;flex:none;height:40px;margin:0 16px 12px;padding:0 14px;border:1px solid #2c2c2c;border-radius:7px;background:#222;color:#999}.catalog-picker-search svg{width:18px;height:18px;flex:none}.catalog-picker-search input{width:100%;min-width:0;border:0;outline:none;background:none;font-size:16px}.catalog-picker-search input::placeholder{color:#666;opacity:1}
.catalog-picker-columns,.catalog-picker-row{display:grid;grid-template-columns:24px 42px minmax(75px,1fr) 82px 98px;gap:8px;align-items:center}.catalog-picker-columns{min-height:48px;margin:0 16px;padding:0 0 12px;border-bottom:1px solid #282828;color:#999;font-size:14px;flex:none}.catalog-picker-all{display:flex;align-items:center;gap:10px;grid-column:1/4;text-align:left;white-space:nowrap}.catalog-picker-sort{display:flex;align-items:center;justify-content:flex-start;gap:4px;white-space:nowrap}.catalog-picker-sort:last-child{justify-content:flex-end}.catalog-picker-sort::after{content:'⌃⌄';font-size:12px;color:#777;letter-spacing:-4px;padding-right:4px}
.catalog-check{display:grid;place-items:center;flex:none;width:22px;height:22px;border:1.5px solid #999;border-radius:6px;color:#111;font:700 16px/1 "Noto Sans",sans-serif}.catalog-picker-row[aria-checked=true] .catalog-check,.catalog-picker-all[aria-checked=true] .catalog-check{background:#ffda13;border-color:#ffda13}.catalog-picker-row[aria-checked=true] .catalog-check::after,.catalog-picker-all[aria-checked=true] .catalog-check::after{content:'✓'}.catalog-picker-row[aria-checked=true]{background:#ffda130c}
.catalog-picker-list{flex:1;min-height:0;overflow:auto;overscroll-behavior:contain;scrollbar-width:none;padding:6px 16px 10px;outline:none}.catalog-picker-list::-webkit-scrollbar{display:none}.catalog-picker-row{width:100%;min-height:60px;text-align:left!important;border-radius:6px;padding:8px 0!important}.catalog-picker-row:focus-visible,.catalog-picker button:focus-visible{outline:2px solid #ffda13;outline-offset:2px}.catalog-picker-row img{display:block;width:42px;height:42px;object-fit:contain;flex:none;border-radius:6px;user-select:none;-webkit-user-select:none;pointer-events:none}.catalog-picker-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:16px}.catalog-picker-name small{display:block;overflow:hidden;text-overflow:ellipsis;color:#777;font:12px/18px "Noto Sans",sans-serif}.catalog-picker-floor,.catalog-picker-volume{min-width:0;font-size:15px;font-variant-numeric:tabular-nums;white-space:nowrap}.catalog-picker-volume{text-align:right;overflow:hidden;text-overflow:ellipsis}.catalog-picker-floor>span:first-child{display:flex;align-items:center;gap:4px}.catalog-picker-floor small{display:block;font:13px/18px "Noto Sans",sans-serif;color:#999}.catalog-picker-floor small[data-positive=true]{color:#36aa75}.catalog-picker-floor small[data-negative=true]{color:#e5686a}.catalog-gram{display:inline-block;vertical-align:-1px;width:13px;height:12px;flex:none;background:#ddd;mask-position:center;mask-repeat:no-repeat;mask-size:contain}.catalog-picker-volume .catalog-gram{margin-right:4px}
.catalog-picker:not([data-field=NFT]) .catalog-picker-row{grid-template-columns:24px 42px minmax(0,1fr) 60px}.catalog-picker:not([data-field=NFT]) .catalog-picker-columns{display:flex;justify-content:space-between}.catalog-picker:not([data-field=NFT]) .catalog-picker-all{flex:1}.catalog-rarity{font-size:14px;text-align:right;color:#999}.catalog-color{width:42px;height:42px;border-radius:6px;border:1px solid #ffffff18}.catalog-symbol{display:grid;place-items:center;width:42px;height:42px;border-radius:6px;background:#242424}.catalog-symbol img{width:32px;height:32px;filter:brightness(0) invert(.65)}
.catalog-picker-empty{padding:28px 6px;text-align:center;color:#999;font-size:14px;line-height:1.5}.catalog-picker-empty button{display:block;width:100%;margin-top:18px;padding:12px 16px;border-radius:7px;background:#ffda13;color:#111}.catalog-picker-sentinel{height:1px}.catalog-picker-footer{display:grid;grid-template-columns:100px minmax(0,1fr);gap:10px;flex:none;padding:12px 16px calc(28px + env(safe-area-inset-bottom,0px));background:#111}.catalog-picker-footer button{min-height:48px;border-radius:7px;background:#222;border:1px solid #303030;color:#aaa;font-size:18px}.catalog-picker-footer button:last-child{background:#ffde08;color:#111;border:0}
@media(max-width:390px){.catalog-picker-columns,.catalog-picker-row{grid-template-columns:22px 38px minmax(60px,1fr) 70px 86px;gap:6px}.catalog-picker-row img,.catalog-color,.catalog-symbol{width:38px;height:38px}.catalog-picker-name{font-size:14px}.catalog-picker-floor,.catalog-picker-volume{font-size:13px}.catalog-picker-head h2{font-size:19px}.catalog-picker-columns{font-size:13px}.catalog-picker-all{gap:6px}.catalog-picker-footer{grid-template-columns:90px minmax(0,1fr)}.catalog-picker-footer button{font-size:16px}.catalog-check{width:21px;height:21px}}
@media(max-width:340px){.catalog-picker-columns,.catalog-picker-row{grid-template-columns:20px 34px minmax(45px,1fr) 58px 70px;gap:5px}.catalog-picker-row img,.catalog-color,.catalog-symbol{width:34px;height:34px}.catalog-picker-floor,.catalog-picker-volume{font-size:11px}.catalog-picker-floor small{font-size:11px}.catalog-picker-name{font-size:12px}.catalog-picker-columns{font-size:11px}.catalog-picker:not([data-field=NFT]) .catalog-picker-row{grid-template-columns:20px 34px minmax(0,1fr) 48px}.catalog-picker-search,.catalog-picker-columns{margin-inline:12px}.catalog-picker-list{padding-inline:12px}}
`;
  window.__MRKT_MOUNT_PICKER=function(host,config){
    host.__pickerDestroy?.();
    const doc=host.ownerDocument,view=doc.defaultView;
    if(!doc.getElementById('mrkt-catalog-style')){const style=doc.createElement('style');style.id='mrkt-catalog-style';style.textContent=css;doc.head.append(style);}
    host.classList.add('catalog-picker-host');
    const field=config.field||'NFT',single=Boolean(config.single),selected=new Set(config.selected||[]);let query='',sort='',descending=false,count=0,observer=null,imageObserver=null,filtered=[];
    let all=entries(field,config.collections||[]);
    if(field==='Модель')for(const option of all)if(selected.has(option.trait))selected.add(option.value);
    const title=field==='NFT'?'Коллекция':field;
    host.innerHTML=`<section class="catalog-picker" data-field="${esc(field)}" aria-label="${esc(title)}"><header class="catalog-picker-head"><h2>${title}</h2><button class="catalog-picker-close" data-picker-close aria-label="Закрыть окно">×</button></header><label class="catalog-picker-search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="10" cy="10" r="7"/><path d="m15 15 7 7"/></svg><input type="search" placeholder="Поиск" aria-label="Поиск значений фильтра"></label><div class="catalog-picker-columns">${single?'<span>Коллекция</span>':`<button class="catalog-picker-all" role="checkbox" aria-label="Выбрать все" aria-checked="false" data-picker-all><span class="catalog-check" aria-hidden="true"></span><span>Выбрать все</span></button>`}${field==='NFT'?'<button class="catalog-picker-sort" data-picker-sort="floor" aria-label="Флор">Флор</button><button class="catalog-picker-sort" data-picker-sort="turnover" aria-label="Оборот">Оборот</button>':'<button class="catalog-picker-sort" data-picker-sort="rarity" aria-label="Редкость">Редкость</button>'}</div><div class="catalog-picker-list" tabindex="-1" aria-label="${esc(title)}: список"></div><footer class="catalog-picker-footer"><button data-picker-reset>${single?'Отмена':'Сбросить'}</button><button data-picker-apply>${single?'Сохранить':'Показать результаты'}</button></footer></section>`;
    const root=host.querySelector('.catalog-picker'),list=root.querySelector('.catalog-picker-list'),search=root.querySelector('input'),allButton=root.querySelector('[data-picker-all]');
    function imageHtml(option){
      if(field==='Фон')return `<span class="catalog-color" style="background:radial-gradient(circle at 45% 35%,${esc(option.centerColor||'#555')},${esc(option.edgeColor||'#222')})" aria-hidden="true"></span>`;
      const image=option.image||data.collections.find(c=>c.name===option.collection)?.image;
      return image?(field==='Символ'?'<span class="catalog-symbol">':'')+`<img src="${image.startsWith('https:')?'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22/%3E':esc(asset(image))}" ${image.startsWith('https:')?'data-catalog-src="'+esc(image)+'"':''} alt="" loading="lazy" decoding="async" draggable="false">`+(field==='Символ'?'</span>':''):'<span class="catalog-color" aria-hidden="true"></span>';
    }
    function row(option,index){
      const checked=selected.has(option.value),extra=field==='NFT'?`<span class="catalog-picker-floor"><span>${gram()}${num(option.floor)}</span><small data-positive="${option.change>0}" data-negative="${option.change<0}">${option.change>0?'+':''}${num(option.change)}%</small></span><span class="catalog-picker-volume">${gram()}${num(option.turnover)}</span>`:`<span class="catalog-rarity">${option.category?(gram()+num(option.floor)):(option.rarity==null?'—':num(option.rarity)+'%')}</span>`;
      return `<button class="catalog-picker-row" role="${single?'radio':'checkbox'}" aria-label="${esc(option.name)}${field==='Модель'?' · '+esc(option.collection):''}" aria-checked="${checked}" aria-posinset="${index+1}" aria-setsize="${filtered.length}" data-picker-value="${esc(option.value)}"><span class="catalog-check" aria-hidden="true"></span>${imageHtml(option)}<span class="catalog-picker-name" title="${esc(option.name)}">${esc(option.name)}${option.category?'<small>'+esc(option.category)+'</small>':(field==='Модель'&&config.collections?.length>1?'<small>'+esc(option.collection)+'</small>':'')}</span>${extra}</button>`;
    }
    function refreshAll(){if(allButton)allButton.setAttribute('aria-checked',String(filtered.length>0&&filtered.every(x=>selected.has(x.value))));}
    function append(){
      const batch=filtered.slice(count,count+70);list.querySelector('.catalog-picker-sentinel')?.remove();list.insertAdjacentHTML('beforeend',batch.map((x,i)=>row(x,count+i)).join(''));count+=batch.length;
      imageObserver||=new view.IntersectionObserver(es=>{for(const entry of es)if(entry.isIntersecting){const img=entry.target;img.dataset.catalogLoaded='true';img.src=img.dataset.catalogSrc;imageObserver.unobserve(img);}},{root:list,rootMargin:'180px'});list.querySelectorAll('img[data-catalog-src]:not([data-catalog-loaded])').forEach(img=>imageObserver.observe(img));
      observer?.disconnect();
      if(count<filtered.length){const sentinel=doc.createElement('div');sentinel.className='catalog-picker-sentinel';list.append(sentinel);observer=new view.IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting))append();},{root:list,rootMargin:'240px'});observer.observe(sentinel);}
    }
    function render(){
      observer?.disconnect();count=0;filtered=all.filter(x=>(x.name+' '+(x.collection||'')).toLocaleLowerCase().includes(query.toLocaleLowerCase()));
      if(sort)filtered.sort((a,b)=>{const av=a[sort],bv=b[sort];if(av===undefined||av===null)return 1;if(bv===undefined||bv===null)return -1;return (av-bv)*(descending?-1:1)});
      list.innerHTML='';list.scrollTop=0;
      if(!filtered.length){list.innerHTML=`<div class="catalog-picker-empty">${field==='Модель'&&!config.collections?.length?'Сначала выберите коллекцию подарков.<button data-picker-choose>Выбрать коллекцию</button>':query?'Ничего не найдено':'Для этой коллекции варианты отсутствуют в предоставленном каталоге.'}</div>`;}else append();refreshAll();
    }
    const click=e=>{
      const b=e.target.closest('button');if(!b||!root.contains(b))return;
      e.preventDefault();e.stopPropagation();
      if(b.hasAttribute('data-picker-close')){config.onClose?.();return;}
      if(b.hasAttribute('data-picker-choose')){config.onChooseCollection?.();return;}
      if(b.hasAttribute('data-picker-reset')){if(single){config.onClose?.();return;}selected.clear();root.querySelectorAll('[data-picker-value]').forEach(x=>x.setAttribute('aria-checked','false'));refreshAll();return;}
      if(b.hasAttribute('data-picker-apply')){config.onApply?.([...selected]);return;}
      if(b.hasAttribute('data-picker-all')){const remove=filtered.length>0&&filtered.every(x=>selected.has(x.value));for(const option of filtered)remove?selected.delete(option.value):selected.add(option.value);root.querySelectorAll('[data-picker-value]').forEach(x=>x.setAttribute('aria-checked',String(selected.has(x.dataset.pickerValue))));refreshAll();return;}
      if(b.dataset.pickerSort){const next=b.dataset.pickerSort;descending=sort===next?!descending:false;sort=next;render();return;}
      if(b.dataset.pickerValue!==undefined){const value=b.dataset.pickerValue;if(single){selected.clear();root.querySelectorAll('[data-picker-value]').forEach(x=>x.setAttribute('aria-checked','false'));selected.add(value);}else selected.has(value)?selected.delete(value):selected.add(value);b.setAttribute('aria-checked',String(selected.has(value)));refreshAll();}
    };
    root.addEventListener('click',click);search.addEventListener('input',()=>{query=search.value;render();});
    root.addEventListener('error',event=>{
      const img=event.target;if(img.tagName!=='IMG'||!img.dataset.catalogSrc)return;
      const png=img.dataset.catalogSrc,normalized=png.replace(/%E2%80%99|%E2%80%98/gi,'%27');
      const variants=[...new Set([png,normalized,png.replace('/png/','/svg/').replace(/\.png$/,'.svg'),normalized.replace('/png/','/svg/').replace(/\.png$/,'.svg')])];
      const attempt=Number(img.dataset.catalogAttempt||0)+1;img.dataset.catalogAttempt=String(attempt);
      if(attempt<variants.length)img.src=variants[attempt];else {img.style.visibility='hidden';img.parentElement.setAttribute('title','Изображение недоступно. '+(img.closest('[aria-label]')?.getAttribute('aria-label')||''));}
    },true);
    host.__pickerDestroy=()=>{observer?.disconnect();imageObserver?.disconnect();};render();
    return {get selected(){return [...selected]},destroy:host.__pickerDestroy};
  };
})();
