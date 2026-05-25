// app.js – core logic

const providerSelect  = document.getElementById('providerSelect');
const resultCount     = document.getElementById('resultCount');
const resultsGrid     = document.getElementById('resultsGrid');
const filterDrawer    = document.getElementById('filterDrawer');
const usagePill       = document.getElementById('usagePill');

function providerReady(p) {
  if (!p || !p.enabled) return false;
  if (!p.apiKey || String(p.apiKey).includes('YOUR_')) return false;
  return true;
}

function getActiveProvider() {
  const id = providerSelect ? providerSelect.value || 'combined' : 'combined';
  return id === 'combined' ? null : (window.PROVIDERS || {})[id] || null;
}

function updateUsagePill() {
  if (!usagePill) return;
  const p = getActiveProvider();
  if (!p) { usagePill.textContent = 'combined'; return; }
  const used = window.getUsage ? window.getUsage(p.id) : 0;
  if (!isFinite(p.maxFreeCalls)) usagePill.textContent = used + ' calls';
  else usagePill.textContent = used + ' / ' + p.maxFreeCalls;
}

function populateProviderDropdown() {
  if (!providerSelect) return;
  providerSelect.innerHTML = '';
  const addOpt = (val, label) => {
    const o = document.createElement('option');
    o.value = val; o.textContent = label;
    providerSelect.appendChild(o);
  };
  addOpt('combined', 'All free sources (combined)');
  const ps = window.PROVIDERS || {};
  [1,2,3].forEach(tier => {
    Object.values(ps).filter(p => p.tier === tier).forEach(p => {
      const used = window.getUsage ? window.getUsage(p.id) : 0;
      const remaining = isFinite(p.maxFreeCalls) ? Math.max(p.maxFreeCalls - used, 0) : '∞';
      const tag = p.manualOnly ? ' [manual]' : '';
      addOpt(p.id, `T${tier}: ${p.label}${tag} (${remaining} left)`);
    });
  });
}

function readFilters() {
  const g = id => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
  return {
    location:  g('f_location'),
    maxPrice:  parseFloat(g('f_maxPrice'))  || null,
    minBeds:   parseInt(g('f_minBeds'))     || null,
    minBaths:  parseFloat(g('f_minBaths'))  || null,
    minAcres:  parseFloat(g('f_minAcres'))  || null,
    maxAcres:  parseFloat(g('f_maxAcres'))  || null,
    type:      g('f_type'),
    features:  g('f_features'),
    sort:      g('f_sort') || 'newest',
  };
}

function showLoading() {
  if (resultsGrid) resultsGrid.innerHTML = '<div class="loading-msg">Searching listings…</div>';
  if (resultCount) resultCount.textContent = 'Searching…';
}

function showError(msg) {
  if (resultsGrid) resultsGrid.innerHTML = `<div class="empty-state">${msg}</div>`;
  if (resultCount) resultCount.textContent = 'Error';
}

function normalizeItem(x, providerId) {
  const price   = x.price ?? x.listPrice ?? x.list_price ?? x.priceRaw ?? x.listing_price ?? null;
  const address = x.address ?? x.streetAddress ?? x.street_address ?? x.location?.address ?? x.full_address ?? '';
  const city    = x.city    ?? x.location?.city    ?? '';
  const state   = x.state   ?? x.location?.state   ?? x.stateCode ?? '';
  const zip     = x.zip     ?? x.zipCode   ?? x.location?.zip ?? x.postal_code ?? '';
  const beds    = x.beds    ?? x.bedrooms  ?? x.bedsCount ?? null;
  const baths   = x.baths   ?? x.bathrooms ?? x.bathsCount ?? null;
  const sqft    = x.sqft    ?? x.livingArea ?? x.squareFeet ?? x.size ?? null;
  const lotSize = x.lotSize ?? x.lot_size  ?? x.lotSizeAcres ?? x.acreage ?? null;
  const acres   = lotSize ? (lotSize > 100 ? lotSize / 43560 : lotSize) : null;
  const photos  = x.photos ?? x.images ?? x.media ?? [];
  const photo   = Array.isArray(photos) ? photos[0] : (typeof photos === 'string' ? photos : null);
  const photoUrl = (typeof photo === 'string') ? photo : photo?.url ?? photo?.href ?? null;
  const dom = x.daysOnMarket ?? x.dom ?? x.daysListed ?? null;
  const listed = x.listedDate ?? x.listDate ?? x.date_listed ?? null;
  const mlsId = x.mlsId ?? x.mls_id ?? x.zpid ?? x.rfId ?? null;
  const link = x.url ?? x.propertyUrl ?? x.listing_url ?? x.detailUrl ?? null;
  const keyRaw = address + '|' + city + '|' + state + '|' + zip;
  const key = keyRaw.toLowerCase().replace(/\s+/g,' ').trim();
  return {
    id:       mlsId ?? key || Math.random().toString(36).slice(2),
    address, city, state, zip,
    price:    typeof price === 'string' ? parseFloat(price.replace(/[^0-9.]/g,'')) : price,
    beds, baths, sqft,
    acres:    acres ? parseFloat(acres.toFixed(2)) : null,
    photo:    photoUrl,
    dom, listed, mlsId, link,
    type:     x.propertyType ?? x.property_type ?? x.type ?? '',
    status:   x.status ?? x.listingStatus ?? 'for_sale',
    source:   providerId,
    _score:   0,
    _raw:     x,
  };
}

function normalize(raw, providerId) {
  const list = raw.listings ?? raw.results ?? raw.data ?? raw.properties ??
               raw.listing ?? raw.hits ?? raw.items ?? raw.home_search?.results ?? raw.list ?? [];
  return (Array.isArray(list) ? list : [list]).filter(Boolean).map(x => normalizeItem(x, providerId));
}

function dedupeListings(list) {
  const map = new Map();
  list.forEach(l => {
    const key = l.address.toLowerCase().replace(/\s+/g,' ').trim() + '|' + l.city.toLowerCase() + '|' + l.state.toLowerCase() + '|' + l.zip;
    if (!key.replace(/\|/g,'').trim()) return;
    const score = (l.photo ? 20 : 0) + (l.price ? 15 : 0) + (l.beds ? 10 : 0) + (l.baths ? 5 : 0) +
                  (l.acres ? 10 : 0) + (l.sqft ? 5 : 0) + (l.dom !== null ? 5 : 0) + (l.mlsId ? 10 : 0);
    l._score = score;
    if (!map.has(key) || score > map.get(key)._score) {
      if (map.has(key)) {
        l._sources = [...(map.get(key)._sources || [map.get(key).source]), l.source].filter(Boolean);
      } else {
        l._sources = [l.source];
      }
      map.set(key, l);
    }
  });
  return Array.from(map.values());
}

function applyFilters(list, f) {
  return list.filter(l => {
    if (f.maxPrice && l.price  && l.price  > f.maxPrice) return false;
    if (f.minBeds  && l.beds   && l.beds   < f.minBeds)  return false;
    if (f.minBaths && l.baths  && l.baths  < f.minBaths) return false;
    if (f.minAcres && l.acres  && l.acres  < f.minAcres) return false;
    if (f.maxAcres && l.acres  && l.acres  > f.maxAcres) return false;
    if (f.type && l.type && !l.type.toLowerCase().includes(f.type.toLowerCase())) return false;
    if (f.location) {
      const loc = (l.address+' '+l.city+' '+l.state+' '+l.zip).toLowerCase();
      if (!loc.includes(f.location.toLowerCase())) return false;
    }
    return true;
  });
}

function sortListings(list, sort) {
  const s = sort || 'newest';
  return [...list].sort((a,b) => {
    if (s==='price_asc')  return (a.price||0)-(b.price||0);
    if (s==='price_desc') return (b.price||0)-(a.price||0);
    if (s==='acres_desc') return (b.acres||0)-(a.acres||0);
    if (s==='dom_asc')    return (a.dom??999)-(b.dom??999);
    return (a.dom??999)-(b.dom??999);
  });
}

function buildHeaders(p) {
  const h = {};
  if (p.apiHost) {
    h['x-rapidapi-key']  = p.apiKey;
    h['x-rapidapi-host'] = p.apiHost;
  } else if (p.id === 'rentcast') {
    h['X-Api-Key'] = p.apiKey;
  } else if (p.id === 'zillowAlt') {
    h['Authorization'] = 'Bearer ' + p.apiKey;
  }
  return h;
}

function buildParams(p, f) {
  const params = new URLSearchParams();
  if (p.id === 'rentcast') {
    params.set('status','active');
    if (f.location) params.set('city', f.location);
    if (f.maxPrice) params.set('maxPrice', f.maxPrice);
    if (f.minBeds)  params.set('minBeds', f.minBeds);
    if (f.minBaths) params.set('minBaths', f.minBaths);
    if (f.minAcres) params.set('minLotSize', Math.round(f.minAcres * 43560));
    params.set('limit','50');
  } else if (p.id === 'zillowAlt') {
    if (f.location) params.set('location', f.location);
    params.set('status','forSale');
    if (f.maxPrice) params.set('maxPrice', f.maxPrice);
    if (f.minBeds)  params.set('bedsMin', f.minBeds);
    params.set('resultsPerPage','50');
  } else {
    if (f.location) { params.set('city', f.location); params.set('location', f.location); }
    if (f.maxPrice) { params.set('maxPrice', f.maxPrice); params.set('max_price', f.maxPrice); }
    if (f.minBeds)  { params.set('minBeds', f.minBeds); params.set('beds_min', f.minBeds); }
    if (f.minBaths) { params.set('minBaths', f.minBaths); }
    if (f.minAcres) params.set('minLotSize', Math.round(f.minAcres * 43560));
    params.set('status','for_sale');
    params.set('limit','50');
    params.set('offset','0');
  }
  return params;
}

async function fetchFromAPI(p, f) {
  const headers = buildHeaders(p);
  const params  = buildParams(p, f);
  const sep = p.searchUrl.includes('?') ? '&' : '?';
  const res = await fetch(p.searchUrl + sep + params, { headers });
  if (!res.ok) throw new Error(p.label + ' ' + res.status);
  const data = await res.json();
  return normalize(data, p.id);
}

const TIER_THRESHOLD = 30;

async function fetchCombined(f) {
  const ps = window.PROVIDERS || {};
  const tiers = window.PROVIDER_TIERS || { tier1:[], tier2:[], tier3:[] };

  const t1ids = (tiers.tier1 || []).filter(id => {
    const p = ps[id];
    return p && !p.manualOnly && providerReady(p) && window.canUseProvider(id);
  });
  const t1Tasks = t1ids.map(id => fetchFromAPI(ps[id], f).catch(() => []));
  const t1Results = (await Promise.all(t1Tasks)).flat();
  if (window.bumpUsage) t1ids.forEach(id => window.bumpUsage(id));
  const t1Deduped = dedupeListings(t1Results);

  let allListings = t1Deduped;

  if (t1Deduped.length < TIER_THRESHOLD) {
    const t2ids = (tiers.tier2 || []).filter(id => {
      const p = ps[id];
      return p && !p.manualOnly && providerReady(p) && window.canUseProvider(id);
    });
    const t2Tasks = t2ids.map(id => fetchFromAPI(ps[id], f).catch(() => []));
    const t2Results = (await Promise.all(t2Tasks)).flat();
    if (window.bumpUsage) t2ids.forEach(id => window.bumpUsage(id));
    allListings = dedupeListings([...t1Results, ...t2Results]);
  }

  return allListings;
}

function renderListings(listings, f) {
  if (!resultsGrid) return;
  const sorted = sortListings(listings, f ? f.sort : 'newest');
  if (resultCount) resultCount.textContent = sorted.length + ' listing' + (sorted.length!==1?'s':'');

  if (!sorted.length) {
    resultsGrid.innerHTML = '<div class="empty-state"><div style="font-size:40px;margin-bottom:12px">🏠</div><div style="font-weight:700;margin-bottom:8px">No listings found</div><div style="color:var(--muted);font-size:13px">Try expanding your search area or adjusting filters.</div></div>';
    return;
  }

  resultsGrid.innerHTML = sorted.map(l => {
    const price   = l.price ? '$' + l.price.toLocaleString() : 'Price N/A';
    const acres   = l.acres ? l.acres + ' ac' : '';
    const beds    = l.beds  ? l.beds  + ' bd' : '';
    const baths   = l.baths ? l.baths + ' ba' : '';
    const dom     = l.dom   ? l.dom + ' days on market' : '';
    const details = [beds, baths, acres, dom].filter(Boolean).join(' · ');
    const saved   = window.isSaved ? window.isSaved(l.id) : false;
    const src     = (l._sources && l._sources.length > 1)
                  ? '<div class="listing-sources">Seen in ' + l._sources.length + ' sources</div>'
                  : '<div class="listing-sources">' + (l.source || '') + '</div>';
    const photo   = l.photo
                  ? '<img class="listing-photo" src="' + l.photo + '" alt="property photo" loading="lazy">'
                  : '<div class="listing-photo listing-photo-placeholder">🏠</div>';
    const link    = l.link
                  ? '<a href="' + l.link + '" target="_blank" rel="noopener" class="listing-link-btn">View listing ↗</a>'
                  : '';
    return '<div class="listing-card" data-id="' + l.id + '">' +
             photo +
             '<div class="listing-body">' +
             '<div class="listing-price">' + price + '</div>' +
             '<div class="listing-address">' + l.address + '</div>' +
             '<div class="listing-meta">' + l.city + (l.state ? ', '+l.state : '') + (l.zip ? ' '+l.zip : '') + '</div>' +
             '<div class="listing-details">' + details + '</div>' +
             src +
             '<div class="listing-actions">' +
             link +
             '<button class="save-btn ' + (saved?'saved':'') + '" onclick="handleSave(\'' + l.id + '\',this)">' + (saved ? '♥ Saved' : '♡ Save') + '</button>' +
             '</div></div></div>';
  }).join('');
}

let currentListings = [];

function handleSave(id, btn) {
  const l = currentListings.find(x => x.id === id);
  if (!l) return;
  const isSavedNow = window.toggleSaved(l);
  btn.textContent = isSavedNow ? '♥ Saved' : '♡ Save';
  btn.classList.toggle('saved', isSavedNow);
}

async function triggerSearch() {
  const f = readFilters();
  if (window.saveFilters) window.saveFilters(f);
  showLoading();
  updateUsagePill();

  const activeId = providerSelect ? providerSelect.value : 'combined';

  try {
    let listings = [];

    if (activeId === 'combined') {
      listings = await fetchCombined(f);
    } else {
      const p = window.PROVIDERS[activeId];
      if (!p || !providerReady(p)) {
        showError('Provider not ready. Check config.js for this API.');
        return;
      }
      if (p.manualOnly && activeId === 'rentcast' && !window.canUseProvider('rentcast')) {
        showError('RentCast monthly limit reached (50/50 calls).');
        return;
      }
      listings = await fetchFromAPI(p, f);
      if (window.bumpUsage) window.bumpUsage(activeId);
    }

    listings = applyFilters(listings, f);
    currentListings = listings;
    renderListings(listings, f);
    updateUsagePill();
    populateProviderDropdown();
  } catch (err) {
    showError('Error: ' + err.message + '<br><small>Check your API hosts in config.js or try a different provider.</small>');
    console.error(err);
  }
}

function setSort(val) {
  const el = document.getElementById('f_sort');
  if (el) el.value = val;
  document.querySelectorAll('.quick-sort').forEach(b => b.classList.toggle('active', b.dataset.sort===val));
  if (currentListings.length) renderListings(currentListings, readFilters());
}

function toggleFilterDrawer() {
  if (filterDrawer) filterDrawer.classList.toggle('open');
}

function resetFilters() {
  ['f_location','f_maxPrice','f_minBeds','f_minBaths','f_minAcres','f_maxAcres','f_type','f_features'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  setSort('newest');
}

function toggleTheme() {
  const body = document.body;
  const isLight = body.classList.toggle('light-mode');
  const btn = document.getElementById('themeToggle');
  if (btn) btn.textContent = isLight ? '🌙' : '☀';
  try { localStorage.setItem('hb_theme', isLight ? 'light':'dark'); } catch {}
}

function showSaved() {
  const panel = document.getElementById('savedPanel');
  const body  = document.getElementById('savedBody');
  if (!panel || !body) return;
  panel.classList.remove('hidden');
  const saved = window.getSaved ? window.getSaved() : [];
  if (!saved.length) {
    body.innerHTML = '<div class="settings-note">No saved listings yet. Click ♡ on any card.</div>';
    return;
  }
  body.innerHTML = saved.map(l => {
    const price = l.price ? '$'+l.price.toLocaleString() : 'N/A';
    return '<div class="settings-provider-row">' +
           '<div class="settings-provider-main">' +
           '<div class="settings-provider-name">' + l.address + '</div>' +
           '<div class="settings-provider-meta">' + l.city + (l.state?', '+l.state:'') + ' · ' + price + '</div>' +
           '</div>' +
           '<button onclick="removeSaved(\'' + l.id + '\',this.parentElement)" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:18px">✕</button>' +
           '</div>';
  }).join('');
}

function hideSaved() {
  const el = document.getElementById('savedPanel');
  if (el) el.classList.add('hidden');
}

function removeSaved(id, row) {
  const arr = window.getSaved().filter(l => l.id !== id);
  window.setSaved(arr);
  if (row) row.remove();
  const card = resultsGrid ? resultsGrid.querySelector('[data-id="'+id+'"] .save-btn') : null;
  if (card) { card.textContent = '♡ Save'; card.classList.remove('saved'); }
}

function showSettings() {
  const panel = document.getElementById('settingsPanel');
  const body  = document.getElementById('settingsBody');
  if (!panel || !body) return;
  panel.classList.remove('hidden');
  const ps = window.PROVIDERS || {};
  const tiers = window.PROVIDER_TIERS || { tier1:[], tier2:[], tier3:[] };
  const rcUsage = window.getUsage('rentcast');

  let html = '';
  if (rcUsage >= 25) {
    html += '<div style="background:rgba(249,115,115,.15);border:1px solid rgba(249,115,115,.4);border-radius:10px;padding:12px 14px;margin-bottom:14px;font-size:13px;color:#f97373">⚠️ RentCast has used <strong>' + rcUsage + ' of 50</strong> calls this month.</div>';
  }

  [1,2,3].forEach(tier => {
    const ids = (tiers['tier'+tier] || []).filter(id => ps[id]);
    if (!ids.length) return;
    const label = tier===1 ? 'Tier 1 — Always active' : tier===2 ? 'Tier 2 — Fills gaps' : 'Tier 3 — Manual / deep check';
    html += '<div class="settings-section-title">' + label + '</div>';
    ids.forEach(id => {
      const p = ps[id];
      const used = window.getUsage(id);
      const max  = isFinite(p.maxFreeCalls) ? p.maxFreeCalls : null;
      const remaining = max ? Math.max(max - used, 0) : null;
      const pct = max ? (remaining / max) : 1;
      const badgeClass = pct <= 0.1 ? 'danger' : pct <= 0.5 ? 'warn' : 'good';
      const badgeLabel = pct <= 0.1 ? 'Low' : pct <= 0.5 ? 'Half' : 'OK';
      const leftStr = max ? (remaining + ' / ' + max + ' left') : '∞ left';
      html += '<div class="settings-provider-row">' +
              '<div class="settings-provider-main">' +
              '<div class="settings-provider-name">' + p.label + (p.manualOnly?'<span style="font-size:10px;color:var(--muted);margin-left:6px">[manual]</span>':'') + '</div>' +
              '<div class="settings-provider-meta">' + used + ' calls used this month · ' + leftStr + '</div>' +
              '</div>' +
              '<div class="settings-provider-usage"><span class="settings-badge ' + badgeClass + '">' + badgeLabel + '</span></div>' +
              '</div>';
    });
  });

  const za = ps['zillowAlt'];
  if (za) {
    const used = window.getUsage('zillowAlt');
    const rem  = Math.max(za.maxFreeCalls - used, 0);
    const pct  = rem / za.maxFreeCalls;
    const bc   = pct<=.1?'danger':pct<=.5?'warn':'good';
    const bl   = pct<=.1?'Low':pct<=.5?'Half':'OK';
    html += '<div class="settings-section-title">OpenWeb Ninja</div>' +
            '<div class="settings-provider-row">' +
            '<div class="settings-provider-main">' +
            '<div class="settings-provider-name">' + za.label + '</div>' +
            '<div class="settings-provider-meta">' + used + ' used · ' + rem + ' / ' + za.maxFreeCalls + ' left</div>' +
            '</div>' +
            '<div class="settings-provider-usage"><span class="settings-badge ' + bc + '">' + bl + '</span></div>' +
            '</div>';
  }

  html += '<div style="margin-top:16px;padding-top:12px;border-top:1px solid var(--border)">' +
          '<button onclick="resetMonthlyCounters()" class="nav-btn ghost" style="font-size:12px">Reset monthly counters</button>' +
          '<div class="settings-note">Counters reset automatically each calendar month. Use this button only if you need a manual reset.</div>' +
          '</div>';

  body.innerHTML = html;
}

function hideSettings() {
  const el = document.getElementById('settingsPanel');
  if (el) el.classList.add('hidden');
}

function resetMonthlyCounters() {
  if (!confirm('Reset all API usage counters?')) return;
  const key = 'hb_usage_' + new Date().toISOString().slice(0,7);
  localStorage.removeItem(key);
  showSettings();
}

function init() {
  try {
    const t = localStorage.getItem('hb_theme');
    if (t === 'light') document.body.classList.add('light-mode');
  } catch {}

  populateProviderDropdown();
  updateUsagePill();

  const saved = window.loadFilters ? window.loadFilters() : null;
  if (saved) {
    Object.entries(saved).forEach(([k,v]) => {
      const el = document.getElementById('f_'+k);
      if (el && v) el.value = v;
    });
  }

  const sort = saved ? saved.sort : 'newest';
  document.querySelectorAll('.quick-sort').forEach(b => b.classList.toggle('active', b.dataset.sort===sort));

  if (providerSelect) providerSelect.addEventListener('change', updateUsagePill);
}

document.addEventListener('DOMContentLoaded', init);
