(function(){
  'use strict';

  /* ---- one reel plays at a time ------------------------------- */
  var current = null;

  /* a failure the viewer can read and report, instead of a dead poster */
  function fail(stage, msg){
    var card = stage.closest('.reel, .seam__card, .clip');
    if(card) card.classList.remove('is-playing');
    if(current === card) current = null;
    if(stage.querySelector('.reel__failed')) return;
    var w = document.createElement('span');
    w.className = 'reel__nofile reel__failed';
    w.textContent = msg;
    stage.appendChild(w);
  }

  function stop(card){
    if(!card) return;
    var v = card.querySelector('video');
    if(v){ v.pause(); }
    card.classList.remove('is-playing');
    if(current === card) current = null;
  }

  function start(stage){
    var card = stage.closest('.reel, .seam__card, .clip');
    if(!card) return;
    var src = stage.getAttribute('data-src');
    if(!src) return;

    // already playing? toggle off.
    var existing = stage.querySelector('video');
    if(existing && !existing.paused){ stop(card); return; }

    if(current && current !== card) stop(current);

    if(!existing){
      var img   = stage.querySelector('img');
      var ratio = img ? getComputedStyle(img).aspectRatio : '9 / 16';

      var v = document.createElement('video');
      // iOS Safari: muted and playsinline must be set as ATTRIBUTES and
      // must land BEFORE src, or the inline-autoplay policy refuses play()
      // even though the element is muted. Order here is deliberate.
      v.setAttribute('muted','');
      v.muted = true;
      v.setAttribute('playsinline','');
      v.setAttribute('webkit-playsinline','');   // iOS < 10
      v.playsInline = true;
      v.setAttribute('loop','');
      v.loop = true;
      v.preload = 'auto';
      v.src = src;
      v.style.aspectRatio = ratio;
      v.addEventListener('error', function(){
        var c = v.error && v.error.code;
        // code 4 covers both "browser can't decode it" and "file missing",
        // so don't guess between them in the message.
        fail(stage, c === 4
          ? 'This one will not play here. Send Paul the reel name.'
          : 'Could not load the video. Check your connection and try again.');
      });
      if(img) img.style.display = 'none';
      stage.insertBefore(v, stage.firstChild);

      // sound toggle, only once the video exists
      var snd = document.createElement('button');
      snd.type = 'button';
      snd.className = 'reel__sound';
      snd.textContent = 'Sound on';
      snd.addEventListener('click', function(e){
        e.stopPropagation();
        v.muted = !v.muted;
        snd.textContent = v.muted ? 'Sound on' : 'Sound off';
      });
      stage.appendChild(snd);
      existing = v;
    }

    // optimistic so the card responds instantly, but self-correcting:
    // if play() is refused, put the play button back rather than leaving
    // a card with no affordance and no moving picture.
    card.classList.add('is-playing');
    current = card;
    var p = existing.play();
    if(p && p.catch) p.catch(function(err){
      card.classList.remove('is-playing');
      if(current === card) current = null;
      if(err && err.name === 'NotAllowedError'){
        fail(stage, 'Your browser blocked playback. Tap again.');
      }
    });
  }

  document.querySelectorAll('.reel__stage[data-src]').forEach(function(stage){
    stage.addEventListener('click', function(){ start(stage); });
  });

  /* ---- scroll reveal ------------------------------------------ */
  var items = document.querySelectorAll('.reveal');
  if(!('IntersectionObserver' in window) ||
     matchMedia('(prefers-reduced-motion: reduce)').matches){
    items.forEach(function(el){ el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(en.isIntersecting){ en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin:'0px 0px -8% 0px', threshold:0.08 });
    items.forEach(function(el){ io.observe(el); });
  }

  /* ---- pause the hero when it scrolls away -------------------- */
  var hero = document.querySelector('.hero__frame video');
  if(hero && 'IntersectionObserver' in window){
    new IntersectionObserver(function(e){
      e[0].isIntersecting ? hero.play().catch(function(){}) : hero.pause();
    }, { threshold:0.15 }).observe(hero);
  }
})();

/* ================= like picker =================
   Tap the heart on any slide to shortlist it. Review sorts each pick
   into "the photo" or "the text". Saved in this browser (localStorage),
   Copy list exports plain text to send on. */
(function(){
  'use strict';
  var HOLDERS = '.chic__img, .opt2__img, .pool__img';
  if(!document.querySelector(HOLDERS)) return;
  var KEY='myard_likes_v1', state={};
  try{ state=JSON.parse(localStorage.getItem(KEY)||'{}'); }catch(e){ state={}; }
  function save(){ try{ localStorage.setItem(KEY,JSON.stringify(state)); }catch(e){} }

  function lineFor(holder){
    var card=holder.closest('li, figure');
    var cap=card && card.querySelector('.chic__line, .opt2__cap, .pool__cap');
    return cap ? cap.textContent.trim().replace(/\s+/g,' ').replace('\u2192',' \u2192 ') : '';
  }

  var hearts={};
  document.querySelectorAll(HOLDERS).forEach(function(holder){
    var img=holder.querySelector('img');
    if(!img) return;
    var id=img.getAttribute('src');
    if(!id || id.indexOf('/reference/')!==-1) return;   // the @lh_social_ examples are not pickable
    var b=document.createElement('button');
    b.type='button'; b.className='lk'; b.textContent='♥';
    b.setAttribute('aria-label','Add to my list');
    if(state[id]) b.classList.add('is-on');
    b.addEventListener('click', function(e){
      e.preventDefault(); e.stopPropagation();
      if(state[id]){ delete state[id]; b.classList.remove('is-on'); }
      else{ state[id]={line:lineFor(holder), photo:false, text:false, ts:Date.now()}; b.classList.add('is-on'); }
      save(); tray();
    });
    holder.appendChild(b);
    hearts[id]=b;
  });

  /* tray */
  var trayEl=document.createElement('div');
  trayEl.className='lktray';
  trayEl.innerHTML='<span class="lktray__n"></span>'+
    '<button type="button" data-act="review">Review</button>'+
    '<button type="button" class="ghost" data-act="copy">Copy list</button>'+
    '<a class="ghost" href="review.html" style="font-family:var(--mono);font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#8d887a;border:1px solid #4a463d;padding:7px 10px;text-decoration:none">Yes / no →</a>';
  document.body.appendChild(trayEl);
  function tray(){
    var n=Object.keys(state).length;
    trayEl.querySelector('.lktray__n').textContent=n+' liked';
    trayEl.classList.toggle('is-show', n>0);
  }

  /* review panel */
  var panel=document.createElement('div');
  panel.className='lkpanel';
  panel.innerHTML='<div class="lkpanel__head"><span class="lkpanel__title">My list</span>'+
    '<button type="button" class="tagbtn" data-act="close">Close</button></div>'+
    '<p class="lkpanel__sub">For each one: is it the photo you like, the text, or both? '+
    'Tap to tag, then Copy list and send it over. Saved on this device.</p><div class="lkpanel__rows"></div>';
  document.body.appendChild(panel);

  function renderPanel(){
    var box=panel.querySelector('.lkpanel__rows'); box.innerHTML='';
    Object.keys(state).sort(function(a,b){ return state[a].ts-state[b].ts; }).forEach(function(id){
      var it=state[id];
      var row=document.createElement('div'); row.className='lkrow';
      row.innerHTML='<img src="'+id+'" alt="">'+
        '<span class="lkrow__line">'+(it.line||'(photo only)')+'</span>'+
        '<span class="lkrow__ctl">'+
        '<button type="button" class="tagbtn'+(it.photo?' is-on':'')+'" data-t="photo">photo</button>'+
        '<button type="button" class="tagbtn'+(it.text?' is-on':'')+'" data-t="text">text</button>'+
        '<button type="button" class="lkrow__x" aria-label="Remove">×</button></span>';
      row.querySelectorAll('.tagbtn[data-t]').forEach(function(tb){
        tb.addEventListener('click', function(){
          it[tb.dataset.t]=!it[tb.dataset.t];
          tb.classList.toggle('is-on', it[tb.dataset.t]); save();
        });
      });
      row.querySelector('.lkrow__x').addEventListener('click', function(){
        delete state[id];
        if(hearts[id]) hearts[id].classList.remove('is-on');
        save(); tray(); renderPanel();
      });
      box.appendChild(row);
    });
  }

  function exportText(){
    var ids=Object.keys(state).sort(function(a,b){ return state[a].ts-state[b].ts; });
    var out=['MERCHANTS YARD PICKS ('+ids.length+')',''];
    ids.forEach(function(id,i){
      var it=state[id];
      var tag=it.photo&&it.text?'photo + text':it.photo?'photo':it.text?'text':'untagged';
      out.push((i+1)+'. ['+tag+'] '+(it.line||'(photo only)'));
      out.push('   '+id); out.push('');
    });
    return out.join('\n');
  }
  window.__likesExport=exportText;

  trayEl.addEventListener('click', function(e){
    var act=e.target.dataset&&e.target.dataset.act;
    if(act==='review'){ renderPanel(); panel.classList.add('is-show'); }
    if(act==='copy'){
      var t=exportText();
      var done=function(){ e.target.textContent='Copied'; setTimeout(function(){ e.target.textContent='Copy list'; },1600); };
      if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(t).then(done,function(){ window.prompt('Copy this:',t); }); }
      else window.prompt('Copy this:',t);
    }
  });
  panel.addEventListener('click', function(e){
    if(e.target.dataset&&e.target.dataset.act==='close') panel.classList.remove('is-show');
  });

  tray();
})();
