(function(){
  var nav=document.getElementById('nav'),hero=document.querySelector('.hero');
  var burger=document.getElementById('burger'),sheet=document.getElementById('sheet');
  // the nav stays transparent over the photo until the hero scrolls away or the menu opens
  var onScroll=function(){var y=window.scrollY;nav.classList.toggle('scrolled',y>4);
    nav.classList.toggle('over',!sheet.classList.contains('open')&&y<hero.offsetHeight-64)};
  window.addEventListener('scroll',onScroll,{passive:true});window.addEventListener('resize',onScroll);onScroll();

  burger.addEventListener('click',function(){var o=sheet.classList.toggle('open');burger.setAttribute('aria-expanded',o);sheet.setAttribute('aria-hidden',!o);onScroll()});

  document.querySelectorAll('[data-cta]').forEach(function(b){
    b.addEventListener('click',function(e){
      var r=b.getBoundingClientRect(),d=Math.max(r.width,r.height)*2.2,s=document.createElement('span');
      s.className='ripple';s.style.width=s.style.height=d+'px';
      s.style.left=((e.clientX||r.left+r.width/2)-r.left-d/2)+'px';s.style.top=((e.clientY||r.top+r.height/2)-r.top-d/2)+'px';
      b.appendChild(s);setTimeout(function(){s.remove()},650);
    });
  });
})();

(function(){
  // 2 · ecosystem: one product video; the list follows its chapters, a click jumps to one
  var v=document.getElementById('ecoV'),box=v.parentNode,pp=document.getElementById('ecoPP');
  var tabs=[].slice.call(document.querySelectorAll('[data-eco]')),list=tabs[0].closest('ol');
  var CH=[0,6,17,24],END=32,cur=-1,userPaused=false,visible=false,loaded=false,raf=0;
  var mqD=matchMedia('(min-width:768px)'),reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var posterM=v.getAttribute('poster');
  function chapterAt(t){var i=0;for(var k=1;k<CH.length;k++)if(t>=CH[k]-.05)i=k;return i}
  function setTab(i){if(i===cur)return;cur=i;
    tabs.forEach(function(t,k){t.setAttribute('aria-selected',k===i);t.tabIndex=k===i?0:-1;if(k!==i)t.style.setProperty('--p',0)});
    if(!mqD.matches){var b=tabs[i].parentNode,l=b.offsetLeft-16,r=b.offsetLeft+b.offsetWidth+16;
      if(l<list.scrollLeft||r>list.scrollLeft+list.clientWidth)list.scrollTo({left:l,behavior:'smooth'})}}
  function tick(){var t=v.currentTime||0,i=chapterAt(t),e=CH[i+1]||END;setTab(i);
    tabs[i].style.setProperty('--p',Math.max(0,Math.min(1,(t-CH[i])/(e-CH[i]))).toFixed(4));
    raf=v.paused?0:requestAnimationFrame(tick)}
  function load(){var src=v.dataset[mqD.matches?'srcD':'srcM'];if(loaded===src)return;
    var t=loaded?v.currentTime:0;loaded=src;v.poster=mqD.matches?v.dataset.posterD:posterM;v.src=src;
    if(t)v.addEventListener('loadedmetadata',function(){v.currentTime=t},{once:true})}
  function sync(){box.classList.toggle('paused',v.paused);pp.setAttribute('aria-label',v.paused?'Play video':'Pause video')}
  function play(){load();var r=v.play();if(r&&r.catch)r.catch(function(){sync()})}
  function want(){return visible&&!userPaused&&!reduce}
  v.addEventListener('play',function(){sync();if(!raf)raf=requestAnimationFrame(tick)});
  v.addEventListener('pause',sync);v.addEventListener('seeked',function(){if(v.paused)tick()});
  pp.addEventListener('click',function(){if(v.paused){userPaused=false;reduce=false;play()}else{userPaused=true;v.pause()}});
  tabs.forEach(function(t,k){t.addEventListener('click',function(){load();userPaused=false;reduce=false;
    var go=function(){v.currentTime=CH[k]+.04;setTab(k);play()};if(v.readyState>=1)go();else v.addEventListener('loadedmetadata',go,{once:true});play()})});
  list.addEventListener('keydown',function(e){var d=e.key==='ArrowDown'||e.key==='ArrowRight'?1:e.key==='ArrowUp'||e.key==='ArrowLeft'?-1:0;
    if(!d)return;e.preventDefault();var n=tabs[(cur+d+tabs.length)%tabs.length];n.focus();n.click()});
  (mqD.addEventListener?mqD.addEventListener.bind(mqD,'change'):mqD.addListener.bind(mqD))(function(){if(loaded){var p=!v.paused;load();if(p)play()}else v.poster=mqD.matches?v.dataset.posterD:posterM});
  if(mqD.matches)v.poster=v.dataset.posterD;
  setTab(0);sync();
  if('IntersectionObserver' in window){
    new IntersectionObserver(function(e){visible=e[0].isIntersecting;if(visible&&!loaded)load();if(want())play();else if(!visible&&!v.paused)v.pause()},{threshold:.35}).observe(box);
  }else{load();if(!reduce)play()}

  // 5 · programs arrows (desktop)
  var pt=document.getElementById('progTrack');
  document.querySelectorAll('[data-scroll]').forEach(function(b){b.addEventListener('click',function(){
    pt.scrollBy({left:(+b.dataset.scroll)*(pt.firstElementChild.offsetWidth+16),behavior:'smooth'})})});

  // sticky CTA: after the hero button leaves the screen, hidden again over the final block
  var st=document.getElementById('sticky'),stBtn=st.querySelector('a'),past=false,atEnd=false;
  function upd(){var on=past&&!atEnd;st.classList.toggle('on',on);st.setAttribute('aria-hidden',!on);stBtn.tabIndex=on?0:-1}
  if('IntersectionObserver' in window){
    new IntersectionObserver(function(e){past=!e[0].isIntersecting&&e[0].boundingClientRect.top<0;upd()}).observe(document.querySelector('.copy .btn'));
    new IntersectionObserver(function(e){atEnd=e[0].isIntersecting||e[0].boundingClientRect.top<0;upd()}).observe(document.getElementById('final'));
  }
})();
