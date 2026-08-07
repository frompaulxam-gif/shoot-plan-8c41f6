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
