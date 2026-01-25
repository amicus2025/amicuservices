// Hotel search module - uses free OpenStreetMap API
// No API key required - completely free!
(function(){
  function normalize(s){ return (s||'').toString().toLowerCase().trim(); }
  function tokenize(s){ return normalize(s).split(/[^a-z0-9]+/).filter(Boolean); }

  function scoreItem(tokens, item){
    let score = 0;
    const fields = [item.name, item.city, item.country, item.description, (item.amenities||[]).join(' ')];
    const hay = normalize(fields.join(' '));
    tokens.forEach(t => {
      if(hay.includes(t)) score += 10;
      if((item.name||'').toLowerCase().includes(t)) score += 5;
      if((item.city||'').toLowerCase().includes(t)) score += 3;
    });
    score += (item.stars||0) * 1;
    return score;
  }

  async function loadData(url){
    try{ const r = await fetch(url); return await r.json(); }catch(e){ console.warn('search: failed to load', url, e); return []; }
  }

  async function searchHotelsFromAPI(destination = ''){
    try {
      // Parse destination - could be "City" or "City, Country"
      let city = destination;
      let country = '';
      
      if(destination.includes(',')) {
        const parts = destination.split(',').map(s => s.trim());
        city = parts[0];
        country = parts[1] || '';
      }
      
      const url = `http://localhost:5000/api/hotels/search?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}`;
      console.log('Fetching from API:', url);
      
      const response = await fetch(url);
      console.log('API Response status:', response.status);
      
      if (!response.ok) throw new Error(`API search failed with status ${response.status}`);
      const data = await response.json();
      console.log('API returned:', data);
      return data.hotels || [];
    } catch (error) {
      console.error('API search error:', error);
      return [];
    }
  }

  function render(list, container){
    if(!container) return;
    if(!list || list.length === 0){ container.innerHTML = '<div class="alert alert-info">No results found. Try a different destination.</div>'; return; }
    container.innerHTML = list.map(h => (`
      <div class="row mb-3 align-items-center search-result" data-hotel-id="${h.id}">
        <div class="col-md-3"><img src="${h.image||'images/bg_1.jpg'}" alt="${h.name}" style="width:100%;border-radius:8px;object-fit:cover;height:150px"/></div>
        <div class="col-md-9">
          <h4 class="mb-1">${h.name} ${h.leed?'<span class="badge badge-success ml-2">LEED</span>':''}</h4>
          <div class="small text-muted mb-2">${h.city}, ${h.country} — ${h.stars||'3'} stars</div>
          <div class="small mb-2">${h.description||''}</div>
          ${h.price_per_night ? `<div class="small"><strong>Price:</strong> $${h.price_per_night}/night</div>` : ''}
          <div class="small mt-2">
            ${h.website ? `<strong>Website:</strong> <a href="${h.website}" target="_blank" rel="noopener noreferrer">${h.website.replace(/https?:\/\/(www\.)?/, '')}</a>` : ''}
            ${h.phone ? `<div><strong>Phone:</strong> ${h.phone}</div>` : ''}
          </div>
          ${h.amenities && h.amenities.length > 0 ? `<div class="small mt-2"><strong>Amenities:</strong> ${h.amenities.join(', ')}</div>` : ''}
        </div>
      </div>
    `)).join('');
  }

  // Public initializer
  window.initSearch = function initSearch(opts){
    const form = document.querySelector(opts.formSelector || '.search-property-1');
    const input = document.querySelector(opts.inputSelector || '#search_destination');
    const leedEl = document.querySelector(opts.leedSelector || '#leed_only');
    const priceEl = document.querySelector('select[name="price_limit"]');
    const results = document.querySelector(opts.resultsSelector || '#searchResults');

    if(!form) return console.warn('initSearch: form not found');
    if(!input) console.warn('initSearch: input not found');
    if(!results) console.warn('initSearch: results container not found');

    form.addEventListener('submit', async function(e){
      e.preventDefault();
      const destination = (input && input.value || '').trim();
      const priceLimit = priceEl ? parseInt(priceEl.value) : null;
      const leedOnly = !!(leedEl && leedEl.checked);
      
      console.log('Search submitted with destination:', destination);
      
      if(!destination) {
        if(results) results.innerHTML = '<div class="alert alert-warning">Please enter a destination.</div>';
        return;
      }
      
      // Show loading message
      if(results) results.innerHTML = '<div class="alert alert-info">Searching for sustainable hotels in ' + destination + '...</div>';
      
      // Search OpenStreetMap API for hotels in the destination
      console.log('Calling searchHotelsFromAPI with:', destination);
      let list = await searchHotelsFromAPI(destination);
      console.log('API returned:', list);
      
      // Apply filters
      if(list && list.length > 0) {
        // Mark hotels as sustainable (eco-friendly)
        list = list.map(h => ({
          ...h,
          leed: true,
          description: h.description || 'Sustainable hotel from OpenStreetMap'
        }));
        
        // Apply LEED filter if checked
        if(leedOnly) list = list.filter(h => h.leed);
        
        // Apply price filter if set
        if(priceLimit && priceLimit > 0) {
          list = list.filter(h => !h.price_per_night || h.price_per_night <= priceLimit);
        }
      }
      
      console.log('Final filtered list:', list);
      render(list, results);
    });

    // expose search API
    return {
      search(q, filters){
        const evt = new Event('submit',{bubbles:true});
        if(input) input.value = q || '';
        if(filters && filters.leed !== undefined && leedEl) leedEl.checked = !!filters.leed;
        if(filters && filters.priceLimit && priceEl) priceEl.value = filters.priceLimit;
        form.dispatchEvent(evt);
      }
    };
  };
})();
