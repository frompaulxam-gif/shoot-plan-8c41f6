(function(){
'use strict';
const key='merchants_drinks_shoot_v1';
let saved={};
try{saved=JSON.parse(localStorage.getItem(key)||'{}')||{};}catch(e){}
const checks=Array.from(document.querySelectorAll('[data-shot]'));
function update(){document.querySelector('.progress').textContent=checks.filter(c=>c.checked).length+' of '+checks.length+' filmed';}
checks.forEach(c=>{c.checked=!!saved[c.dataset.shot];c.addEventListener('change',()=>{saved[c.dataset.shot]=c.checked;try{localStorage.setItem(key,JSON.stringify(saved));}catch(e){document.querySelector('.save-note').textContent='Progress is only available until you leave this page.';}update();});});
update();
document.addEventListener('play',e=>{if(e.target.tagName==='VIDEO')document.querySelectorAll('video').forEach(v=>{if(v!==e.target){v.pause();const card=v.closest('.reel');if(card)card.classList.remove('is-playing');}});},true);
function revealAnchor(){const id=decodeURIComponent(location.hash.slice(1));const el=document.getElementById(id);if(!el)return;const details=el.closest('details');if(details){details.open=true;requestAnimationFrame(()=>el.scrollIntoView());}}
window.addEventListener('hashchange',revealAnchor);revealAnchor();
})();

/* Full reference viewer. Short clips keep their own playback controls. */
(function(){
'use strict';
const references=new Map();
document.querySelectorAll('.full-refs .reel, .extra-refs .reel').forEach(card=>{
  const link=card.querySelector('.drink-title a');
  const stage=card.querySelector('[data-src]');
  if(link&&stage) references.set(link.href,{title:link.textContent.trim(),src:stage.dataset.src,poster:stage.querySelector('img')?.getAttribute('src')||'',url:link.href});
});
const dialog=document.createElement('dialog');
dialog.className='full-video-dialog';
dialog.setAttribute('aria-labelledby','full-video-title');
dialog.innerHTML='<div class="full-video-heading"><div><p>FULL VIDEO</p><h2 id="full-video-title"></h2></div><button type="button" class="full-video-close" aria-label="Close full video" autofocus>×</button></div><video controls playsinline preload="metadata"></video><p class="full-video-error" role="status" hidden>Could not load this video. Try the original below.</p><a class="full-video-original" target="_blank" rel="noopener noreferrer">View original on Instagram ↗</a>';
document.body.appendChild(dialog);
const video=dialog.querySelector('video');
const title=dialog.querySelector('h2');
const original=dialog.querySelector('a');
const error=dialog.querySelector('.full-video-error');
let previousOverflow='';
function open(ref){
  document.querySelectorAll('video').forEach(v=>v.pause());
  title.textContent=ref.title;
  video.setAttribute('aria-label','Full video: '+ref.title);
  video.poster=ref.poster;
  error.hidden=true;
  original.href=ref.url;
  video.src=ref.src;
  previousOverflow=document.body.style.overflow;
  document.body.style.overflow='hidden';
  dialog.showModal();
  video.play().catch(()=>{}); // Native play remains available if autoplay is blocked.
}
dialog.querySelector('.full-video-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{
  if(event.target!==dialog)return;
  const r=dialog.getBoundingClientRect();
  if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();
});
dialog.addEventListener('close',()=>{
  video.pause();
  video.removeAttribute('src');
  video.load();
  document.body.style.overflow=previousOverflow;
});
video.addEventListener('error',()=>{if(dialog.open)error.hidden=false;});
document.querySelectorAll('.shot').forEach(shot=>{
  const link=shot.querySelector('.source');
  const ref=link&&references.get(link.href);
  if(!ref)return;
  link.textContent='Watch full video';
  link.href=ref.src;
  link.setAttribute('aria-haspopup','dialog');
  link.addEventListener('click',event=>{event.preventDefault();open(ref);});
  shot.querySelectorAll('.examples figure').forEach(figure=>{
    const clip=figure.querySelector('video');
    const frame=document.createElement('div');frame.className='clip-frame';
    clip.before(frame);frame.appendChild(clip);
    const button=document.createElement('button');
    button.type='button';button.className='open-full-video';
    button.setAttribute('aria-label','Watch full video: '+ref.title+' ('+figure.querySelector('figcaption').textContent+')');
    button.setAttribute('aria-haspopup','dialog');
    const badge=document.createElement('span');badge.textContent='Full video ↗';button.appendChild(badge);
    frame.appendChild(button);
    button.addEventListener('click',()=>open(ref));
  });
});
// The full-reference gallery opens the same viewer, including keyboard activation.
document.addEventListener('click',event=>{
  const stage=event.target.closest('.full-refs .reel__stage, .extra-refs .reel__stage');
  if(!stage)return;
  const link=stage.closest('.reel').querySelector('.drink-title a');
  const ref=link&&references.get(link.href);
  if(ref){event.preventDefault();event.stopImmediatePropagation();open(ref);}
},true);
})();
