
async function loadProducts(){ const res = await fetch('products.json'); return await res.json(); }
function uniq(arr){ return [...new Set(arr)] }
function allSizes(products){ const list=[]; products.forEach(p=> (p.sizes||[]).forEach(s=> list.push(String(s)))); return uniq(list).sort((a,b)=> a.localeCompare(b,'fr',{numeric:true})); }
function formatSizes(sizes){ return (sizes||[]).join(', ') }
function createCard(p){
  const el = document.createElement('article'); el.className='card';
  const retail = p.retail_price ? `<span class="badge">Retail: ${p.retail_price}</span>` : '';
  const market = p.market_avg ? `<span class="badge accent">Marché: ${p.market_avg}</span>` : '';
  const price  = p.price ? `<span class="badge">Prix: ${p.price}</span>` : '';
  const notes  = p.notes ? `<div class="meta">${p.notes}</div>` : '';
  el.innerHTML = `
    <div class="thumb">Image à ajouter</div>
    <h3>${p.brand} ${p.model}</h3>
    <div class="meta">SKU: ${p.sku || '—'} · Tailles: ${formatSizes(p.sizes)}</div>
    <div class="price">${retail}${market}${price}<span class="badge">État: ${p.condition||'—'}</span></div>
    ${notes}
    <div class="actions">
      <a class="btn" href="mailto:sneakmetz@gmail.com?subject=${encodeURIComponent(p.brand+' '+p.model) }">Demander</a>
      <a class="btn primary" href="https://wa.me/33673115263?text=${encodeURIComponent('Hello ! Intéressé par '+p.brand+' '+p.model+' ('+(p.sku||'')+') tailles: '+formatSizes(p.sizes)) }">WhatsApp</a>
    </div>`;
  return el;
}
function normalize(t){ return String(t||'').toLowerCase() }
function matches(p, {q, brand, size, condition}){
  if(q){ const hay = normalize(p.brand+' '+p.model+' '+p.sku); if(!hay.includes(normalize(q))) return false; }
  if(brand && p.brand!==brand) return false;
  if(size){ const s=String(size); const ok=(p.sizes||[]).map(String).includes(s); if(!ok) return false; }
  if(condition && normalize(p.condition)!==normalize(condition)) return false;
  return true;
}
async function main(){
  const grid = document.getElementById('grid');
  const q = document.getElementById('search');
  const brand = document.getElementById('brand');
  const size = document.getElementById('size');
  const condition = document.getElementById('condition');
  const reset = document.getElementById('reset');
  const products = await loadProducts();
  const sizes = allSizes(products);
  sizes.forEach(s=>{ const opt=document.createElement('option'); opt.value=opt.textContent=s; size.appendChild(opt); });
  function render(){
    grid.innerHTML='';
    const filters={ q:q.value.trim(), brand:brand.value, size:size.value, condition:condition.value };
    products.filter(p=>matches(p, filters)).forEach(p=> grid.appendChild(createCard(p)));
    if(!grid.children.length){ const emp=document.createElement('p'); emp.className='meta'; emp.textContent='Aucun résultat. Modifie les filtres.'; grid.appendChild(emp); }
  }
  [q,brand,size,condition].forEach(el=> el.addEventListener('input', render));
  reset.addEventListener('click', ()=>{ q.value=''; brand.value=''; size.value=''; condition.value=''; render(); });
  render();
}
main();
