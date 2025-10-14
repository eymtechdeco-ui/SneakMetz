// --- Charge toujours la dernière version du JSON (pas de cache) ---
async function loadProducts(){
  const res = await fetch('products.json', { cache: 'no-store' });
  if(!res.ok) throw new Error('Impossible de charger products.json ('+res.status+')');
  return await res.json();
}

// ---------- helpers ----------
function uniq(arr){ return [...new Set(arr)] }
function allSizes(products){
  const list=[]; products.forEach(p => (p.sizes||[]).forEach(s => list.push(String(s))));
  return uniq(list).sort((a,b)=> a.localeCompare(b,'fr',{numeric:true}));
}
function allBrands(products){
  return uniq(products.map(p=>p.brand).filter(Boolean)).sort((a,b)=> a.localeCompare(b,'fr'));
}
function allConditions(products){
  return uniq(products.map(p=>p.condition||'').filter(Boolean)).sort((a,b)=> a.localeCompare(b,'fr'));
}
function formatSizes(sizes){ return (sizes||[]).join(', ') }
function normalize(t){ return String(t||'').toLowerCase() }

// ---------- image failover (direct -> proxies) ----------
const IMG_PROXIES = [
  u => u, // direct
  u => `https://images.weserv.nl/?url=${encodeURIComponent(u)}`,
  u => `https://wsrv.nl/?url=${encodeURIComponent(u)}`,
  u => `https://i0.wp.com/${u.replace(/^https?:\/\//,'')}`, // WordPress CDN
];

function buildImageChain(url){
  if(!url) return [];
  return IMG_PROXIES.map(m => m(url));
}

// global handler pour passer à la source suivante si erreur
window._nextImg = function(img){
  try{
    const left = JSON.parse(decodeURIComponent(img.getAttribute('data-srcs')||'[]'));
    if(left.length){
      const next = left.shift();
      img.setAttribute('data-srcs', encodeURIComponent(JSON.stringify(left)));
      img.src = next;
    }else{
      img.outerHTML = '<div class="thumb">Image indisponible</div>';
    }
  }catch(e){
    img.outerHTML = '<div class="thumb">Image indisponible</div>';
  }
};

// ---------- filtres ----------
function matches(p, {q, brand, size, condition}){
  if(q){
    const hay = normalize((p.brand||'')+' '+(p.model||'')+' '+(p.sku||''));
    if(!hay.includes(normalize(q))) return false;
  }
  if(brand && p.brand !== brand) return false;
  if(size){
    const s = String(size);
    const ok = (p.sizes||[]).map(String).includes(s);
    if(!ok) return false;
  }
  if(condition && normalize(p.condition)!==normalize(condition)) return false;
  return true;
}

// ---------- carte produit ----------
function createCard(p){
  const el = document.createElement('article');
  el.className='card';

  const retail = p.retail_price ? `<span class="badge">Retail: ${p.retail_price}</span>` : '';
  const market = p.market_avg ? `<span class="badge accent">Marché: ${p.market_avg}</span>` : '';
  const price  = p.price ? `<span class="badge">Prix: ${p.price}</span>` : '';
  const notes  = p.notes ? `<div class="meta">${p.notes}</div>` : '';

  let imgHtml = `<div class="thumb">Image à ajouter</div>`;
  if(p.image){
    const chain = buildImageChain(p.image);
    if(chain.length){
      const first = chain.shift();
      const data = encodeURIComponent(JSON.stringify(chain));
      imgHtml = `<img class="thumb" src="${first}" data-srcs="${data}"
                   alt="${(p.brand||'')+' '+(p.model||'')}"
                   onerror="window._nextImg && _nextImg(this)">`;
    }
  }

  el.innerHTML = `
    ${imgHtml}
    <h3>${p.brand||''} ${p.model||''}</h3>
    <div class="meta">SKU: ${p.sku || '—'} · Tailles: ${formatSizes(p.sizes)}</div>
    <div class="price">${retail}${market}${price}<span class="badge">État: ${p.condition||'—'}</span></div>
    ${notes}
    <div class="actions">
      <a class="btn" href="mailto:sneakmetz@gmail.com?subject=${encodeURIComponent((p.brand||'')+' '+(p.model||''))}">Demander</a>
      <a class="btn" href="https://wa.me/33673115263?text=${encodeURIComponent('Hello ! Intéressé par '+(p.brand||'')+' '+(p.model||'')+' ('+(p.sku||'')+') tailles: '+formatSizes(p.sizes))}">WhatsApp</a>
    </div>
  `;
  return el;
}

// ---------- main ----------
async function main(){
  const grid = document.getElementById('grid');
  const q = document.getElementById('search');
  const brand = document.getElementById('brand');
  const size = document.getElementById('size');
  const condition = document.getElementById('condition');
  const reset = document.getElementById('reset');

  let products=[];
  try{
    products = await loadProducts();
  }catch(e){
    console.error(e);
    const warn = document.createElement('p');
    warn.className = 'meta';
    warn.textContent = '⚠️ Impossible de charger products.json. Vérifie que le fichier est bien à la racine.';
    grid.appendChild(warn);
    return;
  }

  allBrands(products).forEach(b=>{ const o=document.createElement('option'); o.value=o.textContent=b; brand.appendChild(o); });
  allSizes(products).forEach(s=>{ const o=document.createElement('option'); o.value=o.textContent=s; size.appendChild(o); });
  allConditions(products).forEach(c=>{ const o=document.createElement('option'); o.value=o.textContent=c; condition.appendChild(o); });

  function render(){
    grid.innerHTML='';
    const filters = { q:q.value.trim(), brand:brand.value, size:size.value, condition:condition.value };
    const list = products.filter(p=>matches(p, filters));
    list.forEach(p=> grid.appendChild(createCard(p)));
    if(!grid.children.length){
      const emp=document.createElement('p'); emp.className='meta'; emp.textContent='Aucun résultat. Modifie les filtres.'; grid.appendChild(emp);
    }
  }

  [q,brand,size,condition].forEach(el=> el.addEventListener('input', render));
  reset.addEventListener('click', ()=>{ q.value=''; brand.value=''; size.value=''; condition.value=''; render(); });
  render();
}
main();
