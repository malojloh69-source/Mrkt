
/* Navigation for the current public MRKT banners. */
document.addEventListener('click', event => {
 const ui=window.__MRKT_APP;if(!ui)return;
 const bannerButton=event.target.closest('[data-current-banner]');
 if(bannerButton){
  event.preventDefault();event.stopImmediatePropagation();
  const banner=window.__MRKT_CURRENT_BANNERS?.[Number(bannerButton.dataset.currentBanner)];
  if(!banner)return;
  if(banner.title==='Myth mask улучшена'){
   ui.state.category='gifts';ui.state.query='';ui.state.view='gifts';ui.state.filters={NFT:['Myth Mask'],Модель:[],Фон:[],Символ:[]};ui.state.chips=[];ui.state.min='';ui.state.max='';ui.navigate('/');ui.render();
  }else ui.navigate(banner.route);
  return;
 }
}, true);
