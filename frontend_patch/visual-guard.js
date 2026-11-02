/* Artwork is passive. Icons inside dedicated navigation/action controls remain usable. */
window.__MRKT_IMAGE_GUARD = function(doc) {
  const controls='button.gift-image[data-buy],.header-action,.avatar,.category-tab,.nav-item,.cart-button,.gift-cart,.feed-button,.metric,[role="tab"],[class*="_iconButton_1k6lb_"],button[class*="_avatar_"],[class*="_cartButton_"],[class*="_tab_14fxt_"]';
  const isControl=image=>Boolean(image.closest(controls));
  const decorate=scope=>{
    if(!scope?.querySelectorAll)return;
    const images=scope.matches?.('img')?[scope]:scope.querySelectorAll('img');
    images.forEach(img=>{img.draggable=false;if(!isControl(img))img.setAttribute('data-passive-image','');});
  };
  const block=e=>{const img=e.target?.closest?.('img');if(img&&!isControl(img)){e.preventDefault();e.stopImmediatePropagation();}};
  doc.addEventListener('click',block,true);
  doc.addEventListener('auxclick',block,true);
  doc.addEventListener('contextmenu',e=>{if(e.target?.closest?.('img'))e.preventDefault();},true);
  doc.addEventListener('dragstart',e=>{if(e.target?.closest?.('img'))e.preventDefault();},true);
  decorate(doc);
  new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes)decorate(node);}).observe(doc.documentElement,{childList:true,subtree:true});
};
window.__MRKT_IMAGE_GUARD(document);
