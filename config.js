// ═══════════════════════════════════════════════════════════════
//  config.js  –  HomeBase
//  Add your API keys here. Keep this file private.
//  Never push real keys to a public GitHub repo.
// ═══════════════════════════════════════════════════════════════

window.PROVIDERS = {

  // ── Sample (offline, no keys needed) ────────────────────────
  sample: {
    id:           'sample',
    label:        'Sample data (offline)',
    enabled:      true,
    maxFreeCalls: Infinity,
    note:         'No API calls. Good for testing the UI.',
  },

  // ── RentCast (direct API) ────────────────────────────────────
  // Sign up at: https://www.rentcast.io/api
  // 50 free calls / month on Developer plan
  rentcast: {
    id:           'rentcast',
    label:        'RentCast',
    enabled:      false,
    maxFreeCalls: 50,
    apiKey:       'YOUR_RENTCAST_KEY',
    // Listings search endpoint (check their docs for exact URL)
    searchUrl:    'https://api.rentcast.io/v1/listings/sale',
  },

  // ── Realty in US (Realtor.com data via RapidAPI) ─────────────
  // Subscribe at: https://rapidapi.com/apidojo/api/realty-in-us
  realtyUS: {
    id:           'realtyUS',
    label:        'Realty in US (RapidAPI)',
    enabled:      false,
    maxFreeCalls: 500,
    apiKey:       'YOUR_RAPIDAPI_KEY',
    apiHost:      'realty-in-us.p.rapidapi.com',
    searchUrl:    'https://realty-in-us.p.rapidapi.com/properties/v3/list',
  },

  // ── US Real Estate Listings (APImaker via RapidAPI) ──────────
  // Subscribe at: https://rapidapi.com/apimaker/api/us-real-estate-listings
  usListings: {
    id:           'usListings',
    label:        'US Real Estate (RapidAPI)',
    enabled:      false,
    maxFreeCalls: 500,
    apiKey:       'YOUR_RAPIDAPI_KEY',
    apiHost:      'us-real-estate-listings.p.rapidapi.com',
    searchUrl:    'https://us-real-estate-listings.p.rapidapi.com/list',
  },

  // ── OpenWeb Ninja – Real-Time Zillow Data ────────────────────
  // Sign up at: https://www.openwebninja.com/api/real-time-zillow-data
  zillowAlt: {
    id:           'zillowAlt',
    label:        'Zillow-style (OpenWeb Ninja)',
    enabled:      false,
    maxFreeCalls: 250,
    apiKey:       'YOUR_OPENWEB_NINJA_KEY',
    searchUrl:    'https://YOUR_OPENWEB_NINJA_ENDPOINT',
  },
};

// ── Usage counter (localStorage) ────────────────────────────────
window.getUsage = (id) => {
  try {
    const s = JSON.parse(localStorage.getItem('hb_usage') || '{}');
    return s[id] || 0;
  } catch { return 0; }
};

window.bumpUsage = (id) => {
  try {
    const s = JSON.parse(localStorage.getItem('hb_usage') || '{}');
    s[id] = (s[id] || 0) + 1;
    localStorage.setItem('hb_usage', JSON.stringify(s));
  } catch { /* ignore */ }
};

// ── Saved listings (localStorage) ───────────────────────────────
window.getSaved = () => {
  try { return JSON.parse(localStorage.getItem('hb_saved') || '[]'); }
  catch { return []; }
};

window.setSaved = (arr) => {
  try { localStorage.setItem('hb_saved', JSON.stringify(arr)); }
  catch { /* ignore */ }
};

window.toggleSaved = (listing) => {
  const arr = window.getSaved();
  const idx = arr.findIndex(l => l.id === listing.id);
  if (idx === -1) {
    arr.push(listing);
  } else {
    arr.splice(idx, 1);
  }
  window.setSaved(arr);
  return idx === -1; // true = now saved
};

window.isSaved = (id) => window.getSaved().some(l => l.id === id);

// ── Saved filters (localStorage) ────────────────────────────────
window.saveFilters = (filters) => {
  try { localStorage.setItem('hb_filters', JSON.stringify(filters)); }
  catch { /* ignore */ }
};

window.loadFilters = () => {
  try { return JSON.parse(localStorage.getItem('hb_filters') || 'null'); }
  catch { return null; }
};

// ── Notes per listing ────────────────────────────────────────────
window.getNote = (id) => {
  try {
    const n = JSON.parse(localStorage.getItem('hb_notes') || '{}');
    return n[id] || '';
  } catch { return ''; }
};

window.setNote = (id, text) => {
  try {
    const n = JSON.parse(localStorage.getItem('hb_notes') || '{}');
    n[id] = text;
    localStorage.setItem('hb_notes', JSON.stringify(n));
  } catch { /* ignore */ }
};
