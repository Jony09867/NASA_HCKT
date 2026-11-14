const data = window.EXPERIMENTS || [];
const selected = new Set();
const revealed = new Set();
const search = document.querySelector('#search'), fuel = document.querySelector('#fuel');
const cards = document.querySelector('#cards'), empty = document.querySelector('#empty');
const pills = document.querySelector('#fuel-pills'), activeFilters = document.querySelector('#active-filters'), suggestions = document.querySelector('#suggestions');
const esc = value => String(value == null || value === '' ? 'Not available' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const motion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
 entries.forEach(entry => {
  if (!entry.isIntersecting) return;
  observer.unobserve(entry.target);
  revealed.add(entry.target.dataset.index);
  if (!motion.matches) entry.target.classList.add('reveal');
 });
}, { threshold: 0.1 }) : null;
const fuels = [...new Set(data.map(x => x.fuel).filter(Boolean))].sort();
fuels.forEach(x => { const o = document.createElement('option'); o.value = x; o.textContent = x; fuel.appendChild(o); });
if (fuels.length) { fuel.hidden = true; pills.hidden = false; }
function makeButton(label, action, className) {
 const button = document.createElement('button');
 button.type = 'button'; button.className = className; button.textContent = label; button.addEventListener('click', action);
 return button;
}
function renderFilters() {
 pills.replaceChildren();
 [['', 'All fuels'], ...fuels.map(value => [value, value])].forEach(([value, label]) => {
  const button = makeButton(label, () => { fuel.value = value; render(); pills.querySelector('[aria-pressed="true"]').focus(); }, 'fuel-pill');
  button.setAttribute('aria-pressed', String(fuel.value === value)); pills.appendChild(button);
 });
 activeFilters.replaceChildren();
 if (search.value.trim()) activeFilters.appendChild(makeButton(`Search: ${search.value.trim()} ×`, () => { search.value = ''; render(); search.focus(); }, 'filter-chip'));
 if (fuel.value) activeFilters.appendChild(makeButton(`Fuel: ${fuel.value} ×`, () => { fuel.value = ''; render(); }, 'filter-chip'));
 activeFilters.hidden = !activeFilters.childElementCount;
}
function render() {
 const q = search.value.trim().toLowerCase();
 const filtered = data.map((item, index) => ({item, index})).filter(({item: x}) => `${x.name || ''} ${x.objective || ''}`.toLowerCase().includes(q) && (!fuel.value || x.fuel === fuel.value));
 renderFilters();
 document.querySelector('#count').textContent = String(filtered.length).padStart(2,'0');
 document.querySelector('#research-notice').hidden = data.length > 0;
 empty.hidden = filtered.length > 0;
 empty.querySelector('h3').textContent = data.length ? 'No matching investigations' : 'No investigations to show yet';
 empty.querySelector('p').textContent = data.length ? (search.value.trim() ? `No results for “${search.value.trim()}”. Try a different search or remove a filter.` : 'Try another fuel type or clear your filters.') : 'Verified experiment data will appear here when available. Check back later.';
 suggestions.replaceChildren();
 if (data.length && !filtered.length) {
  const label = document.createElement('span'); label.textContent = 'EXPLORE AVAILABLE FUELS'; suggestions.appendChild(label);
  fuels.slice(0, 5).forEach(value => suggestions.appendChild(makeButton(value, () => { search.value = ''; fuel.value = value; render(); }, 'suggestion')));
  suggestions.appendChild(makeButton('Show all investigations', () => { search.value = ''; fuel.value = ''; render(); }, 'suggestion'));
 }
 suggestions.hidden = !suggestions.childElementCount;
 if (observer) observer.disconnect();
 cards.innerHTML = filtered.map(({item: x, index}, position) => `<article class="card" data-index="${index}" style="--fade-delay:${(position % 3) * 60}ms"><span class="eyebrow">INVESTIGATION</span><h3>${esc(x.name)}</h3><p class="objective">${esc(x.objective)}</p><div class="fuel-detail"><b>FUEL TYPE</b>${esc(x.fuel)}</div><div class="card-actions">${/^https?:\/\//i.test(x.sourceUrl || '') ? `<a class="source-link" href="${esc(x.sourceUrl)}" target="_blank" rel="noopener noreferrer">VIEW SOURCE ↗</a>` : '<span class="source-unavailable">SOURCE: Not available</span>'}<button type="button" data-id="${esc(x.id)}" aria-pressed="${selected.has(String(x.id))}">${selected.has(String(x.id)) ? '✓ Selected' : '+ Compare'}</button></div></article>`).join('');
 cards.querySelectorAll('.card').forEach(card => {
  if (observer && !revealed.has(card.dataset.index)) observer.observe(card);
  card.addEventListener('pointermove', event => {
   if (event.pointerType !== 'mouse' || motion.matches) return;
   const rect = card.getBoundingClientRect();
   card.style.setProperty('--light-x', `${event.clientX - rect.left}px`);
   card.style.setProperty('--light-y', `${event.clientY - rect.top}px`);
   card.style.setProperty('--tilt-x', `${((event.clientY - rect.top) / rect.height - 0.5) * -3}deg`);
   card.style.setProperty('--tilt-y', `${((event.clientX - rect.left) / rect.width - 0.5) * 3}deg`);
  });
  card.addEventListener('pointerleave', () => { card.style.removeProperty('--tilt-x'); card.style.removeProperty('--tilt-y'); });
 });
 cards.querySelectorAll('[data-id]').forEach(b => b.onclick = () => { const id=b.dataset.id; if(selected.has(id)) selected.delete(id); else if(selected.size<2) selected.add(id); else { alert('Please remove one investigation before selecting another.'); return; } render(); const button = [...cards.querySelectorAll('[data-id]')].find(item => item.dataset.id === id); if (button) button.focus(); });
 const chosen = [...selected].map(id => data.find(x => String(x.id)===id)).filter(Boolean);
 document.querySelector('#comparison').innerHTML = [0,1].map(i => chosen[i] ? `<div class="slot filled"><span>0${i+1} / INVESTIGATION</span><h3>${esc(chosen[i].name)}</h3>${[['Objective','objective'],['Fuel','fuel'],['Oxygen','oxygen'],['Airflow','airflow'],['Measurements','measurements']].map(([label,key]) => `<div class="row"><b>${label}</b><span>${esc(chosen[i][key])}</span></div>`).join('')}</div>` : `<div class="slot">0${i+1} <span>SELECT AN INVESTIGATION ABOVE ↗</span></div>`).join('');
}
search.addEventListener('input',render); fuel.addEventListener('change',render); document.querySelector('#clear').onclick=()=>{search.value='';fuel.value='';render()}; render();
