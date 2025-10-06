function createCard(p){
  const el = document.createElement('article'); 
  el.className='card';

  const retail = p.retail_price ? `<span class="badge">Retail: ${p.retail_price}</span>` : '';
  const market = p.market_avg ? `<span class="badge accent">Marché: ${p.market_avg}</span>` : '';
  const price  = p.price ? `<span class="badge">Prix: ${p.price}</span>` : '';
  const notes  = p.notes ? `<div class="meta">${p.notes}</div>` : '';

  // 👉 affiche l'image si p.image existe (URL externe ou images/xxx.png), sinon fallback
  const img = p.image
    ? `<img class="thumb" src="${p.image}" alt="${p.brand} ${p.model}"
           onerror="this.outerHTML='<div class=\\'thumb\\'>Image indisponible</div>'">`
    : `<div class="thumb">Image à ajouter</div>`;

  el.innerHTML = `
    ${img}
    <h3>${p.brand} ${p.model}</h3>
    <div class="meta">SKU: ${p.sku || '—'} · Tailles: ${formatSizes(p.sizes)}</div>
    <div class="price">${retail}${market}${price}<span class="badge">État: ${p.condition||'—'}</span></div>
    ${notes}
    <div class="actions">
      <a class="btn" href="mailto:sneakmetz@gmail.com?subject=${encodeURIComponent(p.brand+' '+p.model)}">Demander</a>
      <a class="btn primary" href="https://wa.me/33673115263?text=${encodeURIComponent('Hello ! Intéressé par '+p.brand+' '+p.model+' ('+(p.sku||'')+') tailles: '+formatSizes(p.sizes))}">WhatsApp</a>
    </div>`;
  return el;
}
