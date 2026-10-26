/* Mode tampilan: auto / light / dark. Dimuat di <head> supaya tidak berkedip. */
(function(){
  var K='pv.theme',mq=window.matchMedia?matchMedia('(prefers-color-scheme: dark)'):null;
  function get(){try{var v=localStorage.getItem(K);return v?JSON.parse(v):'auto'}catch(e){return 'auto'}}
  function isDark(m){return m==='dark'||(m==='auto'&&!!mq&&mq.matches)}
  function apply(m){
    var r=document.documentElement,d=isDark(m);r.dataset.theme=d?'dark':'light';r.dataset.mode=m;
    var c=document.querySelector('meta[name=theme-color]');if(c)c.setAttribute('content',d?'#23272f':'#e6ebf2');
  }
  function set(m){try{localStorage.setItem(K,JSON.stringify(m))}catch(e){}apply(m)}
  window.PVTheme={get:get,set:set,apply:apply};
  apply(get());
  try{mq&&mq.addEventListener('change',function(){if(get()==='auto')apply('auto')})}catch(e){}
})();
