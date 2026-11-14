const data = window.EXPERIMENTS || [];
const selected = new Set();
const search = document.querySelector('#search'), fuel = document.querySelector('#fuel');
const esc = value => String(value || 'Not available').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
[...new Set(data.map(x => x.fuel).filter(Boolean))].sort().forEach(x => { const o = document.createElement('option'); o.value = x; o.textContent = x; fuel.appendChild(o); });
function render() {
 const q = search.value.trim().toLowerCase();
 const filtered = data.filter(x => `${x.name || ''} ${x.objective || ''}`.toLowerCase().includes(q) && (!fuel.value || x.fuel === fuel.value));
 document.querySelector('#count').textContent = String(filtered.length).padStart(2,'0');
 document.querySelector('#empty').hidden = filtered.length > 0;
 document.querySelector('#cards').innerHTML = filtered.map(x => `<article class="card"><span class="eyebrow">INVESTIGATION</span><h3>${esc(x.name)}</h3><p>${esc(x.objective)}</p><p><b>FUEL</b> ${esc(x.fuel)}</p>${/^https?:\/\//i.test(x.sourceUrl || '') ? `<a href="${esc(x.sourceUrl)}" target="_blank" rel="noopener">SOURCE ↗</a>` : ''}<button data-id="${esc(x.id)}">${selected.has(String(x.id)) ? '✓ Selected' : '+ Compare'}</button></article>`).join('');
 document.querySelectorAll('[data-id]').forEach(b => b.onclick = () => { const id=b.dataset.id; if(selected.has(id)) selected.delete(id); else if(selected.size<2) selected.add(id); else { alert('Please remove one investigation before selecting another.'); return; } render(); });
 const chosen = [...selected].map(id => data.find(x => String(x.id)===id)).filter(Boolean);
 document.querySelector('#comparison').innerHTML = [0,1].map(i => chosen[i] ? `<div class="slot filled"><span>0${i+1} / INVESTIGATION</span><h3>${esc(chosen[i].name)}</h3>${[['Objective','objective'],['Fuel','fuel'],['Oxygen','oxygen'],['Airflow','airflow'],['Measurements','measurements']].map(([label,key]) => `<div class="row"><b>${label}</b><span>${esc(chosen[i][key])}</span></div>`).join('')}</div>` : `<div class="slot">0${i+1} <span>SELECT AN INVESTIGATION ABOVE ↗</span></div>`).join('');
}
search.addEventListener('input',render); fuel.addEventListener('change',render); document.querySelector('#clear').onclick=()=>{search.value='';fuel.value='';render()}; render();
