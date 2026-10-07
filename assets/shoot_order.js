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
