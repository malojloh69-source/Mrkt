(() => {
 const banner=document.createElement('aside');banner.className='service-banner';banner.setAttribute('aria-label','Источник приложения');
 const label=document.createElement('span');label.textContent='Независимое приложение';
 const status=document.createElement('span');status.id='catalog-source-label';status.textContent='Сохранённый каталог';
 banner.append(label,status);document.body.append(banner);
})();
