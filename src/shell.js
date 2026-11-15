import { magnetizeAllPageButtons } from './components/Magnet';
import {readSelection} from './session';
const routes=[['home','/','Home'],['explore','/explore/','Explore'],['compare','/compare/','Compare'],['simulator','/simulator/','Simulator'],['chat','/chat/','SI Chat']];
const page=document.body.dataset.page;
const oldRoutes={'#explore':'/explore/','#compare':'/compare/','#si-intelligence':'/simulator/'};
function redirectLegacy(){const to=oldRoutes[location.hash];if(to)location.replace(to);else if(location.hash==='#about'&&page!=='home')location.replace('/#about');}
redirectLegacy();window.addEventListener('hashchange',redirectLegacy);
document.getElementById('site-header').innerHTML='<header class="site-header"><a class="brand" href="/"><span class="mark">✳</span>FREEFALL<small>EXPLORER</small></a><button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">Menu</button><nav id="site-nav" aria-label="Main navigation">'+routes.map(([key,url,label])=>'<a href="'+url+'"'+(page===key?' aria-current="page"':'')+'>'+label+(key==='compare'?' <span data-selection-count>0</span>':'')+'</a>').join('')+'</nav><span class="badge">NASA SPACE APPS · PROJECT</span></header>';
document.getElementById('site-footer').innerHTML='<footer class="site-footer"><a class="brand" href="/">✳ FREEFALL EXPLORER</a><span>AN INDEPENDENT SPACE APPS PROJECT</span><a href="/#about">About the project ↗</a></footer>';
const toggle=document.querySelector('.nav-toggle'),nav=document.getElementById('site-nav');
function closeNav(){toggle.setAttribute('aria-expanded','false');nav.classList.remove('is-open');}
toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));nav.classList.toggle('is-open',open);});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&toggle.getAttribute('aria-expanded')==='true'){closeNav();toggle.focus();}});
document.addEventListener('click',e=>{if(!e.target.closest('.site-header'))closeNav();});
function updateCount(){const n=readSelection().length;document.querySelectorAll('[data-selection-count]').forEach(el=>el.textContent=n);}
updateCount();window.addEventListener('freefall:selection',updateCount);window.addEventListener('pageshow',updateCount);



// The spotlight follows the pointer on static and dynamically rendered cards.
const spotlightCards = '.steps-grid > a, .spotlight-card, .si-preset-card, .si-rank-card, .si-pillar-card';
document.addEventListener('pointermove', event => {
  if (event.pointerType !== 'mouse' || !matchMedia('(hover: hover) and (pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const card = event.target instanceof Element ? event.target.closest(spotlightCards) : null;
  if (!card) return;
  const rect = card.getBoundingClientRect();
  card.style.setProperty('--spot-x', (event.clientX - rect.left) + 'px');
  card.style.setProperty('--spot-y', (event.clientY - rect.top) + 'px');
}, { passive: true });
magnetizeAllPageButtons();
