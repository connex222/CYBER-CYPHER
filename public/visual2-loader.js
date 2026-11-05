/* CYBER CYPHER Visual 2.0 safe activation: missing binaries => unchanged Alpha art. */
(function(){
  'use strict';
  var paths=['/assets/visual2/lobby.webp','/assets/visual2/board.webp','/assets/visual2/results.webp','/assets/visual2/zero-day.webp'];
  Promise.all(paths.map(function(path){
    return new Promise(function(resolve,reject){
      var img=new Image();
      img.onload=function(){ if(img.naturalWidth>0) resolve(); else reject(); };
      img.onerror=reject; img.src=path;
    });
  })).then(function(){document.documentElement.classList.add('visual2-ready');})
     .catch(function(){ /* Keep original approved visuals if any asset is unavailable. */ });
})();
