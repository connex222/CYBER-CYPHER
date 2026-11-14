/* First user gesture can enter fullscreen; existing TV fullscreen button remains authoritative. */
(() => {
  'use strict';
  let attempted=false;
  document.addEventListener('click', event => {
    if(attempted || !event.isTrusted || document.fullscreenElement) return;
    if(typeof document.documentElement.requestFullscreen !== 'function') return;
    const target=event.target;
    if(!(target instanceof Element)) return;
    if(target.closest('a,input,select,textarea,[contenteditable="true"]')) return;
    const action=target.closest('button,[role="button"]');
    if(!action||action.disabled) return;
    if(action.matches('[id*="full" i],[class*="fullscreen" i],[data-act="fullscreen"],[data-ecky-fullscreen]')) return;
    attempted=true;
    try{Promise.resolve(document.documentElement.requestFullscreen()).catch(()=>{});}catch(_){}
  },true);
})();
