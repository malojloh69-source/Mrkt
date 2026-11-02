/* Original TGS animation inside the existing NFT artwork area. */
(() => {
  'use strict';
  let active=null;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const points=[[20,15,.20],[80,5,.24],[140,22,.18],[190,65,.19],[12,92,.17],[53,150,.22],[165,155,.20],[105,175,.12]];
  function destroy(){if(!active)return;active.abort.abort();active.player?.destroy();active.host.classList.remove('nft-animation-ready');active.layer.remove();active=null;}
  async function mount(host,gift){
    destroy();
    if(!host||gift?.source!=='mrktbank_public_gallery'||!gift.url||!window.lottie)return;
    const layer=document.createElement('div');layer.className='nft-animation-layer';layer.setAttribute('aria-hidden','true');
    const background=window.__MRKT_GIFT_DATA?.backdrops?.[gift.background];
    if(background){
      layer.style.background=`radial-gradient(circle at 50% 35%,${background.centerColor},${background.edgeColor})`;
      const pattern=window.__MRKT_GIFT_DATA?.patterns?.[gift.symbol]?.image;
      if(pattern)for(const [x,y,opacity] of points){const stamp=document.createElement('span');stamp.className='nft-animation-pattern';stamp.style.cssText=`left:${x/2.2}%;top:${y/2.2}%;opacity:${opacity};background-color:${background.patternColor};mask-image:url("${new URL(pattern).href.replace(/"/g,'%22')}")`;layer.append(stamp);}
    }
    const scene=document.createElement('div');scene.className='nft-animation-scene';layer.append(scene);host.append(layer);
    const current={host,layer,abort:new AbortController(),player:null};active=current;
    try{
      const slug=gift.url.split('/').at(-1);
      const response=await fetch(`/api/bank-nfts/${encodeURIComponent(slug)}/animation`,{signal:current.abort.signal,credentials:'omit'});
      if(!response.ok)throw Error('animation_unavailable');
      const animationData=await response.json();
      if(active!==current||!host.isConnected)return;
      const player=window.lottie.loadAnimation({container:scene,renderer:'canvas',animationData,loop:true,autoplay:!reduced.matches,rendererSettings:{preserveAspectRatio:'xMidYMid meet'}});
      current.player=player;
      player.addEventListener('DOMLoaded',()=>{if(active===current){if(reduced.matches)player.goToAndStop(Math.min(30,player.totalFrames-1),true);host.classList.add('nft-animation-ready');}});
      player.addEventListener('data_failed',()=>{if(active===current)destroy();});
    }catch{if(active===current)destroy();}
  }
  document.addEventListener('visibilitychange',()=>{if(!active?.player)return;if(document.hidden||reduced.matches)active.player.pause();else active.player.play();});
  reduced.addEventListener('change',()=>{if(!active?.player)return;if(reduced.matches)active.player.pause();else if(!document.hidden)active.player.play();});
  window.__MRKT_NFT_ANIMATION={mount,destroy};
})();
