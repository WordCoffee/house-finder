// ═══════════════════════════════════════════════════════════════
//  app.js  –  HomeBase
//  Nationwide property search · multi-API · fully functional filters
// ═══════════════════════════════════════════════════════════════

// ── DOM refs ─────────────────────────────────────────────────────
const listingsGrid   = document.getElementById('listingsGrid');
const emptyState     = document.getElementById('emptyState');
const loadingState   = document.getElementById('loadingState');
const resultCount    = document.getElementById('resultCount');
const providerStatus = document.getElementById('providerStatus');
const providerSelect = document.getElementById('providerSelect');
const usagePill      = document.getElementById('usagePill');
const savedCount     = document.getElementById('savedCount');

// ── State ────────────────────────────────────────────────────────
let currentListings  = [];
let activeFeatures   = new Set();
let activeModal      = null;
let mapVisible       = false;
let drawerVisible    = false;

// ── Sample data ──────────────────────────────────────────────────
const SAMPLE = [
  {
    id: 's1',
    address: '123 Ranch Ridge Rd',
    city: 'Georgetown', state: 'TX', zip: '78626',
    price: 625000, beds: 4, baths: 3, sqft: 2840, acres: 1.3,
    type: 'House', year: 2019, status: 'for_sale',
    features: ['pool','garage','fenced'],
    image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80',
    url: 'https://www.realtor.com/',
    provider: 'sample', isNew: true,
  },
  {
    id: 's2',
    address: '88 County Road 370',
    city: 'Jarrell', state: 'TX', zip: '76537',
    price: 589000, beds: 3, baths: 2, sqft: 2100, acres: 1.8,
    type: 'House', year: 2016, status: 'for_sale',
    features: ['garage','ranch','fenced'],
    image: 'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?auto=format&fit=crop&w=1200&q=80',
    url: 'https://www.zillow.com/',
    provider: 'sample', isNew: false,
  },
  {
    id: 's3',
    address: '42 Cedar Hollow Ln',
    city: 'Salado', state: 'TX', zip: '76571',
    price: 699000, beds: 4, baths: 3, sqft: 3200, acres: 2.4,
    type: 'House', year: 2021, status: 'for_sale',
    features: ['pool','garage','fireplace','guest'],
    image: 'https://images.unsplash.com/photo-1505691723518-36a5ac3be353?auto=format&fit=crop&w=1200&q=80',
    url: 'https://www.redfin.com/',
    provider: 'sample', isNew: true,
  },
  {
    id: 's4',
    address: '5501 Old Betsy Rd',
    city: 'Waco', state: 'TX', zip: '76706',
    price: 519000, beds: 3, baths: 2, sqft: 1980, acres: 1.1,
    type: 'House', year: 2014, status: 'for_sale',
    features: ['garage','ac'],
    image: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1200&q=80',
    url: 'https://www.realtor.com/',
    provider: 'sample', isNew: false,
  },
  {
    id: 's5',
    address: '2210 Prairie View Rd',
    city: 'Temple', state: 'TX', zip: '76501',
    price: 479000, beds: 4, baths: 2, sqft: 2280, acres: 3.0,
    type: 'House', year: 2012, status: 'for_sale',
    features: ['ranch','horse','fenced','fireplace'],
    image: 'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1200&q=80',
    url: 'https://www.redfin.com/',
    provider: 'sample', isNew: false,
  },
  {
    id: 's6',
    address: '110 Lonesome Creek Dr',
    city: 'Liberty Hill', state: 'TX', zip: '78642',
    price: 665000, beds: 5, baths: 4, sqft: 3590, acres: 1.5,
    type: 'House', year: 2022, status: 'for_sale',
    features: ['pool','garage','waterfront','ac','newkitchen'],
    image: 'https://images.unsplash.com/photo-1523217582562-09d0def993a6?auto=format&fit=crop&w=1200&q=80',
    url: 'https://www.zillow.com/',
    provider: 'sample', isNew: true,
  },
];

// ── Utilities ────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const fmt = n => n == null ? '—' : '$' + Number(n).toLocaleString();

// ── Provider dropdown ────────────────────────────────────────────
function buildProviderSelect() {
  providerSelect.innerHTML = '';
  Object.values(window.PROVIDERS || {}).forEach(p => {
    const o = document.createElement('option');
    o.value = p.id;
    o.textContent = p.enabled ? p.label : p.label + ' (off)';
    providerSelect.appendChild(o);
  });
  providerSelect.value = 'sample';
  updateUsagePill();
}

function onProviderChange() { updateUsagePill(); }
function setSort(sort) {
  document.getElementById('f_sort').value = sort;
  document.querySelectorAll('.quick-sort').forEach(b => b.classList.toggle('active', b.dataset.sort === sort));
  triggerSearch();
}

function toggleFilters(force) {
  const drawer = document.getElementById('filterDrawer');
  drawerVisible = typeof force === 'boolean' ? force : !drawerVisible;
  drawer.classList.toggle('hidden', !drawerVisible);
}


function updateUsagePill() {
  const p = getActiveProvider();
  if (!p) return;
  const used = window.getUsage(p.id);
  if (!isFinite(p.maxFreeCalls)) {
    usagePill.textContent = 'offline';
  } else {
    usagePill.textContent = `${used} / ${p.maxFreeCalls} free`;
  }
}

function getActiveProvider() {
  const id = providerSelect.value || 'sample';
  return (window.PROVIDERS || {})[id] || window.PROVIDERS.sample;
}

// ── Read filters ─────────────────────────────────────────────────
function readFilters() {
  return {
    location:  $('locationInput').value.trim(),
    status:    $('f_status').value,
    minPrice:  Number($('f_minPrice').value) || 0,
    maxPrice:  Number($('f_maxPrice').value) || 0,
    minBeds:   Number($('f_beds').value)     || 0,
    minBaths:  Number($('f_baths').value)    || 0,
    type:      $('f_type').value,
    minAcres:  parseFloat($('f_minAcres').value) || 0,
    maxAcres:  parseFloat($('f_maxAcres').value) || 0,
    minSqft:   Number($('f_minSqft').value)  || 0,
    maxSqft:   Number($('f_maxSqft').value)  || 0,
    minYear:   Number($('f_minYear').value)  || 0,
    maxYear:   Number($('f_maxYear').value)  || 0,
    features:  [...activeFeatures],
    sort:      $('f_sort').value,
  };
}

// ── Feature chips ────────────────────────────────────────────────
function toggleChip(el) {
  const key = el.dataset.key;
  if (activeFeatures.has(key)) {
    activeFeatures.delete(key);
    el.classList.remove('active');
  } else {
    activeFeatures.add(key);
    el.classList.add('active');
  }
}

// ── Reset filters ────────────────────────────────────────────────
function resetFilters() {
  $('f_status').value    = 'for_sale';
  $('f_minPrice').value  = '';
  $('f_maxPrice').value  = '700000';
  $('f_beds').value      = '3';
  $('f_baths').value     = '';
  $('f_type').value      = '';
  $('f_minAcres').value  = '1';
  $('f_maxAcres').value  = '';
  $('f_minSqft').value   = '';
  $('f_maxSqft').value   = '';
  $('f_minYear').value   = '';
  $('f_maxYear').value   = '';
  $('f_sort').value      = 'newest';
  activeFeatures.clear();
  document.querySelectorAll('.chip.active').forEach(c => c.classList.remove('active'));
}

// ── Save/load filters ────────────────────────────────────────────
function saveCurrentFilters() {
  const f = readFilters();
  window.saveFilters(f);
  alert('Search saved! It will be remembered next time you open the app.');
}

function restoreFilters() {
  const f = window.loadFilters();
  if (!f) return;
  if (f.minPrice)  $('f_minPrice').value  = f.minPrice;
  if (f.maxPrice)  $('f_maxPrice').value  = f.maxPrice;
  if (f.minBeds)   $('f_beds').value      = f.minBeds;
  if (f.minBaths)  $('f_baths').value     = f.minBaths;
  if (f.type)      $('f_type').value      = f.type;
  if (f.minAcres)  $('f_minAcres').value  = f.minAcres;
  if (f.maxAcres)  $('f_maxAcres').value  = f.maxAcres;
  if (f.minSqft)   $('f_minSqft').value   = f.minSqft;
  if (f.maxSqft)   $('f_maxSqft').value   = f.maxSqft;
  if (f.minYear)   $('f_minYear').value   = f.minYear;
  if (f.maxYear)   $('f_maxYear').value   = f.maxYear;
  if (f.sort)      $('f_sort').value      = f.sort;
  if (f.features)  f.features.forEach(key => {
    const el = document.querySelector(`.chip[data-key="${key}"]`);
    if (el) { activeFeatures.add(key); el.classList.add('active'); }
  });
  if (f.location)  $('locationInput').value = f.location;
}

// ── Client-side filtering + sorting ─────────────────────────────
function applyFilters(listings, f) {
  return listings.filter(l => {
    if (f.maxPrice && l.price  && l.price  > f.maxPrice)  return false;
    if (f.minPrice && l.price  && l.price  < f.minPrice)  return false;
    if (f.minBeds  && l.beds   && l.beds   < f.minBeds)   return false;
    if (f.minBaths && l.baths  && l.baths  < f.minBaths)  return false;
    if (f.type     && l.type   && l.type.toLowerCase() !== f.type) return false;
    if (f.minAcres && l.acres  && l.acres  < f.minAcres)  return false;
    if (f.maxAcres && l.acres  && l.acres  > f.maxAcres)  return false;
    if (f.minSqft  && l.sqft   && l.sqft   < f.minSqft)   return false;
    if (f.maxSqft  && l.sqft   && l.sqft   > f.maxSqft)   return false;
    if (f.minYear  && l.year   && l.year   < f.minYear)   return false;
    if (f.maxYear  && l.year   && l.year   > f.maxYear)   return false;
    if (f.features.length) {
      const feat = l.features || [];
      if (!f.features.every(k => feat.includes(k))) return false;
    }
    if (f.location) {
      const loc = (l.city + ' ' + l.state + ' ' + l.zip + ' ' + l.address).toLowerCase();
      if (!loc.includes(f.location.toLowerCase())) return false;
    }
    return true;
  }).sort((a, b) => {
    switch (f.sort) {
      case 'price_asc':  return (a.price || 0) - (b.price || 0);
      case 'price_desc': return (b.price || 0) - (a.price || 0);
      case 'acres_desc': return (b.acres || 0) - (a.acres || 0);
      case 'beds_desc':  return (b.beds  || 0) - (a.beds  || 0);
      case 'days_desc':  return (b.daysOnMarket || 0) - (a.daysOnMarket || 0);
      default:           return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
    }
  });
}

// ── Normalize API data to standard shape ─────────────────────────
function normalize(raw, providerId) {
  if (Array.isArray(raw)) return raw.map(x => normalizeItem(x, providerId));
  const list = raw.listings || raw.results || raw.data || raw.properties || [];
  return list.map(x => normalizeItem(x, providerId));
}

function normalizeItem(x, pid) {
  const addr = x.address || x.streetAddress || (x.location && x.location.address && x.location.address.line) || '';
  const city  = x.city || (x.address && x.address.city) || (x.location && x.location.address && x.location.address.city) || '';
  const state = x.state || (x.address && x.address.state_code) || (x.location && x.location.address && x.location.address.state_code) || '';
  const zip   = x.zip || x.zipCode || (x.address && x.address.postal_code) || '';
  const price = x.price || x.list_price || (x.listing && x.listing.price);
  const beds  = x.beds  || x.bedrooms  || (x.listing && x.listing.beds);
  const baths = x.baths || x.bathrooms || (x.listing && x.listing.baths);
  const sqft  = x.sqft  || x.squareFeet || x.living_area;
  const acres = x.lot_acres || (x.lot_size && (x.lot_size.sqft ? x.lot_size.sqft / 43560 : x.lot_size.value)) || (x.lotSize && x.lotSize / 43560);
  const img   = (x.photos && x.photos[0] && (x.photos[0].href || x.photos[0].url)) || x.primary_photo_url || x.imgSrc || x.photo || '';
  const url   = x.rdc_web_url || x.detail_url || x.permalink || x.listing_url || x.url || x.detailUrl || '';
  const feats = Array.isArray(x.features) ? x.features : [];
  if ((x.description || '').toLowerCase().includes('pool')) feats.push('pool');
  if ((x.description || '').toLowerCase().includes('garage')) feats.push('garage');
  return {
    id:       x.property_id || x.id || x.zpid || x.listing_id || String(Math.random()),
    address:  addr,
    city, state, zip,
    price:  Number(price) || 0,
    beds:   Number(beds)  || 0,
    baths:  Number(baths) || 0,
    sqft:   Number(sqft)  || 0,
    acres:  Number(acres) || 0,
    year:   Number(x.year_built || x.yearBuilt || 0),
    daysOnMarket: dom,
    type:   x.type || x.property_type || 'House',
    status: x.status || 'for_sale',
    features: [...new Set(feats)],
    image: img,
    url,
    provider: pid,
    isNew: !!(x.new_listing || x.isNew),
  };
}

// ── Fetch from API ────────────────────────────────────────────────
async function fetchFromAPI(provider, filters) {
  const headers = {};
  if (provider.apiKey) {
    if (provider.apiHost) {
      headers['x-rapidapi-key']  = provider.apiKey;
      headers['x-rapidapi-host'] = provider.apiHost;
    } else {
      headers['X-Api-Key'] = provider.apiKey;
    }
  }

  const params = new URLSearchParams();
  if (filters.location) {
    params.set('city',  filters.location);
    params.set('state', 'TX');
  }
  if (filters.maxPrice) params.set('max_price', filters.maxPrice);
  if (filters.minBeds)  params.set('min_beds', filters.minBeds);
  params.set('limit', '50');

  const res = await fetch(`${provider.searchUrl}?${params}`, { headers });
  if (!res.ok) throw new Error('API error: ' + res.status);
  const data = await res.json();
  return normalize(data, provider.id);
}

// ── Main search trigger ──────────────────────────────────────────
async function triggerSearch() {
  const p = getActiveProvider();
  const f = readFilters();

  showLoading();

  if (!p || !p.enabled || p.id === 'sample') {
    loadSample();
    return;
  }

  try {
    let listings = await fetchFromAPI(p, f);
    if (window.bumpUsage) window.bumpUsage(p.id);
    listings = applyFilters(listings, f);
    currentListings = listings;
    renderListings(listings, f);
    updateUsagePill();
  } catch (err) {
    console.error('Fetch error:', err);
    resultCount.textContent = 'Error loading listings. Showing sample data.';
    loadSample();
  }
}

function loadSample() {
  const f = readFilters();
  const filtered = applyFilters(SAMPLE, f);
  currentListings = filtered;
  renderListings(filtered, f);
}

// ── Render cards ─────────────────────────────────────────────────
function renderListings(listings, f) {
  listingsGrid.innerHTML = '';
  emptyState.classList.add('hidden');
  loadingState.classList.add('hidden');

  if (!listings || !listings.length) {
    emptyState.classList.remove('hidden');
    resultCount.textContent = '0 results';
    return;
  }

  resultCount.textContent = `${listings.length} home${listings.length !== 1 ? 's' : ''}`;

  listings.forEach(l => listingsGrid.appendChild(buildCard(l)));
  updateSavedCount();
}

function buildCard(l) {
  const saved  = window.isSaved(l.id);
  const feats  = l.features || [];

  const card = document.createElement('div');
  card.className = 'card';
  card.onclick = (e) => {
    if (e.target.closest('.card-fav') || e.target.closest('.card-actions')) return;
    openModal(l);
  };

  // Image
  const imgWrap = document.createElement('div');
  imgWrap.className = 'card-img-wrap';

  if (l.image) {
    const img = document.createElement('img');
    img.className = 'card-img';
    img.src = l.image;
    img.alt = l.address;
    img.loading = 'lazy';
    img.onerror = () => { img.style.display='none'; fallback.style.display='flex'; };
    imgWrap.appendChild(img);
  }
  const fallback = document.createElement('div');
  fallback.className = 'card-img-fallback';
  fallback.textContent = '🏡';
  fallback.style.display = l.image ? 'none' : 'flex';
  imgWrap.appendChild(fallback);

  // Badges
  const badges = document.createElement('div');
  badges.className = 'card-badges';
  if (l.isNew)               badges.appendChild(mkBadge('New', 'new'));
  if (feats.includes('pool')) badges.appendChild(mkBadge('Pool', 'pool'));
  if (l.acres >= 1)          badges.appendChild(mkBadge('Acreage', 'acreage'));
  imgWrap.appendChild(badges);

  // Fav button
  const fav = document.createElement('button');
  fav.className = 'card-fav' + (saved ? ' active' : '');
  fav.textContent = saved ? '♥' : '♡';
  fav.title = saved ? 'Remove from saved' : 'Save home';
  fav.onclick = (e) => {
    e.stopPropagation();
    const nowSaved = window.toggleSaved(l);
    fav.textContent = nowSaved ? '♥' : '♡';
    fav.classList.toggle('active', nowSaved);
    updateSavedCount();
  };
  imgWrap.appendChild(fav);
  card.appendChild(imgWrap);

  // Body
  const body = document.createElement('div');
  body.className = 'card-body';

  // Price row
  const priceRow = document.createElement('div');
  priceRow.className = 'card-price-row';
  const price = document.createElement('div');
  price.className = 'card-price';
  price.textContent = fmt(l.price);
  const type = document.createElement('div');
  type.className = 'card-type';
  type.textContent = l.type || 'House';
  priceRow.appendChild(price);
  priceRow.appendChild(type);
  body.appendChild(priceRow);

  // Address
  const addr = document.createElement('div');
  addr.className = 'card-address';
  addr.textContent = l.address || 'Address unavailable';
  body.appendChild(addr);

  const loc = document.createElement('div');
  loc.className = 'card-location';
  loc.textContent = [l.city, l.state, l.zip].filter(Boolean).join(', ');
  body.appendChild(loc);

  // Stats
  const stats = document.createElement('div');
  stats.className = 'card-stats';
  const items = [
    [l.beds,  'bd'],
    [l.baths, 'ba'],
    [l.sqft ? l.sqft.toLocaleString() + ' ft²' : null, null],
    [l.acres ? l.acres + ' ac' : null, null],
    [l.daysOnMarket ? l.daysOnMarket + ' dom' : null, null],
  ];
  items.forEach(([val, unit]) => {
    if (!val) return;
    const s = document.createElement('span');
    s.textContent = unit ? `${val} ${unit}` : val;
    stats.appendChild(s);
  });
  body.appendChild(stats);

  // Feature tags
  if (feats.length) {
    const tags = document.createElement('div');
    tags.className = 'card-features';
    feats.slice(0,4).forEach(k => {
      const t = document.createElement('span');
      t.className = 'feat-tag';
      t.textContent = k;
      tags.appendChild(t);
    });
    body.appendChild(tags);
  }

  // Actions
  const actions = document.createElement('div');
  actions.className = 'card-actions';

  const detail = document.createElement('button');
  detail.textContent = 'Details';
  detail.onclick = (e) => { e.stopPropagation(); openModal(l); };
  actions.appendChild(detail);

  if (l.url) {
    const view = document.createElement('a');
    view.href = l.url;
    view.target = '_blank';
    view.rel = 'noopener noreferrer';
    view.textContent = 'View listing →';
    view.className = 'primary-cta';
    view.onclick = e => e.stopPropagation();
    actions.appendChild(view);
  }

  body.appendChild(actions);
  card.appendChild(body);
  return card;
}

function mkBadge(text, cls) {
  const b = document.createElement('span');
  b.className = `badge ${cls}`;
  b.textContent = text;
  return b;
}

// ── Loading helpers ───────────────────────────────────────────────
function showLoading() {
  listingsGrid.innerHTML = '';
  emptyState.classList.add('hidden');
  loadingState.classList.remove('hidden');
}

// ── Detail modal ──────────────────────────────────────────────────
function openModal(l) {
  activeModal = l;
  const overlay = document.getElementById('modalOverlay');
  const gallery = document.getElementById('modalGallery');
  const body    = document.getElementById('modalBody');

  gallery.innerHTML = l.image
    ? `<img src="${l.image}" alt="${l.address}" />`
    : `<div class="modal-gallery-fallback">🏡</div>`;

  const note = window.getNote(l.id);

  body.innerHTML = `
    <div class="modal-price">${fmt(l.price)}</div>
    <div class="modal-address">${l.address || ''}</div>
    <div class="modal-location">${[l.city, l.state, l.zip].filter(Boolean).join(', ')}</div>

    <div class="modal-stats-grid">
      ${stat(l.beds, 'Beds')}
      ${stat(l.baths, 'Baths')}
      ${stat(l.sqft ? l.sqft.toLocaleString() + ' ft²' : null, 'Sq Ft')}
      ${stat(l.acres ? l.acres + ' ac' : null, 'Lot')}
      ${stat(l.year || null, 'Year built')}
      ${stat(l.type, 'Type')}
    </div>

    ${(l.features && l.features.length) ? `
      <div class="modal-section">
        <div class="modal-section-title">Features</div>
        <div class="modal-tags">
          ${l.features.map(f => `<span class="modal-tag">${f}</span>`).join('')}
        </div>
      </div>
    ` : ''}

    <div class="modal-notes">
      <div class="modal-section-title" style="margin-bottom:6px">My notes</div>
      <textarea
        id="modalNoteArea"
        placeholder="Write your private notes about this home…"
        oninput="window.setNote('${l.id}', this.value)"
      >${note}</textarea>
    </div>

    <div class="modal-actions">
      ${l.url ? `<a class="modal-btn primary" href="${l.url}" target="_blank" rel="noopener noreferrer">View full listing →</a>` : ''}
      <button class="modal-btn" onclick="
        const nowSaved = window.toggleSaved(window.currentListing);
        this.textContent = nowSaved ? '♥ Saved' : '♡ Save home';
        updateSavedCount();
      ">${window.isSaved(l.id) ? '♥ Saved' : '♡ Save home'}</button>
    </div>
  `;

  window.currentListing = l;
  overlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function stat(val, lbl) {
  if (!val) return '';
  return `<div class="modal-stat"><div class="modal-stat-val">${val}</div><div class="modal-stat-lbl">${lbl}</div></div>`;
}

function closeModal(e) {
  if (e && e.target !== document.getElementById('modalOverlay')) return;
  document.getElementById('modalOverlay').classList.add('hidden');
  document.body.style.overflow = '';
  activeModal = null;
}

// ── Saved panel ───────────────────────────────────────────────────
function showSaved() {
  const panel = document.getElementById('savedPanel');
  const list  = document.getElementById('savedList');
  const saved = window.getSaved();
  panel.classList.remove('hidden');

  list.innerHTML = '';
  if (!saved.length) {
    list.innerHTML = '<div class="empty-state" style="padding:30px 10px"><div class="empty-icon">♡</div><div class="empty-title">No saved homes yet</div><div class="empty-sub">Tap the heart on any listing to save it here.</div></div>';
    return;
  }

  saved.forEach(l => {
    const row = document.createElement('div');
    row.className = 'saved-card-mini';
    row.onclick = () => { hideSaved(); openModal(l); };
    row.innerHTML = `
      <img src="${l.image || ''}" alt="${l.address}" onerror="this.style.display='none'" />
      <div class="saved-card-mini-info">
        <div class="saved-card-mini-price">${fmt(l.price)}</div>
        <div class="saved-card-mini-addr">${l.address || '—'}, ${l.city || ''}</div>
      </div>
      <button class="saved-remove" title="Remove" onclick="event.stopPropagation();removeSaved('${l.id}',this.closest('.side-panel'))">✕</button>
    `;
    list.appendChild(row);
  });
}

function hideSaved() { document.getElementById('savedPanel').classList.add('hidden'); }

function removeSaved(id, panel) {
  const arr = window.getSaved().filter(l => l.id !== id);
  window.setSaved(arr);
  updateSavedCount();
  showSaved();
}

function updateSavedCount() {
  savedCount.textContent = window.getSaved().length;
}

// ── Mobile map toggle ─────────────────────────────────────────────
function toggleMobileMap() {
  const map = document.getElementById('mapPanel');
  const btn = document.getElementById('mobileMapToggle');
  mapVisible = !mapVisible;
  map.classList.toggle('mobile-visible', mapVisible);
  btn.textContent = mapVisible ? 'Hide map' : 'Show map';
}

// ── Theme toggle ──────────────────────────────────────────────────
function toggleTheme() {
  document.body.classList.toggle('dark');
  const btn = document.getElementById('themeToggle');
  btn.textContent = document.body.classList.contains('dark') ? '☀' : '☽';
}

// ── Init ──────────────────────────────────────────────────────────
(function init() {
  buildProviderSelect();
  restoreFilters();
  updateSavedCount();
  const initialSort = document.getElementById('f_sort').value || 'newest';
  document.querySelectorAll('.quick-sort').forEach(b => b.classList.toggle('active', b.dataset.sort === initialSort));
  loadSample();
})();
