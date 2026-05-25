// ═══════════════════════════════════════════════════════════════
//  config.js  –  HomeBase
// ═══════════════════════════════════════════════════════════════

// Tiers: which providers belong in which layer
window.PROVIDER_TIERS = {
  tier1: ['realtorOpen','realtorScraper','zllwWorking'],
  tier2: ['realfinUS','redfinComData','redfinBase','redfinRealtime','realEstateUS','zillowAlt'],
  tier3: ['realtorApi','zillwRealtime','rentcast'],
};

// Providers
window.PROVIDERS = {
  realtorOpen: {
    id:           'realtorOpen',
    label:        'Realtor.com Open',
    tier:         1,
    enabled:      true,
    manualOnly:   false,
    maxFreeCalls: 3000,
    apiKey:       '3ebf15a882mshff3d94a00febef5p127044jsn52e52d74a11d',
    apiHost:      'realtor-com4.p.rapidapi.com',
    searchUrl:    'https://realtor-com4.p.rapidapi.com/for-sale/list',
  },
  realtorScraper: {
    id:           'realtorScraper',
    label:        'Realtor.com Scraper',
    tier:         1,
    enabled:      true,
    manualOnly:   false,
    maxFreeCalls: 500,
    apiKey:       '3ebf15a882mshff3d94a00febef5p127044jsn52e52d74a11d',
    apiHost:      'realtor-com-scraper.p.rapidapi.com',
    searchUrl:    'https://realtor-com-scraper.p.rapidapi.com/for-sale/list',
  },
  zllwWorking: {
    id:           'zllwWorking',
    label:        'ZLLW Working API',
    tier:         1,
    enabled:      true,
    manualOnly:   false,
    maxFreeCalls: 500,
    apiKey:       '3ebf15a882mshff3d94a00febef5p127044jsn52e52d74a11d',
    apiHost:      'zllw-working-api.p.rapidapi.com',
    searchUrl:    'https://zllw-working-api.p.rapidapi.com/search',
  },
  realfinUS: {
    id:           'realfinUS',
    label:        'Realfin US',
    tier:         2,
    enabled:      true,
    manualOnly:   false,
    maxFreeCalls: 110,
    apiKey:       '3ebf15a882mshff3d94a00febef5p127044jsn52e52d74a11d',
    apiHost:      'realfin-us.p.rapidapi.com',
    searchUrl:    'https://realfin-us.p.rapidapi.com/for-sale/list',
  },
  redfinComData: {
    id:           'redfinComData',
    label:        'Redfin.com Data',
    tier:         2,
    enabled:      true,
    manualOnly:   false,
    maxFreeCalls: 100,
    apiKey:       '3ebf15a882mshff3d94a00febef5p127044jsn52e52d74a11d',
    apiHost:      'redfin-com-data-api.p.rapidapi.com',
    searchUrl:    'https://redfin-com-data-api.p.rapidapi.com/search/for-sale',
  },
  redfinBase: {
    id:           'redfinBase',
    label:        'Redfin Base',
    tier:         2,
    enabled:      true,
    manualOnly:   false,
    maxFreeCalls: 100,
    apiKey:       '3ebf15a882mshff3d94a00febef5p127044jsn52e52d74a11d',
    apiHost:      'redfin-base.p.rapidapi.com',
    searchUrl:    'https://redfin-base.p.rapidapi.com/for-sale',
  },
  redfinRealtime: {
    id:           'redfinRealtime',
    label:        'Real-Time Redfin Data',
    tier:         2,
    enabled:      true,
    manualOnly:   false,
    maxFreeCalls: 100,
    apiKey:       '3ebf15a882mshff3d94a00febef5p127044jsn52e52d74a11d',
    apiHost:      'real-time-redfin-data.p.rapidapi.com',
    searchUrl:    'https://real-time-redfin-data.p.rapidapi.com/search',
  },
  realEstateUS: {
    id:           'realEstateUS',
    label:        'Real Estate US',
    tier:         2,
    enabled:      true,
    manualOnly:   false,
    maxFreeCalls: 100,
    apiKey:       '3ebf15a882mshff3d94a00febef5p127044jsn52e52d74a11d',
    apiHost:      'us-real-estate.p.rapidapi.com',
    searchUrl:    'https://us-real-estate.p.rapidapi.com/for-sale',
  },
  realtorApi: {
    id:           'realtorApi',
    label:        'Realtor (Deep Check)',
    tier:         3,
    enabled:      true,
    manualOnly:   true,
    maxFreeCalls: 30,
    apiKey:       '3ebf15a882mshff3d94a00febef5p127044jsn52e52d74a11d',
    apiHost:      'realty-in-us.p.rapidapi.com',
    searchUrl:    'https://realty-in-us.p.rapidapi.com/properties/v3/list',
  },
  zillwRealtime: {
    id:           'zillwRealtime',
    label:        'Zillw Realtime (Deep Check)',
    tier:         3,
    enabled:      true,
    manualOnly:   true,
    maxFreeCalls: 4,
    apiKey:       '3ebf15a882mshff3d94a00febef5p127044jsn52e52d74a11d',
    apiHost:      'zillw-realtime-scraper.p.rapidapi.com',
    searchUrl:    'https://zillw-realtime-scraper.p.rapidapi.com/search',
  },
  rentcast: {
    id:           'rentcast',
    label:        'RentCast (Accuracy Pass)',
    tier:         3,
    enabled:      true,
    manualOnly:   true,
    maxFreeCalls: 50,
    alertAt:      25,
    apiKey:       'a840a7bccd684ae3b22cc72667ccc9ac',
    searchUrl:    'https://api.rentcast.io/v1/listings/sale',
  },
  zillowAlt: {
    id:           'zillowAlt',
    label:        'Zillow Real-Time (OpenWeb)',
    tier:         2,
    enabled:      true,
    manualOnly:   false,
    maxFreeCalls: 250,
    apiKey:       'ak_5nvbjic82j5863g02k76aj5f7bi333ao5fz0uc3aahumc3m',
    searchUrl:    'https://api.openwebninja.com/v1/zillow/search',
  },
};

// Monthly usage tracking
window.getUsage = (id) => {
  try {
    const key = 'hb_usage_' + new Date().toISOString().slice(0,7);
    const s = JSON.parse(localStorage.getItem(key) || '{}');
    return s[id] || 0;
  } catch { return 0; }
};

window.bumpUsage = (id) => {
  try {
    const key = 'hb_usage_' + new Date().toISOString().slice(0,7);
    const s = JSON.parse(localStorage.getItem(key) || '{}');
    s[id] = (s[id] || 0) + 1;
    localStorage.setItem(key, JSON.stringify(s));
    const p = window.PROVIDERS[id];
    if (p && p.alertAt) {
      const notifyKey = 'hb_alert_' + id + '_' + new Date().toISOString().slice(0,7);
      const alerted = localStorage.getItem(notifyKey);
      if (s[id] >= p.alertAt && !alerted) {
        localStorage.setItem(notifyKey, '1');
        showRentcastAlert(s[id], p.maxFreeCalls);
      }
    }
  } catch {}
};

window.canUseProvider = (id) => {
  try {
    const p = window.PROVIDERS[id];
    if (!p) return false;
    if (!isFinite(p.maxFreeCalls)) return true;
    return window.getUsage(id) < p.maxFreeCalls;
  } catch { return false; }
};

function showRentcastAlert(used, max) {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.65);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(6px)';
  const box = document.createElement('div');
  box.style.cssText = 'background:var(--bg-card);border-radius:16px;padding:28px 24px;max-width:380px;width:90%;text-align:center;box-shadow:0 40px 80px rgba(0,0,0,.5)';
  box.innerHTML = `
    <div style="font-size:36px;margin-bottom:12px">⚠️</div>
    <div style="font-size:17px;font-weight:800;margin-bottom:8px">RentCast usage alert</div>
    <div style="font-size:14px;color:var(--muted);margin-bottom:18px;line-height:1.5">
      You've used <strong>${used} of ${max}</strong> RentCast calls this month.<br>
      Switch to the combined free sources for routine searches and save RentCast for final accuracy checks.
    </div>
    <button onclick="this.closest('[style]').remove()" style="background:var(--accent);color:var(--accent-text);border:none;padding:10px 24px;border-radius:999px;font-weight:700;cursor:pointer;font-size:14px">Got it</button>
  `;
  overlay.appendChild(box);
  document.body.appendChild(overlay);
}

// Saved listings
window.getSaved = () => {
  try { return JSON.parse(localStorage.getItem('hb_saved') || '[]'); } catch { return []; }
};
window.setSaved = (arr) => {
  try { localStorage.setItem('hb_saved', JSON.stringify(arr)); } catch {}
};
window.toggleSaved = (listing) => {
  const arr = window.getSaved();
  const idx = arr.findIndex(l => l.id === listing.id);
  if (idx === -1) { arr.push(listing); } else { arr.splice(idx, 1); }
  window.setSaved(arr);
  return idx === -1;
};
window.isSaved = (id) => window.getSaved().some(l => l.id === id);

// Saved filters
window.saveFilters = (f) => {
  try { localStorage.setItem('hb_filters', JSON.stringify(f)); } catch {}
};
window.loadFilters = () => {
  try { return JSON.parse(localStorage.getItem('hb_filters') || 'null'); } catch { return null; }
};
