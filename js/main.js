document.documentElement.classList.add('js');

(function(){
  // soft reveal on scroll (#programs → .final): headings first, then the cards of each grid 60ms apart.
  // Runs first so a later error can't leave content hidden; CSS hides only .r elements, only under html.js.
  var heads='#programs .sec-head,#how .sec-head,#certificate .cert-txt,#reviews .sec-head,#trust .sec-head,#faq .sec-head,.final h2';
  var grids='#progTrack,#how .steps,#certificate .cert,#reviews .rev-track,#trust .know,#faq .acc,.final .fi-copy';
  var watch=[];
  [].forEach.call(document.querySelectorAll(heads),function(el){el.classList.add('r');watch.push(el)});
  [].forEach.call(document.querySelectorAll(grids),function(g){var k=0;
    [].forEach.call(g.children,function(c){if(c.classList.contains('r'))return;   // a heading inside the grid keeps its own timing
      c.classList.add('r');c.style.setProperty('--d',(++k*60)+'ms')});
    watch.push(g)});
  if(!('IntersectionObserver' in window)){watch.forEach(function(el){el.classList.add('in')});return}
  var io=new IntersectionObserver(function(es){es.forEach(function(e){
    if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.2});
  watch.forEach(function(el){io.observe(el)});
})();

(function(){
  var nav=document.getElementById('nav'),hero=document.querySelector('.hero'),product=document.getElementById('product');
  var burger=document.getElementById('burger'),sheet=document.getElementById('sheet');
  var st=document.getElementById('sticky'),stBtn=st.querySelector('a');
  var reduceMq=matchMedia('(prefers-reduced-motion: reduce)');
  // pinned: CSS made the hero sticky (it doesn't with reduced motion or on very short screens)
  // read every frame, not cached: Safari can run this before the stylesheet applies
  var pinned=false,heroH=1,lastP=-1,ticking=false,btnGone=false,atEnd=false;

  function update(){ticking=false;
    // read everything first, then write
    pinned=getComputedStyle(hero).position==='sticky';heroH=hero.offsetHeight||1;
    var y=window.scrollY,navH=nav.offsetHeight,prodTop=product.getBoundingClientRect().top;
    var p=pinned?Math.min(1,Math.max(0,y/heroH)):0;
    nav.classList.toggle('scrolled',y>4);
    // the nav stays transparent over the photo until the top of #product reaches it, or the menu opens
    nav.classList.toggle('over',!sheet.classList.contains('open')&&prodTop>navH);
    // hero → #product: progress for the blur / dim / fade in CSS
    if(p!==lastP){lastP=p;hero.style.setProperty('--hp',p.toFixed(4));hero.classList.toggle('moving',p>0);hero.classList.toggle('covered',p>=1)}
    // sticky CTA (phone): a pinned hero never scrolls its button away, so go by how much of the hero is covered;
    // hidden again over the final block
    var on=(pinned?y>heroH*.6:btnGone)&&!atEnd;
    st.classList.toggle('on',on);st.setAttribute('aria-hidden',!on);stBtn.tabIndex=on?0:-1}
  function schedule(){if(!ticking){ticking=true;requestAnimationFrame(update)}}

  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',schedule);window.addEventListener('load',schedule);
  (reduceMq.addEventListener?reduceMq.addEventListener.bind(reduceMq,'change'):reduceMq.addListener.bind(reduceMq))(schedule);
  update();

  if('IntersectionObserver' in window){
    // without the pinned hero (reduced motion) the CTA still follows the hero button leaving the screen
    new IntersectionObserver(function(e){btnGone=!e[0].isIntersecting&&e[0].boundingClientRect.top<0;schedule()}).observe(document.querySelector('.copy .btn'));
    new IntersectionObserver(function(e){atEnd=e[0].isIntersecting||e[0].boundingClientRect.top<0;schedule()}).observe(document.getElementById('final'));
  }
  // Tab back into a half-covered hero: bring it into full view instead of focusing under the next block
  hero.addEventListener('focusin',function(){if(pinned&&window.scrollY>0)window.scrollTo({top:0})});

  burger.addEventListener('click',function(){var o=sheet.classList.toggle('open');burger.setAttribute('aria-expanded',o);sheet.setAttribute('aria-hidden',!o);update()});

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
})();

(function(){
  // 3–4 · zoom scene (desktop): the mosaic pins, zooms into the centre tile until it fills the screen,
  // then the statement photo and its words appear over it. Only transform and opacity change on scroll
  // (plus the centre tile's corner radius between p .30 and .50); sizes are measured on load / resize.
  var scene=document.querySelector('.zoom-scene');if(!scene)return;
  var stage=scene.querySelector('.zoom-stage'),head=scene.querySelector('#roles .sec-head');
  var mosaic=scene.querySelector('.mosaic'),big=mosaic.querySelector('.tile-p.big');
  var labels=[].slice.call(mosaic.querySelectorAll('.tile-p>b,.glass'));
  var st=scene.querySelector('.statement'),words=[].slice.call(st.querySelectorAll('.st-words>*'));
  // keep in step with the media query of the zoom-scene block in styles.css
  var mq=matchMedia('(min-width:768px) and (min-height:600px) and (prefers-reduced-motion:no-preference)');
  var on=false,top=0,dist=1,vh=1,S=1,dx=0,dy=0,last=-1,lastR=-1,layer=false,ticking=false,pending=false;

  function seg(p,a,b){return Math.min(1,Math.max(0,(p-a)/(b-a)))}
  function ease(t){return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2}   // easeInOutCubic
  function reset(){[head,mosaic,st,big].concat(labels,words).forEach(function(el){el.style.transform='';el.style.opacity=''});
    mosaic.style.pointerEvents=mosaic.style.willChange=mosaic.style.transformOrigin=big.style.borderRadius='';last=lastR=-1;layer=false}

  function measure(){pending=false;
    on=mq.matches;scene.classList.toggle('is-zoom',on);reset();if(!on)return;
    // measured with every transform cleared
    var sc=scene.getBoundingClientRect(),sr=stage.getBoundingClientRect(),mr=mosaic.getBoundingClientRect(),br=big.getBoundingClientRect();
    top=sc.top+window.scrollY;vh=sr.height;dist=Math.max(1,sc.height-sr.height);
    // scale until the centre tile covers the stage in both directions (a hair more, against sub-pixel seams)
    S=Math.max(sr.width/br.width,sr.height/br.height)*1.002;
    // zoom around the tile's centre and slide that centre to the middle of the stage
    mosaic.style.transformOrigin=(br.left-mr.left+br.width/2)+'px '+(br.top-mr.top+br.height/2)+'px';
    dx=sr.left+sr.width/2-(br.left+br.width/2);dy=sr.top+sr.height/2-(br.top+br.height/2);
    render()}
  function remeasure(){if(!pending){pending=true;requestAnimationFrame(measure)}}

  function render(){ticking=false;if(!on)return;
    var y=window.scrollY,p=Math.min(1,Math.max(0,(y-top)/dist));
    // promote the mosaic to its own layer only while the scene is on (or about to come on) screen
    var near=y+2*vh>top&&y<top+dist+vh;if(near!==layer){layer=near;mosaic.style.willChange=near?'transform':''}
    if(p===last)return;last=p;
    // .15–.30 heading fades and lifts
    var h=seg(p,.15,.3);head.style.opacity=h?1-h:'';head.style.transform=h?'translateY('+(-24*h)+'px)':'';
    // .15–.75 mosaic zooms into the centre tile
    var e=ease(seg(p,.15,.75));
    mosaic.style.transform=e?'translate('+(dx*e).toFixed(2)+'px,'+(dy*e).toFixed(2)+'px) scale('+(1+(S-1)*e).toFixed(4)+')':'';
    mosaic.style.pointerEvents=p<.2?'':'none';
    // .30–.50 tile names and the lesson card fade, the centre tile loses its rounding
    var l=seg(p,.3,.5);labels.forEach(function(el){el.style.opacity=l?1-l:''});
    var r=l?(16*(1-l)).toFixed(2)+'px':'';if(r!==lastR){lastR=r;big.style.borderRadius=r}
    // .55–.75 statement photo fades in over the zoomed tile
    var s=seg(p,.55,.75);st.style.opacity=s?s:'';
    // .75–.95 Read · Try · Check, one after another (each dot comes with the word after it)
    words.forEach(function(el,k){var w=Math.ceil(k/2),t=seg(p,.75+w*.065,.82+w*.065);
      el.style.opacity=t?(el.tagName==='I'?.6*t:t):'';el.style.transform=t<1?'translateY('+(12*(1-t)).toFixed(2)+'px)':''})}
  function schedule(){if(!ticking){ticking=true;requestAnimationFrame(render)}}

  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',remeasure);window.addEventListener('load',remeasure);
  (mq.addEventListener?mq.addEventListener.bind(mq,'change'):mq.addListener.bind(mq))(remeasure);
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(remeasure);
  // anything above the scene changing height (fonts, images) moves where the scene starts
  if('ResizeObserver' in window)new ResizeObserver(remeasure).observe(document.body);
  // Tab into a tile while the grid is zoomed: go back to where the grid stands still
  mosaic.addEventListener('focusin',function(){if(on&&last>.15)window.scrollTo({top:top})});
  measure();
})();
